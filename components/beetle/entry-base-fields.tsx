"use client";

import { Field, GenerationRollField } from "@/components/entry-fields";
import type { AdultFormValues, BeetleEntry } from "@/types/beetle";

export function EntryBaseFields({
  japaneseName,
  scientificName,
  locality,
  generation,
  linkedEntryId,
  allEntries,
  onChange,
}: {
  japaneseName: string;
  scientificName: string;
  locality: string;
  generation: AdultFormValues["generation"];
  linkedEntryId?: string;
  allEntries: BeetleEntry[];
  onChange: (patch: {
    japaneseName?: string;
    scientificName?: string;
    locality?: string;
    generation?: AdultFormValues["generation"];
    linkedEntryId?: string;
  }) => void;
}) {
  return (
    <>
      <Field label="和名">
        <input
          value={japaneseName}
          onChange={(event) => onChange({ japaneseName: event.target.value })}
        />
      </Field>
      <Field label="学名">
        <input
          value={scientificName}
          onChange={(event) => onChange({ scientificName: event.target.value })}
        />
      </Field>
      <Field label="産地">
        <input
          value={locality}
          onChange={(event) => onChange({ locality: event.target.value })}
        />
      </Field>
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
