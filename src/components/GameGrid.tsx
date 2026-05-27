'use client';

import { GridPosition } from '@/server/game/nback-engine';

interface GameGridProps {
  activePosition: GridPosition;
  nValue: number;
}

export function GameGrid({ activePosition, nValue }: GameGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 w-72 h-72 mx-auto">
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          className={`
            rounded-lg transition-all duration-200
            ${activePosition !== undefined && activePosition === i
              ? 'bg-blue-500 shadow-lg shadow-blue-500/50 scale-105' 
              : 'bg-gray-200 dark:bg-gray-700'}
          `}
        />
      ))}
    </div>
  );
}
