"use client";

import { buildGenerationLabel } from "@/components/entry-fields";
import type { SpawnSet } from "@/types/beetle";
import { formatDate } from "@/lib/utils";

export function SpawnSetDetail({ entry }: { entry: SpawnSet }) {
  return (
    <section className="card">
      <div className="section-title">産卵セット詳細</div>
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
          <dd>{formatDate(entry.emergenceDate)}</dd>
        </div>
        <div>
          <dt>後食日</dt>
          <dd>{formatDate(entry.feedingDate)}</dd>
        </div>
        <div>
          <dt>セット日</dt>
          <dd>{formatDate(entry.setDate)}</dd>
        </div>
        <div>
          <dt>使用マット</dt>
          <dd>{entry.substrate || "-"}</dd>
        </div>
        <div>
          <dt>容器サイズ</dt>
          <dd>{entry.containerSize || "-"}</dd>
        </div>
        <div>
          <dt>詰圧</dt>
          <dd>{entry.pressure}</dd>
        </div>
        <div>
          <dt>水分量</dt>
          <dd>{entry.moisture}</dd>
        </div>
        <div>
          <dt>温度</dt>
          <dd>{entry.temperature || "-"}</dd>
        </div>
        <div>
          <dt>同居の有無</dt>
          <dd>{entry.cohabitation}</dd>
        </div>
      </dl>
    </section>
  );
}
