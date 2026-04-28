"use client";

import { X } from "lucide-react";
import type { BeetleEntry } from "@/types/beetle";
import { AdultDetail } from "./adult-detail";
import { LarvaDetail } from "./larva-detail";
import { SpawnSetDetail } from "./spawn-set-detail";
import { PhotoSection } from "./photo-section";

export function EntryDetail({
  entry,
  onClose,
  onFetchTemperature,
  isFetchingTemperature,
}: {
  entry: BeetleEntry;
  onClose: () => void;
  onFetchTemperature: (setter: (value: string) => void) => void;
  isFetchingTemperature: boolean;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{entry.japaneseName}</h2>
            <p>{entry.scientificName}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {entry.type === "成虫" ? <AdultDetail entry={entry} /> : null}
        {entry.type === "幼虫" ? (
          <LarvaDetail
            entry={entry}
            onFetchTemperature={onFetchTemperature}
            isFetchingTemperature={isFetchingTemperature}
          />
        ) : null}
        {entry.type === "産卵セット" ? <SpawnSetDetail entry={entry} /> : null}
        <PhotoSection entry={entry} />
      </div>
    </div>
  );
}
