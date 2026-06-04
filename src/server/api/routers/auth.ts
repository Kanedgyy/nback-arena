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
      email: z.string().min(1, 'Email or username is required'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
    }))
    .mutation(async ({ input }) => {
      try {
        // Используем better-auth API для входа
        const result = await auth.api.signInEmail({
          body: {
            email: input.email,
            password: input.password,
          },
          headers: new Headers(),
        });
        
        return { user: result.user };
      } catch (error) {
        console.error('Sign in error:', error);
        throw new Error('Invalid email/username or password');
      }
    }),

  signUp: publicProcedure
    .input(z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      name: z.string().min(1, 'Name is required'),
    }))
    .mutation(async ({ input }) => {
      try {
        // Используем better-auth для регистрации
        const result = await auth.api.signUpEmail({
          body: {
            email: input.email,
            password: input.password,
            name: input.name,
          },
          headers: new Headers(),
        });
        return { user: result.user };
      } catch (error) {
        console.error('Sign up error:', error);
        throw new Error('Registration failed. Email may already be in use.');
      }
    }),
});

