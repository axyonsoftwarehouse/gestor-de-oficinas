import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { runWithTenant } from '@gestor/database';

interface AuthenticatedRequest extends Request {
  user?: { sub?: string; tenantId?: string };
}

/**
 * Abre o contexto de tenant para a requisição.
 *
 * No scaffold o tenant vem do header `x-tenant-id`; em produção deve vir do
 * JWT já validado (`req.user.tenantId`). O contexto alimenta a extensão de
 * escopo do Prisma Client.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const request = req as AuthenticatedRequest;
    const tenantId = request.user?.tenantId ?? req.header('x-tenant-id');

    if (!tenantId) {
      next();
      return;
    }

    runWithTenant({ tenantId, userId: request.user?.sub }, () => next());
  }
}
