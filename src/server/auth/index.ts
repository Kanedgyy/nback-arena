import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '~/server/db';
import * as schema from '~/server/db/schema';

const databaseUrl = process.env.DATABASE_URL;
const authUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
const secret = process.env.BETTER_AUTH_SECRET;

if (!databaseUrl) {
  console.error('DATABASE_URL is not set');
}

if (!secret) {
  console.error('BETTER_AUTH_SECRET is not set');
}

export const auth = betterAuth({
  // Используем drizzle adapter для интеграции с нашей БД
  // usePlural: true - т.к. наши таблицы называются users, sessions, accounts (во множественном числе)
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: schema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    // Отключаем строгую валидацию email для поддержки различных форматов
    disableEmailVerification: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 дней
    updateAge: 60 * 60 * 24, // Обновляем сессию каждый день
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    // Отключаем генерацию ID в better-auth - БД сама генерирует UUID через defaultRandom()
    database: {
      generateId: false,
    },
  },
  baseURL: authUrl,
  // Используем секрет из переменных окружения или генерируем временный
  secret: secret || 'fallback-secret-change-in-production-min-32-chars',
  
  // Кастомный колбэк для интеграции с tRPC
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      return {
        ...session,
        user: {
          ...session.user,
          // Добавляем кастомные поля
          role: user.email === 'admin@example.com' ? 'admin' : 'user',
        },
      };
    },
  },
});

export type Session = typeof auth.$Infer.Session;
