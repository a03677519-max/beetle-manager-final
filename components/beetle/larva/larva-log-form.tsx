"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DateRollField,
  BottomSheetInput,
  GenderField,
  LarvaStageField,
  MoistureField,
  PressureField,
  SwitchBotTemperatureField,
} from "@/components/entry-fields";
import { today } from "@/lib/utils";
import { useBeetleStore } from "@/store/use-beetle-store";
import type { LarvaLog, LogStage, Gender } from "@/types/beetle";

export function LarvaLogForm({
  lastLog,
  onSubmit,
  initialLogValues,
  onSave,
  onCancel,
  onFetchTemperature,
  isFetchingTemperature,
}: {
  lastLog?: LarvaLog;
  onSubmit?: (value: Omit<LarvaLog, "id">) => void;
  initialLogValues?: LarvaLog | null;
  onSave?: (value: LarvaLog) => void;
  onCancel?: () => void;
  onFetchTemperature: (setter: (value: string) => void) => void;
  isFetchingTemperature: boolean;
}) {
  const [values, setValues] = useState<{
    id?: string;
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
    date: initialLogValues?.date || lastLog?.date || today(),
    substrate: initialLogValues?.substrate || lastLog?.substrate || "",
    pressure: initialLogValues?.pressure || lastLog?.pressure || 3,
    moisture: initialLogValues?.moisture || lastLog?.moisture || 3,
    bottleSize: initialLogValues?.bottleSize || lastLog?.bottleSize || "",
    stage: initialLogValues?.stage || lastLog?.stage || "L1",
    weight: initialLogValues?.weight?.toString() || "",
    gender: initialLogValues?.gender || lastLog?.gender || "不明",
    temperature: initialLogValues?.temperature?.toString() || "",
  });

  const allEntries = useBeetleStore((state) => state.entries);

  // 過去のログからマット名とボトルサイズの履歴を抽出（オートコンプリート用）
  const suggestions = useMemo(() => {
    const sSet = new Set<string>();
    const bSet = new Set<string>();

    allEntries.forEach((entry) => {
      if (entry.type === "幼虫") {
        entry.logs.forEach((log) => {
          if (log.substrate) sSet.add(log.substrate);
          if (log.bottleSize) bSet.add(log.bottleSize);
        });
      }
    });

    return {
      substrate: Array.from(sSet).sort(),
      bottleSize: Array.from(bSet).sort(),
    };
  }, [allEntries]);

  useEffect(() => {
    if (initialLogValues) {
      setValues({
        id: initialLogValues.id,
        date: initialLogValues.date,
        substrate: initialLogValues.substrate,
        pressure: initialLogValues.pressure,
        moisture: initialLogValues.moisture,
        bottleSize: initialLogValues.bottleSize,
        stage: initialLogValues.stage,
        weight: initialLogValues.weight.toString(),
        gender: initialLogValues.gender,
        temperature: initialLogValues.temperature.toString(),
      });
    }
  }, [initialLogValues]);

  return (
    <form
      className="bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white/60 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const payload = {
          ...values,
          weight: parseFloat(values.weight) || 0,
        };

        if (initialLogValues && onSave) {
          onSave({ ...payload, id: initialLogValues.id } as LarvaLog);
        } else if (onSubmit) {
          onSubmit(payload);
          setValues({
            ...values,
            date: today(),
            weight: "",
          });
        }
      }}
    >
      <div className="text-[11px] font-black text-[#A1887F] uppercase tracking-widest border-l-4 border-[#FF9800] pl-3 mb-2">
        {initialLogValues ? "ログの詳細確認・編集" : "飼育ログを追加"}
      </div>
      <DateRollField label="日付" value={values.date} onChange={(value) => setValues({ ...values, date: value })} />
      <div className="grid grid-cols-2 gap-3">
        <BottomSheetInput
          label="マット名"
          value={values.substrate}
          placeholder="マットの種類"
          suggestions={suggestions.substrate}
          onChange={(val) => setValues({ ...values, substrate: val })}
        />
        <BottomSheetInput
          label="ボトルサイズ"
          value={values.bottleSize}
          placeholder="例: 800cc"
          suggestions={suggestions.bottleSize}
          onChange={(val) => setValues({ ...values, bottleSize: val })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PressureField value={values.pressure} onChange={(value) => setValues({ ...values, pressure: value })} />
        <MoistureField value={values.moisture} onChange={(value) => setValues({ ...values, moisture: value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <BottomSheetInput
          label="体重 (g)"
          value={values.weight}
          placeholder="0.0"
          onChange={(val) => setValues({ ...values, weight: val })}
        />
        <SwitchBotTemperatureField
          value={values.temperature}
          onChange={(value) => setValues((current) => ({ ...current, temperature: value }))}
          onFetch={() => onFetchTemperature((value) => setValues((current) => ({ ...current, temperature: value })))}
          isFetching={isFetchingTemperature}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LarvaStageField value={values.stage} onChange={(value) => setValues({ ...values, stage: value })} />
        <GenderField value={values.gender} onChange={(value) => setValues({ ...values, gender: value })} />
      </div>
      {initialLogValues && (
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button 
              type="button" 
              className="flex-1 py-3 bg-gray-100 rounded-2xl font-bold text-gray-500 active:scale-95 transition-all"
              onClick={onCancel}
            >
              キャンセル
            </button>
          )}
          <button type="submit" className="w-full py-3 bg-[#FF9800] text-white rounded-2xl font-bold shadow-lg shadow-[#FF9800]/20 active:scale-[0.98] transition-all">
            更新する
          </button>
        </div>
      )}
    </form>
  );
}
