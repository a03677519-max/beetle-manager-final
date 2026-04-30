"use client";
import { Home, Bug, CircleDot, Database, ListChecks, PieChart, Plus } from "lucide-react";

export function Navbar({ activeTab, setActiveTab, onTabChange, onAdd }: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void, 
  onTabChange?: (tab: string) => void,
  onAdd: () => void 
}) {
  const tabs = [
    { name: "ホーム", icon: Home },
    { name: "成虫", icon: Bug },
    { name: "幼虫", icon: CircleDot },
    { name: "産卵セット", icon: Database },
    { name: "タスク", icon: ListChecks },
    { name: "分析", icon: PieChart },
  ];

  return (
    <nav className="fixed bottom-2 left-2 right-2 bg-white/90 backdrop-blur-md border border-[#DEE2E6] rounded-2xl h-[64px] flex justify-around items-center z-40 shadow-xl">
      {tabs.slice(0, 3).map((tab) => (
        <button
          key={tab.name}
          onClick={() => {
            setActiveTab(tab.name);
            onTabChange?.(tab.name);
          }}
          className={`flex flex-col items-center p-2 rounded-lg ${activeTab === tab.name ? "text-[var(--primary)]" : "text-gray-500"}`}
        >
          <tab.icon size={22} />
          <span className="text-[10px]">{tab.name}</span>
        </button>
      ))}
      
      <button 
        onClick={onAdd}
        className="w-[60px] h-[60px] bg-[var(--primary)] text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(74,144,226,0.3)] -mt-12 border-4 border-[#F8F9FA] active:scale-95 transition-all"
      >
        <Plus size={24} />
      </button>

      {tabs.slice(3).map((tab) => (
        <button
          key={tab.name}
          onClick={() => {
            setActiveTab(tab.name);
            onTabChange?.(tab.name);
          }}
          className={`flex flex-col items-center p-2 rounded-lg ${activeTab === tab.name ? "text-[var(--primary)]" : "text-gray-500"}`}
        >
          <tab.icon size={22} />
          <span className="text-[10px]">{tab.name}</span>
        </button>
      ))}
    </nav>
  );
}
