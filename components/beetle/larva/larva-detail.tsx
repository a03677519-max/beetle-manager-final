"use client";

import { useState } from "react";
import { Trash2, Download, Edit2 } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { daysBetween, formatDate, today } from "@/lib/utils";
import { useBeetleStore } from "@/store/use-beetle-store";
import type { LarvaBeetle } from "@/types/beetle";
import { LarvaLogForm } from "./larva-log-form";
import { Modal } from "@/components/ui/modal";
import { buildGenerationLabel } from "@/components/entry-fields";

export function LarvaDetail({
  entry,
  onFetchTemperature,
  isFetchingTemperature,
}: {
  entry: LarvaBeetle;
  onFetchTemperature: (setter: (value: string) => void) => void;
  isFetchingTemperature: boolean;
}) {
  const [editingLog, setEditingLog] = useState<LarvaBeetle['logs'][0] | null>(null);
  const deleteLarvaLog = useBeetleStore((state) => state.deleteLarvaLog);

  const chartData = [...entry.logs]
    .slice()
    .reverse()
    .map((log) => {
      const tempStr = String(log.temperature || "").trim();
      let tempVal = 0;
      // 21〜23 や 21-23 の形式を解析して平均（中間値）をグラフ用データにする
      if (tempStr.includes("〜") || tempStr.includes("-")) {
        const parts = tempStr.split(/[〜-]/).map(p => parseFloat(p.replace(/[^0-9.]/g, ""))).filter(p => !isNaN(p));
        if (parts.length > 0) {
          tempVal = parts.reduce((a, b) => a + b, 0) / parts.length;
        }
      } else {
        tempVal = parseFloat(tempStr.replace(/[^0-9.]/g, "")) || 0;
      }
      return {
        date: log.date,
        weight: Number(log.weight || 0),
        temperature: tempVal,
      };
    });

  const exportToCSV = () => {
    const headers = ["日付", "体重(g)", "温度(℃)", "ステージ", "性別", "マット", "詰圧", "水分", "ボトル"];
    const rows = entry.logs.map(log => [
      log.date, log.weight, log.temperature, log.stage, log.gender, log.substrate, log.pressure, log.moisture, log.bottleSize
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `breeding_log_${entry.japaneseName}.csv`);
    link.click();
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-50 p-4 rounded-2xl">
          <div className="text-xs text-gray-500">産地</div>
          <div className="font-bold text-gray-800 truncate">{entry.locality || "-"}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl">
          <div className="text-xs text-gray-500">累代</div>
          <div className="font-bold text-gray-800 truncate">{buildGenerationLabel(entry.generation)}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl">
          <div className="text-xs text-gray-500">孵化日</div>
          <div className="font-bold text-gray-800 truncate">{entry.hatchDate ? formatDate(entry.hatchDate) : "-"}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl">
          <div className="text-xs text-gray-500">割出日</div>
          <div className="font-bold text-gray-800 truncate">{entry.extractionDate ? formatDate(entry.extractionDate) : "-"}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl">
          <div className="text-xs text-gray-500">羽化日 ({entry.emergenceType})</div>
          <div className="font-bold text-gray-800 truncate">{entry.actualEmergenceDate ? formatDate(entry.actualEmergenceDate) : "未定"}</div>
        </div>
        <div className="bg-[#F1F3F5] p-4 rounded-2xl border border-gray-100">
          <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest">総ログ数</div>
          <div className="text-xl font-bold text-[#212529]">{entry.logs.length}件</div>
        </div>
        <div className="bg-[#F1F3F5] p-4 rounded-2xl border border-gray-100">
          <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest">最新体重</div>
          <div className="text-xl font-bold text-[#EF6C00]">{entry.logs[0]?.weight || "-"}g</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl">
          <div className="text-xs text-gray-500">育成日数</div>
          <div className="font-bold text-gray-800 truncate">
            {/* hatchDate（孵化日）または extractionDate（割出日）を優先して計算に使用 */}
            {entry.actualEmergenceDate 
              ? `${daysBetween(entry.hatchDate || entry.extractionDate || entry.createdAt, entry.actualEmergenceDate)}日`
              : `現在 ${daysBetween(entry.hatchDate || entry.extractionDate || entry.createdAt, today())}日目`}
          </div>
        </div>
        {entry.memo && (
          <div className="bg-gray-50 p-4 rounded-2xl col-span-2">
            <div className="text-xs text-gray-500">メモ</div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap mt-1">{entry.memo}</div>
          </div>
        )}
      </div>

      <section className="mt-6 bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
        <div className="text-[10px] font-black text-[#BCAAA4] mb-6 uppercase tracking-widest border-l-4 border-[#FF9800] pl-3">History Log</div>
        <div className="space-y-3">
          {entry.logs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">飼育ログはまだありません。</p>
          ) : (
            <div className="relative ml-2 border-l-2 border-gray-50 pl-6 space-y-6">
              {entry.logs.map((log) => (
                <div className="relative" key={log.id}>
                  <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-white border-4 border-[#FF9800] shadow-sm z-10 cursor-pointer" onClick={() => setEditingLog(log)} />
                  <div 
                    className="flex items-center justify-between bg-[#F8F9FA] border border-gray-50 p-4 rounded-2xl transition-active active:bg-gray-100 cursor-pointer shadow-sm"
                    onClick={() => setEditingLog(log)}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold bg-[#F5F0EB] px-2 py-0.5 rounded text-gray-500 uppercase">{log.stage}</span>
                        <span className="text-xs text-gray-400 font-medium">{formatDate(log.date)}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div className="font-black text-[#212529] text-lg">
                          {log.weight}g <span className="text-[10px] text-gray-400 font-normal">/ {log.temperature || "-"}℃</span>
                        </div>
                      </div>
                      <div className="mt-1 space-y-0.5 border-t border-gray-100 pt-1">
                        <div className="text-[11px] text-gray-600 font-bold flex gap-2">
                          <span className="truncate">{log.substrate || "マット未設定"}</span>
                          <span className="text-gray-300">|</span>
                          <span className="shrink-0">{log.bottleSize || "-"}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 flex gap-3">
                          <span>水分: {log.moisture}</span>
                          <span>詰圧: {log.pressure}</span>
                          <span className="ml-auto">性別: {log.gender}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="p-2 text-gray-300 hover:text-[#FF9800] transition-colors"
                        onClick={() => setEditingLog(log)}
                      >
                        <Edit2 size(16) />
                      </button>
                      <button
                        type="button"
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        onClick={() => {
                        if (window.confirm("このログを削除してもよろしいですか？一度削除すると元に戻せません。")) {
                          deleteLarvaLog(entry.id, log.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <LarvaLogForm
        lastLog={entry.logs[0]}
        onSubmit={(value) => useBeetleStore.getState().addLarvaLog(entry.id, value)}
        onFetchTemperature={onFetchTemperature}
        isFetchingTemperature={isFetchingTemperature}
      />
      <section className="mt-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">体重推移グラフ</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%"> {/* Keep ResponsiveContainer */}
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1"> {/* Keep linearGradient */}
                  <stop offset="5%" stopColor="#EF6C00" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#EF6C00" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#DEE2E6" vertical={false} />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
              <YAxis stroke="#9ca3af" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                 contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', color: '#EF6C00' }}
              />
              <Area type="monotone" dataKey="weight" stroke="#EF6C00" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" name="体重(g)" dot={{ r: 4, fill: "#EF6C00", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              <Area type="monotone" dataKey="temperature" stroke="#E67E22" strokeWidth={2} fill="transparent" name="温度(℃)" dot={{ r: 2, fill: "#E67E22" }} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 text-[10px] font-bold text-[#EF6C00] bg-[#EF6C00]/5 px-4 py-2 rounded-full hover:bg-[#EF6C00]/10 transition-colors"
          >
            <Download size={14} />
            データをCSV形式でダウンロード
          </button>
        </div>
      </section>

      <Modal
        isOpen={!!editingLog}
        onClose={() => setEditingLog(null)}
        title={editingLog ? "ログの詳細確認・編集" : "新規ログを追加"}
      >
        <LarvaLogForm
          initialLogValues={editingLog}
          onSave={(values) => {
            // Assuming useBeetleStore has an updateLarvaLog action
            // If not, you'll need to add it to your store definition.
            useBeetleStore.getState().updateLarvaLog(entry.id, values.id, values);
            setEditingLog(null);
          }}
          onCancel={() => setEditingLog(null)}
          onFetchTemperature={onFetchTemperature}
          isFetchingTemperature={isFetchingTemperature}
        />
      </Modal>
    </>
  );
}
