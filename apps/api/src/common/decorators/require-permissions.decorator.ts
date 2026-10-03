import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/** Exige que o usuário possua todas as permissões informadas (ex.: `invoice.approve`). */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
