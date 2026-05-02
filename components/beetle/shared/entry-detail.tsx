"use client";

import { motion } from "framer-motion";
import { X, Edit2, Copy, Trash2 } from "lucide-react";
import type { BeetleEntry } from "@/types/beetle";
import { AdultDetail } from "@/components/beetle/adult/adult-detail";
import { LarvaDetail } from "@/components/beetle/larva/larva-detail";
import { SpawnSetDetail } from "@/components/beetle/spawn-set/spawn-set-detail";
import { PhotoSection } from "@/components/beetle/shared/photo-section";
import { useBeetleStore } from "@/store/use-beetle-store";
import { buildGenerationLabel } from "@/components/entry-fields";

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
  const startEditing = useBeetleStore((state) => state.startEditing);
  const deleteEntry = useBeetleStore((state) => state.deleteEntry);

  const copyToClipboard = () => {
    // 実行時にプロパティが存在するか安全に確認するため、拡張した型として扱う
    const e = entry as any;
    const fmtDate = (d: string) => (d || "").replace(/-/g, "/");
    
    // 1-4行目
    let text = `和名 ${e.japaneseName}\n`;
    text += `学名 ${e.scientificName}\n`;
    text += `産地 ${e.locality || ""}\n`;
    
    const displayDate = e.hatchDate || e.setDate || e.createdAt || "";
    text += `累代 ${buildGenerationLabel(e.generation)} ${e.managementName || ""} ${fmtDate(displayDate)}`.trimEnd() + "\n";
    
    // 5行目：空行
    text += `\n`;
    
    // 6-9行目：飼育ログ（最大4件）
    const logs = (e.type === "幼虫" ? e.logs : []).slice(0, 4);
    for (let i = 0; i < 4; i++) {
      if (logs[i]) {
        const log = logs[i];
        text += `${fmtDate(log.date)} ${log.substrate || ""} 水${log.moisture || 0}圧${log.pressure || 0} ${log.bottleSize || ""} ${log.stage || ""} ${log.gender || ""}\n`;
      } else {
        text += `\n`;
      }
    }
    
    // 10行目：羽化・後食
    const eDate = e.actualEmergenceDate || e.emergenceDate || "";
    const fDate = e.feedingDate || "";
    const eType = e.emergenceType || "羽化";
    
    const emergencePart = eDate ? `${fmtDate(eDate)} ${eType}` : "　　　　　　　羽化";
    const feedingPart = fDate ? `${fmtDate(fDate)} 後食` : "　　　　　　　後食";
    text += `${emergencePart} ${feedingPart}`;
    
    navigator.clipboard.writeText(text).then(() => {
      alert("データをコピーしました");
    }).catch(() => {
      alert("コピーに失敗しました");
    });
  };

  const handleDelete = () => {
    if (window.confirm("この個体データを削除してもよろしいですか？")) {
      deleteEntry(entry.id);
      onClose();
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-3xl shadow-2xl h-[90dvh] z-10 w-full max-w-md mx-auto overscroll-contain pointer-events-auto flex flex-col overflow-hidden"
      >
        <div className="flex justify-between items-center p-6 sticky top-0 bg-white/90 backdrop-blur-sm z-10 h-[72px] border-b border-gray-50 shrink-0">
          <div className="text-left">
            <h2 className="text-[18px] font-bold text-[#4A3F35]">{entry.japaneseName}</h2>
            <p className="text-[12px] font-serif italic text-gray-400">{entry.scientificName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-blue-500 transition-colors" 
              onClick={copyToClipboard}
              title="テキストをコピー"
            >
              <Copy size={18} />
            </button>
            <button 
              type="button" 
              className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500 transition-colors" 
              onClick={handleDelete}
              title="削除"
            >
              <Trash2 size={18} />
            </button>
            <button 
              type="button" 
              className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-[#FF9800] transition-colors" 
              onClick={() => { onClose(); startEditing(entry.id); }}
            >
              <Edit2 size={18} />
            </button>
            <button type="button" className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-800" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
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
        </div>

      </motion.div>
    </motion.div>
  );
}
