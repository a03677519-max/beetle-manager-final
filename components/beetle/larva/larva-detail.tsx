"use client";

import { Trash2 } from "lucide-react";
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

export function LarvaDetail({
  entry,
  onFetchTemperature,
  isFetchingTemperature,
}: {
  entry: LarvaBeetle;
  onFetchTemperature: (setter: (value: string) => void) => void;
  isFetchingTemperature: boolean;
}) {
  const deleteLarvaLog = useBeetleStore((state) => state.deleteLarvaLog);

  const chartData = [...entry.logs]
    .slice()
    .reverse()
    .map((log) => ({
      date: log.date,
      weight: Number(log.weight || 0),
      temperature: Number(log.temperature || 0),
    }));

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#F1F3F5] p-4 rounded-2xl border border-gray-100">
          <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest">総ログ数</div>
          <div className="text-xl font-bold text-[#212529]">{entry.logs.length}件</div>
        </div>
        <div className="bg-[#F1F3F5] p-4 rounded-2xl border border-gray-100">
          <div className="text-[10px] font-black text-[#8B5A2B] uppercase tracking-widest">最新体重</div>
          <div className="text-xl font-bold text-[#2D5A27]">{entry.logs[0]?.weight || "-"}g</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl">
          <div className="text-xs text-gray-500">羽化日 ({entry.emergenceType})</div>
          <div className="font-bold text-gray-800 truncate">{entry.actualEmergenceDate ? formatDate(entry.actualEmergenceDate) : "未定"}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl">
          <div className="text-xs text-gray-500">総育成年数</div>
          <div className="font-bold text-gray-800 truncate">
            {entry.actualEmergenceDate 
              ? `${daysBetween(entry.createdAt, entry.actualEmergenceDate)}日` 
              : `現在 ${daysBetween(entry.createdAt, today())}日目`}
          </div>
        </div>
      </div>
      <LarvaLogForm
        onSubmit={(value) => useBeetleStore.getState().addLarvaLog(entry.id, value)}
        onFetchTemperature={onFetchTemperature}
        isFetchingTemperature={isFetchingTemperature}
      />
      <section className="mt-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">体重推移グラフ</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2D5A27" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#2D5A27" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#DEE2E6" vertical={false} />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
              <YAxis stroke="#9ca3af" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}
              />
              <Area type="monotone" dataKey="weight" stroke="#2D5A27" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" name="体重(g)" dot={{ r: 4, fill: "#2D5A27", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              <Area type="monotone" dataKey="temperature" stroke="#E67E22" strokeWidth={2} fill="transparent" name="温度(℃)" dot={{ r: 2, fill: "#E67E22" }} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-6 bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
        <div className="text-[10px] font-black text-[#8B5A2B] mb-6 uppercase tracking-widest border-l-4 border-[#2D5A27] pl-3">History Log</div>
        <div className="space-y-3">
          {entry.logs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">飼育ログはまだありません。</p>
          ) : (
            <div className="relative ml-2 border-l-2 border-gray-50 pl-6 space-y-6">
              {entry.logs.map((log) => (
                <div className="relative" key={log.id}>
                  <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-white border-4 border-[#2D5A27] shadow-sm z-10" />
                  <div className="flex items-center justify-between bg-[#F8F9FA] border border-gray-50 p-4 rounded-2xl transition-active active:bg-gray-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase">{log.stage}</span>
                        <span className="text-xs text-gray-400 font-medium">{formatDate(log.date)}</span>
                      </div>
                      <div className="font-black text-[#212529] text-lg">
                        {log.weight}g <span className="text-[10px] text-gray-400 font-normal">/ {log.temperature}℃</span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold mt-1">性別: {log.gender}</div>
                    </div>
                    <button
                      type="button"
                      className="p-2 text-gray-300 hover:text-red-500"
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
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
