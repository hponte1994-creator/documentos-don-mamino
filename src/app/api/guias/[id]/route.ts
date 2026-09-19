import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requerirAdmin } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  await requerirAdmin();
  const body = await request.json();
  const guia = await prisma.guiaRemision.update({
    where: { id: params.id },
    data: {
      numeroGuia: body.numeroGuia || null,
      facturaRelacionada: body.facturaRelacionada || null,
    },
  });
  return NextResponse.json(guia);
}
