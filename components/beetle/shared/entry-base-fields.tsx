"use client";

import { useMemo } from "react";
import { Field, GenerationRollField, BottomSheetInput, BottomSheetSelect } from "@/components/entry-fields";
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
  const japaneseNameOptions = useMemo(() => {
    if (!scientificName) return [];
    const options = new Set<string>();
    allEntries.forEach((entry) => {
      if (entry.scientificName === scientificName && entry.japaneseName) {
        options.add(entry.japaneseName);
      }
    });
    return Array.from(options);
  }, [scientificName, allEntries]);

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
        onChange={(val) => onChange({ managementName: val })}
      />
      {japaneseNameOptions.length > 0 ? (
        <BottomSheetSelect
          label="和名"
          value={japaneseName}
          options={japaneseNameOptions}
          onChange={handleJapaneseNameChange}
        />
      ) : (
        <BottomSheetInput
          label="和名"
          value={japaneseName}
          placeholder="和名を入力"
          onChange={handleJapaneseNameChange}
        />
      )}
      <BottomSheetInput
        label="学名"
        value={scientificName}
        placeholder="学名を入力"
        onChange={(val) => onChange({ scientificName: val })}
      />
      <BottomSheetInput
        label="産地"
        value={locality}
        placeholder="産地を入力"
        onChange={(val) => onChange({ locality: val })}
      />
      <GenerationRollField
        value={generation}
        onChange={(value) => onChange({ generation: value })}
      />
      <Field label="紐付け個体">
        <div className="chip-row">
          <button
            type="button"
            className={!linkedEntryId ? "chip active" : "chip"}
            onClick={() => onChange({ linkedEntryId: undefined })}
          >
            なし
          </button>
          {allEntries.map((e) => (
            <button
              key={e.id}
              type="button"
              className={linkedEntryId === e.id ? "chip active" : "chip"}
              onClick={() => onChange({ linkedEntryId: e.id })}
            >
              {e.japaneseName}
            </button>
          ))}
        </div>
      </Field>
    </>
  );
}
