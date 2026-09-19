import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatearFecha, formatearSoles } from '@/lib/formato';

export default async function NotasCreditoPage() {
  const notas = await prisma.notaCredito.findMany({
    include: { factura: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-marca-oscuro">Notas de Crédito</h1>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-marca-claro text-left text-marca-oscuro">
            <tr>
              <th className="px-3 py-2">Número</th>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Proveedor</th>
              <th className="px-3 py-2">Factura que rectifica</th>
              <th className="px-3 py-2">Motivo</th>
              <th className="px-3 py-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {notas.map((n) => (
              <tr key={n.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2">
                  <Link href={`/notas-credito/${n.id}`} className="font-semibold text-marca hover:underline">
                    {n.numero}
                  </Link>
                </td>
                <td className="px-3 py-2">{formatearFecha(n.fechaEmision)}</td>
                <td className="px-3 py-2">{n.proveedorRazonSocial}</td>
                <td className="px-3 py-2">
                  {n.facturaId ? (
                    <Link href={`/facturas/${n.facturaId}`} className="text-green-700 hover:underline">
                      {n.factura?.numero} ✓ vinculada
                    </Link>
                  ) : (
                    <span className="text-amber-600">{n.facturaNumero} · sin vincular</span>
                  )}
                </td>
                <td className="px-3 py-2">{n.motivo || '-'}</td>
                <td className="px-3 py-2 text-right">{formatearSoles(n.montoTotal)}</td>
              </tr>
            ))}
            {notas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-400">
                  No hay notas de crédito registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
