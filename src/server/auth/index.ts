import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '~/server/db';
import { pgTable, uuid, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core';

const databaseUrl = process.env.DATABASE_URL;
const authUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
const secret = process.env.BETTER_AUTH_SECRET;

if (!databaseUrl) {
  console.error('DATABASE_URL is not set');
}

if (!secret) {
  console.error('BETTER_AUTH_SECRET is not set');
}

// Схема для better-auth (должна соответствовать таблицам в БД)
const betterAuthSchema = {
  user: pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: boolean('email_verified').default(false),
    name: varchar('name', { length: 255 }),
    image: varchar('image', { length: 255 }),
    password: varchar('password', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }),
  session: pgTable('sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    token: varchar('token', { length: 255 }).notNull().unique(),
    ipAddress: varchar('ip_address', { length: 255 }),
    userAgent: varchar('user_agent', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }),
  account: pgTable('accounts', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    accountId: varchar('account_id', { length: 255 }).notNull(),
    providerId: varchar('provider_id', { length: 255 }).notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    idToken: text('id_token'),
    password: varchar('password', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }),
  verification: pgTable('verifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    identifier: varchar('identifier', { length: 255 }).notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }),
};

export const auth = betterAuth({
  // Используем drizzle adapter для интеграции с нашей БД
  database: drizzleAdapter(db, {
    provider: 'pg' as const,
    schema: betterAuthSchema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 дней
    updateAge: 60 * 60 * 24, // Обновляем сессию каждый день
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  baseURL: authUrl,
  secret: secret,
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
