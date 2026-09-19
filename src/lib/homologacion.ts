import Fuse from 'fuse.js';
import { prisma } from '@/lib/prisma';

/**
 * Busca si una descripción de producto de proveedor ya tiene un alias exacto
 * guardado en el maestro. Si lo encuentra, devuelve el productoId para mapear
 * la línea automáticamente.
 */
export async function buscarMapeoExacto(proveedorRuc: string | null, descripcion: string): Promise<string | null> {
  if (!proveedorRuc) return null;
  const alias = await prisma.productoAlias.findUnique({
    where: { proveedorRuc_descripcion: { proveedorRuc, descripcion: normalizar(descripcion) } },
  });
  return alias?.productoId ?? null;
}

function normalizar(texto: string): string {
  return texto.trim().toUpperCase().replace(/\s+/g, ' ');
}

export async function guardarAliasYHomologar(params: {
  productoId: string;
  proveedorRuc: string;
  descripcion: string;
}) {
  const descripcionNormalizada = normalizar(params.descripcion);
  await prisma.productoAlias.upsert({
    where: { proveedorRuc_descripcion: { proveedorRuc: params.proveedorRuc, descripcion: descripcionNormalizada } },
    update: { productoId: params.productoId },
    create: {
      productoId: params.productoId,
      proveedorRuc: params.proveedorRuc,
      descripcion: descripcionNormalizada,
    },
  });
}

export type CandidatoHomologacion = {
  productoId: string;
  codigoInterno: string;
  nombreInterno: string;
  puntaje: number; // 0 a 1, más alto es mejor coincidencia
};

/**
 * Sugiere productos del maestro que podrían corresponder a una descripción
 * sin mapear, usando coincidencia difusa sobre nombres internos y alias existentes.
 */
export async function sugerirCandidatos(descripcion: string, limite = 5): Promise<CandidatoHomologacion[]> {
  const productos = await prisma.producto.findMany({
    include: { alias: true },
  });

  const indice = productos.flatMap((producto) => [
    { productoId: producto.id, codigoInterno: producto.codigoInterno, nombreInterno: producto.nombreInterno, texto: producto.nombreInterno },
    ...producto.alias.map((a) => ({
      productoId: producto.id,
      codigoInterno: producto.codigoInterno,
      nombreInterno: producto.nombreInterno,
      texto: a.descripcion,
    })),
  ]);

  const fuse = new Fuse(indice, { keys: ['texto'], includeScore: true, threshold: 0.6 });
  const resultados = fuse.search(normalizar(descripcion));

  const vistos = new Set<string>();
  const candidatos: CandidatoHomologacion[] = [];
  for (const r of resultados) {
    if (vistos.has(r.item.productoId)) continue;
    vistos.add(r.item.productoId);
    candidatos.push({
      productoId: r.item.productoId,
      codigoInterno: r.item.codigoInterno,
      nombreInterno: r.item.nombreInterno,
      puntaje: 1 - (r.score ?? 1),
    });
    if (candidatos.length >= limite) break;
  }
  return candidatos;
}
