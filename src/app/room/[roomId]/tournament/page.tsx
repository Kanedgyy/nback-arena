'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/trpc';

function getBotName(botId: string, index: number): string {
  const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega'];
  const prefixes = ['Speedy', 'Quick', 'Sharp', 'Brainy', 'Ninja'];
  return `${prefixes[index % prefixes.length]} ${names[index % names.length]}`;
}

export default function TournamentRoundPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [countdown, setCountdown] = useState(5);
  const [canStart, setCanStart] = useState(false);

  const { data: tournament } = trpc.game.getTournamentResults.useQuery({ roomId });
  const { data: room } = trpc.room.get.useQuery({ roomId });

  const startRoundMutation = trpc.game.startTournamentRound.useMutation({
    onSuccess: () => {
      router.push(`/room/${roomId}`);
    },
  });

  // Отсчёт 5 секунд
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanStart(true);
    }
  }, [countdown]);

  // Автостарт следующего раунда
  useEffect(() => {
    if (canStart && tournament && !tournament.isComplete && room?.room.isStarted === false) {
      const nextRound = (tournament.currentRound || 0) + 1;
      startRoundMutation.mutate({ roomId, round: nextRound });
    }
  }, [canStart, tournament, room?.room.isStarted]);

  if (!tournament || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-600 via-rose-500 to-cyan-400 flex items-center justify-center">
        <div className="text-white text-3xl font-bold animate-pulse">🏆 Загрузка турнира...</div>
      </div>
    );
  }

  const currentRound = tournament.currentRound || 0;
  const lastRound = tournament.rounds[tournament.rounds.length - 1];
  const isFinal = tournament.isComplete;

  const handleNextRound = () => {
    const nextRound = currentRound + 1;
    startRoundMutation.mutate({ roomId, round: nextRound });
  };

  const handleFinish = () => {
    router.push(`/room/${roomId}/results`);
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
              {isFinal ? '🏆 Финал турнира' : `🏆 Раунд ${currentRound} завершён`}
            </h1>
            <p className="text-xl text-white/90 font-semibold">
              {room.room.name}
            </p>
          </div>

        {/* Результаты последнего раунда */}
        {lastRound && (
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border-2 border-white/20 shadow-xl mb-6">
            <h2 className="text-2xl font-black text-white mb-5 text-center">
              Результаты {lastRound.nValue}-Back
            </h2>
            <div className="space-y-3">
              {lastRound.players
                .sort((a: any, b: any) => b.score - a.score)
                .map((player: any, idx: number) => (
                  <div
                    key={player.userId}
                    className={`rounded-2xl p-4 flex justify-between items-center border-2 ${
                      idx === 0 ? 'bg-yellow-500/20 border-yellow-400/70 shadow-lg shadow-yellow-500/20' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {idx === 0 && '🥇'}
                        {idx === 1 && '🥈'}
                        {idx === 2 && '🥉'}
                        {idx > 2 && `#${idx + 1}`}
                      </span>
                      <span className="text-white font-bold text-lg">
                        {player.isBot ? getBotName(player.userId, idx) : (idx === 0 ? '👑 Вы' : `Игрок ${idx + 1}`)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-black text-2xl">{player.score}</div>
                      <div className="text-sm font-semibold text-red-300">{player.mistakes} ошиб.</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Общая таблица (если несколько раундов) */}
        {tournament.rounds.length > 1 && (
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border-2 border-white/20 shadow-xl mb-8">
            <h2 className="text-2xl font-black text-white mb-5 text-center">📊 Общий зачёт</h2>
            <div className="space-y-3">
              {tournament.rankings.map((player: any) => (
                <div
                  key={player.userId}
                  className={`rounded-2xl p-4 flex justify-between items-center border-2 ${
                    player.rank === 1 ? 'bg-yellow-500/20 border-yellow-400/70 shadow-lg shadow-yellow-500/20' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {player.rank === 1 && '🥇'}
                      {player.rank === 2 && '🥈'}
                      {player.rank === 3 && '🥉'}
                      {player.rank > 3 && `#${player.rank}`}
                    </span>
                    <span className="text-white font-bold text-lg">
                      {player.isBot ? getBotName(player.userId, player.rank - 1) : (player.rank === 1 ? '👑 Вы' : `Игрок ${player.rank}`)}
                    </span>
                  </div>
                  <div className="text-white font-black text-xl">{player.totalScore}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Следующий раунд / Финал */}
        <div className="text-center">
          {!isFinal ? (
            <div>
              <p className="text-white text-xl mb-4 font-semibold">
                Следующий раунд: <span className="text-yellow-300 font-black text-2xl">{currentRound + 1}-Back</span>
              </p>
              <p className="text-white/80 text-lg mb-6">
                {canStart ? 'Начинаем...' : `Начало через ${countdown}...`}
              </p>
              <button
                onClick={handleNextRound}
                disabled={startRoundMutation.isPending}
                className="py-4 px-8 bg-gradient-to-r from-pink-500 via-rose-500 to-cyan-500 hover:from-pink-400 hover:via-rose-400 hover:to-cyan-400 text-white font-black text-xl rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-xl"
              >
                {startRoundMutation.isPending ? '⏳ Запуск...' : '▶️ Начать сейчас'}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-white text-xl mb-6 font-semibold">Турнир завершён!</p>
              <button
                onClick={handleFinish}
                className="py-4 px-8 bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 hover:from-yellow-400 hover:via-orange-400 hover:to-pink-400 text-white font-black text-xl rounded-2xl transition-all transform hover:scale-[1.02] shadow-xl"
              >
                🏆 Финальные результаты
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
