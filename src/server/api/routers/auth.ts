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
        // Проверка существования пользователя
        const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existing.length > 0) {
          throw new Error('User with this email already exists');
        }

        // Хеширование пароля
        const hashedPassword = await hashPassword(input.password);

        const newUser = await db.insert(users).values({
          email: input.email,
          name: input.name,
        }).returning();

        return {
          user: newUser[0],
        };
      } catch (error) {
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
        const user = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        
        if (user.length === 0) {
          throw new Error('Invalid email or password');
        }

        // Для простоты — храним пароль в открытом виде (для production используйте bcrypt)
        // TODO: Добавьте поле password в schema/users.ts
        const validPassword = input.password === 'password123'; // Временная заглушка
        
        if (!validPassword) {
          throw new Error('Invalid email or password');
        }

        return {
          user: user[0],
        };
      } catch (error) {
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
