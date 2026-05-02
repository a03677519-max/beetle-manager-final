"use client";

import { motion } from "framer-motion";
import { X, Settings, Database, Cloud } from "lucide-react";
import { useBeetleStore } from "@/store/use-beetle-store";
import { BottomSheetInput } from "@/components/entry-fields";

export function SettingsView({ onClose }: { onClose: () => void }) {
  const { switchBot, gitHub, updateSwitchBot, updateGitHub } = useBeetleStore();

  return (
    <motion.div 
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      className="fixed inset-0 z-[100] bg-white flex flex-col p-6"
    >
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Settings className="text-[#FF9800]" size={24} />
          <h2 className="text-xl font-black text-[#4A3F35]">設定</h2>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-4 text-[#FF9800]">
            <Cloud size={18} />
            <h3 className="text-sm font-black uppercase tracking-widest">SwitchBot API</h3>
          </div>
          <div className="space-y-4">
            <BottomSheetInput label="Token" value={switchBot.token} onChange={(v) => updateSwitchBot({ token: v })} />
            <BottomSheetInput label="Secret" value={switchBot.secret} onChange={(v) => updateSwitchBot({ secret: v })} />
            <BottomSheetInput label="Device ID" value={switchBot.deviceId} onChange={(v) => updateSwitchBot({ deviceId: v })} />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4 text-[#FF9800]">
            <Database size={18} />
            <h3 className="text-sm font-black uppercase tracking-widest">GitHub Sync</h3>
          </div>
          <div className="space-y-4">
            <BottomSheetInput label="Repo (owner/name)" value={gitHub.repo} onChange={(v) => updateGitHub({ repo: v })} />
            <BottomSheetInput label="Token" value={gitHub.token} onChange={(v) => updateGitHub({ token: v })} />
          </div>
        </section>
      </div>
    </motion.div>
  );
}