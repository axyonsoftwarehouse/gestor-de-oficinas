'use client';

import {
  Bell,
  Boxes,
  Building2,
  CalendarClock,
  Car,
  ChevronDown,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Package,
  Receipt,
  Search,
  Shield,
  ShoppingCart,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from './auth-provider';
import { cn } from './ui';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/vehicles', label: 'Veículos', icon: Car },
  { href: '/branches', label: 'Filiais', icon: Building2 },
  { href: '/team', label: 'Equipe', icon: UserCog },
  { href: '/roles', label: 'Papéis', icon: Shield },
  { href: '/appointments', label: 'Agendamentos', icon: CalendarClock },
  { href: '/inspections', label: 'Inspeções', icon: ClipboardCheck },
  { href: '/inspection-templates', label: 'Checklists', icon: ListChecks },
  { href: '/quotations', label: 'Orçamentos', icon: FileText },
  { href: '/job-cards', label: 'Ordens de serviço', icon: Wrench },
  { href: '/invoices', label: 'Faturas', icon: Receipt },
  { href: '/parts', label: 'Peças', icon: Package },
  { href: '/stock', label: 'Estoque', icon: Boxes },
  { href: '/purchases', label: 'Compras', icon: ShoppingCart },
];

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function AppShell({ children }: { children: ReactNode }): JSX.Element {
  const pathname = usePathname();
  const { session, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-surface-page">
      <aside className="hidden w-64 flex-col border-r border-surface-line bg-white md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
            <Wrench size={18} />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-ink">Gestor de Oficinas</div>
            <div className="text-xs text-ink-muted">{session?.tenant.name}</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-ink-muted hover:bg-surface-page hover:text-ink',
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-surface-line p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-surface-page hover:text-ink"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-surface-line bg-white px-6 py-3">
          <div className="relative w-full max-w-sm">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
            />
            <input
              placeholder="Buscar…"
              className="w-full rounded-lg border border-surface-line bg-surface-page py-2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-soft focus:border-brand"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative text-ink-muted transition hover:text-ink">
              <Bell size={18} />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-state-danger" />
            </button>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-xs font-semibold text-brand-dark">
                {initials(session?.user.name ?? '')}
              </span>
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-medium text-ink">{session?.user.name}</div>
                <div className="text-xs text-ink-muted">{session?.user.email}</div>
              </div>
              <ChevronDown size={16} className="text-ink-soft" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
