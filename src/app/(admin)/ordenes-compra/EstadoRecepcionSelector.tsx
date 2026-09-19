'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EstadoRecepcionSelector({ id, valor }: { id: string; valor: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  async function cambiar(nuevo: string) {
    setCargando(true);
    await fetch(`/api/ordenes-compra/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estadoRecepcion: nuevo }),
    });
    setCargando(false);
    router.refresh();
  }

  return (
    <select
      defaultValue={valor}
      disabled={cargando}
      onChange={(e) => cambiar(e.target.value)}
      className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
    >
      <option value="PENDIENTE">Pendiente</option>
      <option value="PARCIAL">Parcial</option>
      <option value="RECIBIDO">Recibido</option>
    </select>
  );
}
