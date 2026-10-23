import type { Ven213SourceLine, Ven213SourceLink } from '../models/ven-213-business.model';
import type { Ven213DevolucionItem, Ven213DevolucionRecord } from '../models/ven-213.model';
import { applyAmounts, parseGravamenes, returnMaximum, toHundredths } from './ven-213-amounts';
import { productLabel, rescaleDistribution, validateItemDistribution } from './ven-213-distribution';

/** Header fields inherited from the source document (DOCUMENTO, FECHA, DESCRIPCION and ID_CAUSA belong to the devolución). */
const SourceHeaderFields = ['ID_CLIENTE', 'NOMBRE_CLIENTE', 'DIRECCION', 'ID_ADC', 'TIPO_VENTA', 'ID_CONDICION', 'PLAZO',
  'ID_MONEDA', 'TASA_CAMBIO', 'ID_UN_ITEM'] as const;

type SourceHeaderField = typeof SourceHeaderFields[number];

/** 'S'/'N' (or boolean) flag of the SP as boolean. */
export function flag(value: unknown): boolean {
  return value === true || String(value ?? '').toUpperCase() === 'S';
}

/** Header values to patch into the form when a source document is loaded. */
export function mapSourceHeader(source: Partial<Ven213DevolucionRecord>): Partial<Pick<Ven213DevolucionRecord, SourceHeaderField>> {
  const header: Partial<Record<SourceHeaderField, unknown>> = {};
  for (const field of SourceHeaderFields) {
    const value = source[field];
    if (value !== undefined) header[field] = value;
  }
  return header as Partial<Pick<Ven213DevolucionRecord, SourceHeaderField>>;
}

/** Normalizes a line returned by the SP (SIN_INVENTARIO flag, numbers, taxes list). */
export function mapSourceLine(row: Ven213SourceLine): Ven213DevolucionItem {
  const item = {
    ...row,
    ITEM: Number(row.ITEM),
    PRODUCTO: String(row.PRODUCTO ?? ''),
    NOMBRE_PRODUCTO: row.NOMBRE_PRODUCTO ?? row.NOMBRE,
    ID_SOPORTE: String(row.ID_SOPORTE ?? ''),
    NC_PREFIJO: String(row.NC_PREFIJO ?? ''),
    NC_CONSECUTIVO: Number(row.NC_CONSECUTIVO ?? 0),
    NC_SUFIJO: String(row.NC_SUFIJO ?? ''),
    CANTIDAD: Number(row.CANTIDAD ?? 0),
    CANTIDAD_ORIGEN: Number(row.CANTIDAD_ORIGEN ?? 0),
    CANTIDAD_DEVUELTA: Number(row.CANTIDAD_DEVUELTA ?? 0),
    VALOR_UNITARIO: Number(row.VALOR_UNITARIO ?? 0),
    SUB_TOTAL: Number(row.SUB_TOTAL ?? 0),
    VALOR_DESCUENTO: Number(row.VALOR_DESCUENTO ?? 0),
    TOTAL: Number(row.TOTAL ?? 0),
    GRAVAMENES_LISTA: row.GRAVAMENES_LISTA ?? parseGravamenes(row.GRAVAMENES),
    SIN_INVENTARIO: flag(row.SIN_INVENTARIO),
    CIERRA: undefined,
    CIERRA_SP: flag(row.CIERRA)
  } as Ven213DevolucionItem & { NOMBRE?: string };
  delete item.NOMBRE;
  return item;
}

/**
 * Returnable lines of CARGAR ORIGEN: CANTIDAD = CANTIDAD_MAX (never above the maximum recomputed from the
 * line, remisión with MIN against CANTIDAD_PENDIENTE), ITEM = source ITEM, proposed distribution
 * (none for lines without inventory) and amounts proportional to the source.
 */
