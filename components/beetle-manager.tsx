"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Search, Clipboard, Camera, Loader2, Crop, Check, X as CloseIcon, Trash2, Edit, CheckSquare, Square, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
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
  
  // クロップ用のステート
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isCropping, setIsCropping] = useState(false);
  const cropImageRef = useRef<HTMLImageElement>(null);

  const handleCropComplete = async () => {
    if (!cropImageRef.current || !cropSrc) return;
    
    const canvas = document.createElement("canvas");
    const img = cropImageRef.current;
    
    // 表示サイズと実際の画像サイズの比率を計算
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    
    canvas.width = cropArea.width * scaleX;
    canvas.height = cropArea.height * scaleY;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(
      img,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );
    
    const croppedDataUrl = canvas.toDataURL("image/jpeg");
    setCropSrc(null);
    setIsCropping(false);
    processOCR(croppedDataUrl);
  };

  const [activeTab, setActiveTab] = useState("成虫");
  const [query, setQuery] = useState("");
  const [createType, setCreateType] = useState<EntryType>("幼虫");
  const [pastedData, setPastedData] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [isAutoFillEnabled, setIsAutoFillEnabled] = useState(false);
  
  const [expandedSpecies, setExpandedSpecies] = useState<string[]>([]);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, BeetleEntry[]> = {};
    filteredEntries.forEach(entry => {
      const key = entry.scientificName || "Unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  const toggleSpecies = (sciName: string) => {
    setExpandedSpecies(prev => 
      prev.includes(sciName) ? prev.filter(s => s !== sciName) : [...prev, sciName]
    );
  };

  // 一括操作用のステート
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [sortConfig, setSortConfig] = useState({ 
    primary: "japaneseName", 
    primaryDirection: "asc" as "asc" | "desc",
    secondary: "managementName", 
    secondaryDirection: "asc" as "asc" | "desc" 
  });

  const sortKeys = [
    { id: 'japaneseName', label: '和名' },
    { id: 'scientificName', label: '学名' },
    { id: 'locality', label: '産地' },
    { id: 'type', label: '種別' },
    { id: 'managementName', label: '管理名' },
    { id: 'date', label: '日付' },
  ];

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`${selectedIds.length}件のデータを一括削除しますか？`)) {
      selectedIds.forEach(id => deleteEntry(id));
      setSelectedIds([]);
      setIsSelectionMode(false);
    }
  };

  const handleBulkEditSubmit = (values: any) => {
    // 変更された項目のみを一括適用
    selectedIds.forEach(id => {
      const entry = entries.find(e => e.id === id);
      if (!entry) return;
      
      const patch: any = {};
      if (values.japaneseName) patch.japaneseName = values.japaneseName;
      if (values.scientificName) patch.scientificName = values.scientificName;
      if (values.locality) patch.locality = values.locality;
      if (values.generation) patch.generation = values.generation;
      if (values.hatchDate) patch.hatchDate = values.hatchDate;
      if (values.nextExchangeDate) patch.nextExchangeDate = values.nextExchangeDate;
      if (values.memo) patch.memo = values.memo;

      if (entry.type === "成虫") updateAdult(id, { ...entry, ...patch });
      else if (entry.type === "幼虫") updateLarva(id, { ...entry, ...patch });
      else if (entry.type === "産卵セット") updateSpawnSet(id, { ...entry, ...patch });
    });
    
    setIsBulkEditing(false);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds([]);
  };

  const handleSelectAll = () => {
    setSelectedIds(filteredEntries.map(e => e.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

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
    const list = entries.filter((entry) => {
      const matchesType = selectedType === "すべて" || entry.type === selectedType;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [entry.japaneseName, entry.scientificName, entry.locality, formatGeneration(entry.generation), entry.managementName]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesType && matchesQuery;
    });

    const getSortVal = (e: BeetleEntry, key: string) => {
      if (key === "date") return (e as any).hatchDate || (e as any).setDate || (e as any).actualEmergenceDate || (e as any).emergenceDate || e.createdAt || "";
      if (key === "managementName") return e.managementName || e.japaneseName;
      return (e as any)[key] || "";
    };

    return [...list].sort((a, b) => {
      let p = getSortVal(a, sortConfig.primary).localeCompare(getSortVal(b, sortConfig.primary), "ja", { numeric: true });
      if (p !== 0) {
        return sortConfig.primaryDirection === "asc" ? p : -p;
      }
      let s = getSortVal(a, sortConfig.secondary).localeCompare(getSortVal(b, sortConfig.secondary), "ja", { numeric: true });
      return sortConfig.secondaryDirection === "asc" ? s : -s;
    });
  }, [entries, query, selectedType, sortConfig]);

  const fetchCurrentTemperature = async (setter: (value: string) => void) => {
    try {
      const value = await fetchTemperature(switchBot.token, switchBot.secret, switchBot.deviceId);
      setter(String(value));
    } catch {
      window.alert("SwitchBot温度を取得できませんでした。");
    }
  };

  const handleQuickExchange = (e: React.MouseEvent, entry: LarvaBeetle) => {
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
      // 数字以外の区切りをハイフンに統一
      const clean = d.replace(/[Oo]/g, "0").replace(/[I|il]/g, "1").replace(/[^0-9/.-]/g, "-").replace(/[./]/g, "-").replace(/-+/g, "-");
      const match = clean.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (match) {
        return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
      }
      return "";
    };

    const lines = text.split('\n');
    const patch: any = { type: "幼虫", logs: [] };
    lines.forEach((line) => {
      const l = line.trim();
      if (!l) return;

      // ラベルに基づいた抽出
      if (l.match(/^(和名|和各)/)) {
        patch.japaneseName = l.replace(/^(和名|和各)\s*/, "");
      } else if (l.match(/^学名/)) {
        patch.scientificName = l.replace(/^学名\s*/, "");
      } else if (l.match(/^産地/)) {
        patch.locality = l.replace(/^産地\s*/, "");
      } else if (l.match(/^累代/)) {
        const content = l.replace(/^累代\s*/, "");
        const parts = content.split(/\s+/);
        const genStr = parts[0] || "";
        let primary: any = "-";
        let count = "";
        if (genStr.startsWith("CB")) { primary = "CB"; count = genStr.replace("CB", ""); }
        else if (genStr.startsWith("WF")) { primary = "WF"; count = genStr.replace("WF", ""); }
        else if (genStr.startsWith("F")) { primary = "F"; count = genStr.replace("F", ""); }
        else if (genStr === "WD") { primary = "WD"; count = ""; }
        patch.generation = { primary, secondary: "-", count };
        
        // 管理名と日付の分離（日付パターンを探す）
        const dateIndex = parts.findIndex((p, idx) => idx > 0 && p.match(/\d{4}[^\d]\d{1,2}/));
        if (dateIndex !== -1) {
          patch.hatchDate = fixOcrDate(parts[dateIndex]);
          if (dateIndex > 1) patch.managementName = parts.slice(1, dateIndex).join(" ");
        } else if (parts.length > 1) {
          patch.managementName = parts.slice(1).join(" ");
        }
      } 
      
      // 飼育ログのパターンマッチ (日付 + マット + 水/圧など)
      const logMatch = l.match(/(\d{4}[^\d]\d{1,2}[^\d]\d{1,2})\s+(.*?)\s+水(\d+)圧(\d+)\s+(.*?)\s+(\S+)\s+(\S+)/);
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

      // 羽化・掘り出しの抽出
      const eDateMatch = l.match(/(\d{4}[^\d]\d{1,2}[^\d]\d{1,2})\s+(羽化|掘り出し|堀)/);
      if (eDateMatch) {
        patch.actualEmergenceDate = fixOcrDate(eDateMatch[1]);
        patch.emergenceType = eDateMatch[2] === "堀" ? "掘り出し" : eDateMatch[2];
        patch.emergenceDate = patch.actualEmergenceDate;
      }
      
      // 後食の抽出
      const fDateMatch = l.match(/(\d{4}[^\d]\d{1,2}[^\d]\d{1,2})\s+後食/);
      if (fDateMatch) {
        patch.feedingDate = fixOcrDate(fDateMatch[1]);
        patch.type = "成虫";
        if (!patch.emergenceDate) patch.emergenceDate = patch.actualEmergenceDate || "";
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

    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
    if (event.target) event.target.value = "";
  };

  const processOCR = async (imageUrl: string) => {
    setIsOcrProcessing(true);
    try {
      const Tesseract = (await import('tesseract.js')).default;
      const { data: { text } } = await Tesseract.recognize(imageUrl, 'jpn+eng');
      
      const patch = parsePastedText(text);
      setPastedData(patch);
      if (patch.type) setCreateType(patch.type);
      window.alert("画像から文字を読み取り、データを反映しました");
    } catch (err) {
      console.error(err);
      window.alert("文字の読み取りに失敗しました。tesseract.jsがインストールされているか確認してください。");
    } finally {
      setIsOcrProcessing(false);
    }
  };

  return (
    <div className="app-container font-cute bg-[#F5F0EB] min-h-screen pb-[calc(140px+env(safe-area-inset-bottom,32px))] leading-[1.7]">
      {/* 固定ヘッダーセクション */}
      <section className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pt-8 pb-4 px-6 border-b border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-[11px] font-black text-[#D7CCC8] uppercase tracking-[0.2em] opacity-60">Breeding Dashboard</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowSort(!showSort)}
              className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${showSort ? "bg-[#FF9800] text-white" : "bg-gray-100 text-gray-500"}`}
            >
              並び替え
            </button>
            <button 
              onClick={handleToggleSelectionMode}
              className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${isSelectionMode ? "bg-[#F4511E] text-white" : "bg-gray-100 text-gray-500"}`}
            >
              {isSelectionMode ? "選択解除" : "一括操作"}
            </button>
          </div>
        </div>
        
        {(isSelectionMode || showSort) && (
          <div className="bg-gray-50/50 p-3 rounded-[24px] border border-gray-100 mb-6 space-y-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort & Selection</span>
              {isSelectionMode && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleSelectAll}
                    className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-black text-[#FF9800] shadow-sm active:scale-95 transition-all"
                  >
                    すべて選択
                  </button>
                  <button 
                    onClick={handleDeselectAll}
                    className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-black text-gray-400 shadow-sm active:scale-95 transition-all"
                  >
                    解除
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <div className="flex flex-col items-start min-w-[50px]">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">1st Sort</span>
                  <button 
                    onClick={() => setSortConfig(s => ({ ...s, primaryDirection: s.primaryDirection === "asc" ? "desc" : "asc" }))}
                    className="text-[8px] font-black text-[#F4511E] flex items-center gap-0.5"
                  >
                    <ArrowUpDown size={8} /> {sortConfig.primaryDirection === "asc" ? "昇順" : "降順"}
                  </button>
                </div>
                {sortKeys.map(k => (
                  <button key={`p-${k.id}`} onClick={() => setSortConfig(s => ({...s, primary: k.id}))} className={`px-3 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${sortConfig.primary === k.id ? "bg-[#FF9800] text-white shadow-sm" : "bg-white text-gray-400 border border-gray-100"}`}>{k.label}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <div className="flex flex-col items-start min-w-[50px]">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">2nd Sort</span>
                  <button 
                    onClick={() => setSortConfig(s => ({ ...s, secondaryDirection: s.secondaryDirection === "asc" ? "desc" : "asc" }))}
                    className="text-[8px] font-black text-[#F4511E] flex items-center gap-0.5"
                  >
                    <ArrowUpDown size={8} /> {sortConfig.secondaryDirection === "asc" ? "昇順" : "降順"}
                  </button>
                </div>
                {sortKeys.map(k => (
                  <button key={`s-${k.id}`} onClick={() => setSortConfig(s => ({...s, secondary: k.id}))} className={`px-3 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${sortConfig.secondary === k.id ? "bg-[#FF9800] text-white shadow-sm" : "bg-white text-gray-400 border border-gray-100"}`}>{k.label}</button>
                ))}
              </div>
            </div>
            {isSelectionMode && (
              <div className="flex gap-2 pt-2 border-t border-gray-200/50">
                <button onClick={handleBulkDelete} disabled={selectedIds.length === 0} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-500 rounded-xl text-[11px] font-bold disabled:opacity-30 transition-all active:scale-95">
                  <Trash2 size={14} /> 削除 ({selectedIds.length})
                </button>
                <button onClick={() => setIsBulkEditing(true)} disabled={selectedIds.length === 0} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-500 rounded-xl text-[11px] font-bold disabled:opacity-30 transition-all active:scale-95">
                  <Edit size={14} /> 編集 ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* 統計ボタン */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button 
            onClick={() => { setActiveTab("成虫"); setSelectedType("成虫"); }}
            className={`p-3 rounded-2xl border transition-all text-left ${activeTab === "成虫" && selectedType === "成虫" ? "bg-[#FF9800] border-[#FF9800] text-white shadow-lg" : "bg-white/60 border-white/80 text-[#4A3F35]"}`}
          >
            <p className="text-[10px] font-bold opacity-70 uppercase mb-1">成虫</p>
            <p className="text-2xl font-black">{stats.adults}<span className="text-[10px] ml-0.5">頭</span></p>
          </button>
          <button 
            onClick={() => { setActiveTab("幼虫"); setSelectedType("幼虫"); }}
            className={`p-3 rounded-2xl border transition-all text-left ${activeTab === "幼虫" && selectedType === "幼虫" ? "bg-[#FF9800] border-[#FF9800] text-white shadow-lg" : "bg-white/60 border-white/80 text-[#4A3F35]"}`}
          >
            <p className="text-[10px] font-bold opacity-70 uppercase mb-1">幼虫</p>
            <p className="text-2xl font-black">{stats.larvae}<span className="text-[10px] ml-0.5">頭</span></p>
          </button>
          <button 
            onClick={() => { setActiveTab("産卵セット"); setSelectedType("産卵セット"); }}
            className={`p-3 rounded-2xl border transition-all text-left ${activeTab === "産卵セット" && selectedType === "産卵セット" ? "bg-[#FF9800] border-[#FF9800] text-white shadow-lg" : "bg-white/60 border-white/80 text-[#4A3F35]"}`}
          >
            <p className="text-[10px] font-bold opacity-70 uppercase mb-1">セット</p>
            <p className="text-2xl font-black">{stats.spawnSets}<span className="text-[10px] ml-0.5">件</span></p>
          </button>
        </div>

        <label className="flex items-center bg-white/80 rounded-2xl px-4 py-3 shadow-sm border border-white/40 focus-within:border-[#FF9800] transition-all mb-4">
          <Search size={16} className="text-[#6C757D] mr-3" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="検索..."
            className="flex-1 text-base text-[#4A3F35] outline-none bg-transparent"
          />
        </label>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all whitespace-nowrap ${selectedType === "すべて" ? "bg-[#FF9800] text-white shadow-md" : "bg-white/40 text-[#6C757D] border border-white/40"}`}
            onClick={() => { setActiveTab("成虫"); setSelectedType("すべて"); }} // Keep onClick
          >
            すべて表示
          </button>
          {ENTRY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all whitespace-nowrap ${selectedType === type ? "bg-[#FF9800] text-white shadow-md" : "bg-white/40 text-[#8B7D7B] border border-white/40"}`}
              onClick={() => { setActiveTab(type); setSelectedType(type); }}
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      {/* クロップモーダル */}
      <Modal isOpen={isCropping} onClose={() => setIsCropping(false)} title="読み取り範囲を選択">
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden bg-black rounded-2xl aspect-square flex items-center justify-center">
            {cropSrc && (
              <>
                <img 
                  ref={cropImageRef}
                  src={cropSrc} 
                  alt="Crop Target" 
                  className="max-w-full max-h-full object-contain"
                />
                {/* 簡易的なドラッグ不可の範囲表示（実際はライブラリ導入推奨だが、ここではUIのみ） */}
                <div 
                  className="absolute border-2 border-[var(--primary)] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none"
                  style={{
                    left: `${cropArea.x}%`,
                    top: `${cropArea.y}%`,
                    width: `${cropArea.width}%`,
                    height: `${cropArea.height}%`
                  }}
                />
              </>
            )}
          </div>
          <p className="text-[10px] text-gray-500 text-center font-bold">※ 全体が収まるように調整して確定してください</p>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsCropping(false)}
              className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-500"
            >
              キャンセル
            </button>
            <button 
              onClick={handleCropComplete}
              className="flex-[2] py-3 bg-[#FF9800] text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Check size={18} /> 範囲を確定して解析
            </button>
          </div>
        </div>
      </Modal>

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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl shadow-sm text-[10px] font-black text-[#FF9800] active:scale-95 transition-all"
              >
                <Clipboard size={12} />
                貼付
              </button>
              <label 
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl shadow-sm text-[10px] font-black text-[#FF9800] active:scale-95 transition-all cursor-pointer ${isOcrProcessing ? 'opacity-50 pointer-events-none' : ''}`}
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
            <div className="text-[10px] font-black text-[#D7CCC8] block tracking-widest uppercase">Select Type</div>
            {!editingEntry && (
              <label className="flex items-center gap-2 cursor-pointer group">
                <span className={`text-[10px] font-bold transition-colors ${isAutoFillEnabled ? 'text-[#FF9800]' : 'text-gray-400'} uppercase tracking-tighter`}>前回入力を自動反映</span>
                <div 
                  onClick={() => setIsAutoFillEnabled(!isAutoFillEnabled)}
                  className={`w-8 h-4 rounded-full transition-colors relative border ${isAutoFillEnabled ? 'bg-[#FF9800] border-[#FF9800]' : 'bg-gray-100 border-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all shadow-sm ${isAutoFillEnabled ? 'left-[1.125rem]' : 'left-0.5'}`} />
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
                createType === type ? "bg-[#FF9800] text-white shadow-sm" : "text-gray-500"
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
            onSubmit={(values, count) => {
              for (let index = 0; index < count; index += 1) {
                const suffix = count > 1 ? `-${String(index + 1).padStart(2, "0")}` : "";
                const mName = values.managementName || "";
                addLarva({ ...values, managementName: mName ? `${mName}${suffix}` : suffix.replace("-", "") });
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

      {/* 一括編集モーダル */}
      <Modal isOpen={isBulkEditing} onClose={() => setIsBulkEditing(false)} title={`一括編集 (${selectedIds.length}件)`}>
        <div className="p-1">
          <p className="text-[10px] text-gray-400 mb-4">※ 入力した項目のみが選択中の個体すべてに上書きされます。</p>
          <LarvaForm
            initialValues={{ ...emptyLarvaForm, id: 'bulk' }}
            allEntries={entries}
            onSubmit={(values) => handleBulkEditSubmit(values)}
            onCancel={() => setIsBulkEditing(false)}
          />
        </div>
      </Modal>

      <section className="px-6">
        {activeTab !== "分析" && activeTab !== "タスク" && activeTab !== "設定" ? (
          filteredEntries.length === 0 ? (
            <EmptyState />
          ) : (
            Object.entries(groupedEntries).map(([sciName, group]) => {
              const isExpanded = expandedSpecies.includes(sciName) || isSelectionMode || query.length > 0;
              const japaneseName = group[0]?.japaneseName || "不明";
              
              return (
                <div key={sciName} className="mb-4">
                  {!isSelectionMode && query.length === 0 && (
                    <button 
                      onClick={() => toggleSpecies(sciName)}
                      className="w-full flex items-center justify-between p-4 bg-white/40 rounded-2xl mb-2 border border-white/60 active:scale-[0.98] transition-all"
                    >
                      <div className="text-left flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#4A3F35]">{japaneseName}</span>
                          <span className="text-[10px] font-bold bg-[#FF9800] text-white px-2 py-0.5 rounded-full">{group.length}</span>
                        </div>
                        <div className="text-[10px] italic text-gray-400 truncate">{sciName}</div>
                      </div>
                      <div className="text-gray-300">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </button>
                  )}
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <div className="space-y-3">
                        {group.map((entry) => (
                          <EntryCard
                            key={entry.id}
                            entry={entry}
                            onOpen={isSelectionMode ? () => handleToggleSelect(entry.id) : setSelectedEntry}
                            onDelete={isSelectionMode ? undefined : (e, id) => {
                              e.stopPropagation();
                              if (window.confirm("本当に削除しますか？")) deleteEntry(id);
                            }}
                            isSelectionMode={isSelectionMode}
                            isSelected={selectedIds.includes(entry.id)}
                          />
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
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
