"use client";

import { useState } from "react";
import { CountRollField, EmergenceTypeField } from "@/components/entry-fields";
import type { LarvaFormValues } from "@/types/beetle";
import { EntryBaseFields } from "./entry-base-fields";
import { DateRollField } from "../entry-fields";

export function LarvaForm({
  initialValues,
  onSubmit,
  onCancel,
  allEntries,
}: {
  initialValues: LarvaFormValues;
  onSubmit: (value: LarvaFormValues, count: number) => void;
  onCancel: () => void;
  allEntries: BeetleEntry[];
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
        allEntries={allEntries}
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
