import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatearFecha, formatearSoles } from '@/lib/formato';
import EstadoRecepcionSelector from './EstadoRecepcionSelector';

export default async function OrdenesCompraPage() {
  const ordenes = await prisma.ordenCompra.findMany({ include: { factura: true }, orderBy: { createdAt: 'desc' }, take: 200 });

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-marca-oscuro">Órdenes de Compra</h1>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-marca-claro text-left text-marca-oscuro">
            <tr>
              <th className="px-3 py-2">Número</th>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Proveedor</th>
              <th className="px-3 py-2 text-right">Monto</th>
              <th className="px-3 py-2">Factura</th>
              <th className="px-3 py-2">Recepción</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((o) => (
              <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2">
                  <a href={o.imagenUrl} target="_blank" rel="noreferrer" className="font-semibold text-marca hover:underline">
                    {o.numero}
                  </a>
                </td>
                <td className="px-3 py-2">{formatearFecha(o.fecha)}</td>
                <td className="px-3 py-2">{o.proveedorRazonSocial}</td>
                <td className="px-3 py-2 text-right">{formatearSoles(o.montoTotal)}</td>
                <td className="px-3 py-2">
                  {o.factura ? (
                    <Link href={`/facturas/${o.factura.id}`} className="text-green-700 hover:underline">
                      {o.factura.numero}
                    </Link>
                  ) : (
                    <span className="text-gray-400">Sin vincular</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <EstadoRecepcionSelector id={o.id} valor={o.estadoRecepcion} />
                </td>
              </tr>
            ))}
            {ordenes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-400">
                  No hay órdenes de compra registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
