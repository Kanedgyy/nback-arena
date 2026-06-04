'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, httpSubscriptionLink, splitLink, loggerLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from '@/trpc';

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return '';
  }
  return `http://localhost:${process.env.PORT || 3000}`;
}

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink(),
        splitLink({
          // Используем httpSubscriptionLink для subscriptions (SSE)
          condition: (op) => op.type === 'subscription',
          true: httpSubscriptionLink({
            url: `${getBaseUrl()}/api/trpc`,
          }),
          false: httpBatchLink({
            url: `${getBaseUrl()}/api/trpc`,
          }),
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

