import { prisma } from '@/lib/prisma';
import { sugerirCandidatos } from '@/lib/homologacion';
import HomologarFila from './HomologarFila';

export default async function HomologacionPage() {
  const [lineasFactura, lineasNota, lineasOrden] = await Promise.all([
    prisma.facturaLinea.findMany({
      where: { estadoHomologacion: 'PENDIENTE' },
      include: { factura: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.notaCreditoLinea.findMany({
      where: { productoId: null },
      include: { notaCredito: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.ordenCompraLinea.findMany({
      where: { productoId: null },
      include: { ordenCompra: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  const filas = [
    ...lineasFactura.map((l) => ({
      tipo: 'FACTURA' as const,
      lineaId: l.id,
      descripcion: l.descripcionProveedor,
      proveedor: `${l.factura.proveedorRazonSocial} (${l.factura.proveedorRuc}) · Factura ${l.factura.numero}`,
    })),
    ...lineasNota.map((l) => ({
      tipo: 'NOTA_CREDITO' as const,
      lineaId: l.id,
      descripcion: l.nombre,
      proveedor: `${l.notaCredito.proveedorRazonSocial} (${l.notaCredito.proveedorRuc}) · Nota ${l.notaCredito.numero}`,
    })),
    ...lineasOrden.map((l) => ({
      tipo: 'ORDEN_COMPRA' as const,
      lineaId: l.id,
      descripcion: l.descripcion,
      proveedor: `${l.ordenCompra.proveedorRazonSocial} (${l.ordenCompra.proveedorRuc}) · Orden ${l.ordenCompra.numero}`,
    })),
  ];

  const filasConCandidatos = await Promise.all(
    filas.map(async (f) => ({ ...f, candidatos: await sugerirCandidatos(f.descripcion, 3) }))
  );

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-marca-oscuro">Por Homologar</h1>
      <p className="mb-4 text-sm text-gray-500">{filas.length} líneas de producto sin mapear al maestro interno.</p>

      <div className="space-y-3">
        {filasConCandidatos.map((f) => (
          <HomologarFila
            key={`${f.tipo}-${f.lineaId}`}
            tipo={f.tipo}
            lineaId={f.lineaId}
            descripcion={f.descripcion}
            proveedor={f.proveedor}
            candidatos={f.candidatos}
          />
        ))}
        {filas.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-gray-400 shadow-sm">No hay líneas pendientes 🎉</p>}
      </div>
    </div>
  );
}
