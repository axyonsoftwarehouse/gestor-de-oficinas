'use client';

import { Home, LogOut, Monitor, Plus, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/components/auth-provider';
import { OfflineIndicator } from '@/components/offline/offline-indicator';
import { cn } from '@/components/ui';

const TABS = [
  { href: '/m/hoje', label: 'Hoje', icon: Home },
  { href: '/m/caixa', label: 'Caixa', icon: Wallet },
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}): JSX.Element {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition',
        active ? 'text-brand' : 'text-ink-muted',
      )}
    >
      <Icon size={22} />
      {label}
    </Link>
  );
}

/**
 * Casca do app da oficina: uma coluna, alvos grandes, navegação no rodapé.
 * Pensada para uma mão só — nada de menu lateral nem modal.
 */
export function MobileShell({ children }: { children: ReactNode }): JSX.Element {
  const pathname = usePathname();
  const { session, logout } = useAuth();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-surface-page">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-surface-line bg-surface/95 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">
            {session?.tenant.name ?? 'Oficina'}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-ink-soft">
            Modo {session?.tenant.plan ?? 'essencial'}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard?desktop=1"
            aria-label="Abrir versão completa"
            className="rounded-lg p-2 text-ink-muted transition hover:bg-surface-page hover:text-ink"
          >
            <Monitor size={18} />
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="Sair"
            className="rounded-lg p-2 text-ink-muted transition hover:bg-surface-page hover:text-ink"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <OfflineIndicator />

      <main className="flex-1 px-4 pb-32 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-surface-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="grid grid-cols-3 items-end px-2">
          <TabLink {...TABS[0]} active={isActive(pathname, TABS[0].href)} />
          <Link href="/m/os/nova" className="flex flex-col items-center gap-1 py-2">
            <span className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-pop transition active:scale-95">
              <Plus size={26} />
            </span>
            <span className="text-[11px] font-semibold text-brand">Nova OS</span>
          </Link>
          <TabLink {...TABS[1]} active={isActive(pathname, TABS[1].href)} />
        </div>
      </nav>
    </div>
  );
}
