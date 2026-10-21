import type { Ven210OrderLink } from '../models/ven-210-business.model';
import type { Ven210RemisionItem, Ven210RemisionRecord } from '../models/ven-210.model';
import { baseQuantity, productLabel } from './ven-210-distribution';

/** Tolerance for decimal quantities. */
const EPSILON = 1e-9;

/** Order line returned by CARGAR PEDIDO. */
export type Ven210OrderLine = Partial<Ven210RemisionItem> & { NOMBRE?: string };

/** Header fields copied from the order (DOCUMENTO, FECHA and DESCRIPCION belong to the remisión). */
const OrderHeaderFields = ['ID_CLIENTE', 'NOMBRE_CLIENTE', 'ID_UBICACION', 'DIRECCION', 'ID_ADC', 'TIPO_VENTA', 'ID_CONDICION',
  'PLAZO', 'ID_MONEDA', 'TASA_CAMBIO', 'ID_UN_ITEM', 'CUOTA_INICIAL', 'FECHA_PRIMER_VENC'] as const;

type OrderHeaderField = typeof OrderHeaderFields[number];

/** Header values to patch into the form when an order is loaded. */
export function mapOrderHeader(order: Partial<Ven210RemisionRecord>): Partial<Pick<Ven210RemisionRecord, OrderHeaderField>> {
  const header: Partial<Record<OrderHeaderField, unknown>> = {};
  for (const field of OrderHeaderFields) {
    const value = order[field];
    if (value === undefined) continue;
    header[field] = field === 'FECHA_PRIMER_VENC' && value ? String(value).substring(0, 10) : value;
  }
  return header as Partial<Pick<Ven210RemisionRecord, OrderHeaderField>>;
}

/** Pending order lines as remisión items: CANTIDAD = CANTIDAD_MAX = pending, renumbered, without distribution. */
export function mapOrderItems(rows: readonly Ven210OrderLine[]): Ven210RemisionItem[] {
  const pendingRows = rows.filter(row => Number(row.CANTIDAD_PENDIENTE) > 0);
  const unlinked = pendingRows.find(row => row.ITEM_PED === undefined || row.ITEM_PED === null);
  if (unlinked) {
    const label = productLabel({ PRODUCTO: String(unlinked.PRODUCTO ?? ''), NOMBRE_PRODUCTO: unlinked.NOMBRE_PRODUCTO ?? unlinked.NOMBRE });
    throw new Error(`El producto ${label} del pedido no trae su número de línea (ITEM_PED); no se cargó el pedido.`);
  }
  return pendingRows
    .map((row, index) => {
      const pending = Number(row.CANTIDAD_PENDIENTE);
      const price = Number(row.VALOR_UNITARIO ?? 0);
      const item: Ven210RemisionItem = {
        ...row,
        ITEM: index + 1,
        ITEM_PED: row.ITEM_PED,
        PRODUCTO: String(row.PRODUCTO ?? ''),
        NOMBRE_PRODUCTO: row.NOMBRE_PRODUCTO ?? row.NOMBRE,
        CANTIDAD: pending,
        CANTIDAD_PENDIENTE: pending,
        CANTIDAD_MAX: pending,
        VALOR_UNITARIO: price,
        SUB_TOTAL: pending * price,
        TOTAL: pending * price,
        VALOR_DESCUENTO: 0,
        BODEGAS: [],
        SIN_REPARTO: true
      };
      delete (item as Ven210OrderLine).NOMBRE;
      item.CANTIDAD_REAL = baseQuantity(item, pending);
      return item;
    });
}

/**
 * First due date for a credit order loaded into a remisión: keeps the order's date when it is on or after
 * FECHA; when it is empty or earlier, recalculates it as FECHA + DIAS_VENC of the condition (as applyCondition does).
 * Dates are 'YYYY-MM-DD'. Returns null when FECHA is not a valid date.
 */
export function orderDueDate(fecha: string, current: string | null | undefined, diasVenc: number): string | null {
  const day = String(fecha ?? '').slice(0, 10);
  const base = new Date(`${day}T00:00:00`);
  if (Number.isNaN(base.getTime())) return null;
  const due = String(current ?? '').slice(0, 10);
  if (due && due >= day) return due;
  base.setDate(base.getDate() + (Number.isFinite(Number(diasVenc)) ? Number(diasVenc) : 0));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
}

/** Persistent order link of a saved remisión (null when it was not loaded from an order). */
export function orderLinkOf(record: Partial<Ven210RemisionRecord> | null | undefined): Ven210OrderLink | null {
  if (!record || record.ORIGEN_PEDIDO !== 'S' || !record.PED_ID_DOCUMENTO) return null;
  return {
    ID_DOCUMENTO: String(record.PED_ID_DOCUMENTO),
    PREFIJO: String(record.PED_PREFIJO ?? ''),
    CONSECUTIVO: Number(record.PED_CONSECUTIVO ?? 0),
    SUFIJO: String(record.PED_SUFIJO ?? '')
  };
}

/** Items loaded from an order may only lower their quantity: 0 < CANTIDAD ≤ CANTIDAD_MAX. Returns '' when valid. */
export function validateOrderQuantity(item: Pick<Ven210RemisionItem, 'PRODUCTO' | 'NOMBRE_PRODUCTO' | 'CANTIDAD' | 'CANTIDAD_MAX' | 'ITEM_PED'>): string {
  if (item.ITEM_PED === undefined || item.ITEM_PED === null) return '';
  const label = productLabel(item);
  const quantity = Number(item.CANTIDAD);
  const max = item.CANTIDAD_MAX === undefined || item.CANTIDAD_MAX === null ? NaN : Number(item.CANTIDAD_MAX);
  if (!Number.isFinite(quantity) || quantity <= 0) return `La cantidad del producto ${label} debe ser mayor que cero.`;
  if (!Number.isFinite(max)) return `El producto ${label} no tiene cantidad pendiente en el pedido.`;
  if (quantity > max + EPSILON) return `La cantidad del producto ${label} (${quantity}) supera el pendiente del pedido (${max}).`;
  return '';
}
