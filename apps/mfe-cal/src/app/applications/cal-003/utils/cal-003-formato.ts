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
  if (['ANULADO', 'ANULADA', 'RECHAZADO', 'VENCIDO'].includes(e)) return 'c3-badge--danger';
  if (['INACTIVO', 'REGISTRADO', 'PROPUESTO', 'AJUSTE PROPUESTO', 'DESPACHADO', 'POR VENCER'].includes(e)) return 'c3-badge--warn';
  if (['AUTORIZADO', 'ENTREGADO', 'CERRADO', 'AJUSTADO', 'EN TIEMPO'].includes(e)) return 'c3-badge--ok';
  return '';
}

/** Días hasta la fecha de entrega en palabras: «vence hoy», «faltan 3 días», «2 días de atraso». */
export function diasEntrega(dias: number | null | undefined): string {
  if (dias === null || dias === undefined) return '';
  if (dias === 0) return 'vence hoy';
  if (dias === 1) return 'vence mañana';
  if (dias > 0) return `faltan ${dias} días`;
  return dias === -1 ? '1 día de atraso' : `${-dias} días de atraso`;
}

/** Semáforo de la fecha de entrega en texto (para listas sin color): `🔴 25/10/2026 · 4 días de atraso`. */
export function resumenEntrega(s: { FECHA_ENTREGA?: string | null; DIAS_PARA_ENTREGA?: number | null; ESTADO_ENTREGA?: string | null }): string {
  if (!s.FECHA_ENTREGA) return '';
  if (!s.ESTADO_ENTREGA) return fecha(s.FECHA_ENTREGA);
  const punto = s.ESTADO_ENTREGA === 'VENCIDO' ? '🔴' : s.ESTADO_ENTREGA === 'POR VENCER' ? '🟡' : '🟢';
  return `${punto} ${fecha(s.FECHA_ENTREGA)} · ${diasEntrega(s.DIAS_PARA_ENTREGA)}`;
}
