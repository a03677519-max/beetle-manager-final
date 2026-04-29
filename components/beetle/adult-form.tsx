"use client";

import { useState } from "react";
import { DateRollField, Field } from "@/components/entry-fields";
import type { AdultFormValues } from "@/types/beetle";
import { EntryBaseFields } from "./entry-base-fields";
import { useBeetleStore } from "@/store/use-beetle-store";

export function AdultForm({
  initialValues,
  onSubmit,
  onCancel,
}: {
  initialValues: AdultFormValues;
  onSubmit: (value: AdultFormValues) => void;
  onCancel: () => void;
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
        <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-2 border-l-4 border-[#2D5A27] pl-3">Basic Info</div>
        <EntryBaseFields
          {...values}
          linkedEntryId={values.linkedEntryId}
          allEntries={useBeetleStore.getState().entries}
          onChange={(patch) => setValues({ ...values, ...patch })}
        />
      </section>

      <section className="bg-white/40 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-sm space-y-4">
        <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-2 border-l-4 border-[#2D5A27] pl-3">Management</div>
        <Field label="管理名 (No/名前)">
          <input
            value={values.managementName || ""}
            placeholder="例: P-01 / ヘラクレス太郎"
            className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#2D5A27] outline-none"
            onChange={(e) => setValues({ ...values, managementName: e.target.value })}
          />
        </Field>
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
          label="死亡日"
          value={values.deathDate}
          onChange={(value) => setValues({ ...values, deathDate: value })}
        />
      </section>

      <section className="bg-white/40 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-sm space-y-4">
        <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-2 border-l-4 border-[#2D5A27] pl-3">Extra Notes</div>
        <Field label="幼虫時データ">
          <textarea
            value={values.larvaMemo}
            rows={4}
            className="w-full bg-white/60 border border-gray-200 rounded-2xl px-4 py-3 focus:border-[#2D5A27] outline-none transition-all text-sm"
            onChange={(event) =>
              setValues({ ...values, larvaMemo: event.target.value })
            }
          />
        </Field>
      </section>

      <div className="form-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={onCancel}
        >
          キャンセル
        </button>
        <button type="submit" className="button">
          保存
        </button>
      </div>
    </form>
  );
}
