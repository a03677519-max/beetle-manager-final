import React from 'react';

export type Stage = "卵" | "初令" | "2令" | "3令" | "蛹" | "成虫" | "幼虫";

const STAGE_CONFIG: Record<Stage, { icon: string, bg: string, text: string }> = {
  "卵": { icon: "🥚", bg: "bg-[#F8F9FA]", text: "text-[#6C757D]" },
  "初令": { icon: "🐛", bg: "bg-[#EBF8FF]", text: "text-[#2B6CB0]" },
  "2令": { icon: "🐛", bg: "bg-[#E1F5FE]", text: "text-[#0277BD]" },
  "3令": { icon: "🐛", bg: "bg-[#E0F2F1]", text: "text-[#00695C]" },
  "蛹": { icon: "📦", bg: "bg-[#FFF4E5]", text: "text-[#E67E22]" },
  "成虫": { icon: "🪲", bg: "bg-[#EBFBEE]", text: "text-[#2D5A27]" },
  "幼虫": { icon: "🐛", bg: "bg-[#E0F2F1]", text: "text-[#00695C]" },
};

export function StatusBadge({ stage, className = "" }: { stage: Stage, className?: string }) {
  const config = STAGE_CONFIG[stage];
  return (
    <span className={`text-[10px] h-[20px] flex items-center gap-1 px-2.5 rounded-full ${config.bg} ${config.text} font-black border border-black/[0.03] shadow-[0_1px_2px_rgba(0,0,0,0.02)] whitespace-nowrap uppercase tracking-wider ${className}`}>
      <span className="text-[12px]">{config.icon}</span> {stage}
    </span>
  );
}
