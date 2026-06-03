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
        className="px-10 py-5 bg-gradient-to-r from-pink-500 via-rose-500 to-cyan-500 hover:from-pink-400 hover:via-rose-400 hover:to-cyan-400 text-white font-black text-xl rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-xl shadow-pink-500/30"
      >
        ✓ Совпадение
      </button>
    </div>
  );
}

