'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FacturaEditable = {
  id: string;
  numero: string;
  fechaEmision: string | null;
  fechaVencimiento: string | null;
  proveedorRuc: string;
  proveedorRazonSocial: string;
  clienteRuc: string | null;
  clienteRazonSocial: string | null;
  valorVenta: string | null;
  igv: string | null;
  importeTotal: string | null;
  formaPago: string | null;
  moneda: string;
  selloColor: 'AZUL' | 'ROJO' | 'SIN_SELLO';
};

function aFechaInput(valor: string | null) {
  if (!valor) return '';
  return valor.slice(0, 10);
}

export default function FacturaEditForm({ factura }: { factura: FacturaEditable }) {
  const router = useRouter();
  const [form, setForm] = useState({
    numero: factura.numero,
    fechaEmision: aFechaInput(factura.fechaEmision),
    fechaVencimiento: aFechaInput(factura.fechaVencimiento),
    proveedorRuc: factura.proveedorRuc,
    proveedorRazonSocial: factura.proveedorRazonSocial,
    clienteRuc: factura.clienteRuc || '',
    clienteRazonSocial: factura.clienteRazonSocial || '',
    valorVenta: factura.valorVenta || '',
    igv: factura.igv || '',
    importeTotal: factura.importeTotal || '',
    formaPago: factura.formaPago || '',
    moneda: factura.moneda,
    selloColor: factura.selloColor,
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  function set<K extends keyof typeof form>(campo: K, valor: (typeof form)[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function guardar() {
    setGuardando(true);
    setMensaje('');
    const res = await fetch(`/api/facturas/${factura.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setGuardando(false);
    if (res.ok) {
      setMensaje('Guardado ✓');
      router.refresh();
    } else {
      setMensaje('Error al guardar');
    }
  }

  const campo = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm';
  const etiqueta = 'mb-1 block text-xs font-semibold text-gray-500';

  return (
    <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={etiqueta}>Número</label>
          <input className={campo} value={form.numero} onChange={(e) => set('numero', e.target.value)} />
        </div>
        <div>
          <label className={etiqueta}>Moneda</label>
          <select className={campo} value={form.moneda} onChange={(e) => set('moneda', e.target.value)}>
            <option value="PEN">Soles (PEN)</option>
            <option value="USD">Dólares (USD)</option>
          </select>
        </div>
        <div>
          <label className={etiqueta}>Fecha emisión</label>
          <input type="date" className={campo} value={form.fechaEmision} onChange={(e) => set('fechaEmision', e.target.value)} />
        </div>
        <div>
          <label className={etiqueta}>Fecha vencimiento</label>
          <input type="date" className={campo} value={form.fechaVencimiento} onChange={(e) => set('fechaVencimiento', e.target.value)} />
        </div>
        <div>
          <label className={etiqueta}>RUC proveedor</label>
          <input className={campo} value={form.proveedorRuc} onChange={(e) => set('proveedorRuc', e.target.value)} />
        </div>
        <div>
          <label className={etiqueta}>Razón social proveedor</label>
          <input className={campo} value={form.proveedorRazonSocial} onChange={(e) => set('proveedorRazonSocial', e.target.value)} />
        </div>
        <div>
          <label className={etiqueta}>RUC cliente</label>
          <input className={campo} value={form.clienteRuc} onChange={(e) => set('clienteRuc', e.target.value)} />
        </div>
        <div>
          <label className={etiqueta}>Razón social cliente</label>
          <input className={campo} value={form.clienteRazonSocial} onChange={(e) => set('clienteRazonSocial', e.target.value)} />
        </div>
        <div>
          <label className={etiqueta}>Forma de pago</label>
          <input className={campo} value={form.formaPago} onChange={(e) => set('formaPago', e.target.value)} />
        </div>
        <div>
          <label className={etiqueta}>Sello estampado</label>
          <select className={campo} value={form.selloColor} onChange={(e) => set('selloColor', e.target.value as any)}>
            <option value="AZUL">🔵 Azul (conforme)</option>
            <option value="ROJO">🔴 Rojo (observada)</option>
            <option value="SIN_SELLO">⚪ Sin sello</option>
          </select>
        </div>
        <div>
          <label className={etiqueta}>Valor venta</label>
          <input type="number" step="0.01" className={campo} value={form.valorVenta} onChange={(e) => set('valorVenta', e.target.value)} />
        </div>
        <div>
          <label className={etiqueta}>IGV</label>
          <input type="number" step="0.01" className={campo} value={form.igv} onChange={(e) => set('igv', e.target.value)} />
        </div>
        <div>
          <label className={etiqueta}>Importe total</label>
          <input type="number" step="0.01" className={campo} value={form.importeTotal} onChange={(e) => set('importeTotal', e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={guardar}
          disabled={guardando}
          className="rounded-lg bg-marca px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {mensaje && <span className="text-sm text-gray-500">{mensaje}</span>}
      </div>
    </div>
  );
}
