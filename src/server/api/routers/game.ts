import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { db } from '../../db';
import { rooms, roomPlayers, gameResults } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import {
  validateAnswer,
  advanceStimulus,
  getCurrentStimulus,
  getGameProgress,
  getPlayerRankings,
  resetPlayerResponses,
  checkSpeedIncrease,
  type RoomState,
} from '../../game/nback-engine';

// In-memory room states
const roomStates = new Map<string, RoomState>();

export const gameRouter = router({
  submitAnswer: protectedProcedure
    .input(z.object({
      roomId: z.string().uuid(),
      answer: z.boolean(), // true = match, false = no match
    }))
    .mutation(async ({ ctx, input }) => {
      const roomState = roomStates.get(input.roomId);
      if (!roomState) {
        throw new Error('Room state not found');
      }

      if (!roomState.isRunning) {
        throw new Error('Game not running');
      }

      const player = roomState.players.get(ctx.userId!);
      if (!player) {
        throw new Error('Player not in room');
      }

      const { correct, isNewMistake } = validateAnswer(roomState, ctx.userId!, input.answer);

      // Check if speed should increase
      const speedIncreased = checkSpeedIncrease(roomState);

      return {
        correct,
        score: player.score,
        mistakes: player.mistakes,
        speedIncreased,
        newInterval: roomState.stimulusInterval,
      };
    }),

  nextStimulus: protectedProcedure
    .input(z.object({
      roomId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const roomState = roomStates.get(input.roomId);
      if (!roomState) {
        throw new Error('Room state not found');
      }

      if (!roomState.isRunning) {
        throw new Error('Game not running');
      }

      // Check if all players have responded
      const allResponded = Array.from(roomState.players.values()).every(
        p => p.lastResponse !== null || p.isBot
      );

      if (!allResponded) {
        throw new Error('Not all players have responded yet');
      }

      // Advance to next stimulus
      advanceStimulus(roomState);
      resetPlayerResponses(roomState);

      const progress = getGameProgress(roomState);
      const currentStimulus = getCurrentStimulus(roomState);

      if (progress.isComplete) {
        // Game finished - save results
        await saveGameResults(roomState);
        roomState.isRunning = false;
      }

      return {
        currentIndex: roomState.currentIndex,
        stimulus: currentStimulus,
        progress: progress.progress,
        isComplete: progress.isComplete,
        speedLevel: roomState.speedLevel,
        interval: roomState.stimulusInterval,
      };
    }),

  getCurrentState: publicProcedure
    .input(z.object({
      roomId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const roomState = roomStates.get(input.roomId);
      if (!roomState) {
        throw new Error('Room state not found');
      }

      const progress = getGameProgress(roomState);
      const currentStimulus = getCurrentStimulus(roomState);

      return {
        isRunning: roomState.isRunning,
        currentIndex: roomState.currentIndex,
        stimulus: currentStimulus,
        progress: progress.progress,
        isComplete: progress.isComplete,
        nValue: roomState.nValue,
        speedLevel: roomState.speedLevel,
        interval: roomState.stimulusInterval,
        rankings: getPlayerRankings(roomState),
      };
    }),

  getResults: publicProcedure
    .input(z.object({
      roomId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const results = await db.query.gameResults.findMany({
        where: eq(gameResults.roomId, input.roomId),
        with: {
          user: true,
        },
        orderBy: (results, { desc }) => [desc(results.score)],
      });

      return results;
    }),
});

async function saveGameResults(roomState: RoomState) {
  const rankings = getPlayerRankings(roomState);
  
  for (const playerData of rankings) {
    await db.insert(gameResults).values({
      roomId: roomState.roomId,
      userId: playerData.userId,
      score: playerData.score,
      mistakes: playerData.mistakes,
      correctAnswers: playerData.correctAnswers,
      finalSpeed: roomState.stimulusInterval,
      rank: playerData.rank,
    });
  }
}

// Helper function to set room state (called from room router)
export function setRoomState(roomId: string, state: RoomState) {
  roomStates.set(roomId, state);
}

export function getRoomState(roomId: string): RoomState | undefined {
  return roomStates.get(roomId);
}
