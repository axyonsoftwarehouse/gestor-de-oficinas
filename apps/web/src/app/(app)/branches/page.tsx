'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { hasPermission } from '@/lib/permissions';
import type { BranchFull } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { useConfirm } from '@/components/confirm';
import { DataTable, useLocalPaged, type Column } from '@/components/data-table';
import {
  Button,
  Card,
  ErrorText,
  Field,
  Input,
  Modal,
  PageHeader,
} from '@/components/ui';

const COLUMNS: Column<BranchFull>[] = [
  {
    key: 'name',
    header: 'Nome',
    cell: (branch) => <span className="font-medium">{branch.name}</span>,
  },
  { key: 'code', header: 'Código', cell: (branch) => branch.code ?? '-' },
];

export default function BranchesPage(): JSX.Element {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BranchFull | null>(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [error, setError] = useState('');

  // O endpoint devolve todas as filiais; a paginação é feita no cliente.
  const branches = useQuery({
    queryKey: ['branches', 'full'],
    queryFn: () => apiFetch<BranchFull[]>('/branches'),
  });
  const { query, page, setPage } = useLocalPaged(branches);

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
      qc.invalidateQueries({ queryKey: ['branches'] });
      setOpen(false);
      toast.success(editing ? 'Filial atualizada' : 'Filial cadastrada');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/branches/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Filial excluída');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao excluir'),
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

  async function confirmRemove(branch: BranchFull): Promise<void> {
    const ok = await confirm({
      title: 'Excluir filial',
      description: `"${branch.name}" deixará de aparecer nas listas. OS e estoque vinculados são preservados.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    });
    if (ok) remove.mutate(branch.id);
  }

  const canCreate = hasPermission(granted, 'branch.create');
  const canEdit = hasPermission(granted, 'branch.edit');
  const canDelete = hasPermission(granted, 'branch.delete');

  return (
    <div>
      <PageHeader
        title="Filiais"
        subtitle="Unidades da oficina"
        actions={canCreate ? <Button onClick={openCreate}>Nova filial</Button> : null}
      />

      <Card className="p-4">
        <DataTable
          query={query}
          columns={COLUMNS}
          rowKey={(branch) => branch.id}
          page={page}
          onPageChange={setPage}
          onRowClick={canEdit ? openEdit : undefined}
          rowActions={(branch) => [
            { label: 'Editar', onSelect: () => openEdit(branch), hidden: !canEdit },
            {
              label: 'Excluir',
              onSelect: () => void confirmRemove(branch),
              danger: true,
              hidden: !canDelete,
            },
          ]}
          emptyMessage="Nenhuma filial cadastrada ainda."
          emptyAction={
            canCreate ? <Button onClick={openCreate}>Cadastrar a primeira filial</Button> : undefined
          }
        />
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
            <Button type="submit" form="branch-form" disabled={save.isPending || !form.name}>
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form
          id="branch-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (form.name && !save.isPending) save.mutate();
          }}
        >
          <ErrorText>{error}</ErrorText>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <Input
                autoFocus
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </Field>
            <Field label="Código">
              <Input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
