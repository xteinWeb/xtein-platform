/** Zona horaria del negocio: el SP usa UTC−5 fijo (@HOY); en el navegador, America/Bogota. */
const ZonaColombia = 'America/Bogota';

const FormatoFecha = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZonaColombia, year: 'numeric', month: '2-digit', day: '2-digit'
});

/** Hoy en Colombia como yyyy-MM-dd, sin importar la zona del equipo. */
export function hoyColombia(ahora: Date = new Date()): string {
  return FormatoFecha.format(ahora);
}

/** Suma días a una fecha yyyy-MM-dd (calendario, sin zona). */
export function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const valor = new Date(Date.UTC(y, m - 1, d + dias));
  return valor.toISOString().substring(0, 10);
}

/** true si el texto es exactamente yyyy-MM-dd y es una fecha real. */
export function esFechaValida(fecha: string | null | undefined): fecha is string {
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [y, m, d] = fecha.split('-').map(Number);
  const valor = new Date(Date.UTC(y, m - 1, d));
  return valor.getUTCFullYear() === y && valor.getUTCMonth() === m - 1 && valor.getUTCDate() === d;
}

/** yyyy-MM-dd o yyyy-MM-ddTHH:mm:ss (hora Colombia, sin zona) → dd/MM/yyyy [HH:mm]. */
export function mostrarFecha(valor: string | null | undefined): string {
  if (!valor) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(valor);
  if (!match) return valor;
  const [, y, m, d, hh, mm] = match;
  return `${d}/${m}/${y}` + (hh ? ` ${hh}:${mm}` : '');
}
