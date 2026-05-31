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
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-2xl">🏆 Загрузка турнира...</div>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            {isFinal ? '🏆 Финал турнира' : `🏆 Раунд ${currentRound} завершён`}
          </h1>
          <p className="text-xl text-purple-200">
            {room.room.name}
          </p>
        </div>

        {/* Результаты последнего раунда */}
        {lastRound && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border-2 border-white/20 mb-6">
            <h2 className="text-xl font-bold text-white mb-4 text-center">
              Результаты {lastRound.nValue}-Back
            </h2>
            <div className="space-y-2">
              {lastRound.players
                .sort((a: any, b: any) => b.score - a.score)
                .map((player: any, idx: number) => (
                  <div
                    key={player.userId}
                    className={`rounded-lg p-3 flex justify-between items-center ${
                      idx === 0 ? 'bg-yellow-500/20 border border-yellow-400/50' : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {idx === 0 && '🥇'}
                        {idx === 1 && '🥈'}
                        {idx === 2 && '🥉'}
                        {idx > 2 && `#${idx + 1}`}
                      </span>
                      <span className="text-white font-medium">
                        {player.isBot ? getBotName(player.userId, idx) : (idx === 0 ? '👑 Вы' : `Игрок ${idx + 1}`)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{player.score} очк.</div>
                      <div className="text-xs text-red-300">{player.mistakes} ошиб.</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Общая таблица (если несколько раундов) */}
        {tournament.rounds.length > 1 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border-2 border-white/20 mb-6">
            <h2 className="text-xl font-bold text-white mb-4 text-center">📊 Общий зачёт</h2>
            <div className="space-y-2">
              {tournament.rankings.map((player: any) => (
                <div
                  key={player.userId}
                  className={`rounded-lg p-3 flex justify-between items-center ${
                    player.rank === 1 ? 'bg-yellow-500/20 border border-yellow-400/50' : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {player.rank === 1 && '🥇'}
                      {player.rank === 2 && '🥈'}
                      {player.rank === 3 && '🥉'}
                      {player.rank > 3 && `#${player.rank}`}
                    </span>
                    <span className="text-white font-medium">
                      {player.isBot ? getBotName(player.userId, player.rank - 1) : (player.rank === 1 ? '👑 Вы' : `Игрок ${player.rank}`)}
                    </span>
                  </div>
                  <div className="text-white font-bold">{player.totalScore} очк.</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Следующий раунд / Финал */}
        <div className="text-center">
          {!isFinal ? (
            <div>
              <p className="text-white text-lg mb-4">
                Следующий раунд: <span className="font-bold text-yellow-300">{currentRound + 1}-Back</span>
              </p>
              <p className="text-purple-200 mb-4">
                {canStart ? 'Начинаем...' : `Начало через ${countdown}...`}
              </p>
              <button
                onClick={handleNextRound}
                disabled={startRoundMutation.isPending}
                className="py-4 px-8 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-lg"
              >
                {startRoundMutation.isPending ? '⏳ Запуск...' : '▶️ Начать сейчас'}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-white text-lg mb-4">Турнир завершён!</p>
              <button
                onClick={handleFinish}
                className="py-4 px-8 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all text-lg"
              >
                🏆 Финальные результаты
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
