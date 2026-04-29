"use client";

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Download, Upload, ChevronDown, ChevronUp, EyeOff } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Modal } from "./ui/modal";
import { useSwitchBot } from "@/components/use-switchbot";
import {
  formatGeneration,
  daysBetween,
  today,
} from "@/lib/utils";
import {
  emptyAdultForm,
  emptyLarvaForm,
  emptySpawnSetForm,
  useBeetleStore,
} from "@/store/use-beetle-store";
import type {
  BeetleEntry,
  EntryType,
} from "@/types/beetle";
import { ENTRY_TYPES } from "@/types/beetle";

import { AdultForm } from "./beetle/adult-form";
import { LarvaForm } from "./beetle/larva-form";
import { SpawnSetForm } from "./beetle/spawn-set-form";
import { EntryCard } from "./beetle/entry-card";
import { EmptyState } from "./beetle/empty-state";
import { EntryDetail } from "./beetle/entry-detail";

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
  const { fetchTemperature, isFetching } = useSwitchBot();

  const [selectedEntry, setSelectedEntry] = useState<BeetleEntry | null>(null);
  const [activeTab, setActiveTab] = useState("ホーム");
  const [query, setQuery] = useState("");
  const [createType, setCreateType] = useState<EntryType>("幼虫");
  const [isCreating, setIsCreating] = useState(false);
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
        [entry.japaneseName, entry.scientificName, entry.locality, formatGeneration(entry.generation)]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesType && matchesQuery;
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

  // 分析ビューのコンテンツ
  const AnalysisView = () => {
    const [expandedNames, setExpandedNames] = useState<string[]>([]);

    const groupedStats = useMemo(() => {
      const groups: Record<string, {
        scientificName: string;
        japaneseName: string;
        weights: number[];
        maxWeightEntry: BeetleEntry | null;
        spawnSetCount: number;
        emergenceDurations: number[];
        feedingDurations: number[];
        temperatures: number[];
      }> = {};

      entries.forEach((entry) => {
        const key = entry.scientificName || "未設定";
        if (!groups[key]) {
          groups[key] = {
            scientificName: key,
            japaneseName: entry.japaneseName,
            weights: [],
            maxWeightEntry: null as BeetleEntry | null,
            spawnSetCount: 0,
            emergenceDurations: [],
            feedingDurations: [],
            temperatures: [],
          };
        }

        if (entry.type === "産卵セット") {
          groups[key].spawnSetCount++;
          if (entry.temperature) groups[key].temperatures.push(Number(entry.temperature));
        }

        if (entry.type === "幼虫") {
          entry.logs.forEach(log => {
            if (log.weight) {
              const w = Number(log.weight);
              groups[key].weights.push(w);
              if (w >= Math.max(...groups[key].weights)) groups[key].maxWeightEntry = entry;
            }
            if (log.temperature) groups[key].temperatures.push(Number(log.temperature));
          });
          if (entry.actualEmergenceDate) {
            const days = daysBetween(entry.createdAt, entry.actualEmergenceDate);
            if (days !== null) groups[key].emergenceDurations.push(days);
          }
        }

        if (entry.type === "成虫" || entry.type === "産卵セット") {
          const e = entry as any;
          if (e.emergenceDate && e.feedingDate) {
            const days = daysBetween(e.emergenceDate, e.feedingDate);
            if (days !== null) groups[key].feedingDurations.push(days);
          }
        }
      });

      return Object.values(groups).map(group => ({
        ...group,
        maxWeight: group.weights.length ? Math.max(...group.weights) : null,
        minWeight: group.weights.length ? Math.min(...group.weights) : null,
        avgEmergence: group.emergenceDurations.length 
          ? Math.round(group.emergenceDurations.reduce((a, b) => a + b, 0) / group.emergenceDurations.length) 
          : null,
        avgFeeding: group.feedingDurations.length 
          ? Math.round(group.feedingDurations.reduce((a, b) => a + b, 0) / group.feedingDurations.length) 
          : null,
        tempRange: group.temperatures.length 
          ? { min: Math.min(...group.temperatures), max: Math.max(...group.temperatures) } 
          : null,
      }));
    }, [entries]);

    const toggleExpand = (name: string) => {
      setExpandedNames(prev => 
        prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
      );
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2 px-2">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">学名別データ分析</h3>
        </div>
        
        {groupedStats.map((stat) => (
          <div key={stat.scientificName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleExpand(stat.scientificName)}
              className="w-full px-5 py-4 flex justify-between items-center active:bg-gray-50 transition-colors"
            >
              <div className="text-left">
                <div className="font-bold text-[#212529] text-base">{stat.japaneseName}</div>
                <div className="text-xs italic text-gray-400">{stat.scientificName}</div>
              </div>
              {expandedNames.includes(stat.scientificName) ? <ChevronUp size={20} className="text-gray-300" /> : <ChevronDown size={20} className="text-gray-300" />}
            </button>

            <AnimatePresence>
              {expandedNames.includes(stat.scientificName) && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-2 grid grid-cols-2 gap-3 border-t border-gray-50">
                    <AnalysisItem 
                      label="最大/最小サイズ" 
                      value={stat.maxWeight ? `${stat.maxWeight}g (${stat.maxWeightEntry?.japaneseName}) / ${stat.minWeight}g` : "-"} 
                      onClick={() => stat.maxWeightEntry && setSelectedEntry(stat.maxWeightEntry)}
                    />
                    <AnalysisItem label="産卵セット数" value={`${stat.spawnSetCount}件`} />
                    <AnalysisItem label="羽化までの期間 (平均)" value={stat.avgEmergence ? `${stat.avgEmergence}日` : "-"} />
                    <AnalysisItem label="羽化〜後食 (平均)" value={stat.avgFeeding ? `${stat.avgFeeding}日` : "-"} />
                    <AnalysisItem label="飼育温度範囲" value={stat.tempRange ? `${stat.tempRange.min}〜${stat.tempRange.max}℃` : "-"} />
                    <div className="bg-[#F8F9FA] p-3 rounded-xl col-span-2">
                      <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">個体数割合</div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#2D5A27] h-full" style={{ width: `${(stat.weights.length / (entries.length || 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">データ管理</h3>
          <div className="mb-4 p-4 bg-[#F8F9FA] rounded-2xl border border-gray-100 flex items-center justify-between">
            <div className="text-[11px] font-bold text-gray-600">
              {isPersisted ? "✅ ブラウザによる自動削除から保護されています" : "⚠️ ブラウザによりデータが消去される可能性があります"}
            </div>
            {!isPersisted && (
              <button onClick={requestPersistence} className="text-[10px] bg-[#2D5A27] text-white px-3 py-1.5 rounded-full font-bold shadow-sm">有効化</button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleExport} className="flex items-center justify-center gap-2 bg-[#F1F3F5] py-3 rounded-xl text-sm font-bold text-[#212529]">
              <Download size={16} /> 書き出し
            </button>
            <label className="flex items-center justify-center gap-2 bg-[#F1F3F5] py-3 rounded-xl text-sm font-bold text-[#212529] cursor-pointer">
              <Upload size={16} /> 読み込み
              <input type="file" hidden onChange={handleImport} accept=".json" />
            </label>
          </div>
        </section>
      </div>
    );
  };

  const AnalysisItem = ({ label, value, onClick }: { label: string, value: string, onClick?: () => void }) => (
    <div onClick={onClick} className={`bg-[#F8F9FA] p-3 rounded-xl border border-gray-50 transition-colors ${onClick ? "active:bg-gray-100 cursor-pointer" : ""}`}>
      <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-tight">{label}</div>
      <div className={`text-sm font-black truncate ${onClick ? "text-[#2D5A27] underline decoration-dotted underline-offset-2" : "text-[#212529]"}`}>{value}</div>
    </div>
  );

  // タスクビューのコンテンツ
  const TaskView = () => {
    const handleQuickExchange = (e: React.MouseEvent, entry: any) => {
      e.stopPropagation();
      const latestLog = entry.logs?.[0];
      addLarvaLog(entry.id, {
        date: today(),
        substrate: latestLog?.substrate ?? "",
        pressure: latestLog?.pressure ?? 3,
        moisture: latestLog?.moisture ?? 3,
        bottleSize: latestLog?.bottleSize ?? "",
        stage: latestLog?.stage ?? "L1",
        weight: latestLog?.weight ?? "",
        gender: latestLog?.gender ?? "不明",
        temperature: latestLog?.temperature ?? "",
      });
    };

    const handlePromoteToAdult = (e: React.MouseEvent, entry: any) => {
      e.stopPropagation();
      const confirm = window.confirm(`${entry.japaneseName}を成虫として登録し、幼虫データを移行しますか？`);
      if (!confirm) return;

      addAdult({
        type: "成虫",
        gender: "不明",
        japaneseName: entry.japaneseName,
        scientificName: entry.scientificName,
        locality: entry.locality,
        generation: entry.generation,
        emergenceDate: (entry as any).actualEmergenceDate || today(),
        feedingDate: "",
        deathDate: "",
        larvaMemo: entry.logs.length > 0 ? `幼虫時ログ: ${entry.logs.length}件。最終体重: ${entry.logs[0].weight}g` : "幼虫データより移行",
      } as any);
      deleteEntry(entry.id);
    };

    const handleSkipTask = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setSkippedTaskIds((prev) => [...prev, id]);
    };

    const tasks = useMemo(() => {
      const visibleEntries = entries.filter((e) => !skippedTaskIds.includes(e.id));

      const exchangeTasks = visibleEntries
        .filter(e => e.type === "幼虫")
        .map(e => {
          const lastDate = e.logs.length > 0 ? e.logs[0].date : e.createdAt;
          const days = daysBetween(lastDate, today()) ?? 0;
          return { entry: e, days, type: "exchange" as const };
        })
        .filter(t => t.days >= 60);

      const emergenceTasks = visibleEntries
        .filter(e => e.type === "幼虫" && (e as any).actualEmergenceDate)
        .map(e => {
          const daysToEmergence = daysBetween(today(), (e as any).actualEmergenceDate) ?? 0;
          return { entry: e, days: daysToEmergence, type: "emergence" as const };
        })
        .filter(t => t.days <= 14 && t.days >= -7);

      return [...exchangeTasks, ...emergenceTasks]
        .sort((a, b) => {
          if (taskSortType === "urgency") {
            const getPriority = (t: any) => {
              if (t.type === 'emergence') return t.days <= 0 ? 3 : 1;
              return t.days >= 90 ? 3 : 2;
            };
            const pa = getPriority(a);
            const pb = getPriority(b);
            if (pa !== pb) return pb - pa;
            return b.days - a.days;
          } else {
            // 個体種別順：タスクタイプでグループ化し、名前でソート
            if (a.type !== b.type) return a.type === "emergence" ? -1 : 1;
            return a.entry.japaneseName.localeCompare(b.entry.japaneseName);
          }
        });
    }, [entries, taskSortType, skippedTaskIds]);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">期限切れ・間近のタスク ({tasks.length})</h3>
            {skippedTaskIds.length > 0 && (
              <button 
                onClick={() => setSkippedTaskIds([])}
                className="text-[10px] font-bold text-[#8B5A2B] hover:underline"
              >
                スキップ解除
              </button>
            )}
          </div>
          <div className="flex bg-[#F1F3F5] p-1 rounded-xl">
            <button 
              onClick={() => setTaskSortType("urgency")}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${taskSortType === "urgency" ? "bg-[#2D5A27] text-white shadow-sm" : "text-gray-500"}`}
            >
              緊急度
            </button>
            <button 
              onClick={() => setTaskSortType("type")}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${taskSortType === "type" ? "bg-[#2D5A27] text-white shadow-sm" : "text-gray-500"}`}
            >
              種別
            </button>
          </div>
        </div>
        {tasks.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center">
            <p className="text-gray-400 text-sm">現在、対応が必要な個体はいません</p>
          </div>
        ) : (
          tasks.map(({ entry, days, type }) => (
            <div 
              key={`${entry.id}-${type}`} 
              onClick={() => setSelectedEntry(entry)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-10 rounded-full ${
                  type === 'emergence' ? 'bg-[#3498DB]' : (days >= 90 ? 'bg-[#E74C3C]' : 'bg-[#F1C40F]')
                }`} />
                <div>
                  <div className="font-bold text-[#212529]">{entry.japaneseName}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">
                    {type === 'emergence' 
                      ? (days === 0 ? "今日羽化予定" : (days > 0 ? `あと${days}日で羽化予定` : `${Math.abs(days)}日前に羽化済み`))
                      : `${days}日間エサ未交換`
                    }
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleSkipTask(e, entry.id)}
                  className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
                  title="非表示"
                >
                  <EyeOff size={14} />
                </button>
                {type === "exchange" && (
                  <button 
                    onClick={(e) => handleQuickExchange(e, entry)}
                    className="text-[10px] font-black bg-[#2D5A27] text-white px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                  >
                    交換
                  </button>
                )}
                {type === "emergence" && days <= 0 && (
                  <button 
                    onClick={(e) => handlePromoteToAdult(e, entry)}
                    className="text-[10px] font-black bg-[#8B5A2B] text-white px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                  >
                    成虫へ
                  </button>
                )}
                <div className="text-[10px] font-black text-[#2D5A27] border border-[#2D5A27]/20 px-3 py-1 rounded-full uppercase tracking-widest">
                  詳細
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
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

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (entries.length > 0) {
      if (!window.confirm("既存のすべての飼育データがバックアップファイルの内容で上書きされます。よろしいですか？")) {
        event.target.value = "";
        return;
      }
    }

    try {
      const parsed = JSON.parse(await file.text()) as { entries?: BeetleEntry[]; beetles?: BeetleEntry[] };
      const data = parsed.entries ?? parsed.beetles;
      if (!data || !Array.isArray(data)) throw new Error("不正なファイル形式です");
      importData(data);
      setSelectedEntry(null);
      startEditing(null);
    } catch {
      window.alert("バックアップファイルを読み込めませんでした。");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="app-container bg-[#F8F9FA] min-h-screen pb-[120px]">
      <header className="px-6 pt-8 pb-4 flex justify-between items-end">
        <div>
          <p className="text-[12px] font-bold text-[#8B5A2B] uppercase tracking-widest mb-1">Breeding Log</p>
          <h1 className="text-2xl font-black text-[#212529]">マイブリード</h1>
        </div>
      </header>

      {/* 統計ダッシュボード */}
      <section className="px-6 mb-6 grid grid-cols-3 gap-3">
        <div className="bg-[#F1F3F5] p-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-tighter opacity-70">成虫</p>
          <p className="text-xl font-black text-[#212529]">{stats.adults}<span className="text-[10px] ml-0.5 font-bold">頭</span></p>
        </div>
        <div className="bg-[#F1F3F5] p-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-tighter opacity-70">幼虫</p>
          <p className="text-xl font-black text-[#212529]">{stats.larvae}<span className="text-[10px] ml-0.5 font-bold">頭</span></p>
        </div>
        <div className="bg-[#F1F3F5] p-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-tighter opacity-70">セット</p>
          <p className="text-xl font-black text-[#212529]">{stats.spawnSets}<span className="text-[10px] ml-0.5 font-bold">件</span></p>
        </div>
      </section>

      <section className="px-6 mb-4 sticky top-0 z-30 bg-[#F8F9FA]/80 backdrop-blur-md py-2">
        <label className="flex items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-[#DEE2E6]/50 focus-within:border-[#2D5A27] transition-all">
          <Search size={18} className="text-[#6C757D] mr-3" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="個体名・学名・産地で検索"
            className="flex-1 text-[16px] text-[#212529] outline-none bg-transparent"
          />
        </label>
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap ${
              selectedType === "すべて" ? "bg-[#2D5A27] text-white shadow-md" : "bg-white text-[#6C757D] border border-[#DEE2E6]"
            }`}
            onClick={() => setSelectedType("すべて")}
          >
            すべて
          </button>
          {ENTRY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap ${
                selectedType === type ? "bg-[#2D5A27] text-white shadow-md" : "bg-white text-[#6C757D] border border-[#DEE2E6]"
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
        }}
        title={editingEntry ? "編集" : "新規登録"}
      >
        <div className="text-[12px] font-bold text-[#8B5A2B] mb-2 block tracking-wider uppercase">{editingEntry ? "編集タイプ" : "登録タイプ"}</div>
        <div className="flex bg-[#F1F3F5] rounded-xl p-1 gap-1 mb-6"> {/* Styled chip-row directly */}
          {ENTRY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              style={{ width: `${100 / ENTRY_TYPES.length}%` }}
              className={`py-2 text-sm font-bold rounded-lg transition-all ${
                createType === type ? "bg-[#2D5A27] text-white shadow-sm" : "text-gray-500"
              }`}
              onClick={() => {
                setCreateType(type);
                if (!editingEntry) return;
                startEditing(null);
                setIsCreating(true);
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {isCreating && !editingEntry && createType === "成虫" ? (
          <AdultForm
            initialValues={emptyAdultForm}
            onSubmit={(value) => {
              addAdult(value);
              setIsCreating(false);
            }}
            onCancel={() => setIsCreating(false)}
          />
        ) : null}
        {isCreating && !editingEntry && createType === "幼虫" ? (
          <LarvaForm
            initialValues={emptyLarvaForm}
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
            initialValues={emptySpawnSetForm}
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
            onSubmit={(value, count) => {
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
        {activeTab === "ホーム" || ENTRY_TYPES.includes(activeTab as any) ? (
          filteredEntries.length === 0 ? (
            <EmptyState />
          ) : (
            filteredEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onOpen={setSelectedEntry}
              />
            ))
          )
        ) : activeTab === "分析" ? (
          <AnalysisView />
        ) : activeTab === "タスク" ? (
          <TaskView />
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
          if (tab === "ホーム") setSelectedType("すべて");
          else if (ENTRY_TYPES.includes(tab as EntryType)) setSelectedType(tab as EntryType);
        }}
        onAdd={() => setIsCreating(true)}
      />
    </div>
  );
}
