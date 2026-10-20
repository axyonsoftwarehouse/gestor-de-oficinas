'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Boxes,
  Building2,
  CalendarClock,
  Car,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Hammer,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Package,
  Receipt,
  Shield,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  Wallet,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { canView } from '@/lib/permissions';
import { useAuth } from './auth-provider';
import { ThemeToggle } from './theme-toggle';
import { cn } from './ui';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Feature do catálogo de permissões que dá acesso à tela. */
  feature: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, feature: 'dashboard' }],
  },
  {
    label: 'Operação',
    items: [
      { href: '/appointments', label: 'Agendamentos', icon: CalendarClock, feature: 'appointment' },
      { href: '/job-cards', label: 'Ordens de serviço', icon: Wrench, feature: 'job_card' },
      { href: '/inspections', label: 'Inspeções', icon: ClipboardCheck, feature: 'inspection' },
      { href: '/quotations', label: 'Orçamentos', icon: FileText, feature: 'quotation' },
      { href: '/invoices', label: 'Faturas', icon: Receipt, feature: 'invoice' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { href: '/customers', label: 'Clientes', icon: Users, feature: 'customer' },
      { href: '/vehicles', label: 'Veículos', icon: Car, feature: 'vehicle' },
      { href: '/services', label: 'Serviços', icon: Hammer, feature: 'service' },
      { href: '/parts', label: 'Peças', icon: Package, feature: 'part' },
      { href: '/suppliers', label: 'Fornecedores', icon: Truck, feature: 'supplier' },
    ],
  },
  {
    label: 'Estoque e financeiro',
    items: [
      { href: '/stock', label: 'Estoque', icon: Boxes, feature: 'stock' },
      { href: '/purchases', label: 'Compras', icon: ShoppingCart, feature: 'purchase' },
      { href: '/expenses', label: 'Despesas', icon: Wallet, feature: 'expense' },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { href: '/branches', label: 'Filiais', icon: Building2, feature: 'branch' },
      { href: '/team', label: 'Equipe', icon: UserCog, feature: 'user' },
      { href: '/roles', label: 'Papéis', icon: Shield, feature: 'role' },
      { href: '/inspection-templates', label: 'Checklists', icon: ListChecks, feature: 'inspection' },
    ],
  },
];

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand({ tenant }: { tenant?: string }): JSX.Element {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
        <Wrench size={18} />
      </span>
      <div className="min-w-0 leading-tight">
        <div className="text-sm font-semibold text-ink">Gestor de Oficinas</div>
        <div className="truncate text-xs text-ink-muted">{tenant}</div>
      </div>
    </div>
  );
}

function NavList({
  groups,
  pathname,
}: {
  groups: NavGroup[];
  pathname: string;
}): JSX.Element {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Navegação principal">
      {groups.map((group, index) => (
        <div key={group.label ?? index}>
          {group.label ? (
            <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              {group.label}
            </div>
          ) : null}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                    active
                      ? 'bg-brand-light text-brand-dark'
                      : 'text-ink-muted hover:bg-surface-page hover:text-ink',
                  )}
                >
                  <Icon size={17} className={active ? 'text-brand' : undefined} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }): JSX.Element {
  const pathname = usePathname();
  const { session, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fecha o menu móvel ao navegar.
  useEffect(() => setMobileOpen(false), [pathname]);

  const granted = session?.permissions ?? [];
  const groups = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => canView(granted, item.feature)),
  })).filter((group) => group.items.length > 0);

  const current = groups.flatMap((group) => group.items).find((item) => isActive(pathname, item.href));

  return (
    <div className="flex min-h-screen bg-surface-page">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-surface-line bg-surface lg:flex">
        <Brand tenant={session?.tenant.name} />
        <NavList groups={groups} pathname={pathname} />
      </aside>

      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ink-strong/40 backdrop-blur-sm data-[state=open]:animate-fade-in lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-surface shadow-pop outline-none data-[state=open]:animate-slide-in-left lg:hidden">
            <Dialog.Title className="sr-only">Menu</Dialog.Title>
            <Dialog.Description className="sr-only">Navegação principal</Dialog.Description>
            <div className="flex items-center justify-between pr-3">
              <Brand tenant={session?.tenant.name} />
              <Dialog.Close
                aria-label="Fechar menu"
                className="rounded-md p-1.5 text-ink-soft hover:bg-surface-page hover:text-ink"
              >
                <X size={18} />
              </Dialog.Close>
            </div>
            <NavList groups={groups} pathname={pathname} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-surface-line bg-surface/90 px-4 py-2.5 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
              className="-ml-1 rounded-lg p-2 text-ink-muted hover:bg-surface-page hover:text-ink lg:hidden"
            >
              <Menu size={20} />
            </button>
            <span className="truncate text-sm font-medium text-ink lg:hidden">
              {current?.label ?? 'Gestor de Oficinas'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 outline-none transition hover:bg-surface-page focus-visible:ring-2 focus-visible:ring-brand/30">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-xs font-semibold text-brand-dark">
                  {initials(session?.user.name ?? '')}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-sm font-medium text-ink">{session?.user.name}</span>
                  <span className="block text-xs text-ink-muted">{session?.tenant.name}</span>
                </span>
                <ChevronDown size={16} className="text-ink-soft" />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={6}
                  className="z-50 min-w-[220px] rounded-xl border border-surface-line bg-surface p-1.5 shadow-pop data-[state=open]:animate-fade-in"
                >
                  <div className="px-2.5 py-2">
                    <div className="text-sm font-medium text-ink">{session?.user.name}</div>
                    <div className="truncate text-xs text-ink-muted">{session?.user.email}</div>
                  </div>
                  <DropdownMenu.Separator className="my-1 h-px bg-surface-line" />
                  <DropdownMenu.Item
                    onSelect={() => void logout()}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink outline-none data-[highlighted]:bg-surface-page"
                  >
                    <LogOut size={16} className="text-ink-muted" />
                    Sair
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
