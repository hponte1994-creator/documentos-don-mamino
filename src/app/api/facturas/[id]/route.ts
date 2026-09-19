import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requerirAdmin } from '@/lib/auth';

const MAPA_ACCION = {
  AZUL: { estadoContable: 'CONFORME', accionContable: 'PAGAR_TOTAL' },
  ROJO: { estadoContable: 'OBSERVADA', accionContable: 'SOLICITAR_NOTA_CREDITO' },
  SIN_SELLO: { estadoContable: 'SIN_SELLO', accionContable: 'PENDIENTE_REVISION' },
} as const;

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  await requerirAdmin();
  const factura = await prisma.factura.findUnique({
    where: { id: params.id },
    include: { lineas: { include: { producto: true } }, notasCredito: true },
  });
  if (!factura) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  return NextResponse.json(factura);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  await requerirAdmin();
  const body = await request.json();

  const selloColor = body.selloColor as keyof typeof MAPA_ACCION | undefined;
  const mapa = selloColor ? MAPA_ACCION[selloColor] : undefined;

  const factura = await prisma.factura.update({
    where: { id: params.id },
    data: {
      numero: body.numero,
      fechaEmision: body.fechaEmision ? new Date(body.fechaEmision) : null,
      fechaVencimiento: body.fechaVencimiento ? new Date(body.fechaVencimiento) : null,
      proveedorRuc: body.proveedorRuc,
      proveedorRazonSocial: body.proveedorRazonSocial,
      clienteRuc: body.clienteRuc || null,
      clienteRazonSocial: body.clienteRazonSocial || null,
      valorVenta: body.valorVenta === '' ? null : body.valorVenta,
      igv: body.igv === '' ? null : body.igv,
      importeTotal: body.importeTotal === '' ? null : body.importeTotal,
      formaPago: body.formaPago || null,
      moneda: body.moneda,
      ...(selloColor ? { selloColor, estadoContable: mapa!.estadoContable, accionContable: mapa!.accionContable } : {}),
    },
  });

  return NextResponse.json(factura);
}
