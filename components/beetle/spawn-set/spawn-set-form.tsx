"use client";

import { useState, useEffect, useRef } from "react";
import {
  CohabitationField,
  CountRollField,
  DateRollField,
  Field,
  MoistureField,
  PressureField,
  SwitchBotTemperatureField,
} from "@/components/entry-fields";
import type { BeetleEntry, SpawnSetFormValues } from "@/types/beetle";
import { EntryBaseFields } from "@/components/beetle/shared/entry-base-fields";

export function SpawnSetForm({
  initialValues,
  onSubmit,
  onCancel,
  onFetchTemperature,
  isFetchingTemperature,
  allEntries,
}: {
  initialValues: SpawnSetFormValues;
  onSubmit: (value: SpawnSetFormValues, count: number) => void;
  onCancel: () => void;
  onFetchTemperature: (setter: (value: string) => void) => void;
  isFetchingTemperature: boolean;
  allEntries: BeetleEntry[];
}) {
  const [values, setValues] = useState<SpawnSetFormValues>(initialValues);
  const [count, setCount] = useState(1);
  const [activeSection, setActiveSection] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // 外部からの初期値変更を同期
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

    const sectionIds = ["set-identity", "environment"];
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

  return (
    <form
      ref={formRef}
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values, count);
      }}
    >
      {/* Quick Nav */}
      <nav className="sticky top-[90px] z-30 py-2 -mx-4 px-4 bg-[#F8F9FA]/80 backdrop-blur-md flex gap-2 overflow-x-auto no-scrollbar border-b border-white/20 mb-1">
        {[
          { id: "set-identity", label: "基本" },
          { id: "environment", label: "環境" },
        ].map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full border shadow-sm text-[11px] font-bold transition-all active:scale-95 select-none ${
              activeSection === item.id
                ? "bg-[#2D5A27] text-white border-[#2D5A27] shadow-md"
                : "bg-white/80 border-white/60 text-[#2D5A27] hover:bg-gray-50"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <section id="set-identity" className="scroll-mt-[150px] bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-3">
        <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-2 border-l-4 border-[#2D5A27] pl-3">Set Identity</div>
        <DateRollField
          label="セット日"
          value={values.setDate}
          onChange={(value) => setValues({ ...values, setDate: value })}
        />
        <EntryBaseFields
          {...values}
          allEntries={allEntries}
          onChange={(patch) => setValues({ ...values, ...patch })}
        />
      </section>

      <section id="environment" className="scroll-mt-[150px] bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-3">
        <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-2 border-l-4 border-[#2D5A27] pl-3">Environment</div>
        <div className="grid grid-cols-2 gap-3">
        <Field label="使用マット">
          <input
            value={values.substrate}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/20 outline-none transition-all"
            onChange={(event) => setValues({ ...values, substrate: event.target.value })}
          />
        </Field>
        <Field label="容器サイズ">
          <input
            value={values.containerSize}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/20 outline-none transition-all"
            onChange={(event) => setValues({ ...values, containerSize: event.target.value })}
          />
        </Field>
      </div>

      <PressureField
        value={values.pressure}
        onChange={(value) => setValues({ ...values, pressure: value })}
      />
      <MoistureField
        value={values.moisture}
        onChange={(value) => setValues({ ...values, moisture: value })}
      />
      <SwitchBotTemperatureField
        value={values.temperature}
        onChange={(value) => setValues({ ...values, temperature: value })}
        onFetch={() =>
          onFetchTemperature((value) =>
            setValues((current) => ({ ...current, temperature: value }))
          )
        }
        isFetching={isFetchingTemperature}
      />
      <CohabitationField
        value={values.cohabitation}
        onChange={(value) => setValues({ ...values, cohabitation: value })}
      />
      </section>

      {/* Actions */}
      <div className="pt-4 pb-6 flex gap-3">
        <button
          type="button"
          className="flex-1 h-12 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all select-none"
          onClick={onCancel}
        >
          キャンセル
        </button>
        <button 
          type="submit" 
          className="flex-[2] h-12 rounded-2xl font-bold text-white bg-[#2D5A27] shadow-lg shadow-[#2D5A27]/30 hover:brightness-110 active:scale-95 transition-all select-none"
        >
          保存する
        </button>
      </div>
    </form>
  );
}
