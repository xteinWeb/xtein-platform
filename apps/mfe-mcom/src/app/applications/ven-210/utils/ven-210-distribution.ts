import type { Ven210ItemBodega, Ven210RemisionItem } from '../models/ven-210.model';

/** Tolerance for decimal quantities. */
const EPSILON = 1e-9;

type DistributionItem = Pick<Ven210RemisionItem, 'ITEM' | 'PRODUCTO' | 'NOMBRE_PRODUCTO' | 'CANTIDAD' | 'CANTIDAD_PRES' | 'CANTIDAD_EQUIV'>
  & { BODEGAS?: Ven210ItemBodega[]; SIN_REPARTO?: boolean };

/** Conversion factor: missing means 1, anything that is not a number (or numeric text) is NaN. */
function factor(value: unknown): number {
  if (value === null || value === undefined) return 1;
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
}

function isPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/** Product label used in every validation message. */
export function productLabel(item: Pick<Ven210RemisionItem, 'PRODUCTO' | 'NOMBRE_PRODUCTO'>): string {
  return [item.PRODUCTO, item.NOMBRE_PRODUCTO].filter(Boolean).join(' - ');
}

/**
 * Quantity in base unit: CANTIDAD_PRES × CANTIDAD_EQUIV × cantidad (cantidad in the item presentation).
 * Returns NaN when the result is not a finite number.
 */
export function baseQuantity(item: Pick<Ven210RemisionItem, 'CANTIDAD_PRES' | 'CANTIDAD_EQUIV'>, cantidad: unknown): number {
  const result = factor(item.CANTIDAD_PRES) * factor(item.CANTIDAD_EQUIV) * factor(cantidad ?? NaN);
  return Number.isFinite(result) ? result : NaN;
}

/** Sum of the distribution rows, in the item presentation. */
export function distributionTotal(rows: readonly Ven210ItemBodega[]): number {
  return rows.reduce((sum, row) => sum + Number(row.CANTIDAD), 0);
}

/** Validates the distribution of one item. Returns '' when valid. */
export function validateItemDistribution(item: DistributionItem, rows: readonly Ven210ItemBodega[]): string {
  const label = productLabel(item);
  const quantity = Number(item.CANTIDAD);
  if (!isPositive(quantity)) return `El producto ${label} no tiene una cantidad válida.`;
  if (!rows.length) return `El producto ${label} no tiene reparto por bodega.`;
  const warehouses = new Set<string>();
  for (const row of rows) {
    const warehouse = String(row.ID_UN_BODEGA ?? '').trim();
    if (!warehouse) return `Seleccione la bodega en todas las filas del reparto del producto ${label}.`;
    if (warehouses.has(warehouse)) return `La bodega ${warehouse} está repetida en el reparto del producto ${label}.`;
    warehouses.add(warehouse);
    const amount = Number(row.CANTIDAD);
    if (!isPositive(amount)) return `La cantidad de la bodega ${warehouse} debe ser mayor que cero (producto ${label}).`;
    const base = baseQuantity(item, amount);
    if (!isPositive(base)) return `No se pudo convertir a unidad base la cantidad del producto ${label} (revise la presentación).`;
    if (row.EXISTENCIA !== undefined && row.EXISTENCIA !== null) {
      const stock = Number(row.EXISTENCIA);
      if (!Number.isFinite(stock)) return `La existencia de la bodega ${warehouse} no es válida (producto ${label}).`;
      if (base > stock + EPSILON) return `La cantidad del producto ${label} en la bodega ${warehouse} (${base} en unidad base) supera la existencia (${stock}).`;
    }
  }
  const total = distributionTotal(rows);
  if (!Number.isFinite(total) || Math.abs(total - quantity) > EPSILON)
    return `El reparto del producto ${label} (${total}) no coincide con la cantidad del ítem (${quantity}).`;
  return '';
}

/**
 * Validates every item and the aggregate by (PRODUCTO, ID_UN_BODEGA) in base unit against the stock.
 * Returns '' when valid.
 */
export function validateAllDistributions(items: readonly DistributionItem[]): string {
  const totals = new Map<string, { base: number; stock: number | null; label: string; warehouse: string }>();
  for (const item of items) {
    const rows = item.BODEGAS ?? [];
    if (item.SIN_REPARTO || !rows.length) return `El producto ${productLabel(item)} no tiene un reparto por bodega válido.`;
    const message = validateItemDistribution(item, rows);
    if (message) return message;
    for (const row of rows) {
      const key = JSON.stringify([item.PRODUCTO, row.ID_UN_BODEGA]);
      const current = totals.get(key) ?? { base: 0, stock: null, label: productLabel(item), warehouse: row.ID_UN_BODEGA };
      current.base += baseQuantity(item, row.CANTIDAD);
      if (row.EXISTENCIA !== undefined && row.EXISTENCIA !== null) {
        const stock = Number(row.EXISTENCIA);
        current.stock = current.stock === null ? stock : Math.min(current.stock, stock);
      }
      totals.set(key, current);
    }
  }
  for (const total of totals.values()) {
    if (!Number.isFinite(total.base)) return `No se pudo convertir a unidad base la cantidad del producto ${total.label}.`;
    if (total.stock !== null && total.base > total.stock + EPSILON)
      return `El producto ${total.label} supera la existencia de la bodega ${total.warehouse}: ${total.base} solicitadas en unidad base, ${total.stock} disponibles.`;
  }
  return '';
}

/** Flat ITM_REMISION_BOD rows: CANTIDAD in presentation, CANTIDAD_REAL in base unit. */
export function flattenDistribution(items: readonly DistributionItem[]): Ven210ItemBodega[] {
  return items.flatMap(item => (item.BODEGAS ?? []).map(row => ({
    ITEM: item.ITEM,
    ID_UN_BODEGA: row.ID_UN_BODEGA,
    CANTIDAD: Number(row.CANTIDAD),
    CANTIDAD_REAL: baseQuantity(item, row.CANTIDAD)
  })));
}

/** Groups flat ITM_REMISION_BOD rows back into their items (inverse of flattenDistribution). */
export function groupDistribution<T extends DistributionItem>(items: readonly T[], rows: readonly Ven210ItemBodega[]): T[] {
  return items.map(item => {
    const bodegas = rows.filter(row => Number(row.ITEM) === Number(item.ITEM)).map(row => ({ ...row, ITEM: item.ITEM }));
    return { ...item, BODEGAS: bodegas, SIN_REPARTO: !!validateItemDistribution(item, bodegas) };
  });
}

/** ITM_REMISION row without the front-only fields (distribution, presentation options, order maximum). */
export function stripItem<T extends Ven210RemisionItem>(item: T): Omit<T, 'BODEGAS' | 'SIN_REPARTO' | 'CANTIDAD_MAX' | 'PRESENTACION'> {
  const { BODEGAS: _bodegas, SIN_REPARTO: _pending, CANTIDAD_MAX: _max, PRESENTACION: _presentations, ...row } = item;
  return { ...row, CANTIDAD_REAL: baseQuantity(item, item.CANTIDAD) };
}
