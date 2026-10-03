import { Prisma, requireTenantId } from '@gestor/database';
import { getDb } from '../db/prisma';
import { NotFoundError } from '../http/errors';
import type { CreateInspectionTemplateDto } from '../dtos/create-inspection-template.dto';
import type { QueryInspectionTemplateDto } from '../dtos/query-inspection-template.dto';

const templateDetailInclude = {
  versions: {
    orderBy: { version: 'desc' as const },
    include: {
      sections: {
        orderBy: { sequence: 'asc' as const },
        include: {
          questions: {
            orderBy: { sequence: 'asc' as const },
            include: { options: { orderBy: { sequence: 'asc' as const } } },
          },
        },
      },
    },
  },
} satisfies Prisma.InspectionTemplateInclude;

const versionDetailInclude = {
  sections: {
    orderBy: { sequence: 'asc' as const },
    include: {
      questions: {
        orderBy: { sequence: 'asc' as const },
        include: { options: { orderBy: { sequence: 'asc' as const } } },
      },
    },
  },
} satisfies Prisma.InspectionTemplateVersionInclude;

export function createInspectionTemplate(dto: CreateInspectionTemplateDto) {
  return getDb().inspectionTemplate.create({
    data: {
      tenantId: requireTenantId(),
      name: dto.name,
      description: dto.description,
      versions: {
        create: {
          version: 1,
          publishedAt: new Date(),
          sections: {
            create: dto.sections.map((section, sectionIndex) => ({
              title: section.title,
              displayType: section.displayType ?? 'SECTION',
              sequence: section.sequence ?? sectionIndex,
              questions: {
                create: (section.questions ?? []).map((question, questionIndex) => ({
                  code: question.code,
                  label: question.label,
                  type: question.type,
                  required: question.required ?? false,
                  sequence: question.sequence ?? questionIndex,
                  visibleToCustomer: question.visibleToCustomer ?? true,
                  helpText: question.helpText,
                  options: {
                    create: (question.options ?? []).map((option, optionIndex) => ({
                      label: option.label,
                      value: option.value,
                      sequence: option.sequence ?? optionIndex,
                    })),
                  },
                })),
              },
            })),
          },
        },
      },
    },
    include: templateDetailInclude,
  });
}

export async function listInspectionTemplates(query: QueryInspectionTemplateDto) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.InspectionTemplateWhereInput = {};
  if (query.search) {
    where.name = { contains: query.search, mode: 'insensitive' };
  }

  const [items, total] = await Promise.all([
    getDb().inspectionTemplate.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { versions: true } } },
    }),
    getDb().inspectionTemplate.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function findInspectionTemplate(id: string) {
  const template = await getDb().inspectionTemplate.findFirst({
    where: { id },
    include: templateDetailInclude,
  });
  if (!template) throw new NotFoundError('Template de inspeção não encontrado');
  return template;
}

/** Cria uma nova versão publicada, clonando a última versão. */
export async function publishInspectionTemplate(id: string) {
  await findInspectionTemplate(id);

  const latest = await getDb().inspectionTemplateVersion.findFirst({
    where: { templateId: id },
    orderBy: { version: 'desc' },
    include: {
      sections: { include: { questions: { include: { options: true } } } },
    },
  });
  if (!latest) throw new NotFoundError('Nenhuma versão para publicar');

  return getDb().inspectionTemplateVersion.create({
    data: {
      templateId: id,
      version: latest.version + 1,
      publishedAt: new Date(),
      sections: {
        create: latest.sections.map((section) => ({
          title: section.title,
          displayType: section.displayType,
          sequence: section.sequence,
          questions: {
            create: section.questions.map((question) => ({
              code: question.code,
              label: question.label,
              type: question.type,
              required: question.required,
              sequence: question.sequence,
              visibleToCustomer: question.visibleToCustomer,
              helpText: question.helpText,
              options: {
                create: question.options.map((option) => ({
                  label: option.label,
                  value: option.value,
                  sequence: option.sequence,
                })),
              },
            })),
          },
        })),
      },
    },
    include: versionDetailInclude,
  });
}
