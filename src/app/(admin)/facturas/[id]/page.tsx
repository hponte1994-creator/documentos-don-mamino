import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatearSoles } from '@/lib/formato';
import FacturaEditForm from './FacturaEditForm';

export default async function FacturaDetallePage({ params }: { params: { id: string } }) {
  const factura = await prisma.factura.findUnique({
    where: { id: params.id },
    include: { lineas: { include: { producto: true } }, notasCredito: true },
  });
  if (!factura) notFound();

  const totalNC = factura.notasCredito.reduce((acc, nc) => acc + Number(nc.montoTotal || 0), 0);
  const neto = Number(factura.importeTotal || 0) - totalNC;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-marca-oscuro">Factura {factura.numero}</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <a href={factura.imagenUrl} target="_blank" rel="noreferrer">
            <img src={factura.imagenUrl} alt="Factura" className="w-full rounded-xl border border-gray-200 object-contain shadow-sm" />
          </a>
          {factura.errorProcesamiento && (
            <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">⚠ {factura.errorProcesamiento}</p>
          )}
        </div>

        <div className="space-y-4">
          <FacturaEditForm
            factura={{
              id: factura.id,
              numero: factura.numero,
              fechaEmision: factura.fechaEmision?.toISOString() || null,
              fechaVencimiento: factura.fechaVencimiento?.toISOString() || null,
              proveedorRuc: factura.proveedorRuc,
              proveedorRazonSocial: factura.proveedorRazonSocial,
              clienteRuc: factura.clienteRuc,
              clienteRazonSocial: factura.clienteRazonSocial,
              valorVenta: factura.valorVenta?.toString() || null,
              igv: factura.igv?.toString() || null,
              importeTotal: factura.importeTotal?.toString() || null,
              formaPago: factura.formaPago,
              moneda: factura.moneda,
              selloColor: factura.selloColor,
            }}
          />

          {factura.notasCredito.length > 0 && (
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-semibold text-gray-600">Notas de crédito vinculadas</p>
              {factura.notasCredito.map((nc) => (
                <div key={nc.id} className="flex justify-between border-t border-gray-100 py-1 text-sm first:border-0">
                  <span>{nc.numero}</span>
                  <span>- {formatearSoles(nc.montoTotal)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-sm font-bold">
                <span>Neto a pagar</span>
                <span>{formatearSoles(neto)}</span>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-gray-600">Detalle de productos</p>
            <table className="w-full text-xs">
              <thead className="text-left text-gray-400">
                <tr>
                  <th className="py-1">Descripción proveedor</th>
                  <th className="py-1">Cant.</th>
                  <th className="py-1">Homologado a</th>
                </tr>
              </thead>
              <tbody>
                {factura.lineas.map((l) => (
                  <tr key={l.id} className="border-t border-gray-100">
                    <td className="py-1.5">{l.descripcionProveedor}</td>
                    <td className="py-1.5">
                      {l.cantidad.toString()} {l.unidadMedida || ''}
                    </td>
                    <td className="py-1.5">
                      {l.producto ? (
                        <span className="text-green-700">{l.producto.codigoInterno} · {l.producto.nombreInterno}</span>
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
