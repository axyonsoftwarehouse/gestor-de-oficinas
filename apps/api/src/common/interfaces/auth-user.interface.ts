export interface AuthUser {
  userId: string;
  tenantId: string;
  membershipId: string;
  email: string;
  name: string;
  permissions: string[];
  isPlatformAdmin: boolean;
}
