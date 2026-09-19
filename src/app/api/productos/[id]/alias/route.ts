import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requerirAdmin } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  await requerirAdmin();
  const body = await request.json();
  const ruc = (body.proveedorRuc as string)?.trim();
  const descripcion = (body.descripcion as string)?.trim().toUpperCase();

  if (!ruc || !descripcion) {
    return NextResponse.json({ error: 'RUC del proveedor y descripción son obligatorios' }, { status: 400 });
  }

  await prisma.proveedor.upsert({
    where: { ruc },
    update: {},
    create: { ruc, razonSocial: body.proveedorRazonSocial || 'Sin razón social' },
  });

  const alias = await prisma.productoAlias.upsert({
    where: { proveedorRuc_descripcion: { proveedorRuc: ruc, descripcion } },
    update: { productoId: params.id },
    create: { productoId: params.id, proveedorRuc: ruc, descripcion },
  });

  return NextResponse.json(alias);
}
