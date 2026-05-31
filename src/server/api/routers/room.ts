import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { rooms, roomPlayers } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { Room, NewRoomPlayer } from '@/server/db/schema';

export const roomRouter = router({
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      nValue: z.number().int().min(1).max(5).default(2),
      maxPlayers: z.number().int().min(2).max(6).default(4),
      isTournament: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('Creating room:', input);
        
        const hostId = crypto.randomUUID();
        
        const newRoomResult = await db.insert(rooms).values({
          name: input.name,
          hostId: hostId,
          nValue: input.isTournament ? 1 : input.nValue,
          maxPlayers: input.maxPlayers,
          isStarted: false,
          isTournament: input.isTournament,
          tournamentRound: 0,
          tournamentTotalRounds: input.isTournament ? 3 : 0,
          tournamentResultsJson: input.isTournament ? '[]' : null,
        }).returning();
        
        const newRoom = newRoomResult[0] as Room;
        console.log('Room created:', newRoom.id);

        await db.insert(roomPlayers).values({
          id: crypto.randomUUID(),
          roomId: newRoom.id,
          userId: hostId,
          score: 0,
          mistakes: 0,
          isReady: false,
          isBot: false,
        } as NewRoomPlayer);

        const { createRoomState, addPlayer } = await import('@/server/game/nback-engine');
        const roomState = createRoomState(newRoom.id, {
          nValue: input.isTournament ? 1 : input.nValue,
        });
        addPlayer(roomState, hostId, false, 0);
        
        const { setRoomState } = await import('@/server/api/routers/game');
        await setRoomState(newRoom.id, roomState);

        return { id: newRoom.id, name: newRoom.name, isTournament: input.isTournament };
      } catch (error) {
        console.error('Create room error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create room');
      }
    }),

  join: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('Joining room:', input.sessionId);
        
        const roomResult = await db.select().from(rooms).where(eq(rooms.id, input.sessionId)).limit(1);
        const room = roomResult[0] as Room;
        
        if (!room) {
          throw new Error('Room not found');
        }

        if (room.isStarted) {
          throw new Error('Game already started');
        }

        const currentPlayers = await db.select().from(roomPlayers).where(eq(roomPlayers.roomId, input.sessionId));
        if (currentPlayers.length >= room.maxPlayers) {
          throw new Error('Room is full');
        }

        // Генерируем UUID для нового игрока
        const playerUserId = crypto.randomUUID();
        await db.insert(roomPlayers).values({
          id: crypto.randomUUID(),
          roomId: input.sessionId,
          userId: playerUserId,
          score: 0,
          mistakes: 0,
          isReady: false,
          isBot: false,
        } as NewRoomPlayer);

        // Добавляем игрока в состояние игры
        const { getRoomState } = await import('@/server/api/routers/game');
        const { addPlayer } = await import('@/server/game/nback-engine');
        const roomState = await getRoomState(input.sessionId);
        if (roomState) {
          addPlayer(roomState, playerUserId, false, 0);
        }

        return { id: room.id, name: room.name };
      } catch (error) {
        console.error('Join room error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to join room');
      }
    }),

  get: publicProcedure
    .input(z.object({
      roomId: z.string(),
    }))
    .query(async ({ input }) => {
        const roomResult = await db.select().from(rooms).where(eq(rooms.id, input.roomId)).limit(1);
        const room = roomResult[0] as Room;
      
      if (!room) {
        throw new Error('Room not found');
      }

      const players = await db.select().from(roomPlayers).where(eq(roomPlayers.roomId, input.roomId));

      return {
        room,
        players,
      };
    }),

  addBot: publicProcedure
    .input(z.object({
      roomId: z.string(),
      difficulty: z.number().int().min(1).max(3).default(2),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('Adding bot to room:', input.roomId, 'difficulty:', input.difficulty);
        
        const roomResult = await db.select().from(rooms).where(eq(rooms.id, input.roomId)).limit(1);
        const room = roomResult[0] as Room;
        if (!room) {
          throw new Error('Room not found');
        }

        if (room.isStarted) {
          throw new Error('Game already started');
        }

        const currentPlayers = await db.select().from(roomPlayers).where(eq(roomPlayers.roomId, input.roomId));
        if (currentPlayers.length >= room.maxPlayers) {
          throw new Error('Room is full');
        }

        // Генерируем UUID для бота и имя
        const botUserId = `bot_${crypto.randomUUID()}`;
        const { generateBotName, getBotAccuracy } = await import('@/server/game/nback-engine');
        const botName = generateBotName(currentPlayers.length);
        const accuracy = getBotAccuracy(input.difficulty);

        await db.insert(roomPlayers).values({
          id: crypto.randomUUID(),
          roomId: input.roomId,
          userId: botUserId,
          score: 0,
          mistakes: 0,
          isReady: true,
          isBot: true,
          botDifficulty: input.difficulty,
        } as NewRoomPlayer);

        // Добавляем бота в состояние игры
        const { getRoomState } = await import('@/server/api/routers/game');
        const { addPlayer } = await import('@/server/game/nback-engine');
        const roomState = await getRoomState(input.roomId);
        if (roomState) {
          addPlayer(roomState, botUserId, true, accuracy);
        }

        return { 
          success: true, 
          botId: botUserId,
          botName,
          difficulty: input.difficulty,
        };
      } catch (error) {
        console.error('Add bot error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to add bot');
      }
    }),

  removeBot: publicProcedure
    .input(z.object({
      roomId: z.string(),
      botId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('Removing bot from room:', input.roomId, 'botId:', input.botId);
        
        const roomResult = await db.select().from(rooms).where(eq(rooms.id, input.roomId)).limit(1);
        const room = roomResult[0] as Room;
        if (!room) {
          throw new Error('Room not found');
        }

        if (room.isStarted) {
          throw new Error('Game already started');
        }

        // Проверяем что это бот
        const botResult = await db.select().from(roomPlayers).where(
          and(
            eq(roomPlayers.roomId, input.roomId), 
            eq(roomPlayers.userId, input.botId),
            eq(roomPlayers.isBot, true)
          )
        ).limit(1);

        if (botResult.length === 0) {
          throw new Error('Bot not found');
        }

        // Удаляем из БД
        await db.delete(roomPlayers).where(
          and(
            eq(roomPlayers.roomId, input.roomId), 
            eq(roomPlayers.userId, input.botId)
          )
        );

        // Удаляем из состояния игры
        const { getRoomState } = await import('@/server/api/routers/game');
        const { removePlayer } = await import('@/server/game/nback-engine');
        const roomState = await getRoomState(input.roomId);
        if (roomState) {
          removePlayer(roomState, input.botId);
        }

        return { success: true };
      } catch (error) {
        console.error('Remove bot error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to remove bot');
      }
    }),
});

