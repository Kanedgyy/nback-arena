'use client';

interface PlayerStatsProps {
  score: number;
  mistakes: number;
  correctAnswers: number;
  nValue: number;
  speedLevel: number;
  currentStimulusIndex: number;
  totalStimuli: number;
}

export function PlayerStats({
  score,
  mistakes,
  correctAnswers,
  nValue,
  speedLevel,
  currentStimulusIndex,
  totalStimuli,
}: PlayerStatsProps) {
  const progress = (currentStimulusIndex / totalStimuli) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">N-Value</p>
          <p className="text-2xl font-bold">{nValue}-back</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
          <p className="text-2xl font-bold text-blue-600">{score}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Correct</p>
          <p className="text-lg font-semibold text-green-600">{correctAnswers}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Mistakes</p>
          <p className="text-lg font-semibold text-red-600">{mistakes}</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Progress: {currentStimulusIndex} / {totalStimuli}
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {speedLevel > 0 && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-2 rounded text-sm">
          ⚡ Speed Level: {speedLevel} (faster!)
        </div>
      )}
    </div>
  );
}
