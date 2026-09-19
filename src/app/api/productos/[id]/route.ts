import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requerirAdmin } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  await requerirAdmin();
  const body = await request.json();
  const producto = await prisma.producto.update({
    where: { id: params.id },
    data: {
      codigoInterno: body.codigoInterno,
      nombreInterno: body.nombreInterno,
      unidadMedidaInterna: body.unidadMedidaInterna,
    },
  });
  return NextResponse.json(producto);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await requerirAdmin();
  await prisma.producto.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
