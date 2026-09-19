'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { comprimirImagen } from '@/lib/comprimirImagen';
import { formatearSoles } from '@/lib/formato';

type TipoDocumento = 'FACTURA' | 'NOTA_CREDITO' | 'GUIA' | 'ORDEN_COMPRA';

const CONFIG_TIPO: Record<TipoDocumento, { etiqueta: string; endpoint: string; leeConIA: boolean }> = {
  FACTURA: { etiqueta: 'Factura', endpoint: '/api/documentos/factura', leeConIA: true },
  NOTA_CREDITO: { etiqueta: 'Nota de Crédito', endpoint: '/api/documentos/nota-credito', leeConIA: true },
  ORDEN_COMPRA: { etiqueta: 'Orden de Compra', endpoint: '/api/documentos/orden-compra', leeConIA: true },
  GUIA: { etiqueta: 'Guía de Remisión', endpoint: '/api/documentos/guia', leeConIA: false },
};

type EstadoItem = 'en_cola' | 'comprimiendo' | 'leyendo' | 'listo' | 'advertencia' | 'error';

type SelloManual = 'AZUL' | 'ROJO' | 'SIN_SELLO';

type ItemSubida = {
  id: string;
  tipo: TipoDocumento;
  archivo: File;
  archivoParaSubir?: File;
  previewUrl: string;
  estado: EstadoItem;
  resumen?: string;
  error?: string;
  selloManual?: SelloManual | null;
};

const MAX_CONCURRENTE = 3;

function resumirResultado(tipo: TipoDocumento, resultado: any): { resumen: string; advertencia?: string } {
  if (tipo === 'GUIA') {
    return { resumen: resultado.numeroGuia ? `Guía ${resultado.numeroGuia}` : 'Guía guardada' };
  }
  if (resultado.estadoProcesamiento === 'ERROR') {
    return { resumen: 'No se pudo leer la imagen', advertencia: resultado.errorProcesamiento || 'La foto quedó guardada, revísala manualmente.' };
  }
  if (tipo === 'FACTURA') {
    const sello = resultado.selloColor === 'AZUL' ? 'sello azul' : resultado.selloColor === 'ROJO' ? 'sello rojo' : 'sin sello';
    return {
      resumen: `${resultado.numero} · ${formatearSoles(resultado.importeTotal)} · ${sello}`,
      advertencia: resultado.errorProcesamiento || undefined,
    };
  }
  if (tipo === 'NOTA_CREDITO') {
    return {
      resumen: `${resultado.numero} · rectifica factura ${resultado.facturaNumero}`,
      advertencia: resultado.errorProcesamiento || undefined,
    };
  }
  return { resumen: `${resultado.numero} · ${formatearSoles(resultado.montoTotal)}` };
}

