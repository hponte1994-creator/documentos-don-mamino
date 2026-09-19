import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatearFecha, formatearSoles } from '@/lib/formato';
import type { Prisma } from '@prisma/client';

const ETIQUETA_SELLO: Record<string, string> = { AZUL: '🔵 Azul', ROJO: '🔴 Rojo', SIN_SELLO: '⚪ Sin sello' };
const ETIQUETA_ACCION: Record<string, string> = {
  PAGAR_TOTAL: 'Pagar total',
  SOLICITAR_NOTA_CREDITO: 'Solicitar N. Crédito',
  PENDIENTE_REVISION: 'Pendiente revisión',
};

export default async function FacturasPage({
  searchParams,
}: {
  searchParams: { desde?: string; hasta?: string; proveedor?: string; estado?: string };
}) {
  const where: Prisma.FacturaWhereInput = {};
  if (searchParams.desde || searchParams.hasta) {
    where.fechaEmision = {};
    if (searchParams.desde) where.fechaEmision.gte = new Date(searchParams.desde);
    if (searchParams.hasta) where.fechaEmision.lte = new Date(searchParams.hasta);
  }
  if (searchParams.proveedor) {
    where.proveedorRazonSocial = { contains: searchParams.proveedor, mode: 'insensitive' };
  }
  if (searchParams.estado) {
    where.estadoContable = searchParams.estado as any;
  }

  const facturas = await prisma.factura.findMany({
    where,
    include: { notasCredito: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-marca-oscuro">Facturas</h1>

      <form className="mb-4 flex flex-wrap gap-2 rounded-xl bg-white p-3 shadow-sm" method="get">
        <input type="date" name="desde" defaultValue={searchParams.desde} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
        <input type="date" name="hasta" defaultValue={searchParams.hasta} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
        <input
          type="text"
          name="proveedor"
          placeholder="Proveedor"
          defaultValue={searchParams.proveedor}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        />
        <select name="estado" defaultValue={searchParams.estado} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
          <option value="">Todos los estados</option>
          <option value="CONFORME">Conforme</option>
          <option value="OBSERVADA">Observada</option>
          <option value="SIN_SELLO">Sin sello</option>
        </select>
        <button className="rounded-lg bg-marca px-4 py-1.5 text-sm font-semibold text-white">Filtrar</button>
        <Link href="/facturas" className="rounded-lg bg-gray-200 px-4 py-1.5 text-sm font-semibold text-gray-700">
          Limpiar
        </Link>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-marca-claro text-left text-marca-oscuro">
            <tr>
              <th className="px-3 py-2">Número</th>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Proveedor</th>
              <th className="px-3 py-2">Sello</th>
              <th className="px-3 py-2">Acción</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-right">N. Crédito</th>
              <th className="px-3 py-2 text-right">Neto a pagar</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((f) => {
              const totalNC = f.notasCredito.reduce((acc, nc) => acc + Number(nc.montoTotal || 0), 0);
              const neto = Number(f.importeTotal || 0) - totalNC;
              return (
                <tr key={f.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <Link href={`/facturas/${f.id}`} className="font-semibold text-marca hover:underline">
                      {f.numero}
                    </Link>
                    {f.estadoProcesamiento === 'ERROR' && <span className="ml-2 text-xs text-red-600">⚠ error lectura</span>}
                  </td>
                  <td className="px-3 py-2">{formatearFecha(f.fechaEmision)}</td>
                  <td className="px-3 py-2">{f.proveedorRazonSocial}</td>
                  <td className="px-3 py-2">{ETIQUETA_SELLO[f.selloColor]}</td>
                  <td className="px-3 py-2">{ETIQUETA_ACCION[f.accionContable]}</td>
                  <td className="px-3 py-2 text-right">{formatearSoles(f.importeTotal)}</td>
                  <td className="px-3 py-2 text-right">{totalNC > 0 ? `- ${formatearSoles(totalNC)}` : '-'}</td>
                  <td className="px-3 py-2 text-right font-semibold">{formatearSoles(neto)}</td>
                </tr>
              );
            })}
            {facturas.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-400">
                  No hay facturas registradas con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
