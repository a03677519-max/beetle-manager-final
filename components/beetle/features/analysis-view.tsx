"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Download, Upload, X, FileSpreadsheet, BarChart3, ExternalLink, PlusCircle } from "lucide-react";
import {
  ScatterChart,
  Scatter,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  Cell,
} from "recharts";
import type { BeetleEntry, EntryType, Gender, LarvaBeetle, SpawnSet } from "@/types/beetle";
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
  handleSync: () => void;
  isSyncing?: boolean;
  onAddSpawnTemplate?: (template: Partial<SpawnSet>) => void;
}

interface AnalysisRecord { // For bar/list charts (single value)
  val: number;
  mName: string;
  gender: Gender;
  entryId: string;
}

interface ScatterPlotData { // For scatter plots (two values)
  x: number;
  y: number;
  mName: string;
  gender: Gender;
  entryId: string;
}

interface AnalysisModalData {
  label: string;
  records?: AnalysisRecord[]; // For bar/list charts
  scatterData?: ScatterPlotData[]; // For scatter plots
  xLabel?: string;
  yLabel?: string;
}

interface GroupStats {
  scientificName: string;
  japaneseName: string;
  weightRecords: AnalysisRecord[];
  maxWeightEntry: BeetleEntry | null;
  temperatures: number[];
  spawnSetEntries: SpawnSet[];
  larvaRecords: AnalysisRecord[];
  dormancyRecords: AnalysisRecord[];
  lifespanRecords: AnalysisRecord[];
  adultSizeRecords: AnalysisRecord[];
  spawnEggRecords: AnalysisRecord[];
  spawnLarvaRecords: AnalysisRecord[];
  recoveryRecords: AnalysisRecord[];
  weightRange: [number, number] | null;
  larvaRange: [number, number] | null;
  dormancyRange: [number, number] | null;
  lifespanRange: [number, number] | null;
  sizeRange: [number, number] | null;
  spawnResultRange: {
    eggs: [number, number] | null;
    larvae: [number, number] | null;
    total: [number, number] | null;
  };
  parentAggregatedTotals: Record<string, { eggs: number; larvae: number }>;
  adultSizeVsMaxLarvaWeightRecords: {
    adultSize: number;
    maxLarvaWeight: number;
    mName: string;
    gender: Gender;
    entryId: string; // Adult entry ID
  }[];
}

