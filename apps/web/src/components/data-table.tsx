'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import { Button, EmptyState, QueryError, Spinner, cn } from './ui';

type QueryParams = Record<string, string | number | boolean | undefined | null>;

/** O que o `DataTable` precisa de uma consulta paginada. */
export type PagedQuery<T> = Pick<
  UseQueryResult<Paginated<T>>,
  'data' | 'error' | 'isError' | 'isFetching' | 'isLoading' | 'refetch'
>;

/**
 * Lista paginada no servidor. A página volta para 1 sempre que os filtros mudam,
 * e a página anterior continua visível enquanto a próxima carrega.
 */
export function usePagedQuery<T, R extends Paginated<T> = Paginated<T>>(
  key: string,
  path: string,
  params: QueryParams = {},
  pageSize = 20,
): {
  query: UseQueryResult<R>;
  page: number;
  setPage: (page: number) => void;
} {
  const filtersKey = JSON.stringify(params);
  const [state, setState] = useState({ filtersKey, page: 1 });
  const page = state.filtersKey === filtersKey ? state.page : 1;

  const query = useQuery({
    queryKey: [key, params, page, pageSize],
    queryFn: () => apiFetch<R>(`${path}${buildQuery({ ...params, page, pageSize })}`),
    placeholderData: keepPreviousData,
  });

  return { query, page, setPage: (next) => setState({ filtersKey, page: next }) };
}

/**
 * Paginação no cliente para endpoints que devolvem a lista inteira (filiais, papéis,
 * saldos). Mantém o mesmo contrato do `usePagedQuery`.
 */
export function useLocalPaged<T>(
  source: UseQueryResult<T[]>,
  pageSize = 20,
): { query: PagedQuery<T>; page: number; setPage: (page: number) => void } {
  const [requested, setPage] = useState(1);
  const all = source.data;
  const totalPages = all ? Math.max(1, Math.ceil(all.length / pageSize)) : 1;
  const page = Math.min(requested, totalPages);

  const data = useMemo<Paginated<T> | undefined>(
    () =>
      all
        ? {
            items: all.slice((page - 1) * pageSize, page * pageSize),
            total: all.length,
            page,
            pageSize,
            totalPages,
          }
        : undefined,
    [all, page, pageSize, totalPages],
  );

  return {
    query: {
      data,
      error: source.error,
      isError: source.isError,
      isFetching: source.isFetching,
      isLoading: source.isLoading,
      refetch: source.refetch as unknown as PagedQuery<T>['refetch'],
    },
    page,
    setPage,
  };
}

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export interface RowAction {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  hidden?: boolean;
}

export function RowActions({ actions }: { actions: RowAction[] }): JSX.Element | null {
  const visible = actions.filter((action) => !action.hidden);
  if (visible.length === 0) return null;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Ações"
        onClick={(event) => event.stopPropagation()}
        className="rounded-lg p-1.5 text-ink-soft outline-none transition hover:bg-surface-page hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/30"
      >
        <MoreHorizontal size={18} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          onClick={(event) => event.stopPropagation()}
          className="z-50 min-w-[160px] rounded-xl border border-surface-line bg-surface p-1.5 shadow-pop data-[state=open]:animate-fade-in"
        >
          {visible.map((action) => (
            <DropdownMenu.Item
              key={action.label}
              onSelect={action.onSelect}
              className={cn(
                'cursor-pointer rounded-lg px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-surface-page',
                action.danger ? 'text-state-danger' : 'text-ink',
              )}
            >
              {action.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function DataTable<T>({
  query,
  columns,
  rowKey,
  page,
  onPageChange,
  onRowClick,
  rowActions,
  emptyMessage = 'Nenhum registro encontrado.',
  emptyAction,
}: {
  query: PagedQuery<T>;
  columns: Column<T>[];
  rowKey: (row: T) => string;
  page: number;
  onPageChange: (page: number) => void;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => RowAction[];
  emptyMessage?: string;
  emptyAction?: ReactNode;
}): JSX.Element {
  if (query.isLoading) return <Spinner />;
  if (query.isError) return <QueryError error={query.error} onRetry={() => void query.refetch()} />;

  const data = query.data;
  if (!data || data.items.length === 0) {
    return <EmptyState message={emptyMessage} action={emptyAction} />;
  }

  const first = (data.page - 1) * data.pageSize + 1;
  const last = first + data.items.length - 1;

  return (
    <div>
      <div className={cn('overflow-x-auto transition-opacity', query.isFetching && 'opacity-60')}>
        <table className="w-full">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'whitespace-nowrap border-b border-surface-line px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-ink-muted',
                    column.align === 'right' ? 'text-right' : 'text-left',
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
              {rowActions ? <th className="w-10 border-b border-surface-line" /> : null}
            </tr>
          </thead>
          <tbody>
            {data.items.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-surface-line/70 last:border-0',
                  onRowClick && 'cursor-pointer transition hover:bg-surface-soft',
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-3 py-3 text-sm text-ink',
                      column.align === 'right' && 'text-right tabular-nums',
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
                {rowActions ? (
                  <td className="px-2 py-1 text-right">
                    <RowActions actions={rowActions(row)} />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-surface-line pt-3 text-sm text-ink-muted">
        <span>
          {first}–{last} de {data.total}
        </span>
        {data.totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="px-2.5"
              aria-label="Página anterior"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="tabular-nums">
              {data.page} / {data.totalPages}
            </span>
            <Button
              variant="secondary"
              className="px-2.5"
              aria-label="Próxima página"
              disabled={page >= data.totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
