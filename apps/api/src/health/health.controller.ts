import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check(): Promise<{
    status: string;
    service: string;
    db: string;
    timestamp: string;
  }> {
    try {
      await this.prisma.system.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('Banco de dados indisponível');
    }
    return {
      status: 'ok',
      service: 'gestor-oficinas-api',
      db: 'up',
      timestamp: new Date().toISOString(),
    };
  }
}
