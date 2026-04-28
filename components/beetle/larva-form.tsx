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
      <DateRollField
        label="日付"
        value={values.date}
        onChange={(value) => setValues({ ...values, date: value })}
      />
      <Field label="使用マット">
        <input
          value={values.substrate}
          onChange={(event) =>
            setValues({ ...values, substrate: event.target.value })
          }
        />
      </Field>
      <PressureField
        value={values.pressure}
        onChange={(value) => setValues({ ...values, pressure: value })}
      />
      <MoistureField
        value={values.moisture}
        onChange={(value) => setValues({ ...values, moisture: value })}
      />
      <Field label="ボトルサイズ">
        <input
          value={values.bottleSize}
          onChange={(event) =>
            setValues({ ...values, bottleSize: event.target.value })
          }
        />
      </Field>
      <LarvaStageField
        value={values.stage}
        onChange={(value) => setValues({ ...values, stage: value })}
      />
      <Field label="体重">
        <input
          value={values.weight}
          onChange={(event) =>
            setValues({ ...values, weight: event.target.value })
          }
        />
      </Field>
      <GenderField
        value={values.gender}
        onChange={(value) => setValues({ ...values, gender: value })}
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
      <button type="submit" className="button">
        ログを追加
      </button>
    </form>
  );
}

import { CountRollField, EmergenceTypeField } from "@/components/entry-fields";
import type { LarvaFormValues } from "@/types/beetle";
import { EntryBaseFields } from "./entry-base-fields";

export function LarvaForm({
  initialValues,
  onSubmit,
  onCancel,
}: {
  initialValues: LarvaFormValues;
  onSubmit: (value: LarvaFormValues, count: number) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(initialValues);
  const [count, setCount] = useState(1);

  return (
    <form
      className="card form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values, count);
      }}
    >
      <div className="section-title">幼虫項目</div>
      <EntryBaseFields
        {...values}
        onChange={(patch) => setValues({ ...values, ...patch })}
      />
      <CountRollField value={count} onChange={setCount} />
      <DateRollField
        label="羽化予定日"
        value={values.plannedEmergenceDate}
        onChange={(value) =>
          setValues({ ...values, plannedEmergenceDate: value })
        }
      />
      <DateRollField
        label="羽化日"
        value={values.actualEmergenceDate}
        onChange={(value) => setValues({ ...values, actualEmergenceDate: value })}
      />
      <EmergenceTypeField
        value={values.emergenceType}
        onChange={(value) => setValues({ ...values, emergenceType: value })}
      />
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
