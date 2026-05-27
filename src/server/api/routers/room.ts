import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { rooms, roomPlayers } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export const roomRouter = router({
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      nValue: z.number().int().min(1).max(5).default(2),
      maxPlayers: z.number().int().min(2).max(6).default(4),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('Creating room:', input);
        
        const newRoom = await db.insert(rooms).values({
          name: input.name,
          nValue: input.nValue,
          maxPlayers: input.maxPlayers,
          isStarted: false,
        }).returning().then(r => r[0]);

        console.log('Room created:', newRoom.id);

        return { id: newRoom.id, name: newRoom.name };
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
        
        const room = await db.select().from(rooms).where(eq(rooms.id, input.sessionId)).limit(1);
        
        if (room.length === 0) {
          throw new Error('Room not found');
        }

        if (room[0].isStarted) {
          throw new Error('Game already started');
        }

        const currentPlayers = await db.select().from(roomPlayers).where(eq(roomPlayers.roomId, input.sessionId));
        if (currentPlayers.length >= room[0].maxPlayers) {
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
        });

        return { id: room[0].id, name: room[0].name };
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
      const room = await db.select().from(rooms).where(eq(rooms.id, input.roomId)).limit(1);
      
      if (room.length === 0) {
        throw new Error('Room not found');
      }

      const players = await db.select().from(roomPlayers).where(eq(roomPlayers.roomId, input.roomId));

      return {
        room: room[0],
        players,
      };
    }),
});

