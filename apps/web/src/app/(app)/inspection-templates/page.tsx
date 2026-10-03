'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import type { InspectionTemplate, Paginated } from '@/lib/types';
import {
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

const QUESTION_TYPES = [
  'SELECT',
  'MULTISELECT',
  'CHECKBOX',
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'DATE',
  'BOOLEAN',
];

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

export default function InspectionTemplatesPage(): JSX.Element {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<SectionDraft[]>([
    { title: 'Geral', questions: [newQuestion()] },
  ]);

  const { data, isLoading } = useQuery({
    queryKey: ['inspection-templates'],
    queryFn: () =>
      apiFetch<Paginated<InspectionTemplate>>(
        `/inspection-templates${buildQuery({ pageSize: 100 })}`,
      ),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch('/inspection-templates', {
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
                options:
                  question.type === 'SELECT' ||
                  question.type === 'MULTISELECT' ||
                  question.type === 'CHECKBOX'
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
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
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

  return (
    <div>
      <PageHeader
        title="Checklists de inspeção"
        subtitle="Templates reutilizáveis"
        actions={<Button onClick={openCreate}>Novo checklist</Button>}
      />

      <Card className="p-4">
        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState message="Nenhum checklist cadastrado." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <Th>Nome</Th>
                <Th>Descrição</Th>
                <Th className="text-right">Versões</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((template) => (
                <tr key={template.id} className="border-b border-slate-100">
                  <Td>{template.name}</Td>
                  <Td>{template.description ?? '-'}</Td>
                  <Td className="text-right">{template._count?.versions ?? 0}</Td>
                  <Td className="text-right">
                    <Link
                      href={`/inspection-templates/${template.id}`}
                      className="text-sm underline"
                    >
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
        title="Novo checklist"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending || !name}>
              {create.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <ErrorText>{error}</ErrorText>
        <Field label="Nome">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Descrição">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <div className="space-y-4">
          {sections.map((section, si) => (
            <div key={si} className="rounded-md border border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Título da seção"
                  value={section.title}
                  onChange={(e) => updateSection(si, { title: e.target.value })}
                />
                <button
                  className="text-slate-400 hover:text-red-600"
                  onClick={() => setSections((prev) => prev.filter((_, i) => i !== si))}
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {section.questions.map((question, qi) => (
                  <div key={qi} className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <Input
                        placeholder="Pergunta"
                        value={question.label}
                        onChange={(e) => updateQuestion(si, qi, { label: e.target.value })}
                      />
                    </div>
                    <div className="col-span-3">
                      <Select
                        value={question.type}
                        onChange={(e) => updateQuestion(si, qi, { type: e.target.value })}
                      >
                        {QUESTION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="Opções (vírgula)"
                        value={question.options}
                        onChange={(e) => updateQuestion(si, qi, { options: e.target.value })}
                      />
                    </div>
                    <div className="col-span-1 flex items-center">
                      <button
                        className="text-slate-400 hover:text-red-600"
                        onClick={() =>
                          updateSection(si, {
                            questions: section.questions.filter((_, j) => j !== qi),
                          })
                        }
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  onClick={() => updateSection(si, { questions: [...section.questions, newQuestion()] })}
                >
                  + Pergunta
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="secondary"
            onClick={() => setSections((prev) => [...prev, { title: '', questions: [newQuestion()] }])}
          >
            + Seção
          </Button>
        </div>
      </Modal>
    </div>
  );
}
