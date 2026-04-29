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
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-[var(--border)] h-[64px] flex justify-around items-center z-40">
      {tabs.slice(0, 3).map((tab) => (
        <button
          key={tab.name}
          onClick={() => {
            setActiveTab(tab.name);
            onTabChange?.(tab.name);
          }}
          className={`flex flex-col items-center p-2 rounded-lg ${activeTab === tab.name ? "text-[var(--primary)]" : "text-gray-500"}`}
        >
          <tab.icon size={20} />
          <span className="text-[10px]">{tab.name}</span>
        </button>
      ))}
      
      <button 
        onClick={onAdd}
        className="bg-[var(--primary)] text-white rounded-full shadow-lg h-[56px] w-[56px] flex items-center justify-center -mt-8 hover:bg-[var(--primary)]/90 transition-colors"
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
          <tab.icon size={20} />
          <span className="text-[10px]">{tab.name}</span>
        </button>
      ))}
    </nav>
  );
}
