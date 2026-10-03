'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from './auth-provider';
import { cn } from './ui';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/customers', label: 'Clientes' },
  { href: '/vehicles', label: 'Veículos' },
  { href: '/appointments', label: 'Agendamentos' },
  { href: '/quotations', label: 'Orçamentos' },
  { href: '/job-cards', label: 'Ordens de serviço' },
  { href: '/invoices', label: 'Faturas' },
  { href: '/parts', label: 'Peças' },
  { href: '/stock', label: 'Estoque' },
  { href: '/purchases', label: 'Compras' },
];

export function AppShell({ children }: { children: ReactNode }): JSX.Element {
  const pathname = usePathname();
  const { session, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="px-5 py-4 text-base font-semibold text-slate-900">
          Gestor de Oficinas
        </div>
        <nav className="flex-1 space-y-1 px-3 pb-4">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm transition',
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-sm text-slate-500">{session?.tenant.name}</div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-700">{session?.user.name}</span>
            <button
              onClick={logout}
              className="rounded-md border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-50"
            >
              Sair
            </button>
          </div>
        </header>
        <main className="flex-1 bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}
