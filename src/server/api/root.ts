import { router } from './trpc';
import { roomRouter } from './routers/room';
import { gameRouter } from './routers/game';
import { authRouter } from './routers/auth';

export const appRouter = router({
  room: roomRouter,
  game: gameRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;

