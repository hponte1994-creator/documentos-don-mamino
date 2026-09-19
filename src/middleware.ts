import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'dm_session';
const RUTAS_SOLO_ADMIN = [
  '/facturas',
  '/notas-credito',
  '/guias',
  '/ordenes-compra',
  '/homologacion',
  '/productos',
  '/alias',
  '/usuarios',
  '/tiendas',
  '/exportar',
];

async function leerSesion(token: string | undefined) {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { rol?: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const sesion = await leerSesion(token);

  if (!sesion) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const rutaSinApi = pathname.startsWith('/api/') ? pathname.slice(4) : pathname;
  const esRutaAdmin = RUTAS_SOLO_ADMIN.some((ruta) => rutaSinApi.startsWith(ruta));
  if (esRutaAdmin && sesion.rol !== 'ADMIN') {
    const url = request.nextUrl.clone();
    url.pathname = '/subir';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
