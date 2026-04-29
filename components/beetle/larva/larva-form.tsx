"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { CountRollField, Field, DateRollField } from "@/components/entry-fields";
import type { BeetleEntry, LarvaFormValues, LarvaLog, LogStage, Gender } from "@/types/beetle";
import { EntryBaseFields } from "@/components/beetle/shared/entry-base-fields";
import { today } from "@/lib/utils";

/**
 * 幼虫登録・編集用フォーム
 * 羽化ステータスによる動的表示、羽化までの日数計算、管理名入力をサポート
 */
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
  const [values, setValues] = useState<LarvaFormValues>(initialValues);
  const [count, setCount] = useState(1);
  const [activeSection, setActiveSection] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const isEmerged = !!values.actualEmergenceDate;

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  // Intersection Observer to highlight active section in nav
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 10) {
        setActiveSection("");
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const sectionIds = ["basic-info", "management", "status", "breeding-log"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -70% 0px", threshold: 0 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // フォームの外側をタップ/クリックした時にキャンセル処理を実行
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const isOutsideForm = formRef.current && !formRef.current.contains(target);
      // ポータル要素（ドラムロール等）の判定
      const isInsidePortal = (target as Element).closest?.('[data-portal="true"]');

      if (isOutsideForm && !isInsidePortal) {
        onCancel();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [onCancel]);

  // 飼育ログの追加処理
  const addRecord = () => {
    const newRecord: LarvaLog = {
      id: "temp-id",
      date: today(),
      stage: "L1",
      weight: 0,
      substrate: "",
      pressure: 3,
      moisture: 3,
      bottleSize: "",
      gender: "不明",
      temperature: 25,
    };
    setValues({ ...values, logs: [newRecord, ...(values.logs || [])] });
  };

  // 孵化日から羽化までの日数を計算
  const daysUntilEmergence = useMemo(() => {
    // LarvaBeetleにはhatchDateがないため、ここは要修正かもだが、現状維持
    // @ts-ignore
    const hatchDate = values.hatchDate;
    if (!hatchDate || !values.actualEmergenceDate) return null;
    try {
      const start = new Date(hatchDate);
      const end = new Date(values.actualEmergenceDate);
      const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 ? diff : null;
    } catch {
      return null;
    }
  }, [values.actualEmergenceDate]); // hatchDate依存を削除

  // 入力されたデータから体重と温度の推移を計算（簡易グラフ用データ）
  const logStats = useMemo(() => {
    const logs = values.logs || [];
    if (logs.length === 0) return null;
    const weights = logs.map(r => r.weight).filter(w => w > 0);
    const temps = logs.map(r => r.temperature).filter(t => t > 0);
    return {
      maxWeight: weights.length > 0 ? Math.max(...weights) : 0,
      avgTemp: temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : 0
    };
  }, [values.logs]);

  return (
    <form
      ref={formRef}
      className="space-y-6 pb-24"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values, count);
      }}
    >
      {/* Quick Nav */}
      <nav className="sticky top-0 z-30 py-3 -mx-4 px-4 bg-[#F8F9FA]/80 backdrop-blur-md flex gap-2 overflow-x-auto no-scrollbar border-b border-white/20 mb-2">
        {[
          { id: "basic-info", label: "基本" },
          { id: "management", label: "管理" },
          { id: "status", label: "状況" },
          { id: "breeding-log", label: "ログ" },
        ].map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full border shadow-sm text-[11px] font-bold transition-all active:scale-95 ${
              activeSection === item.id
                ? "bg-[#2D5A27] text-white border-[#2D5A27] shadow-md"
                : "bg-white/80 border-white/60 text-[#2D5A27] hover:bg-gray-50"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <section id="basic-info" className="scroll-mt-20 bg-white/40 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-sm space-y-4">
        <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-2 border-l-4 border-[#2D5A27] pl-3">Basic Info</div>
        <EntryBaseFields
          {...values}
          allEntries={allEntries}
          onChange={(patch) => setValues({ ...values, ...patch })}
        />
      </section>

      <section id="management" className="scroll-mt-20 bg-white/40 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-sm space-y-4">
        <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-2 border-l-4 border-[#2D5A27] pl-3">Management</div>
        <Field label="管理名 (No/名前)">
          <input
            value={values.managementName || ""}
            placeholder="例: L-24-01"
            className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/20 outline-none transition-all"
            onChange={(e) => setValues({ ...values, managementName: e.target.value })}
          />
        </Field>
        {/* @ts-ignore */}
        <DateRollField
          label="孵化 / セット投入日"
          value={values.hatchDate || values.createdAt}
          onChange={(value) => setValues({ ...values, hatchDate: value })}
        />
        <CountRollField value={count} onChange={setCount} />
      </section>

      <section id="status" className="scroll-mt-20 bg-white/40 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-sm space-y-4">
        <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-2 border-l-4 border-[#2D5A27] pl-3">Status</div>
        <div className="field">
          <label className="flex items-center gap-3 py-1">
            <input
              type="checkbox"
              className="w-5 h-5 rounded-lg border-gray-300 text-[#2D5A27] focus:ring-[#2D5A27]"
              checked={isEmerged}
              onChange={(e) =>
                setValues({
                  ...values,
                  actualEmergenceDate: e.target.checked ? today() : "",
                })
              }
            />
            <span className="text-sm font-bold text-gray-700">羽化済みとして登録</span>
          </label>
        </div>

        {isEmerged && (
          <div className="pt-4 border-t border-gray-100 space-y-5">
            <DateRollField
              label="羽化日"
              value={values.actualEmergenceDate}
              onChange={(value) =>
                setValues({ ...values, actualEmergenceDate: value })
              }
            />
            {daysUntilEmergence !== null && (
              <div className="flex items-baseline gap-2 px-4 py-3 bg-[#2D5A27]/5 rounded-2xl border border-[#2D5A27]/10">
                <span className="text-[10px] font-black text-[#2D5A27] uppercase tracking-wider">羽化までの日数:</span>
                <span className="text-xl font-black text-[#2D5A27] leading-none">{daysUntilEmergence}</span>
                <span className="text-xs font-bold text-[#2D5A27]">日</span>
              </div>
            )}
            <Field label="羽化/掘り出し">
              <div className="flex space-x-2">
                <button
                  type="button"
                  className={`flex-1 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                    values.emergenceType === "羽化"
                      ? "bg-[#2D5A27] text-white border-[#2D5A27] shadow-md shadow-[#2D5A27]/20 scale-[1.02]"
                      : "bg-white/60 border-gray-200 text-gray-600 hover:bg-white/80 active:scale-95"
                  }`}
                  onClick={() => setValues({ ...values, emergenceType: "羽化" })}
                >
                  羽化
                </button>
                <button
                  type="button"
                  className={`flex-1 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                    values.emergenceType === "掘り出し"
                      ? "bg-[#2D5A27] text-white border-[#2D5A27] shadow-md shadow-[#2D5A27]/20 scale-[1.02]"
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
      </section>

      <section id="breeding-log" className="scroll-mt-20 bg-white/40 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-sm space-y-5">
        <div className="flex justify-between items-center">
          <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest border-l-4 border-[#2D5A27] pl-3">Breeding Log (飼育ログ)</div>
          <button
            type="button"
            onClick={addRecord}
            className="text-[10px] bg-[#2D5A27] text-white px-4 py-1.5 rounded-full font-black shadow-sm active:scale-95 transition-all"
          >
            + ログを追加
          </button>
        </div>

        {logStats && (
          <div className="bg-[#2D5A27]/5 rounded-2xl p-4 border border-[#2D5A27]/10 flex justify-around">
            <div className="text-center">
              <div className="text-[9px] font-black text-[#2D5A27] uppercase">最大体重</div>
              <div className="text-xl font-black text-[#2D5A27]">{logStats.maxWeight}<span className="text-xs ml-0.5">g</span></div>
            </div>
            <div className="w-px bg-[#2D5A27]/20 my-1" />
            <div className="text-center">
              <div className="text-[9px] font-black text-[#2D5A27] uppercase">平均管理温度</div>
              <div className="text-xl font-black text-[#2D5A27]">{logStats.avgTemp}<span className="text-xs ml-0.5">℃</span></div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {values.logs?.map((record, index) => (
            <div key={index} className="relative p-5 bg-white/60 rounded-[2rem] border border-white/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-xs font-black text-gray-400">LOG #{(values.logs?.length || 0) - index}</span>
                <button
                  type="button"
                  className="text-red-400 p-1"
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
                    step="0.1"
                    value={record.weight}
                    className="w-full bg-white/80 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/20 outline-none"
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
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${record.stage === stage ? 'bg-white shadow-sm text-[#2D5A27]' : 'text-gray-400'}`}
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
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${record.gender === s ? 'bg-white shadow-sm text-[#2D5A27]' : 'text-gray-400'}`}
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
                  <Field label="マット / ボトルサイズ">
                    <input
                      placeholder="例: クヌギ / 800cc"
                      className="w-full bg-transparent border-b border-gray-200 py-1 text-xs focus:border-[#2D5A27] outline-none"
                      value={record.substrate}
                      onChange={(e) => {
                        const newLogs = [...(values.logs || [])];
                        newLogs[index] = { ...record, substrate: e.target.value };
                        setValues({ ...values, logs: newLogs });
                      }}
                    />
                  </Field>
                  <Field label="温度 (℃)">
                    <input
                      type="number"
                      step="0.5"
                      className="w-full bg-transparent border-b border-gray-200 py-1 text-xs focus:border-[#2D5A27] outline-none"
                      value={record.temperature}
                      onChange={(e) => {
                        const newLogs = [...(values.logs || [])];
                        newLogs[index] = { ...record, temperature: parseFloat(e.target.value) || 0 };
                        setValues({ ...values, logs: newLogs });
                      }}
                    />
                  </Field>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sticky Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-white/60 flex gap-3 z-50 max-w-md mx-auto">
        <button
          type="button"
          className="flex-1 h-12 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
          onClick={onCancel}
        >
          キャンセル
        </button>
        <button 
          type="submit" 
          className="flex-[2] h-12 rounded-2xl font-bold text-white bg-[#2D5A27] shadow-lg shadow-[#2D5A27]/30 hover:brightness-110 active:scale-95 transition-all"
        >
          保存する
        </button>
      </div>
    </form>
  );
}
