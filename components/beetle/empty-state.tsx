import { MousePointer2 } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
          <MousePointer2 size={40} className="text-gray-300" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-gray-700 mb-2">登録されたデータがありません</h3>
      <p className="text-sm text-gray-400 mb-8">右下の「＋」ボタンから<br/>最初の1頭を登録しましょう！</p>
    </div>
  );
}