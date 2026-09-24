'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminAuthProvider } from './AdminAuthProvider';
import { ToastProvider } from './ToastProvider';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 5_000, refetchOnWindowFocus: false, retry: 1 } } }));
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}
