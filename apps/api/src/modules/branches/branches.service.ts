import { Injectable } from '@nestjs/common';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateBranchDto } from './dto/create-branch.dto';

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
}
