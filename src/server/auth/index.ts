import { betterAuth } from 'better-auth';

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
  database: {
    provider: 'postgresql',
    url: databaseUrl!,
  },
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  baseURL: authUrl,
  secret: secret,
});

export type Session = typeof auth.$Infer.Session;
