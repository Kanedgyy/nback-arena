import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from '~/server/context';

export const trpc = initTRPC.context<Context>().create({
  // SSE configuration for subscriptions
  sse: {
    ping: {
      enabled: true,
      intervalMs: 2000,
    },
  },
});

export const router = trpc.router;
export const middleware = trpc.middleware;
export const publicProcedure = trpc.procedure;

export const protectedProcedure = trpc.procedure.use(
  async function isAuthed(opts) {
    const { ctx } = opts;
    
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be authenticated to perform this action',
      });
    }
    
    return opts.next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }
);
