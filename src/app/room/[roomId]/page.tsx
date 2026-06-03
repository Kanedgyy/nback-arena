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
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [lastActionTime, setLastActionTime] = useState(0);
  
  const currentIndexRef = useRef(0);
  const isAnsweringRef = useRef(false);
  const isNextStimulusPendingRef = useRef(false);
  const gameCompletedRef = useRef(false);
  const autoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stimulusIntervalRef = useRef(2000);
  const isProcessingAnswerRef = useRef(false);

  const utils = trpc.useUtils();

  const { data: room } = trpc.room.get.useQuery(
    { roomId },
    { refetchInterval: 2000 } // Опрашиваем каждые 2 секунды
  );

  // ВСЕГДА опрашиваем gameState — ТОЛЬКО для isComplete (редирект на результаты)
  const { data: gameState } = trpc.game.getCurrentState.useQuery(
    { roomId },
    { refetchInterval: 2000 }
  );

  // Синхронизируем isGameRunning с room.isStarted
  useEffect(() => {
    if (room) {
      setIsGameRunning(room.room.isStarted);
      setNValue(room.room.nValue);
    }
  }, [room?.room.isStarted, room?.room.nValue]);

  // Редирект при окончании игры — ЕДИНСТВЕННОЕ использование gameState
  useEffect(() => {
    const isComplete = gameState?.isComplete ?? false;
    if (isComplete && !gameCompletedRef.current) {
      gameCompletedRef.current = true;
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
      
      const isTournament = room?.room.isTournament ?? false;
      const target = isTournament 
        ? `/room/${roomId}/tournament` 
        : `/room/${roomId}/results`;
      
      const timeout = setTimeout(() => {
        router.push(target);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [gameState?.isComplete, room?.room.isTournament, roomId, router]);
      
  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
    };
  }, []);
      
  const startGameMutation = trpc.game.start.useMutation({
    onSuccess: (data) => {
      setIsGameRunning(true);
      
      gameCompletedRef.current = false;
      currentIndexRef.current = 0;
      isAnsweringRef.current = false;
      isNextStimulusPendingRef.current = false;
      isProcessingAnswerRef.current = false;
      setHasAnsweredForCurrentStimulus(false);
      setScore(0);
      setMistakes(0);
      setCorrectAnswers(0);
      setSpeedLevel(0);
      stimulusIntervalRef.current = 2000;
      setStimulusInterval(2000);
      setCurrentIndex(0);
      
      // Инициализируем игроков из room.players (без score — они 0)
      if (room?.players) {
        setAllPlayers(room.players.map((p: any) => ({
          userId: p.userId,
          isBot: p.isBot,
          score: 0,
          mistakes: 0,
          correctAnswers: 0,
        })));
      }
      
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
      
      setLastActionTime(Date.now());
      nextStimulusMutation.mutate({ roomId });
    },
  });

  const startTournamentRoundMutation = trpc.game.startTournamentRound.useMutation({
    onSuccess: (data) => {
      setIsGameRunning(true);
      
      gameCompletedRef.current = false;
      currentIndexRef.current = 0;
      isAnsweringRef.current = false;
      isNextStimulusPendingRef.current = false;
      isProcessingAnswerRef.current = false;
      setHasAnsweredForCurrentStimulus(false);
      setScore(0);
      setMistakes(0);
      setCorrectAnswers(0);
      setSpeedLevel(0);
      stimulusIntervalRef.current = 2000;
      setStimulusInterval(2000);
      setCurrentIndex(0);
      
      // Инициализируем игроков из room.players (без score — они 0)
      if (room?.players) {
        setAllPlayers(room.players.map((p: any) => ({
          userId: p.userId,
          isBot: p.isBot,
          score: 0,
          mistakes: 0,
          correctAnswers: 0,
        })));
      }
      
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
      
      setLastActionTime(Date.now());
      nextStimulusMutation.mutate({ roomId });
    },
  });

  // submitAnswer — обновляем score напрямую из ответа сервера
  const submitAnswerMutation = trpc.game.submitAnswer.useMutation({
    onSuccess: (data) => {
      setScore(data.score);
      setMistakes(data.mistakes);
      setCorrectAnswers(data.correctAnswers);
      
      // Обновляем локальные данные игрока в allPlayers
      setAllPlayers(prev => prev.map(p => 
        p.userId === room?.players[0]?.userId 
          ? { ...p, score: data.score, mistakes: data.mistakes, correctAnswers: data.correctAnswers }
          : p
      ));
      
      // Сбрасываем флаги и вызываем nextStimulus
      isAnsweringRef.current = false;
      isProcessingAnswerRef.current = false;
      isNextStimulusPendingRef.current = false; // РАСБЛОКИРОВКА
      setHasAnsweredForCurrentStimulus(false);
      setLastActionTime(Date.now());
      
      // Сразу вызываем nextStimulus после ответа
      nextStimulusMutation.mutate({ roomId });
    },
    onError: () => {
      isAnsweringRef.current = false;
      isProcessingAnswerRef.current = false;
      isNextStimulusPendingRef.current = false; // РАСБЛОКИРОВКА
      setHasAnsweredForCurrentStimulus(false);
      setLastActionTime(Date.now());
    },
  });

  // nextStimulus — обновляем currentIndex, currentStimulus, speedLevel И ВСЕХ ИГРОКОВ
  const nextStimulusMutation = trpc.game.nextStimulus.useMutation({
    onSuccess: (data) => {
      isNextStimulusPendingRef.current = false;
      isAnsweringRef.current = false;
      isProcessingAnswerRef.current = false;
      setHasAnsweredForCurrentStimulus(false);
      
      // Обновляем ВСЕ данные из ответа сервера
      setCurrentIndex(data.currentIndex);
      currentIndexRef.current = data.currentIndex;
      setSpeedLevel(data.speedLevel);
      if (data.stimulus !== undefined) {
        setCurrentStimulus(data.stimulus.position);
      }
      
      // ОБНОВЛЯЕМ ВСЕХ ИГРОКОВ (включая ботов) из ответа сервера
      if (data.players && data.players.length > 0) {
        setAllPlayers(data.players);
      }
      
      if (data.isComplete) {
        setIsGameRunning(false);
      }
      
      // Пересоздаём автотаймер
      setLastActionTime(Date.now());
    },
    onError: () => {
      isNextStimulusPendingRef.current = false;
      isAnsweringRef.current = false;
      isProcessingAnswerRef.current = false;
      setHasAnsweredForCurrentStimulus(false);
      setLastActionTime(Date.now());
    },
  });

  // СБРОС при монтировании
  useEffect(() => {
    utils.room.get.invalidate({ roomId });
    
    gameCompletedRef.current = false;
    currentIndexRef.current = 0;
    isAnsweringRef.current = false;
    isNextStimulusPendingRef.current = false;
    isProcessingAnswerRef.current = false;
    setHasAnsweredForCurrentStimulus(false);
    setCurrentIndex(0);
    setScore(0);
    setMistakes(0);
    setCorrectAnswers(0);
    setSpeedLevel(0);
    setCurrentStimulus(null);
    setAllPlayers([]);
    stimulusIntervalRef.current = 2000;
    setStimulusInterval(2000);
    setLastActionTime(Date.now());
    
    if (autoIntervalRef.current) {
      clearInterval(autoIntervalRef.current);
      autoIntervalRef.current = null;
    }
  }, [roomId]);

  const handleAnswer = (answer: boolean) => {
    if (!room || !isGameRunning || isAnsweringRef.current || isProcessingAnswerRef.current || isNextStimulusPendingRef.current) {
      return;
    }
    
    const playerId = room.players[0]?.userId;
    if (!playerId) return;
    
    const stimulusIndex = currentIndexRef.current;
    
    isAnsweringRef.current = true;
    isProcessingAnswerRef.current = true;
    isNextStimulusPendingRef.current = true; // БЛОКИРОВКА
    setHasAnsweredForCurrentStimulus(true);
    
    submitAnswerMutation.mutate({ roomId, playerId, answer, stimulusIndex });
  };

  // Автотаймер — пересоздаётся после каждого действия (lastActionTime) и при изменении speedLevel
  useEffect(() => {
    if (!isGameRunning || gameCompletedRef.current) return;
    if (isAnsweringRef.current || isNextStimulusPendingRef.current) return;

    if (autoIntervalRef.current) {
      clearInterval(autoIntervalRef.current);
      autoIntervalRef.current = null;
    }

    const intervalMs = stimulusIntervalRef.current;
    autoIntervalRef.current = setInterval(() => {
      if (!isAnsweringRef.current && !isNextStimulusPendingRef.current) {
        isNextStimulusPendingRef.current = true;
        nextStimulusMutation.mutate({ roomId });
      }
    }, intervalMs);

    return () => {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
    };
  }, [isGameRunning, roomId, lastActionTime, speedLevel]);

  // Обновляем интервал без пересоздания таймера
  useEffect(() => {
    const newInterval = Math.max(2000 - (speedLevel * 200), 600);
    stimulusIntervalRef.current = newInterval;
    setStimulusInterval(newInterval);
  }, [speedLevel]);

  // Helper functions for bot display
  const getBotName = (botId: string, index: number): string => {
    const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega'];
    const prefixes = ['Speedy', 'Quick', 'Sharp', 'Brainy', 'Ninja'];
    return `${prefixes[index % prefixes.length]} ${names[index % names.length]}`;
  };

  const getBotDifficultyLabel = (difficulty: number | null): string => {
    if (difficulty === null) return '';
    switch (difficulty) {
      case 1: return '🟢 Легко';
      case 2: return '🟡 Средне';
      case 3: return '🔴 Сложно';
      default: return '';
    }
  };

  const addBotMutation = trpc.room.addBot.useMutation({
    onSuccess: () => {
      utils.room.get.invalidate({ roomId });
    },
  });

  const removeBotMutation = trpc.room.removeBot.useMutation({
    onSuccess: () => {
      utils.room.get.invalidate({ roomId });
    },
  });

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-600 via-rose-500 to-cyan-400 flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-500 to-cyan-400 animate-gradient-xy"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl font-black text-white text-center mb-3 drop-shadow-lg">
            {room.room.name}
          </h1>
          <p className="text-white/80 text-center mb-6 text-lg">
            ID сессии: <code className="bg-white/20 px-3 py-1.5 rounded-xl font-bold">{roomId}</code>
          </p>

          {!isGameRunning ? (
          /* Лобби комнаты */
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border-2 border-white/20 shadow-2xl">
            <div className="bg-white/5 rounded-2xl p-5 mb-6 space-y-3 border border-white/10">
              <div className="flex justify-between text-white/90 text-lg">
                <span className="font-semibold">Режим:</span>
                <span className="font-bold text-pink-300">
                  {room.room.isTournament ? '🏆 Турнир' : '✨ Обычный'}
                </span>
              </div>
              <div className="flex justify-between text-white/90 text-lg">
                <span className="font-semibold">N-Value:</span>
                <span className="font-bold text-cyan-300">
                  {room.room.isTournament 
                    ? `${room.room.nValue}-Back (раунд ${room.room.tournamentRound}/3)` 
                    : `${room.room.nValue}-Back`}
                </span>
              </div>
              <div className="flex justify-between text-white/90 text-lg">
                <span className="font-semibold">Игроки:</span>
                <span className="font-bold text-yellow-300">
                  {room.players.length} / {room.room.maxPlayers}
                </span>
              </div>
              <div className="flex justify-between text-white/90 text-lg">
                <span className="font-semibold">Статус:</span>
                <span className="font-bold">
                  {room.room.isStarted ? '🔴 Идёт игра' : '🟢 Ожидание'}
                </span>
              </div>
            </div>

            {/* Список всех игроков в лобби */}
            <div className="mb-6">
              <h3 className="text-white font-black text-2xl mb-4">👥 Участники</h3>
              <div className="space-y-3">
                {room.players.map((player: any, idx: number) => (
                  <div
                    key={player.id}
                    className="bg-white/10 rounded-2xl p-4 flex justify-between items-center border border-white/10 hover:bg-white/15 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {player.isBot ? (
                        <>
                          <span className="text-3xl">🤖</span>
                          <span className="text-white font-bold text-lg">
                            {getBotName(player.userId, idx)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-3xl">👤</span>
                          <span className="text-white font-bold text-lg">
                            {idx === 0 ? '👑 Вы' : `Игрок ${idx + 1}`}
                          </span>
                        </>
                      )}
                    </div>
                    {player.isBot && (
                      <span className="text-sm font-semibold text-cyan-300 px-3 py-1 bg-cyan-400/10 rounded-full">
                        {getBotDifficultyLabel(player.botDifficulty)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Управление ботами */}
            <div className="mb-6">
              <h3 className="text-white font-black text-2xl mb-4">🤖 Боты</h3>
              
              {/* Список ботов */}
              <div className="space-y-3 mb-5">
                {room.players.filter((p: any) => p.isBot).map((bot: any, botIdx: number) => (
                  <div
                    key={bot.id}
                    className="bg-white/10 rounded-2xl p-4 flex justify-between items-center border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">🤖</span>
                      <div>
                        <div className="text-white font-black text-lg">
                          {getBotName(bot.userId, botIdx)}
                        </div>
                        <div className="text-sm font-semibold text-cyan-300">
                          {getBotDifficultyLabel(bot.botDifficulty)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeBotMutation.mutate({ roomId, botId: bot.userId })}
                      disabled={removeBotMutation.isPending}
                      className="px-4 py-2 bg-red-500/30 hover:bg-red-500/50 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-lg"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {room.players.filter((p: any) => p.isBot).length === 0 && (
                  <div className="text-white/70 text-lg text-center py-5 bg-white/5 rounded-2xl">
                    Нет ботов в комнате
                  </div>
                )}
              </div>

              {/* Добавление бота */}
              <div className="flex gap-3">
                <select
                  id="botDifficulty"
                  className="flex-1 px-4 py-3 bg-white/15 border-2 border-white/20 rounded-xl text-white font-semibold focus:ring-4 focus:ring-pink-400/30 focus:border-pink-400 transition-all"
                  defaultValue={2}
                >
                  <option value={1} className="bg-white text-purple-900">🟢 Легко</option>
                  <option value={2} className="bg-white text-purple-900">🟡 Средне</option>
                  <option value={3} className="bg-white text-purple-900">🔴 Сложно</option>
                </select>
                <button
                  onClick={() => {
                    const difficulty = parseInt((document.getElementById('botDifficulty') as HTMLSelectElement).value);
                    addBotMutation.mutate({ roomId, difficulty });
                  }}
                  disabled={addBotMutation.isPending || room.players.length >= room.room.maxPlayers}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  {addBotMutation.isPending ? '⏳' : '➕ Добавить'}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                if (room.room.isTournament) {
                  startTournamentRoundMutation.mutate({ roomId, round: 1 });
                } else {
                  startGameMutation.mutate({ roomId });
                }
              }}
              disabled={startGameMutation.isPending || startTournamentRoundMutation.isPending || room.room.isStarted}
              className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-400 hover:via-rose-400 hover:to-pink-500 text-white font-black text-xl rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-xl shadow-pink-500/30"
            >
              {startGameMutation.isPending || startTournamentRoundMutation.isPending
                ? '⏳ Запуск...' 
                : room.room.isStarted 
                  ? '🔴 Игра уже идёт' 
                  : room.room.isTournament
                    ? '🏆 Начать турнир (1-Back)'
                    : '▶️ Начать игру'}
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full mt-4 py-4 px-6 bg-white/15 hover:bg-white/25 text-white font-black text-lg rounded-2xl transition-all border-2 border-white/20"
            >
              ← Вернуться на главную
            </button>
          </div>
        ) : (
          /* Игровой экран */
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border-2 border-white/20 shadow-xl">
                <h2 className="text-2xl font-black text-white text-center mb-4">
                  {nValue}-Back Challenge
                </h2>
                <p className="text-center text-white/80 mb-6 text-base">
                  Нажми "Совпадает", если позиция совпадает с позицией из {nValue} шагов назад
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

              <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-5 border-2 border-white/20 shadow-xl">
                <h3 className="text-xl font-black text-white mb-4">🏆 Счёт</h3>
                <div className="space-y-3">
                  {allPlayers.length === 0 ? (
                    <div className="text-white/70 text-base text-center py-5">Загрузка...</div>
                  ) : (
                    allPlayers.map((player: any, idx: number) => {
                      const isBot = player.isBot;
                      const isYou = !isBot && idx === 0;
                      
                      return (
                        <div
                          key={player.userId}
                          className={`rounded-2xl p-4 flex justify-between items-center ${
                            isYou 
                              ? 'bg-gradient-to-r from-pink-500/30 to-rose-500/30 border-2 border-pink-400/50'
                              : 'bg-white/5 border border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {isBot ? (
                              <>
                                <span className="text-3xl">🤖</span>
                                <div>
                                  <div className="text-white font-bold text-lg">
                                    {getBotName(player.userId, idx)}
                                  </div>
                                  <div className="text-xs font-semibold text-cyan-300">
                                    {getBotDifficultyLabel(
                                      room.players.find((p: any) => p.userId === player.userId)?.botDifficulty ?? null
                                    )}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div>
                                <div className="text-white font-black text-lg">
                                  {isYou ? '👑 Вы' : `Игрок ${idx + 1}`}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-white font-black text-2xl">{player.score}</div>
                            <div className="text-xs font-semibold text-red-300">{player.mistakes} ошиб.</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
