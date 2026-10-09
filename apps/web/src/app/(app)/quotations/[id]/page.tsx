'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useServices } from '@/lib/queries';
import type { Invoice, Quotation } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorText,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
  Td,
  Th,
} from '@/components/ui';

export default function QuotationDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [line, setLine] = useState({
    type: 'LABOR',
    serviceId: '',
    description: '',
    quantity: '1',
    unitPrice: '',
  });
  const services = useServices();

  function applyService(value: string): void {
    if (!value) {
      setLine((p) => ({ ...p, serviceId: '' }));
      return;
    }
    const service = services.data?.items.find((item) => item.id === value);
    setLine((p) => ({
      ...p,
      serviceId: value,
      type: service ? 'SERVICE' : p.type,
      description: service?.name ?? p.description,
      unitPrice: service ? String(service.basePrice) : p.unitPrice,
    }));
  }

  const quotation = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => apiFetch<Quotation>(`/quotations/${id}`),
    enabled: Boolean(id),
  });

  const action = useMutation({
    mutationFn: (path: string) => apiFetch(path, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotation', id] }),
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  const convert = useMutation({
    mutationFn: () => apiFetch<Invoice>(`/quotations/${id}/convert-to-invoice`, { method: 'POST' }),
    onSuccess: (invoice) => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      router.push(`/invoices/${invoice.id}`);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  const invalidate = (): void => {
    qc.invalidateQueries({ queryKey: ['quotation', id] });
    qc.invalidateQueries({ queryKey: ['quotations'] });
  };

  const addLine = useMutation({
    mutationFn: async () => {
      await apiFetch(`/quotations/${id}/lines`, {
        method: 'POST',
        body: JSON.stringify({
          type: line.type,
          serviceId: line.serviceId || undefined,
          description: line.description || undefined,
          quantity: Number(line.quantity) || 1,
          unitPrice: Number(line.unitPrice) || 0,
        }),
      });
    },
    onSuccess: () => {
      invalidate();
      setLine({ type: 'LABOR', serviceId: '', description: '', quantity: '1', unitPrice: '' });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  const removeLine = useMutation({
    mutationFn: (lineId: string) =>
      apiFetch(`/quotations/${id}/lines/${lineId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  if (quotation.isLoading) return <Spinner />;
  if (!quotation.data) return <EmptyState message="Orçamento não encontrado." />;

  const data = quotation.data;
  const canApprove = data.status === 'DRAFT' || data.status === 'SENT';
  const editable = data.status === 'DRAFT' || data.status === 'SENT';

  return (
    <div>
      <PageHeader
        title={`Orçamento ${data.number}`}
        subtitle={data.customer?.name ?? ''}
        actions={<Badge>{data.status}</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Itens</h2>
          {!data.lines || data.lines.length === 0 ? (
            <EmptyState message="Sem itens." />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <Th>Tipo</Th>
                  <Th>Descrição</Th>
                  <Th className="text-right">Qtd</Th>
                  <Th className="text-right">Total</Th>
                  {editable ? <Th /> : null}
                </tr>
              </thead>
              <tbody>
                {data.lines.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <Td>{item.type}</Td>
                    <Td>{item.description ?? '-'}</Td>
                    <Td className="text-right">{String(item.quantity)}</Td>
                    <Td className="text-right">{formatMoney(item.total)}</Td>
                    {editable ? (
                      <Td className="text-right">
                        <Button variant="ghost" onClick={() => removeLine.mutate(item.id)}>
                          Remover
                        </Button>
                      </Td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-3 text-right text-sm text-slate-700">
            Total: <strong>{formatMoney(data.total)}</strong>
          </div>

          {editable ? (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <ErrorText>{error}</ErrorText>
              <div className="mb-3 max-w-sm">
                <Field label="Serviço do catálogo (opcional)">
                  <Select
                    value={line.serviceId}
                    onChange={(e) => applyService(e.target.value)}
                  >
                    <option value="">Nenhum (item livre)</option>
                    {services.data?.items.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <Field label="Tipo">
                  <Select
                    value={line.type}
                    onChange={(e) => setLine((p) => ({ ...p, type: e.target.value }))}
                  >
                    <option value="LABOR">Mão de obra</option>
                    <option value="PART">Peça</option>
                    <option value="SERVICE">Serviço</option>
                    <option value="CUSTOM">Outro</option>
                  </Select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Descrição">
                    <Input
                      value={line.description}
                      onChange={(e) => setLine((p) => ({ ...p, description: e.target.value }))}
                    />
                  </Field>
                </div>
                <Field label="Qtd">
                  <Input
                    type="number"
                    value={line.quantity}
                    onChange={(e) => setLine((p) => ({ ...p, quantity: e.target.value }))}
                  />
                </Field>
                <Field label="Unitário">
                  <Input
                    type="number"
                    value={line.unitPrice}
                    onChange={(e) => setLine((p) => ({ ...p, unitPrice: e.target.value }))}
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Button onClick={() => addLine.mutate()} disabled={addLine.isPending}>
                  Adicionar item
                </Button>
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-800">Ações</h2>
          <ErrorText>{error}</ErrorText>
          <div className="mt-3 flex flex-col gap-2">
            {data.status === 'DRAFT' ? (
              <Button variant="secondary" onClick={() => action.mutate(`/quotations/${id}/send`)}>
                Marcar como enviado
              </Button>
            ) : null}
            {canApprove ? (
              <>
                <Button onClick={() => action.mutate(`/quotations/${id}/approve`)}>
                  Aprovar
                </Button>
                <Button variant="danger" onClick={() => action.mutate(`/quotations/${id}/reject`)}>
                  Rejeitar
                </Button>
              </>
            ) : null}
            {data.status === 'APPROVED' ? (
              <Button onClick={() => convert.mutate()} disabled={convert.isPending}>
                Gerar fatura
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
