import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import type { QueryInspectionDto } from './dto/query-inspection.dto';
import type { StartInspectionDto } from './dto/start-inspection.dto';
import type { UpdateInspectionDto } from './dto/update-inspection.dto';
import type { UpsertAnswerDto } from './dto/upsert-answer.dto';

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

@Injectable()
export class InspectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async start(dto: StartInspectionDto, inspectorId: string) {
    const version = await this.prisma.client.inspectionTemplateVersion.findFirst({
      where: { templateId: dto.templateId },
      orderBy: { version: 'desc' },
      include: { sections: { include: { questions: true } } },
    });
    if (!version) throw new NotFoundException('Template de inspeção não encontrado');

    const questions = version.sections.flatMap((section) => section.questions);

    return this.prisma.client.inspection.create({
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

  async list(query: QueryInspectionDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.InspectionWhereInput = {};
    if (query.vehicleId) where.vehicleId = query.vehicleId;
    if (query.jobCardId) where.jobCardId = query.jobCardId;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.client.inspection.findMany({
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
      this.prisma.client.inspection.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const inspection = await this.prisma.client.inspection.findFirst({
      where: { id },
      include: detailInclude,
    });
    if (!inspection) throw new NotFoundException('Inspeção não encontrada');
    return inspection;
  }

  async update(id: string, dto: UpdateInspectionDto) {
    await this.findOne(id);
    return this.prisma.client.inspection.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes,
        ...(dto.status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
      include: detailInclude,
    });
  }

  complete(id: string) {
    return this.update(id, { status: 'COMPLETED' });
  }

  async upsertAnswer(
    inspectionId: string,
    questionId: string,
    dto: UpsertAnswerDto,
    userId: string,
  ) {
    const inspection = await this.prisma.client.inspection.findFirst({
      where: { id: inspectionId },
      select: { id: true, templateVersionId: true },
    });
    if (!inspection) throw new NotFoundException('Inspeção não encontrada');

    const question = await this.prisma.client.inspectionQuestion.findFirst({
      where: {
        id: questionId,
        section: { versionId: inspection.templateVersionId ?? '' },
      },
      select: { id: true },
    });
    if (!question) {
      throw new NotFoundException('Pergunta não pertence a esta inspeção');
    }

    const approvalUpdate = dto.approvalStatus
      ? {
          approvalStatus: dto.approvalStatus,
          approvedById: dto.approvalStatus === 'PENDING' ? null : userId,
          approvedAt: new Date(),
        }
      : {};

    return this.prisma.client.inspectionAnswer.upsert({
      where: {
        inspectionId_questionId: { inspectionId, questionId },
      },
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
}
