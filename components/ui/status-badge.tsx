import React from 'react';

export type Stage = "卵" | "幼虫" | "蛹" | "成虫";

const STAGE_CONFIG: Record<Stage, { icon: string, bg: string, text: string }> = {
  "卵": { icon: "🥚", bg: "bg-gray-100", text: "text-gray-800" },
  "幼虫": { icon: "🐛", bg: "bg-blue-100", text: "text-blue-800" },
  "蛹": { icon: "📦", bg: "bg-orange-100", text: "text-orange-800" },
  "成虫": { icon: "🪲", bg: "bg-green-100", text: "text-green-800" },
};

export function StatusBadge({ stage }: { stage: Stage }) {
  const config = STAGE_CONFIG[stage];
  return (
    <span className={`text-[12px] h-[24px] flex items-center px-3 rounded-full ${config.bg} ${config.text} font-medium`}>
      {config.icon} {stage}
    </span>
  );
}
