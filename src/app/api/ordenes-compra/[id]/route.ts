import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requerirAdmin } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  await requerirAdmin();
  const body = await request.json();

  if (body.accion === 'vincular') {
    const orden = await prisma.ordenCompra.findUnique({ where: { id: params.id } });
    if (!orden) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    const factura = await prisma.factura.findUnique({
      where: { proveedorRuc_numero: { proveedorRuc: orden.proveedorRuc, numero: body.facturaNumero } },
    });
    if (!factura) return NextResponse.json({ error: 'No se encontró una factura con ese número para este proveedor' }, { status: 404 });
    const actualizada = await prisma.ordenCompra.update({ where: { id: params.id }, data: { facturaId: factura.id } });
    return NextResponse.json(actualizada);
  }

  if (body.estadoRecepcion) {
    const actualizada = await prisma.ordenCompra.update({
      where: { id: params.id },
      data: { estadoRecepcion: body.estadoRecepcion },
    });
    return NextResponse.json(actualizada);
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
}
