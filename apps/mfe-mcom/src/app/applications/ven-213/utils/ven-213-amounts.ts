import type { Ven213Amounts, Ven213DevolucionItem, Ven213Gravamen } from '../models/ven-213.model';

/**
 * Mirror of the SP amount rule (invariant 4 of docs/contratos/ven-213-spDevolucion.md):
 * each field = ROUND(v_origen × q / Q, 2), rounding half away from zero like SQL ROUND,
 * computed in integer cents (BigInt) so the front preview matches the SP to the cent.
 * Closing rule: when the quantity exhausts the source line and CARGAR ORIGEN sent CIERRA='S', each field = RESTANTE.
 */

/** Rounds half away from zero (the native JS rounding sends −0.5 towards +∞). */
export function roundHalfAwayFromZero(value: number): number {
  const sign = value < 0 ? -1 : 1;
  return sign * Math.floor(Math.abs(value) + 0.5);
}

/** Integer hundredths of a value with at most 2 decimals (cents of an amount, hundredths of a quantity). */
export function toHundredths(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? roundHalfAwayFromZero(number * 100) : NaN;
}

function fromHundredths(value: number): number {
  return value / 100;
}

/** a × b / c rounded half away from zero, exact with BigInt (all integers, c ≠ 0). */
function scaleExact(a: number, b: number, c: number): number {
  const numerator = BigInt(a) * BigInt(b);
  const denominator = BigInt(c);
  const negative = (numerator < 0n) !== (denominator < 0n);
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const rounded = (2n * n + d) / (2n * d);
  return Number(negative ? -rounded : rounded);
}

/** ROUND(v × q / Q, 2) of one amount. */
export function proportionalValue(value: unknown, quantity: unknown, sourceQuantity: unknown): number {
  const q = toHundredths(quantity);
  const total = toHundredths(sourceQuantity);
  const cents = toHundredths(value);
  if (!Number.isFinite(q) || !Number.isFinite(total) || !Number.isFinite(cents) || total === 0) return 0;
  return fromHundredths(scaleExact(cents, q, total));
}

/** Each field (and each tax) proportional to its own source value. */
export function proportionalAmounts(source: Ven213Amounts, quantity: unknown, sourceQuantity: unknown): Ven213Amounts {
  return {
    SUB_TOTAL: proportionalValue(source.SUB_TOTAL, quantity, sourceQuantity),
    VALOR_DESCUENTO: proportionalValue(source.VALOR_DESCUENTO, quantity, sourceQuantity),
    TOTAL: proportionalValue(source.TOTAL, quantity, sourceQuantity),
    GRAV: (source.GRAV ?? []).map(tax => ({ ...tax, VALOR: proportionalValue(tax.VALOR, quantity, sourceQuantity) }))
  };
}

type QuantityItem = Pick<Ven213DevolucionItem, 'CANTIDAD' | 'CANTIDAD_ORIGEN' | 'CANTIDAD_DEVUELTA'>;

/**
 * Returnable maximum of a source line, in hundredths-exact decimals:
 * factura CANTIDAD − CANTIDAD_DEVUELTA; remisión MIN(CANTIDAD − CANTIDAD_DEVUELTA, CANTIDAD_PENDIENTE).
 */
export function returnMaximum(line: Pick<Ven213DevolucionItem, 'CANTIDAD_ORIGEN' | 'CANTIDAD_DEVUELTA' | 'CANTIDAD_PENDIENTE'>, type: string): number {
  const remaining = toHundredths(line.CANTIDAD_ORIGEN) - toHundredths(line.CANTIDAD_DEVUELTA);
  const max = type === 'REMISION' ? Math.min(remaining, toHundredths(line.CANTIDAD_PENDIENTE)) : remaining;
  return Number.isFinite(max) ? fromHundredths(Math.max(0, max)) : 0;
}

/** True when the quantity exhausts the source line: CANTIDAD_DEVUELTA + CANTIDAD = CANTIDAD_ORIGEN. */
export function closesLine(item: QuantityItem): boolean {
  return toHundredths(item.CANTIDAD_DEVUELTA) + toHundredths(item.CANTIDAD) === toHundredths(item.CANTIDAD_ORIGEN);
}

/** True when the closing rule applies: the quantity exhausts the line and the SP allows closing it (CIERRA_SP). */
export function usesClosingRule(item: QuantityItem & Pick<Ven213DevolucionItem, 'CIERRA_SP'>): boolean {
  return closesLine(item) && item.CIERRA_SP === true;
}

/** Amounts of a returned quantity (closing rule with RESTANTE, otherwise proportional to ORIGEN). */
export function returnAmounts(item: QuantityItem & Pick<Ven213DevolucionItem, 'ORIGEN' | 'RESTANTE' | 'CIERRA_SP'>): Ven213Amounts | null {
  if (usesClosingRule(item) && item.RESTANTE) return structuredClone(item.RESTANTE);
  if (!item.ORIGEN) return null;
  return proportionalAmounts(item.ORIGEN, item.CANTIDAD, item.CANTIDAD_ORIGEN);
}

/** Item with its amounts and CIERRA recalculated (items without source amounts keep theirs). */
export function applyAmounts<T extends Ven213DevolucionItem>(item: T): T {
  const amounts = returnAmounts(item);
  if (!amounts) return { ...item, CIERRA: usesClosingRule(item) };
  return { ...item, CIERRA: usesClosingRule(item), SUB_TOTAL: amounts.SUB_TOTAL, VALOR_DESCUENTO: amounts.VALOR_DESCUENTO,
    TOTAL: amounts.TOTAL, GRAVAMENES_LISTA: amounts.GRAV };
}

/** Sum of the taxes of a line. */
export function taxTotal(taxes: readonly Ven213Gravamen[] | undefined): number {
  return fromHundredths((taxes ?? []).reduce((sum, tax) => sum + toHundredths(tax.VALOR), 0));
}

/** Parses the GRAVAMENES text (ID_TASA^POR^VALOR|…, decimal comma). */
export function parseGravamenes(text: unknown): Ven213Gravamen[] {
  const number = (value: string | undefined) => {
    const text = String(value ?? '0').trim();
    return Number(text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text);
  };
  return String(text ?? '').split('|').map(part => part.split('^')).filter(parts => parts.length >= 3 && parts[0].trim())
    .map(([id, rate, value]) => ({ ID_TASA: id.trim(), POR: number(rate), VALOR: number(value) }));
}

/** Header totals: Σ of the lines in cents. */
export function sumAmounts(items: readonly Pick<Ven213DevolucionItem, 'SUB_TOTAL' | 'VALOR_DESCUENTO' | 'TOTAL' | 'GRAVAMENES_LISTA'>[]):
  { SUB_TOTAL: number; VALOR_DESCUENTO: number; IMPUESTOS: number; TOTAL: number } {
  const sum = (pick: (item: typeof items[number]) => number) => fromHundredths(items.reduce((total, item) => total + pick(item), 0));
  return {
    SUB_TOTAL: sum(item => toHundredths(item.SUB_TOTAL)),
    VALOR_DESCUENTO: sum(item => toHundredths(item.VALOR_DESCUENTO)),
    IMPUESTOS: sum(item => toHundredths(taxTotal(item.GRAVAMENES_LISTA))),
    TOTAL: sum(item => toHundredths(item.TOTAL))
  };
}
