'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/trpc';
import { GameGrid } from '@/components/GameGrid';
import { PlayerStats } from '@/components/PlayerStats';
import { GameControls } from '@/components/GameControls';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [nValue, setNValue] = useState(2);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [currentStimulus, setCurrentStimulus] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalStimuli, setTotalStimuli] = useState(30);
  const [speedLevel, setSpeedLevel] = useState(0);
  const [stimulusInterval, setStimulusInterval] = useState(2000);

  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [hasAnsweredForCurrentStimulus, setHasAnsweredForCurrentStimulus] = useState(false);
  const [lastStimulusIndex, setLastStimulusIndex] = useState(0);
  const isAnsweringRef = useRef(false);

  const { data: room } = trpc.room.get.useQuery({ roomId });
  const { data: gameState } = trpc.game.getCurrentState.useQuery(
    { roomId },
    { enabled: isGameRunning, refetchInterval: 500 }
  );

  // Синхронизация состояния с сервером - ЕДИНСТВЕННЫЙ источник правды
  useEffect(() => {
    if (!gameState) return;
    
    if (gameState.players && gameState.players.length > 0) {
      const currentPlayer = gameState.players.find(p => p.userId === room?.players[0]?.userId);
      if (currentPlayer) {
        setScore(currentPlayer.score);
        setMistakes(currentPlayer.mistakes);
        setCorrectAnswers(currentPlayer.correctAnswers);
      }
    }
      
    // Обновляем currentIndex и другие значения
    setCurrentIndex(gameState.currentIndex);
    setCurrentStimulus(gameState.currentStimulus ?? null);
    setSpeedLevel(gameState.speedLevel);
    setIsGameRunning(gameState.isRunning);
    setTotalStimuli(gameState.totalStimuli || 30);
    
    // Сбрасываем флаг ответа когда приходит новый стимул
    if (gameState.currentIndex !== lastStimulusIndex) {
      console.log(`[gameState] New stimulus at index ${gameState.currentIndex}`);
      isAnsweringRef.current = false;
      isProcessingAnswerRef.current = false;
      setHasAnsweredForCurrentStimulus(false);
      setLastStimulusIndex(gameState.currentIndex);
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current);
        answerTimeoutRef.current = null;
      }
    }
  }, [gameState, room, lastStimulusIndex]);
      
  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current);
        answerTimeoutRef.current = null;
      }
    };
  }, []);
      
  const startGameMutation = trpc.game.start.useMutation({
    onSuccess: () => {
      console.log('[startGame] Game started');
      setIsGameRunning(true);
      isAnsweringRef.current = false;
      isProcessingAnswerRef.current = false;
      setHasAnsweredForCurrentStimulus(false);
      setLastStimulusIndex(0);
      setSpeedLevel(0);
      stimulusIntervalRef.current = 2000;
      setStimulusInterval(2000);
      setCurrentIndex(0);
      
      // Очищаем все таймеры перед стартом
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current);
        answerTimeoutRef.current = null;
      }
      
      // Сразу переключаем на первый стимул
      nextStimulusMutation.mutate({ roomId });
    },
  });

  const submitAnswerMutation = trpc.game.submitAnswer.useMutation();

  const nextStimulusMutation = trpc.game.nextStimulus.useMutation({
    onSuccess: (data) => {
      console.log(`[nextStimulus] Success, isComplete=${data.isComplete}`);
      
      // Сбрасываем ВСЕ флаги ПОСЛЕ успешного переключения стимула
      isAnsweringRef.current = false;
      isProcessingAnswerRef.current = false;
      setHasAnsweredForCurrentStimulus(false);
      
      if (data.isComplete) {
        setIsGameRunning(false);
      }
    },
    onError: (error) => {
      console.error(`[nextStimulus] Error:`, error);
      // При ошибке тоже сбрасываем флаг через небольшую задержку
      setTimeout(() => {
        isAnsweringRef.current = false;
        isProcessingAnswerRef.current = false;
        setHasAnsweredForCurrentStimulus(false);
      }, 500);
    },
  });

  const answerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stimulusIntervalRef = useRef(2000);
  const isProcessingAnswerRef = useRef(false);

  const handleAnswer = (answer: boolean) => {
    // Атомарная проверка - только один ответ за раз
    if (!room || !isGameRunning || isAnsweringRef.current || isProcessingAnswerRef.current) {
      console.log(`[handleAnswer] Blocked: isAnswering=${isAnsweringRef.current}, isProcessing=${isProcessingAnswerRef.current}`);
      return;
    }
    
    const playerId = room.players[0]?.userId;
    if (!playerId) {
      console.log('[handleAnswer] No playerId');
      return;
    }
    
    // Атомарная блокировка
    isAnsweringRef.current = true;
    isProcessingAnswerRef.current = true;
    setHasAnsweredForCurrentStimulus(true);
    
    // Очищаем все таймеры
    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = null;
    }
    if (autoIntervalRef.current) {
      clearInterval(autoIntervalRef.current);
      autoIntervalRef.current = null;
    }

    console.log(`[handleAnswer] Submitting answer: ${answer} for stimulus ${currentIndex}`);
    submitAnswerMutation.mutate({ roomId, playerId, answer });
    
    // Переключаем стимул через 1.5 секунды
    answerTimeoutRef.current = setTimeout(() => {
      console.log(`[handleAnswer] Switching to next stimulus`);
      nextStimulusMutation.mutate({ roomId });
      answerTimeoutRef.current = null;
      isProcessingAnswerRef.current = false;
    }, 1500);
  };

  // Автоматическое переключение стимулов каждые stimulusInterval (если игрок не ответил)
  useEffect(() => {
    if (!isGameRunning || isAnsweringRef.current) return;

    // Очищаем старый таймер если есть
    if (autoIntervalRef.current) {
      clearInterval(autoIntervalRef.current);
      autoIntervalRef.current = null;
    }

    // Устанавливаем новый таймер с актуальным интервалом
    const intervalMs = stimulusIntervalRef.current;
    console.log(`[autoInterval] Starting timer with ${intervalMs}ms interval`);
    autoIntervalRef.current = setInterval(() => {
      if (!isAnsweringRef.current && !isProcessingAnswerRef.current) {
        console.log(`[autoInterval] Auto-switching stimulus`);
        nextStimulusMutation.mutate({ roomId });
      }
    }, intervalMs);

    return () => {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current);
        answerTimeoutRef.current = null;
      }
    };
  }, [isGameRunning, roomId]);

  // Обновляем интервал без пересоздания таймера
  useEffect(() => {
    const newInterval = Math.max(2000 - (speedLevel * 200), 600);
    stimulusIntervalRef.current = newInterval;
    setStimulusInterval(newInterval);
    console.log(`[speedLevel] Updated to level ${speedLevel}, interval: ${newInterval}ms`);
  }, [speedLevel]);

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-2xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          {room.room.name}
        </h1>
        <p className="text-purple-200 text-center mb-6">
          ID сессии: <code className="bg-white/20 px-2 py-1 rounded text-sm">{roomId}</code>
        </p>

        {!isGameRunning ? (
          /* Лобби комнаты */
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20">
            <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between text-white/80">
                <span>N-Value:</span>
                <span className="font-semibold">{room.room.nValue}-Back</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Игроки:</span>
                <span className="font-semibold">{room.players.length}</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Статус:</span>
                <span className="font-semibold">
                  {room.room.isStarted ? '🔴 Идёт игра' : '🟢 Ожидание'}
                </span>
              </div>
            </div>

            <button
              onClick={() => startGameMutation.mutate({ roomId })}
              disabled={startGameMutation.isPending || room.room.isStarted}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startGameMutation.isPending 
                ? 'Запуск...' 
                : room.room.isStarted 
                  ? 'Игра уже идёт' 
                  : '▶️ Начать игру'}
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full mt-3 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all"
            >
              ← Вернуться на главную
            </button>
          </div>
        ) : (
          /* Игровой экран */
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border-2 border-white/20">
                <h2 className="text-xl font-semibold mb-4 text-center text-white">
                  {nValue}-Back Challenge
                </h2>
                <p className="text-center text-purple-200 mb-6 text-sm">
                  Нажми "Совпадает", если текущая позиция совпадает с позицией из {nValue} шагов назад
                </p>
                
                <GameGrid activePosition={currentStimulus ?? 0} nValue={nValue} />
              </div>

              <GameControls
                onSubmitAnswer={handleAnswer}
                isGameRunning={isGameRunning && !isAnsweringRef.current && !isProcessingAnswerRef.current}
              />
            </div>

            <div className="space-y-6">
              <PlayerStats
                score={score}
                mistakes={mistakes}
                correctAnswers={correctAnswers}
                nValue={nValue}
                speedLevel={speedLevel}
                currentStimulusIndex={currentIndex}
                totalStimuli={totalStimuli}
                stimulusInterval={stimulusInterval}
              />

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border-2 border-white/20">
                <h3 className="text-lg font-semibold mb-3 text-white">Игроки</h3>
                <div className="space-y-2">
                  {room.players.map((player, idx) => (
                    <div
                      key={player.id}
                      className="bg-white/5 rounded-lg p-3 flex justify-between items-center"
                    >
                      <span className="text-white">
                        {idx === 0 && '👑 '}
                        Игрок {idx + 1}
                      </span>
                      <span className="text-white/60 text-sm">
                        {idx === 0 ? 'Вы' : `ID: ${player.userId.slice(0, 8)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState?.isComplete && (
          <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border-2 border-white/20">
            <h2 className="text-2xl font-bold mb-4 text-white">🏆 Результаты игры</h2>
            <div className="space-y-2">
              {gameState.rankings.map((player) => (
                <div
                  key={player.userId}
                  className="flex justify-between items-center p-3 bg-white/5 rounded-lg"
                >
                  <span className="text-white">
                    {player.rank === 1 && '🥇'}
                    {player.rank === 2 && '🥈'}
                    {player.rank === 3 && '🥉'}
                    {' '}Игрок {player.userId.slice(0, 8)}
                  </span>
                  <span className="text-white font-semibold">
                    Счёт: {player.score} | Ошибок: {player.mistakes}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all"
            >
              🏠 Вернуться на главную
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
