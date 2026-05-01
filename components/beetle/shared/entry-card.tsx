"use client";

import { StatusBadge, Stage } from "@/components/ui/status-badge";
import { GrowthBar } from "@/components/ui/growth-bar";
import { buildGenerationLabel } from "@/components/entry-fields";
import type { BeetleEntry } from "@/types/beetle";
import { daysBetween, today } from "@/lib/utils";
import Image from "next/image";
import { Trash2 } from "lucide-react";

export function EntryCard({
  entry,
  onOpen,
  onDelete,
  isSelectionMode = false,
  isSelected = false,
  viewMode = "list",
}: {
  entry: BeetleEntry;
  onOpen: (entry: BeetleEntry) => void;
  onDelete?: (e: React.MouseEvent, id: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  viewMode?: "list" | "grid";
}) {
  const logs = entry.type === "幼虫" ? entry.logs : [];
  const latestWeight = logs.length > 0 ? logs[0].weight : null;
  const prevWeight = logs.length > 1 ? logs[1].weight : null;
  const weightDiff = latestWeight && prevWeight ? latestWeight - prevWeight : 0;

  // エサ交換アラート（信号機）
  const lastLogDate = logs.length > 0 ? logs[0].date : entry.createdAt;
  const diffDays = daysBetween(lastLogDate, today()) ?? 0;

  const nextDate = (entry as any).nextExchangeDate;
  const daysToNext = nextDate ? daysBetween(today(), nextDate) : null;

  let dateColor = "text-[#FF9800]"; // 明るいオレンジ (既に暖色)
  if (nextDate) {
    if (daysToNext! <= 0) dateColor = "text-[#E74C3C]";
    else if (daysToNext! <= 14) dateColor = "text-[#F1C40F]";
  } else {
    if (diffDays >= 90) dateColor = "text-[#E74C3C]"; // 赤
    else if (diffDays >= 60) dateColor = "text-[#F1C40F]"; // 黄
  }

  const stageMap: Record<string, Stage> = { "成虫": "成虫", "幼虫": "幼虫", "産卵セット": "卵" };
  const stage = stageMap[entry.type] || "卵";

  if (viewMode === "grid") {
    return (
      <article 
        className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.97] transition-all relative"
        onClick={() => onOpen(entry)}
      >
        {entry.photos[0] && (
          <div className="relative aspect-square w-full">
            <Image src={entry.photos[0]} alt={entry.japaneseName} fill className="object-cover" unoptimized />
            <div className="absolute top-2 right-2">
              <StatusBadge stage={stage} />
            </div>
          </div>
        )}
        <div className="p-3">
          <h3 className="font-bold text-gray-800 text-sm truncate">{entry.japaneseName}</h3>
          {latestWeight && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-primary font-bold">{latestWeight}g</span>
              <span className={`text-[10px] ${dateColor}`}>あと{Math.max(0, 90 - diffDays)}日</span>
            </div>
          )}
        </div>
        {onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(e, entry.id); }} className="absolute bottom-2 right-2 p-1.5 bg-black/50 text-white rounded-full">
            <Trash2 size={14} />
          </button>
        )}
      </article>
    );
  }

  return (
    <article
      className={`flex bg-white/80 backdrop-blur-md rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer active:scale-[0.98] active:opacity-90 transition-all duration-200 select-none touch-manipulation relative overflow-hidden mb-4 border ${isSelected ? "border-[#FF9800] ring-2 ring-[#FF9800]/20" : "border-white/50"}`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(entry);
      }}
    >
      {isSelectionMode && (
        <div className="absolute top-4 left-4 z-20">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isSelected ? "bg-[#FF9800] border-[#FF9800]" : "bg-white border-gray-200"}`}>
            {isSelected && <div className="w-2.5 h-1 border-l-2 border-b-2 border-white -rotate-45 mb-0.5" />}
          </div>
        </div>
      )}

      {entry.photos[0] && (
        <div className={`relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden mr-4 shadow-sm transition-all ${isSelectionMode ? "ml-8" : ""}`}>
          <Image src={entry.photos[0]} alt={entry.japaneseName} fill className="object-cover" unoptimized />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mb-0.5">
              <h3 className="text-[18px] font-black text-[#333D33] tracking-tight leading-tight">{entry.japaneseName}</h3>
              {entry.type === "成虫" && (
                <span className={`text-sm font-bold ${entry.gender === "オス" ? "text-blue-500" : entry.gender === "メス" ? "text-pink-500" : "text-gray-400"}`}>
                  {entry.gender === "オス" ? "♂" : entry.gender === "メス" ? "♀" : ""}
                </span>
              )}
              {entry.managementName && <span className="text-[10px] font-black bg-gray-100 px-2 py-0.5 rounded text-gray-500">{entry.managementName}</span>}
            </div>
            <p className="text-[13px] italic text-[#D7CCC8] opacity-80 leading-tight">{entry.scientificName}</p>
          </div>
          <StatusBadge stage={stage} className="ml-2" />
        </div>
        
        <div className="flex justify-between items-end mt-3">
          <dl className="text-[13px] text-[#8B7D7B] space-y-1">
            {entry.type === "幼虫" && logs[0] && (
              <div className="text-[11px] font-bold text-gray-600 bg-gray-50/80 p-2 rounded-xl mb-2 border border-gray-100">
                <div className="flex gap-2 mb-0.5">
                  <span className="truncate">{logs[0].substrate}</span>
                  <span className="shrink-0">{logs[0].bottleSize}</span>
                </div>
                <div className="text-[9px] text-gray-400 font-normal">
                  水:{logs[0].moisture} 圧:{logs[0].pressure} ステージ:{logs[0].stage}
                </div>
              </div>
            )}
            <div>
              <span className="text-muted">産地:</span> {entry.locality || "-"}
            </div>
            <div>
              <span className="text-muted">累代:</span> {buildGenerationLabel(entry.generation)}
            </div>
            <div className={`text-[11px] font-bold mt-1 ${dateColor}`}>
              {nextDate ? (
                <>予定: {nextDate.replace(/-/g, "/")} {daysToNext! <= 0 ? "(超過)" : `(あと${daysToNext}日)`}</>
              ) : (
                diffDays > 0 ? `${diffDays}日前に交換` : "今日交換"
              )}
            </div>
          </dl>
          
          {latestWeight && (
            <div className="text-right w-1/2">
              <div className="flex flex-col items-end justify-end"> {/* Keep layout */}
              <div className="text-[26px] font-black text-[#FF9800] leading-none tracking-tighter">
                  {latestWeight}<span className="text-[14px] ml-0.5 font-bold">g</span>
                </div>
                <div className="mt-1.5 h-[14px]">
                  {weightDiff !== 0 && (
                    <span className={`text-[12px] font-bold ${weightDiff > 0 ? 'text-[#E74C3C]' : 'text-[#FB8C00]'}`}>
                      {weightDiff > 0 ? `+${weightDiff}g` : `${weightDiff}g`} {weightDiff > 0 ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </div>
              <GrowthBar weight={latestWeight} /> {/* Keep GrowthBar */}
            </div>
          )}
        </div>

        {onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(e, entry.id); }} className="absolute bottom-4 right-4 text-gray-400 hover:text-red-500">
            <Trash2 size={18} />
          </button>
        )}

        {/* スパイクライン */}
        {logs.length > 1 && (
          <div className="absolute right-4 bottom-4 w-24 h-8 opacity-20 pointer-events-none">
              <svg viewBox="0 0 100 40" className="w-full h-full">
              <path // Keep path
                d={`M ${logs.slice(0, 5).reverse().map((l, i) => `${(i * 25)},${40 - (l.weight / 50 * 30)}`).join(' L ')}`}
                fill="none"
                stroke="#FF9800"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
    </article>
  );
}
