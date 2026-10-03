'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Permission, Role } from '@/lib/types';
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
  Spinner,
  Td,
  Th,
} from '@/components/ui';

const ACTION_LABELS: Record<string, string> = {
  view: 'Ver',
  view_own: 'Ver (próprios)',
  create: 'Criar',
  edit: 'Editar',
  delete: 'Excluir',
  approve: 'Aprovar',
};

export default function RolesPage(): JSX.Element {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState('');

  const roles = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiFetch<Role[]>('/roles'),
  });
  const permissions = useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiFetch<Permission[]>('/roles/permissions'),
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
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/roles/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  function openCreate(): void {
    setEditing(null);
    setForm({ name: '', description: '' });
    setCodes([]);
    setError('');
    setOpen(true);
  }

  async function openEdit(role: Role): Promise<void> {
    setError('');
    const detail = await apiFetch<Role>(`/roles/${role.id}`);
    setEditing(role);
    setForm({ name: role.name, description: role.description ?? '' });
    setCodes(detail.permissions?.map((item) => item.permission.code) ?? []);
    setOpen(true);
  }

  function toggle(code: string, checked: boolean): void {
    setCodes((prev) => (checked ? [...new Set([...prev, code])] : prev.filter((c) => c !== code)));
  }

  const grouped = (permissions.data ?? []).reduce<Record<string, Permission[]>>((acc, permission) => {
    (acc[permission.feature] ??= []).push(permission);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Papéis e permissões"
        subtitle="Controle de acesso por perfil"
        actions={<Button onClick={openCreate}>Novo papel</Button>}
      />

      <ErrorText>{error}</ErrorText>

      <Card className="p-4">
        {roles.isLoading ? (
          <Spinner />
        ) : !roles.data || roles.data.length === 0 ? (
          <EmptyState message="Nenhum papel cadastrado." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <Th>Nome</Th>
                <Th>Descrição</Th>
                <Th className="text-right">Permissões</Th>
                <Th className="text-right">Membros</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {roles.data.map((role) => (
                <tr key={role.id} className="border-b border-slate-100">
                  <Td>
                    {role.name} {role.isSystem ? <Badge>Sistema</Badge> : null}
                  </Td>
                  <Td>{role.description ?? '-'}</Td>
                  <Td className="text-right">{role._count?.permissions ?? 0}</Td>
                  <Td className="text-right">{role._count?.memberships ?? 0}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => void openEdit(role)}>
                        Editar
                      </Button>
                      {!role.isSystem ? (
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (window.confirm(`Excluir ${role.name}?`)) remove.mutate(role.id);
                          }}
                        >
                          Excluir
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
        title={editing ? `Editar papel · ${editing.name}` : 'Novo papel'}
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
        <Field label="Nome">
          <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        </Field>
        <Field label="Descrição">
          <Input
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </Field>

        <div>
          <div className="mb-1 text-xs font-medium text-slate-600">Permissões</div>
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-3">
            {Object.entries(grouped).map(([feature, items]) => (
              <div key={feature}>
                <div className="text-xs font-semibold uppercase text-slate-500">{feature}</div>
                <div className="mt-1 flex flex-wrap gap-3">
                  {items.map((permission) => (
                    <label key={permission.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={codes.includes(permission.code)}
                        onChange={(e) => toggle(permission.code, e.target.checked)}
                      />
                      {ACTION_LABELS[permission.action] ?? permission.action}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
