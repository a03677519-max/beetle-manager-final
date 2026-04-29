"use client";

import { Thermometer } from "lucide-react";
import { useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";

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
import { buildDateFromParts, createDateOptions, splitDate, today } from "@/lib/utils";

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
      <span className="text-[12px] font-bold text-[#8B5A2B] mb-2 block tracking-wider uppercase">{label}</span>
      {children}
    </label>
  );
}

function DrumrollPicker<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 初期表示時に選択値までスクロール
  useEffect(() => {
    const index = options.indexOf(value);
    if (index !== -1 && scrollRef.current) {
      scrollRef.current.scrollTop = index * 40;
    }
  }, [value, options]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const index = Math.round(e.currentTarget.scrollTop / 40);
    if (options[index] !== undefined && String(options[index]) !== String(value)) {
      onChange(String(options[index]));
    }
  };

  return (
    <div className="relative h-[120px] bg-gray-50/50 rounded-xl overflow-hidden border border-gray-100">
      {/* 中央のハイライト */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full h-10 border-y border-primary/20 bg-primary/5" />
      </div>
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar py-10"
      >
        {options.map((option) => (
          <div key={option} className="h-10 flex items-center justify-center snap-center text-sm font-bold text-gray-700">
            {option}
          </div>
        ))}
      </div>
    </div>
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
      <DrumrollPicker options={options} value={value} onChange={onChange} />
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
  const isEnabled = !!value;

  return (
    <div className="field">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[12px] font-bold text-[var(--secondary)] tracking-wider uppercase">{label}</span>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(event) => onChange(event.target.checked ? today() : "")}
          />
          入力
        </label>
      </div>
      <div className="wheel-grid">
        <DrumrollPicker
          options={dateOptions.years}
          value={parts.year}
          onChange={(v) => isEnabled && onChange(buildDateFromParts(v, parts.month, parts.day))}
        />
        <DrumrollPicker
          options={dateOptions.months}
          value={parts.month}
          onChange={(v) => isEnabled && onChange(buildDateFromParts(parts.year, v, parts.day))}
        />
        <DrumrollPicker
          options={dateOptions.days}
          value={parts.day}
          onChange={(v) => isEnabled && onChange(buildDateFromParts(parts.year, parts.month, v))}
        />
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
      <span className="text-[12px] font-bold text-[#8B5A2B] mb-2 block tracking-wider uppercase">累代</span>
      <div className="wheel-grid">
        <DrumrollPicker
          options={GENERATION_PRIMARY}
          value={value.primary}
          onChange={(v) => onChange({ ...value, primary: v as GenerationValue["primary"] })}
        />
        <DrumrollPicker
          options={GENERATION_SECONDARY}
          value={value.secondary}
          onChange={(v) => onChange({ ...value, secondary: v as GenerationValue["secondary"] })}
        />
        <DrumrollPicker
          options={["-", ...GENERATION_COUNT_OPTIONS]}
          value={value.count || "-"}
          onChange={(v) => onChange({ ...value, count: v === "-" ? "" : v })}
        />
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
      <span className="text-[12px] font-bold text-[#8B5A2B] mb-2 block uppercase tracking-wider">{label}</span>
      <div className="flex bg-[#F1F3F5] rounded-xl p-1 gap-1">
        {values.map((option) => (
          <button
            key={option}
            type="button"
            style={{ width: `${100 / values.length}%` }}
            className={`py-2 text-sm font-bold rounded-lg transition-all ${option === value ? "bg-[#2D5A27] text-white shadow-sm" : "text-gray-500"}`}
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
  return (
    <WheelSelect label="詰圧" options={PRESSURE_LEVELS} value={props.value} onChange={(v) => props.onChange(Number(v))} />
  );
}

export function MoistureField(props: { value: number; onChange: (value: number) => void }) {
  return (
    <WheelSelect label="水分量" options={MOISTURE_LEVELS} value={props.value} onChange={(v) => props.onChange(Number(v))} />
  );
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
    <div className="field">
      <span className="text-[12px] font-bold text-[#8B5A2B] mb-1 block uppercase tracking-wider">温度 (℃)</span>
      <div className="relative">
        <input 
          inputMode="decimal"
          className="w-full h-[48px] px-4 rounded-xl border border-[#DEE2E6] focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27] outline-none text-[16px]"
          value={value} 
          onChange={(event) => onChange(event.target.value)} 
          placeholder="23.5" 
        />
        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D5A27] p-2" onClick={onFetch}>
          <Thermometer size={18} className={isFetching ? "spin" : undefined} />
        </button>
      </div>
    </div>
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
