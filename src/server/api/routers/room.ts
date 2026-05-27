import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { db } from '../../db';
import { rooms, roomPlayers, gameResults } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { createRoomState, addPlayer, DEFAULT_CONFIG } from '../../game/nback-engine';

// In-memory room states (in production, use Redis)
const roomStates = new Map<string, ReturnType<typeof createRoomState>>();

export const roomRouter = router({
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      nValue: z.number().int().min(1).max(5).default(2),
      maxPlayers: z.number().int().min(2).max(4).default(4),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('Creating room:', input);
        
        const newRoom = await db.insert(rooms).values({
          name: input.name,
          hostId: 'anonymous', // Временно без auth
          nValue: input.nValue,
          maxPlayers: input.maxPlayers,
        }).returning().then(r => r[0]);

        console.log('Room created:', newRoom.id);

        await db.insert(roomPlayers).values({
          roomId: newRoom.id,
          userId: 'anonymous',
          isReady: false,
        });

        console.log('Player added to room');

        return newRoom;
      } catch (error) {
        console.error('Create room error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create room');
      }
    }),

  join: protectedProcedure
    .input(z.object({
      roomId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const room = await db.query.rooms.findFirst({
        where: eq(rooms.id, input.roomId),
      });

      if (!room) {
        throw new Error('Room not found');
      }

      if (room.isStarted) {
        throw new Error('Game already started');
      }

      // Check if player already in room
      const existingPlayer = await db.query.roomPlayers.findFirst({
        where: and(
          eq(roomPlayers.roomId, input.roomId),
          eq(roomPlayers.userId, ctx.userId!)
        ),
      });

      if (existingPlayer) {
        return room;
      }

      // Check max players
      const currentPlayers = await db.query.roomPlayers.findMany({
        where: eq(roomPlayers.roomId, input.roomId),
      });

      if (currentPlayers.length >= room.maxPlayers) {
        throw new Error('Room is full');
      }

      await db.insert(roomPlayers).values({
        roomId: input.roomId,
        userId: ctx.userId!,
        isReady: false,
      });

      // Add to room state
      const roomState = roomStates.get(input.roomId);
      if (roomState) {
        addPlayer(roomState, ctx.userId!, false);
      }

      return room;
    }),

  leave: protectedProcedure
    .input(z.object({
      roomId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(roomPlayers).where(
        and(
          eq(roomPlayers.roomId, input.roomId),
          eq(roomPlayers.userId, ctx.userId!)
        )
      );

      // Remove from room state
      const roomState = roomStates.get(input.roomId);
      if (roomState) {
        roomState.players.delete(ctx.userId!);
      }

      return { success: true };
    }),

  get: publicProcedure
    .input(z.object({
      roomId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const room = await db.query.rooms.findFirst({
        where: eq(rooms.id, input.roomId),
        with: {
          roomPlayers: {
            with: {
              user: true,
            },
          },
        },
      });

      if (!room) {
        throw new Error('Room not found');
      }

      return room;
    }),

  getOrCreateRoomState: publicProcedure
    .input(z.object({
      roomId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const roomState = roomStates.get(input.roomId);
      if (!roomState) {
        throw new Error('Room state not found');
      }

      return {
        roomId: roomState.roomId,
        nValue: roomState.nValue,
        stimulusInterval: roomState.stimulusInterval,
        currentIndex: roomState.currentIndex,
        totalStimuli: roomState.sequence.length,
        isRunning: roomState.isRunning,
        speedLevel: roomState.speedLevel,
        players: Array.from(roomState.players.values()).map(p => ({
          userId: p.userId,
          isBot: p.isBot,
          score: p.score,
          mistakes: p.mistakes,
          correctAnswers: p.correctAnswers,
        })),
      };
    }),

  addBot: protectedProcedure
    .input(z.object({
      roomId: z.string().uuid(),
      accuracy: z.number().min(0).max(100).default(80),
    }))
    .mutation(async ({ ctx, input }) => {
      const room = await db.query.rooms.findFirst({
        where: eq(rooms.id, input.roomId),
      });

      if (!room) {
        throw new Error('Room not found');
      }

      if (room.isStarted) {
        throw new Error('Game already started');
      }

      // Generate a bot user ID
      const botUserId = `bot-${crypto.randomUUID()}`;

      const roomState = roomStates.get(input.roomId);
      if (roomState) {
        addPlayer(roomState, botUserId, true, input.accuracy);
      }

      return { botUserId, accuracy: input.accuracy };
    }),

  start: protectedProcedure
    .input(z.object({
      roomId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const room = await db.query.rooms.findFirst({
        where: eq(rooms.id, input.roomId),
      });

      if (!room) {
        throw new Error('Room not found');
      }

      if (room.hostId !== ctx.userId!) {
        throw new Error('Only host can start the game');
      }

      const players = await db.query.roomPlayers.findMany({
        where: eq(roomPlayers.roomId, input.roomId),
      });

      if (players.length < 2) {
        throw new Error('Need at least 2 players to start');
      }

      await db.update(rooms).set({ isStarted: true }).where(
        eq(rooms.id, input.roomId)
      );

      const roomState = roomStates.get(input.roomId);
      if (roomState) {
        roomState.isRunning = true;
      }

      return { success: true };
    }),
});
