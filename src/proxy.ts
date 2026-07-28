import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next 16 renombró `middleware` a `proxy` (middleware.ts está deprecado).
 * Va en src/ porque el proyecto usa src/app — el archivo debe quedar al mismo
 * nivel que `app`. Ref: node_modules/next/dist/docs/01-app/03-api-reference/
 * 03-file-conventions/proxy.md
 *
 * Esto es solo UX: evita pintar el panel para después rebotar. La seguridad
 * real la hace el backend validando el JWT en cada request — acá solo se mira
 * que la cookie exista, no que sea válida ni que no haya vencido.
 */

const SESSION_COOKIE = 'mn_session';
const PUBLIC_PATHS = ['/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  if (isPublic) return NextResponse.next();

  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  /**
   * Sin matcher, proxy corre en TODAS las requests, incluidos _next/static,
   * _next/image y los assets de public/ — y el redirect dejaría la propia
   * pantalla de login sin CSS. La landing pública ("/") queda excluida
   * explícitamente para que siga siendo accesible sin sesión.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|images|api|$).*)',
  ],
};