export default function SubirClient({ nombreUsuario }: { nombreUsuario: string }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoDocumento>('FACTURA');
  const [selloManual, setSelloManual] = useState<SelloManual | null>(null);
  const [items, setItems] = useState<ItemSubida[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const enVueloRef = useRef(0);
  const colaRef = useRef<string[]>([]);
  const itemsRef = useRef<ItemSubida[]>([]);
  itemsRef.current = items;

  function actualizarItem(id: string, cambios: Partial<ItemSubida>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...cambios } : it)));
  }

  function intentarSiguiente() {
    while (enVueloRef.current < MAX_CONCURRENTE && colaRef.current.length > 0) {
      const id = colaRef.current.shift()!;
      enVueloRef.current += 1;
      procesarItem(id).finally(() => {
        enVueloRef.current -= 1;
        intentarSiguiente();
      });
    }
  }

  async function procesarItem(id: string) {
    const item = itemsRef.current.find((it) => it.id === id);
    if (!item) return;

    try {
      let archivoParaSubir = item.archivoParaSubir;
      if (!archivoParaSubir) {
        actualizarItem(id, { estado: 'comprimiendo' });
        archivoParaSubir = await comprimirImagen(item.archivo);
        actualizarItem(id, { archivoParaSubir });
      }

      actualizarItem(id, { estado: 'leyendo' });

      const formData = new FormData();
      formData.append('archivo', archivoParaSubir);
      if (item.selloManual) formData.append('selloManual', item.selloManual);

      const config = CONFIG_TIPO[item.tipo];
      const respuesta = await fetch(config.endpoint, { method: 'POST', body: formData });
      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo subir el documento');
      }
      const resultado = await respuesta.json();
      const { resumen, advertencia } = resumirResultado(item.tipo, resultado);
      actualizarItem(id, { estado: advertencia ? 'advertencia' : 'listo', resumen, error: advertencia });
    } catch (error) {
      actualizarItem(id, {
        estado: 'error',
        error: error instanceof Error ? error.message : 'Error de conexión',
      });
    }
  }

  function agregarArchivos(archivos: FileList | null) {
    if (!archivos || archivos.length === 0) return;
    const nuevos: ItemSubida[] = Array.from(archivos).map((archivo) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tipo,
      archivo,
      previewUrl: URL.createObjectURL(archivo),
      estado: 'en_cola' as const,
      selloManual: tipo === 'FACTURA' ? selloManual : null,
    }));
    const listaActualizada = [...nuevos, ...itemsRef.current];
    itemsRef.current = listaActualizada;
    setItems(listaActualizada);
    colaRef.current.push(...nuevos.map((n) => n.id));
    intentarSiguiente();
  }

  function reintentar(id: string) {
    actualizarItem(id, { estado: 'en_cola', error: undefined });
    colaRef.current.push(id);
    intentarSiguiente();
  }

  const listas = items.filter((i) => i.estado === 'listo' || i.estado === 'advertencia').length;
  const leyendo = items.filter((i) => i.estado === 'leyendo' || i.estado === 'comprimiendo').length;
  const enCola = items.filter((i) => i.estado === 'en_cola').length;
  const conError = items.filter((i) => i.estado === 'error').length;

  async function salir() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-marca px-4 py-3 text-white shadow">
        <div>
          <h1 className="text-lg font-bold">Subir documento</h1>
          <p className="text-xs text-marca-claro">{nombreUsuario}</p>
        </div>
        <button onClick={salir} className="rounded-lg bg-marca-oscuro px-3 py-2 text-xs font-semibold">
          Salir
        </button>
      </header>

      <div className="px-4 py-4">
        <p className="mb-2 text-sm font-medium text-gray-700">Tipo de documento</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(CONFIG_TIPO) as TipoDocumento[]).map((t) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition ${
                tipo === t ? 'border-marca bg-marca text-white' : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              {CONFIG_TIPO[t].etiqueta}
            </button>
          ))}
        </div>

        {tipo === 'FACTURA' && (
          <div className="mt-3">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Sello del documento <span className="text-gray-400">(opcional, tú lo ves mejor que la IA)</span>
            </p>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { valor: null, etiqueta: '🤖 Auto' },
                  { valor: 'AZUL' as const, etiqueta: '🔵 Azul' },
                  { valor: 'ROJO' as const, etiqueta: '🔴 Rojo' },
                  { valor: 'SIN_SELLO' as const, etiqueta: '⚪ Ninguno' },
                ] as const
              ).map((op) => (
                <button
                  key={op.etiqueta}
                  onClick={() => setSelloManual(op.valor)}
                  className={`rounded-lg border-2 px-2 py-2 text-xs font-semibold transition ${
                    selloManual === op.valor ? 'border-marca bg-marca text-white' : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {op.etiqueta}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-marca-oro py-5 text-lg font-bold text-white shadow active:opacity-90"
        >
          📷 Tomar / elegir fotos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => {
            agregarArchivos(e.target.files);
            e.target.value = '';
          }}
        />

        {items.length > 0 && (
          <p className="mt-3 text-center text-sm text-gray-600">
            {listas} listas · {leyendo} leyendo · {enCola} en cola{conError > 0 ? ` · ${conError} con error` : ''}
          </p>
        )}

        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
              <img src={item.previewUrl} alt="" className="h-14 w-14 flex-shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-500">{CONFIG_TIPO[item.tipo].etiqueta}</p>
                {item.estado === 'en_cola' && <p className="text-sm text-gray-400">En cola…</p>}
                {item.estado === 'comprimiendo' && <p className="text-sm text-gray-500">Comprimiendo…</p>}
                {item.estado === 'leyendo' && (
                  <p className="text-sm text-marca">{CONFIG_TIPO[item.tipo].leeConIA ? 'Leyendo con IA…' : 'Subiendo…'}</p>
                )}
                {item.estado === 'listo' && <p className="truncate text-sm text-green-700">{item.resumen}</p>}
                {item.estado === 'advertencia' && (
                  <div>
                    <p className="truncate text-sm text-amber-700">{item.resumen}</p>
                    <p className="truncate text-xs text-amber-600">{item.error}</p>
                  </div>
                )}
                {item.estado === 'error' && <p className="truncate text-sm text-red-600">{item.error}</p>}
              </div>
              {item.estado === 'error' && (
                <button
                  onClick={() => reintentar(item.id)}
                  className="flex-shrink-0 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Reintentar
                </button>
              )}
              {(item.estado === 'listo' || item.estado === 'advertencia') && (
                <span className="flex-shrink-0 text-xl">{item.estado === 'listo' ? '✅' : '⚠️'}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
