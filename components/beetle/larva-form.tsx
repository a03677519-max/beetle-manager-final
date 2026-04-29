"use client";

import { useState } from "react";
import { CountRollField, EmergenceTypeField } from "@/components/entry-fields";
import type { BeetleEntry, LarvaFormValues } from "@/types/beetle";
import { EntryBaseFields } from "./entry-base-fields";
import { DateRollField } from "../entry-fields";
import { today } from "@/lib/utils";

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
  const isEmerged = !!values.actualEmergenceDate;

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

      <div className="field">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isEmerged}
            onChange={(e) =>
              setValues({
                ...values,
                actualEmergenceDate: e.target.checked ? today() : "",
              })
            }
          />
          羽化済み
        </label>
      </div>

      {isEmerged && (
        <>
          <DateRollField
            label="羽化日"
            value={values.actualEmergenceDate}
            onChange={(value) =>
              setValues({ ...values, actualEmergenceDate: value })
            }
          />
          <EmergenceTypeField
            value={values.emergenceType}
            onChange={(value) => setValues({ ...values, emergenceType: value })}
          />
        </>
      )}
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
