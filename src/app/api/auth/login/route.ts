import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verificarPassword, crearSesion } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'Usuario y contraseña son obligatorios' }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({ where: { username: username.trim().toLowerCase() } });

  if (!usuario || !usuario.activo) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  const passwordValido = await verificarPassword(password, usuario.passwordHash);
  if (!passwordValido) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  await crearSesion({
    id: usuario.id,
    username: usuario.username,
    nombre: usuario.nombre,
    rol: usuario.rol,
    tiendaId: usuario.tiendaId,
  });

  return NextResponse.json({ ok: true, rol: usuario.rol });
}
