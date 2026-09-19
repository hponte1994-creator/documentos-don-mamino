import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requerirAdmin, hashPassword } from '@/lib/auth';

export async function GET() {
  await requerirAdmin();
  const usuarios = await prisma.usuario.findMany({ include: { tienda: true }, orderBy: { nombre: 'asc' } });
  return NextResponse.json(usuarios.map((u) => ({ ...u, passwordHash: undefined })));
}

export async function POST(request: NextRequest) {
  await requerirAdmin();
  const body = await request.json();

  if (!body.username || !body.password || !body.nombre) {
    return NextResponse.json({ error: 'Usuario, contraseña y nombre son obligatorios' }, { status: 400 });
  }

  const username = body.username.trim().toLowerCase();
  const existente = await prisma.usuario.findUnique({ where: { username } });
  if (existente) return NextResponse.json({ error: 'Ese nombre de usuario ya existe' }, { status: 409 });

  const usuario = await prisma.usuario.create({
    data: {
      username,
      passwordHash: await hashPassword(body.password),
      nombre: body.nombre,
      rol: body.rol === 'ADMIN' ? 'ADMIN' : 'COLABORADOR',
      tiendaId: body.tiendaId || null,
    },
  });

  return NextResponse.json({ ...usuario, passwordHash: undefined });
}
