import { initTRPC, TRPCError } from '@trpc/server';

interface CreateContextOptions {
  userId?: string;
}

export async function createContext(_opts: CreateContextOptions) {
  return {
    userId: _opts.userId,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const trpc = initTRPC.context<Context>().create();

export const router = trpc.router;
export const middleware = trpc.middleware;
export const publicProcedure = trpc.procedure;

export const protectedProcedure = trpc.procedure.use(
  async function isAuthed(opts) {
    const { ctx } = opts;
    
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be authenticated to perform this action',
      });
    }
    
    return opts.next({
      ctx: {
        ...ctx,
        userId: ctx.userId,
      },
    });
  }
);
