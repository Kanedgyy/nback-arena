import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { rooms, roomPlayers, gameResults } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { 
  createRoomState, 
  addPlayer, 
  getCurrentStimulus, 
  getGameProgress, 
  getPlayerRankings, 
  validateAnswer, 
  checkSpeedIncrease, 
  advanceStimulus, 
  resetPlayerResponses,
  type RoomState,
  type Stimulus,
  type PlayerState,
} from '@/server/game/nback-engine';

// In-memory cache (for performance)
const roomStatesCache = new Map<string, RoomState>();

// Load room state from DB or cache
async function loadRoomState(roomId: string): Promise<RoomState | null> {
  // Check cache first
  const cached = roomStatesCache.get(roomId);
  if (cached) return cached;

  // Load from DB
  const roomResult = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  const room = roomResult[0];
  if (!room || !room.gameStateJson) return null;

  try {
    const parsed = JSON.parse(room.gameStateJson);
    const roomState = createRoomState(roomId, { nValue: parsed.nValue });
    
    // Restore sequence
    roomState.sequence = parsed.sequence;
    roomState.currentIndex = parsed.currentIndex;
    roomState.isRunning = parsed.isRunning;
    roomState.speedLevel = parsed.speedLevel;
    roomState.stimulusInterval = parsed.stimulusInterval;
    
    // Restore players
    for (const p of parsed.players) {
      const player: PlayerState = {
        userId: p.userId,
        isBot: p.isBot,
        botAccuracy: p.botAccuracy,
        score: p.score,
        mistakes: p.mistakes,
        correctAnswers: p.correctAnswers,
        lastResponse: p.lastResponse,
      };
      roomState.players.set(p.userId, player);
    }
    
    roomStatesCache.set(roomId, roomState);
    return roomState;
  } catch (e) {
    console.error('Failed to parse game state:', e);
    return null;
  }
}

// Save room state to DB and cache
async function saveRoomState(roomId: string, roomState: RoomState) {
  const players = Array.from(roomState.players.values()).map(p => ({
    userId: p.userId,
    isBot: p.isBot,
    botAccuracy: p.botAccuracy,
    score: p.score,
    mistakes: p.mistakes,
    correctAnswers: p.correctAnswers,
    lastResponse: p.lastResponse,
  }));
  
  const stateJson = JSON.stringify({
    nValue: roomState.nValue,
    sequence: roomState.sequence,
    currentIndex: roomState.currentIndex,
    isRunning: roomState.isRunning,
    speedLevel: roomState.speedLevel,
    stimulusInterval: roomState.stimulusInterval,
    players,
  });
  
  await db.update(rooms).set({ gameStateJson: stateJson }).where(eq(rooms.id, roomId));
  roomStatesCache.set(roomId, roomState);
}

