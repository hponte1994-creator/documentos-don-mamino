import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requerirAdmin } from '@/lib/auth';

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await requerirAdmin();
  await prisma.productoAlias.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
