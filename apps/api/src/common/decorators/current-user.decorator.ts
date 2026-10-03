import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../interfaces/auth-user.interface';

interface RequestWithUser {
  user?: AuthUser;
}

/** Injeta o usuário autenticado (populado pelo JwtStrategy). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user as AuthUser;
  },
);
