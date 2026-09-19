import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { formatearFecha } from '@/lib/formato';

function numero(valor: unknown): number {
  if (valor === null || valor === undefined) return 0;
  const n = typeof valor === 'string' ? parseFloat(valor) : Number(valor);
  return Number.isNaN(n) ? 0 : n;
}

export async function generarExcel(desde?: Date, hasta?: Date): Promise<ExcelJS.Buffer> {
  const rangoFecha = desde || hasta ? { gte: desde, lte: hasta } : undefined;

  const [facturas, notasCredito, ordenesCompra, guias] = await Promise.all([
    prisma.factura.findMany({
      where: rangoFecha ? { fechaEmision: rangoFecha } : {},
      include: { lineas: { include: { producto: true } }, notasCredito: true },
      orderBy: { fechaEmision: 'asc' },
    }),
    prisma.notaCredito.findMany({
      where: rangoFecha ? { fechaEmision: rangoFecha } : {},
      include: { lineas: { include: { producto: true } }, factura: true },
      orderBy: { fechaEmision: 'asc' },
    }),
    prisma.ordenCompra.findMany({
      where: rangoFecha ? { fecha: rangoFecha } : {},
      include: { lineas: { include: { producto: true } }, factura: true },
      orderBy: { fecha: 'asc' },
    }),
    prisma.guiaRemision.findMany({
      where: rangoFecha ? { createdAt: rangoFecha } : {},
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const libro = new ExcelJS.Workbook();

  const hojaFacturas = libro.addWorksheet('Facturas');
  hojaFacturas.columns = [
    { header: 'Número', key: 'numero', width: 16 },
    { header: 'Fecha Emisión', key: 'fechaEmision', width: 14 },
    { header: 'Fecha Vencimiento', key: 'fechaVencimiento', width: 16 },
    { header: 'RUC Proveedor', key: 'proveedorRuc', width: 14 },
    { header: 'Proveedor', key: 'proveedorRazonSocial', width: 30 },
    { header: 'Valor Venta', key: 'valorVenta', width: 14 },
    { header: 'IGV', key: 'igv', width: 12 },
    { header: 'Importe Total', key: 'importeTotal', width: 14 },
    { header: 'Notas de Crédito', key: 'totalNC', width: 16 },
    { header: 'Neto a Pagar', key: 'neto', width: 14 },
    { header: 'Moneda', key: 'moneda', width: 10 },
    { header: 'Forma de Pago', key: 'formaPago', width: 16 },
    { header: 'Sello', key: 'selloColor', width: 12 },
    { header: 'Estado Contable', key: 'estadoContable', width: 16 },
    { header: 'Acción', key: 'accionContable', width: 22 },
  ];
  for (const f of facturas) {
    const totalNC = f.notasCredito.reduce((acc, nc) => acc + numero(nc.montoTotal), 0);
    hojaFacturas.addRow({
      numero: f.numero,
      fechaEmision: formatearFecha(f.fechaEmision),
      fechaVencimiento: formatearFecha(f.fechaVencimiento),
      proveedorRuc: f.proveedorRuc,
      proveedorRazonSocial: f.proveedorRazonSocial,
      valorVenta: numero(f.valorVenta),
      igv: numero(f.igv),
      importeTotal: numero(f.importeTotal),
      totalNC,
      neto: numero(f.importeTotal) - totalNC,
      moneda: f.moneda,
      formaPago: f.formaPago || '',
      selloColor: f.selloColor,
      estadoContable: f.estadoContable,
      accionContable: f.accionContable,
    });
  }

  const hojaNC = libro.addWorksheet('Notas de Credito');
  hojaNC.columns = [
    { header: 'Número', key: 'numero', width: 16 },
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'RUC Proveedor', key: 'proveedorRuc', width: 14 },
    { header: 'Proveedor', key: 'proveedorRazonSocial', width: 30 },
    { header: 'Factura Rectificada', key: 'facturaNumero', width: 18 },
    { header: 'Motivo', key: 'motivo', width: 30 },
    { header: 'Monto Total', key: 'montoTotal', width: 14 },
  ];
  for (const n of notasCredito) {
    hojaNC.addRow({
      numero: n.numero,
      fecha: formatearFecha(n.fechaEmision),
      proveedorRuc: n.proveedorRuc,
      proveedorRazonSocial: n.proveedorRazonSocial,
      facturaNumero: n.factura?.numero || n.facturaNumero,
      motivo: n.motivo || '',
      montoTotal: numero(n.montoTotal),
    });
  }

  const hojaOC = libro.addWorksheet('Ordenes de Compra');
  hojaOC.columns = [
    { header: 'Número', key: 'numero', width: 16 },
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'RUC Proveedor', key: 'proveedorRuc', width: 14 },
    { header: 'Proveedor', key: 'proveedorRazonSocial', width: 30 },
    { header: 'Monto Total', key: 'montoTotal', width: 14 },
    { header: 'Estado Recepción', key: 'estadoRecepcion', width: 18 },
    { header: 'Factura Vinculada', key: 'factura', width: 18 },
  ];
  for (const o of ordenesCompra) {
    hojaOC.addRow({
      numero: o.numero,
      fecha: formatearFecha(o.fecha),
      proveedorRuc: o.proveedorRuc,
      proveedorRazonSocial: o.proveedorRazonSocial,
      montoTotal: numero(o.montoTotal),
      estadoRecepcion: o.estadoRecepcion,
      factura: o.factura?.numero || '',
    });
  }

  const hojaGuias = libro.addWorksheet('Guias (referencia)');
  hojaGuias.columns = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'N° Guía', key: 'numeroGuia', width: 16 },
    { header: 'Factura Relacionada', key: 'facturaRelacionada', width: 18 },
    { header: 'URL Foto', key: 'imagenUrl', width: 50 },
  ];
  for (const g of guias) {
    hojaGuias.addRow({
      fecha: formatearFecha(g.createdAt),
      numeroGuia: g.numeroGuia || '',
      facturaRelacionada: g.facturaRelacionada || '',
      imagenUrl: g.imagenUrl,
    });
  }

  const hojaDetalle = libro.addWorksheet('Detalle Productos');
  hojaDetalle.columns = [
    { header: 'Origen', key: 'origen', width: 14 },
    { header: 'N° Documento', key: 'documento', width: 16 },
    { header: 'RUC Proveedor', key: 'proveedorRuc', width: 14 },
    { header: 'Código Interno', key: 'codigoInterno', width: 14 },
    { header: 'Nombre Interno', key: 'nombreInterno', width: 30 },
    { header: 'Descripción Original', key: 'descripcionOriginal', width: 35 },
    { header: 'Cantidad', key: 'cantidad', width: 12 },
    { header: 'Precio Unitario', key: 'precioUnitario', width: 14 },
    { header: 'Subtotal', key: 'subtotal', width: 14 },
    { header: 'Homologado', key: 'homologado', width: 12 },
  ];
  for (const f of facturas) {
    for (const l of f.lineas) {
      hojaDetalle.addRow({
        origen: 'Factura',
        documento: f.numero,
        proveedorRuc: f.proveedorRuc,
        codigoInterno: l.producto?.codigoInterno || '',
        nombreInterno: l.producto?.nombreInterno || '',
        descripcionOriginal: l.descripcionProveedor,
        cantidad: numero(l.cantidad),
        precioUnitario: numero(l.precioUnitario),
        subtotal: numero(l.subtotal),
        homologado: l.producto ? 'Sí' : 'No',
      });
    }
  }
  for (const n of notasCredito) {
    for (const l of n.lineas) {
      hojaDetalle.addRow({
        origen: 'Nota de Crédito',
        documento: n.numero,
        proveedorRuc: n.proveedorRuc,
        codigoInterno: l.producto?.codigoInterno || l.codigo || '',
        nombreInterno: l.producto?.nombreInterno || l.nombre,
        descripcionOriginal: l.nombre,
        cantidad: numero(l.cantidad),
        precioUnitario: numero(l.precioUnitario),
        subtotal: numero(l.subtotal),
        homologado: l.producto ? 'Sí' : 'No',
      });
    }
  }
  for (const o of ordenesCompra) {
    for (const l of o.lineas) {
      hojaDetalle.addRow({
        origen: 'Orden de Compra',
        documento: o.numero,
        proveedorRuc: o.proveedorRuc,
        codigoInterno: l.producto?.codigoInterno || '',
        nombreInterno: l.producto?.nombreInterno || '',
        descripcionOriginal: l.descripcion,
        cantidad: numero(l.cantidad),
        precioUnitario: numero(l.precioUnitario),
        subtotal: numero(l.subtotal),
        homologado: l.producto ? 'Sí' : 'No',
      });
    }
  }

  for (const hoja of libro.worksheets) {
    hoja.getRow(1).font = { bold: true };
    hoja.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0EA' } };
  }

  return libro.xlsx.writeBuffer();
}
