import { redirect } from 'next/navigation';
import { obtenerSesion } from '@/lib/auth';
import BarraAdmin from '@/components/BarraAdmin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect('/login');
  if (sesion.rol !== 'ADMIN') redirect('/subir');

  return (
    <div className="min-h-screen bg-gray-50">
      <BarraAdmin nombreUsuario={sesion.nombre} />
      <main className="p-4">{children}</main>
    </div>
  );
}
