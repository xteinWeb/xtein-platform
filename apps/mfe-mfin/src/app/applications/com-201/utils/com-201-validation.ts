import { Com201Message } from '../constants/com-201-ui.constants';
import { Com201Item } from '../models/com-201-item.model';
import { Com201ListaPrecios } from '../models/com-201-record.model';

/**
 * Header validation (legacy validatingData, COM201.component.ts:1222-1234) plus bug 2:
 * FECHA_FINAL cannot be lower than FECHA_INICIO.
 */
export function validateHeader(header: Pick<Com201ListaPrecios, 'ID_LISTA' | 'DESCRIPCION' | 'FECHA_INICIO' | 'FECHA_FINAL'>): string {
  if (!String(header.ID_LISTA ?? '').trim()) return Com201Message.missingCode;
  if (!String(header.DESCRIPCION ?? '').trim()) return Com201Message.missingName;
  const start = String(header.FECHA_INICIO ?? '').slice(0, 10);
  const end = String(header.FECHA_FINAL ?? '').slice(0, 10);
  if (start && end && end < start) return Com201Message.invalidDates;
  return '';
}

/**
 * Uniqueness key of an item (bug 4): PRODUCTO + UDM_PRES, plus ATRIBUTO when APLICACION_PRECIO = Atributo.
 */
export function itemKey(item: Pick<Com201Item, 'PRODUCTO' | 'UDM_PRES' | 'ATRIBUTO'>, byAttribute: boolean): string {
  const key = [item.PRODUCTO ?? '', item.UDM_PRES ?? ''];
  if (byAttribute) key.push(item.ATRIBUTO ?? '');
  return JSON.stringify(key);
}

/**
 * Finds another row with the same key, searching every row except the row itself.
 */
export function findDuplicate(rows: readonly Com201Item[], row: Com201Item, byAttribute: boolean): Com201Item | undefined {
  const key = itemKey(row, byAttribute);
  return rows.find(item => item.ITEM !== row.ITEM && itemKey(item, byAttribute) === key);
}

/**
 * Groups of rows that share the same key.
 */
export function duplicateGroups(rows: readonly Com201Item[], byAttribute: boolean): Com201Item[][] {
  const groups = new Map<string, Com201Item[]>();
  for (const row of rows) {
    const key = itemKey(row, byAttribute);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.values()].filter(group => group.length > 1);
}

/**
 * Row completeness (legacy onRowValidating, COM201.component.ts:1501-1512).
 */
export function itemIncomplete(row: Com201Item): boolean {
  return !row.PRODUCTO || !row.NOMBRE || Number(row.PRECIO || 0) === 0 || !row.ATRIBUTO || !row.UDM_PRES;
}
