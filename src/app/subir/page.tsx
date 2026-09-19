import { obtenerSesion } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SubirClient from './SubirClient';

export default async function SubirPage() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect('/login');
  return <SubirClient nombreUsuario={sesion.nombre} />;
}
