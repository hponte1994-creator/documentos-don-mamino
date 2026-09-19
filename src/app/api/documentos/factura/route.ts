import { NextRequest, NextResponse } from 'next/server';
import { requerirSesion } from '@/lib/auth';
import { procesarFactura } from '@/lib/procesamiento';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const sesion = await requerirSesion();
  const formData = await request.formData();
  const archivo = formData.get('archivo');

  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: 'Falta la imagen de la factura' }, { status: 400 });
  }

  const selloManualRaw = formData.get('selloManual');
  const selloManual =
    selloManualRaw === 'AZUL' || selloManualRaw === 'ROJO' || selloManualRaw === 'SIN_SELLO' ? selloManualRaw : undefined;

  const factura = await procesarFactura({ archivo, selloManual, ctx: { usuarioId: sesion.id, tiendaId: sesion.tiendaId } });
  return NextResponse.json(factura);
}
