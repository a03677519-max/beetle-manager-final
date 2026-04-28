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
import { LarvaLogForm } from "./larva-form";

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
      <section className="card">
        <div className="section-title">幼虫詳細</div>
        <dl className="detail-list">
          <div>
            <dt>和名</dt>
            <dd>{entry.japaneseName}</dd>
          </div>
          <div>
            <dt>学名</dt>
            <dd>{entry.scientificName}</dd>
          </div>
          <div>
            <dt>産地</dt>
            <dd>{entry.locality || "-"}</dd>
          </div>
          <div>
            <dt>累代</dt>
            <dd>{buildGenerationLabel(entry.generation)}</dd>
          </div>
          <div>
            <dt>羽化日</dt>
            <dd>{formatDate(entry.actualEmergenceDate)}</dd>
          </div>
          <div>
            <dt>羽化区分</dt>
            <dd>{entry.emergenceType}</dd>
          </div>
          <div>
            <dt>羽化まで日数</dt>
            <dd>{daysToEmergence ?? "-"}</dd>
          </div>
        </dl>
      </section>
      <LarvaLogForm
        onSubmit={(value) => useBeetleStore.getState().addLarvaLog(entry.id, value)}
        onFetchTemperature={onFetchTemperature}
        isFetchingTemperature={isFetchingTemperature}
      />
      <section className="card">
        <div className="section-title">体重・温度グラフ</div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#2f8f57" name="体重" />
              <Line type="monotone" dataKey="temperature" stroke="#cf4d4d" name="温度" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="card">
        <div className="section-title">飼育ログ一覧</div>
        <div className="log-list">
          {entry.logs.length === 0 ? (
            <p className="empty-text">飼育ログはまだありません。</p>
          ) : (
            entry.logs.map((log) => (
              <div className="log-item" key={log.id}>
                <div className="log-content">
                  <div className="log-meta">
                    <span>{formatDate(log.date)}</span>
                    <span>{log.stage}</span>
                  </div>
                  <p>
                    {log.substrate || "-"} / {log.bottleSize || "-"} / {""}
                    {log.weight || ""}g / {log.temperature || ""}℃ / {log.gender}
                  </p>
                </div>
                <button
                  type="button"
                  className="icon-button danger"
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
