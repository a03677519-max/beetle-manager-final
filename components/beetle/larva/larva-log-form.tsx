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
import type { LarvaLog, LogStage, Gender } from "@/types/beetle";

export function LarvaLogForm({
  onSubmit,
  onFetchTemperature,
  isFetchingTemperature,
}: {
  onSubmit: (value: Omit<LarvaLog, "id">) => void;
  onFetchTemperature: (setter: (value: string) => void) => void;
  isFetchingTemperature: boolean;
}) {
  const [values, setValues] = useState<{
    date: string;
    substrate: string;
    pressure: number;
    moisture: number;
    bottleSize: string;
    stage: LogStage;
    weight: number;
    gender: Gender;
    temperature: number;
  }>({
    date: today(),
    substrate: "",
    pressure: 3,
    moisture: 3,
    bottleSize: "",
    stage: "L1",
    weight: 0,
    gender: "不明",
    temperature: 0,
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
          weight: 0,
          gender: "不明",
          temperature: 0,
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
        <input 
          type="number"
          step="0.1"
          value={values.weight} 
          onChange={(event) => setValues({ ...values, weight: parseFloat(event.target.value) || 0 })} 
        />
      </Field>
      <GenderField value={values.gender} onChange={(value) => setValues({ ...values, gender: value })} />
      <SwitchBotTemperatureField
        value={String(values.temperature)}
        onChange={(value) => setValues({ ...values, temperature: parseFloat(value) || 0 })}
        onFetch={() => onFetchTemperature((value) => setValues((current) => ({ ...current, temperature: parseFloat(value) || 0 })))}
        isFetching={isFetchingTemperature}
      />
      <button type="submit" className="button">
        ログを追加
      </button>
    </form>
  );
}
