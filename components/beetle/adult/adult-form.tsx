"use client";

import { useState, useEffect, useRef } from "react";
import { DateRollField, Field, BottomSheetInput, GenderField } from "@/components/entry-fields";
import type { AdultFormValues } from "@/types/beetle";
import { EntryBaseFields } from "@/components/beetle/shared/entry-base-fields";
import { useBeetleStore } from "@/store/use-beetle-store";
import { Clipboard } from "lucide-react";

export function AdultForm({
  initialValues,
  onSubmit,
  onCancel,
  className,
}: {
  initialValues: AdultFormValues;
  onSubmit: (value: AdultFormValues) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [values, setValues] = useState<AdultFormValues>(initialValues);
  const formRef = useRef<HTMLFormElement>(null);

  // Effect to synchronize internal form state with external initialValues prop.
  // This is important if the parent component can change `initialValues`
  // while this component is still mounted (e.g., for editing different entries).
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleLarvaDataPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setValues({ ...values, larvaMemo: text });
    } catch (err) {
      alert("クリップボードの読み取りに失敗しました。");
    }
  };

  return (
    <form
      ref={formRef}
      className={`flex flex-col h-full overflow-hidden ${className || ''}`}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="flex-1 overflow-y-auto px-1 space-y-3 mb-2">
        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm space-y-2">
        <EntryBaseFields
          {...values}
          managementName={values.managementName || ""}
          linkedEntryId={values.linkedEntryId}
          allEntries={useBeetleStore.getState().entries}
          onChange={(patch) => setValues({ ...values, ...patch })}
        />

        <div className="grid grid-cols-2 gap-3">
          <GenderField
            value={values.gender}
            onChange={(val) => setValues({ ...values, gender: val })}
          />
          <BottomSheetInput
            label="サイズ (mm)"
            value={values.size || ""}
            placeholder="例: 75.5"
            onChange={(val) => setValues({ ...values, size: val })}
          />
        </div>
        <BottomSheetInput
          label="状態"
          value={values.status || ""}
          placeholder="例: 未後食 / 完品"
          onChange={(val) => setValues({ ...values, status: val })}
        />

        <DateRollField
          label="羽化日"
          value={values.emergenceDate}
          onChange={(value) => setValues({ ...values, emergenceDate: value })}
        />
        <Field label="羽化/掘り出し">
          <div className="flex space-x-2">
            <button
              type="button"
              className={`flex-1 px-4 py-1.5 rounded-xl border font-bold text-sm transition-all duration-200 select-none ${
                values.emergenceType === "羽化"
                  ? "bg-[#7B5D3F] text-white border-[#7B5D3F] shadow-md shadow-[#7B5D3F]/20 scale-[1.02]"
                  : "bg-white/60 border-gray-200 text-gray-600 hover:bg-white/80 active:scale-95"
              }`}
              onClick={() => setValues({ ...values, emergenceType: "羽化" })}
            >
              羽化
            </button>
            <button
              type="button"
              className={`flex-1 px-4 py-1.5 rounded-xl border font-bold text-sm transition-all duration-200 select-none ${
                values.emergenceType === "掘り出し"
                  ? "bg-[#7B5D3F] text-white border-[#7B5D3F] shadow-md shadow-[#7B5D3F]/20 scale-[1.02]"
                  : "bg-white/60 border-gray-200 text-gray-600 hover:bg-white/80 active:scale-95"
              }`}
              onClick={() => setValues({ ...values, emergenceType: "掘り出し" })}
            >
              掘り出し
            </button>
          </div>
        </Field>
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

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-[#A67C52] tracking-wider uppercase">幼虫時データ</span>
            <button
              type="button"
              onClick={handleLarvaDataPaste}
              className="flex items-center gap-1 text-[10px] font-black text-[#FF9800] bg-[#FF9800]/5 px-2 py-1 rounded-lg"
            >
              <Clipboard size={12} /> クリップボードから貼付
            </button>
          </div>
          <textarea
            value={values.larvaMemo}
            onChange={(e) => setValues({ ...values, larvaMemo: e.target.value })}
            placeholder="幼虫時の詳細な履歴など"
            rows={4}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-[#FF9800] outline-none transition-all"
          />
        </div>

        <BottomSheetInput
          label="メモ / 備考"
          value={values.memo || ""}
          type="textarea"
          placeholder="管理上のメモなど"
          onChange={(val) => setValues({ ...values, memo: val })}
        />
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 bg-white/95 backdrop-blur-sm -mx-6 px-6 py-4 border-t border-gray-100 flex gap-3 z-50 pb-[calc(92px+env(safe-area-inset-bottom,16px))]">
        <button
          type="button"
          className="flex-1 h-10 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all select-none"
          onClick={onCancel}
        >
          キャンセル
        </button>
        <button 
          type="submit" 
          className="flex-[2] h-10 rounded-2xl font-bold text-white bg-[#7B5D3F] shadow-lg shadow-[#7B5D3F]/30 hover:brightness-110 active:scale-95 transition-all select-none"
        >
          保存する
        </button>
      </div>
    </form>
  );
}