export function AnalysisView({ 
  entries, 
  setSelectedEntry, 
  setSelectedType, 
  setActiveTab, 
  handleExport, 
  handleImport, 
  isPersisted, 
  requestPersistence,
  handleSync,
  isSyncing,
  onAddSpawnTemplate
}: AnalysisViewProps) {
  const [expandedNames, setExpandedNames] = useState<string[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisModalData | null>(null);
  const [selectedSpawnTable, setSelectedSpawnTable] = useState<GroupStats | null>(null);
  const [viewGender, setViewGender] = useState<Gender>("オス");
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 前回の展開数を保持して、新規に展開された時のみスクロールするようにする
  const prevExpandedCount = useRef(0);

  useEffect(() => {
    if (expandedNames.length > prevExpandedCount.current) {
      const lastOpened = expandedNames[expandedNames.length - 1];
      const element = itemRefs.current[lastOpened];
      if (element) {
        // アニメーションによるレイアウト変更を考慮して遅延実行
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
        return () => clearTimeout(timer);
      }
    }
    prevExpandedCount.current = expandedNames.length;
  }, [expandedNames]);

  // 管理名で自然順ソートするユーティリティ
  const sortRecords = (records: AnalysisRecord[]) => {
    return [...records].sort((a, b) => a.mName.localeCompare(b.mName, "ja", { numeric: true }));
  };

  const groupedStats = useMemo(() => {
    const groups: Record<string, GroupStats> = {};
    entries.forEach((entry) => {
      const key = entry.scientificName || "未設定";
      const mName = entry.managementName || "No Name";
      const currentGender = 
        entry.type === "成虫" ? entry.gender : 
        entry.type === "幼虫" ? (entry.logs[0]?.gender || "不明") : 
        "不明";

      if (!groups[key]) {
        groups[key] = {
          scientificName: key,
          japaneseName: entry.japaneseName || "",
          weightRecords: [],
          maxWeightEntry: null,
          temperatures: [],
          spawnSetEntries: [],
          larvaRecords: [],
          dormancyRecords: [],
          lifespanRecords: [],
          adultSizeRecords: [],
          spawnEggRecords: [],
          spawnLarvaRecords: [],
          adultSizeVsMaxLarvaWeightRecords: [],
          recoveryRecords: [],
          weightRange: null,
          larvaRange: null,
          dormancyRange: null,
          lifespanRange: null,
          sizeRange: null,
          spawnResultRange: { eggs: null, larvae: null, total: null },
          parentAggregatedTotals: {},
        };
      }
      if (entry.type === "産卵セット") {
        if (entry.temperature) groups[key].temperatures.push(Number(entry.temperature));
        groups[key].spawnSetEntries.push(entry);
        if (entry.eggCount !== undefined) {
          groups[key].spawnEggRecords.push({ val: entry.eggCount, mName, gender: "不明", entryId: entry.id });
        }
        if (entry.larvaCount !== undefined) {
          groups[key].spawnLarvaRecords.push({ val: entry.larvaCount, mName, gender: "不明", entryId: entry.id });
        }
        const total = (entry.eggCount || 0) + (entry.larvaCount || 0);
        groups[key].recoveryRecords.push({ val: total, mName, gender: "不明", entryId: entry.id });
      }
      if (entry.type === "幼虫") {
        entry.logs.forEach(log => {
          if (log.weight) {
            const w = Number(log.weight);
            groups[key].weightRecords.push({ val: w, mName, gender: log.gender, entryId: entry.id });
            const currentMax = groups[key].weightRecords.length > 0 ? Math.max(...groups[key].weightRecords.map(r => r.val)) : 0;
            if (w >= currentMax) groups[key].maxWeightEntry = entry;
          }
          if (log.temperature) groups[key].temperatures.push(Number(log.temperature));
        });
        if (entry.actualEmergenceDate) {
          // LarvaBeetle型にhatchDateが含まれていない場合のエラーを回避
          const hatchDate = (entry as any).hatchDate || entry.createdAt;
          const days = daysBetween(hatchDate, entry.actualEmergenceDate);
          if (days !== null) groups[key].larvaRecords.push({ val: days, mName, gender: currentGender, entryId: entry.id });
        }
      }
      if (entry.type === "成虫") {
        if (entry.emergenceDate && entry.feedingDate) {
          const days = daysBetween(entry.emergenceDate, entry.feedingDate);
          if (days !== null && days > 0) groups[key].dormancyRecords.push({ val: days, mName, gender: entry.gender, entryId: entry.id });
        }
        if (entry.emergenceDate && entry.deathDate) {
          const days = daysBetween(entry.emergenceDate, entry.deathDate);
          if (days !== null && days > 0) groups[key].lifespanRecords.push({ val: days, mName, gender: entry.gender, entryId: entry.id });
        }
        if (entry.size) {
          const s = parseFloat(entry.size);
          if (!isNaN(s)) {
            groups[key].adultSizeRecords.push({ val: s, mName, gender: entry.gender, entryId: entry.id });

            // Find linked larval entry for max weight
            if (entry.linkedEntryId) {
              const linkedLarva = entries.find(e => e.id === entry.linkedEntryId && e.type === "幼虫") as LarvaBeetle | undefined;
              if (linkedLarva && linkedLarva.logs.length > 0) {
                const maxLarvaWeight = Math.max(...linkedLarva.logs.map(log => log.weight).filter(w => w > 0));
                if (!isNaN(maxLarvaWeight) && maxLarvaWeight > 0) {
                  groups[key].adultSizeVsMaxLarvaWeightRecords.push({
                    adultSize: s,
                    maxLarvaWeight: maxLarvaWeight,
                    mName: mName,
                    gender: entry.gender,
                    entryId: entry.id,
                  });
                }
              }
            }
          }
        }
      }
    });
    return Object.values(groups).map((group) => ({
      ...group,
      weightRange: group.weightRecords.length ? [Math.min(...group.weightRecords.map(r => r.val)), Math.max(...group.weightRecords.map(r => r.val))] as [number, number] : null,
      larvaRange: group.larvaRecords.length ? [Math.min(...group.larvaRecords.map(r => r.val)), Math.max(...group.larvaRecords.map(r => r.val))] as [number, number] : null,
      dormancyRange: group.dormancyRecords.length ? [Math.min(...group.dormancyRecords.map(r => r.val)), Math.max(...group.dormancyRecords.map(r => r.val))] as [number, number] : null,
      lifespanRange: group.lifespanRecords.length ? [Math.min(...group.lifespanRecords.map(r => r.val)), Math.max(...group.lifespanRecords.map(r => r.val))] as [number, number] : null,
      sizeRange: group.adultSizeRecords.length ? [Math.min(...group.adultSizeRecords.map(r => r.val)), Math.max(...group.adultSizeRecords.map(r => r.val))] as [number, number] : null,
      spawnResultRange: {
        eggs: group.spawnEggRecords.length ? [Math.min(...group.spawnEggRecords.map(r => r.val)), Math.max(...group.spawnEggRecords.map(r => r.val))] as [number, number] : null,
        larvae: group.spawnLarvaRecords.length ? [Math.min(...group.spawnLarvaRecords.map(r => r.val)), Math.max(...group.spawnLarvaRecords.map(r => r.val))] as [number, number] : null,
        total: group.spawnSetEntries.length ? [Math.min(...group.spawnSetEntries.map(s => (s.eggCount || 0) + (s.larvaCount || 0))), Math.max(...group.spawnSetEntries.map(s => (s.eggCount || 0) + (s.larvaCount || 0)))] as [number, number] : null,
      },
      // 親(管理名)ごとに合算
      parentAggregatedTotals: group.spawnSetEntries.reduce((acc, s) => {
        const name = s.managementName || s.japaneseName || "不明";
        if (!acc[name]) acc[name] = { eggs: 0, larvae: 0 };
        acc[name].eggs += s.eggCount || 0;
        acc[name].larvae += s.larvaCount || 0;
        return acc;
      }, {} as Record<string, { eggs: number; larvae: number }>),
    }));
  }, [entries]);

  return (
    <div className="space-y-4">
      {groupedStats.map((stat) => (
        <div 
          key={stat.scientificName} 
          ref={(el) => { itemRefs.current[stat.scientificName] = el; }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden scroll-mt-80"
        >
          <button onClick={() => setExpandedNames(prev => prev.includes(stat.scientificName) ? prev.filter(n => n !== stat.scientificName) : [...prev, stat.scientificName])} className="w-full px-5 py-4 flex justify-between items-center">
            <div className="text-left">
              <div className="font-bold text-[#4A3F35]">{stat.japaneseName}</div>
              <div className="text-[10px] italic text-gray-400">{stat.scientificName}</div>
            </div>
            {expandedNames.includes(stat.scientificName) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <AnimatePresence>
            {expandedNames.includes(stat.scientificName) && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="px-5 pb-5 flex flex-col gap-4 border-t border-gray-50/50 pt-4">
                <div className="bg-white/60 border border-white/60 p-4 rounded-2xl">
                  <div className="text-[12px] font-black text-gray-400 uppercase mb-3 tracking-widest text-center">サイズ記録 (MIN / MAX)</div>
                  <div className="flex items-center justify-around">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-400 mb-1">MIN</p>
                      <p className="text-xl font-black text-[#4A3F35]">{stat.weightRange ? `${stat.weightRange[0]}g` : "-"}</p>
                    </div>
                    <div className="h-8 w-[1px] bg-gray-200" />
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-400 mb-1">MAX</p>
                      <p className="text-2xl font-black text-[var(--primary)]">{stat.weightRange ? `${stat.weightRange[1]}g` : "-"}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedAnalysis({ label: "体重計測履歴", records: stat.weightRecords })}
                    className="w-full mt-4 py-2.5 text-[#FF9800] bg-white/80 border border-white rounded-xl shadow-sm active:scale-95 transition-all"
                  >
                    履歴を詳しく見る
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                <AnalysisItem label="産卵方法" value={stat.spawnSetEntries.length > 0 ? `${stat.spawnSetEntries.length}件の記録` : "-"} onClick={() => setSelectedSpawnTable(stat as any)} isLink />
                <AnalysisItem label="成虫サイズ範囲" value={stat.sizeRange ? `${stat.sizeRange[0]}〜${stat.sizeRange[1]}mm` : "-"} onClick={() => setSelectedAnalysis({ label: "成虫サイズ分布", records: stat.adultSizeRecords })} isLink />
                <AnalysisItem label="回収合計 (卵+幼虫)" value={stat.spawnResultRange.total ? `${stat.spawnResultRange.total[0]}〜${stat.spawnResultRange.total[1]}個` : "-"} onClick={() => setSelectedAnalysis({ label: "回収合計データ", records: stat.recoveryRecords })} isLink />
                <AnalysisItem label="休眠期間範囲" value={stat.dormancyRange ? `${stat.dormancyRange[0]}〜${stat.dormancyRange[1]}日` : "-"} onClick={() => setSelectedAnalysis({ label: "休眠データ", records: stat.dormancyRecords })} isLink />
                <AnalysisItem label="寿命範囲" value={stat.lifespanRange ? `${stat.lifespanRange[0]}〜${stat.lifespanRange[1]}日` : "-"} onClick={() => setSelectedAnalysis({ label: "生存データ", records: stat.lifespanRecords })} isLink />
                <AnalysisItem label="幼虫期間範囲" value={stat.larvaRange ? `${stat.larvaRange[0]}〜${stat.larvaRange[1]}日` : "-"} onClick={() => setSelectedAnalysis({ label: "幼虫データ", records: stat.larvaRecords })} isLink />
                <div className="col-span-2">
                  <AnalysisItem label="親別合計" value={Object.keys(stat.parentAggregatedTotals).length > 0 ? `${Object.keys(stat.parentAggregatedTotals).length}親の合計を確認` : "-"} onClick={() => setSelectedAnalysis({ 
                    label: "親別回収合算", 
                    records: Object.entries(stat.parentAggregatedTotals).map(([name, val]) => ({ val: val.eggs + val.larvae, mName: name, gender: "不明", entryId: "" }))
                  })} isLink />
                </div>
                <AnalysisItem label="成虫サイズ vs 最大幼虫体重" value={stat.adultSizeVsMaxLarvaWeightRecords.length > 0 ? `${stat.adultSizeVsMaxLarvaWeightRecords.length}件のデータ` : "-"} onClick={() => setSelectedAnalysis({
                  label: "成虫サイズ vs 最大幼虫体重",
                  scatterData: stat.adultSizeVsMaxLarvaWeightRecords.map(r => ({
                    x: r.maxLarvaWeight,
                    y: r.adultSize,
                    mName: r.mName,
                    gender: r.gender,
                    entryId: r.entryId,
                  })),
                  xLabel: "最大幼虫体重 (g)",
                  yLabel: "成虫サイズ (mm)",
                })} isLink />
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
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white/95 backdrop-blur-xl p-6 rounded-[32px] w-full max-w-sm max-h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10 border border-white/20 flex flex-col">
               <button onClick={() => setSelectedAnalysis(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
               <h3 className="font-black text-xl mb-6 text-[#333D33] tracking-tight">{selectedAnalysis.label}</h3>

               <div className="flex bg-gray-100 p-1 rounded-xl mb-6 shrink-0">
                 {(["オス", "メス", "不明"] as const).map((g) => (
                   <button key={g} onClick={() => setViewGender(g)} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${viewGender === g ? "bg-white text-[var(--primary)] shadow-sm" : "text-gray-400"}`}>{g}</button>
                 ))} {/* text-[var(--primary)] will be handled by global CSS variable or direct replacement */}
               </div>
               
               {selectedAnalysis.scatterData ? (
                 <>
                   <div className="h-44 mb-4 bg-gray-50/50 rounded-2xl p-4 shrink-0">
                     <ResponsiveContainer width="100%" height="100%">
                       <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                         <XAxis type="number" dataKey="x" name={selectedAnalysis.xLabel} unit={selectedAnalysis.xLabel?.includes("g") ? "g" : ""} fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                         <YAxis type="number" dataKey="y" name={selectedAnalysis.yLabel} unit={selectedAnalysis.yLabel?.includes("mm") ? "mm" : ""} fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                         <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                           if (active && payload && payload.length) {
                             const data = payload[0].payload;
                             return (
                               <div className="bg-white/90 p-2 rounded-lg text-[10px] font-bold shadow-xl">
                                 <p>{data.mName}</p>
                                 <p className="text-[#FF9800] text-sm font-black">
                                   {selectedAnalysis.xLabel}: {data.x}{selectedAnalysis.xLabel?.includes("g") ? "g" : ""}
                                 </p>
                                 <p className="text-[#FF9800] text-sm font-black">
                                   {selectedAnalysis.yLabel}: {data.y}{selectedAnalysis.yLabel?.includes("mm") ? "mm" : ""}
                                 </p>
                               </div>
                             );
                           }
                           return null;
                         }} />
                         <Scatter
                           data={selectedAnalysis.scatterData.filter(d => viewGender === "不明" || d.gender === viewGender)}
                           fill={viewGender === "オス" ? "#E67E22" : viewGender === "メス" ? "#EC407A" : "#D35400"}
                           style={{ cursor: "pointer" }}
                           onClick={(d: any) => { if (d?.entryId) { setSelectedEntry(entries.find(e => e.id === d.entryId) || null); setSelectedAnalysis(null); } }}
                         />
                       </ScatterChart>
                     </ResponsiveContainer>
                   </div>
                   <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
                     {selectedAnalysis.scatterData.filter(d => viewGender === "不明" || d.gender === viewGender).length > 0 ? (
                       selectedAnalysis.scatterData.filter(d => viewGender === "不明" || d.gender === viewGender).map((rec, i) => (
                         <div key={i} className="flex justify-between items-center p-3 bg-white shadow-sm rounded-xl font-black border border-gray-200">
                           <span className="text-gray-400 text-[10px] truncate max-w-[120px]">{rec.mName}</span>
                           <span className="text-[#FF9800] text-sm leading-none">
                             {rec.x}g / {rec.y}mm
                           </span>
                         </div>
                       ))
                     ) : (
                       <p className="text-center text-gray-400 py-10">データがありません</p>
                     )}
                   </div>
                 </>
               ) : (
                 <>
                   <div className="h-44 mb-4 bg-gray-50/50 rounded-2xl p-4 shrink-0">
                     <ResponsiveContainer width="100%" height="100%">
                       <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                         <XAxis type="category" dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                         <YAxis type="number" dataKey="val" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                         <ZAxis type="number" range={[100, 100]} />
                         <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                             if (active && payload && payload.length) {
                               const unit = selectedAnalysis.label.includes("体重") ? "g" :
                                            selectedAnalysis.label.includes("期間") || selectedAnalysis.label.includes("寿命") ? "日" :
                                            selectedAnalysis.label.includes("サイズ") ? "mm" :
                                            selectedAnalysis.label.includes("卵") ? "個" : "頭";
                               return <div className="bg-white/90 p-2 rounded-lg text-[10px] font-bold shadow-xl">
                                 <p>{payload[0].payload.name}</p>
                                 <p className="text-[#FF9800] text-sm font-black">
                                   {payload[0].value}{unit}
                                 </p>
                               </div>;
                             }
                             return null;
                           }} />
                         <Scatter
                           data={(selectedAnalysis.records || []).filter(r => r.gender === viewGender).map(r => ({ name: r.mName, val: r.val, entryId: r.entryId }))}
                           fill={viewGender === "オス" ? "#E67E22" : viewGender === "メス" ? "#EC407A" : "#D35400"}
                           style={{ cursor: "pointer" }}
                           onClick={(d: any) => { if (d?.entryId) { setSelectedEntry(entries.find(e => e.id === d.entryId) || null); setSelectedAnalysis(null); } }}
                         />
                       </ScatterChart>
                     </ResponsiveContainer>
                   </div>

                   <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
                     {(selectedAnalysis.records || []).filter(r => r.gender === viewGender).length > 0 ? (
                       sortRecords(selectedAnalysis.records || []).filter(r => r.gender === viewGender).map((rec, i) => (
                       <div key={i} className="flex justify-between items-center p-4 bg-white shadow-sm rounded-xl font-black border border-gray-200">
                          <span className="text-gray-400 text-[10px] truncate max-w-[120px]">{rec.mName}</span> {/* Keep gray for subtle text */}
                          <span className="text-[#FF9800] text-lg leading-none">{rec.val}<span className="text-xs ml-0.5 font-bold">
                            {selectedAnalysis.label.includes("体重") ? "g" :
                             selectedAnalysis.label.includes("期間") || selectedAnalysis.label.includes("寿命") ? "日" :
                             selectedAnalysis.label.includes("サイズ") ? "mm" :
                             selectedAnalysis.label.includes("卵") ? "個" : "頭"}
                          </span></span>
                       </div>
                     ))
                     ) : (
                       <p className="text-center text-gray-400 py-10">データがありません</p>
                     )}
                   </div>
                 </>
               )}

               <button onClick={() => setSelectedAnalysis(null)} className="w-full py-4 text-center text-base text-white bg-[#FF9800] font-black rounded-2xl shadow-lg shrink-0 active:scale-95 transition-all">
                 確認しました
               </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 産卵セット エクセル風テーブルモーダル */}
      <AnimatePresence>
        {selectedSpawnTable && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSpawnTable(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white p-6 rounded-[32px] w-full max-w-lg max-h-[80vh] shadow-2xl relative z-10 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xl text-[#4A3F35]">産卵セット記録: {selectedSpawnTable.japaneseName}</h3>
                <button onClick={() => setSelectedSpawnTable(null)} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button>
              </div>

              <button 
                onClick={() => {
                  setSelectedSpawnTable(null);
                  if (onAddSpawnTemplate) onAddSpawnTemplate({
                    japaneseName: selectedSpawnTable.japaneseName,
                    scientificName: selectedSpawnTable.scientificName,
                  });
                }}
                className="mb-4 w-full flex items-center justify-center gap-2 py-3 bg-[#FF9800] text-white rounded-2xl text-xs font-black shadow-lg active:scale-95 transition-all"
              >
                <PlusCircle size={16} /> 新しいセットを見本として入力
              </button>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {selectedSpawnTable.spawnSetEntries.sort((a,b) => b.setDate.localeCompare(a.setDate)).map((s) => {
                  const totalRecovery = (s.eggCount || 0) + (s.larvaCount || 0);
                  return (
                    <div 
                      key={s.id} 
                      className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 active:bg-gray-100 transition-all cursor-pointer"
                      onClick={() => { setSelectedEntry(s); setSelectedSpawnTable(null); }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-gray-800">{s.managementName || "管理名なし"}</div>
                          <div className="text-[10px] text-gray-400 font-medium">
                            {s.setDate.replace(/-/g, "/")} 〜 {s.setEndDate?.replace(/-/g, "/") || "継続中"}
                          </div>
                        </div>
                        <div className="bg-[#FF9800] text-white px-2 py-1 rounded-lg text-[10px] font-black shadow-sm">
                          回収計: {totalRecovery}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                        <div className="bg-white/80 p-2 rounded-xl border border-gray-50">
                          <span className="text-gray-400 block text-[9px] uppercase font-bold mb-0.5">使用マット</span>
                          <span className="font-bold text-gray-700 truncate block">{s.substrate || "-"}</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-xl border border-gray-50">
                          <span className="text-gray-400 block text-[9px] uppercase font-bold mb-0.5">温度</span>
                          <span className="font-bold text-gray-700">{s.temperature ? `${s.temperature}℃` : "-"}</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-xl border border-gray-50">
                          <span className="text-gray-400 block text-[9px] uppercase font-bold mb-0.5">詰圧 / 水分</span>
                          <span className="font-bold text-gray-700">{s.pressure || "-"} / {s.moisture}</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-xl border border-gray-50">
                          <span className="text-gray-400 block text-[9px] uppercase font-bold mb-0.5">同居</span>
                          <span className="font-bold text-gray-700">{s.cohabitation}</span>
                        </div>
                      </div>

                      {s.memo && (
                        <div className="bg-white/50 p-2 rounded-xl border border-gray-50 mb-3">
                          <span className="text-gray-400 block text-[9px] uppercase font-bold mb-0.5">備考メモ</span>
                          <p className="text-gray-600 line-clamp-2 text-[10px] leading-relaxed italic">{s.memo}</p>
                        </div>
                      )}

                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedSpawnTable(null); 
                          if (onAddSpawnTemplate) onAddSpawnTemplate({
                            japaneseName: s.japaneseName,
                            scientificName: s.scientificName,
                            locality: s.locality,
                            generation: s.generation,
                            substrate: s.substrate,
                            containerSize: s.containerSize,
                            pressure: s.pressure,
                            moisture: s.moisture,
                            temperature: s.temperature,
                            cohabitation: s.cohabitation,
                            memo: s.memo,
                          });
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-[#FF9800]/10 text-[#FF9800] rounded-xl text-[10px] font-black active:scale-95 transition-all"
                      >
                        <PlusCircle size={14} /> この内容を見本として新規登録
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-[10px] text-gray-400 font-bold text-center italic">行をタップして詳細データへジャンプ</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <section className="bg-white/80 backdrop-blur-md p-6 rounded-[24px] border border-white/60 shadow-sm mt-8">
        <h3 className="text-[10px] font-black text-[#D7CCC8] uppercase tracking-widest mb-4">Storage Management</h3>
        <div className="mb-4 p-4 bg-white/40 rounded-2xl border border-white/60 flex items-center justify-between">
          <div className="text-[10px] font-bold text-gray-600">
            {isPersisted ? "✅ 永続ストレージ有効" : "⚠️ 削除される可能性があります"}
          </div>
          {!isPersisted && <button onClick={requestPersistence} className="text-[10px] bg-[#FF9800] text-white px-3 py-1 rounded-full font-bold">有効化</button>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleSync} 
            disabled={isSyncing}
            className="col-span-2 flex items-center justify-center gap-2 bg-[#FF9800] text-white py-3 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
          >
            <Upload size={14} /> 
            {isSyncing ? "同期中..." : "GitHubへデータを同期"}
          </button>
          <button onClick={handleExport} className="flex items-center justify-center gap-2 bg-white/80 py-3 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all"><Download size={14} /> 書き出し</button>
          <label className="flex items-center justify-center gap-2 bg-white/80 py-3 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"><Upload size={14} /> 読み込み<input type="file" hidden onChange={handleImport} accept=".json" /></label>
        </div>
      </section>
    </div>
  );
}

function AnalysisItem({ label, value, onClick, isLink }: { label: string; value: string; onClick?: () => void; isLink?: boolean }) {
  return (
    <div onClick={onClick} className={`p-4 rounded-2xl bg-white/40 border border-white/60 flex flex-col justify-center ${onClick ? "cursor-pointer active:bg-white/60 transition-colors" : ""}`}> {/* Keep white/40 for background */}
      <div className="text-[12px] font-bold text-[#D7CCC8] uppercase mb-2 tracking-wider">{label}</div>
      <div className={`text-[17px] font-black leading-tight ${isLink ? "text-[#FF9800] underline decoration-dotted underline-offset-4" : "text-gray-800"}`}>{value}</div>
    </div>
  );
}
