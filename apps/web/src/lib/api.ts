import { clearSession, getSession, setSession, type Session } from './session';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

let refreshInFlight: Promise<Session | null> | null = null;

/** Tenta renovar a sessão usando o refresh token (uma vez por vez). */
async function refreshSession(): Promise<Session | null> {
  const current = getSession();
  if (!current?.refreshToken) return null;
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<Session>;
    const next: Session = { ...current, ...data };
    setSession(next);
    return next;
  } catch {
    return null;
  }
}

function redirectToLogin(): void {
  clearSession();
  if (typeof window !== 'undefined') window.location.href = '/login';
}

async function execute<T>(
  path: string,
  options: ApiFetchOptions,
  allowRefresh: boolean,
): Promise<T> {
  const { skipAuth, headers, ...rest } = options;
  const finalHeaders = new Headers(headers);
  if (!finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const session = getSession();
    if (session?.accessToken) {
      finalHeaders.set('Authorization', `Bearer ${session.accessToken}`);
    }
  }

  const response = await fetch(`${API_URL}${path}`, { ...rest, headers: finalHeaders });

  if (response.status === 401 && !skipAuth && allowRefresh) {
    refreshInFlight = refreshInFlight ?? refreshSession();
    const refreshed = await refreshInFlight;
    refreshInFlight = null;
    if (refreshed) return execute<T>(path, options, false);
    redirectToLogin();
    throw new ApiError('Sessão expirada', 401);
  }

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const parsed = JSON.parse(text) as { message?: string | string[] };
      if (parsed.message) {
        message = Array.isArray(parsed.message)
          ? parsed.message.join(', ')
          : parsed.message;
      }
    } catch {
      // mantém o texto original
    }
    throw new ApiError(message || `Erro ${response.status}`, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  return execute<T>(path, options, true);
}

export async function apiFetchText(
  path: string,
  allowRefresh = true,
): Promise<string> {
  const session = getSession();
  const headers = new Headers();
  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, { headers });

  if (response.status === 401 && allowRefresh) {
    refreshInFlight = refreshInFlight ?? refreshSession();
    const refreshed = await refreshInFlight;
    refreshInFlight = null;
    if (refreshed) return apiFetchText(path, false);
  }

  if (!response.ok) {
    throw new ApiError(await response.text(), response.status);
  }
  return response.text();
}

export function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}
