export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export interface SessionTenant {
  id: string;
  name: string;
  slug: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
  membershipId: string;
  user: SessionUser;
  tenant: SessionTenant;
}

const STORAGE_KEY = 'gestor.session';

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
