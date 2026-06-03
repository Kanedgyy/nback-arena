'use client';

interface PlayerStatsProps {
  score: number;
  mistakes: number;
  correctAnswers: number;
  nValue: number;
  speedLevel: number;
  currentStimulusIndex: number;
  totalStimuli: number;
  stimulusInterval: number;
}

export function PlayerStats({
  score,
  mistakes,
  correctAnswers,
  nValue,
  speedLevel,
  currentStimulusIndex,
  totalStimuli,
  stimulusInterval,
}: PlayerStatsProps) {
  const progress = (currentStimulusIndex / totalStimuli) * 100;

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border-2 border-white/20 shadow-2xl space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-white/70 font-semibold">N-Value</p>
          <p className="text-3xl font-black text-white">{nValue}-Back</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-white/70 font-semibold">Счёт</p>
          <p className="text-4xl font-black text-cyan-300">{score}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-500/20 rounded-2xl p-4 border border-green-400/30">
          <p className="text-sm text-white/70 font-semibold">Верно</p>
          <p className="text-2xl font-black text-green-300">{correctAnswers}</p>
        </div>
        <div className="bg-red-500/20 rounded-2xl p-4 border border-red-400/30">
          <p className="text-sm text-white/70 font-semibold">Ошибки</p>
          <p className="text-2xl font-black text-red-300">{mistakes}</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-white/70 font-semibold mb-2">
          Прогресс: {currentStimulusIndex} / {totalStimuli}
        </p>
        <div className="w-full bg-white/10 rounded-full h-4 border-2 border-white/20">
          <div
            className="bg-gradient-to-r from-pink-500 to-cyan-500 h-4 rounded-full transition-all duration-300 shadow-lg"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-white/70 font-semibold">
          Скорость: {stimulusInterval}ms
        </p>
        {speedLevel > 0 && (
          <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-white px-4 py-2 rounded-xl border-2 border-yellow-400/50 font-bold">
            ⚡ Скорость: {speedLevel}
          </div>
        )}
      </div>
    </div>
  );
}
