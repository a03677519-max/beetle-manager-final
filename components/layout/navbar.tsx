import { Home, Bug, CircleDot, Database, ListChecks, PieChart } from "lucide-react";

export function Navbar({ activeTab, setActiveTab, onTabChange }: { activeTab: string, setActiveTab: (tab: string) => void, onTabChange?: (tab: string) => void }) {
  const tabs = [
    { name: "ホーム", icon: Home },
    { name: "成虫", icon: Bug },
    { name: "幼虫", icon: CircleDot },
    { name: "産卵セット", icon: Database },
    { name: "タスク", icon: ListChecks },
    { name: "分析", icon: PieChart },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-white/20 p-2 flex justify-around">
      {tabs.map((tab) => (
        <button
          key={tab.name}
          onClick={() => {
            setActiveTab(tab.name);
            onTabChange?.(tab.name);
          }}
          className={`flex flex-col items-center p-2 rounded-lg ${activeTab === tab.name ? "text-green-600" : "text-gray-500"}`}
        >
          <tab.icon size={20} />
          <span className="text-[10px]">{tab.name}</span>
        </button>
      ))}
    </nav>
  );
}
