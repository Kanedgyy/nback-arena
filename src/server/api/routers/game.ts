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
  simulateBotResponse,
  type RoomState,
  type Stimulus
} from '@/server/game/nback-engine';

// In-memory room states (for Vercel serverless, we'll use polling)
const roomStates = new Map<string, RoomState>();

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

        // Проверяем, есть ли уже состояние игры
        const existingRoomState = roomStates.get(input.roomId);
        
        if (!existingRoomState) {
          // Создаём новое состояние
          const playerIds = players.map(p => p.userId);
          const newRoomState = createRoomState(input.roomId, {
            nValue: room[0].nValue,
          });
          
          playerIds.forEach((playerId) => {
            addPlayer(newRoomState, playerId, false, 0);
          });

          roomStates.set(input.roomId, newRoomState);
        }

        // Запускаем игру
        const roomState = roomStates.get(input.roomId)!;
        roomState.isRunning = true;

        // Боты отвечают на начальный стимул
        processBotAnswers(roomState);

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
      const roomState = roomStates.get(input.roomId);
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
      stimulusIndex: z.number().optional(), // Optional: if not provided, uses current index
    }))
    .mutation(async ({ input }) => {
      try {
        let roomState = roomStates.get(input.roomId);
        if (!roomState) {
          // Инициализируем состояние если его нет
          const room = await db.select().from(rooms).where(eq(rooms.id, input.roomId)).limit(1);
          if (room.length === 0) {
            throw new Error('Room not found or game not started');
          }
          
          const players = await db.select().from(roomPlayers).where(eq(roomPlayers.roomId, input.roomId));
          const playerIds = players.map(p => p.userId);
          
          const newRoomState = createRoomState(input.roomId, {
            nValue: room[0].nValue,
          });
          
          playerIds.forEach((playerId) => {
            addPlayer(newRoomState, playerId, false, 0);
          });
          
          roomStates.set(input.roomId, newRoomState);
          newRoomState.isRunning = true;
          roomState = newRoomState;
        }

        // Use provided stimulusIndex or default to currentIndex - 1
        const stimulusIndex = input.stimulusIndex ?? roomState.currentIndex - 1;
        const result = validateAnswer(roomState, input.playerId, input.answer, stimulusIndex);
        const speedIncreased = checkSpeedIncrease(roomState);
        const currentPlayer = roomState.players.get(input.playerId);

        return {
          success: true,
          correct: result.correct,
          score: currentPlayer?.score || 0,
          mistakes: currentPlayer?.mistakes || 0,
          correctAnswers: currentPlayer?.correctAnswers || 0,
          speedIncreased,
          isComplete: roomState.currentIndex >= roomState.sequence.length,
        };
      } catch (error) {
        console.error('Submit answer error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to submit answer');
      }
    }),

  nextStimulus: publicProcedure
    .input(z.object({
      roomId: z.string(),
    }))
    .mutation(async ({ input }) => {
      let roomState = roomStates.get(input.roomId);
      if (!roomState) {
        // Инициализируем состояние если его нет
        const room = await db.select().from(rooms).where(eq(rooms.id, input.roomId)).limit(1);
        if (room.length === 0) {
          throw new Error('Room not found or game not started');
        }
        
        const players = await db.select().from(roomPlayers).where(eq(roomPlayers.roomId, input.roomId));
        const playerIds = players.map(p => p.userId);
        
        const newRoomState = createRoomState(input.roomId, {
          nValue: room[0].nValue,
        });
        
        playerIds.forEach((playerId) => {
          addPlayer(newRoomState, playerId, false, 0);
        });
        
        roomStates.set(input.roomId, newRoomState);
        newRoomState.isRunning = true;
        roomState = newRoomState;
      }

      advanceStimulus(roomState);
      resetPlayerResponses(roomState);

      // Боты отвечают на новый текущий стимул
      processBotAnswers(roomState);

      const currentStimulus = getCurrentStimulus(roomState);

      return {
        currentIndex: roomState.currentIndex,
        stimulus: currentStimulus ? { position: currentStimulus.position } : undefined,
        speedLevel: roomState.speedLevel,
        isComplete: roomState.currentIndex >= roomState.sequence.length,
      };
    }),
});

// Helper: process bot answers for current stimulus
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
      const botAnswer = simulateBotResponse(player, actualMatch);
      validateAnswer(roomState, player.userId, botAnswer, currentIdx);
    }
  }
}

// Helper function to set room state (called from room router)
export function setRoomState(roomId: string, state: RoomState) {
  roomStates.set(roomId, state);
}

export function getRoomState(roomId: string): RoomState | undefined {
  return roomStates.get(roomId);
}
