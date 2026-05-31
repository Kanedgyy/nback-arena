'use client';

import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/trpc';

function getBotName(botId: string, index: number): string {
  const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega'];
  const prefixes = ['Speedy', 'Quick', 'Sharp', 'Brainy', 'Ninja'];
  return `${prefixes[index % prefixes.length]} ${names[index % names.length]}`;
}

function getBotDifficultyLabel(difficulty: number | null): string {
  if (difficulty === null) return '';
  switch (difficulty) {
    case 1: return '🟢 Легкий'
    case 2: return '🟡 Средний'
    case 3: return '🔴 Сложный'
    default: return '';
  }
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const { data: results, isLoading } = trpc.game.getResults.useQuery({ roomId });
  const { data: room } = trpc.room.get.useQuery({ roomId });

  const utils = trpc.useUtils();

  const rematchMutation = trpc.game.rematch.useMutation({
    onSuccess: () => {
      utils.room.get.invalidate({ roomId });
      utils.game.getCurrentState.invalidate({ roomId });
      router.push(`/room/${roomId}`);
    },
  });

  if (isLoading || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-2xl">🏆 Загрузка результатов...</div>
      </div>
    );
  }

  const handleRematch = () => {
    rematchMutation.mutate({ roomId });
  };

  const handleExit = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">🏆 Результаты</h1>
          <p className="text-xl text-purple-200">
            {room?.room.name} — {results.nValue}-Back
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Таблица лидеров</h2>

          <div className="space-y-3">
            {results.rankings.map((player, idx) => {
              const isBot = player.isBot;
              const botInfo = room?.players.find(p => p.userId === player.userId);

              return (
                <div
                  key={player.userId}
                  className={`rounded-xl p-4 flex justify-between items-center ${
                    player.rank === 1
                      ? 'bg-yellow-500/20 border-2 border-yellow-400/50'
                      : player.rank === 2
                      ? 'bg-gray-300/20 border-2 border-gray-300/50'
                      : player.rank === 3
                      ? 'bg-orange-600/20 border-2 border-orange-500/50'
                      : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {player.rank === 1 && '🥇'}
                      {player.rank === 2 && '🥈'}
                      {player.rank === 3 && '🥉'}
                      {player.rank > 3 && `#${player.rank}`}
                    </span>
                    <div>
                      <div className="text-white font-bold text-lg">
                        {isBot
                          ? getBotName(player.userId, idx)
                          : idx === 0
                          ? '👑 Вы'
                          : `Игрок ${idx + 1}`}
                      </div>
                      {isBot && botInfo && (
                        <div className="text-xs text-purple-300">
                          {getBotDifficultyLabel(botInfo.botDifficulty)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-xl">{player.score} очк.</div>
                    <div className="text-sm text-red-300">{player.mistakes} ошиб.</div>
                    <div className="text-sm text-green-300">{player.correctAnswers} верн.</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleRematch}
            disabled={rematchMutation.isPending}
            className="py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-lg"
          >
            {rematchMutation.isPending ? '⏳ Сброс...' : '🔄 Реванш'}
          </button>
          <button
            onClick={handleExit}
            className="py-4 px-6 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-lg"
          >
            🚪 Выход
          </button>
        </div>
      </div>
    </div>
  );
}
