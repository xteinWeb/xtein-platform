/** Fecha de hoy en hora local, `yyyy-MM-dd`. */
export function hoy(): string {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

export function sumarDias(fechaIso: string, dias: number): string {
  const [a, m, d] = fechaIso.split('-').map(Number);
  const f = new Date(a, m - 1, d + dias);
  return [f.getFullYear(), String(f.getMonth() + 1).padStart(2, '0'), String(f.getDate()).padStart(2, '0')].join('-');
}

/** `2026-10-24` o `2026-10-24T09:12:00` → `24/10/2026` (`24/10/2026 09:12` con hora). */
export function fecha(valor: string | null | undefined, conHora = false): string {
  if (!valor) return '';
  const [dia, hora] = String(valor).split('T');
  const [a, m, d] = dia.split('-');
  if (!a || !m || !d) return String(valor);
  return `${d}/${m}/${a}${conHora && hora ? ' ' + hora.slice(0, 5) : ''}`;
}

export function pesos(valor: number | null | undefined): string {
  return '$ ' + Number(valor ?? 0).toLocaleString('es-CO');
}

/** Clase de la insignia según el estado (servicio, traslado, entrega o ajuste). */
export function estadoBadge(estado: string | null | undefined): string {
  const e = String(estado ?? '').toUpperCase();
  if (['ANULADO', 'ANULADA', 'RECHAZADO'].includes(e)) return 'c3-badge--danger';
  if (['INACTIVO', 'ENVIADO', 'PROPUESTO', 'AJUSTE PROPUESTO', 'DESPACHADO'].includes(e)) return 'c3-badge--warn';
  if (['RECIBIDO', 'AUTORIZADO', 'ENTREGADO', 'CERRADO', 'AJUSTADO', 'REGISTRADO'].includes(e)) return 'c3-badge--ok';
  return '';
}
