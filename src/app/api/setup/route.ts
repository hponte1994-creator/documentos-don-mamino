import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

/**
 * Endpoint de arranque: crea el primer usuario administrador.
 * Se visita UNA sola vez, justo después del primer despliegue, con la
 * clave secreta como parámetro: /api/setup?clave=TU_SETUP_SECRET
 * Se desactiva solo en cuanto ya existe al menos un usuario en la base.
 */
export async function GET(request: NextRequest) {
  const clave = request.nextUrl.searchParams.get('clave');

  if (!process.env.SETUP_SECRET || clave !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Clave de instalación inválida' }, { status: 403 });
  }

  const totalUsuarios = await prisma.usuario.count();
  if (totalUsuarios > 0) {
    return NextResponse.json({ mensaje: 'Ya existe al menos un usuario. Este endpoint ya no crea más administradores.' });
  }

  const passwordTemporal = 'DonMamino2025';
  const admin = await prisma.usuario.create({
    data: {
      username: 'admin',
      passwordHash: await hashPassword(passwordTemporal),
      nombre: 'Administrador',
      rol: 'ADMIN',
    },
  });

  return NextResponse.json({
    mensaje: 'Usuario administrador creado. Inicia sesión y cambia la contraseña desde Usuarios.',
    usuario: admin.username,
    passwordTemporal,
  });
}
