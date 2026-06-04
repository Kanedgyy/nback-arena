import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { auth } from './auth';

/**
 * Creates context for tRPC with better-auth integration
 */
export async function createContext(opts: CreateNextContextOptions) {
  const { req } = opts;

  // Получаем сессию из better-auth
  const session = await auth.api.getSession({
    headers: req.headers as unknown as Headers,
  });

  return {
    session,
    user: session?.user ?? null,
    userId: session?.user.id,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
