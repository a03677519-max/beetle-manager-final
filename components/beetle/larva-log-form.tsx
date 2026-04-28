"use client";

import { useState } from "react";
import {
  DateRollField,
  Field,
  GenderField,
  LarvaStageField,
  MoistureField,
  PressureField,
  SwitchBotTemperatureField,
} from "@/components/entry-fields";
import { today } from "@/lib/utils";
import type { LarvaLog } from "@/types/beetle";

export function LarvaLogForm({
  onSubmit,
  onFetchTemperature,
  isFetchingTemperature,
}: {
  onSubmit: (value: Omit<LarvaLog, "id">) => void;
  onFetchTemperature: (setter: (value: string) => void) => void;
  isFetchingTemperature: boolean;
}) {
  const [values, setValues] = useState<Omit<LarvaLog, "id">>({
    date: today(),
    substrate: "",
    pressure: 3,
    moisture: 3,
    bottleSize: "",
    stage: "L1",
    weight: "",
    gender: "不明",
    temperature: "",
  });

  return (
    <form
      className="card form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
        setValues({
          date: today(),
          substrate: "",
          pressure: 3,
          moisture: 3,
          bottleSize: "",
          stage: "L1",
          weight: "",
          gender: "不明",
          temperature: "",
        });
      }}
    >
      <div className="section-title">飼育ログ</div>
      <DateRollField label="日付" value={values.date} onChange={(value) => setValues({ ...values, date: value })} />
      <Field label="使用マット">
        <input value={values.substrate} onChange={(event) => setValues({ ...values, substrate: event.target.value })} />
      </Field>
      <PressureField value={values.pressure} onChange={(value) => setValues({ ...values, pressure: value })} />
      <MoistureField value={values.moisture} onChange={(value) => setValues({ ...values, moisture: value })} />
      <Field label="ボトルサイズ">
        <input value={values.bottleSize} onChange={(event) => setValues({ ...values, bottleSize: event.target.value })} />
      </Field>
      <LarvaStageField value={values.stage} onChange={(value) => setValues({ ...values, stage: value })} />
      <Field label="体重">
        <input value={values.weight} onChange={(event) => setValues({ ...values, weight: event.target.value })} />
      </Field>
      <GenderField value={values.gender} onChange={(value) => setValues({ ...values, gender: value })} />
      <SwitchBotTemperatureField
        value={values.temperature}
        onChange={(value) => setValues({ ...values, temperature: value })}
        onFetch={() => onFetchTemperature((value) => setValues((current) => ({ ...current, temperature: value })))}
        isFetching={isFetchingTemperature}
      />
      <button type="submit" className="button">
        ログを追加
      </button>
    </form>
  );
}