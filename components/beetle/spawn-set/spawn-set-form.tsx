"use client";

import { useState, useEffect, useRef } from "react";
import {
  CohabitationField,
  DateRollField,
  BottomSheetInput,
  MoistureField,
  SwitchBotTemperatureField,
} from "@/components/entry-fields";
import type { BeetleEntry, SpawnSetFormValues } from "@/types/beetle";
import { EntryBaseFields } from "@/components/beetle/shared/entry-base-fields";

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
  const [values, setValues] = useState<SpawnSetFormValues>(initialValues);
  const formRef = useRef<HTMLFormElement>(null);

  // 外部からの初期値変更を同期
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
          allEntries={allEntries}
          onChange={(patch) => setValues({ ...values, ...patch })}
        />

        <DateRollField
          label="セット日"
          value={values.setDate}
          onChange={(value) => setValues({ ...values, setDate: value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <BottomSheetInput
            label="使用マット"
            value={values.substrate}
            placeholder="例: クヌギマット"
            onChange={(val) => setValues({ ...values, substrate: val })}
          />
          <BottomSheetInput
            label="容器サイズ"
            value={values.containerSize}
            placeholder="例: 2000cc"
            onChange={(val) => setValues({ ...values, containerSize: val })}
          />
        </div>
        <BottomSheetInput
          label="詰圧"
          value={values.pressure}
          placeholder="例: 硬め / 3"
          onChange={(val) => setValues({ ...values, pressure: val })}
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
