'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { PERMISSION_ACTION, PERMISSION_FEATURE, enumLabel } from '@/lib/labels';
import { hasPermission } from '@/lib/permissions';
import type { Permission, Role } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { useConfirm } from '@/components/confirm';
import { DataTable, useLocalPaged, type Column } from '@/components/data-table';
import {
  Badge,
  Button,
  Card,
  ErrorText,
  Field,
  Input,
  Modal,
  PageHeader,
} from '@/components/ui';

const COLUMNS: Column<Role>[] = [
  {
    key: 'name',
    header: 'Nome',
    cell: (role) => (
      <div>
        <div className="flex items-center gap-2 font-medium">
          {role.name}
          {role.isSystem ? <Badge>Sistema</Badge> : null}
        </div>
        {role.description ? (
          <div className="text-xs text-ink-muted">{role.description}</div>
        ) : null}
      </div>
    ),
  },
  {
    key: 'permissions',
    header: 'Permissões',
    align: 'right',
    cell: (role) => role._count?.permissions ?? 0,
  },
  {
    key: 'members',
    header: 'Membros',
    align: 'right',
    cell: (role) => role._count?.memberships ?? 0,
  },
];

export default function RolesPage(): JSX.Element {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState('');

  // O endpoint devolve todos os papéis; a paginação é feita no cliente.
  const roles = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiFetch<Role[]>('/roles'),
  });
  const { query, page, setPage } = useLocalPaged(roles);
  const permissions = useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiFetch<Permission[]>('/roles/permissions'),
    enabled: open,
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        permissionCodes: codes,
      });
      if (editing) {
        await apiFetch(`/roles/${editing.id}`, { method: 'PATCH', body });
      } else {
        await apiFetch('/roles', { method: 'POST', body });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      setOpen(false);
      toast.success(editing ? 'Papel atualizado' : 'Papel criado');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/roles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Papel excluído');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao excluir'),
  });

  function openCreate(): void {
    setEditing(null);
    setForm({ name: '', description: '' });
    setCodes([]);
    setError('');
    setOpen(true);
  }

  async function openEdit(role: Role): Promise<void> {
    try {
      const detail = await apiFetch<Role>(`/roles/${role.id}`);
      setEditing(role);
      setForm({ name: role.name, description: role.description ?? '' });
      setCodes(detail.permissions?.map((item) => item.permission.code) ?? []);
      setError('');
      setOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar o papel');
    }
  }

  async function confirmRemove(role: Role): Promise<void> {
    const members = role._count?.memberships ?? 0;
    const ok = await confirm({
      title: 'Excluir papel',
      description:
        members > 0
          ? `"${role.name}" está atribuído a ${members} membro(s), que perderão as permissões dele.`
          : `"${role.name}" será excluído.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    });
    if (ok) remove.mutate(role.id);
  }

  function toggle(code: string, checked: boolean): void {
    setCodes((prev) => (checked ? [...new Set([...prev, code])] : prev.filter((c) => c !== code)));
  }

  const grouped = (permissions.data ?? []).reduce<Record<string, Permission[]>>(
    (acc, permission) => {
      (acc[permission.feature] ??= []).push(permission);
      return acc;
    },
    {},
  );

  const canCreate = hasPermission(granted, 'role.create');
  const canEdit = hasPermission(granted, 'role.edit');
  const canDelete = hasPermission(granted, 'role.delete');
  const edit = (role: Role) => void openEdit(role);

  return (
    <div>
      <PageHeader
        title="Papéis e permissões"
        subtitle="Controle de acesso por perfil"
        actions={canCreate ? <Button onClick={openCreate}>Novo papel</Button> : null}
      />

      <Card className="p-4">
        <DataTable
          query={query}
          columns={COLUMNS}
          rowKey={(role) => role.id}
          page={page}
          onPageChange={setPage}
          onRowClick={canEdit ? edit : undefined}
          rowActions={(role) => [
            { label: 'Editar', onSelect: () => edit(role), hidden: !canEdit },
            {
              label: 'Excluir',
              onSelect: () => void confirmRemove(role),
              danger: true,
              hidden: !canDelete || role.isSystem,
            },
          ]}
          emptyMessage="Nenhum papel cadastrado ainda."
          emptyAction={
            canCreate ? <Button onClick={openCreate}>Criar o primeiro papel</Button> : undefined
          }
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Editar papel · ${editing.name}` : 'Novo papel'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="role-form" disabled={save.isPending || !form.name}>
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form
          id="role-form"
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
            <Field label="Descrição">
              <Input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-xs font-medium text-ink-muted">Permissões</legend>
            <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg border border-surface-line p-3">
              {permissions.isError ? (
                <ErrorText>Não foi possível carregar o catálogo de permissões.</ErrorText>
              ) : null}
              {Object.entries(grouped).map(([feature, items]) => (
                <div key={feature}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {enumLabel(PERMISSION_FEATURE, feature)}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5">
                    {items.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center gap-2 text-sm text-ink"
                      >
                        <input
                          type="checkbox"
                          checked={codes.includes(permission.code)}
                          onChange={(e) => toggle(permission.code, e.target.checked)}
                        />
                        {enumLabel(PERMISSION_ACTION, permission.action)}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        </form>
      </Modal>
    </div>
  );
}
