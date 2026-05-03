"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { CountRollField, Field, DateRollField, BottomSheetInput, MoistureField, PressureField } from "@/components/entry-fields";
import type { BeetleEntry, LarvaFormValues, LarvaLog, LogStage, Gender } from "@/types/beetle";
import { EntryBaseFields } from "@/components/beetle/shared/entry-base-fields";
import { today, daysBetween } from "@/lib/utils";

/**
 * 幼虫登録・編集用フォーム
 * 羽化ステータスによる動的表示、羽化までの日数計算、管理名入力をサポート
 */
export function LarvaForm({
  initialValues,
  onSubmit,
  onCancel,
  allEntries,
  dateType = "hatch",
  onDateTypeChange,
  id,
  className,
}: {
  initialValues: LarvaFormValues;
  onSubmit: (value: LarvaFormValues, count: number) => void;
  onCancel: () => void;
  allEntries: BeetleEntry[];
  dateType?: "hatch" | "set" | "extraction";
  onDateTypeChange?: (type: "hatch" | "set" | "extraction") => void;
  id?: string;
  className?: string;
}) {
  const [values, setValues] = useState<LarvaFormValues>(initialValues);
  const [count, setCount] = useState(1);
  const [setStartDate, setSetStartDate] = useState(today());
  const [setEndDate, setSetEndDate] = useState(today());

  const formRef = useRef<HTMLFormElement>(null);
  const isEmerged = !!values.actualEmergenceDate;

  useEffect(() => {
    // 日付文字列を YYYY-MM-DD に正規化
    const fmt = (d?: string) => d ? d.slice(0, 10) : "";
    const hatch = fmt(initialValues.hatchDate);
    const extraction = fmt(initialValues.extractionDate);
    
    setValues({
      ...initialValues,
      hatchDate: hatch,
      extractionDate: extraction,
      actualEmergenceDate: fmt(initialValues.actualEmergenceDate),
    });

    // セット期間用の日付を初期化（既存の日付があれば優先、なければ作成日や今日）
    setSetStartDate(hatch || fmt(initialValues.createdAt) || today());
    setSetEndDate(extraction || today());
  }, [initialValues, initialValues.id]);

  // タブ切り替え時に日付データを同期する
  useEffect(() => {
    const fmt = (d?: string) => (d ? d.slice(0, 10) : "");
    // 現在保持している有効な日付を取得。既存の値がある場合はそれを優先する。
    const currentActiveDate =
      values.hatchDate ||
      values.extractionDate ||
      (initialValues.createdAt ? fmt(initialValues.createdAt) : today());
    
    if (dateType === "hatch") {
      if (!values.hatchDate) setValues(prev => ({ ...prev, hatchDate: currentActiveDate }));
    } else if (dateType === "extraction") {
      if (!values.extractionDate) setValues(prev => ({ ...prev, extractionDate: currentActiveDate }));
    } else if (dateType === "set") {
      // セット期間タブでは値をクリアせず、開始・終了日ピッカーに同期させる
      setSetStartDate(prev => prev || values.hatchDate || fmt(initialValues.hatchDate) || today());
      setSetEndDate(prev => prev || values.extractionDate || fmt(initialValues.extractionDate) || today());
    }
  }, [dateType, initialValues.createdAt, initialValues.hatchDate, initialValues.extractionDate]);

  useEffect(() => {
    if (!initialValues.id && (!values.logs || values.logs.length === 0)) {
      addRecord();
    }
  }, [initialValues.id]);

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

  // 飼育ログの追加処理
  const addRecord = () => {
    const latestLog = values.logs?.[0];
    const newRecord: LarvaLog = {
      id: "temp-id",
      date: today(),
      stage: latestLog?.stage || "L1",
      weight: 0,
      substrate: latestLog?.substrate || "",
      pressure: latestLog?.pressure || 3,
      moisture: latestLog?.moisture || 3,
      bottleSize: latestLog?.bottleSize || "",
      gender: latestLog?.gender || "不明",
      temperature: latestLog?.temperature || "",
    };
    setValues({ ...values, logs: [newRecord, ...(values.logs || [])] });
  };

  // 孵化日から羽化までの日数を計算
  const daysUntilEmergence = useMemo(() => {
    const hatchDate = values.hatchDate;
    if (!hatchDate || !values.actualEmergenceDate) return null;
    return daysBetween(hatchDate, values.actualEmergenceDate);
  }, [values.actualEmergenceDate, values.hatchDate]);

  // 入力されたデータから体重と温度の推移を計算（簡易グラフ用データ）
  const logStats = useMemo(() => {
    const logs = values.logs || [];
    if (logs.length === 0) return null;
    const weights = logs.map(r => r.weight).filter(w => w > 0);
    const temps = logs.map(r => parseFloat(r.temperature)).filter(t => !isNaN(t) && t > 0);
    return {
      maxWeight: weights.length > 0 ? Math.max(...weights) : 0,
      avgTemp: temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : 0
    };
  }, [values.logs]);

  return (
    <form
      id={id}
      ref={formRef}
      className={`flex flex-col h-full overflow-hidden ${className || ''}`}
      onSubmit={(event) => {
        event.preventDefault();
        const finalValues = { ...values };
        
        if (dateType === "hatch") {
          // 値が空の場合はフォールバックを適用してリセットを防ぐ
          finalValues.hatchDate = finalValues.hatchDate || (initialValues.createdAt ? initialValues.createdAt.slice(0, 10) : today());
          finalValues.extractionDate = ""; // 孵化データとして保存
        } else if (dateType === "extraction") {
          finalValues.extractionDate = finalValues.extractionDate || (initialValues.createdAt ? initialValues.createdAt.slice(0, 10) : today());
          finalValues.hatchDate = ""; // 割出データとして保存
        } else if (dateType === "set") {
          finalValues.extractionDate = setEndDate;
          finalValues.hatchDate = setStartDate;
        }
        onSubmit(finalValues, count);
      }}
    >
      <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm space-y-2 flex-1 overflow-y-auto mb-4">
        <EntryBaseFields
          {...values}
          managementName={values.managementName || ""}
          allEntries={allEntries}
          onChange={(patch) => setValues({ ...values, ...patch })}
        />

        <div className="pt-2 border-t border-gray-50 space-y-3">
          {dateType === "hatch" ? (
            <DateRollField
              label="孵化日"
              value={values.hatchDate || ""}
              onChange={(value) => setValues({ ...values, hatchDate: value })}
            />
          ) : dateType === "set" ? (
            <div className="grid grid-cols-2 gap-4">
              <DateRollField label="開始日" value={setStartDate} onChange={setSetStartDate} />
              <DateRollField label="終了日" value={setEndDate} onChange={setSetEndDate} />
            </div>
          ) : (
            <DateRollField
              label="割出日"
              value={values.extractionDate || ""}
              onChange={(value) => setValues({ ...values, extractionDate: value })}
            />
          )}

          <BottomSheetInput
            label="備考"
            value={values.memo || ""}
            type="textarea"
            placeholder="一括適用するメモ・備考"
            onChange={(val) => setValues({ ...values, memo: val })}
          />

          <div className="scale-90 origin-left"><CountRollField value={count} onChange={setCount} /></div>
        </div>

        <div className="pt-2 border-t border-gray-50">
        <div className="field">
          <label className="flex items-center gap-3 py-0.5">
            <input
              type="checkbox"
              className="w-4 h-4 rounded-lg border-gray-300 text-[#FF9800] focus:ring-[#FF9800] select-none"
              checked={isEmerged} // Keep checked
              onChange={(e) =>
                setValues({
                  ...values,
                  actualEmergenceDate: e.target.checked ? today() : "",
                })
              }
            />
            <span className="text-sm font-bold text-gray-700">羽化済みとして登録</span>
          </label>
        </div> {/* Keep div */}

        {isEmerged && (
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <DateRollField
              label="羽化日"
              value={values.actualEmergenceDate}
              onChange={(value) =>
                setValues({ ...values, actualEmergenceDate: value })
              }
            />
            {daysUntilEmergence !== null && (
              <div className="flex items-baseline gap-2 px-3 py-2 bg-[#FF9800]/5 rounded-xl border border-[#FF9800]/10">
                <span className="text-[10px] font-black text-[#EF6C00] uppercase tracking-wider">羽化までの日数:</span>
                <span className="text-xl font-black text-[#EF6C00] leading-none">{daysUntilEmergence}</span>
                <span className="text-xs font-bold text-[#EF6C00]">日</span>
              </div>
            )}
            <Field label="羽化/掘り出し">
              <div className="flex space-x-2">
                <button
                  type="button"
                  className={`flex-1 px-4 py-1.5 rounded-xl border font-bold text-sm transition-all select-none ${
                    values.emergenceType === "羽化" // Keep condition
                      ? "bg-[#FF9800] text-white border-[#FF9800] shadow-md shadow-[#FF9800]/20 scale-[1.02]"
                      : "bg-white/60 border-gray-200 text-gray-600 hover:bg-white/80 active:scale-95"
                  }`}
                  onClick={() => setValues({ ...values, emergenceType: "羽化" })}
                >
                  羽化
                </button>
                <button
                  type="button"
                  className={`flex-1 px-4 py-1.5 rounded-xl border font-bold text-sm transition-all select-none ${
                    values.emergenceType === "掘り出し" // Keep condition
                      ? "bg-[#FF9800] text-white border-[#FF9800] shadow-md shadow-[#FF9800]/20 scale-[1.02]"
                      : "bg-white/60 border-gray-200 text-gray-600 hover:bg-white/80 active:scale-95"
                  }`}
                  onClick={() => setValues({ ...values, emergenceType: "掘り出し" })}
                >
                  掘り出し
                </button>
              </div>
            </Field>
          </div>
        )}
        </div>

        <div className="pt-2 border-t border-gray-50">
        <div className="flex justify-between items-center mb-2">
          <div className="text-[10px] font-black text-[#BCAAA4] uppercase tracking-widest border-l-4 border-[#FF9800] pl-3">飼育ログ</div>
          <button // Keep button
            type="button"
            onClick={addRecord}
            className="text-[10px] bg-[#FF9800] text-white px-4 py-1.5 rounded-full font-black shadow-sm active:scale-95 transition-all select-none"
          >
            + ログを追加
          </button>
        </div>

        {logStats && (
          <div className="bg-[#FF9800]/5 rounded-2xl p-2 border border-[#FF9800]/10 flex justify-around">
            <div className="text-center">
              <div className="text-[9px] font-black text-[#EF6C00] uppercase">最大体重</div>
              <div className="text-xl font-black text-[#EF6C00]">{logStats.maxWeight}<span className="text-xs ml-0.5">g</span></div>
            </div>
            <div className="w-px bg-[#FF9800]/20 my-1" />
            <div className="text-center">
              <div className="text-[9px] font-black text-[#EF6C00] uppercase">平均管理温度</div>
              <div className="text-xl font-black text-[#EF6C00]">{logStats.avgTemp}<span className="text-xs ml-0.5">℃</span></div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {values.logs?.map((record, index) => (
            <div key={index} className="relative p-2 bg-white rounded-xl border border-gray-100 shadow-sm space-y-1.5">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-xs font-black text-gray-400">LOG #{(values.logs?.length || 0) - index}</span>
                <button
                  type="button"
                  className="text-red-400 p-1 select-none"
                  onClick={() => {
                    const newLogs = [...(values.logs || [])];
                    newLogs.splice(index, 1);
                    setValues({ ...values, logs: newLogs });
                  }}
                >
                  <span className="text-[10px] font-bold">削除</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DateRollField
                  label="計測日"
                  value={record.date}
                  onChange={(val) => {
                    const newLogs = [...(values.logs || [])];
                    newLogs[index] = { ...record, date: val };
                    setValues({ ...values, logs: newLogs });
                  }}
                />
                <Field label="体重 (g)">
                  <input
                    type="number"
                    step="0.1" // Keep step
                    value={record.weight}
                      className="w-full bg-white/80 border border-gray-200 rounded-xl px-2 py-1.5 text-sm font-bold focus:border-[#FF9800] focus:ring-2 focus:ring-[#FF9800]/20 outline-none"
                    onChange={(e) => {
                      const newLogs = [...(values.logs || [])];
                      newLogs[index] = { ...record, weight: parseFloat(e.target.value) || 0 };
                      setValues({ ...values, logs: newLogs });
                    }}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="加齢状況">
                  <div className="flex bg-gray-100/50 p-1 rounded-xl">
                    {['L1', 'L2', 'L3'].map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all select-none ${record.stage === stage ? 'bg-white shadow-sm text-[#FF9800]' : 'text-gray-400'}`}
                        onClick={() => {
                          const newLogs = [...(values.logs || [])];
                          newLogs[index] = { ...record, stage: stage as LogStage };
                          setValues({ ...values, logs: newLogs });
                        }}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="雌雄">
                  <div className="flex bg-gray-100/50 p-1 rounded-xl">
                    {['♂', '♀', '不明'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all select-none ${record.gender === s ? 'bg-white shadow-sm text-[#FF9800]' : 'text-gray-400'}`}
                        onClick={() => {
                          const newLogs = [...(values.logs || [])];
                          newLogs[index] = { ...record, gender: s as Gender };
                          setValues({ ...values, logs: newLogs });
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <BottomSheetInput
                    label="マット名"
                    value={record.substrate}
                    placeholder="マットの種類"
                    suggestions={suggestions.substrate}
                    onChange={(val) => {
                      const newLogs = [...(values.logs || [])];
                      newLogs[index] = { ...record, substrate: val };
                      setValues({ ...values, logs: newLogs });
                    }}
                  />
                  <BottomSheetInput
                    label="ボトルサイズ"
                    value={record.bottleSize}
                    placeholder="例: 800cc"
                    suggestions={suggestions.bottleSize}
                    onChange={(val) => {
                      const newLogs = [...(values.logs || [])];
                      newLogs[index] = { ...record, bottleSize: val };
                      setValues({ ...values, logs: newLogs });
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <MoistureField
                    value={record.moisture}
                    onChange={(val) => {
                      const newLogs = [...(values.logs || [])];
                      newLogs[index] = { ...record, moisture: val };
                      setValues({ ...values, logs: newLogs });
                    }}
                  />
                  <PressureField
                    value={record.pressure}
                    onChange={(val) => {
                      const newLogs = [...(values.logs || [])];
                      newLogs[index] = { ...record, pressure: val };
                      setValues({ ...values, logs: newLogs });
                    }}
                  />
                </div>
                <BottomSheetInput
                  label="温度 (℃)"
                    value={record.temperature}
                    placeholder="温度"
                    onChange={(val) => {
                      const newLogs = [...(values.logs || [])];
                      newLogs[index] = { ...record, temperature: val };
                      setValues({ ...values, logs: newLogs });
                    }}
                  />
              </div>
            </div>
          ))}
        </div>
        </div>

        {/* ナビゲーションバー回避用のスペーサー */}
        <div className="h-32" />
      </div>
    </form>
  );
}
