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
      className="card cursor-pointer hover:shadow-lg transition-shadow duration-300" 
      onClick={() => onOpen(entry)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-heading">{entry.japaneseName}</h3>
          <p className="text-body italic">{entry.scientificName}</p>
        </div>
        <span className="text-[12px] h-[24px] flex items-center px-3 rounded-full bg-gray-100 text-[var(--text-secondary)]">
          {entry.type}
        </span>
      </div>
      
      <div className="flex justify-between items-end mt-4">
        <dl className="text-body">
          <div>
            <span className="text-muted">産地:</span> {entry.locality || "-"}
          </div>
          <div>
            <span className="text-muted">累代:</span> {buildGenerationLabel(entry.generation)}
          </div>
        </dl>
        
        {latestWeight && (
          <div className="text-right">
            <div className="text-[20px] font-bold text-[var(--primary)]">{latestWeight}g</div>
          </div>
        )}
      </div>
    </article>
  );
}
