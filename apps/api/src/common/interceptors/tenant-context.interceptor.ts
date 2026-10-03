import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { runWithTenant } from '@gestor/database';
import type { AuthUser } from '../interfaces/auth-user.interface';

interface RequestWithContext {
  user?: AuthUser;
  header?: (name: string) => string | undefined;
}

/**
 * Abre o contexto de tenant (AsyncLocalStorage) para a execução do handler.
 *
 * Roda após os guards, então já enxerga `req.user` populado pelo JwtStrategy.
 * O fallback por header `x-tenant-id` serve apenas para desenvolvimento.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const user = request.user;
    const tenantId = user?.tenantId ?? request.header?.('x-tenant-id');

    if (!tenantId) return next.handle();

    return new Observable((subscriber) => {
      runWithTenant({ tenantId, userId: user?.userId }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
