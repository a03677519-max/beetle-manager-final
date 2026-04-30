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
    weight: string;
    gender: Gender;
    temperature: string;
  }>({
    date: today(),
    substrate: "",
    pressure: 3,
    moisture: 3,
    bottleSize: "",
    stage: "L1",
    weight: "", // 初期値を空文字にして 0 が残らないように修正
    gender: "不明",
    temperature: "", // 初期値を空文字にして 0 が残らないように修正
  });

  return (
    <form
      className="card form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ ...values, weight: Number(values.weight) });
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="使用マット">
          <input value={values.substrate} onChange={(event) => setValues({ ...values, substrate: event.target.value })} />
        </Field>
        <Field label="ボトルサイズ">
          <input value={values.bottleSize} onChange={(event) => setValues({ ...values, bottleSize: event.target.value })} />
        </Field>
      </div>
      <PressureField value={values.pressure} onChange={(value) => setValues({ ...values, pressure: value })} />
      <MoistureField value={values.moisture} onChange={(value) => setValues({ ...values, moisture: value })} />
      <LarvaStageField value={values.stage} onChange={(value) => setValues({ ...values, stage: value })} />
      <Field label="体重">
        <input 
          value={values.weight} 
          onChange={(event) => setValues({ ...values, weight: event.target.value })} 
        />
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
