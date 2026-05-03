"use client";

import { useMemo } from "react";
import { EyeOff } from "lucide-react";
import type { BeetleEntry, LarvaBeetle } from "@/types/beetle";
import { daysBetween, today } from "@/lib/utils";

type SortKey = "urgency" | "type" | "days" | "name";

interface TaskViewProps {
  entries: BeetleEntry[];
  skippedTaskIds: string[];
  setSkippedTaskIds: (ids: string[]) => void;
  taskSortConfig: { primary: SortKey; secondary: SortKey };
  setTaskSortConfig: (config: { primary: SortKey; secondary: SortKey }) => void;
  setSelectedEntry: (entry: BeetleEntry | null) => void;
  handleQuickExchange: (e: React.MouseEvent, entry: LarvaBeetle) => void;
  handlePromoteToAdult: (e: React.MouseEvent, entry: LarvaBeetle) => void;
}

export function TaskView({ 
  entries, skippedTaskIds, setSkippedTaskIds, taskSortConfig, setTaskSortConfig, 
  setSelectedEntry, handleQuickExchange, handlePromoteToAdult 
}: TaskViewProps) {
  const { groupedTasks, totalCount } = useMemo(() => {
    const visibleEntries = entries.filter((e) => !skippedTaskIds.includes(e.id));
    const exchangeTasks = visibleEntries
      .filter((e): e is LarvaBeetle => e.type === "幼虫")
      .map(e => {
        const lastExchange = e.logs[0]?.date || e.createdAt;
        const daysSinceExchange = daysBetween(lastExchange, today()) ?? 0;
        return { entry: e, days: daysSinceExchange, type: "exchange" as const };
      })
      .filter(t => t.days >= 60);

    const emergenceTasks = visibleEntries
      .filter((e): e is LarvaBeetle => e.type === "幼虫" && !!e.actualEmergenceDate)
      .map(e => ({ entry: e, days: daysBetween(today(), e.actualEmergenceDate) ?? 0, type: "emergence" as const }))
      .filter(t => t.days <= 14 && t.days >= -7);

    const allTasks = [...exchangeTasks, ...emergenceTasks];
    
    const groups: Record<string, { sciName: string, japaneseName: string, items: typeof allTasks }> = {};
    allTasks.forEach(task => {
      const key = task.entry.scientificName || "Unknown";
      if (!groups[key]) {
        groups[key] = {
          sciName: key,
          japaneseName: task.entry.japaneseName || "不明",
          items: []
        };
      }
      groups[key].items.push(task);
    });

    const getVal = (item: typeof allTasks[0], key: SortKey) => {
      if (key === 'urgency') return item.type === 'emergence' ? (item.days <= 0 ? 3 : 1) : (item.days >= 90 ? 3 : 2);
      if (key === 'type') return item.type === 'emergence' ? 1 : 2;
      if (key === 'days') return item.days;
      return 0;
    };

    const getStrVal = (item: typeof allTasks[0], key: SortKey) => {
      if (key === 'name') return (item.entry.managementName as string) ?? "";
      return "";
    };

    Object.values(groups).forEach(group => {
      group.items.sort((a, b) => {
        const compare = (key: SortKey) => {
          if (key === 'name') return getStrVal(a, key).localeCompare(getStrVal(b, key));
          return getVal(a, key) - getVal(b, key);
        };
        
        const v1 = compare(taskSortConfig.primary);
        if (v1 !== 0) return v1;
        return compare(taskSortConfig.secondary);
      });
    });

    const sortedGroups = Object.values(groups).sort((a, b) => {
      return b.items.length - a.items.length;
    });

    return {
      groupedTasks: sortedGroups,
      totalCount: allTasks.length
    };
  }, [entries, taskSortConfig, skippedTaskIds]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tasks ({totalCount})</h3>
          {skippedTaskIds.length > 0 && <button onClick={() => setSkippedTaskIds([])} className="text-[9px] font-bold text-[#D7CCC8] bg-[#D7CCC8]/10 px-2 py-0.5 rounded-full">スキップ解除</button>}
        </div>
        {/* ソートUIの変更が必要 */}
        <div className="flex flex-col gap-1">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {(["urgency", "type", "days", "name"] as SortKey[]).map((k) => (
              <button key={k} onClick={() => setTaskSortConfig({...taskSortConfig, primary: k})} className={`px-2 py-0.5 text-[8px] font-black rounded-md ${taskSortConfig.primary === k ? "bg-[#FF9800] text-white" : "bg-white text-gray-400"}`}>
                P: {k}
              </button>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {(["urgency", "type", "days", "name"] as SortKey[]).map((k) => (
              <button key={k} onClick={() => setTaskSortConfig({...taskSortConfig, secondary: k})} className={`px-2 py-0.5 text-[8px] font-black rounded-md ${taskSortConfig.secondary === k ? "bg-[#FF9800] text-white" : "bg-white text-gray-400"}`}>
                S: {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="bg-white/40 backdrop-blur-md p-10 rounded-[32px] border border-white/60 text-center">
          <p className="text-gray-400 text-sm font-medium">現在対応が必要な個体はいません</p>
        </div>
      ) : (
        groupedTasks.map(group => (
          <div key={group.sciName} className="mb-6">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-[11px] font-black text-[#8B7D7B] uppercase tracking-wider">{group.japaneseName}</span>
              <span className="text-[9px] font-bold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">{group.items.length}</span>
            </div>
            <div className="space-y-3">
              {group.items.map(({ entry, days, type }) => (
                <div key={`${entry.id}-${type}`} onClick={() => setSelectedEntry(entry)} className="bg-white/80 backdrop-blur-sm p-4 rounded-[24px] border border-white/60 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-10 rounded-full ${type === 'emergence' ? 'bg-[#EC407A]' : (days >= 90 ? 'bg-[#E74C3C]' : 'bg-[#F1C40F]')}`} />
                    <div>
                      <div className="font-bold text-[#333D33] text-sm">{entry.managementName || entry.japaneseName}</div>
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                        {type === 'emergence' 
                          ? (days === 0 ? "今日羽化予定" : (days > 0 ? `あと${days}日で羽化` : `${Math.abs(days)}日前に羽化`))
                          : `${days}日間未交換`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setSkippedTaskIds([...skippedTaskIds, entry.id]); }} className="p-2 text-gray-300"><EyeOff size={14} /></button>
                    {type === "exchange" && (
                      <button onClick={(e) => handleQuickExchange(e, entry)} className="text-[10px] font-black bg-[#FB8C00] text-white px-4 py-2 rounded-full shadow-lg active:scale-95 transition-all">交換</button>
                    )}
                    {type === "emergence" && days <= 0 && (
                      <button onClick={(e) => handlePromoteToAdult(e, entry)} className="text-[10px] font-black bg-[#F4511E] text-white px-4 py-2 rounded-full shadow-lg active:scale-95 transition-all">成虫へ</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
