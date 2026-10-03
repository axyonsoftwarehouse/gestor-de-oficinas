import { requireTenantId } from '@gestor/database';
import { getDb } from '../db/prisma';
import { NotFoundError } from '../http/errors';
import type { CreateBranchDto } from '../dtos/create-branch.dto';
import type { UpdateBranchDto } from '../dtos/update-branch.dto';

export function listBranches() {
  return getDb().branch.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
  });
}

export function createBranch(dto: CreateBranchDto) {
  return getDb().branch.create({
    data: { tenantId: requireTenantId(), name: dto.name, code: dto.code },
  });
}

export async function updateBranch(id: string, dto: UpdateBranchDto) {
  await assertBranch(id);
  return getDb().branch.update({
    where: { id },
    data: { name: dto.name, code: dto.code },
  });
}

export async function removeBranch(id: string): Promise<{ success: true }> {
  await assertBranch(id);
  await getDb().branch.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return { success: true };
}

async function assertBranch(id: string): Promise<void> {
  const branch = await getDb().branch.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!branch) throw new NotFoundError('Filial não encontrada');
}
