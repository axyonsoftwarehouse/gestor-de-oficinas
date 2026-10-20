'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch, buildQuery } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { QUOTATION_STATUS, enumOptions } from '@/lib/labels';
import { hasPermission } from '@/lib/permissions';
import { useBranches, useCustomers } from '@/lib/queries';
import type { JobCard, Paginated, Quotation } from '@/lib/types';
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
  StatusBadge,
} from '@/components/ui';

interface QuotationForm {
  branchId: string;
  customerId: string;
  jobCardId: string;
  validUntil: string;
  notes: string;
  copyFromJobCard: boolean;
}

const COLUMNS: Column<Quotation>[] = [
  {
    key: 'number',
    header: 'Número',
    cell: (quotation) => <span className="font-medium">{quotation.number}</span>,
  },
  { key: 'customer', header: 'Cliente', cell: (quotation) => quotation.customer?.name ?? '-' },
  { key: 'job', header: 'OS', cell: (quotation) => quotation.jobCard?.number ?? '-' },
  {
    key: 'status',
    header: 'Status',
    cell: (quotation) => <StatusBadge map={QUOTATION_STATUS} value={quotation.status} />,
  },
  {
    key: 'total',
    header: 'Total',
    align: 'right',
    cell: (quotation) => formatMoney(quotation.total),
  },
];

export default function QuotationsPage(): JSX.Element {
  const qc = useQueryClient();
  const router = useRouter();
  const confirm = useConfirm();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const branches = useBranches();
  const customers = useCustomers();
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<QuotationForm>({
    branchId: '',
    customerId: '',
    jobCardId: '',
    validUntil: '',
    notes: '',
    copyFromJobCard: false,
  });

  const { query, page, setPage } = usePagedQuery<Quotation>('quotations', '/quotations', {
    status,
  });

  const jobCards = useQuery({
    queryKey: ['job-cards', 'options'],
    queryFn: () => apiFetch<Paginated<JobCard>>(`/job-cards${buildQuery({ pageSize: 100 })}`),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch<Quotation>('/quotations', {
        method: 'POST',
        body: JSON.stringify({
          branchId: form.branchId,
          customerId: form.customerId,
          jobCardId: form.jobCardId || undefined,
          validUntil: form.validUntil || undefined,
          notes: form.notes || undefined,
          copyFromJobCard: form.copyFromJobCard,
        }),
      }),
    onSuccess: (quotation) => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      setOpen(false);
      toast.success(`Orçamento ${quotation.number} criado`);
      router.push(`/quotations/${quotation.id}`);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/quotations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Orçamento excluído');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao excluir'),
  });

  function openCreate(): void {
    setError('');
    setForm({
      branchId: branches.data?.[0]?.id ?? '',
      customerId: '',
      jobCardId: '',
      validUntil: '',
      notes: '',
      copyFromJobCard: false,
    });
    setOpen(true);
  }

  async function confirmRemove(quotation: Quotation): Promise<void> {
    const ok = await confirm({
      title: 'Excluir orçamento',
      description: `O orçamento ${quotation.number} (rascunho) será excluído definitivamente.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    });
    if (ok) remove.mutate(quotation.id);
  }

  function set<K extends keyof QuotationForm>(key: K, value: QuotationForm[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canCreate = hasPermission(granted, 'quotation.create');
  const canDelete = hasPermission(granted, 'quotation.delete');
  const canSave = Boolean(form.branchId && form.customerId) && !create.isPending;
  const openDetail = (quotation: Quotation) => router.push(`/quotations/${quotation.id}`);

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        subtitle="Propostas comerciais"
        actions={canCreate ? <Button onClick={openCreate}>Novo orçamento</Button> : null}
      />

      <Card className="p-4">
        <div className="mb-3 w-full sm:max-w-xs">
          <Select
            aria-label="Filtrar por status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            {enumOptions(QUOTATION_STATUS).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <DataTable
          query={query}
          columns={COLUMNS}
          rowKey={(quotation) => quotation.id}
          page={page}
          onPageChange={setPage}
          onRowClick={openDetail}
          rowActions={(quotation) => [
            { label: 'Abrir', onSelect: () => openDetail(quotation) },
            {
              label: 'Excluir',
              onSelect: () => void confirmRemove(quotation),
              danger: true,
              hidden: !canDelete || quotation.status !== 'DRAFT',
            },
          ]}
          emptyMessage={status ? 'Nenhum orçamento com esse status.' : 'Nenhum orçamento ainda.'}
          emptyAction={
            !status && canCreate ? (
              <Button onClick={openCreate}>Criar o primeiro orçamento</Button>
            ) : undefined
          }
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Novo orçamento"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="quotation-form" disabled={!canSave}>
              {create.isPending ? 'Salvando…' : 'Criar orçamento'}
            </Button>
          </>
        }
      >
        <form
          id="quotation-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) create.mutate();
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
                {branches.data?.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Cliente">
              <Select
                required
                value={form.customerId}
                onChange={(e) => set('customerId', e.target.value)}
              >
                <option value="">Selecione…</option>
                {customers.data?.items.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="OS (opcional)">
              <Select
                value={form.jobCardId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    jobCardId: e.target.value,
                    copyFromJobCard: e.target.value ? prev.copyFromJobCard : false,
                  }))
                }
              >
                <option value="">Sem OS</option>
                {jobCards.data?.items.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.number}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Válido até">
              <Input
                type="date"
                value={form.validUntil}
                onChange={(e) => set('validUntil', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Observações">
            <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.copyFromJobCard}
              disabled={!form.jobCardId}
              onChange={(e) => set('copyFromJobCard', e.target.checked)}
            />
            Copiar itens da OS selecionada
          </label>
        </form>
      </Modal>
    </div>
  );
}
