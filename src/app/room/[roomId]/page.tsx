'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { trpc } from '@/trpc';
import { GameGrid } from '@/components/GameGrid';
import { PlayerStats } from '@/components/PlayerStats';
import { GameControls } from '@/components/GameControls';
import { GridPosition } from '@/server/game/nback-engine';

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [nValue, setNValue] = useState(2);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [currentStimulus, setCurrentStimulus] = useState<GridPosition | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalStimuli, setTotalStimuli] = useState(30);
  const [speedLevel, setSpeedLevel] = useState(0);

  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const { data: room } = trpc.room.get.useQuery({ roomId });
  const { data: roomState } = trpc.room.getOrCreateRoomState.useQuery({ roomId });
  const { data: gameState } = trpc.game.getCurrentState.useQuery({ roomId }, { enabled: isGameRunning });

  const submitAnswerMutation = trpc.game.submitAnswer.useMutation({
    onSuccess: (data) => {
      setScore(data.score);
      setMistakes(data.mistakes);
      setCorrectAnswers(prev => prev + (data.correct ? 1 : 0));
      
      if (data.speedIncreased) {
        alert('⚡ Game speed increased due to mistakes!');
      }
    },
  });

  const nextStimulusMutation = trpc.game.nextStimulus.useMutation({
    onSuccess: (data) => {
      setCurrentIndex(data.currentIndex);
      setCurrentStimulus(data.stimulus?.position ?? null);
      setSpeedLevel(data.speedLevel);

      if (data.isComplete) {
        setIsGameRunning(false);
        alert('Game Complete! Check results below.');
      }
    },
  });

  const handleAnswer = (answer: boolean) => {
    submitAnswerMutation.mutate({ roomId, answer });
    
    // Auto-advance after answer (in real implementation, wait for all players)
    setTimeout(() => {
      nextStimulusMutation.mutate({ roomId });
    }, 200);
  };

  // Update local state from server
  useEffect(() => {
    if (roomState) {
      setNValue(roomState.nValue);
      setTotalStimuli(roomState.totalStimuli);
    }
  }, [roomState]);

  useEffect(() => {
    if (gameState) {
      setCurrentIndex(gameState.currentIndex);
      setCurrentStimulus(gameState.stimulus?.position ?? null);
      setSpeedLevel(gameState.speedLevel);
      setIsGameRunning(gameState.isRunning);
    }
  }, [gameState]);

  if (!room) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Room: {room.name}
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Game Area */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-center">
                {nValue}-Back Challenge
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Press "Match" if the current position matches the position from {nValue} steps ago
              </p>
              
              <GameGrid activePosition={currentStimulus} nValue={nValue} />
            </div>

            <GameControls
              onSubmitAnswer={handleAnswer}
              isGameRunning={isGameRunning}
            />
          </div>

          {/* Stats Area */}
          <div className="space-y-6">
            <PlayerStats
              score={score}
              mistakes={mistakes}
              correctAnswers={correctAnswers}
              nValue={nValue}
              speedLevel={speedLevel}
              currentStimulusIndex={currentIndex}
              totalStimuli={totalStimuli}
            />

            {/* Players List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-3">Players</h3>
              <ul className="space-y-2">
                {roomState?.players.map((player, idx) => (
                  <li key={idx} className="flex justify-between items-center">
                    <span>{player.isBot ? 'Bot' : 'Player'} #{player.userId.slice(0, 8)}</span>
                    <span className="text-sm text-gray-500">
                      Score: {player.score}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Game Results */}
        {gameState?.isComplete && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">🏆 Game Results</h2>
            <div className="space-y-2">
              {gameState.rankings.map((player) => (
                <div
                  key={player.userId}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <span>
                    {player.rank === 1 && '🥇'}
                    {player.rank === 2 && '🥈'}
                    {player.rank === 3 && '🥉'}
                    {' '}{player.isBot ? 'Bot' : 'Player'} #{player.userId.slice(0, 8)}
                  </span>
                  <span className="font-semibold">
                    Score: {player.score} | Mistakes: {player.mistakes}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
