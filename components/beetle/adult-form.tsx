"use client";

import { useState } from "react";
import { DateRollField, Field } from "@/components/entry-fields";
import type { AdultFormValues } from "@/types/beetle";
import { EntryBaseFields } from "./entry-base-fields";

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
      className="card form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="section-title">成虫項目</div>
      <EntryBaseFields
        {...values}
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
        label="死亡日"
        value={values.deathDate}
        onChange={(value) => setValues({ ...values, deathDate: value })}
      />
      <Field label="幼虫時データ">
        <textarea
          value={values.larvaMemo}
          rows={4}
          onChange={(event) =>
            setValues({ ...values, larvaMemo: event.target.value })
          }
        />
      </Field>
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
