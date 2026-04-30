"use client";

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
  return (
    <>
      <BottomSheetInput
        label="管理名 (No/名前)"
        value={managementName || ""}
        placeholder="例: P-01 / L-24-01"
        onChange={(val) => onChange({ managementName: val })}
      />
      <BottomSheetInput
        label="和名"
        value={japaneseName}
        placeholder="和名を入力"
        onChange={(val) => onChange({ japaneseName: val })}
      />
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
