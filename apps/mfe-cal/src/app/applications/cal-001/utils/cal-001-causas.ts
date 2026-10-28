import type { Cal001Causa } from '../models/cal-001.model';

/** Minúsculas y sin tildes, para buscar "pintura" y encontrar "Pintura" o "pintúra". */
export function normalizarTexto(valor: unknown): string {
  return String(valor ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Filtra causas por Id, Nombre y Descripción (ajuste 4).
 * Cada palabra buscada debe aparecer en alguno de los tres campos.
 */
export function filtrarCausas<T extends Pick<Cal001Causa, 'ID_CAUSA' | 'NOMBRE' | 'DESCRIPCION'>>(causas: readonly T[], texto: string): T[] {
  const terminos = normalizarTexto(texto).split(/\s+/).filter(Boolean);
  if (!terminos.length) return [...causas];
  return causas.filter(causa => {
    const contenido = normalizarTexto(`${causa.ID_CAUSA} ${causa.NOMBRE} ${causa.DESCRIPCION}`);
    return terminos.every(termino => contenido.includes(termino));
  });
}

/** La descripción solo se muestra si aporta algo distinto del nombre (plan F4, causa-selector). */
export function descripcionVisible(causa: Pick<Cal001Causa, 'NOMBRE' | 'DESCRIPCION'>): string {
  const descripcion = String(causa.DESCRIPCION ?? '').trim();
  return normalizarTexto(descripcion) === normalizarTexto(causa.NOMBRE) ? '' : descripcion;
}
