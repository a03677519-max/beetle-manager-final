"use client";

import { buildGenerationLabel } from "@/components/entry-fields";
import type { SpawnSet } from "@/types/beetle";
import { formatDate } from "@/lib/utils";

export function SpawnSetDetail({ entry }: { entry: SpawnSet }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gray-50 p-4 rounded-2xl col-span-2">
        <div className="text-xs text-gray-500">セット期間</div>
        <div className="font-bold text-gray-800 truncate">
          {formatDate(entry.setDate)} 〜 {entry.setEndDate ? formatDate(entry.setEndDate) : "継続中"}
        </div>
      </div>
      <div className="bg-[#FF9800]/5 border border-[#FF9800]/10 p-4 rounded-2xl">
        <div className="text-xs text-[#FF9800]">卵数</div>
        <div className="text-xl font-black text-[#FF9800]">{entry.eggCount ?? "-"} <span className="text-xs">個</span></div>
      </div>
      <div className="bg-[#FF9800]/5 border border-[#FF9800]/10 p-4 rounded-2xl">
        <div className="text-xs text-[#FF9800]">幼虫数</div>
        <div className="text-xl font-black text-[#FF9800]">{entry.larvaCount ?? "-"} <span className="text-xs">頭</span></div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">累代</div>
        <div className="font-bold text-gray-800 truncate">{buildGenerationLabel(entry.generation)}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">産地</div>
        <div className="font-bold text-gray-800 truncate">{entry.locality || "-"}</div>
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
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">温度</div>
        <div className="font-bold text-gray-800 truncate">{entry.temperature}℃</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">同居</div>
        <div className="font-bold text-gray-800 truncate">{entry.cohabitation}</div>
      </div>
      {entry.memo && (
        <div className="bg-gray-50 p-4 rounded-2xl col-span-2">
          <div className="text-xs text-gray-500">メモ</div>
          <div className="text-sm text-gray-800 whitespace-pre-wrap mt-1">{entry.memo}</div>
        </div>
      )}
    </div>
  );
}
