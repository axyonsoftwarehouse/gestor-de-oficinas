'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import { formatDate, formatMoney, toInputDate } from '@/lib/format';
import { useBranches } from '@/lib/queries';
import type { Expense, ExpenseList } from '@/lib/types';
import {
  Button,
  Card,
  EmptyState,
  ErrorText,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  Td,
  Th,
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
  const { data: branches } = useBranches();

  const [filterBranch, setFilterBranch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm(''));
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', filterBranch, filterCategory, from, to],
    queryFn: () =>
      apiFetch<ExpenseList>(
        `/expenses${buildQuery({
          branchId: filterBranch,
          category: filterCategory,
          from,
          to,
        })}`,
      ),
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
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/expenses/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
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

  function set<K extends keyof ExpenseForm>(key: K, value: ExpenseForm[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const branchName = (id: string): string =>
    branches?.find((branch) => branch.id === id)?.name ?? '-';

  const canSave = Boolean(form.branchId && form.category && form.amount);

  return (
    <div>
      <PageHeader
        title="Despesas"
        subtitle="Lançamento e controle de despesas da oficina"
        actions={<Button onClick={openCreate}>Nova despesa</Button>}
      />

      <Card className="p-4">
        <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
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

        <div className="mb-3 text-sm text-ink-muted">
          Total filtrado: <strong className="text-ink">{formatMoney(data?.sum ?? 0)}</strong>
        </div>

        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState message="Nenhuma despesa encontrada." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <Th>Data</Th>
                  <Th>Categoria</Th>
                  <Th>Descrição</Th>
                  <Th>Filial</Th>
                  <Th>OS</Th>
                  <Th>Valor</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((expense) => (
                  <tr key={expense.id} className="border-b border-slate-100">
                    <Td>{formatDate(expense.expenseDate)}</Td>
                    <Td>{expense.category}</Td>
                    <Td>{expense.description ?? '-'}</Td>
                    <Td>{branchName(expense.branchId)}</Td>
                    <Td>{expense.jobCard?.number ?? '-'}</Td>
                    <Td>{formatMoney(expense.amount)}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => openEdit(expense)}>
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (window.confirm('Excluir esta despesa?')) {
                              remove.mutate(expense.id);
                            }
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
            <Button onClick={() => save.mutate()} disabled={save.isPending || !canSave}>
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <ErrorText>{error}</ErrorText>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Filial">
            <Select value={form.branchId} onChange={(e) => set('branchId', e.target.value)}>
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
              placeholder="Ex.: Aluguel, Água, Peças…"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            />
          </Field>
          <Field label="Valor">
            <Input
              type="number"
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
          <div className="col-span-2">
            <Field label="Descrição">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
