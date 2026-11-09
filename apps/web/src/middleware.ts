import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const PUBLIC_PATHS = ['/login', '/o'];
/** Somente estas telas mandam o usuário logado para o painel. */
const AUTH_PATHS = ['/login'];
/** Assets que precisam responder sem sessão (o navegador busca antes do login). */
const PUBLIC_ASSETS = ['/manifest.webmanifest', '/icon.svg', '/favicon.ico'];
const MOBILE_UA = /android|iphone|ipad|ipod|iemobile|opera mini|mobile/i;
/** Cookie que mantém o usuário no site completo mesmo acessando pelo celular. */
const VIEW_COOKIE = 'gestor_view';

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Protege as rotas privadas checando o cookie de sessão do Better Auth.
 * Só lê o cookie (Edge-safe); a validação real ocorre no servidor.
 *
 * No celular, a navegação começa no app (`/m`), que é o fluxo da oficina.
 * `?desktop=1` grava um cookie e devolve o site completo (back-office).
 */
export function middleware(request: NextRequest): NextResponse {
  // Ativa a proteção só quando o Better Auth estiver configurado.
  if (!process.env.BETTER_AUTH_SECRET) {
    return NextResponse.next({ request });
  }

  const sessionCookie = getSessionCookie(request);
  const { pathname, searchParams } = request.nextUrl;
  const isApi = pathname.startsWith('/api');
  const isPublic = isPublicPath(pathname);
  const isMobile = MOBILE_UA.test(request.headers.get('user-agent') ?? '');

  if (PUBLIC_ASSETS.includes(pathname)) {
    return NextResponse.next({ request });
  }

  if (!isApi) {
    // Pedido explícito pelo site completo (ou volta ao app).
    const view = searchParams.get('desktop');
    if (view === '1' || view === '0') {
      const response = NextResponse.next({ request });
      response.cookies.set(VIEW_COOKIE, view === '1' ? 'desktop' : 'mobile', {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
      });
      return response;
    }

    if (!sessionCookie && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = '';
      return NextResponse.redirect(url);
    }
    if (sessionCookie && isAuthPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = isMobile ? '/m/hoje' : '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }

    const prefersDesktop = request.cookies.get(VIEW_COOKIE)?.value === 'desktop';
    if (
      sessionCookie &&
      isMobile &&
      !prefersDesktop &&
      !pathname.startsWith('/m') &&
      !pathname.startsWith('/o')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/m/hoje';
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
