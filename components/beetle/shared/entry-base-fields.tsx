"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Link as LinkIcon } from "lucide-react";
import { Field, GenerationRollField, BottomSheetInput } from "@/components/entry-fields";
import type { AdultFormValues, BeetleEntry } from "@/types/beetle";

export function EntryBaseFields({
  managementName,
  japaneseName,
  scientificName,
  locality,
  generation,
  linkedEntryId,
  allEntries,
  onChange,
}: {
  managementName: string;
  japaneseName: string;
  scientificName: string;
  locality: string;
  generation: AdultFormValues["generation"];
  linkedEntryId?: string;
  allEntries: BeetleEntry[];
  onChange: (patch: {
    managementName?: string;
    japaneseName?: string;
    scientificName?: string;
    locality?: string;
    generation?: AdultFormValues["generation"];
    linkedEntryId?: string;
  }) => void;
}) {
  const [isLinkedSelectOpen, setIsLinkedSelectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const suggestions = useMemo(() => {
    const jSet = new Set<string>();
    const sSet = new Set<string>();
    const lSet = new Set<string>();
    const mSet = new Set<string>();

    allEntries.forEach((entry) => {
      if (entry.japaneseName) jSet.add(entry.japaneseName);
      if (entry.scientificName) sSet.add(entry.scientificName);
      if (entry.locality) lSet.add(entry.locality);
      if (entry.managementName) mSet.add(entry.managementName);
    });
    return {
      japanese: Array.from(jSet).sort(),
      scientific: Array.from(sSet).sort(),
      locality: Array.from(lSet).sort(),
      management: Array.from(mSet).sort(),
    };
  }, [allEntries]);

  const filteredEntries = useMemo(() => {
    const matched = allEntries.filter(e => !scientificName || e.scientificName === scientificName);
    if (!searchQuery) return matched;
    const q = searchQuery.toLowerCase();
    return matched.filter(e => 
      e.japaneseName.toLowerCase().includes(q) || 
      (e.managementName || "").toLowerCase().includes(q)
    );
  }, [allEntries, scientificName, searchQuery]);

  const selectedLinkedEntry = useMemo(() => allEntries.find(e => e.id === linkedEntryId), [allEntries, linkedEntryId]);

  const japaneseToScientificMap = useMemo(() => {
    const map = new Map<string, string>();
    allEntries.forEach((entry) => {
      if (entry.japaneseName && entry.scientificName) {
        map.set(entry.japaneseName, entry.scientificName);
      }
    });
    return map;
  }, [allEntries]);

  const handleJapaneseNameChange = (val: string) => {
    const patch: { japaneseName: string; scientificName?: string } = { japaneseName: val };
    if (!scientificName && japaneseToScientificMap.has(val)) {
      patch.scientificName = japaneseToScientificMap.get(val);
    }
    onChange(patch);
  };

  return (
    <>
      <BottomSheetInput
        label="管理名 (No/名前)"
        value={managementName || ""}
        placeholder="例: P-01 / L-24-01"
        suggestions={suggestions.management}
        onChange={(val) => onChange({ managementName: val })}
      />
      <BottomSheetInput
        label="和名"
        value={japaneseName}
        placeholder="和名を入力"
        suggestions={suggestions.japanese}
        onChange={handleJapaneseNameChange}
      />
      <BottomSheetInput
        label="学名"
        value={scientificName}
        placeholder="学名を入力"
        suggestions={suggestions.scientific}
        onChange={(val) => onChange({ scientificName: val })}
      />
      <BottomSheetInput
        label="産地"
        value={locality}
        placeholder="産地を入力"
        suggestions={suggestions.locality}
        onChange={(val) => onChange({ locality: val })}
      />
      <GenerationRollField
        value={generation}
        onChange={(value) => onChange({ generation: value })}
      />
      <Field label="紐付け個体 (親個体/ペア)">
        <button
          type="button"
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-left flex justify-between items-center active:bg-gray-50 transition-all border-dashed"
          onClick={() => setIsLinkedSelectOpen(true)}
        > {/* Keep button */}
          <div className="flex items-center gap-2 overflow-hidden">
            <LinkIcon size={14} className={selectedLinkedEntry ? "text-[#FF9800]" : "text-gray-300"} />
            <span className={`truncate ${selectedLinkedEntry ? "text-gray-800 font-bold" : "text-gray-300"}`}>
              {selectedLinkedEntry 
                ? `${selectedLinkedEntry.japaneseName} ${selectedLinkedEntry.managementName ? `[${selectedLinkedEntry.managementName}]` : ""}`
                : "タップして個体を選択"}
            </span>
          </div>
        </button>
      </Field>

      <AnimatePresence>
        {isLinkedSelectOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
              onClick={() => setIsLinkedSelectOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-[40px] p-6 shadow-2xl z-10 flex flex-col max-h-[85dvh] pointer-events-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-lg text-[#4A3F35]">紐付け個体の選択</h3>
                <button onClick={() => setIsLinkedSelectOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-400">
                  <X size={18} />
                </button>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="名前や管理名で検索..."
                  value={searchQuery} // Keep value
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 bg-gray-50 rounded-2xl pl-11 pr-4 text-sm font-bold outline-none border border-transparent focus:border-[#FF9800]/20 transition-all"
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <button
                  type="button"
                  className={`w-full text-left p-4 rounded-2xl font-bold transition-all ${!linkedEntryId ? "bg-[#FF9800] text-white" : "bg-gray-50 text-gray-500"}`}
                  onClick={() => { onChange({ linkedEntryId: undefined }); setIsLinkedSelectOpen(false); }} // Keep onClick
                >
                  なし (紐付け解除)
                </button>
                {filteredEntries.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className={`w-full text-left p-4 rounded-2xl font-bold flex flex-col ${linkedEntryId === e.id ? "bg-[#FF9800] text-white" : "bg-gray-50 text-gray-700"}`} // Keep class
                    onClick={() => {
                      const nextGen = { ...e.generation };
                      if (nextGen.primary === "WD") { nextGen.primary = "WF" as any; nextGen.count = "1"; }
                      else { nextGen.count = String((parseInt(nextGen.count) || 0) + 1); }
                      onChange({ linkedEntryId: e.id, locality: e.locality, generation: nextGen });
                      setIsLinkedSelectOpen(false);
                    }}
                  >
                    <span className="text-sm">{e.japaneseName}</span>
                    <span className="text-[10px] opacity-70">{e.managementName || "管理名なし"} / {e.locality || "産地不明"}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
