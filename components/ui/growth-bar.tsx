import React from 'react';

export function GrowthBar({ weight, maxWeight = 80 }: { weight: number, maxWeight?: number }) {
  const percentage = Math.min(100, Math.max(0, (weight / maxWeight) * 100));
  
  return (
    <div className="w-full bg-gray-200 h-[6px] rounded-full overflow-hidden mt-2">
      <div 
        className="bg-[var(--primary)] h-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
