'use client';

import { useState } from 'react';

interface GameControlsProps {
  onSubmitAnswer: (answer: boolean) => void;
  isGameRunning: boolean;
  disabled?: boolean;
}

export function GameControls({
  onSubmitAnswer,
  isGameRunning,
  disabled = false,
}: GameControlsProps) {
  const [lastSubmitted, setLastSubmitted] = useState<'match' | 'no-match' | null>(null);

  const handleSubmit = (answer: boolean) => {
    if (!isGameRunning || disabled) return;
    
    onSubmitAnswer(answer);
    setLastSubmitted(answer ? 'match' : 'no-match');
    
    // Reset visual feedback after 500ms
    setTimeout(() => {
      setLastSubmitted(null);
    }, 500);
  };

  return (
    <div className="flex gap-4 justify-center">
      <button
        onClick={() => handleSubmit(false)}
        disabled={!isGameRunning || disabled}
        className={`
          px-8 py-4 rounded-lg font-semibold text-lg transition-all
          ${lastSubmitted === 'no-match'
            ? 'bg-green-500 text-white scale-105'
            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        ❌ No Match
      </button>
      
      <button
        onClick={() => handleSubmit(true)}
        disabled={!isGameRunning || disabled}
        className={`
          px-8 py-4 rounded-lg font-semibold text-lg transition-all
          ${lastSubmitted === 'match'
            ? 'bg-blue-500 text-white scale-105'
            : 'bg-blue-600 hover:bg-blue-700 text-white'}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        ✓ Match
      </button>
    </div>
  );
}
