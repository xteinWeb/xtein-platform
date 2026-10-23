import type { Ven213DevolucionItem, Ven213ItemBodega } from '../models/ven-213.model';
import { toHundredths } from './ven-213-amounts';

/** Tolerance for decimal quantities. */
const EPSILON = 1e-9;

/** Warning shown on lines whose source did not move inventory (no restock). */
export const Ven213WithoutInventoryMessage = 'Esta línea no movió inventario: no se reingresa a bodega';

type DistributionItem = Pick<Ven213DevolucionItem, 'ITEM' | 'PRODUCTO' | 'NOMBRE_PRODUCTO' | 'CANTIDAD'>
  & { BODEGAS?: Ven213ItemBodega[]; SIN_REPARTO?: boolean; SIN_INVENTARIO?: boolean };

function isPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/** Product label used in every validation message. */
export function productLabel(item: Pick<Ven213DevolucionItem, 'PRODUCTO' | 'NOMBRE_PRODUCTO'>): string {
  return [item.PRODUCTO, item.NOMBRE_PRODUCTO].filter(Boolean).join(' - ');
}

/** Sum of the distribution rows, in the unit of the source line. */
export function distributionTotal(rows: readonly Ven213ItemBodega[]): number {
  return rows.reduce((sum, row) => sum + Number(row.CANTIDAD), 0);
}

/**
 * Validates the restock distribution of one item: Σ = CANTIDAD, warehouses not repeated, no stock limit (it is an entry).
 * Lines without inventory need no distribution and must not carry rows. Returns '' when valid.
 */
export function validateItemDistribution(item: DistributionItem, rows: readonly Ven213ItemBodega[]): string {
  const label = productLabel(item);
  if (item.SIN_INVENTARIO) return rows.length ? `${Ven213WithoutInventoryMessage} (producto ${label}).` : '';
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
  }
  const total = distributionTotal(rows);
  if (!Number.isFinite(total) || Math.abs(total - quantity) > EPSILON)
    return `El reparto del producto ${label} (${total}) no coincide con la cantidad a devolver (${quantity}).`;
  return '';
}

/** Validates every item (lines without inventory are skipped). Returns '' when valid. */
export function validateAllDistributions(items: readonly DistributionItem[]): string {
  for (const item of items) {
    const rows = item.BODEGAS ?? [];
    if (item.SIN_INVENTARIO) {
      const message = validateItemDistribution(item, rows);
      if (message) return message;
      continue;
    }
    if (item.SIN_REPARTO || !rows.length) return `El producto ${productLabel(item)} no tiene un reparto por bodega válido.`;
    const message = validateItemDistribution(item, rows);
    if (message) return message;
  }
  return '';
}

/** Flat ITM_DEVOLUCION_BOD rows (none for lines without inventory). */
export function flattenDistribution(items: readonly DistributionItem[]): Pick<Ven213ItemBodega, 'ITEM' | 'ID_UN_BODEGA' | 'CANTIDAD'>[] {
  return items.filter(item => !item.SIN_INVENTARIO).flatMap(item => (item.BODEGAS ?? []).map(row => ({
    ITEM: item.ITEM,
    ID_UN_BODEGA: row.ID_UN_BODEGA,
    CANTIDAD: Number(row.CANTIDAD)
  })));
}

/** Groups flat ITM_DEVOLUCION_BOD rows back into their items (inverse of flattenDistribution). */
export function groupDistribution<T extends DistributionItem>(items: readonly T[], rows: readonly Ven213ItemBodega[]): T[] {
  return items.map(item => {
    const bodegas = rows.filter(row => Number(row.ITEM) === Number(item.ITEM)).map(row => ({ ...row, ITEM: item.ITEM }));
    return { ...item, BODEGAS: bodegas, SIN_REPARTO: !!validateItemDistribution(item, bodegas) };
  });
}

/**
 * Rescales the proposed distribution to a new quantity keeping its proportions (hundredths, the remainder
 * goes to the largest rows). Lines without inventory return []. Returns null when there is nothing to rescale.
 */
export function rescaleDistribution(item: DistributionItem, quantity: unknown): Ven213ItemBodega[] | null {
  if (item.SIN_INVENTARIO) return [];
  const rows = item.BODEGAS ?? [];
  const target = toHundredths(quantity);
  const current = rows.map(row => toHundredths(row.CANTIDAD));
  const total = current.reduce((sum, value) => sum + value, 0);
  if (!rows.length || !isPositive(target) || !isPositive(total) || current.some(value => !Number.isFinite(value) || value < 0)) return null;
  const scaled = current.map(value => Math.floor(value * target / total));
  let remainder = target - scaled.reduce((sum, value) => sum + value, 0);
  const order = current.map((value, index) => index).sort((a, b) => current[b] - current[a]);
  for (let position = 0; remainder > 0; position = (position + 1) % order.length, remainder--) scaled[order[position]]++;
  return rows.map((row, index) => ({ ...row, ITEM: item.ITEM, CANTIDAD: scaled[index] / 100 })).filter(row => row.CANTIDAD > 0);
}
