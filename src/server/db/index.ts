import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// fetchConnectionCache теперь всегда true по умолчанию (не нужно настраивать)

type DbClient = NeonHttpDatabase<typeof schema>;

let _db: DbClient | null = null;

function isRetryableError(error: any): boolean {
  if (!error) return false;
  const msg = String(error.message || error);
  return (
    msg.includes('Control plane request failed') ||
    msg.includes('neon:retryable') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('500') ||
    (error.cause && isRetryableError(error.cause))
  );
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 4,
  delay = 500
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      console.warn(`[DB retry] waiting ${delay}ms, ${retries} attempts left. Error: ${(error as any)?.message || error}`);
      await new Promise((r) => setTimeout(r, delay));
      return withRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

export function getDb(): DbClient {
  if (!_db) {
    const databaseUrl = process.env.DATABASE_URL;
    console.log('Initializing DB, DATABASE_URL exists:', !!databaseUrl);
    
    if (!databaseUrl) {
      console.error('DATABASE_URL is NOT set!');
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const sql = neon(databaseUrl);

    // Оборачиваем sql в retry-прокси
    const sqlWithRetry = new Proxy(sql, {
      apply(target, thisArg, args) {
        return withRetry(() => Reflect.apply(target, thisArg, args));
      },
    });

    _db = drizzle(sqlWithRetry as any, { schema });
    console.log('DB initialized successfully');
  }
  return _db;
}

export const db = new Proxy({} as DbClient, {
  get(target, prop) {
    const actualDb = getDb();
    return (actualDb as any)[prop];
  },
});

export { sql } from 'drizzle-orm';
export * from './schema';

