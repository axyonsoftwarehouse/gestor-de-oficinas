'use client';

import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

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
      'border border-surface-line bg-white text-ink hover:bg-surface-soft',
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
        'w-full rounded-lg border border-surface-line bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-surface-page disabled:text-ink-muted',
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
        'w-full rounded-lg border border-surface-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20',
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
        'w-full rounded-lg border border-surface-line bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/20',
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
        'rounded-xl border border-surface-line bg-white shadow-card',
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
  tone?: 'slate' | 'green' | 'amber' | 'red' | 'blue';
}): JSX.Element {
  const tones = {
    slate: 'bg-surface-page text-ink-muted',
    green: 'bg-[#ECFCE4] text-[#3E8E1F]',
    amber: 'bg-[#FFF5E0] text-[#B78103]',
    red: 'bg-[#FFECEC] text-[#D64545]',
    blue: 'bg-brand-light text-brand-dark',
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
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}): JSX.Element | null {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm">
      <div className="mt-16 w-full max-w-lg rounded-xl bg-white shadow-pop">
        <div className="flex items-center justify-between border-b border-surface-line px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="text-ink-soft transition hover:text-ink"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-surface-line px-5 py-3.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }): JSX.Element | null {
  if (!children) return null;
  return <p className="text-sm text-state-danger">{children}</p>;
}

export function EmptyState({ message }: { message: string }): JSX.Element {
  return (
    <div className="rounded-xl border border-dashed border-surface-line bg-surface-soft p-8 text-center text-sm text-ink-muted">
      {message}
    </div>
  );
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
