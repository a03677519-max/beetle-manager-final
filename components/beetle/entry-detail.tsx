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
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-t-3xl p-6 shadow-2xl h-[90vh] overflow-y-auto z-10 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white/90 backdrop-blur-sm z-10 py-2">
          <div>
            <h2 className="text-2xl font-bold">{entry.japaneseName}</h2>
            <p className="font-serif italic text-gray-500">{entry.scientificName}</p>
          </div>
          <button type="button" className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-800" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <PhotoSection entry={entry} />

        <div className="mt-6 mb-20">
          {entry.type === "成虫" ? <AdultDetail entry={entry} /> : null}
          {entry.type === "幼虫" ? (
            <LarvaDetail
              entry={entry}
              onFetchTemperature={onFetchTemperature}
              isFetchingTemperature={isFetchingTemperature}
            />
          ) : null}
          {entry.type === "産卵セット" ? <SpawnSetDetail entry={entry} /> : null}
        </div>

        <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-md border-t z-20">
          <button className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg">
            作業を記録
          </button>
        </div>
      </div>
    </div>
  );
}
