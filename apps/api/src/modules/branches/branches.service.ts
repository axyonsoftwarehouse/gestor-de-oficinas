import { Injectable, NotFoundException } from '@nestjs/common';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateBranchDto } from './dto/create-branch.dto';
import type { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.client.branch.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  create(dto: CreateBranchDto) {
    return this.prisma.client.branch.create({
      data: { tenantId: requireTenantId(), name: dto.name, code: dto.code },
    });
  }

  async update(id: string, dto: UpdateBranchDto) {
    await this.assertBranch(id);
    return this.prisma.client.branch.update({
      where: { id },
      data: { name: dto.name, code: dto.code },
    });
  }

  async remove(id: string) {
    await this.assertBranch(id);
    await this.prisma.client.branch.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  private async assertBranch(id: string): Promise<void> {
    const branch = await this.prisma.client.branch.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!branch) throw new NotFoundException('Filial não encontrada');
  }
}
