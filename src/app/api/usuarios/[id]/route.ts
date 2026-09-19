import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requerirAdmin, hashPassword } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  await requerirAdmin();
  const body = await request.json();

  const data: Record<string, unknown> = {
    nombre: body.nombre,
    rol: body.rol === 'ADMIN' ? 'ADMIN' : 'COLABORADOR',
    tiendaId: body.tiendaId || null,
    activo: body.activo,
  };
  if (body.password) {
    data.passwordHash = await hashPassword(body.password);
  }

  const usuario = await prisma.usuario.update({ where: { id: params.id }, data });
  return NextResponse.json({ ...usuario, passwordHash: undefined });
}
