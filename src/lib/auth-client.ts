'use client';

import { createAuthClient } from 'better-auth/react';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
               (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

console.log('Auth client baseURL:', appUrl);

export const authClient = createAuthClient({
  baseURL: appUrl,
  fetchOptions: {
    credentials: 'include',
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;