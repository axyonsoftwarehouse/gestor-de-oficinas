'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { MEMBERSHIP_STATUS, enumOptions } from '@/lib/labels';
import { hasPermission } from '@/lib/permissions';
import { useBranches } from '@/lib/queries';
import type { Role, TeamMember } from '@/lib/types';
import { useDebounced } from '@/lib/use-debounced';
import { useAuth } from '@/components/auth-provider';
import { useConfirm } from '@/components/confirm';
import { DataTable, usePagedQuery, type Column } from '@/components/data-table';
import {
  Badge,
  Button,
  Card,
  ErrorText,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Select,
  StatusBadge,
} from '@/components/ui';

interface MemberForm {
  name: string;
  email: string;
  password: string;
  branchId: string;
  status: 'ACTIVE' | 'DISABLED';
}

const EMPTY: MemberForm = {
  name: '',
  email: '',
  password: '',
  branchId: '',
  status: 'ACTIVE',
};

const COLUMNS: Column<TeamMember>[] = [
  {
    key: 'name',
    header: 'Nome',
    cell: (member) => (
      <div>
        <div className="flex items-center gap-2 font-medium">
          {member.user.name}
          {member.isOwner ? <Badge tone="blue">Proprietário</Badge> : null}
        </div>
        <div className="text-xs text-ink-muted">{member.user.email}</div>
      </div>
    ),
  },
  { key: 'branch', header: 'Filial', cell: (member) => member.branch?.name ?? '-' },
  {
    key: 'roles',
    header: 'Papéis',
    cell: (member) => member.roles.map((item) => item.role.name).join(', ') || '-',
  },
  {
    key: 'status',
    header: 'Status',
    cell: (member) => <StatusBadge map={MEMBERSHIP_STATUS} value={member.status} />,
  },
];

export default function TeamPage(): JSX.Element {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<MemberForm>(EMPTY);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const branches = useBranches();
  const roles = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiFetch<Role[]>('/roles'),
    enabled: open,
  });
  const { query, page, setPage } = usePagedQuery<TeamMember>('team', '/users', {
    search: debouncedSearch,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        await apiFetch(`/users/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: form.name,
            branchId: form.branchId || undefined,
            status: form.status,
            roleIds,
          }),
        });
      } else {
        await apiFetch('/users', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            branchId: form.branchId || undefined,
            roleIds,
          }),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['roles'] });
      setOpen(false);
      toast.success(editing ? 'Membro atualizado' : 'Membro adicionado');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => apiFetch(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      toast.success('Membro desativado');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao desativar'),
  });

  function openCreate(): void {
    setEditing(null);
    setForm({ ...EMPTY, branchId: branches.data?.[0]?.id ?? '' });
    setRoleIds([]);
    setError('');
    setOpen(true);
  }

  function openEdit(member: TeamMember): void {
    setEditing(member);
    setForm({
      name: member.user.name,
      email: member.user.email,
      password: '',
      branchId: member.branch?.id ?? '',
      status: member.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
    });
    setRoleIds(member.roles.map((item) => item.role.id));
    setError('');
    setOpen(true);
  }

  async function confirmDeactivate(member: TeamMember): Promise<void> {
    const ok = await confirm({
      title: 'Desativar membro',
      description: `${member.user.name} perderá o acesso a esta oficina. Você pode reativar depois em "Editar".`,
      confirmLabel: 'Desativar',
      tone: 'danger',
    });
    if (ok) deactivate.mutate(member.id);
  }

  function toggleRole(id: string, checked: boolean): void {
    setRoleIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((r) => r !== id)));
  }

  const canCreate = hasPermission(granted, 'user.create');
  const canEdit = hasPermission(granted, 'user.edit');
  const canDelete = hasPermission(granted, 'user.delete');
  const canSave =
    (editing
      ? Boolean(form.name)
      : Boolean(form.name && form.email && form.password.length >= 8)) && !save.isPending;

  return (
    <div>
      <PageHeader
        title="Equipe"
        subtitle="Usuários e papéis da oficina"
        actions={canCreate ? <Button onClick={openCreate}>Novo membro</Button> : null}
      />

      <Card className="p-4">
        <SearchInput
          className="mb-3"
          aria-label="Buscar membros"
          placeholder="Buscar por nome ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <DataTable
          query={query}
          columns={COLUMNS}
          rowKey={(member) => member.id}
          page={page}
          onPageChange={setPage}
          onRowClick={canEdit ? openEdit : undefined}
          rowActions={(member) => [
            { label: 'Editar', onSelect: () => openEdit(member), hidden: !canEdit },
            {
              label: 'Desativar',
              onSelect: () => void confirmDeactivate(member),
              danger: true,
              hidden: !canDelete || member.isOwner || member.status === 'DISABLED',
            },
          ]}
          emptyMessage={
            debouncedSearch ? 'Nenhum membro encontrado para essa busca.' : 'Nenhum membro ainda.'
          }
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar membro' : 'Novo membro'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="member-form" disabled={!canSave}>
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form
          id="member-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) save.mutate();
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
            <Field label="E-mail">
              <Input
                required
                type="email"
                autoComplete="off"
                value={form.email}
                disabled={Boolean(editing)}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </Field>
            {!editing ? (
              <Field label="Senha" hint="Mínimo de 8 caracteres">
                <Input
                  required
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                />
              </Field>
            ) : null}
            <Field label="Filial">
              <Select
                value={form.branchId}
                onChange={(e) => setForm((p) => ({ ...p, branchId: e.target.value }))}
              >
                <option value="">Sem filial</option>
                {branches.data?.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
            </Field>
            {editing ? (
              <Field label="Status">
                <Select
                  value={form.status}
                  disabled={editing.isOwner}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, status: e.target.value as MemberForm['status'] }))
                  }
                >
                  {enumOptions(MEMBERSHIP_STATUS)
                    .filter((option) => option.value !== 'INVITED')
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </Select>
              </Field>
            ) : null}
          </div>

          <fieldset>
            <legend className="mb-1.5 text-xs font-medium text-ink-muted">Papéis</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {roles.data?.map((role) => (
                <label key={role.id} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={roleIds.includes(role.id)}
                    onChange={(e) => toggleRole(role.id, e.target.checked)}
                  />
                  {role.name}
                </label>
              ))}
            </div>
          </fieldset>
        </form>
      </Modal>
    </div>
  );
}
