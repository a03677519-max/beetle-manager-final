"use client";

import { Thermometer } from "lucide-react";
import { useMemo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

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

function Portal({ children }: { children: React.ReactNode }) {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="text-[12px] font-bold text-[#A67C52] mb-2 block tracking-wider uppercase">{label}</span>
      {children}
    </label>
  );
}

interface DrumrollPickerProps<T> {
  options: readonly T[];
  value: T;
  onChange: (value: string) => void;
}

function DrumrollPicker<T extends string | number>({ options, value, onChange }: DrumrollPickerProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 初期表示時に選択値までスクロール
  useEffect(() => {
    const index = options.indexOf(value);
    if (index !== -1 && scrollRef.current) {
      const targetScroll = index * 28;
      if (scrollRef.current.scrollTop !== targetScroll) {
        scrollRef.current.scrollTop = targetScroll;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]); // 初期マウント時のみ。value変更での再スクロールはループを防ぐため除外

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // スクロール干渉を抑えるため、スクロールが止まってから値を確定させる
    if (timerRef.current) clearTimeout(timerRef.current);
    
    const container = e.currentTarget;
    timerRef.current = setTimeout(() => {
      const index = Math.round(container.scrollTop / 28);
      if (options[index] !== undefined && String(options[index]) !== String(value)) {
        onChange(String(options[index]));
      }
    }, 150); // 150ms スクロールが止まったら確定
  };

  // スクロールエリア外でのタッチによるスクロール干渉を抑制
  const stopPropagation = (e: React.TouchEvent) => {
    if (scrollRef.current) {
      const isScrollable = scrollRef.current.scrollHeight > scrollRef.current.clientHeight;
      if (isScrollable) {
        e.stopPropagation();
      }
    }
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll} // Keep scroll handling
      onTouchStart={stopPropagation}
      onTouchMove={stopPropagation}
      className="flex-1 h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar py-[36px]"
    >
      {options.map((option) => (
        <div key={option} className="h-7 flex items-center justify-center snap-center text-sm font-bold text-gray-700">
          {option}
        </div>
      ))}
    </div>
  );
}

function PickerContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[100px] bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-inner flex">
      {/* グラデーションオーバーレイ */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-transparent to-white/90 pointer-events-none z-10" />
      
      {/* Center highlight */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[96%] h-7 border-y border-[#FF9800]/20 bg-[#FF9800]/5 rounded-lg" />
      </div>
      {children}
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
      <PickerContainer>
        <DrumrollPicker options={options} value={value} onChange={onChange} />
      </PickerContainer>
    </Field>
  );
}

export function DateRollField({
  label,
  value,
  onChange, // Keep onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const parts = splitDate(value);

  return (
    <div className="field">
      <div className="mb-2">
        <span className="text-[11px] font-bold text-[var(--secondary)] tracking-wider uppercase">{label}</span>
      </div>
      <PickerContainer>
        <DrumrollPicker
          options={dateOptions.years}
          value={parts.year}
          onChange={(v) => onChange(buildDateFromParts(v, parts.month, parts.day))}
        />
        <div className="w-[1px] h-full bg-gray-100/50" />
        <DrumrollPicker
          options={dateOptions.months}
          value={parts.month}
          onChange={(v) => onChange(buildDateFromParts(parts.year, v, parts.day))}
        />
        <div className="w-[1px] h-full bg-gray-100/50" />
        <DrumrollPicker
          options={dateOptions.days}
          value={parts.day}
          onChange={(v) => onChange(buildDateFromParts(parts.year, parts.month, v))}
        />
      </PickerContainer>
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
    <div className="field"> {/* Keep field class */}
      <span className="text-[11px] font-bold text-[#A67C52] mb-1.5 block tracking-wider uppercase">累代</span>
      <PickerContainer>
        <DrumrollPicker
          options={GENERATION_PRIMARY}
          value={value.primary}
          onChange={(v) => onChange({ ...value, primary: v as GenerationValue["primary"] })}
        />
        <div className="w-[1px] h-full bg-gray-100/50" />
        <DrumrollPicker
          options={GENERATION_SECONDARY}
          value={value.secondary}
          onChange={(v) => onChange({ ...value, secondary: v as GenerationValue["secondary"] })}
        />
        <div className="w-[1px] h-full bg-gray-100/50" />
        <DrumrollPicker
          options={["-", ...GENERATION_COUNT_OPTIONS]}
          value={value.count || "-"}
          onChange={(v) => onChange({ ...value, count: v === "-" ? "" : v })}
        />
      </PickerContainer> {/* Keep PickerContainer */}
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
      <span className="text-[11px] font-bold text-[#A67C52] mb-1.5 block uppercase tracking-wider">{label}</span>
      <div className="flex bg-[#F5F0EB] rounded-xl p-1 gap-1">
        {values.map((option) => (
          <button // Keep button
            key={option}
            type="button"
            style={{ width: `${100 / values.length}%` }}
            className={`py-1 text-sm font-bold rounded-lg transition-all ${option === value ? "bg-[#FF9800] text-white shadow-sm" : "text-gray-500"}`}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div> {/* Keep div */}
    </div>
  );
}

export function BottomSheetSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="field">
      <span className="text-[11px] font-bold text-[#A67C52] mb-1.5 block tracking-wider uppercase">{label}</span>
      <button // Keep button
        type="button"
        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-left text-gray-700 min-h-[34px] transition-colors active:bg-gray-50"
        onClick={() => setIsOpen(true)}
      >
        {value || <span className="text-gray-300">{placeholder}</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <Portal>
            <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl space-y-4 pointer-events-auto z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-[#A67C52] uppercase tracking-wider">{label}</span>
                  <button
                    type="button"
                    className="bg-[#FF9800] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm"
                    onClick={() => setIsOpen(false)}
                  >
                    閉じる
                  </button>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`w-full text-left px-4 py-3 rounded-2xl font-bold ${ // Keep button
                        value === option ? "bg-[#FF9800] text-white" : "bg-gray-50 text-gray-700"
                      }`}
                      onClick={() => {
                        onChange(option);
                        setIsOpen(false);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="h-[env(safe-area-inset-bottom,16px)]" />
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BottomSheetInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  suggestions,
}: {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: "text" | "textarea";
  suggestions?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredSuggestions = useMemo(() => {
    if (!suggestions) return [];
    const search = String(value).toLowerCase();
    if (!search) return suggestions.slice(0, 15);
    return suggestions.filter(s => s.toLowerCase().includes(search)).slice(0, 15);
  }, [suggestions, value]);

  return (
    <div className="field">
      <span className="text-[11px] font-bold text-[#A67C52] mb-1.5 block tracking-wider uppercase">{label}</span>
      <button // Keep button
        type="button"
        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-left text-gray-700 min-h-[34px] transition-colors active:bg-gray-50"
        onClick={() => setIsOpen(true)}
      >
        {value || <span className="text-gray-300">{placeholder}</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <Portal>
            <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl space-y-4 pointer-events-auto z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-[#A67C52] uppercase tracking-wider">{label}</span>
                  <button
                    type="button"
                    className="bg-[#FF9800] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm"
                    onClick={() => setIsOpen(false)}
                  >
                    完了
                  </button>
                </div>
                {type === "textarea" ? (
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder} // Keep placeholder
                    rows={5}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-[16px] focus:bg-white focus:border-[#FF9800] outline-none transition-all"
                  />
                ) : (
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder} // Keep placeholder
                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 text-[16px] focus:bg-white focus:border-[#FF9800] outline-none transition-all"
                  />
                )}

                {filteredSuggestions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">辞書・履歴</p>
                    <div className="flex flex-wrap gap-2">
                      {filteredSuggestions.map((suggestion) => (
                        <button
                          key={suggestion} // Keep key
                          type="button"
                          className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-bold text-gray-600 active:bg-[#FF9800] active:text-white transition-all"
                          onClick={() => onChange(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="h-[env(safe-area-inset-bottom,16px)]" />
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MoistureField(props: { value: number; onChange: (value: number) => void }) {
  return <LevelButtonGroup label="水分量" values={MOISTURE_LEVELS} value={props.value} onChange={props.onChange} />;
}

export function PressureField(props: { value: number; onChange: (value: number) => void }) {
  return <LevelButtonGroup label="詰圧" values={PRESSURE_LEVELS} value={props.value} onChange={props.onChange} />;
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
      <span className="text-[11px] font-bold text-[#A67C52] mb-1 block uppercase tracking-wider">温度 (℃)</span>
      <div className="relative">
        <input 
          className="w-full h-[36px] px-3 rounded-xl border border-[#DEE2E6] focus:border-[#FF9800] focus:ring-1 focus:ring-[#FF9800] outline-none text-sm placeholder:text-gray-300"
          value={value} // Keep value
          onChange={(event) => onChange(event.target.value)} 
          placeholder="例: 22.5 や 21〜23" 
        />
        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FF9800] p-2" onClick={onFetch}>
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
    <div className="field">
      <span className="text-[12px] font-bold text-[#A67C52] mb-2 block uppercase tracking-wider">羽化区分</span>
      <div className="flex bg-[#F5F0EB] rounded-xl p-1 gap-1">
        {(EMERGENCE_TYPES as unknown as string[]).map((option) => (
          <button
            key={option} // Keep key
            type="button"
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${option === value ? "bg-[#FF9800] text-white shadow-sm" : "text-gray-500"}`}
            onClick={() => onChange(option as EmergenceType)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
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
