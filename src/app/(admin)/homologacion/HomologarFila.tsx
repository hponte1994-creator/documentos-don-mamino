'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Candidato = { productoId: string; codigoInterno: string; nombreInterno: string; puntaje: number };

export default function HomologarFila({
  tipo,
  lineaId,
  descripcion,
  proveedor,
  candidatos,
}: {
  tipo: 'FACTURA' | 'NOTA_CREDITO' | 'ORDEN_COMPRA';
  lineaId: string;
  descripcion: string;
  proveedor: string;
  candidatos: Candidato[];
}) {
  const router = useRouter();
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [codigoInterno, setCodigoInterno] = useState('');
  const [nombreInterno, setNombreInterno] = useState(descripcion);
  const [unidadMedidaInterna, setUnidadMedidaInterna] = useState('UND');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function asignar(productoId?: string) {
    setCargando(true);
    setError('');
    const body: Record<string, unknown> = { tipo, lineaId };
    if (productoId) body.productoId = productoId;
    else body.nuevoProducto = { codigoInterno, nombreInterno, unidadMedidaInterna };

    const res = await fetch('/api/homologacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setCargando(false);
    if (res.ok) router.refresh();
    else setError((await res.json()).error || 'No se pudo homologar');
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-gray-800">{descripcion}</p>
      <p className="mb-2 text-xs text-gray-400">Proveedor: {proveedor}</p>

      {candidatos.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {candidatos.map((c) => (
            <button
              key={c.productoId}
              onClick={() => asignar(c.productoId)}
              disabled={cargando}
              className="rounded-lg border border-marca px-3 py-1.5 text-xs font-medium text-marca hover:bg-marca-claro"
            >
              {c.codigoInterno} · {c.nombreInterno} ({Math.round(c.puntaje * 100)}%)
            </button>
          ))}
        </div>
      )}

      {!mostrarCrear ? (
        <button onClick={() => setMostrarCrear(true)} className="text-xs font-semibold text-gray-500 underline">
          Ninguno coincide, crear producto nuevo
        </button>
      ) : (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <input
            placeholder="Código interno"
            value={codigoInterno}
            onChange={(e) => setCodigoInterno(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
          />
          <input
            placeholder="Nombre interno"
            value={nombreInterno}
            onChange={(e) => setNombreInterno(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
          />
          <input
            placeholder="Unidad (UND, KG...)"
            value={unidadMedidaInterna}
            onChange={(e) => setUnidadMedidaInterna(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
          />
          <button
            onClick={() => asignar()}
            disabled={cargando || !codigoInterno || !nombreInterno}
            className="col-span-3 rounded-lg bg-marca py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {cargando ? 'Creando…' : 'Crear y homologar'}
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
