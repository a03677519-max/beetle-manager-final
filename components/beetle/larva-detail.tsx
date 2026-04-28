"use client";

import { Trash2 } from "lucide-react";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { buildGenerationLabel } from "@/components/entry-fields";
import { daysBetween, formatDate } from "@/lib/utils";
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
  const daysToEmergence =
    entry.logs.length > 0 && entry.actualEmergenceDate
      ? daysBetween(
          entry.logs[entry.logs.length - 1]?.date ?? "",
          entry.actualEmergenceDate,
        )
      : null;

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
        <div className="bg-gray-50 p-4 rounded-2xl">
          <div className="text-xs text-gray-500">和名</div>
          <div className="font-bold text-gray-800 truncate">{entry.japaneseName}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl">
          <div className="text-xs text-gray-500">累代</div>
          <div className="font-bold text-gray-800 truncate">{buildGenerationLabel(entry.generation)}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl">
          <div className="text-xs text-gray-500">羽化日</div>
          <div className="font-bold text-gray-800 truncate">{formatDate(entry.actualEmergenceDate)}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl">
          <div className="text-xs text-gray-500">羽化まで</div>
          <div className="font-bold text-gray-800 truncate">{daysToEmergence ? `${daysToEmergence}日` : "-"}</div>
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
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
              <YAxis stroke="#9ca3af" fontSize={10} />
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="weight" stroke="#059669" strokeWidth={3} name="体重(g)" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="section-title text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">飼育ログ一覧</div>
        <div className="space-y-3">
          {entry.logs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">飼育ログはまだありません。</p>
          ) : (
            entry.logs.map((log) => (
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl" key={log.id}>
                <div>
                  <div className="text-xs text-gray-500">{formatDate(log.date)} ({log.stage})</div>
                  <div className="font-bold text-gray-800">
                    {log.weight}g / {log.temperature}℃ / {log.gender}
                  </div>
                </div>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-red-500"
                  onClick={() => deleteLarvaLog(entry.id, log.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