export const gameRouter = router({
  start: publicProcedure
    .input(z.object({
      roomId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('Starting game in room:', input.roomId);
        
        const room = await db.select().from(rooms).where(eq(rooms.id, input.roomId)).limit(1);
        if (room.length === 0) {
          throw new Error('Room not found');
        }

        const players = await db.select().from(roomPlayers).where(eq(roomPlayers.roomId, input.roomId));
        if (players.length < 1) {
          throw new Error('Need at least 1 player to start');
        }

        // Создаём новое состояние
        const newRoomState = createRoomState(input.roomId, {
          nValue: room[0].nValue,
        });
        
        // Добавляем игроков с правильной конфигурацией ботов
        for (const player of players) {
          if (player.isBot && player.botDifficulty !== null) {
            const { getBotAccuracy } = await import('@/server/game/nback-engine');
            const accuracy = getBotAccuracy(player.botDifficulty);
            addPlayer(newRoomState, player.userId, true, accuracy);
          } else {
            addPlayer(newRoomState, player.userId, false, 0);
          }
        }

        // Сохраняем состояние в БД
        await saveRoomState(input.roomId, newRoomState);

        // Запускаем игру
        const roomState = newRoomState;
        roomState.isRunning = true;
        await saveRoomState(input.roomId, roomState);

        // Боты отвечают на начальный стимул
        processBotAnswers(roomState);
        await saveRoomState(input.roomId, roomState);

        // Update room status
        await db.update(rooms).set({ isStarted: true }).where(eq(rooms.id, input.roomId));

        return {
          success: true,
          grid: roomState.sequence.map(s => s.position),
          playerCount: players.length,
        };
      } catch (error) {
        console.error('Start game error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to start game');
      }
    }),

  getCurrentState: publicProcedure
    .input(z.object({
      roomId: z.string(),
    }))
    .query(async ({ input }) => {
      const roomState = await loadRoomState(input.roomId);
      if (!roomState || !roomState.isRunning) {
        return null;
      }

      const currentStimulus = getCurrentStimulus(roomState);
      const progress = getGameProgress(roomState);

      return {
        roomId: roomState.roomId,
        nValue: roomState.nValue,
        stimulusInterval: roomState.stimulusInterval,
        currentIndex: roomState.currentIndex,
        totalStimuli: roomState.sequence.length,
        isRunning: roomState.isRunning,
        speedLevel: roomState.speedLevel,
        currentStimulus: currentStimulus ? currentStimulus.position : undefined,
        progress: progress.progress,
        isComplete: progress.isComplete,
        players: Array.from(roomState.players.values()).map(p => ({
          userId: p.userId,
          isBot: p.isBot,
          score: p.score,
          mistakes: p.mistakes,
          correctAnswers: p.correctAnswers,
        })),
        rankings: getPlayerRankings(roomState),
      };
    }),

  submitAnswer: publicProcedure
    .input(z.object({
      roomId: z.string(),
      playerId: z.string(),
      answer: z.boolean(),
      stimulusIndex: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const roomState = await loadRoomState(input.roomId);
      if (!roomState) {
        throw new Error('Game state not found. Please restart the game.');
      }

      const stimulusIndex = input.stimulusIndex ?? roomState.currentIndex - 1;
      const result = validateAnswer(roomState, input.playerId, input.answer, stimulusIndex);
      const speedIncreased = checkSpeedIncrease(roomState);
      const currentPlayer = roomState.players.get(input.playerId);

      // Сохраняем после ответа
      await saveRoomState(input.roomId, roomState);

      return {
        success: true,
        correct: result.correct,
        score: currentPlayer?.score || 0,
        mistakes: currentPlayer?.mistakes || 0,
        correctAnswers: currentPlayer?.correctAnswers || 0,
        speedIncreased,
        isComplete: roomState.currentIndex >= roomState.sequence.length,
      };
    }),

  nextStimulus: publicProcedure
    .input(z.object({
      roomId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const roomState = await loadRoomState(input.roomId);
      if (!roomState) {
        throw new Error('Game state not found. Please restart the game.');
      }

      // Боты отвечают на текущий стимул ПЕРЕД переходом
      processBotAnswers(roomState);

      advanceStimulus(roomState);
      resetPlayerResponses(roomState);

      // Сохраняем после перехода
      await saveRoomState(input.roomId, roomState);

      const currentStimulus = getCurrentStimulus(roomState);

      return {
        currentIndex: roomState.currentIndex,
        stimulus: currentStimulus ? { position: currentStimulus.position } : undefined,
        speedLevel: roomState.speedLevel,
        isComplete: roomState.currentIndex >= roomState.sequence.length,
      };
    }),

  getResults: publicProcedure
    .input(z.object({
      roomId: z.string(),
    }))
    .query(async ({ input }) => {
      const roomState = await loadRoomState(input.roomId);
      
      if (roomState) {
        return {
          nValue: roomState.nValue,
          isComplete: roomState.currentIndex >= roomState.sequence.length,
          players: Array.from(roomState.players.values()).map(p => ({
            userId: p.userId,
            isBot: p.isBot,
            score: p.score,
            mistakes: p.mistakes,
            correctAnswers: p.correctAnswers,
          })),
          rankings: getPlayerRankings(roomState),
        };
      }
      
      // Fallback: load from DB players if game state was reset
      const players = await db.select().from(roomPlayers).where(eq(roomPlayers.roomId, input.roomId));
      const room = await db.select().from(rooms).where(eq(rooms.id, input.roomId)).limit(1);
      
      return {
        nValue: room[0]?.nValue || 2,
        isComplete: true,
        players: players.map(p => ({
          userId: p.userId,
          isBot: p.isBot,
          score: p.score,
          mistakes: p.mistakes,
          correctAnswers: 0,
        })),
        rankings: players
          .map(p => ({ userId: p.userId, isBot: p.isBot, score: p.score, mistakes: p.mistakes, correctAnswers: 0, rank: 0 }))
          .sort((a, b) => b.score - a.score)
          .map((p, i) => ({ ...p, rank: i + 1 })),
      };
    }),

  rematch: publicProcedure
    .input(z.object({
      roomId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('Rematch in room:', input.roomId);
        
        // Удаляем из кэша
        roomStatesCache.delete(input.roomId);
        
        // Сбрасываем game_state_json и isStarted
        await db.update(rooms)
          .set({ gameStateJson: null, isStarted: false })
          .where(eq(rooms.id, input.roomId));
        
        // Сбрасываем score и mistakes у всех игроков
        await db.update(roomPlayers)
          .set({ score: 0, mistakes: 0 })
          .where(eq(roomPlayers.roomId, input.roomId));
        
        return { success: true };
      } catch (error) {
        console.error('Rematch error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to reset game');
      }
    }),
});

// Helper: process bot answers for current stimulus (NEW LOGIC)
// Bots get +10 ONLY for correctly found matches, not for "correct silence"
function processBotAnswers(roomState: RoomState) {
  const currentIdx = roomState.currentIndex;
  if (currentIdx >= roomState.sequence.length) return;

  const nValue = roomState.nValue;
  const nBackIdx = currentIdx - nValue;
  let actualMatch = false;
  
  if (currentIdx >= nValue && nBackIdx >= 0) {
    actualMatch = roomState.sequence[currentIdx].position === roomState.sequence[nBackIdx].position;
  }

  for (const player of roomState.players.values()) {
    if (player.isBot && player.botAccuracy !== undefined && player.lastResponse === null) {
      const accuracy = player.botAccuracy;
      const shouldActCorrectly = Math.random() * 100 < accuracy;
      
      if (actualMatch) {
        // Есть совпадение
        if (shouldActCorrectly) {
          // Бот правильно нажимает "Совпадает"
          validateAnswer(roomState, player.userId, true, currentIdx);
        } else {
          // Бот ошибочно НЕ нажимает - это пропуск match!
          player.mistakes += 1;
          player.score = Math.max(0, player.score - 10);
          player.lastResponse = false;
        }
      } else {
        // Нет совпадения
        if (shouldActCorrectly) {
          // Бот правильно НЕ нажимает - 0 очков, не ошибка
          player.lastResponse = false;
        } else {
          // Бот ошибочно нажимает "Совпадает" - false alarm
          validateAnswer(roomState, player.userId, true, currentIdx);
        }
      }
    }
  }
}

// Helper function to set room state (called from room router)
export async function setRoomState(roomId: string, state: RoomState) {
  await saveRoomState(roomId, state);
}

export async function getRoomState(roomId: string): Promise<RoomState | null> {
  return await loadRoomState(roomId);
}
