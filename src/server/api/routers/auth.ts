import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { users, sessions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@/server/db/schema';

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

        const hashedPassword = await hashPassword(input.password);

        const newUserResult = await db.insert(users).values({
          email: input.email,
          name: input.name,
          password: hashedPassword,
        }).returning();

        const newUser = newUserResult[0] as User;

        console.log('User created:', newUser.id);
        return { user: newUser };
      } catch (error) {
        console.error('Sign up error:', error);
        throw new Error(error instanceof Error ? error.message : 'Sign up failed');
      }
    }),

  signIn: publicProcedure
    .input(z.object({
      email: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { email, password } = input;
        
        // Проверяем сначала по email
        let user = await db.select().from(users).where(eq(users.email, email)).limit(1);
        
        // Если не нашли по email и это похоже на email - пробуем по имени
        if (user.length === 0 && email.includes('@')) {
          user = await db.select().from(users).where(eq(users.name, email)).limit(1);
        } else if (user.length === 0) {
          // Если не email - пробуем как имя
          user = await db.select().from(users).where(eq(users.name, email)).limit(1);
        }

        if (user.length === 0) {
          throw new Error('User not found');
        }

        const dbUser = user[0] as User;
        
        // Проверяем пароль
        const storedHash = dbUser.password;
        if (!storedHash) {
          throw new Error('Invalid password');
        }
        
        const isValid = await compare(password, storedHash);
        if (!isValid) {
          throw new Error('Invalid password');
        }
        
        // Генерируем session token
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней
        
        await db.insert(sessions).values({
          id: token,
          userId: dbUser.id,
          expiresAt,
        });
        
        ctx.session.set(token, { userId: dbUser.id });
        
        return { 
          user: { 
            id: dbUser.id, 
            name: dbUser.name, 
            email: dbUser.email 
          } 
        };
      } catch (error) {
        console.error('Sign in error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to sign in');
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

async function compare(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}
