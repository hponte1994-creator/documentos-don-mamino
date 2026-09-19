import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requerirAdmin } from '@/lib/auth';
import { guardarAliasYHomologar } from '@/lib/homologacion';

export async function POST(request: NextRequest) {
  await requerirAdmin();
  const body = await request.json();
  const { tipo, lineaId } = body as { tipo: 'FACTURA' | 'NOTA_CREDITO' | 'ORDEN_COMPRA'; lineaId: string };

  let productoId: string = body.productoId;

  if (!productoId && body.nuevoProducto) {
    const existente = await prisma.producto.findUnique({ where: { codigoInterno: body.nuevoProducto.codigoInterno } });
    if (existente) {
      return NextResponse.json({ error: 'Ya existe un producto con ese código interno' }, { status: 409 });
    }
    const nuevo = await prisma.producto.create({
      data: {
        codigoInterno: body.nuevoProducto.codigoInterno,
        nombreInterno: body.nuevoProducto.nombreInterno,
        unidadMedidaInterna: body.nuevoProducto.unidadMedidaInterna || 'UND',
      },
    });
    productoId = nuevo.id;
  }

  if (!productoId) {
    return NextResponse.json({ error: 'Falta indicar el producto a homologar' }, { status: 400 });
  }

  if (tipo === 'FACTURA') {
    const linea = await prisma.facturaLinea.update({
      where: { id: lineaId },
      data: { productoId, estadoHomologacion: 'HOMOLOGADO' },
      include: { factura: true },
    });
    await guardarAliasYHomologar({ productoId, proveedorRuc: linea.factura.proveedorRuc, descripcion: linea.descripcionProveedor });
    return NextResponse.json(linea);
  }

  if (tipo === 'NOTA_CREDITO') {
    const linea = await prisma.notaCreditoLinea.update({
      where: { id: lineaId },
      data: { productoId },
      include: { notaCredito: true },
    });
    await guardarAliasYHomologar({ productoId, proveedorRuc: linea.notaCredito.proveedorRuc, descripcion: linea.nombre });
    return NextResponse.json(linea);
  }

  if (tipo === 'ORDEN_COMPRA') {
    const linea = await prisma.ordenCompraLinea.update({
      where: { id: lineaId },
      data: { productoId },
      include: { ordenCompra: true },
    });
    await guardarAliasYHomologar({ productoId, proveedorRuc: linea.ordenCompra.proveedorRuc, descripcion: linea.descripcion });
    return NextResponse.json(linea);
  }

  return NextResponse.json({ error: 'Tipo de documento no reconocido' }, { status: 400 });
}
