import { router } from './trpc';
import { gameRouter } from './routers/game';
import { roomRouter } from './routers/room';
import { authRouter } from './routers/auth';

export const appRouter = router({
  game: gameRouter,
  room: roomRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
