import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

// Тип базы данных
export type DbClient = ReturnType<typeof drizzle<typeof schema>>;

// Создаём клиент с явной типизацией
function createDbClient(): DbClient {
  if (!process.env.DATABASE_URL) {
    // Во время build переменная может отсутствовать - создаём заглушку
    // Но в runtime она всегда должна быть
    return {} as DbClient;
  }
  const neonSql = neon(process.env.DATABASE_URL);
  return drizzle(neonSql, { schema });
}

export const db = createDbClient();
export { sql };

export * from './schema';
