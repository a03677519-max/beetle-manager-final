"use client";

import { StatusBadge, Stage } from "@/components/ui/status-badge";
import { GrowthBar } from "@/components/ui/growth-bar";
import { buildGenerationLabel } from "@/components/entry-fields";
import { useBeetleStore } from "@/store/use-beetle-store";
import type { BeetleEntry } from "@/types/beetle";
import { daysBetween, today } from "@/lib/utils";
import Image from "next/image";

export function EntryCard({
  entry,
  onEdit,
  onOpen,
  viewMode = "list",
}: {
  entry: BeetleEntry;
  onEdit: (entry: BeetleEntry) => void;
  onOpen: (entry: BeetleEntry) => void;
  viewMode?: "list" | "grid";
}) {
  const deleteEntry = useBeetleStore((state) => state.deleteEntry);

  const logs = entry.type === "幼虫" ? entry.logs : [];
  const latestWeight = logs.length > 0 ? parseFloat(logs[0].weight) : null;
  const prevWeight = logs.length > 1 ? parseFloat(logs[1].weight) : null;
  const weightDiff = latestWeight && prevWeight ? latestWeight - prevWeight : 0;

  // エサ交換アラート（信号機）
  const lastLogDate = logs.length > 0 ? logs[0].date : entry.createdAt;
  const diffDays = daysBetween(lastLogDate, today()) ?? 0;
  let dateColor = "text-[#2D5A27]"; // 緑
  if (diffDays >= 90) dateColor = "text-[#E74C3C]"; // 赤
  else if (diffDays >= 60) dateColor = "text-[#F1C40F]"; // 黄

  const stageMap: Record<string, Stage> = { "成虫": "成虫", "幼虫": "幼虫", "産卵セット": "卵" };
  const stage = stageMap[entry.type] || "卵";

  if (viewMode === "grid") {
    return (
      <article 
        className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.97] transition-all"
        onClick={() => onOpen(entry)}
      >
        <div className="relative aspect-square w-full">
          {entry.photos[0] ? (
            <Image src={entry.photos[0]} alt={entry.japaneseName} fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">No Image</div>
          )}
          <div className="absolute top-2 right-2">
            <StatusBadge stage={stage} />
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-bold text-gray-800 text-sm truncate">{entry.japaneseName}</h3>
          {latestWeight && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-primary font-bold">{latestWeight}g</span>
              <span className={`text-[10px] ${dateColor}`}>あと{Math.max(0, 90 - diffDays)}日</span>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article 
      className="bg-white rounded-[16px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] cursor-pointer active:scale-[0.98] active:opacity-90 transition-all duration-200 select-none touch-manipulation relative overflow-hidden mb-4 border border-[#DEE2E6]/40" 
      onClick={() => onOpen(entry)}
    >
      {/* スパイクライン（背景に溶け込む簡易グラフ） */}
      {logs.length > 1 && (
        <div className="absolute right-0 bottom-0 w-32 h-12 opacity-20 pointer-events-none">
          <svg viewBox="0 0 100 40" className="w-full h-full">
            <path
              d={`M ${logs.slice(0, 5).reverse().map((l, i) => `${(i * 25)},${40 - (parseFloat(l.weight) / 50 * 30)}`).join(' L ')}`}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-[17px] font-black text-[#212529] tracking-tight">{entry.japaneseName}</h3>
          <p className="text-[13px] italic text-[#8B5A2B] opacity-80">{entry.scientificName}</p>
        </div>
        <StatusBadge stage={stage} />
      </div>
      
      <div className="flex justify-between items-end mt-4">
        <dl className="text-[12px] text-[#6C757D] space-y-0.5">
          <div>
            <span className="text-muted">産地:</span> {entry.locality || "-"}
          </div>
          <div>
            <span className="text-muted">累代:</span> {buildGenerationLabel(entry.generation)}
          </div>
          <div className={`text-[11px] font-bold mt-1 ${dateColor}`}>
            {diffDays > 0 ? `${diffDays}日前に交換` : "今日交換"}
          </div>
        </dl>
        
        {latestWeight && (
          <div className="text-right w-1/2">
            <div className="flex flex-col items-end justify-end">
              <div className="text-[24px] font-black text-[#2D5A27] leading-none tracking-tighter">
                {latestWeight}<span className="text-[14px] ml-0.5 font-bold">g</span>
              </div>
              <div className="mt-1.5 h-[14px]">
                {weightDiff !== 0 && (
                  <span className={`text-[12px] font-bold ${weightDiff > 0 ? 'text-[#E74C3C]' : 'text-[#3498DB]'}`}>
                    {weightDiff > 0 ? `+${weightDiff}g` : `${weightDiff}g`} {weightDiff > 0 ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </div>
            <GrowthBar weight={latestWeight} />
          </div>
        )}
      </div>
    </article>
  );
}
