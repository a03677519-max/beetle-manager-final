"use client";

import { Thermometer } from "lucide-react";
import { useMemo } from "react";

import {
  COHABITATION_OPTIONS,
  COUNT_OPTIONS,
  EMERGENCE_TYPES,
  GENERATION_COUNT_OPTIONS,
  GENERATION_PRIMARY,
  GENERATION_SECONDARY,
  GENDERS,
  LOG_STAGES,
  MOISTURE_LEVELS,
  PRESSURE_LEVELS,
  type CohabitationOption,
  type EmergenceType,
  type Gender,
  type GenerationValue,
  type LogStage,
} from "@/types/beetle";
import { buildDateFromParts, createDateOptions, splitDate } from "@/lib/utils";

const dateOptions = createDateOptions();

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="text-[12px] font-bold text-[var(--secondary)] mb-2 block tracking-wider uppercase">{label}</span>
      {children}
    </label>
  );
}

export function WheelSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | number;
  options: readonly (string | number)[];
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="wheel-shell">
        <select className="wheel-select" value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </Field>
  );
}

export function DateRollField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const parts = splitDate(value);

  return (
    <div className="field">
      <span>{label}</span>
      <div className="wheel-grid">
        <div className="wheel-shell">
          <select
            className="wheel-select"
            value={parts.year}
            onChange={(event) => onChange(buildDateFromParts(event.target.value, parts.month, parts.day))}
          >
            {dateOptions.years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="wheel-shell">
          <select
            className="wheel-select"
            value={parts.month}
            onChange={(event) => onChange(buildDateFromParts(parts.year, event.target.value, parts.day))}
          >
            {dateOptions.months.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="wheel-shell">
          <select
            className="wheel-select"
            value={parts.day}
            onChange={(event) => onChange(buildDateFromParts(parts.year, parts.month, event.target.value))}
          >
            {dateOptions.days.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export function GenerationRollField({
  value,
  onChange,
}: {
  value: GenerationValue;
  onChange: (value: GenerationValue) => void;
}) {
  const preview = useMemo(() => buildGenerationLabel(value), [value]);

  return (
    <div className="field">
      <span>累代</span>
      <div className="wheel-grid">
        <div className="wheel-shell">
          <select
            className="wheel-select"
            value={value.primary}
            onChange={(event) => onChange({ ...value, primary: event.target.value as GenerationValue["primary"] })}
          >
            {GENERATION_PRIMARY.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="wheel-shell">
          <select
            className="wheel-select"
            value={value.secondary}
            onChange={(event) =>
              onChange({ ...value, secondary: event.target.value as GenerationValue["secondary"] })
            }
          >
            {GENERATION_SECONDARY.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="wheel-shell">
          <select
            className="wheel-select"
            value={value.count}
            onChange={(event) => onChange({ ...value, count: event.target.value })}
          >
            <option value="">-</option>
            {GENERATION_COUNT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="field-note">表示: {preview}</p>
    </div>
  );
}

export function CountRollField({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <WheelSelect
      label="登録頭数"
      value={value}
      options={COUNT_OPTIONS}
      onChange={(nextValue) => onChange(Number(nextValue))}
    />
  );
}

export function LevelButtonGroup({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: number;
  values: readonly number[];
  onChange: (value: number) => void;
}) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="chip-row">
        {values.map((option) => (
          <button
            key={option}
            type="button"
            className={option === value ? "chip active" : "chip"}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PressureField(props: { value: number; onChange: (value: number) => void }) {
  return <LevelButtonGroup label="詰圧" values={PRESSURE_LEVELS} {...props} />;
}

export function MoistureField(props: { value: number; onChange: (value: number) => void }) {
  return <LevelButtonGroup label="水分量" values={MOISTURE_LEVELS} {...props} />;
}

export function SwitchBotTemperatureField({
  value,
  onChange,
  onFetch,
  isFetching,
}: {
  value: string;
  onChange: (value: string) => void;
  onFetch: () => void;
  isFetching: boolean;
}) {
  return (
    <Field label="温度">
      <div className="temp-row">
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="例: 23.5" />
        <button type="button" className="icon-button" onClick={onFetch} aria-label="SwitchBot温度取得">
          <Thermometer size={18} className={isFetching ? "spin" : undefined} />
        </button>
      </div>
    </Field>
  );
}

export function EmergenceTypeField({
  value,
  onChange,
}: {
  value: EmergenceType;
  onChange: (value: EmergenceType) => void;
}) {
  return (
    <WheelSelect
      label="羽化区分"
      value={value}
      options={EMERGENCE_TYPES}
      onChange={(value) => onChange(value as EmergenceType)}
    />
  );
}

export function GenderField({
  value,
  onChange,
}: {
  value: Gender;
  onChange: (value: Gender) => void;
}) {
  return (
    <WheelSelect
      label="雌雄"
      value={value}
      options={GENDERS}
      onChange={(value) => onChange(value as Gender)}
    />
  );
}

export function LarvaStageField({
  value,
  onChange,
}: {
  value: LogStage;
  onChange: (value: LogStage) => void;
}) {
  return (
    <WheelSelect
      label="加齢状況"
      value={value}
      options={LOG_STAGES}
      onChange={(value) => onChange(value as LogStage)}
    />
  );
}

export function CohabitationField({
  value,
  onChange,
}: {
  value: CohabitationOption;
  onChange: (value: CohabitationOption) => void;
}) {
  return (
    <WheelSelect
      label="同居の有無"
      value={value}
      options={COHABITATION_OPTIONS}
      onChange={(value) => onChange(value as CohabitationOption)}
    />
  );
}

export const buildGenerationLabel = (value: GenerationValue) =>
  value.secondary !== "-"
    ? `${value.secondary}${value.count || ""}`
    : value.primary !== "-"
      ? `${value.primary}${value.count || ""}`
      : "-";
