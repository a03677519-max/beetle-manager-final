"use client";

import { motion } from "framer-motion";
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
    <motion.div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-3xl p-6 shadow-2xl h-[90dvh] overflow-y-auto z-10 w-full max-w-md mx-auto overscroll-contain pointer-events-auto"
      >
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white/90 backdrop-blur-sm z-10 h-[48px] border-b border-gray-50">
          <div className="text-left">
            <h2 className="text-[18px] font-bold text-[#212529]">{entry.japaneseName}</h2>
            <p className="text-[12px] font-serif italic text-gray-400">{entry.scientificName}</p>
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

        <div className="fixed bottom-0 left-0 w-full p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white/90 backdrop-blur-md border-t z-20">
          <button className="w-full bg-[#2D5A27] text-white font-bold h-[52px] rounded-2xl shadow-lg active:scale-[0.98] transition-all">
            作業を記録
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
