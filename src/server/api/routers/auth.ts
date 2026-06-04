import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { auth } from '~/server/auth';

export const authRouter = router({
  getSession: publicProcedure
    .query(async ({ ctx }) => {
      // Получаем сессию из better-auth через контекст
      return { 
        user: ctx.user ?? null,
        session: ctx.session,
      };
    }),

  signIn: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      try {
        // Используем better-auth для входа
        const result = await auth.api.signInEmail({
          body: input,
          headers: new Headers(),
        });
        return { user: result.user };
      } catch (error) {
        console.error('Sign in error:', error);
        throw new Error('Invalid email or password');
      }
    }),

  signUp: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Используем better-auth для регистрации
        const result = await auth.api.signUpEmail({
          body: { ...input, name: input.name || 'User' },
          headers: new Headers(),
        });
        return { user: result.user };
      } catch (error) {
        console.error('Sign up error:', error);
        throw new Error('Registration failed');
      }
    }),
});

