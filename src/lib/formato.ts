export function formatearSoles(valor: number | string | null | undefined): string {
  const num = typeof valor === 'string' ? parseFloat(valor) : valor;
  if (num === null || num === undefined || Number.isNaN(num)) return 'S/ 0.00';
  return `S/ ${num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatearFecha(fecha: Date | string | null | undefined): string {
  if (!fecha) return '';
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Lima' });
}

// Acepta "DD/MM/YYYY" o "DD-MM-YYYY" (formato peruano) y devuelve un Date, o null si no es válida.
export function parsearFechaPeruana(texto: string | null | undefined): Date | null {
  if (!texto) return null;
  const match = texto.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!match) return null;
  const [, diaStr, mesStr, anioStr] = match;
  const dia = parseInt(diaStr, 10);
  const mes = parseInt(mesStr, 10);
  let anio = parseInt(anioStr, 10);
  if (anio < 100) anio += 2000;
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.getUTCDate() !== dia || fecha.getUTCMonth() !== mes - 1) return null;
  return fecha;
}

export function esRucValido(ruc: string | null | undefined): boolean {
  if (!ruc) return false;
  return /^\d{11}$/.test(ruc.trim());
}
