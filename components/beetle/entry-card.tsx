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

  return (
    <article className="card beetle-card" onClick={() => onOpen(entry)}>
      <div className="beetle-card-top">
        <div>
          <h3>{entry.japaneseName}</h3>
          <p>{entry.scientificName}</p>
        </div>
        <span className="stage-chip">{entry.type}</span>
      </div>
      <dl className="info-grid">
        <div>
          <dt>産地</dt>
          <dd>{entry.locality || "-"}</dd>
        </div>
        <div>
          <dt>累代</dt>
          <dd>{buildGenerationLabel(entry.generation)}</dd>
        </div>
      </dl>
      <div className="beetle-card-actions">
        <button
          type="button"
          className="icon-button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit(entry);
          }}
        >
          <Edit3 size={18} />
        </button>
        <button
          type="button"
          className="icon-button danger"
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
