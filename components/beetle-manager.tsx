"use client";

import { useMemo, useState } from "react";
import { Search, Download, Upload } from "lucide-react";

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
} from "@/types/beetle";
import { ENTRY_TYPES } from "@/types/beetle";

import { AdultForm } from "./beetle/adult-form";
import { LarvaForm } from "./beetle/larva-form";
import { SpawnSetForm } from "./beetle/spawn-set-form";
import { EntryCard } from "./beetle/entry-card";
import { EntryDetail } from "./beetle/entry-detail";
import { SwitchBotCard } from "./beetle/switchbot-card";

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
  const importData = useBeetleStore((state) => state.importData);
  const switchBot = useBeetleStore((state) => state.switchBot);
  const { fetchTemperature, isFetching } = useSwitchBot();

  const [selectedEntry, setSelectedEntry] = useState<BeetleEntry | null>(null);
  const [query, setQuery] = useState("");
  const [createType, setCreateType] = useState<EntryType>("幼虫");
  const [isCreating, setIsCreating] = useState(false);

  const editingEntry = entries.find((entry) => entry.id === editingId) ?? null;

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
    try {
      const parsed = JSON.parse(await file.text()) as { entries?: BeetleEntry[]; beetles?: BeetleEntry[] };
      importData(parsed.entries ?? parsed.beetles ?? []);
      setSelectedEntry(null);
      startEditing(null);
    } catch {
      window.alert("バックアップファイルを読み込めませんでした。");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="app-container">
      <header className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-4">
        <div>
          <p className="eyebrow">Beetle Manager</p>
          <h1>昆虫管理アプリ</h1>
          <p className="hero-copy">成虫、幼虫、産卵セットを分けて管理し、幼虫ログはグラフ表示できます。</p>
        </div>
        <button
          type="button"
          className="button"
          onClick={() => {
            setIsCreating((value) => !value);
            startEditing(null);
          }}
        >
          {isCreating ? "登録を閉じる" : "新規登録を開く"}
        </button>
      </header>

      <section className="toolbar-row">
        <label className="search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="和名・学名・産地で検索" />
        </label>
        <button type="button" className="button button-secondary toolbar-button" onClick={handleExport}>
          <Download size={16} />
          保存
        </button>
        <label className="button button-secondary toolbar-button upload-button">
          <Upload size={16} />
          復元
          <input type="file" accept="application/json" hidden onChange={handleImport} />
        </label>
      </section>

      <section className="filter-row">
        <button type="button" className={selectedType === "すべて" ? "filter active" : "filter"} onClick={() => setSelectedType("すべて")}>すべて</button>
        {ENTRY_TYPES.map((type) => (
          <button type="button" key={type} className={selectedType === type ? "filter active" : "filter"} onClick={() => setSelectedType(type)}>
            {type}
          </button>
        ))}
      </section>

      {isCreating || editingEntry ? (
        <section className="card form-grid">
          <div className="section-title">{editingEntry ? "編集タイプ" : "登録タイプ"}</div>
          <div className="chip-row">
            {ENTRY_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={createType === type ? "chip active" : "chip"}
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
        </section>
      ) : null}

      <SwitchBotCard />

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
          onSubmit={(values, count) => {
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
          onSubmit={(value) => {
            updateSpawnSet(editingEntry.id, value);
            startEditing(null);
          }}
          onCancel={() => startEditing(null)}
          onFetchTemperature={fetchCurrentTemperature}
          isFetchingTemperature={isFetching}
        />
      ) : null}

      <section className="summary-grid">
        <div className="summary-card"><span>登録数</span><strong>{entries.length}</strong></div>
        <div className="summary-card"><span>検索結果</span><strong>{filteredEntries.length}</strong></div>
      </section>

      <section className="list-section">
        {filteredEntries.length === 0 ? (
          <div className="empty-state"><p>登録されたデータがありません。</p></div>
        ) : (
          filteredEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={(target) => {
                startEditing(target.id);
                setCreateType(target.type);
                setIsCreating(false);
              }}
              onOpen={setSelectedEntry}
            />
          ))
        )}
      </section>

      {selectedEntry ? (
        <EntryDetail
          entry={entries.find((item) => item.id === selectedEntry.id) ?? selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onFetchTemperature={fetchCurrentTemperature}
          isFetchingTemperature={isFetching}
        />
      ) : null}
    </div>
  );
}
