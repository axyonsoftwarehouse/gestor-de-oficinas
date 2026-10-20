'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { BranchFull } from '@/lib/types';
import {
  Button,
  Card,
  EmptyState,
  ErrorText,
  Field,
  Input,
  Modal,
  PageHeader,
  Spinner,
  Td,
  Th,
} from '@/components/ui';
import { useConfirm } from '@/components/confirm';

export default function BranchesPage(): JSX.Element {
  const confirm = useConfirm();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BranchFull | null>(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['branches-full'],
    queryFn: () => apiFetch<BranchFull[]>('/branches'),
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = JSON.stringify({ name: form.name, code: form.code || undefined });
      if (editing) {
        await apiFetch(`/branches/${editing.id}`, { method: 'PATCH', body });
      } else {
        await apiFetch('/branches', { method: 'POST', body });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches-full'] });
      qc.invalidateQueries({ queryKey: ['branches'] });
      setOpen(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/branches/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches-full'] });
      qc.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  function openCreate(): void {
    setEditing(null);
    setForm({ name: '', code: '' });
    setError('');
    setOpen(true);
  }

  function openEdit(branch: BranchFull): void {
    setEditing(branch);
    setForm({ name: branch.name, code: branch.code ?? '' });
    setError('');
    setOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Filiais"
        subtitle="Unidades da oficina"
        actions={<Button onClick={openCreate}>Nova filial</Button>}
      />

      <Card className="p-4">
        {isLoading ? (
          <Spinner />
        ) : !data || data.length === 0 ? (
          <EmptyState message="Nenhuma filial cadastrada." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <Th>Nome</Th>
                <Th>Código</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.map((branch) => (
                <tr key={branch.id} className="border-b border-slate-100">
                  <Td>{branch.name}</Td>
                  <Td>{branch.code ?? '-'}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => openEdit(branch)}>
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        onClick={async () => {
                          if (await confirm({ title: `Excluir ${branch.name}?`, confirmLabel: 'Excluir', tone: 'danger' })) remove.mutate(branch.id);
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
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar filial' : 'Nova filial'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.name}>
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <ErrorText>{error}</ErrorText>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome">
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </Field>
          <Field label="Código">
            <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
