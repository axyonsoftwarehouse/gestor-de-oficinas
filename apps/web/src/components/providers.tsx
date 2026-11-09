'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from './auth-provider';
import { ConfirmProvider } from './confirm';
import { ServiceWorkerRegistrar } from './offline/service-worker-registrar';

const CACHE_KEY = 'gestor.query-cache';
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24; // 24h

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export function Providers({ children }: { children: ReactNode }): JSX.Element {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
        },
      }),
  );

  // O persister grava as queries bem-sucedidas no localStorage; offline, o app
  // abre com os últimos dados. Mutações pausadas vivem em memória (ver docs).
  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window === 'undefined' ? noopStorage : window.localStorage,
      key: CACHE_KEY,
      throttleTime: 1000,
    }),
  );

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: CACHE_MAX_AGE,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.state.status === 'success',
        },
      }}
    >
      <AuthProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </AuthProvider>
      <ServiceWorkerRegistrar />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ className: 'font-sans' }}
      />
    </PersistQueryClientProvider>
  );
}
