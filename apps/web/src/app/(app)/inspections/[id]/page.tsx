'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Inspection, InspectionAnswer, InspectionResult } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorText,
  Input,
  PageHeader,
  Select,
  Spinner,
  StatusBadge,
} from '@/components/ui';
import { INSPECTION_STATUS } from '@/lib/labels';

const RESULTS: { value: InspectionResult; label: string; active: string }[] = [
  { value: 'OK', label: 'OK', active: 'bg-emerald-600 text-white' },
  { value: 'ATTENTION', label: 'Atenção', active: 'bg-amber-500 text-white' },
  { value: 'REPAIR', label: 'Reparar', active: 'bg-red-600 text-white' },
  { value: 'NOT_APPLICABLE', label: 'N/A', active: 'bg-slate-500 text-white' },
];

function AnswerRow({
  inspectionId,
  answer,
}: {
  inspectionId: string;
  answer: InspectionAnswer;
}): JSX.Element {
  const [result, setResult] = useState<InspectionResult>(answer.result);
  const [value, setValue] = useState(answer.value ?? '');
  const [comment, setComment] = useState(answer.comment ?? '');
  const [approval, setApproval] = useState(answer.approvalStatus);

  const save = useMutation({
    mutationFn: (body: Record<string, string>) =>
      apiFetch(`/inspections/${inspectionId}/answers/${answer.questionId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
  });

  const hasOptions = answer.question.options.length > 0;

  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium text-slate-800">
          {answer.question.label}
          {answer.question.required ? <span className="text-red-500"> *</span> : null}
        </div>
        <div className="flex flex-wrap gap-1">
          {RESULTS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setResult(option.value);
                save.mutate({ result: option.value });
              }}
              className={`rounded-full px-2 py-0.5 text-xs ${
                result === option.value ? option.active : 'bg-slate-100 text-slate-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
        {hasOptions ? (
          <Select
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              save.mutate({ value: e.target.value });
            }}
          >
            <option value="">Selecionar…</option>
            {answer.question.options.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            placeholder="Valor"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => save.mutate({ value })}
          />
        )}
        <Input
          placeholder="Comentário"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={() => save.mutate({ comment })}
        />
      </div>

      {result === 'REPAIR' ? (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="text-slate-500">Aprovação do cliente:</span>
          <Badge
            tone={
              approval === 'APPROVED'
                ? 'green'
                : approval === 'REJECTED'
                  ? 'red'
                  : 'amber'
            }
          >
            {approval}
          </Badge>
          <button
            className="underline"
            onClick={() => {
              setApproval('APPROVED');
              save.mutate({ approvalStatus: 'APPROVED' });
            }}
          >
            Aprovar
          </button>
          <button
            className="underline"
            onClick={() => {
              setApproval('REJECTED');
              save.mutate({ approvalStatus: 'REJECTED' });
            }}
          >
            Rejeitar
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function InspectionDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const [error, setError] = useState('');

  const inspection = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => apiFetch<Inspection>(`/inspections/${id}`),
    enabled: Boolean(id),
  });

  const complete = useMutation({
    mutationFn: () => apiFetch(`/inspections/${id}/complete`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inspection', id] }),
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  if (inspection.isLoading) return <Spinner />;
  if (!inspection.data) return <EmptyState message="Inspeção não encontrada." />;

  const data = inspection.data;
  const answers = data.answers ?? [];

  const sections = new Map<
    string,
    { title: string; sequence: number; items: InspectionAnswer[] }
  >();
  for (const answer of answers) {
    const section = answer.question.section;
    const key = section?.id ?? 'geral';
    if (!sections.has(key)) {
      sections.set(key, {
        title: section?.title ?? 'Geral',
        sequence: section?.sequence ?? 999,
        items: [],
      });
    }
    sections.get(key)!.items.push(answer);
  }
  const orderedSections = [...sections.values()].sort((a, b) => a.sequence - b.sequence);

  return (
    <div>
      <PageHeader
        title={`Inspeção · ${data.vehicle?.plate ?? ''}`}
        subtitle={
          [
            data.vehicle?.brand?.name,
            data.vehicle?.model?.name,
            data.jobCard?.number ? `OS ${data.jobCard.number}` : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'Checklist'
        }
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge map={INSPECTION_STATUS} value={data.status} />
            {data.status !== 'COMPLETED' ? (
              <Button onClick={() => complete.mutate()} disabled={complete.isPending}>
                Concluir
              </Button>
            ) : null}
          </div>
        }
      />

      <ErrorText>{error}</ErrorText>

      {data.completedAt ? (
        <p className="mb-4 text-xs text-slate-500">
          Concluída em {formatDateTime(data.completedAt)}
        </p>
      ) : null}

      <div className="space-y-6">
        {orderedSections.map((section) => (
          <Card key={section.title} className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">{section.title}</h2>
            <div className="space-y-3">
              {section.items.map((answer) => (
                <AnswerRow key={answer.id} inspectionId={id} answer={answer} />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
