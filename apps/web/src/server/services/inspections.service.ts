import { Prisma, requireTenantId } from '@gestor/database';
import { getDb } from '../db/prisma';
import { NotFoundError } from '../http/errors';
import type { QueryInspectionDto } from '../dtos/query-inspection.dto';
import type { StartInspectionDto } from '../dtos/start-inspection.dto';
import type { UpdateInspectionDto } from '../dtos/update-inspection.dto';
import type { UpsertAnswerDto } from '../dtos/upsert-answer.dto';

const detailInclude = {
  vehicle: {
    select: {
      id: true,
      plate: true,
      brand: { select: { name: true } },
      model: { select: { name: true } },
    },
  },
  jobCard: { select: { id: true, number: true } },
  answers: {
    include: {
      question: {
        include: {
          options: { orderBy: { sequence: 'asc' as const } },
          section: { select: { id: true, title: true, sequence: true } },
        },
      },
      attachments: true,
    },
  },
} satisfies Prisma.InspectionInclude;

export async function startInspection(dto: StartInspectionDto, inspectorId: string) {
  const version = await getDb().inspectionTemplateVersion.findFirst({
    where: { templateId: dto.templateId },
    orderBy: { version: 'desc' },
    include: { sections: { include: { questions: true } } },
  });
  if (!version) throw new NotFoundError('Template de inspeção não encontrado');

  const questions = version.sections.flatMap((section) => section.questions);

  return getDb().inspection.create({
    data: {
      tenantId: requireTenantId(),
      branchId: dto.branchId,
      vehicleId: dto.vehicleId,
      jobCardId: dto.jobCardId,
      templateVersionId: version.id,
      inspectorId,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      notes: dto.notes,
      answers: {
        create: questions.map((question) => ({ questionId: question.id })),
      },
    },
    include: detailInclude,
  });
}

export async function listInspections(query: QueryInspectionDto) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.InspectionWhereInput = {};
  if (query.vehicleId) where.vehicleId = query.vehicleId;
  if (query.jobCardId) where.jobCardId = query.jobCardId;
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    getDb().inspection.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { id: true, plate: true } },
        jobCard: { select: { id: true, number: true } },
        _count: { select: { answers: true } },
      },
    }),
    getDb().inspection.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function findInspection(id: string) {
  const inspection = await getDb().inspection.findFirst({
    where: { id },
    include: detailInclude,
  });
  if (!inspection) throw new NotFoundError('Inspeção não encontrada');
  return inspection;
}

export async function updateInspection(id: string, dto: UpdateInspectionDto) {
  await findInspection(id);
  return getDb().inspection.update({
    where: { id },
    data: {
      status: dto.status,
      notes: dto.notes,
      ...(dto.status === 'COMPLETED' ? { completedAt: new Date() } : {}),
    },
    include: detailInclude,
  });
}

export function completeInspection(id: string) {
  return updateInspection(id, { status: 'COMPLETED' });
}

export async function upsertInspectionAnswer(
  inspectionId: string,
  questionId: string,
  dto: UpsertAnswerDto,
  userId: string,
) {
  const inspection = await getDb().inspection.findFirst({
    where: { id: inspectionId },
    select: { id: true, templateVersionId: true },
  });
  if (!inspection) throw new NotFoundError('Inspeção não encontrada');

  const question = await getDb().inspectionQuestion.findFirst({
    where: {
      id: questionId,
      section: { versionId: inspection.templateVersionId ?? '' },
    },
    select: { id: true },
  });
  if (!question) {
    throw new NotFoundError('Pergunta não pertence a esta inspeção');
  }

  const approvalUpdate = dto.approvalStatus
    ? {
        approvalStatus: dto.approvalStatus,
        approvedById: dto.approvalStatus === 'PENDING' ? null : userId,
        approvedAt: new Date(),
      }
    : {};

  return getDb().inspectionAnswer.upsert({
    where: { inspectionId_questionId: { inspectionId, questionId } },
    create: {
      inspectionId,
      questionId,
      value: dto.value,
      result: dto.result ?? 'NOT_INSPECTED',
      comment: dto.comment,
      ...approvalUpdate,
    },
    update: {
      value: dto.value,
      result: dto.result,
      comment: dto.comment,
      ...approvalUpdate,
    },
  });
}
