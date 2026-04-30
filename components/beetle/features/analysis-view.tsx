"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Download, Upload, X } from "lucide-react";
import type { BeetleEntry, EntryType } from "@/types/beetle";
import { daysBetween } from "@/lib/utils";

interface AnalysisViewProps {
  entries: BeetleEntry[];
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

export function AnalysisView({ entries, setSelectedType, setActiveTab, handleExport, handleImport, isPersisted, requestPersistence }: AnalysisViewProps) {
  const [expandedNames, setExpandedNames] = useState<string[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<{ label: string; stats: number[] } | null>(null);

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
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="px-5 pb-5 flex flex-col gap-4 border-t border-gray-50/50 pt-4">
                <div className="bg-white/40 border border-white/60 p-4 rounded-2xl">
                  <div className="text-[12px] font-black text-gray-400 uppercase mb-3 tracking-widest text-center">サイズ記録 (MIN / MAX)</div>
                  <div className="flex items-center justify-around">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-400 mb-1">MIN</p>
                      <p className="text-xl font-black text-gray-800">{stat.minWeight !== null ? `${stat.minWeight}g` : "-"}</p>
                    </div>
                    <div className="h-8 w-[1px] bg-gray-200" />
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-400 mb-1">MAX</p>
                      <p className="text-2xl font-black text-[var(--primary)]">{stat.maxWeight !== null ? `${stat.maxWeight}g` : "-"}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedAnalysis({ label: "体重計測履歴", stats: stat.weights })}
                    className="w-full mt-4 py-2.5 text-[12px] font-bold text-[var(--primary)] bg-white/80 border border-white rounded-xl shadow-sm active:scale-95 transition-all"
                  >
                    履歴を詳しく見る
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                <AnalysisItem label="産卵方法" value={stat.spawnMethods.length > 0 ? stat.spawnMethods[0] : "-"} onClick={() => { setSelectedType("産卵セット"); setActiveTab("産卵セット"); }} isLink />
                <AnalysisItem label="平均休眠期間" value={stat.dormancyDurations.length > 0 ? `${Math.round(stat.dormancyDurations.reduce((a, b) => a + b, 0) / stat.dormancyDurations.length)}日` : "-"} onClick={() => setSelectedAnalysis({ label: "休眠期間データ", stats: stat.dormancyDurations })} isLink />
                <AnalysisItem label="平均寿命" value={stat.lifespans.length > 0 ? `${Math.round(stat.lifespans.reduce((a, b) => a + b, 0) / stat.lifespans.length)}日` : "-"} onClick={() => setSelectedAnalysis({ label: "生存期間データ", stats: stat.lifespans })} isLink />
                <AnalysisItem label="平均羽化期間" value={stat.avgEmergence ? `${stat.avgEmergence}日` : "-"} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* 詳細モーダル */}
      <AnimatePresence>
        {selectedAnalysis && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAnalysis(null)} />
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white/95 backdrop-blur-xl p-8 rounded-[40px] w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10 border border-white/20">
               <button onClick={() => setSelectedAnalysis(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
               <h3 className="font-black text-2xl mb-8 text-[#212529] tracking-tight">{selectedAnalysis.label}</h3>
               
               <div className="max-h-[50dvh] overflow-y-auto space-y-3 mb-10 pr-2 custom-scrollbar">
                 {selectedAnalysis.stats.length > 0 ? (
                   selectedAnalysis.stats.map((val: number, i: number) => (
                     <div key={i} className="flex justify-between items-center p-5 bg-gray-50/50 backdrop-blur-sm rounded-2xl font-black border border-gray-100 shadow-sm transition-all hover:bg-white">
                        <span className="text-gray-400 text-[10px] uppercase tracking-widest">Entry #{i + 1}</span>
                        <span className="text-[var(--primary)] text-xl leading-none">{val}<span className="text-xs ml-0.5 font-bold">{selectedAnalysis.label.includes("体重") ? "g" : "日"}</span></span>
                     </div>
                   ))
                 ) : (
                   <p className="text-center text-gray-400 py-10">データがありません</p>
                 )}
               </div>

               <button onClick={() => setSelectedAnalysis(null)} className="w-full py-5 text-center text-base text-white bg-[#2D5A27] font-black rounded-3xl shadow-[0_10px_20px_rgba(45,90,39,0.3)] active:scale-95 transition-all">
                 確認しました
               </button>
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
    <div onClick={onClick} className={`p-4 rounded-2xl bg-white/40 border border-white/60 flex flex-col justify-center ${onClick ? "cursor-pointer active:bg-white/60 transition-colors" : ""}`}>
      <div className="text-[12px] font-bold text-gray-400 uppercase mb-2 tracking-wider">{label}</div>
      <div className={`text-[17px] font-black leading-tight ${isLink ? "text-[var(--primary)] underline decoration-dotted underline-offset-4" : "text-gray-800"}`}>{value}</div>
    </div>
  );
}
