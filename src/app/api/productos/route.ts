import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requerirAdmin } from '@/lib/auth';

export async function GET() {
  await requerirAdmin();
  const productos = await prisma.producto.findMany({
    include: { alias: { include: { proveedor: true } } },
    orderBy: { nombreInterno: 'asc' },
  });
  return NextResponse.json(productos);
}

export async function POST(request: NextRequest) {
  await requerirAdmin();
  const body = await request.json();

  if (!body.codigoInterno || !body.nombreInterno) {
    return NextResponse.json({ error: 'Código y nombre interno son obligatorios' }, { status: 400 });
  }

  const existente = await prisma.producto.findUnique({ where: { codigoInterno: body.codigoInterno } });
  if (existente) {
    return NextResponse.json({ error: 'Ya existe un producto con ese código interno' }, { status: 409 });
  }

  const producto = await prisma.producto.create({
    data: {
      codigoInterno: body.codigoInterno,
      nombreInterno: body.nombreInterno,
      unidadMedidaInterna: body.unidadMedidaInterna || 'UND',
    },
  });
  return NextResponse.json(producto);
}
