'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VincularFactura({ notaId, facturaNumero }: { notaId: string; facturaNumero: string }) {
  const router = useRouter();
  const [numero, setNumero] = useState(facturaNumero);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function vincular() {
    setCargando(true);
    setError('');
    const res = await fetch(`/api/notas-credito/${notaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'vincular', facturaNumero: numero }),
    });
    setCargando(false);
    if (res.ok) router.refresh();
    else setError((await res.json()).error || 'No se pudo vincular');
  }

  return (
    <div className="rounded-xl bg-amber-50 p-4">
      <p className="mb-2 text-sm font-semibold text-amber-800">Esta nota no está vinculada a ninguna factura</p>
      <div className="flex gap-2">
        <input
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="Número de factura"
          className="flex-1 rounded-lg border border-amber-300 px-3 py-2 text-sm"
        />
        <button onClick={vincular} disabled={cargando} className="rounded-lg bg-marca px-4 py-2 text-sm font-semibold text-white">
          {cargando ? 'Vinculando…' : 'Vincular'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
