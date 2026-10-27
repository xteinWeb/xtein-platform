import { Pro039MaterialOrigin, Pro039MovementItem } from '../models/pro-039.model';

/** Lote de un origen (1 si no viene o no es válido). */
export function originLot(origin: Pro039MaterialOrigin): number {
  const lot = Number(origin.CANTIDAD_LOTE);
  return lot > 0 ? lot : 1;
}

/**
 * Consumo total de un material de la matriz: cada producto pone su consumo unitario x su propio lote.
 * Los consumos anteriores (sin orígenes) usan el lote único del encabezado.
 */
export function matrixTotal(item: Pro039MovementItem, headerLot = 1): number {
  const origins = item.ORIGENES ?? [];
  if (!origins.length) return Number(item.CONSUMO_BASE || 0) * headerLot;
  return origins.reduce((sum, origin) => sum + Number(origin.CONSUMO || 0) * originLot(origin), 0);
}

/** Lote del material si sale de un solo producto; con varios productos cada uno tiene el suyo (null). */
export function materialLot(item: Pro039MovementItem, headerLot = 1): number | null {
  const origins = item.ORIGENES ?? [];
  if (!origins.length) return headerLot;
  const lots = new Set(origins.map(originLot));
  return lots.size === 1 ? [...lots][0] : null;
}
