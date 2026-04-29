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
      className="card form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="section-title">産卵セット項目</div>
      <EntryBaseFields
        {...values}
        allEntries={allEntries}
        onChange={(patch) => setValues({ ...values, ...patch })}
      />
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
      <Field label="使用マット">
        <input
          value={values.substrate}
          onChange={(event) =>
            setValues({ ...values, substrate: event.target.value })
          }
        />
      </Field>
      <Field label="容器サイズ">
        <input
          value={values.containerSize}
          onChange={(event) =>
            setValues({ ...values, containerSize: event.target.value })
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
