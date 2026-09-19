import { NextRequest, NextResponse } from 'next/server';
import { requerirSesion } from '@/lib/auth';
import { crearGuiaRemision } from '@/lib/procesamiento';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const sesion = await requerirSesion();
  const formData = await request.formData();
  const archivo = formData.get('archivo');
  const numeroGuia = formData.get('numeroGuia');
  const facturaRelacionada = formData.get('facturaRelacionada');

  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: 'Falta la imagen de la guía' }, { status: 400 });
  }

  const guia = await crearGuiaRemision({
    archivo,
    numeroGuia: typeof numeroGuia === 'string' ? numeroGuia : undefined,
    facturaRelacionada: typeof facturaRelacionada === 'string' ? facturaRelacionada : undefined,
    ctx: { usuarioId: sesion.id, tiendaId: sesion.tiendaId },
  });
  return NextResponse.json(guia);
}
