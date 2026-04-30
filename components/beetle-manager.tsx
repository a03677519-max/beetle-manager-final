"use client";

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Modal } from "./ui/modal";
import { useSwitchBot } from "@/components/use-switchbot";
import {
  formatGeneration,
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
        [entry.japaneseName, entry.scientificName, entry.locality, formatGeneration(entry.generation), entry.managementName]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesType && matchesQuery;
    }).sort((a, b) => {
      // 管理名がある場合は管理名、なければ和名でソート
      const nameA = a.managementName || a.japaneseName;
      const nameB = b.managementName || b.japaneseName;
      return nameA.localeCompare(nameB, "ja");
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
      weight: latestLog?.weight ?? "",
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
      gender: "不明",
      japaneseName: entry.japaneseName,
      scientificName: entry.scientificName,
      locality: entry.locality,
      generation: entry.generation,
      emergenceDate: entry.actualEmergenceDate || today(),
      emergenceType: "羽化",
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
  return (
    <div className="app-container bg-[#F8F9FA] min-h-screen pb-[calc(140px+env(safe-area-inset-bottom,32px))]">
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
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md -mx-6 px-6 pt-2 pb-4 border-b border-gray-100 mb-6">
          <div className="text-[10px] font-black text-[#8B5A2B] mb-3 block tracking-widest uppercase">Select Type</div>
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
