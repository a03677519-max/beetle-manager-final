"use client";

import { useState, useEffect, useRef } from "react";
import { DateRollField, Field } from "@/components/entry-fields";
import type { AdultFormValues } from "@/types/beetle";
import { EntryBaseFields } from "@/components/beetle/shared/entry-base-fields";
import { useBeetleStore } from "@/store/use-beetle-store";

export function AdultForm({
  initialValues,
  onSubmit,
  onCancel,
}: {
  initialValues: AdultFormValues;
  onSubmit: (value: AdultFormValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<AdultFormValues>(initialValues);
  const [activeSection, setActiveSection] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Effect to synchronize internal form state with external initialValues prop.
  // This is important if the parent component can change `initialValues`
  // while this component is still mounted (e.g., for editing different entries).
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

    const sectionIds = ["basic-info", "management", "timeline", "extra-notes"];
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
      if (!target || !(target instanceof Element)) return;

      const isOutsideForm = formRef.current && !formRef.current.contains(target);
      // ポータル要素または「無視属性」を持つ要素（タブ切り替えボタン等）の場合は閉じない
      const isIgnored = target.closest?.('[data-portal="true"]') || target.closest?.('[data-ignore-click-outside="true"]');

      if (isOutsideForm && !isIgnored) {
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

  return (
    <form
      ref={formRef}
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      {/* Quick Nav */}
      <nav className="sticky top-0 z-30 py-3 -mx-4 px-4 bg-[#F8F9FA]/80 backdrop-blur-md flex gap-2 overflow-x-auto no-scrollbar border-b border-white/20 mb-2">
        {[
          { id: "basic-info", label: "基本情報" },
          { id: "management", label: "管理名" },
          { id: "timeline", label: "活動記録" },
          { id: "extra-notes", label: "メモ" },
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

      <section id="basic-info" className="scroll-mt-20 bg-white/40 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-sm space-y-4">
        <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-2 border-l-4 border-[#2D5A27] pl-3">Basic Info</div>
        <EntryBaseFields
          {...values}
          linkedEntryId={values.linkedEntryId}
          allEntries={useBeetleStore.getState().entries}
          onChange={(patch) => setValues({ ...values, ...patch })}
        />
      </section>

      <section id="management" className="scroll-mt-20 bg-white/40 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-sm space-y-4">
        <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-2 border-l-4 border-[#2D5A27] pl-3">Management</div>
        <Field label="管理名 (No/名前)">
          <input
            value={values.managementName || ""}
            placeholder="例: P-01 / ヘラクレス太郎"
            className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/20 outline-none transition-all"
            onChange={(e) => setValues({ ...values, managementName: e.target.value })}
          />
        </Field>
      </section>

      <section id="timeline" className="scroll-mt-20 bg-white/40 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-sm space-y-5">
        <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-2 border-l-4 border-[#2D5A27] pl-3">Timeline</div>
        <DateRollField
          label="羽化日"
          value={values.emergenceDate}
          onChange={(value) => setValues({ ...values, emergenceDate: value })}
        />
        <Field label="羽化/掘り出し">
          <div className="flex space-x-2">
            <button
              type="button"
              className={`flex-1 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all duration-200 select-none ${
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
              className={`flex-1 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all duration-200 select-none ${
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
      </section>

      <section id="extra-notes" className="scroll-mt-20 bg-white/40 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-sm space-y-4">
        <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest mb-2 border-l-4 border-[#2D5A27] pl-3">Extra Notes</div>
        <Field label="幼虫時データ">
          <textarea
            value={values.larvaMemo}
            rows={4}
            className="w-full bg-white/60 border border-gray-200 rounded-2xl px-4 py-3 focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/20 outline-none transition-all text-sm"
            onChange={(event) =>
              setValues({ ...values, larvaMemo: event.target.value })
            }
          />
        </Field>
      </section>

      {/* Actions */}
      <div className="pt-6 pb-10 flex gap-3">
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
