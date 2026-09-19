import { prisma } from '@/lib/prisma';
import { subirImagen } from '@/lib/blob';
import { extraerFactura, extraerNotaCredito, extraerOrdenCompra } from '@/lib/anthropic';
import { buscarMapeoExacto } from '@/lib/homologacion';
import { parsearFechaPeruana } from '@/lib/formato';

type ContextoUsuario = { usuarioId: string; tiendaId: string | null };

async function archivoABase64(archivo: File): Promise<{ base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }> {
  const buffer = Buffer.from(await archivo.arrayBuffer());
  const tipo = archivo.type;
  const mediaType = tipo === 'image/png' ? 'image/png' : tipo === 'image/webp' ? 'image/webp' : 'image/jpeg';
  return { base64: buffer.toString('base64'), mediaType };
}

async function upsertProveedor(ruc: string | null | undefined, razonSocial: string | null | undefined) {
  if (!ruc) return;
  await prisma.proveedor.upsert({
    where: { ruc },
    update: razonSocial ? { razonSocial } : {},
    create: { ruc, razonSocial: razonSocial || 'Sin razón social' },
  });
}

function idAleatorio() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

// ------------------------------------------------------------------
// GUÍA DE REMISIÓN: solo se guarda la foto, sin llamar a Claude.
// ------------------------------------------------------------------
export async function crearGuiaRemision(params: {
  archivo: File;
  numeroGuia?: string;
  facturaRelacionada?: string;
  ctx: ContextoUsuario;
}) {
  const { url, pathname } = await subirImagen(params.archivo, 'guias');
  return prisma.guiaRemision.create({
    data: {
      numeroGuia: params.numeroGuia || null,
      facturaRelacionada: params.facturaRelacionada || null,
      imagenUrl: url,
      imagenPathname: pathname,
      subidoPorId: params.ctx.usuarioId,
      tiendaId: params.ctx.tiendaId,
    },
  });
}

// ------------------------------------------------------------------
// FACTURA
// ------------------------------------------------------------------
const MAPA_ACCION = {
  AZUL: { estadoContable: 'CONFORME', accionContable: 'PAGAR_TOTAL' },
  ROJO: { estadoContable: 'OBSERVADA', accionContable: 'SOLICITAR_NOTA_CREDITO' },
  SIN_SELLO: { estadoContable: 'SIN_SELLO', accionContable: 'PENDIENTE_REVISION' },
} as const;

