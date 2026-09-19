'use client';

import { useEffect, useState } from 'react';

type Alias = { id: string; descripcion: string; proveedorRuc: string; proveedor: { razonSocial: string } };
type Producto = { id: string; codigoInterno: string; nombreInterno: string; unidadMedidaInterna: string; alias: Alias[] };

export default function ProductosClient({ productosIniciales }: { productosIniciales: Producto[] }) {
  const [productos, setProductos] = useState(productosIniciales);
  const [busqueda, setBusqueda] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);

  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaUnidad, setNuevaUnidad] = useState('UND');
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState('');

  async function recargar() {
    const res = await fetch('/api/productos');
    if (res.ok) setProductos(await res.json());
  }

  async function crearProducto() {
    setCreando(true);
    setErrorCrear('');
    const res = await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigoInterno: nuevoCodigo, nombreInterno: nuevoNombre, unidadMedidaInterna: nuevaUnidad }),
    });
    setCreando(false);
    if (res.ok) {
      setNuevoCodigo('');
      setNuevoNombre('');
      setNuevaUnidad('UND');
      await recargar();
    } else {
      setErrorCrear((await res.json()).error || 'No se pudo crear');
    }
  }

  async function eliminarProducto(id: string) {
    if (!confirm('¿Eliminar este producto del maestro? Esto no se puede deshacer.')) return;
    await fetch(`/api/productos/${id}`, { method: 'DELETE' });
    await recargar();
  }

  async function eliminarAlias(id: string) {
    await fetch(`/api/alias/${id}`, { method: 'DELETE' });
    await recargar();
  }

  const productosFiltrados = productos.filter((p) => {
    const texto = busqueda.toLowerCase();
    return (
      p.codigoInterno.toLowerCase().includes(texto) ||
      p.nombreInterno.toLowerCase().includes(texto) ||
      p.alias.some((a) => a.descripcion.toLowerCase().includes(texto))
    );
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-marca-oscuro">Maestro de Productos</h1>

      <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-gray-600">Nuevo producto</p>
        <div className="flex flex-wrap gap-2">
          <input
            placeholder="Código interno"
            value={nuevoCodigo}
            onChange={(e) => setNuevoCodigo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Nombre interno"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Unidad"
            value={nuevaUnidad}
            onChange={(e) => setNuevaUnidad(e.target.value)}
            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={crearProducto}
            disabled={creando || !nuevoCodigo || !nuevoNombre}
            className="rounded-lg bg-marca px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Agregar
          </button>
        </div>
        {errorCrear && <p className="mt-2 text-sm text-red-600">{errorCrear}</p>}
      </div>

      <input
        placeholder="Buscar por código, nombre o alias..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />

      <div className="space-y-2">
        {productosFiltrados.map((p) => (
          <div key={p.id} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-marca-oscuro">{p.codigoInterno}</span>{' '}
                <span className="text-gray-700">{p.nombreInterno}</span>{' '}
                <span className="text-xs text-gray-400">({p.unidadMedidaInterna})</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setExpandido(expandido === p.id ? null : p.id)} className="text-xs font-semibold text-marca underline">
                  {p.alias.length} alias
                </button>
                <button onClick={() => eliminarProducto(p.id)} className="text-xs font-semibold text-red-600">
                  Eliminar
                </button>
              </div>
            </div>
            {expandido === p.id && (
              <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
                {p.alias.length === 0 && <p className="text-xs text-gray-400">Sin alias todavía.</p>}
                {p.alias.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-xs">
                    <span>
                      "{a.descripcion}" — {a.proveedor.razonSocial} ({a.proveedorRuc})
                    </span>
                    <button onClick={() => eliminarAlias(a.id)} className="text-red-500">
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {productosFiltrados.length === 0 && <p className="py-6 text-center text-gray-400">No hay productos que coincidan.</p>}
      </div>
    </div>
  );
}
