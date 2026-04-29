"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Download, Upload } from "lucide-react";
import type { BeetleEntry } from "@/types/beetle";
import { daysBetween } from "@/lib/utils";

interface AnalysisViewProps {
  entries: BeetleEntry[];
  setSelectedEntry: (entry: BeetleEntry | null) => void;
  handleExport: () => void;
  handleImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isPersisted: boolean;
  requestPersistence: () => void;
}

export function AnalysisView({ entries, setSelectedEntry, handleExport, handleImport, isPersisted, requestPersistence }: AnalysisViewProps) {
  const [expandedNames, setExpandedNames] = useState<string[]>([]);

  const groupedStats = useMemo(() => {
    const groups: Record<string, any> = {};
    entries.forEach((entry) => {
      const key = entry.scientificName || "未設定";
      if (!groups[key]) {
        groups[key] = { scientificName: key, japaneseName: entry.japaneseName, weights: [], maxWeightEntry: null, spawnSetCount: 0, emergenceDurations: [], feedingDurations: [], temperatures: [] };
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
    });
    return Object.values(groups).map((group: any) => ({
      ...group,
      maxWeight: group.weights.length ? Math.max(...group.weights) : null,
      minWeight: group.weights.length ? Math.min(...group.weights) : null,
      avgEmergence: group.emergenceDurations.length ? Math.round(group.emergenceDurations.reduce((a: any, b: any) => a + b, 0) / group.emergenceDurations.length) : null,
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
                <AnalysisItem label="最大サイズ" value={stat.maxWeight ? `${stat.maxWeight}g` : "-"} onClick={() => stat.maxWeightEntry && setSelectedEntry(stat.maxWeightEntry)} isLink />
                <AnalysisItem label="産卵セット数" value={`${stat.spawnSetCount}件`} />
                <AnalysisItem label="平均羽化期間" value={stat.avgEmergence ? `${stat.avgEmergence}日` : "-"} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      <section className="bg-white/60 backdrop-blur-md p-6 rounded-[24px] border border-white/60 shadow-sm mt-8">
        <h3 className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-4">Storage Management</h3>
        <div className="mb-4 p-4 bg-white/40 rounded-2xl border border-white/60 flex items-center justify-between">
          <div className="text-[10px] font-bold text-gray-600">
            {isPersisted ? "✅ 永続ストレージ有効" : "⚠️ 削除される可能性があります"}
          </div>
          {!isPersisted && <button onClick={requestPersistence} className="text-[10px] bg-[#2D5A27] text-white px-3 py-1 rounded-full font-bold">有効化</button>}
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
      <div className={`text-sm font-black ${isLink ? "text-[#2D5A27] underline decoration-dotted" : "text-gray-800"}`}>{value}</div>
    </div>
  );
}