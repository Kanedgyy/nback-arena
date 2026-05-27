import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type DbClient = NeonHttpDatabase<typeof schema>;

let _db: DbClient | null = null;

export function getDb(): DbClient {
  if (!_db) {
    const databaseUrl = process.env.DATABASE_URL;
    console.log('Initializing DB, DATABASE_URL exists:', !!databaseUrl);
    
    if (!databaseUrl) {
      console.error('DATABASE_URL is NOT set!');
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(databaseUrl);
    _db = drizzle(sql, { schema });
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