export async function procesarFactura(params: {
  archivo: File;
  selloManual?: 'AZUL' | 'ROJO' | 'SIN_SELLO';
  ctx: ContextoUsuario;
}) {
  const { url, pathname } = await subirImagen(params.archivo, 'facturas');
  const { base64, mediaType } = await archivoABase64(params.archivo);

  try {
    const extraido = await extraerFactura(base64, mediaType);
    const lineas = Array.isArray(extraido.lineas) ? (extraido.lineas as any[]) : [];
    // El colaborador tiene el papel en la mano: si marcó el sello manualmente, eso manda sobre lo que "vea" la IA en la foto.
    const selloColor = params.selloManual || (extraido.sello_color as string) || 'SIN_SELLO';
    const mapa = MAPA_ACCION[selloColor as keyof typeof MAPA_ACCION] || MAPA_ACCION.SIN_SELLO;

    await upsertProveedor(extraido.proveedor_ruc as string, extraido.proveedor_razon_social as string);

    const lineasConHomologacion = await Promise.all(
      lineas.map(async (l) => {
        const productoId = await buscarMapeoExacto(extraido.proveedor_ruc as string | null, l.descripcion || '');
        return {
          codigoProveedor: l.codigo || null,
          descripcionProveedor: l.descripcion || '(sin descripción)',
          cantidad: l.cantidad ?? 0,
          unidadMedida: l.unidad_medida || null,
          precioUnitario: l.precio_unitario ?? null,
          subtotal: l.subtotal ?? null,
          productoId,
          estadoHomologacion: productoId ? 'HOMOLOGADO' : 'PENDIENTE',
        } as const;
      })
    );

    const factura = await prisma.factura.create({
      data: {
        numero: (extraido.numero as string) || `SIN-NUMERO-${idAleatorio()}`,
        fechaEmision: parsearFechaPeruana(extraido.fecha_emision as string),
        fechaVencimiento: parsearFechaPeruana(extraido.fecha_vencimiento as string),
        proveedorRuc: (extraido.proveedor_ruc as string) || `SIN-RUC-${idAleatorio()}`,
        proveedorRazonSocial: (extraido.proveedor_razon_social as string) || 'Sin razón social',
        clienteRuc: (extraido.cliente_ruc as string) || null,
        clienteRazonSocial: (extraido.cliente_razon_social as string) || null,
        valorVenta: extraido.valor_venta as number | null,
        igv: extraido.igv as number | null,
        importeTotal: extraido.importe_total as number | null,
        formaPago: (extraido.forma_pago as string) || null,
        moneda: (extraido.moneda as string) || 'PEN',
        selloColor: selloColor as any,
        estadoContable: mapa.estadoContable as any,
        accionContable: mapa.accionContable as any,
        imagenUrl: url,
        imagenPathname: pathname,
        estadoProcesamiento: 'LISTO',
        extraccionCruda: extraido as any,
        subidoPorId: params.ctx.usuarioId,
        tiendaId: params.ctx.tiendaId,
        lineas: { create: lineasConHomologacion as any },
      },
      include: { lineas: true },
    });

    return factura;
  } catch (error) {
    return prisma.factura.create({
      data: {
        numero: `SIN-NUMERO-${idAleatorio()}`,
        proveedorRuc: `SIN-RUC-${idAleatorio()}`,
        proveedorRazonSocial: 'Sin razón social',
        moneda: 'PEN',
        imagenUrl: url,
        imagenPathname: pathname,
        estadoProcesamiento: 'ERROR',
        errorProcesamiento: error instanceof Error ? error.message : 'Error desconocido al procesar la imagen',
        subidoPorId: params.ctx.usuarioId,
        tiendaId: params.ctx.tiendaId,
      },
    });
  }
}

// ------------------------------------------------------------------
// NOTA DE CRÉDITO
// ------------------------------------------------------------------
export async function procesarNotaCredito(params: { archivo: File; ctx: ContextoUsuario }) {
  const { url, pathname } = await subirImagen(params.archivo, 'notas-credito');
  const { base64, mediaType } = await archivoABase64(params.archivo);

  try {
    const extraido = await extraerNotaCredito(base64, mediaType);
    const lineas = Array.isArray(extraido.lineas) ? (extraido.lineas as any[]) : [];
    const proveedorRuc = (extraido.proveedor_ruc as string) || null;

    await upsertProveedor(proveedorRuc, extraido.proveedor_razon_social as string);

    let facturaId: string | null = null;
    let advertencia: string | null = null;
    const facturaNumero = (extraido.factura_numero as string) || '';

    if (proveedorRuc && facturaNumero) {
      const facturaVinculada = await prisma.factura.findUnique({
        where: { proveedorRuc_numero: { proveedorRuc, numero: facturaNumero } },
        include: { notasCredito: true },
      });
      if (facturaVinculada) {
        if (facturaVinculada.notasCredito.length > 0) {
          advertencia = `Ya existe una nota de crédito vinculada a la factura ${facturaNumero}. No se vinculó automáticamente; revisar manualmente.`;
        } else {
          facturaId = facturaVinculada.id;
        }
      }
    }

    const lineasConHomologacion = await Promise.all(
      lineas.map(async (l) => {
        const productoId = proveedorRuc ? await buscarMapeoExacto(proveedorRuc, l.nombre || '') : null;
        return {
          codigo: l.codigo || null,
          nombre: l.nombre || '(sin nombre)',
          cantidad: l.cantidad ?? null,
          precioUnitario: l.precio_unitario ?? null,
          subtotal: l.subtotal ?? null,
          productoId,
        } as const;
      })
    );

    return prisma.notaCredito.create({
      data: {
        numero: (extraido.numero as string) || `SIN-NUMERO-${idAleatorio()}`,
        fechaEmision: parsearFechaPeruana(extraido.fecha_emision as string),
        proveedorRuc: proveedorRuc || `SIN-RUC-${idAleatorio()}`,
        proveedorRazonSocial: (extraido.proveedor_razon_social as string) || 'Sin razón social',
        facturaNumero: facturaNumero || 'SIN-ESPECIFICAR',
        facturaId,
        motivo: (extraido.motivo as string) || null,
        montoTotal: extraido.monto_total as number | null,
        imagenUrl: url,
        imagenPathname: pathname,
        estadoProcesamiento: 'LISTO',
        errorProcesamiento: advertencia,
        extraccionCruda: extraido as any,
        subidoPorId: params.ctx.usuarioId,
        tiendaId: params.ctx.tiendaId,
        lineas: { create: lineasConHomologacion as any },
      },
      include: { lineas: true, factura: true },
    });
  } catch (error) {
    return prisma.notaCredito.create({
      data: {
        numero: `SIN-NUMERO-${idAleatorio()}`,
        proveedorRuc: `SIN-RUC-${idAleatorio()}`,
        proveedorRazonSocial: 'Sin razón social',
        facturaNumero: 'SIN-ESPECIFICAR',
        imagenUrl: url,
        imagenPathname: pathname,
        estadoProcesamiento: 'ERROR',
        errorProcesamiento: error instanceof Error ? error.message : 'Error desconocido al procesar la imagen',
        subidoPorId: params.ctx.usuarioId,
        tiendaId: params.ctx.tiendaId,
      },
    });
  }
}

