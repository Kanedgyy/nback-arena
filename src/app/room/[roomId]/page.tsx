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
  const [allPlayers, setAllPlayers] = useState<any[]>([]); // Локальное хранение всех игроков
  
  const currentIndexRef = useRef(0);
  const isAnsweringRef = useRef(false);
  const gameCompletedRef = useRef(false);

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
      
      nextStimulusMutation.mutate({ roomId });
    },
  });

  const startTournamentRoundMutation = trpc.game.startTournamentRound.useMutation({
    onSuccess: (data) => {
      setIsGameRunning(true);
      
      gameCompletedRef.current = false;
      currentIndexRef.current = 0;
      isAnsweringRef.current = false;
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
      
      nextStimulusMutation.mutate({ roomId });
    },
  });

  // submitAnswer — обновляем score напрямую из ответа сервера
  const submitAnswerMutation = trpc.game.submitAnswer.useMutation({
    onSuccess: (data) => {
      setScore(data.score);
      setMistakes(data.mistakes);
      setCorrectAnswers(data.correctAnswers);
      
      // Обновляем локальные данные игрока
      setAllPlayers(prev => prev.map(p => 
        p.userId === room?.players[0]?.userId 
          ? { ...p, score: data.score, mistakes: data.mistakes, correctAnswers: data.correctAnswers }
          : p
      ));
      
      // Переключаем стимул сразу после ответа
      nextStimulusMutation.mutate({ roomId });
    },
    onError: () => {
      isAnsweringRef.current = false;
      isProcessingAnswerRef.current = false;
      setHasAnsweredForCurrentStimulus(false);
    },
  });

  // nextStimulus — обновляем currentIndex, currentStimulus, speedLevel
  const nextStimulusMutation = trpc.game.nextStimulus.useMutation({
    onSuccess: (data) => {
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
      
      if (data.isComplete) {
        setIsGameRunning(false);
      }
    },
    onError: () => {
      isAnsweringRef.current = false;
      isProcessingAnswerRef.current = false;
      setHasAnsweredForCurrentStimulus(false);
    },
  });

  const autoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stimulusIntervalRef = useRef(2000);
  const isProcessingAnswerRef = useRef(false);

  // СБРОС при монтировании
  useEffect(() => {
    utils.room.get.invalidate({ roomId });
    
    gameCompletedRef.current = false;
    currentIndexRef.current = 0;
    isAnsweringRef.current = false;
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
    
    if (autoIntervalRef.current) {
      clearInterval(autoIntervalRef.current);
      autoIntervalRef.current = null;
    }
  }, [roomId]);

  const handleAnswer = (answer: boolean) => {
    if (!room || !isGameRunning || isAnsweringRef.current || isProcessingAnswerRef.current) {
      return;
    }
    
    const playerId = room.players[0]?.userId;
    if (!playerId) return;
    
    const stimulusIndex = currentIndexRef.current;
    
    isAnsweringRef.current = true;
    isProcessingAnswerRef.current = true;
    setHasAnsweredForCurrentStimulus(true);
    
    // Очищаем автотаймер — переключение будет через submitAnswer.onSuccess
    if (autoIntervalRef.current) {
      clearInterval(autoIntervalRef.current);
      autoIntervalRef.current = null;
    }
    
    submitAnswerMutation.mutate({ roomId, playerId, answer, stimulusIndex });
  };

  // Автотаймер — только если игрок НЕ отвечает
  useEffect(() => {
    if (!isGameRunning || gameCompletedRef.current) return;
    if (isAnsweringRef.current) return;

    if (autoIntervalRef.current) {
      clearInterval(autoIntervalRef.current);
      autoIntervalRef.current = null;
    }

    const intervalMs = stimulusIntervalRef.current;
    autoIntervalRef.current = setInterval(() => {
      if (!isAnsweringRef.current) {
        nextStimulusMutation.mutate({ roomId });
      }
    }, intervalMs);

    return () => {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
    };
  }, [isGameRunning, roomId]);

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
                <span>Режим:</span>
                <span className="font-semibold">
                  {room.room.isTournament ? '🏆 Турнир' : '✨ Обычный'}
                </span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>N-Value:</span>
                <span className="font-semibold">
                  {room.room.isTournament 
                    ? `${room.room.nValue}-Back (раунд ${room.room.tournamentRound}/3)` 
                    : `${room.room.nValue}-Back`}
                </span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Игроки:</span>
                <span className="font-semibold">{room.players.length} / {room.room.maxPlayers}</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Статус:</span>
                <span className="font-semibold">
                  {room.room.isStarted ? '🔴 Идёт игра' : '🟢 Ожидание'}
                </span>
              </div>
            </div>

            {/* Список всех игроков в лобби */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3">👥 Участники</h3>
              <div className="space-y-2">
                {room.players.map((player: any, idx: number) => (
                  <div
                    key={player.id}
                    className="bg-white/5 rounded-lg p-3 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      {player.isBot ? (
                        <>
                          <span className="text-xl">🤖</span>
                          <span className="text-white">{getBotName(player.userId, idx)}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl">👤</span>
                          <span className="text-white">{idx === 0 ? '👑 Вы' : `Игрок ${idx + 1}`}</span>
                        </>
                      )}
                    </div>
                    {player.isBot && (
                      <span className="text-xs text-purple-300">{getBotDifficultyLabel(player.botDifficulty)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Управление ботами */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3">🤖 Боты</h3>
              
              {/* Список ботов */}
              <div className="space-y-2 mb-4">
                {room.players.filter((p: any) => p.isBot).map((bot: any, botIdx: number) => (
                  <div
                    key={bot.id}
                    className="bg-white/5 rounded-lg p-3 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🤖</span>
                      <div>
                        <div className="text-white font-medium">
                          {getBotName(bot.userId, botIdx)}
                        </div>
                        <div className="text-xs text-purple-300">
                          {getBotDifficultyLabel(bot.botDifficulty)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeBotMutation.mutate({ roomId, botId: bot.userId })}
                      disabled={removeBotMutation.isPending}
                      className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg text-sm transition-all disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {room.players.filter((p: any) => p.isBot).length === 0 && (
                  <div className="text-purple-300 text-sm text-center py-4">
                    Нет ботов в комнате
                  </div>
                )}
              </div>

              {/* Добавление бота */}
              <div className="flex gap-2">
                <select
                  id="botDifficulty"
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-pink-400"
                  defaultValue={2}
                >
                  <option value={1} className="bg-white text-purple-900">Легко</option>
                  <option value={2} className="bg-white text-purple-900">Средне</option>
                  <option value={3} className="bg-white text-purple-900">Сложно</option>
                </select>
                <button
                  onClick={() => {
                    const difficulty = parseInt((document.getElementById('botDifficulty') as HTMLSelectElement).value);
                    addBotMutation.mutate({ roomId, difficulty });
                  }}
                  disabled={addBotMutation.isPending || room.players.length >= room.room.maxPlayers}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addBotMutation.isPending ? '...' : '➕ Добавить'}
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
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startGameMutation.isPending || startTournamentRoundMutation.isPending
                ? 'Запуск...' 
                : room.room.isStarted 
                  ? 'Игра уже идёт' 
                  : room.room.isTournament
                    ? '🏆 Начать турнир (1-Back)'
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
                <h3 className="text-lg font-semibold mb-3 text-white">🏆 Счёт</h3>
                <div className="space-y-2">
                  {allPlayers.length === 0 ? (
                    <div className="text-purple-300 text-sm text-center py-4">Загрузка...</div>
                  ) : (
                    allPlayers.map((player: any, idx: number) => {
                      const isBot = player.isBot;
                      const isYou = !isBot && idx === 0;
                      
                      return (
                        <div
                          key={player.userId}
                          className="bg-white/5 rounded-lg p-3 flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2">
                            {isBot ? (
                              <>
                                <span className="text-2xl">🤖</span>
                                <div>
                                  <div className="text-white font-medium">
                                    {getBotName(player.userId, idx)}
                                  </div>
                                  <div className="text-xs text-purple-300">
                                    {getBotDifficultyLabel(
                                      room.players.find((p: any) => p.userId === player.userId)?.botDifficulty ?? null
                                    )}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div>
                                <div className="text-white font-medium">
                                  {isYou ? '👑 Вы' : `Игрок ${idx + 1}`}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold">{player.score} очк.</div>
                            <div className="text-xs text-red-300">{player.mistakes} ошиб.</div>
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
  );
}
