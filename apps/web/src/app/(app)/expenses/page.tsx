'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatDate, formatMoney, toInputDate } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import { useBranches } from '@/lib/queries';
import type { Expense, ExpenseList } from '@/lib/types';
import { useDebounced } from '@/lib/use-debounced';
import { useAuth } from '@/components/auth-provider';
import { useConfirm } from '@/components/confirm';
import { DataTable, usePagedQuery, type Column } from '@/components/data-table';
import {
  Button,
  Card,
  ErrorText,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui';

interface ExpenseForm {
  branchId: string;
  category: string;
  description: string;
  amount: string;
  expenseDate: string;
}

function emptyForm(branchId: string): ExpenseForm {
  return {
    branchId,
    category: '',
    description: '',
    amount: '',
    expenseDate: toInputDate(new Date()),
  };
}

export default function ExpensesPage(): JSX.Element {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const { data: branches } = useBranches();

  const [filterBranch, setFilterBranch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const debouncedCategory = useDebounced(filterCategory);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm(''));
  const [error, setError] = useState('');

  const { query, page, setPage } = usePagedQuery<Expense, ExpenseList>('expenses', '/expenses', {
    branchId: filterBranch,
    category: debouncedCategory,
    from,
    to,
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = JSON.stringify({
        branchId: form.branchId,
        category: form.category,
        description: form.description || undefined,
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
      });
      if (editing) {
        await apiFetch(`/expenses/${editing.id}`, { method: 'PATCH', body });
      } else {
        await apiFetch('/expenses', { method: 'POST', body });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      setOpen(false);
      toast.success(editing ? 'Despesa atualizada' : 'Despesa lançada');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/expenses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Despesa excluída');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao excluir'),
  });

  function openCreate(): void {
    setEditing(null);
    setForm(emptyForm(branches?.[0]?.id ?? ''));
    setError('');
    setOpen(true);
  }

  function openEdit(expense: Expense): void {
    setEditing(expense);
    setForm({
      branchId: expense.branchId,
      category: expense.category,
      description: expense.description ?? '',
      amount: String(expense.amount),
      expenseDate: toInputDate(expense.expenseDate),
    });
    setError('');
    setOpen(true);
  }

  async function confirmRemove(expense: Expense): Promise<void> {
    const ok = await confirm({
      title: 'Excluir despesa',
      description: `A despesa "${expense.category}" de ${formatMoney(expense.amount)} será excluída.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    });
    if (ok) remove.mutate(expense.id);
  }

  function set<K extends keyof ExpenseForm>(key: K, value: ExpenseForm[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const branchName = (id: string): string =>
    branches?.find((branch) => branch.id === id)?.name ?? '-';

  const columns: Column<Expense>[] = [
    {
      key: 'date',
      header: 'Data',
      cell: (expense) => <span className="whitespace-nowrap">{formatDate(expense.expenseDate)}</span>,
    },
    {
      key: 'category',
      header: 'Categoria',
      cell: (expense) => (
        <div>
          <div className="font-medium">{expense.category}</div>
          {expense.description ? (
            <div className="text-xs text-ink-muted">{expense.description}</div>
          ) : null}
        </div>
      ),
    },
    { key: 'branch', header: 'Filial', cell: (expense) => branchName(expense.branchId) },
    { key: 'job', header: 'OS', cell: (expense) => expense.jobCard?.number ?? '-' },
    {
      key: 'amount',
      header: 'Valor',
      align: 'right',
      cell: (expense) => formatMoney(expense.amount),
    },
  ];

  const canCreate = hasPermission(granted, 'expense.create');
  const canEdit = hasPermission(granted, 'expense.edit');
  const canDelete = hasPermission(granted, 'expense.delete');
  const canSave = Boolean(form.branchId && form.category && form.amount) && !save.isPending;
  const filtered = Boolean(filterBranch || debouncedCategory || from || to);

  return (
    <div>
      <PageHeader
        title="Despesas"
        subtitle="Lançamento e controle de despesas da oficina"
        actions={canCreate ? <Button onClick={openCreate}>Nova despesa</Button> : null}
      />

      <Card className="p-4">
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Filial">
            <Select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
              <option value="">Todas</option>
              {branches?.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Categoria">
            <Input
              type="search"
              placeholder="Ex.: Aluguel"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            />
          </Field>
          <Field label="De">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Até">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>

        {query.data ? (
          <div className="mb-3 text-sm text-ink-muted">
            Total filtrado: <strong className="text-ink">{formatMoney(query.data.sum)}</strong>
          </div>
        ) : null}

        <DataTable
          query={query}
          columns={columns}
          rowKey={(expense) => expense.id}
          page={page}
          onPageChange={setPage}
          onRowClick={canEdit ? openEdit : undefined}
          rowActions={(expense) => [
            { label: 'Editar', onSelect: () => openEdit(expense), hidden: !canEdit },
            {
              label: 'Excluir',
              onSelect: () => void confirmRemove(expense),
              danger: true,
              hidden: !canDelete,
            },
          ]}
          emptyMessage={
            filtered ? 'Nenhuma despesa para esses filtros.' : 'Nenhuma despesa lançada ainda.'
          }
          emptyAction={
            !filtered && canCreate ? (
              <Button onClick={openCreate}>Lançar a primeira despesa</Button>
            ) : undefined
          }
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar despesa' : 'Nova despesa'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="expense-form" disabled={!canSave}>
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form
          id="expense-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) save.mutate();
          }}
        >
          <ErrorText>{error}</ErrorText>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Filial">
              <Select
                required
                value={form.branchId}
                onChange={(e) => set('branchId', e.target.value)}
              >
                <option value="">Selecione…</option>
                {branches?.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Categoria">
              <Input
                required
                placeholder="Ex.: Aluguel, Água, Peças…"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              />
            </Field>
            <Field label="Valor">
              <Input
                required
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
              />
            </Field>
            <Field label="Data">
              <Input
                type="date"
                value={form.expenseDate}
                onChange={(e) => set('expenseDate', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Descrição">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
