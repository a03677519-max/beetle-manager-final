"use client";

import { buildGenerationLabel } from "@/components/entry-fields";
import type { AdultBeetle } from "@/types/beetle";
import { formatDate } from "@/lib/utils";

export function AdultDetail({ entry }: { entry: AdultBeetle }) {
  return (
    <section className="card">
      <div className="section-title">成虫詳細</div>
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
          <dt>死亡日</dt>
          <dd>{formatDate(entry.deathDate)}</dd>
        </div>
        <div>
          <dt>幼虫時データ</dt>
          <dd>{entry.larvaMemo || "-"}</dd>
        </div>
      </dl>
    </section>
  );
}
