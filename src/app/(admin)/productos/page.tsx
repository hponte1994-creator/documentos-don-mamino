import { prisma } from '@/lib/prisma';
import ProductosClient from './ProductosClient';

export default async function ProductosPage() {
  const productos = await prisma.producto.findMany({
    include: { alias: { include: { proveedor: true } } },
    orderBy: { nombreInterno: 'asc' },
  });

  return (
    <ProductosClient
      productosIniciales={productos.map((p) => ({
        id: p.id,
        codigoInterno: p.codigoInterno,
        nombreInterno: p.nombreInterno,
        unidadMedidaInterna: p.unidadMedidaInterna,
        alias: p.alias.map((a) => ({
          id: a.id,
          descripcion: a.descripcion,
          proveedorRuc: a.proveedorRuc,
          proveedor: { razonSocial: a.proveedor.razonSocial },
        })),
      }))}
    />
  );
}
