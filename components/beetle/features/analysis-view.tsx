"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Download, Upload, X, FileSpreadsheet, BarChart3, ExternalLink } from "lucide-react";
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
}

interface AnalysisRecord {
  val: number;
  mName: string;
  gender: Gender;
  entryId: string;
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
  isSyncing
}: AnalysisViewProps) {
  const [expandedNames, setExpandedNames] = useState<string[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<{ label: string; records: AnalysisRecord[] } | null>(null);
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
          lifespanRecords: []
        };
      }
      if (entry.type === "産卵セット") {
        if (entry.temperature) groups[key].temperatures.push(Number(entry.temperature));
        groups[key].spawnSetEntries.push(entry);
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
      }
    });
    return Object.values(groups).map((group) => ({
      ...group,
      maxWeight: group.weightRecords.length ? Math.max(...group.weightRecords.map(r => r.val)) : null,
      minWeight: group.weightRecords.length ? Math.min(...group.weightRecords.map(r => r.val)) : null,
      avgLarva: group.larvaRecords.length ? Math.round(group.larvaRecords.reduce((a, b) => a + b.val, 0) / group.larvaRecords.length) : null,
      avgDormancy: group.dormancyRecords.length ? Math.round(group.dormancyRecords.reduce((a, b) => a + b.val, 0) / group.dormancyRecords.length) : null,
      avgLifespan: group.lifespanRecords.length ? Math.round(group.lifespanRecords.reduce((a, b) => a + b.val, 0) / group.lifespanRecords.length) : null,
    }));
  }, [entries]);

  return (
    <div className="space-y-4">
      {groupedStats.map((stat) => (
        <div 
          key={stat.scientificName} 
          ref={(el) => { itemRefs.current[stat.scientificName] = el; }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden scroll-mt-48"
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
                      <p className="text-xl font-black text-[#4A3F35]">{stat.minWeight !== null ? `${stat.minWeight}g` : "-"}</p>
                    </div>
                    <div className="h-8 w-[1px] bg-gray-200" />
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-400 mb-1">MAX</p>
                      <p className="text-2xl font-black text-[var(--primary)]">{stat.maxWeight !== null ? `${stat.maxWeight}g` : "-"}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedAnalysis({ label: "体重計測履歴", records: stat.weightRecords })}
                    className="w-full mt-4 py-2.5 text-[#FF9800] bg-white/80 border border-white rounded-xl shadow-sm active:scale-95 transition-all"
                  >
                    履歴を詳しく見る
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                <AnalysisItem label="産卵方法" value={stat.spawnSetEntries.length > 0 ? `${stat.spawnSetEntries.length}件の記録` : "-"} onClick={() => setSelectedSpawnTable(stat as any)} isLink />
                <AnalysisItem label="平均休眠期間" value={stat.avgDormancy ? `${stat.avgDormancy}日` : "-"} onClick={() => setSelectedAnalysis({ label: "休眠期間データ", records: stat.dormancyRecords })} isLink />
                <AnalysisItem label="平均寿命" value={stat.avgLifespan ? `${stat.avgLifespan}日` : "-"} onClick={() => setSelectedAnalysis({ label: "生存期間データ", records: stat.lifespanRecords })} isLink />
                <AnalysisItem label="平均幼虫期間" value={stat.avgLarva ? `${stat.avgLarva}日` : "-"} onClick={() => setSelectedAnalysis({ label: "幼虫期間データ", records: stat.larvaRecords })} isLink />
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
               <h3 className="font-black text-2xl mb-8 text-[#333D33] tracking-tight">{selectedAnalysis.label}</h3>

               <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
                 {(["オス", "メス", "不明"] as const).map((g) => (
                   <button key={g} onClick={() => setViewGender(g)} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${viewGender === g ? "bg-white text-[var(--primary)] shadow-sm" : "text-gray-400"}`}>{g}</button>
                 ))} {/* text-[var(--primary)] will be handled by global CSS variable or direct replacement */}
               </div>
               
               <div className="h-48 mb-6 bg-gray-50/50 rounded-3xl p-4">
                 <ResponsiveContainer width="100%" height="100%">
                   <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                     <XAxis type="category" dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                     <YAxis type="number" dataKey="val" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                     <ZAxis type="number" range={[100, 100]} />
                     <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                         if (active && payload && payload.length) {
                           return <div className="bg-white/90 p-2 rounded-lg text-[10px] font-bold shadow-xl">
                             <p>{payload[0].payload.name}</p>
                             <p className="text-[#FF9800] text-sm font-black">
                               {payload[0].value}{selectedAnalysis.label.includes("体重") ? "g" : "日"}
                             </p>
                           </div>;
                         }
                         return null;
                       }} />
                     <Scatter 
                       data={sortRecords(selectedAnalysis.records).filter(r => r.gender === viewGender).map(r => ({ name: r.mName, val: r.val, entryId: r.entryId }))} 
                       fill={viewGender === "オス" ? "#E67E22" : viewGender === "メス" ? "#EC407A" : "#D35400"} 
                       style={{ cursor: "pointer" }}
                       onClick={(d: any) => { if (d?.entryId) { setSelectedEntry(entries.find(e => e.id === d.entryId) || null); setSelectedAnalysis(null); } }}
                     />
                   </ScatterChart>
                 </ResponsiveContainer>
               </div>

               <div className="max-h-[30dvh] overflow-y-auto space-y-3 mb-10 pr-2 custom-scrollbar">
                 {selectedAnalysis.records.filter(r => r.gender === viewGender).length > 0 ? (
                   sortRecords(selectedAnalysis.records).filter(r => r.gender === viewGender).map((rec, i) => (
                   <div key={i} className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl font-black border border-gray-100">
                      <span className="text-gray-400 text-[10px] truncate max-w-[120px]">{rec.mName}</span> {/* Keep gray for subtle text */}
                      <span className="text-[#FF9800] text-xl leading-none">{rec.val}<span className="text-xs ml-0.5 font-bold">{selectedAnalysis.label.includes("体重") ? "g" : "日"}</span></span>
                   </div>
                 ))
                 ) : (
                   <p className="text-center text-gray-400 py-10">データがありません</p>
                 )}
               </div>

               <button onClick={() => setSelectedAnalysis(null)} className="w-full py-5 text-center text-base text-white bg-[#FF9800] font-black rounded-3xl shadow-[0_10px_20px_rgba(255,152,0,0.2)] active:scale-95 transition-all">
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
              
              <div className="flex-1 overflow-auto border border-gray-100 rounded-xl">
                <table className="w-full text-[11px] border-collapse bg-white">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr className="border-b border-gray-200">
                      <th className="p-2 text-left font-black text-gray-500 whitespace-nowrap">管理名</th>
                      <th className="p-2 text-left font-black text-gray-500 whitespace-nowrap">セット日</th>
                      <th className="p-2 text-left font-black text-gray-500 whitespace-nowrap">産卵方法</th>
                      <th className="p-2 text-left font-black text-gray-500 whitespace-nowrap">温度</th>
                      <th className="p-2 text-center font-black text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedSpawnTable.spawnSetEntries.sort((a,b) => b.setDate.localeCompare(a.setDate)).map((s) => (
                      <tr 
                        key={s.id} 
                        className="active:bg-gray-50 cursor-pointer"
                        onClick={() => { setSelectedEntry(s); setSelectedSpawnTable(null); }}
                      >
                        <td className="p-3 font-bold text-gray-800">{s.managementName || "-"}</td> {/* Keep dark gray for readability */}
                        <td className="p-3 text-gray-500">{s.setDate.replace(/-/g, "/")}</td>
                        <td className="p-3 text-gray-600 font-medium">{s.substrate || "-"}</td>
                        <td className="p-3 text-gray-600">{s.temperature ? `${s.temperature}℃` : "-"}</td>
                        <td className="p-3 text-right"> {/* text-[var(--primary)] will be handled */}
                          <div className="w-6 h-6 bg-[#FF9800]/10 text-[#FF9800] rounded-full flex items-center justify-center mx-auto">
                            <ExternalLink size={12} />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {selectedSpawnTable.spawnSetEntries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-10 text-center text-gray-400 font-bold">データがありません</td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
