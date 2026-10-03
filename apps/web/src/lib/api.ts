export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

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

function redirectToLogin(): void {
  if (
    typeof window !== 'undefined' &&
    !window.location.pathname.startsWith('/login')
  ) {
    window.location.href = '/login';
  }
}

async function toMessage(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text) as { message?: string | string[] };
    if (parsed.message) {
      return Array.isArray(parsed.message)
        ? parsed.message.join(', ')
        : parsed.message;
    }
  } catch {
    // mantém o texto original
  }
  return text || `Erro ${response.status}`;
}

async function execute<T>(path: string, options: ApiFetchOptions): Promise<T> {
  const { headers, ...rest } = options;
  const finalHeaders = new Headers(headers);
  if (!finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    credentials: 'include',
  });

  if (response.status === 401) {
    redirectToLogin();
    throw new ApiError('Sessão expirada', 401);
  }
  if (!response.ok) {
    throw new ApiError(await toMessage(response), response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  return execute<T>(path, options);
}

export async function apiFetchText(path: string): Promise<string> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
  });
  if (response.status === 401) {
    redirectToLogin();
    throw new ApiError('Sessão expirada', 401);
  }
  if (!response.ok) {
    throw new ApiError(await toMessage(response), response.status);
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
