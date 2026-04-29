"use client";

import { useState } from "react";
import {
  CohabitationField,
  DateRollField,
  Field,
  MoistureField,
  PressureField,
  SwitchBotTemperatureField,
} from "@/components/entry-fields";
import type { BeetleEntry, SpawnSetFormValues } from "@/types/beetle";
import { EntryBaseFields } from "./entry-base-fields";

export function SpawnSetForm({
  initialValues,
  onSubmit,
  onCancel,
  onFetchTemperature,
  isFetchingTemperature,
  allEntries,
}: {
  initialValues: SpawnSetFormValues;
  onSubmit: (value: SpawnSetFormValues) => void;
  onCancel: () => void;
  onFetchTemperature: (setter: (value: string) => void) => void;
  isFetchingTemperature: boolean;
  allEntries: BeetleEntry[];
}) {
  const [values, setValues] = useState(initialValues);

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <section className="bg-white/40 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-sm space-y-4">
        <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-2 border-l-4 border-[#2D5A27] pl-3">Set Identity</div>
        <EntryBaseFields
          {...values}
          allEntries={allEntries}
          onChange={(patch) => setValues({ ...values, ...patch })}
        />
      </section>

      <section className="bg-white/40 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-sm space-y-5">
        <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-2 border-l-4 border-[#2D5A27] pl-3">Timeline</div>
        <DateRollField
          label="羽化日"
          value={values.emergenceDate}
          onChange={(value) => setValues({ ...values, emergenceDate: value })}
        />
        <DateRollField
          label="後食日"
          value={values.feedingDate}
          onChange={(value) => setValues({ ...values, feedingDate: value })}
        />
        <DateRollField
          label="セット日"
          value={values.setDate}
          onChange={(value) => setValues({ ...values, setDate: value })}
        />
      </section>

      <section className="bg-white/40 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-sm space-y-4">
        <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-2 border-l-4 border-[#2D5A27] pl-3">Environment</div>
        <div className="grid grid-cols-2 gap-3">
        <Field label="使用マット">
          <input
            value={values.substrate}
            className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#2D5A27] outline-none"
            onChange={(event) => setValues({ ...values, substrate: event.target.value })}
          />
        </Field>
        <Field label="容器サイズ">
          <input
            value={values.containerSize}
            className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#2D5A27] outline-none"
            onChange={(event) => setValues({ ...values, containerSize: event.target.value })}
          />
        </Field>
      </div>

      <PressureField
        value={values.pressure}
        onChange={(value) => setValues({ ...values, pressure: value })}
      />
      <MoistureField
        value={values.moisture}
        onChange={(value) => setValues({ ...values, moisture: value })}
      />
      <SwitchBotTemperatureField
        value={values.temperature}
        onChange={(value) => setValues({ ...values, temperature: value })}
        onFetch={() =>
          onFetchTemperature((value) =>
            setValues((current) => ({ ...current, temperature: value }))
          )
        }
        isFetching={isFetchingTemperature}
      />
      <CohabitationField
        value={values.cohabitation}
        onChange={(value) => setValues({ ...values, cohabitation: value })}
      />
      </section>

      <div className="form-actions">
        <button type="submit" className="button">
          保存
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={onCancel}
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
