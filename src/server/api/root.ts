import { router } from './trpc';
import { gameRouter } from './routers/game';
import { roomRouter } from './routers/room';

export const appRouter = router({
  game: gameRouter,
  room: roomRouter,
});

export type AppRouter = typeof appRouter;
