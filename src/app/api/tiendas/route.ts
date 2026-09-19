import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requerirAdmin } from '@/lib/auth';

export async function GET() {
  await requerirAdmin();
  const tiendas = await prisma.tienda.findMany({ orderBy: { nombre: 'asc' } });
  return NextResponse.json(tiendas);
}

export async function POST(request: NextRequest) {
  await requerirAdmin();
  const body = await request.json();
  if (!body.nombre) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
  const tienda = await prisma.tienda.create({ data: { nombre: body.nombre } });
  return NextResponse.json(tienda);
}
