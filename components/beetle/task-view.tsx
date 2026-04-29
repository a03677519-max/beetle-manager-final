"use client";

import { useMemo } from "react";
import { EyeOff } from "lucide-react";
import type { BeetleEntry, LarvaBeetle } from "@/types/beetle";
import { daysBetween, today } from "@/lib/utils";

interface TaskViewProps {
  entries: BeetleEntry[];
  skippedTaskIds: string[];
  setSkippedTaskIds: (ids: string[]) => void;
  taskSortType: "urgency" | "type";
  setTaskSortType: (type: "urgency" | "type") => void;
  setSelectedEntry: (entry: BeetleEntry | null) => void;
  handleQuickExchange: (e: React.MouseEvent, entry: LarvaBeetle) => void;
  handlePromoteToAdult: (e: React.MouseEvent, entry: LarvaBeetle) => void;
}

export function TaskView({ 
  entries, skippedTaskIds, setSkippedTaskIds, taskSortType, setTaskSortType, 
  setSelectedEntry, handleQuickExchange, handlePromoteToAdult 
}: TaskViewProps) {
  const tasks = useMemo(() => {
    const visibleEntries = entries.filter((e) => !skippedTaskIds.includes(e.id));
    const exchangeTasks = visibleEntries
      .filter((e): e is LarvaBeetle => e.type === "幼虫")
      .map(e => ({ entry: e, days: daysBetween(e.logs[0]?.date || e.createdAt, today()) ?? 0, type: "exchange" as const }))
      .filter(t => t.days >= 60);
    const emergenceTasks = visibleEntries
      .filter((e): e is LarvaBeetle => e.type === "幼虫" && !!e.actualEmergenceDate)
      .map(e => ({ entry: e, days: daysBetween(today(), e.actualEmergenceDate) ?? 0, type: "emergence" as const }))
      .filter(t => t.days <= 14 && t.days >= -7);

    return [...exchangeTasks, ...emergenceTasks].sort((a, b) => {
      if (taskSortType === "urgency") {
        const pa = a.type === 'emergence' ? (a.days <= 0 ? 3 : 1) : (a.days >= 90 ? 3 : 2);
        const pb = b.type === 'emergence' ? (b.days <= 0 ? 3 : 1) : (b.days >= 90 ? 3 : 2);
        return pb - pa || b.days - a.days;
      }
      return a.type === b.type ? a.entry.japaneseName.localeCompare(b.entry.japaneseName) : (a.type === "emergence" ? -1 : 1);
    });
  }, [entries, taskSortType, skippedTaskIds]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tasks ({tasks.length})</h3>
          {skippedTaskIds.length > 0 && <button onClick={() => setSkippedTaskIds([])} className="text-[9px] font-bold text-[#8B5A2B] bg-[#8B5A2B]/10 px-2 py-0.5 rounded-full">スキップ解除</button>}
        </div>
        <div className="flex bg-white/60 p-1 rounded-xl border border-white/60 backdrop-blur-sm">
          {["urgency", "type"].map((t) => (
            <button key={t} onClick={() => setTaskSortType(t as "urgency" | "type")} className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all uppercase ${taskSortType === t ? "bg-[#2D5A27] text-white" : "text-gray-400"}`}>
              {t === "urgency" ? "緊急度" : "種別"}
            </button>
          ))}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-md p-10 rounded-[32px] border border-white/60 text-center">
          <p className="text-gray-400 text-sm font-medium">現在対応が必要な個体はいません</p>
        </div>
      ) : (
        tasks.map(({ entry, days, type }) => (
          <div key={`${entry.id}-${type}`} onClick={() => setSelectedEntry(entry)} className="bg-white/70 backdrop-blur-sm p-4 rounded-[24px] border border-white/60 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-10 rounded-full ${type === 'emergence' ? 'bg-[#3498DB]' : (days >= 90 ? 'bg-[#E74C3C]' : 'bg-[#F1C40F]')}`} />
              <div>
                <div className="font-bold text-[#212529] text-sm">{entry.japaneseName}</div>
                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                  {type === 'emergence' ? (days === 0 ? "今日羽化予定" : (days > 0 ? `あと${days}日で羽化` : `${Math.abs(days)}日前に羽化`)) : `${days}日間未交換`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); setSkippedTaskIds([...skippedTaskIds, entry.id]); }} className="p-2 text-gray-300"><EyeOff size={14} /></button>
              {type === "exchange" && (
                <button onClick={(e) => handleQuickExchange(e, entry)} className="text-[10px] font-black bg-[#2D5A27] text-white px-4 py-2 rounded-full shadow-lg active:scale-95 transition-all">交換</button>
              )}
              {type === "emergence" && days <= 0 && (
                <button onClick={(e) => handlePromoteToAdult(e, entry)} className="text-[10px] font-black bg-[#8B5A2B] text-white px-4 py-2 rounded-full shadow-lg active:scale-95 transition-all">成虫へ</button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}