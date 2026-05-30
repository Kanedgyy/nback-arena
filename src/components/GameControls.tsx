'use client';

interface GameControlsProps {
  onSubmitAnswer: (answer: boolean) => void;
  isGameRunning: boolean;
  disabled?: boolean;
}

export function GameControls({ onSubmitAnswer, isGameRunning, disabled = false }: GameControlsProps) {
  return (
    <div className="flex gap-4 justify-center">
      <button
        onClick={() => onSubmitAnswer(true)}
        disabled={!isGameRunning || disabled}
        className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        ✓ Совпадение
      </button>
    </div>
  );
}