// ------------------------------------------------------------------
// ORDEN DE COMPRA
// ------------------------------------------------------------------
export async function procesarOrdenCompra(params: { archivo: File; ctx: ContextoUsuario }) {
  const { url, pathname } = await subirImagen(params.archivo, 'ordenes-compra');
  const { base64, mediaType } = await archivoABase64(params.archivo);

  try {
    const extraido = await extraerOrdenCompra(base64, mediaType);
    const lineas = Array.isArray(extraido.lineas) ? (extraido.lineas as any[]) : [];
    const proveedorRuc = (extraido.proveedor_ruc as string) || null;

    await upsertProveedor(proveedorRuc, extraido.proveedor_razon_social as string);

    const lineasConHomologacion = await Promise.all(
      lineas.map(async (l) => {
        const productoId = proveedorRuc ? await buscarMapeoExacto(proveedorRuc, l.descripcion || '') : null;
        return {
          codigoInterno: l.codigo || null,
          descripcion: l.descripcion || '(sin descripción)',
          cantidad: l.cantidad ?? null,
          precioUnitario: l.precio_unitario ?? null,
          subtotal: l.subtotal ?? null,
          productoId,
        } as const;
      })
    );

    return prisma.ordenCompra.create({
      data: {
        numero: (extraido.numero as string) || `SIN-NUMERO-${idAleatorio()}`,
        fecha: parsearFechaPeruana(extraido.fecha as string),
        proveedorRuc: proveedorRuc || `SIN-RUC-${idAleatorio()}`,
        proveedorRazonSocial: (extraido.proveedor_razon_social as string) || 'Sin razón social',
        montoTotal: extraido.monto_total as number | null,
        estadoRecepcion: 'PENDIENTE',
        imagenUrl: url,
        imagenPathname: pathname,
        estadoProcesamiento: 'LISTO',
        extraccionCruda: extraido as any,
        subidoPorId: params.ctx.usuarioId,
        tiendaId: params.ctx.tiendaId,
        lineas: { create: lineasConHomologacion as any },
      },
      include: { lineas: true },
    });
  } catch (error) {
    return prisma.ordenCompra.create({
      data: {
        numero: `SIN-NUMERO-${idAleatorio()}`,
        proveedorRuc: `SIN-RUC-${idAleatorio()}`,
        proveedorRazonSocial: 'Sin razón social',
        estadoRecepcion: 'PENDIENTE',
        imagenUrl: url,
        imagenPathname: pathname,
        estadoProcesamiento: 'ERROR',
        errorProcesamiento: error instanceof Error ? error.message : 'Error desconocido al procesar la imagen',
        subidoPorId: params.ctx.usuarioId,
        tiendaId: params.ctx.tiendaId,
      },
    });
  }
}
