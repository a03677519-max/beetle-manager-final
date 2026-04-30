"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Download, Upload, X } from "lucide-react";
import type { BeetleEntry, EntryType } from "@/types/beetle";
import { daysBetween } from "@/lib/utils";

interface AnalysisViewProps {
  entries: BeetleEntry[];
  setSelectedEntry: (entry: BeetleEntry | null) => void;
  setSelectedType: (type: EntryType | "すべて") => void;
  setActiveTab: (tab: string) => void;
  handleExport: () => void;
  handleImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isPersisted: boolean;
  requestPersistence: () => void;
}

interface GroupStats {
  scientificName: string;
  japaneseName: string;
  weights: number[];
  maxWeightEntry: BeetleEntry | null;
  emergenceDurations: number[];
  feedingDurations: number[];
  temperatures: number[];
  larvaDurations: number[];
  spawnMethods: string[];
  dormancyDurations: number[];
  lifespans: number[];
}

export function AnalysisView({ entries, setSelectedEntry, setSelectedType, setActiveTab, handleExport, handleImport, isPersisted, requestPersistence }: AnalysisViewProps) {
  const [expandedNames, setExpandedNames] = useState<string[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<{ label: string; stats: any[] } | null>(null);

  const groupedStats = useMemo(() => {
    const groups: Record<string, GroupStats> = {};
    entries.forEach((entry) => {
      const key = entry.scientificName || "未設定";
      if (!groups[key]) {
        groups[key] = {
          scientificName: key,
          japaneseName: entry.japaneseName || "",
          weights: [],
          maxWeightEntry: null,
          emergenceDurations: [],
          feedingDurations: [],
          temperatures: [],
          larvaDurations: [],
          spawnMethods: [],
          dormancyDurations: [],
          lifespans: []
        };
      }
      if (entry.type === "産卵セット") {
        if (entry.temperature) groups[key].temperatures.push(Number(entry.temperature));
        if (entry.substrate) groups[key].spawnMethods.push(entry.substrate);
      }
      if (entry.type === "幼虫") {
        entry.logs.forEach(log => {
          if (log.weight) {
            const w = Number(log.weight);
            groups[key].weights.push(w);
            if (w >= Math.max(...groups[key].weights, 0)) groups[key].maxWeightEntry = entry;
          }
          if (log.temperature) groups[key].temperatures.push(Number(log.temperature));
        });
        if (entry.actualEmergenceDate) {
          const days = daysBetween(entry.createdAt, entry.actualEmergenceDate);
          if (days !== null) groups[key].emergenceDurations.push(days);
        }
      }
      if (entry.type === "成虫") {
        if (entry.emergenceDate && entry.feedingDate) {
          const days = daysBetween(entry.emergenceDate, entry.feedingDate);
          if (days !== null && days > 0) groups[key].dormancyDurations.push(days);
        }
        if (entry.emergenceDate && entry.deathDate) {
          const days = daysBetween(entry.emergenceDate, entry.deathDate);
          if (days !== null && days > 0) groups[key].lifespans.push(days);
        }
      }
    });
    return Object.values(groups).map((group) => ({
      ...group,
      maxWeight: group.weights.length ? Math.max(...group.weights) : null,
      minWeight: group.weights.length ? Math.min(...group.weights) : null,
      maxLarvaDuration: group.larvaDurations.length ? Math.max(...group.larvaDurations) : null,
      minLarvaDuration: group.larvaDurations.length ? Math.min(...group.larvaDurations) : null,
      avgEmergence: group.emergenceDurations.length ? Math.round(group.emergenceDurations.reduce((a, b) => a + b, 0) / group.emergenceDurations.length) : null,
    }));
  }, [entries]);

  return (
    <div className="space-y-4">
      {groupedStats.map((stat) => (
        <div key={stat.scientificName} className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/60 shadow-sm overflow-hidden">
          <button onClick={() => setExpandedNames(prev => prev.includes(stat.scientificName) ? prev.filter(n => n !== stat.scientificName) : [...prev, stat.scientificName])} className="w-full px-5 py-4 flex justify-between items-center">
            <div className="text-left">
              <div className="font-bold text-[#212529]">{stat.japaneseName}</div>
              <div className="text-[10px] italic text-gray-400">{stat.scientificName}</div>
            </div>
            {expandedNames.includes(stat.scientificName) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <AnimatePresence>
            {expandedNames.includes(stat.scientificName) && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="px-5 pb-5 grid grid-cols-2 gap-3 border-t border-gray-50/50 pt-4">
                <AnalysisItem label="サイズ (max/min)" value={stat.maxWeight !== null && stat.minWeight !== null ? `${stat.maxWeight}g / ${stat.minWeight}g` : "-"} onClick={() => setSelectedAnalysis({ label: "サイズ", stats: stat.weights })} isLink />
                <AnalysisItem label="産卵方法" value={stat.spawnMethods.length > 0 ? stat.spawnMethods[0] : "-"} onClick={() => { setSelectedType("産卵セット"); setActiveTab("産卵セット"); }} isLink />
                <AnalysisItem label="休眠期間" value={stat.dormancyDurations.length > 0 ? `${Math.round(stat.dormancyDurations.reduce((a, b) => a + b, 0) / stat.dormancyDurations.length)}日` : "-"} onClick={() => setSelectedAnalysis({ label: "休眠期間", stats: stat.dormancyDurations })} isLink />
                <AnalysisItem label="平均寿命" value={stat.lifespans.length > 0 ? `${Math.round(stat.lifespans.reduce((a, b) => a + b, 0) / stat.lifespans.length)}日` : "-"} onClick={() => setSelectedAnalysis({ label: "寿命", stats: stat.lifespans })} isLink />
                <AnalysisItem label="平均羽化期間" value={stat.avgEmergence ? `${stat.avgEmergence}日` : "-"} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* 詳細モーダル */}
      <AnimatePresence>
        {selectedAnalysis && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedAnalysis(null)} />
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl relative z-10">
               <button onClick={() => setSelectedAnalysis(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
               <h3 className="font-bold text-lg mb-4">{selectedAnalysis.label}の分析</h3>
               <div className="h-40 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 mb-4 text-xs">グラフ（実装予定）</div>
               <a href="/analysis/data-table" className="block w-full text-center bg-[var(--primary)] text-white py-3 rounded-2xl font-bold text-sm mb-2">詳細データを確認</a>
               <button onClick={() => setSelectedAnalysis(null)} className="w-full py-3 text-center text-sm text-gray-500 font-bold border border-gray-200 rounded-2xl">閉じる</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <section className="bg-white/60 backdrop-blur-md p-6 rounded-[24px] border border-white/60 shadow-sm mt-8">
        <h3 className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-4">Storage Management</h3>
        <div className="mb-4 p-4 bg-white/40 rounded-2xl border border-white/60 flex items-center justify-between">
          <div className="text-[10px] font-bold text-gray-600">
            {isPersisted ? "✅ 永続ストレージ有効" : "⚠️ 削除される可能性があります"}
          </div>
          {!isPersisted && <button onClick={requestPersistence} className="text-[10px] bg-[var(--primary)] text-white px-3 py-1 rounded-full font-bold">有効化</button>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleExport} className="flex items-center justify-center gap-2 bg-white/80 py-3 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all"><Download size={14} /> 書き出し</button>
          <label className="flex items-center justify-center gap-2 bg-white/80 py-3 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"><Upload size={14} /> 読み込み<input type="file" hidden onChange={handleImport} accept=".json" /></label>
        </div>
      </section>
    </div>
  );
}

function AnalysisItem({ label, value, onClick, isLink }: { label: string; value: string; onClick?: () => void; isLink?: boolean }) {
  return (
    <div onClick={onClick} className={`p-3 rounded-2xl bg-white/40 border border-white/60 ${onClick ? "cursor-pointer active:bg-white/60" : ""}`}>
      <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">{label}</div>
      <div className={`text-sm font-black ${isLink ? "text-[var(--primary)] underline decoration-dotted" : "text-gray-800"}`}>{value}</div>
    </div>
  );
}
