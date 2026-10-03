import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'gestor-oficinas-api',
      timestamp: new Date().toISOString(),
    };
  }
}
