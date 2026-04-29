"use client";

import { StatusBadge, Stage } from "@/components/ui/status-badge";
import { GrowthBar } from "@/components/ui/growth-bar";
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
  const stageMap: Record<string, Stage> = { "成虫": "成虫", "幼虫": "幼虫", "産卵セット": "卵" };
  const stage = stageMap[entry.type] || "卵";

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
        <StatusBadge stage={stage} />
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
          <div className="text-right w-1/2">
            <div className="text-[20px] font-bold text-[var(--primary)]">{latestWeight}g</div>
            <GrowthBar weight={parseFloat(latestWeight)} />
          </div>
        )}
      </div>
    </article>
  );
}
