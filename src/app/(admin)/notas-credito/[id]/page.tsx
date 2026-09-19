import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatearFecha, formatearSoles } from '@/lib/formato';
import VincularFactura from './VincularFactura';

export default async function NotaCreditoDetallePage({ params }: { params: { id: string } }) {
  const nota = await prisma.notaCredito.findUnique({
    where: { id: params.id },
    include: { lineas: { include: { producto: true } }, factura: true },
  });
  if (!nota) notFound();

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-marca-oscuro">Nota de Crédito {nota.numero}</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <a href={nota.imagenUrl} target="_blank" rel="noreferrer">
            <img src={nota.imagenUrl} alt="Nota de crédito" className="w-full rounded-xl border border-gray-200 object-contain shadow-sm" />
          </a>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl bg-white p-4 shadow-sm text-sm">
            <p><span className="text-gray-500">Proveedor:</span> {nota.proveedorRazonSocial} ({nota.proveedorRuc})</p>
            <p><span className="text-gray-500">Fecha:</span> {formatearFecha(nota.fechaEmision)}</p>
            <p><span className="text-gray-500">Motivo:</span> {nota.motivo || '-'}</p>
            <p><span className="text-gray-500">Monto total:</span> {formatearSoles(nota.montoTotal)}</p>
          </div>

          {nota.facturaId && nota.factura ? (
            <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
              Vinculada a la factura{' '}
              <Link href={`/facturas/${nota.factura.id}`} className="font-semibold underline">
                {nota.factura.numero}
              </Link>
            </div>
          ) : (
            <VincularFactura notaId={nota.id} facturaNumero={nota.facturaNumero} />
          )}

          {nota.errorProcesamiento && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">⚠ {nota.errorProcesamiento}</p>
          )}

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-gray-600">Detalle de productos (valores maestro)</p>
            <table className="w-full text-xs">
              <thead className="text-left text-gray-400">
                <tr>
                  <th className="py-1">Código</th>
                  <th className="py-1">Nombre</th>
                  <th className="py-1">Cant.</th>
                  <th className="py-1">Homologado a</th>
                </tr>
              </thead>
              <tbody>
                {nota.lineas.map((l) => (
                  <tr key={l.id} className="border-t border-gray-100">
                    <td className="py-1.5">{l.codigo || '-'}</td>
                    <td className="py-1.5">{l.nombre}</td>
                    <td className="py-1.5">{l.cantidad?.toString() || '-'}</td>
                    <td className="py-1.5">
                      {l.producto ? (
                        <span className="text-green-700">{l.producto.codigoInterno}</span>
                      ) : (
                        <span className="text-amber-600">Pendiente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
