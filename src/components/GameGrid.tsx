'use client';

import { GridPosition } from '@/server/game/nback-engine';

interface GameGridProps {
  activePosition: GridPosition;
  nValue: number;
}

export function GameGrid({ activePosition, nValue }: GameGridProps) {
  const activeIndex = typeof activePosition === 'number' ? activePosition : -1;
  
  return (
    <div className="grid grid-cols-3 gap-3 w-72 h-72 mx-auto">
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          className={`
            rounded-2xl transition-all duration-300 border-2
            ${activeIndex >= 0 && activeIndex === i
              ? 'bg-gradient-to-br from-pink-500 to-cyan-500 shadow-xl shadow-pink-500/50 scale-110 border-white/50' 
              : 'bg-white/5 border-white/10'}
          `}
        />
      ))}
    </div>
  );
}
