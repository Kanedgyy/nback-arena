import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Инициализация только если переменная окружения есть
// Для Vercel build это ок, т.к. переменные доступны в runtime
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export const db = sql ? drizzle(sql, { schema }) : ({} as ReturnType<typeof drizzle>);

export * from './schema';
