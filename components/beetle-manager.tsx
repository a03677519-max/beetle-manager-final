"use client";

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Search, Clipboard, Camera, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Modal } from "./ui/modal";
import { useSwitchBot } from "@/components/use-switchbot";
import { formatGeneration, today } from "@/lib/utils";
import { pushDataToGitHub } from "@/lib/github";
import {
  emptyAdultForm,
  emptyLarvaForm,
  emptySpawnSetForm,
  useBeetleStore,
} from "@/store/use-beetle-store";
import type {
  BeetleEntry,
  EntryType,
  LarvaBeetle,
} from "@/types/beetle";
import { ENTRY_TYPES } from "@/types/beetle";

import { AdultForm } from "./beetle/adult/adult-form";
import { LarvaForm } from "./beetle/larva/larva-form";
import { SpawnSetForm } from "./beetle/spawn-set/spawn-set-form";
import { EntryCard } from "./beetle/shared/entry-card";
import { EmptyState } from "./beetle/shared/empty-state";
import { EntryDetail } from "./beetle/shared/entry-detail";
import { AnalysisView } from "./beetle/features/analysis-view";
import { TaskView } from "./beetle/features/task-view";

export function BeetleManager() {
  const entries = useBeetleStore((state) => state.entries);
  const selectedType = useBeetleStore((state) => state.selectedType);
  const setSelectedType = useBeetleStore((state) => state.setSelectedType);
  const editingId = useBeetleStore((state) => state.editingId);
  const startEditing = useBeetleStore((state) => state.startEditing);
  const addAdult = useBeetleStore((state) => state.addAdult);
  const updateAdult = useBeetleStore((state) => state.updateAdult);
  const addLarva = useBeetleStore((state) => state.addLarva);
  const updateLarva = useBeetleStore((state) => state.updateLarva);
  const addSpawnSet = useBeetleStore((state) => state.addSpawnSet);
  const updateSpawnSet = useBeetleStore((state) => state.updateSpawnSet);
  const addLarvaLog = useBeetleStore((state) => state.addLarvaLog);
  const deleteEntry = useBeetleStore((state) => state.deleteEntry);
  const importData = useBeetleStore((state) => state.importData);
  const switchBot = useBeetleStore((state) => state.switchBot);
  const gitHub = useBeetleStore((state) => state.gitHub);
  const { fetchTemperature, isFetching } = useSwitchBot();

  const [selectedEntry, setSelectedEntry] = useState<BeetleEntry | null>(null);
  const [activeTab, setActiveTab] = useState("ホーム");
  const [query, setQuery] = useState("");
  const [createType, setCreateType] = useState<EntryType>("幼虫");
  const [pastedData, setPastedData] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [isAutoFillEnabled, setIsAutoFillEnabled] = useState(false);
  const [taskSortType, setTaskSortType] = useState<"urgency" | "type">("urgency");
  const [skippedTaskIds, setSkippedTaskIds] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isPersisted, setIsPersisted] = useState(false);

  // マウント時に localStorage からデータを読み込む
  useEffect(() => {
    const saved = localStorage.getItem("skippedTaskIds");
    if (saved) {
      try {
        setSkippedTaskIds(JSON.parse(saved));
      } catch {}
    }
    setIsMounted(true);

    if (typeof window !== "undefined" && navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then(setIsPersisted);
    }
  }, []);

  // スキップ状態が更新されるたびに localStorage に保存する
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("skippedTaskIds", JSON.stringify(skippedTaskIds));
    }
  }, [skippedTaskIds, isMounted]);

  const requestPersistence = async () => {
    if (typeof window !== "undefined" && navigator.storage && navigator.storage.persist) {
      const persisted = await navigator.storage.persist();
      setIsPersisted(persisted);
      if (persisted) {
        window.alert("データ保護（永続化ストレージ）が有効になりました。ブラウザによる自動削除を防ぎます。");
      } else {
        window.alert("データ保護を有効にできませんでした。ホーム画面に追加（PWAインストール）してから再度お試しください。");
      }
    }
  };

  const editingEntry = entries.find((entry) => entry.id === editingId) ?? null;

  const stats = useMemo(() => ({
    adults: entries.filter(e => e.type === "成虫").length,
    larvae: entries.filter(e => e.type === "幼虫").length,
    spawnSets: entries.filter(e => e.type === "産卵セット").length,
  }), [entries]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesType = selectedType === "すべて" || entry.type === selectedType;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [entry.japaneseName, entry.scientificName, entry.locality, formatGeneration(entry.generation), entry.managementName]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesType && matchesQuery;
    }).sort((a, b) => {
      // 管理名がある場合は管理名、なければ和名でソート
      const nameA = a.managementName || a.japaneseName;
      const nameB = b.managementName || b.japaneseName;
      return nameA.localeCompare(nameB, "ja", { numeric: true });
    });
  }, [entries, query, selectedType]);

  const fetchCurrentTemperature = async (setter: (value: string) => void) => {
    try {
      const value = await fetchTemperature(switchBot.token, switchBot.secret, switchBot.deviceId);
      setter(String(value));
    } catch {
      window.alert("SwitchBot温度を取得できませんでした。");
    }
  };

  const handleQuickExchange = (e: React.MouseEvent, entry: LarvaBeetle) => {
    e.stopPropagation();
    const latestLog = entry.logs[0];
    addLarvaLog(entry.id, {
      date: today(),
      substrate: latestLog?.substrate ?? "",
      pressure: latestLog?.pressure ?? 3,
      moisture: latestLog?.moisture ?? 3,
      bottleSize: latestLog?.bottleSize ?? "",
      stage: latestLog?.stage ?? "L1",
      weight: latestLog?.weight ?? 0,
      gender: latestLog?.gender ?? "不明",
      temperature: latestLog?.temperature ?? "",
    });
  };

  const handlePromoteToAdult = (e: React.MouseEvent, entry: LarvaBeetle) => {
    e.stopPropagation();
    const confirm = window.confirm(`${entry.japaneseName}を成虫として登録し、幼虫データを移行しますか？`);
    if (!confirm) return;

    addAdult({
      type: "成虫",
      managementName: entry.managementName,
      gender: "不明",
      japaneseName: entry.japaneseName,
      scientificName: entry.scientificName,
      locality: entry.locality,
      generation: entry.generation,
      linkedEntryId: entry.linkedEntryId,
      photos: entry.photos, // 写真を引き継ぐ
      emergenceDate: entry.actualEmergenceDate || today(),
      emergenceType: entry.emergenceType || "羽化",
      feedingDate: "",
      deathDate: "",
      larvaMemo: entry.logs.length > 0 ? `幼虫時ログ: ${entry.logs.length}件。最終体重: ${entry.logs[0].weight}g` : "幼虫データより移行",
    });
    deleteEntry(entry.id);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (entries.length > 0 && !window.confirm("既存のデータが上書きされます。よろしいですか？")) {
      event.target.value = "";
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      const data = parsed.entries ?? parsed.beetles;
      if (!data || !Array.isArray(data)) throw new Error("Invalid format");
      importData(data);
    } catch {
      window.alert("バックアップファイルを読み込めませんでした。");
    } finally {
      event.target.value = "";
    }
  };

  const handleExport = () => {
    const payload = { version: 2, exportedAt: new Date().toISOString(), entries, switchBot };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `beetle-backup-${today()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGitHubSync = async () => {
    if (!gitHub.token || !gitHub.repo) {
      window.alert("GitHub設定（トークンとリポジトリ名）が未完了です。");
      return;
    }

    const confirmSync = window.confirm(
      "現在のローカルデータをGitHubにバックアップ（上書き）します。よろしいですか？"
    );
    if (!confirmSync) return;

    setIsSyncing(true);
    try {
      const payload = { version: 2, exportedAt: new Date().toISOString(), entries };
      const success = await pushDataToGitHub(gitHub, payload);
      if (success) {
        window.alert("GitHubへのデータ同期が完了しました。");
      } else {
        throw new Error("Sync failed");
      }
    } catch {
      window.alert("GitHubへの同期に失敗しました。設定を確認してください。");
    } finally {
      setIsSyncing(false);
    }
  };

  const getInitialValues = (type: EntryType, emptyForm: any) => {
    if (!isAutoFillEnabled) return emptyForm;
    const last = [...entries].reverse().find((e) => e.type === type);
    if (!last) return emptyForm;

    const base = {
      ...emptyForm,
      japaneseName: last.japaneseName,
      scientificName: last.scientificName,
      locality: last.locality,
      generation: { ...last.generation },
      linkedEntryId: last.linkedEntryId,
    };

    if (type === "成虫") {
      const l = last as any;
      return { ...base, gender: l.gender, emergenceType: l.emergenceType };
    }
    if (type === "幼虫") {
      const l = last as any;
      const lastLog = l.logs?.[0];
      return {
        ...base,
        logs: lastLog ? [{
          ...lastLog,
          id: "temp-id",
          date: today(),
          weight: 0, // LarvaLogの定義に合わせて数値型を維持
        }] : base.logs
      };
    }
    if (type === "産卵セット") {
      const l = last as any;
      return {
        ...base,
        substrate: l.substrate,
        containerSize: l.containerSize,
        pressure: l.pressure,
        moisture: l.moisture,
        temperature: l.temperature,
        cohabitation: l.cohabitation,
      };
    }
    return base;
  };

  const parsePastedText = (text: string) => {
    // 日付の揺らぎ（2024.01.01 や 2024 01 01、誤字など）を補正する
    const fixOcrDate = (d: string) => {
      if (!d) return "";
      // OCRでよくある誤認識（O→0, I/l→1）を置換し、数字以外の区切りをハイフンに統一
      const clean = d.replace(/[Oo]/g, "0").replace(/[I|il]/g, "1").replace(/[^0-9]/g, "-").replace(/-+/g, "-");
      const match = clean.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (match) {
        return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
      }
      return "";
    };

    const lines = text.split('\n');
    const patch: any = { type: "幼虫", logs: [] };
    lines.forEach((line, i) => {
      const l = line.trim();
        if (!l && i !== 4) return; // 5行目(index 4)は空行なので無視しない

        if (i === 0) patch.japaneseName = l.replace(/^(和名|和各)\s*/, ""); // 和名または和各を認識
        if (i === 1) patch.scientificName = l.replace(/^学名\s*/, ""); // 学名 (例: 学各などの誤認識があれば /^(学名|学各)\s*/ のように追加)
        if (i === 2) patch.locality = l.replace(/^産地\s*/, ""); // 産地
        if (i === 3) {
          const parts = l.replace(/^累代\s*/, "").split(/\s+/); // 累代
          // 累代ラベルの解析
          const genStr = parts[0] || "";
          let primary: any = "-";
          let count = "";
          if (genStr.startsWith("CB")) { primary = "CB"; count = genStr.replace("CB", ""); }
          else if (genStr.startsWith("WF")) { primary = "WF"; count = genStr.replace("WF", ""); }
          else if (genStr.startsWith("F")) { primary = "F"; count = genStr.replace("F", ""); }
          else if (genStr === "WD") { primary = "WD"; count = ""; }
          patch.generation = { primary, secondary: "-", count };
          
          if (parts[1]) patch.managementName = parts[1];
          // parts[2]以降に日付があるか、あるいは行の末尾から日付を探す
          const dateCandidate = parts.find(p => p.match(/\d/));
          if (dateCandidate && patch.type === "幼虫") {
            patch.hatchDate = fixOcrDate(dateCandidate);
          }
        }

        // 6-9行目: 飼育ログ
        if (i >= 5 && i <= 8 && l !== "") {
          const logMatch = l.match(/^(\d{4}[^\d]\d{1,2}[^\d]\d{1,2})\s+(.*?)\s+水(\d+)圧(\d+)\s+(.*?)\s+(\S+)\s+(\S+)$/);
          if (logMatch) {
            patch.logs.push({
              id: Math.random().toString(36).substr(2, 9),
              date: fixOcrDate(logMatch[1]),
              substrate: logMatch[2],
              moisture: parseInt(logMatch[3]),
              pressure: parseInt(logMatch[4]),
              bottleSize: logMatch[5],
              stage: logMatch[6],
              gender: logMatch[7],
              weight: 0,
              temperature: ""
            });
          }
        }

        // 10行目: 羽化・掘り出し / 後食
        if (i === 9) {
          const eDateMatch = l.match(/^(\d{4}[^\d]\d{1,2}[^\d]\d{1,2})\s+(羽化|掘り出し)/);
          if (eDateMatch) {
            patch.actualEmergenceDate = fixOcrDate(eDateMatch[1]);
            patch.emergenceType = eDateMatch[2];
            patch.type = "幼虫";
          }
          const fDateMatch = l.match(/(\d{4}[^\d]\d{1,2}[^\d]\d{1,2})\s+後食/);
          if (fDateMatch) {
            patch.feedingDate = fixOcrDate(fDateMatch[1]);
            patch.type = "成虫";
            patch.emergenceDate = patch.actualEmergenceDate || "";
          }
        }
      });
    return patch;
  };

  const handlePasteAndFill = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const patch = parsePastedText(text);
      setPastedData(patch);
      if (patch.type) setCreateType(patch.type);
      window.alert("クリップボードからデータを反映しました");
    } catch (err) {
      window.alert("ペーストに失敗しました。クリップボードへのアクセスを許可してください。");
    }
  };

  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas context not available");

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 平均輝度を計算して、背景が暗い場合に反転が必要か判断
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          totalBrightness += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        }
        const avgBrightness = totalBrightness / (data.length / 4);
        const shouldInvert = avgBrightness < 120; // 閾値より暗ければ反転フラグを立てる

        const contrast = 2.0; // コントラスト強調係数
        const intercept = 128 * (1 - contrast);

        for (let i = 0; i < data.length; i += 4) {
          // グレースケール化
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          
          // コントラスト調整
          let v = contrast * gray + intercept;
          v = Math.min(255, Math.max(0, v));

          // 白黒反転（ライトオンダークのラベル対策）
          if (shouldInvert) v = 255 - v;

          data[i] = data[i + 1] = data[i + 2] = v;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleCameraOCR = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOcrProcessing(true);
    try {
      // 画像の前処理を実行してOCR用画像を生成
      const processedImageUrl = await preprocessImage(file);

      // Tesseract.jsを動的インポート
      // @ts-ignore - モジュール未インストール時のビルドエラーを抑制
      const Tesseract = (await import('tesseract.js')).default;
      const { data: { text } } = await Tesseract.recognize(processedImageUrl, 'jpn+eng');
      
      const patch = parsePastedText(text);
      setPastedData(patch);
      if (patch.type) setCreateType(patch.type);
      window.alert("画像から文字を読み取り、データを反映しました");
    } catch (err) {
      console.error(err);
      window.alert("文字の読み取りに失敗しました。tesseract.jsがインストールされているか確認してください。");
    } finally {
      setIsOcrProcessing(false);
      if (event.target) event.target.value = "";
    }
  };

  return (
    <div className="app-container font-cute bg-gradient-to-br from-[#F8F9FA] to-[#E9ECEF] min-h-screen pb-[calc(140px+env(safe-area-inset-bottom,32px))] leading-[1.7]">
      <header className="px-6 pt-8 pb-4 flex justify-between items-end">
        <div>
          <p className="text-[14px] font-bold text-[#8B5A2B] uppercase tracking-widest mb-1.5">Breeding Log</p>
          <h1 className="text-3xl font-black text-[#212529] tracking-tight">マイブリード</h1>
        </div>
      </header>

      {/* 統計ダッシュボード */}
      <section className="px-6 mb-6 grid grid-cols-3 gap-3">
        <div className="bg-white/40 backdrop-blur-sm p-3 rounded-2xl border border-white/60 shadow-sm">
          <p className="text-[12px] font-black text-[#8B5A2B] uppercase tracking-tighter opacity-70">成虫</p>
          <p className="text-3xl font-black text-[#212529]">{stats.adults}<span className="text-[12px] ml-0.5 font-bold">頭</span></p>
        </div>
        <div className="bg-white/40 backdrop-blur-sm p-3 rounded-2xl border border-white/60 shadow-sm">
          <p className="text-[12px] font-black text-[#8B5A2B] uppercase tracking-tighter opacity-70">幼虫</p>
          <p className="text-3xl font-black text-[#212529]">{stats.larvae}<span className="text-[12px] ml-0.5 font-bold">頭</span></p>
        </div>
        <div className="bg-white/40 backdrop-blur-sm p-3 rounded-2xl border border-white/60 shadow-sm">
          <p className="text-[12px] font-black text-[#8B5A2B] uppercase tracking-tighter opacity-70">セット</p>
          <p className="text-3xl font-black text-[#212529]">{stats.spawnSets}<span className="text-[12px] ml-0.5 font-bold">件</span></p>
        </div>
      </section>

      <section className="px-6 mb-8 sticky top-0 z-30 bg-white/20 backdrop-blur-md py-2">
        <label className="flex items-center bg-white/70 backdrop-blur-md rounded-2xl px-5 py-4 shadow-sm border border-white/40 focus-within:border-[#2D5A27] transition-all">
          <Search size={18} className="text-[#6C757D] mr-3" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="個体名・学名・産地で検索"
            className="flex-1 text-[18px] text-[#212529] outline-none bg-transparent"
          />
        </label>
        <div className="flex gap-2.5 mt-4 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            className={`px-5 py-2 rounded-full text-[14px] font-bold transition-all whitespace-nowrap ${
              selectedType === "すべて" ? "bg-[#2D5A27] text-white shadow-md" : "bg-white/40 backdrop-blur-sm text-[#6C757D] border border-white/40"
            }`}
            onClick={() => setSelectedType("すべて")}
          >
            すべて
          </button>
          {ENTRY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`px-5 py-2 rounded-full text-[14px] font-bold transition-all whitespace-nowrap ${
                selectedType === type ? "bg-[#2D5A27] text-white shadow-md" : "bg-white/40 backdrop-blur-sm text-[#6C757D] border border-white/40"
              }`}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      <Modal
        isOpen={isCreating || !!editingEntry}
        onClose={() => {
          setIsCreating(false);
          startEditing(null);
          setPastedData(null);
        }}
        title={editingEntry ? "編集" : "新規登録"}
      >
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md -mx-6 px-6 pt-2 pb-4 border-b border-gray-100 mb-6">
          <div className="flex flex-col gap-3 mb-3">
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePasteAndFill}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl shadow-sm text-[10px] font-black text-[#2D5A27] active:scale-95 transition-all"
              >
                <Clipboard size={12} />
                貼付
              </button>
              <label 
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl shadow-sm text-[10px] font-black text-[#2D5A27] active:scale-95 transition-all cursor-pointer ${isOcrProcessing ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {isOcrProcessing ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                カメラで読み取り
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  hidden 
                  onChange={handleCameraOCR} 
                  disabled={isOcrProcessing} 
                />
              </label>
            </div>
            <div className="text-[10px] font-black text-[#8B5A2B] block tracking-widest uppercase">Select Type</div>
            {!editingEntry && (
              <label className="flex items-center gap-2 cursor-pointer group">
                <span className={`text-[10px] font-bold transition-colors ${isAutoFillEnabled ? 'text-[#2D5A27]' : 'text-gray-400'} uppercase tracking-tighter`}>前回入力を自動反映</span>
                <div 
                  onClick={() => setIsAutoFillEnabled(!isAutoFillEnabled)}
                  className={`w-8 h-4 rounded-full transition-colors relative border ${isAutoFillEnabled ? 'bg-[#2D5A27] border-[#2D5A27]' : 'bg-gray-100 border-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all shadow-sm ${isAutoFillEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
              </label>
            )}
          </div>
          <div className="flex bg-gray-50 shadow-inner rounded-xl p-1 gap-1">
          {ENTRY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              data-ignore-click-outside="true"
              style={{ width: `${100 / ENTRY_TYPES.length}%` }}
              className={`py-2 text-sm font-bold rounded-lg transition-all select-none ${
                createType === type ? "bg-[#2D5A27] text-white shadow-sm" : "text-gray-500"
              }`}
              onClick={() => {
                setCreateType(type);
                if (!editingEntry) return;
                setPastedData(null);
                startEditing(null);
                setIsCreating(true);
              }}
            >
              {type}
            </button>
          ))}
          </div>
        </div>

        {isCreating && !editingEntry && createType === "成虫" ? (
          <AdultForm
            initialValues={pastedData && pastedData.type === "成虫" ? { ...emptyAdultForm, ...pastedData } : getInitialValues("成虫", emptyAdultForm)}
            onSubmit={(value) => {
              addAdult(value);
              setIsCreating(false);
            }}
            onCancel={() => setIsCreating(false)}
          />
        ) : null}
        {isCreating && !editingEntry && createType === "幼虫" ? (
          <LarvaForm
            initialValues={pastedData && pastedData.type === "幼虫" ? { ...emptyLarvaForm, ...pastedData } : getInitialValues("幼虫", emptyLarvaForm)}
            allEntries={entries}
            onSubmit={(values) => {
              const count = 1;
              for (let index = 0; index < count; index += 1) {
                const suffix = count > 1 ? `-${String(index + 1).padStart(2, "0")}` : "";
                addLarva({ ...values, japaneseName: `${values.japaneseName}${suffix}` });
              }
              setIsCreating(false);
            }}
            onCancel={() => setIsCreating(false)}
          />
        ) : null}
        {isCreating && !editingEntry && createType === "産卵セット" ? (
          <SpawnSetForm
            initialValues={getInitialValues("産卵セット", emptySpawnSetForm)}
            allEntries={entries}
            onSubmit={(value) => {
              addSpawnSet(value);
              setIsCreating(false);
            }}
            onCancel={() => setIsCreating(false)}
            onFetchTemperature={fetchCurrentTemperature}
            isFetchingTemperature={isFetching}
          />
        ) : null}

        {editingEntry?.type === "成虫" ? (
          <AdultForm
            initialValues={editingEntry}
            onSubmit={(value) => {
              updateAdult(editingEntry.id, value);
              startEditing(null);
            }}
            onCancel={() => startEditing(null)}
          />
        ) : null}
        {editingEntry?.type === "幼虫" ? (
          <LarvaForm
            initialValues={editingEntry}
            allEntries={entries}
            onSubmit={(value) => {
              updateLarva(editingEntry.id, value);
              startEditing(null);
            }}
            onCancel={() => startEditing(null)}
          />
        ) : null}
        {editingEntry?.type === "産卵セット" ? (
          <SpawnSetForm
            initialValues={editingEntry}
            allEntries={entries}
            onSubmit={(value) => {
              updateSpawnSet(editingEntry.id, value);
              startEditing(null);
            }}
            onCancel={() => startEditing(null)}
            onFetchTemperature={fetchCurrentTemperature}
            isFetchingTemperature={isFetching}
          />
        ) : null}
      </Modal>

      <section className="px-6">
        {activeTab === "ホーム" || ENTRY_TYPES.includes(activeTab as EntryType) ? (
          filteredEntries.length === 0 ? (
            <EmptyState />
          ) : (
            filteredEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onOpen={setSelectedEntry}
                onDelete={(e, id) => {
                  e.stopPropagation();
                  if (window.confirm("本当に削除しますか？")) {
                    deleteEntry(id);
                  }
                }}
              />
            ))
          )
        ) : activeTab === "分析" ? (
          <AnalysisView
            entries={entries}
            setSelectedEntry={setSelectedEntry}
            setSelectedType={setSelectedType}
            setActiveTab={setActiveTab}
            handleExport={handleExport}
            handleImport={handleImport}
            isPersisted={isPersisted}
            requestPersistence={requestPersistence}
            handleSync={handleGitHubSync}
            isSyncing={isSyncing}
          />
        ) : activeTab === "タスク" ? (
          <TaskView
            entries={entries}
            skippedTaskIds={skippedTaskIds}
            setSkippedTaskIds={setSkippedTaskIds}
            taskSortType={taskSortType}
            setTaskSortType={setTaskSortType}
            setSelectedEntry={setSelectedEntry}
            handleQuickExchange={handleQuickExchange}
            handlePromoteToAdult={handlePromoteToAdult}
          />
        ) : null}
      </section>

      <AnimatePresence>
        {selectedEntry && (
          <EntryDetail
            entry={entries.find((item) => item.id === selectedEntry.id) ?? selectedEntry}
            onClose={() => setSelectedEntry(null)}
            onFetchTemperature={fetchCurrentTemperature}
            isFetchingTemperature={isFetching}
          />
        )}
      </AnimatePresence>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTabChange={(tab) => {
          if (ENTRY_TYPES.includes(tab as EntryType)) setSelectedType(tab as EntryType);
        }}
        onAdd={() => setIsCreating(true)}
      />
    </div>
  );
}
