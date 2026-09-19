'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatearFecha } from '@/lib/formato';

export default function GuiaCard({
  guia,
}: {
  guia: { id: string; numeroGuia: string | null; facturaRelacionada: string | null; imagenUrl: string; createdAt: string };
}) {
  const router = useRouter();
  const [numeroGuia, setNumeroGuia] = useState(guia.numeroGuia || '');
  const [facturaRelacionada, setFacturaRelacionada] = useState(guia.facturaRelacionada || '');
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    await fetch(`/api/guias/${guia.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numeroGuia, facturaRelacionada }),
    });
    setGuardando(false);
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      <a href={guia.imagenUrl} target="_blank" rel="noreferrer">
        <img src={guia.imagenUrl} alt="Guía de remisión" className="h-48 w-full object-cover" />
      </a>
      <div className="space-y-2 p-3">
        <p className="text-xs text-gray-400">{formatearFecha(guia.createdAt)}</p>
        <input
          value={numeroGuia}
          onChange={(e) => setNumeroGuia(e.target.value)}
          placeholder="N° de guía"
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        />
        <input
          value={facturaRelacionada}
          onChange={(e) => setFacturaRelacionada(e.target.value)}
          placeholder="Factura relacionada"
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        />
        <button onClick={guardar} disabled={guardando} className="w-full rounded-lg bg-marca py-1.5 text-xs font-semibold text-white">
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
