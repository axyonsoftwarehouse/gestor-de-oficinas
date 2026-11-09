'use client';

import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import { CloudOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/components/ui';

/**
 * Faixa de estado de rede. Só aparece quando está offline ou há operação
 * pendente — o React Query retoma as mutações pausadas quando a conexão volta.
 */
export function OfflineIndicator({ className }: { className?: string }): JSX.Element | null {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const pending = useIsMutating();
  const queryClient = useQueryClient();

  useEffect(() => {
    const update = (): void => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (online && pending === 0) return null;

  async function retry(): Promise<void> {
    setSyncing(true);
    try {
      await queryClient.resumePausedMutations();
      await queryClient.invalidateQueries();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div
      role="status"
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-2 text-xs font-medium',
        online ? 'bg-brand-soft text-brand-dark' : 'bg-state-warning/20 text-ink',
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {online ? (
          <RefreshCw size={14} className={syncing ? 'animate-spin' : undefined} />
        ) : (
          <CloudOff size={14} className="shrink-0" />
        )}
        <span className="truncate">
          {online
            ? `Enviando ${pending} ${pending === 1 ? 'operação' : 'operações'}…`
            : 'Sem conexão · mostrando dados salvos'}
        </span>
      </span>
      {online ? (
        <button
          type="button"
          onClick={() => void retry()}
          disabled={syncing}
          className="shrink-0 underline-offset-2 hover:underline disabled:opacity-50"
        >
          Tentar agora
        </button>
      ) : (
        <span className="shrink-0 text-[11px] text-ink-muted">volta sozinho</span>
      )}
    </div>
  );
}
