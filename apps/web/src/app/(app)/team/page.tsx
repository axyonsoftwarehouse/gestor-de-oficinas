'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Paginated, Role, TeamMember } from '@/lib/types';
import { useBranches } from '@/lib/queries';
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

export default function TeamPage(): JSX.Element {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<MemberForm>(EMPTY);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const branches = useBranches();
  const roles = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiFetch<Role[]>('/roles'),
  });
  const { data, isLoading } = useQuery({
    queryKey: ['team', search],
    queryFn: () => apiFetch<Paginated<TeamMember>>(`/users${buildQuery({ search })}`),
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
      setOpen(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => apiFetch(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
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

  function toggleRole(id: string, checked: boolean): void {
    setRoleIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((r) => r !== id)));
  }

  const canSave = editing
    ? Boolean(form.name)
    : Boolean(form.name && form.email && form.password.length >= 8);

  return (
    <div>
      <PageHeader
        title="Equipe"
        subtitle="Usuários e papéis da oficina"
        actions={<Button onClick={openCreate}>Novo membro</Button>}
      />

      <Card className="p-4">
        <div className="mb-3 max-w-sm">
          <Input
            placeholder="Buscar por nome ou e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState message="Nenhum membro encontrado." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <Th>Nome</Th>
                <Th>E-mail</Th>
                <Th>Filial</Th>
                <Th>Papéis</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((member) => (
                <tr key={member.id} className="border-b border-slate-100">
                  <Td>{member.user.name}</Td>
                  <Td>{member.user.email}</Td>
                  <Td>{member.branch?.name ?? '-'}</Td>
                  <Td>{member.roles.map((item) => item.role.name).join(', ') || '-'}</Td>
                  <Td>
                    <Badge
                      tone={
                        member.status === 'ACTIVE'
                          ? 'green'
                          : member.status === 'DISABLED'
                            ? 'red'
                            : 'amber'
                      }
                    >
                      {member.status}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => openEdit(member)}>
                        Editar
                      </Button>
                      {!member.isOwner && member.status === 'ACTIVE' ? (
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (window.confirm(`Desativar ${member.user.name}?`))
                              deactivate.mutate(member.id);
                          }}
                        >
                          Desativar
                        </Button>
                      ) : null}
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
        title={editing ? 'Editar membro' : 'Novo membro'}
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
          <Field label="Nome">
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              value={form.email}
              disabled={Boolean(editing)}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </Field>
          {!editing ? (
            <Field label="Senha">
              <Input
                type="password"
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
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value as MemberForm['status'] }))
                }
              >
                <option value="ACTIVE">Ativo</option>
                <option value="DISABLED">Desativado</option>
              </Select>
            </Field>
          ) : null}
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-slate-600">Papéis</div>
          <div className="flex flex-wrap gap-3">
            {roles.data?.map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={roleIds.includes(role.id)}
                  onChange={(e) => toggleRole(role.id, e.target.checked)}
                />
                {role.name}
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
