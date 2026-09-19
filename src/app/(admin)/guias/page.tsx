import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import GuiaCard from './GuiaCard';

export default async function GuiasPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim();
  const where: Prisma.GuiaRemisionWhereInput = q
    ? {
        OR: [
          { numeroGuia: { contains: q, mode: 'insensitive' } },
          { facturaRelacionada: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  const guias = await prisma.guiaRemision.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-marca-oscuro">Guías de Remisión</h1>
      <form className="mb-4 flex gap-2" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por número de guía o factura relacionada"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-marca px-4 py-2 text-sm font-semibold text-white">Buscar</button>
      </form>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {guias.map((g) => (
          <GuiaCard
            key={g.id}
            guia={{
              id: g.id,
              numeroGuia: g.numeroGuia,
              facturaRelacionada: g.facturaRelacionada,
              imagenUrl: g.imagenUrl,
              createdAt: g.createdAt.toISOString(),
            }}
          />
        ))}
        {guias.length === 0 && <p className="col-span-full py-6 text-center text-gray-400">No hay guías registradas.</p>}
      </div>
    </div>
  );
}
