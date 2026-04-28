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
    </div>
  );
}