export function mapSourceItems(rows: readonly Ven213SourceLine[], type: string): Ven213DevolucionItem[] {
  const unlinked = rows.find(row => row.ITEM === undefined || row.ITEM === null);
  if (unlinked) {
    const label = productLabel({ PRODUCTO: String(unlinked.PRODUCTO ?? ''), NOMBRE_PRODUCTO: unlinked.NOMBRE_PRODUCTO ?? unlinked.NOMBRE });
    throw new Error(`El producto ${label} del documento origen no trae su número de línea (ITEM); no se cargó el documento.`);
  }
  return rows
    .map(row => ({ row, line: mapSourceLine(row) }))
    .map(({ row, line }) => ({ row, line, max: Math.min(Number(row.CANTIDAD_MAX ?? 0), returnMaximum(line, type)) }))
    .filter(({ max }) => max > 0)
    .map(({ row, line, max }) => {
      const bodegas = line.SIN_INVENTARIO ? [] : (row.BODEGAS ?? []).map(bodega => ({ ...bodega, ITEM: line.ITEM, CANTIDAD: Number(bodega.CANTIDAD) }));
      const item: Ven213DevolucionItem = { ...line, CANTIDAD: max, CANTIDAD_MAX: max, BODEGAS: bodegas };
      return applyAmounts({ ...item, SIN_REPARTO: !!validateItemDistribution(item, bodegas) });
    })
    .sort((a, b) => a.ITEM - b.ITEM);
}

/**
 * Applies a new quantity: amounts recalculated, distribution rescaled (lines without inventory never get
 * a distribution nor SIN_REPARTO).
 */
export function changeReturnQuantity(item: Ven213DevolucionItem, quantity: number): Ven213DevolucionItem {
  const next: Ven213DevolucionItem = { ...item, CANTIDAD: quantity };
  if (item.SIN_INVENTARIO) return applyAmounts({ ...next, BODEGAS: [], SIN_REPARTO: false });
  const rows = Number(item.CANTIDAD) === quantity ? item.BODEGAS ?? [] : rescaleDistribution(item, quantity) ?? [];
  return applyAmounts({ ...next, BODEGAS: rows, SIN_REPARTO: !!validateItemDistribution(next, rows) });
}

/** Persistent source link of a saved devolución (null when unknown). */
export function sourceLinkOf(record: Partial<Ven213DevolucionRecord> | null | undefined): Ven213SourceLink | null {
  if (!record || !record.ORIGEN_ID_DOCUMENTO) return null;
  return {
    TIPO: String(record.ORIGEN_TIPO ?? ''),
    ID_DOCUMENTO: String(record.ORIGEN_ID_DOCUMENTO),
    PREFIJO: String(record.ORIGEN_PREFIJO ?? ''),
    CONSECUTIVO: Number(record.ORIGEN_CONSECUTIVO ?? 0),
    SUFIJO: String(record.ORIGEN_SUFIJO ?? '')
  };
}

/** 0 < CANTIDAD ≤ CANTIDAD_MAX with at most 2 decimals. Returns '' when valid. */
export function validateReturnQuantity(item: Pick<Ven213DevolucionItem, 'PRODUCTO' | 'NOMBRE_PRODUCTO' | 'CANTIDAD' | 'CANTIDAD_MAX'>): string {
  const label = productLabel(item);
  const quantity = Number(item.CANTIDAD);
  const max = item.CANTIDAD_MAX === undefined || item.CANTIDAD_MAX === null ? NaN : Number(item.CANTIDAD_MAX);
  if (!Number.isFinite(quantity) || quantity <= 0) return `La cantidad a devolver del producto ${label} debe ser mayor que cero.`;
  if (Math.abs(quantity * 100 - toHundredths(quantity)) > 1e-6) return `La cantidad a devolver del producto ${label} admite máximo 2 decimales.`;
  if (!Number.isFinite(max)) return `El producto ${label} no tiene máximo devolvible.`;
  if (toHundredths(quantity) > toHundredths(max)) return `La cantidad a devolver del producto ${label} (${quantity}) supera el máximo devolvible (${max}).`;
  return '';
}

/** ITM_DEVOLUCION row of the save payload: quantity and source keys only (the SP computes the amounts). */
export function toSaveItem(item: Ven213DevolucionItem): Pick<Ven213DevolucionItem, 'ITEM' | 'PRODUCTO' | 'ATRIBUTO' | 'CANTIDAD'
  | 'ID_SOPORTE' | 'NC_PREFIJO' | 'NC_CONSECUTIVO' | 'NC_SUFIJO'> {
  return { ITEM: item.ITEM, PRODUCTO: item.PRODUCTO, ATRIBUTO: item.ATRIBUTO || 'SIN', CANTIDAD: Number(item.CANTIDAD),
    ID_SOPORTE: item.ID_SOPORTE, NC_PREFIJO: item.NC_PREFIJO, NC_CONSECUTIVO: item.NC_CONSECUTIVO, NC_SUFIJO: item.NC_SUFIJO };
}
