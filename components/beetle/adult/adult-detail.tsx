"use client";

import { buildGenerationLabel } from "@/components/entry-fields";
import type { AdultBeetle } from "@/types/beetle";
import { formatDate } from "@/lib/utils";

export function AdultDetail({ entry }: { entry: AdultBeetle }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">和名</div>
        <div className="font-bold text-gray-800 truncate">{entry.japaneseName}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">性別 / サイズ</div>
        <div className="font-bold text-gray-800 truncate">{entry.gender} / {entry.size || "-"}mm</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">状態</div>
        <div className="font-bold text-gray-800 truncate">{entry.status || "-"}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">産地</div>
        <div className="font-bold text-gray-800 truncate">{entry.locality || "-"}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">累代</div>
        <div className="font-bold text-gray-800 truncate">{buildGenerationLabel(entry.generation)}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">羽化日</div>
        <div className="font-bold text-gray-800 truncate">{formatDate(entry.emergenceDate)}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">後食日</div>
        <div className="font-bold text-gray-800 truncate">{formatDate(entry.feedingDate)}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl">
        <div className="text-xs text-gray-500">死亡日</div>
        <div className="font-bold text-gray-800 truncate">{formatDate(entry.deathDate)}</div>
      </div>
      {entry.memo && (
        <div className="bg-gray-50 p-4 rounded-2xl col-span-2">
          <div className="text-xs text-gray-500">メモ</div>
          <div className="text-sm text-gray-800 whitespace-pre-wrap mt-1">{entry.memo}</div>
        </div>
      )}
      {entry.larvaMemo && (
        <div className="bg-gray-50 p-4 rounded-2xl col-span-2">
          <div className="text-xs text-gray-500">幼虫時データ</div>
          <div className="text-sm text-gray-800 whitespace-pre-wrap mt-1">{entry.larvaMemo}</div>
        </div>
      )}
    </div>
  );
}
