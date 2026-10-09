'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import type { JobCard, Paginated, Quotation } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { useBranches, useCustomers } from '@/lib/queries';
import {
  Badge,
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
} from '@/components/ui';

interface QuotationForm {
  branchId: string;
  customerId: string;
  jobCardId: string;
  validUntil: string;
  notes: string;
  copyFromJobCard: boolean;
}

export default function QuotationsPage(): JSX.Element {
  const qc = useQueryClient();
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

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', status],
    queryFn: () =>
      apiFetch<Paginated<Quotation>>(`/quotations${buildQuery({ status, pageSize: 50 })}`),
  });

  const jobCards = useQuery({
    queryKey: ['job-cards', 'options'],
    queryFn: () =>
      apiFetch<Paginated<JobCard>>(`/job-cards${buildQuery({ pageSize: 100 })}`),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: async () => {
      await apiFetch('/quotations', {
        method: 'POST',
        body: JSON.stringify({
          branchId: form.branchId,
          customerId: form.customerId,
          jobCardId: form.jobCardId || undefined,
          validUntil: form.validUntil || undefined,
          notes: form.notes || undefined,
          copyFromJobCard: form.copyFromJobCard,
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      setOpen(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
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

  function set<K extends keyof QuotationForm>(key: K, value: QuotationForm[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        subtitle="Propostas comerciais"
        actions={<Button onClick={openCreate}>Novo orçamento</Button>}
      />

      <Card className="p-4">
        <div className="mb-3 max-w-xs">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="DRAFT">Rascunho</option>
            <option value="SENT">Enviado</option>
            <option value="APPROVED">Aprovado</option>
            <option value="REJECTED">Rejeitado</option>
            <option value="CONVERTED">Faturado</option>
          </Select>
        </div>

        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState message="Nenhum orçamento encontrado." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <Th>Número</Th>
                <Th>Cliente</Th>
                <Th>OS</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((quotation) => (
                <tr key={quotation.id} className="border-b border-slate-100">
                  <Td>{quotation.number}</Td>
                  <Td>{quotation.customer?.name ?? '-'}</Td>
                  <Td>{quotation.jobCard?.number ?? '-'}</Td>
                  <Td><Badge>{quotation.status}</Badge></Td>
                  <Td className="text-right">{formatMoney(quotation.total)}</Td>
                  <Td className="text-right">
                    <Link href={`/quotations/${quotation.id}`} className="text-sm underline">
                      Abrir
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !form.branchId || !form.customerId}
            >
              {create.isPending ? 'Salvando…' : 'Criar orçamento'}
            </Button>
          </>
        }
      >
        <ErrorText>{error}</ErrorText>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Filial">
            <Select value={form.branchId} onChange={(e) => set('branchId', e.target.value)}>
              <option value="">Selecione…</option>
              {branches.data?.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Cliente">
            <Select value={form.customerId} onChange={(e) => set('customerId', e.target.value)}>
              <option value="">Selecione…</option>
              {customers.data?.items.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="OS (opcional)">
            <Select value={form.jobCardId} onChange={(e) => set('jobCardId', e.target.value)}>
              <option value="">Sem OS</option>
              {jobCards.data?.items.map((job) => (
                <option key={job.id} value={job.id}>{job.number}</option>
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
          <div className="col-span-2">
            <Field label="Observações">
              <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </Field>
          </div>
          <label className="col-span-2 flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={form.copyFromJobCard}
              disabled={!form.jobCardId}
              onChange={(e) => set('copyFromJobCard', e.target.checked)}
            />
            Copiar itens da OS selecionada
          </label>
        </div>
      </Modal>
    </div>
  );
}
