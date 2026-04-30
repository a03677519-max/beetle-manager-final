"use client";

import { useState, useEffect, useRef } from "react";
import { DateRollField, Field, BottomSheetInput } from "@/components/entry-fields";
import type { AdultFormValues } from "@/types/beetle";
import { EntryBaseFields } from "@/components/beetle/shared/entry-base-fields";
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
  const [values, setValues] = useState<AdultFormValues>(initialValues);
  const formRef = useRef<HTMLFormElement>(null);

  // Effect to synchronize internal form state with external initialValues prop.
  // This is important if the parent component can change `initialValues`
  // while this component is still mounted (e.g., for editing different entries).
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  return (
    <form
      ref={formRef}
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm space-y-2">
        <EntryBaseFields
          {...values}
          managementName={values.managementName || ""}
          linkedEntryId={values.linkedEntryId}
          allEntries={useBeetleStore.getState().entries}
          onChange={(patch) => setValues({ ...values, ...patch })}
        />

        <DateRollField
          label="羽化日"
          value={values.emergenceDate}
          onChange={(value) => setValues({ ...values, emergenceDate: value })}
        />
        <Field label="羽化/掘り出し">
          <div className="flex space-x-2">
            <button
              type="button"
              className={`flex-1 px-4 py-1.5 rounded-xl border font-bold text-sm transition-all duration-200 select-none ${
                values.emergenceType === "羽化"
                  ? "bg-[#2D5A27] text-white border-[#2D5A27] shadow-md shadow-[#2D5A27]/20 scale-[1.02]"
                  : "bg-white/60 border-gray-200 text-gray-600 hover:bg-white/80 active:scale-95"
              }`}
              onClick={() => setValues({ ...values, emergenceType: "羽化" })}
            >
              羽化
            </button>
            <button
              type="button"
              className={`flex-1 px-4 py-1.5 rounded-xl border font-bold text-sm transition-all duration-200 select-none ${
                values.emergenceType === "掘り出し"
                  ? "bg-[#2D5A27] text-white border-[#2D5A27] shadow-md shadow-[#2D5A27]/20 scale-[1.02]"
                  : "bg-white/60 border-gray-200 text-gray-600 hover:bg-white/80 active:scale-95"
              }`}
              onClick={() => setValues({ ...values, emergenceType: "掘り出し" })}
            >
              掘り出し
            </button>
          </div>
        </Field>
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

        <BottomSheetInput
          label="幼虫時データ"
          value={values.larvaMemo}
          type="textarea"
          placeholder="幼虫時の育成記録など"
          onChange={(val) => setValues({ ...values, larvaMemo: val })}
        />
      </div>

      {/* Actions */}
      <div className="pt-1 pb-3 flex gap-3">
        <button
          type="button"
          className="flex-1 h-10 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all select-none"
          onClick={onCancel}
        >
          キャンセル
        </button>
        <button 
          type="submit" 
          className="flex-[2] h-10 rounded-2xl font-bold text-white bg-[#2D5A27] shadow-lg shadow-[#2D5A27]/30 hover:brightness-110 active:scale-95 transition-all select-none"
        >
          保存する
        </button>
      </div>
    </form>
  );
}
