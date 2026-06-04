'use client';

import { useEffect } from 'react';
import { createAuthClient } from 'better-auth/react';
import { trpc } from '~/trpc';

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000',
});

export function useAuth() {
  const { data: session, isPending } = authClient.useSession();
  const utils = trpc.useUtils();

  // Автоматически рефрашим tRPC при изменении сессии
  useEffect(() => {
    if (session) {
      utils.invalidate();
    }
  }, [session, utils]);

  return {
    user: session?.user ?? null,
    isLoading: isPending,
    isAuthenticated: !!session,
  };
}
