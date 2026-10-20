'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';
import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { enumLabel, enumTone, type Tone } from '@/lib/labels';

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }): JSX.Element {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-brand text-white shadow-sm hover:bg-brand-dark',
    secondary:
      'border border-surface-line bg-surface text-ink hover:bg-surface-soft',
    danger: 'bg-state-danger text-white shadow-sm hover:brightness-95',
    ghost: 'text-ink-muted hover:bg-surface-soft hover:text-ink',
  };
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-lg border border-surface-line bg-surface px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-surface-page disabled:text-ink-muted',
        props.className,
      )}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>): JSX.Element {
  return (
    <select
      {...props}
      className={cn(
        'w-full rounded-lg border border-surface-line bg-surface px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20',
        props.className,
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>): JSX.Element {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full rounded-lg border border-surface-line bg-surface px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/20',
        props.className,
      )}
    />
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}): JSX.Element {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-ink-soft">{hint}</span> : null}
    </label>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div
      className={cn(
        'rounded-xl border border-surface-line bg-surface shadow-card',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: Tone;
}): JSX.Element {
  const tones = {
    slate: 'bg-surface-page text-ink-muted',
    green: 'bg-state-success/15 text-state-success',
    amber: 'bg-state-warning/20 text-state-warning',
    red: 'bg-state-danger/15 text-state-danger',
    blue: 'bg-brand/15 text-brand-dark',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}): JSX.Element {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}): JSX.Element {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' } as const;
  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-strong/40 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-[8vh] z-50 flex max-h-[84vh] w-[calc(100%-2rem)] -translate-x-1/2 flex-col rounded-xl bg-surface shadow-pop outline-none data-[state=open]:animate-pop-in',
            widths[size],
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-surface-line px-5 py-3.5">
            <div>
              <Dialog.Title className="text-sm font-semibold text-ink">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-xs text-ink-muted">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="-mr-1 rounded-md p-1 text-ink-soft transition hover:bg-surface-page hover:text-ink"
              aria-label="Fechar"
            >
              <X size={16} />
            </Dialog.Close>
          </div>
          <div className="space-y-4 overflow-y-auto px-5 py-4">{children}</div>
          {footer ? (
            <div className="flex justify-end gap-2 border-t border-surface-line px-5 py-3.5">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ErrorText({ children }: { children: ReactNode }): JSX.Element | null {
  if (!children) return null;
  return <p className="text-sm text-state-danger">{children}</p>;
}

export function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-surface-line bg-surface-soft p-8 text-center text-sm text-ink-muted">
      {message}
      {action}
    </div>
  );
}

/** Estado de erro de uma consulta: nunca exibir lista vazia quando a API falhou. */
export function QueryError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}): JSX.Element {
  const message = error instanceof Error ? error.message : 'Erro ao carregar os dados.';
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-state-danger/30 bg-state-danger/5 p-8 text-center text-sm"
    >
      <AlertTriangle size={20} className="text-state-danger" />
      <div>
        <div className="font-medium text-ink">Não foi possível carregar os dados</div>
        <div className="mt-1 text-ink-muted">{message}</div>
      </div>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}

/** Badge com rótulo PT-BR e tom vindos de `lib/labels`. */
export function StatusBadge({
  map,
  value,
}: {
  map: Parameters<typeof enumLabel>[0];
  value: string | null | undefined;
}): JSX.Element {
  return <Badge tone={enumTone(map, value)}>{enumLabel(map, value)}</Badge>;
}

export function Spinner(): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-2 p-8 text-sm text-ink-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-surface-line border-t-brand" />
      Carregando…
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <th
      className={cn(
        'bg-surface-page px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-muted first:rounded-l-lg last:rounded-r-lg',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}): JSX.Element {
  return <td className={cn('px-3 py-2.5 text-sm text-ink', className)}>{children}</td>;
}
