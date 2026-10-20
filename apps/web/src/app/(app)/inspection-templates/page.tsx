'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { QUESTION_TYPE, enumOptions } from '@/lib/labels';
import { hasPermission } from '@/lib/permissions';
import type { InspectionTemplate } from '@/lib/types';
import { useDebounced } from '@/lib/use-debounced';
import { useAuth } from '@/components/auth-provider';
import { DataTable, usePagedQuery, type Column } from '@/components/data-table';
import {
  Button,
  Card,
  ErrorText,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Select,
} from '@/components/ui';

const OPTION_TYPES = ['SELECT', 'MULTISELECT', 'CHECKBOX'];

interface QuestionDraft {
  label: string;
  type: string;
  required: boolean;
  options: string;
}
interface SectionDraft {
  title: string;
  questions: QuestionDraft[];
}

function newQuestion(): QuestionDraft {
  return { label: '', type: 'SELECT', required: true, options: 'OK, Atenção, Reparar' };
}

const COLUMNS: Column<InspectionTemplate>[] = [
  {
    key: 'name',
    header: 'Nome',
    cell: (template) => (
      <div>
        <div className="font-medium">{template.name}</div>
        {template.description ? (
          <div className="text-xs text-ink-muted">{template.description}</div>
        ) : null}
      </div>
    ),
  },
  {
    key: 'versions',
    header: 'Versões',
    align: 'right',
    cell: (template) => template._count?.versions ?? 0,
  },
  { key: 'created', header: 'Criado em', cell: (template) => formatDate(template.createdAt) },
];

export default function InspectionTemplatesPage(): JSX.Element {
  const qc = useQueryClient();
  const router = useRouter();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<SectionDraft[]>([
    { title: 'Geral', questions: [newQuestion()] },
  ]);

  const { query, page, setPage } = usePagedQuery<InspectionTemplate>(
    'inspection-templates',
    '/inspection-templates',
    { search: debouncedSearch },
  );

  const create = useMutation({
    mutationFn: () =>
      apiFetch<InspectionTemplate>('/inspection-templates', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: description || undefined,
          sections: sections.map((section, si) => ({
            title: section.title,
            sequence: si,
            questions: section.questions
              .filter((question) => question.label)
              .map((question, qi) => ({
                label: question.label,
                type: question.type,
                required: question.required,
                sequence: qi,
                options: OPTION_TYPES.includes(question.type)
                  ? question.options
                      .split(',')
                      .map((option) => option.trim())
                      .filter(Boolean)
                      .map((option, oi) => ({
                        label: option,
                        value: option.toLowerCase().replace(/\s+/g, '_'),
                        sequence: oi,
                      }))
                  : undefined,
              })),
          })),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inspection-templates'] });
      setOpen(false);
      toast.success('Checklist criado');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  function openCreate(): void {
    setError('');
    setName('');
    setDescription('');
    setSections([{ title: 'Geral', questions: [newQuestion()] }]);
    setOpen(true);
  }

  function updateSection(index: number, patch: Partial<SectionDraft>): void {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }
  function updateQuestion(si: number, qi: number, patch: Partial<QuestionDraft>): void {
    setSections((prev) =>
      prev.map((s, i) =>
        i === si
          ? { ...s, questions: s.questions.map((q, j) => (j === qi ? { ...q, ...patch } : q)) }
          : s,
      ),
    );
  }

  const canCreate = hasPermission(granted, 'inspection.create');

  return (
    <div>
      <PageHeader
        title="Checklists de inspeção"
        subtitle="Templates reutilizáveis"
        actions={canCreate ? <Button onClick={openCreate}>Novo checklist</Button> : null}
      />

      <Card className="p-4">
        <SearchInput
          className="mb-3"
          aria-label="Buscar checklists"
          placeholder="Buscar por nome…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <DataTable
          query={query}
          columns={COLUMNS}
          rowKey={(template) => template.id}
          page={page}
          onPageChange={setPage}
          onRowClick={(template) => router.push(`/inspection-templates/${template.id}`)}
          emptyMessage={
            debouncedSearch
              ? 'Nenhum checklist encontrado para essa busca.'
              : 'Nenhum checklist cadastrado ainda.'
          }
          emptyAction={
            !debouncedSearch && canCreate ? (
              <Button onClick={openCreate}>Criar o primeiro checklist</Button>
            ) : undefined
          }
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Novo checklist"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="template-form"
              disabled={create.isPending || !name}
            >
              {create.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form
          id="template-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (name && !create.isPending) create.mutate();
          }}
        >
          <ErrorText>{error}</ErrorText>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <Input autoFocus required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Descrição">
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
          </div>

          <div className="space-y-4">
            {sections.map((section, si) => (
              <div key={si} className="rounded-lg border border-surface-line p-3">
                <div className="flex items-center gap-2">
                  <Input
                    aria-label="Título da seção"
                    placeholder="Título da seção"
                    value={section.title}
                    onChange={(e) => updateSection(si, { title: e.target.value })}
                  />
                  <button
                    type="button"
                    aria-label="Remover seção"
                    className="rounded-md p-1 text-ink-soft transition hover:bg-surface-page hover:text-state-danger"
                    onClick={() => setSections((prev) => prev.filter((_, i) => i !== si))}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {section.questions.map((question, qi) => (
                    <div
                      key={qi}
                      className="grid grid-cols-1 gap-2 border-t border-surface-line/70 pt-3 sm:grid-cols-12 sm:border-0 sm:pt-0"
                    >
                      <div className="sm:col-span-5">
                        <Input
                          aria-label="Pergunta"
                          placeholder="Pergunta"
                          value={question.label}
                          onChange={(e) => updateQuestion(si, qi, { label: e.target.value })}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <Select
                          aria-label="Tipo da pergunta"
                          value={question.type}
                          onChange={(e) => updateQuestion(si, qi, { type: e.target.value })}
                        >
                          {enumOptions(QUESTION_TYPE).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="sm:col-span-3">
                        <Input
                          aria-label="Opções separadas por vírgula"
                          placeholder="Opções (vírgula)"
                          disabled={!OPTION_TYPES.includes(question.type)}
                          value={question.options}
                          onChange={(e) => updateQuestion(si, qi, { options: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center sm:col-span-1">
                        <button
                          type="button"
                          aria-label="Remover pergunta"
                          className="rounded-md p-1 text-ink-soft transition hover:bg-surface-page hover:text-state-danger"
                          onClick={() =>
                            updateSection(si, {
                              questions: section.questions.filter((_, j) => j !== qi),
                            })
                          }
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      updateSection(si, { questions: [...section.questions, newQuestion()] })
                    }
                  >
                    + Pergunta
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setSections((prev) => [...prev, { title: '', questions: [newQuestion()] }])
              }
            >
              + Seção
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
