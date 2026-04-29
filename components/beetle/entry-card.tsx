"use client";

import { Edit3, Trash2 } from "lucide-react";
import { buildGenerationLabel } from "@/components/entry-fields";
import { useBeetleStore } from "@/store/use-beetle-store";
import type { BeetleEntry } from "@/types/beetle";

export function EntryCard({
  entry,
  onEdit,
  onOpen,
}: {
  entry: BeetleEntry;
  onEdit: (entry: BeetleEntry) => void;
  onOpen: (entry: BeetleEntry) => void;
}) {
  const deleteEntry = useBeetleStore((state) => state.deleteEntry);

  const latestWeight = entry.type === "幼虫" && entry.logs.length > 0 ? entry.logs[0].weight : null;

  return (
    <article 
      className="bg-[var(--card-bg)] rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-[var(--border)] mb-4 cursor-pointer hover:shadow-md transition-shadow" 
      onClick={() => onOpen(entry)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-[var(--text)] text-base">{entry.japaneseName}</h3>
          <p className="text-xs text-[var(--text)]/60 font-serif italic">{entry.scientificName}</p>
        </div>
        <span className="text-[11px] h-[22px] flex items-center px-2 rounded-full bg-gray-100 text-gray-800">
          {entry.type}
        </span>
      </div>
      
      <div className="flex justify-between items-end">
        <dl className="text-xs text-[var(--text)]/70">
          <div>
            <span className="text-[var(--text)]/50">産地:</span> {entry.locality || "-"}
          </div>
          <div>
            <span className="text-[var(--text)]/50">累代:</span> {buildGenerationLabel(entry.generation)}
          </div>
        </dl>
        
        {latestWeight && (
          <div className="text-right">
            <div className="text-[var(--primary)] text-[20px] font-bold">{latestWeight}g</div>
          </div>
        )}
      </div>
    </article>
  );
}
