import { NextRequest, NextResponse } from 'next/server';
import { requerirAdmin } from '@/lib/auth';
import { generarExcel } from '@/lib/excel';

export async function GET(request: NextRequest) {
  await requerirAdmin();
  const { searchParams } = new URL(request.url);
  const desde = searchParams.get('desde');
  const hasta = searchParams.get('hasta');

  const buffer = await generarExcel(desde ? new Date(desde) : undefined, hasta ? new Date(hasta) : undefined);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="documentos-don-mamino-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
