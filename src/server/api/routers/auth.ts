import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export const authRouter = router({
  signUp: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('Sign up attempt:', input.email);
        
        const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existing.length > 0) {
          throw new Error('User with this email already exists');
        }

        const newUser = await db.insert(users).values({
          email: input.email,
          name: input.name,
        }).returning();

        console.log('User created:', newUser[0].id);
        return { user: newUser[0] };
      } catch (error) {
        console.error('Sign up error:', error);
        throw new Error(error instanceof Error ? error.message : 'Sign up failed');
      }
    }),

  signIn: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('Sign in attempt:', input.email);
        
        const user = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        
        if (user.length === 0) {
          throw new Error('Invalid email or password');
        }

        console.log('User found:', user[0].id);
        return { user: user[0] };
      } catch (error) {
        console.error('Sign in error:', error);
        throw new Error(error instanceof Error ? error.message : 'Sign in failed');
      }
    }),

  getSession: publicProcedure
    .query(async () => {
      return { user: null };
    }),
});

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'nback-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
