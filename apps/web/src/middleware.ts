import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const PUBLIC_PATHS = ['/login'];

/**
 * Protege as rotas privadas checando o cookie de sessão do Better Auth.
 * Só lê o cookie (Edge-safe); a validação real ocorre no servidor.
 */
export function middleware(request: NextRequest): NextResponse {
  // Ativa a proteção só quando o Better Auth estiver configurado.
  // Enquanto o web não for readaptado (Fase 4), evita redirecionar tudo.
  if (!process.env.BETTER_AUTH_SECRET) {
    return NextResponse.next({ request });
  }

  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api');
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!isApi) {
    if (!sessionCookie && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = '';
      return NextResponse.redirect(url);
    }
    if (sessionCookie && isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
