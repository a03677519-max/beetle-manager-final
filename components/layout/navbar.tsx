"use client";

import React from "react";
import { Bug, Baby, Plus, Package, BarChart3, CheckSquare, Settings } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onTabChange: (tab: string) => void;
  onAdd: () => void;
}

export function Navbar({ activeTab, setActiveTab, onTabChange, onAdd }: NavbarProps) {
  // ホームボタンを削除し、ナビゲーション項目を再定義
  const navItems = [
    { id: "成虫", icon: Bug, label: "成虫" },
    { id: "幼虫", icon: Baby, label: "幼虫" },
    { id: "産卵セット", icon: Package, label: "セット" },
    { id: "分析", icon: BarChart3, label: "分析" },
    { id: "タスク", icon: CheckSquare, label: "タスク" },
    { id: "設定", icon: Settings, label: "設定" }, // 右端に配置
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* 中央の追加ボタン (Floating Action Button) */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2">
        <button
          onClick={onAdd}
          className="w-14 h-14 bg-[#FF9800] text-white rounded-full shadow-[0_8px_20px_rgba(255,152,0,0.4)] flex items-center justify-center active:scale-90 transition-all border-4 border-white"
        >
          <Plus size={32} />
        </button>
      </div>

      {/* ナビゲーションバー本体 */}
      <nav className="bg-white/90 backdrop-blur-xl border-t border-gray-100 px-2 py-3 pb-[calc(12px+env(safe-area-inset-bottom,32px))] flex items-center justify-around shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                // 「設定」は永続的なタブ切り替えではなくアクション（モーダル）のため、
                // アクティブなタブの状態は更新せずに親へ通知する
                if (item.id !== "設定") {
                  setActiveTab(item.id);
                }
                onTabChange(item.id);
              }}
              className={`flex flex-col items-center gap-1 transition-all duration-300 min-w-[48px] ${
                isActive ? "text-[#FF9800]" : "text-gray-400"
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? "bg-[#FF9800]/10" : ""}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-black tracking-tighter ${isActive ? "opacity-100" : "opacity-60"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}