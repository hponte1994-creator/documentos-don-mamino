export default function ExportarPage({ searchParams }: { searchParams: { desde?: string; hasta?: string } }) {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-marca-oscuro">Exportar a Excel</h1>
      <div className="max-w-md rounded-xl bg-white p-6 shadow-sm">
        <p className="mb-4 text-sm text-gray-600">
          Genera un archivo Excel con hojas separadas: Facturas, Notas de Crédito, Órdenes de Compra, Guías (solo
          referencia) y Detalle de Productos ya homologado con códigos internos — listo para cargar a Dataworking.
        </p>
        <form action="/api/exportar" method="get" className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Desde</label>
            <input type="date" name="desde" defaultValue={searchParams.desde} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Hasta</label>
            <input type="date" name="hasta" defaultValue={searchParams.hasta} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <p className="text-xs text-gray-400">Deja las fechas vacías para exportar todo el historial.</p>
          <button className="w-full rounded-lg bg-marca py-2.5 text-sm font-semibold text-white">Descargar Excel</button>
        </form>
      </div>
    </div>
  );
}
