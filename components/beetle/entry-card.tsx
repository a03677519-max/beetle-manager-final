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

  const typeColor = {
    "幼虫": "border-amber-500",
    "成虫": "border-sky-500",
    "産卵セット": "border-rose-500"
  }[entry.type] || "border-gray-200";

  return (
    <article className={`card cursor-pointer hover:shadow-lg transition-shadow border-l-4 ${typeColor} bg-white p-4 rounded-r-lg shadow-sm`} onClick={() => onOpen(entry)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg">{entry.japaneseName}</h3>
          <p className="text-sm text-gray-500 font-serif italic">{entry.scientificName}</p>
        </div>
        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{entry.type}</span>
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
        <div>
          <dt className="text-gray-400">産地</dt>
          <dd>{entry.locality || "-"}</dd>
        </div>
        <div>
          <dt className="text-gray-400">累代</dt>
          <dd>{buildGenerationLabel(entry.generation)}</dd>
        </div>
      </dl>
      <div className="flex justify-end gap-2 border-t pt-4">
        <button
          type="button"
          className="p-2 text-gray-500 hover:text-green-600 transition-colors"
          onClick={(event) => {
            event.stopPropagation();
            onEdit(entry);
          }}
        >
          <Edit3 size={18} />
        </button>
        <button
          type="button"
          className="p-2 text-gray-500 hover:text-red-600 transition-colors"
          onClick={(event) => {
            event.stopPropagation();
            deleteEntry(entry.id);
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </article>
  );
}
