import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const COOKIE_NAME = 'dm_session';
const DURACION_SESION = 60 * 60 * 24 * 30; // 30 días

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('Falta la variable de entorno AUTH_SECRET');
  return new TextEncoder().encode(secret);
}

export type SesionUsuario = {
  id: string;
  username: string;
  nombre: string;
  rol: 'ADMIN' | 'COLABORADOR';
  tiendaId: string | null;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verificarPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function crearSesion(usuario: SesionUsuario) {
  const token = await new SignJWT(usuario)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION}s`)
    .sign(getSecretKey());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DURACION_SESION,
  });
}

export async function cerrarSesion() {
  cookies().delete(COOKIE_NAME);
}

export async function obtenerSesion(): Promise<SesionUsuario | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SesionUsuario;
  } catch {
    return null;
  }
}

export async function requerirSesion(): Promise<SesionUsuario> {
  const sesion = await obtenerSesion();
  if (!sesion) throw new Error('NO_AUTENTICADO');
  return sesion;
}

export async function requerirAdmin(): Promise<SesionUsuario> {
  const sesion = await requerirSesion();
  if (sesion.rol !== 'ADMIN') throw new Error('NO_AUTORIZADO');
  return sesion;
}
