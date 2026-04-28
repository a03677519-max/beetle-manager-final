"use client";

import { buildGenerationLabel } from "@/components/entry-fields";
import type { SpawnSet } from "@/types/beetle";
import { formatDate } from "@/lib/utils";

export function SpawnSetDetail({ entry }: { entry: SpawnSet }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">セット日</div>
        <div className="font-bold text-gray-800 truncate">{formatDate(entry.setDate)}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">累代</div>
        <div className="font-bold text-gray-800 truncate">{buildGenerationLabel(entry.generation)}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">使用マット</div>
        <div className="font-bold text-gray-800 truncate">{entry.substrate || "-"}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">容器サイズ</div>
        <div className="font-bold text-gray-800 truncate">{entry.containerSize || "-"}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">詰圧</div>
        <div className="font-bold text-gray-800 truncate">{entry.pressure}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">水分量</div>
        <div className="font-bold text-gray-800 truncate">{entry.moisture}</div>
      </div>
    </div>
  );
}
