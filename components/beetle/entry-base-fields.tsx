"use client";

import { Field, GenerationRollField } from "@/components/entry-fields";
import type { AdultFormValues } from "@/types/beetle";

export function EntryBaseFields({
  japaneseName,
  scientificName,
  locality,
  generation,
  onChange,
}: {
  japaneseName: string;
  scientificName: string;
  locality: string;
  generation: AdultFormValues["generation"];
  onChange: (patch: {
    japaneseName?: string;
    scientificName?: string;
    locality?: string;
    generation?: AdultFormValues["generation"];
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
    </>
  );
}
