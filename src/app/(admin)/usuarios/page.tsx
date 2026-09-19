import { prisma } from '@/lib/prisma';
import UsuariosClient from './UsuariosClient';

export default async function UsuariosPage() {
  const [usuarios, tiendas] = await Promise.all([
    prisma.usuario.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.tienda.findMany({ orderBy: { nombre: 'asc' } }),
  ]);

  return (
    <UsuariosClient
      usuariosIniciales={usuarios.map((u) => ({
        id: u.id,
        username: u.username,
        nombre: u.nombre,
        rol: u.rol,
        activo: u.activo,
        tiendaId: u.tiendaId,
      }))}
      tiendasIniciales={tiendas.map((t) => ({ id: t.id, nombre: t.nombre }))}
    />
  );
}
