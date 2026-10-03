import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { firstValueFrom, from, type Observable } from 'rxjs';
import { runWithTenant } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import { prismaContext } from '../../prisma/prisma-context';
import type { AuthUser } from '../interfaces/auth-user.interface';

interface RequestWithContext {
  user?: AuthUser;
  header?: (name: string) => string | undefined;
}

/**
 * Abre o contexto de tenant (AsyncLocalStorage), define `app.current_tenant`
 * na transação do PostgreSQL (habilitando o RLS) e executa o handler dentro
 * dessa transação. Roda após os guards, então já enxerga `req.user`.
 *
 * O fallback por header `x-tenant-id` serve apenas para desenvolvimento.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const user = request.user;
    const tenantId = user?.tenantId ?? request.header?.('x-tenant-id');

    if (!tenantId) return next.handle();

    const run = async (): Promise<unknown> =>
      this.prisma.base.$transaction(
        async (tx) => {
          await tx.$executeRaw`select set_config('app.current_tenant', ${tenantId}, true)`;
          return runWithTenant({ tenantId, userId: user?.userId }, () =>
            prismaContext.run(tx, () => firstValueFrom(next.handle())),
          );
        },
        { timeout: 30000, maxWait: 10000 },
      );

    return from(run());
  }
}
