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
  const { data: tournament } = trpc.game.getTournamentResults.useQuery({ roomId });
  const { data: room } = trpc.room.get.useQuery({ roomId });

  const utils = trpc.useUtils();

  const rematchMutation = trpc.game.rematch.useMutation({
    onSuccess: () => {
      utils.room.get.invalidate({ roomId });
      utils.game.getCurrentState.invalidate({ roomId });
      utils.game.getTournamentResults.invalidate({ roomId });
      router.push(`/room/${roomId}`);
    },
  });

  if (isLoading || !results || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-600 via-rose-500 to-cyan-400 flex items-center justify-center">
        <div className="text-white text-3xl font-bold animate-pulse">🏆 Загрузка результатов...</div>
      </div>
    );
  }

  const isTournament = room.room.isTournament;

  const handleRematch = () => {
    rematchMutation.mutate({ roomId });
  };

  const handleExit = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-500 to-cyan-400 animate-gradient-xy"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-6xl font-black text-white mb-3 drop-shadow-lg">
              {isTournament ? '🏆 Финал турнира' : '🏆 Результаты'}
            </h1>
            <p className="text-xl text-white/90 font-semibold">
              {room?.room.name} — {isTournament ? 'Турнир' : `${results.nValue}-Back`}
            </p>
          </div>

        {/* Результаты по раундам (турнир) */}
        {isTournament && tournament && tournament.rounds.length > 0 && (
          <div className="space-y-5 mb-8">
            {tournament.rounds.map((round: any, roundIdx: number) => (
              <div key={roundIdx} className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border-2 border-white/20 shadow-xl">
                <h2 className="text-xl font-black text-white mb-4 text-center">
                  Раунд {round.round}: {round.nValue}-Back
                </h2>
                <div className="space-y-3">
                  {round.players
                    .sort((a: any, b: any) => b.score - a.score)
                    .map((player: any, idx: number) => (
                      <div key={player.userId} className="flex justify-between items-center p-3 bg-white/5 rounded-2xl border border-white/10">
                        <span className="text-white font-bold text-lg">
                          {idx === 0 && '🥇'} {idx === 1 && '🥈'} {idx === 2 && '🥉'}
                          {' '}{player.isBot ? getBotName(player.userId, idx) : (idx === 0 ? '👑 Вы' : `Игрок ${idx + 1}`)}
                        </span>
                        <span className="text-white font-black text-xl">{player.score}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Общая таблица */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border-2 border-white/20 shadow-2xl mb-8">
          <h2 className="text-3xl font-black text-white mb-8 text-center">
            {isTournament ? '🏆 Итоговая таблица' : 'Таблица лидеров'}
          </h2>

          <div className="space-y-4">
            {(isTournament && tournament ? tournament.rankings : results.rankings).map((player: any, idx: number) => {
              const isBot = player.isBot;
              const botInfo = room?.players.find(p => p.userId === player.userId);

              return (
                <div
                  key={player.userId}
                  className={`rounded-2xl p-5 flex justify-between items-center border-2 ${
                    player.rank === 1
                      ? 'bg-yellow-500/20 border-yellow-400/70 shadow-lg shadow-yellow-500/20'
                      : player.rank === 2
                      ? 'bg-gray-300/20 border-gray-300/70'
                      : player.rank === 3
                      ? 'bg-orange-600/20 border-orange-500/70'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">
                      {player.rank === 1 && '🥇'}
                      {player.rank === 2 && '🥈'}
                      {player.rank === 3 && '🥉'}
                      {player.rank > 3 && `#${player.rank}`}
                    </span>
                    <div>
                      <div className="text-white font-black text-xl">
                        {isBot
                          ? getBotName(player.userId, idx)
                          : idx === 0
                          ? '👑 Вы'
                          : `Игрок ${idx + 1}`}
                      </div>
                      {isBot && botInfo && (
                        <div className="text-sm font-semibold text-cyan-300">
                          {getBotDifficultyLabel(botInfo.botDifficulty)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-black text-2xl">
                      {isTournament ? player.totalScore : player.score}
                    </div>
                    <div className="text-sm font-semibold text-red-300">
                      {isTournament ? player.totalMistakes : player.mistakes} ошиб.
                    </div>
                    {!isTournament && (
                      <div className="text-sm font-semibold text-green-300">{player.correctAnswers} верн.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <button
            onClick={handleRematch}
            disabled={rematchMutation.isPending}
            className="py-4 px-6 bg-gradient-to-r from-pink-500 via-rose-500 to-cyan-500 hover:from-pink-400 hover:via-rose-400 hover:to-cyan-400 text-white font-black text-xl rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-xl"
          >
            {rematchMutation.isPending ? '⏳ Сброс...' : '🔄 Реванш'}
          </button>
          <button
            onClick={handleExit}
            className="py-4 px-6 bg-white/15 hover:bg-white/25 text-white font-black text-xl rounded-2xl transition-all border-2 border-white/20"
          >
            🚪 Выход
          </button>
        </div>
      </div>
    </div>
  </div>
  );
}
