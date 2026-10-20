'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { InspectionTemplate } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { QUESTION_TYPE, enumLabel } from '@/lib/labels';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorText,
  PageHeader,
  Spinner,
} from '@/components/ui';

export default function InspectionTemplateDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const [error, setError] = useState('');

  const template = useQuery({
    queryKey: ['inspection-template', id],
    queryFn: () => apiFetch<InspectionTemplate>(`/inspection-templates/${id}`),
    enabled: Boolean(id),
  });

  const publish = useMutation({
    mutationFn: () => apiFetch(`/inspection-templates/${id}/publish`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inspection-template', id] }),
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  if (template.isLoading) return <Spinner />;
  if (!template.data) return <EmptyState message="Checklist não encontrado." />;

  const versions = [...(template.data.versions ?? [])].sort((a, b) => b.version - a.version);
  const latest = versions[0];

  return (
    <div>
      <PageHeader
        title={template.data.name}
        subtitle={template.data.description ?? 'Checklist de inspeção'}
        actions={
          <div className="flex items-center gap-2">
            {latest ? <Badge>v{latest.version}</Badge> : null}
            <Button onClick={() => publish.mutate()} disabled={publish.isPending}>
              Publicar nova versão
            </Button>
          </div>
        }
      />

      <ErrorText>{error}</ErrorText>

      {!latest ? (
        <EmptyState message="Sem versões publicadas." />
      ) : (
        <>
          <p className="mb-4 text-xs text-slate-500">
            Publicada em {formatDate(latest.publishedAt)}
          </p>
          <div className="space-y-6">
            {latest.sections.map((section) => (
              <Card key={section.id} className="p-4">
                <h2 className="mb-3 text-sm font-semibold text-slate-800">{section.title}</h2>
                <ul className="space-y-2">
                  {section.questions.map((question) => (
                    <li
                      key={question.id}
                      className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm"
                    >
                      <span className="text-slate-700">
                        {question.label}
                        {question.required ? <span className="text-red-500"> *</span> : null}
                      </span>
                      <span className="text-xs text-slate-400">
                        {enumLabel(QUESTION_TYPE, question.type)}
                        {question.options.length > 0
                          ? ` · ${question.options.map((option) => option.label).join(' / ')}`
                          : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
