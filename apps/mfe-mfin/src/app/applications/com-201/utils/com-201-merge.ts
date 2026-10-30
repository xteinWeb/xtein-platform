import { Com201Item } from '../models/com-201-item.model';
import { Com201MergeResult } from '../models/com-201-business.model';

/**
 * Merges the response of `generar precios grupo` exactly as the legacy application
 * (COM201.component.ts:612-635):
 * 1. keeps only the response rows whose ID_GRUPO belongs to the affected groups;
 * 2. removes from the list the items of those groups whose PRODUCTO is not in the response;
 * 3. replaces the whole row of the first item with the same PRODUCTO, or appends it.
 *
 * Only technical adaptation: ITEM is the grid key, so a row with a missing or
 * repeated ITEM receives max + 1. It does not change which rows remain.
 */
export function mergeLikeLegacy(
  list: readonly Com201Item[],
  response: readonly Com201Item[],
  groups: ReadonlySet<string>
): Com201MergeResult {
  const productosGrupo = response.filter(item => groups.has(item.ID_GRUPO));
  const productosRespuesta = new Set(productosGrupo.map(item => item.PRODUCTO));
  const items = list.filter(item => !groups.has(item.ID_GRUPO) || productosRespuesta.has(item.PRODUCTO));
  const merged = new Set<Com201Item>();

  for (const lis of productosGrupo) {
    const row = { ...lis };
    const ix = items.findIndex(item => item.PRODUCTO === lis.PRODUCTO);
    if (ix !== -1) items[ix] = row;
    else items.push(row);
    merged.add(row);
  }

  let max = items.reduce((value, item) => Number.isFinite(Number(item.ITEM)) ? Math.max(value, Number(item.ITEM)) : value, 0);
  const used = new Set<number>();
  const mergedKeys = new Set<number>();
  const result = items.map(item => {
    let key = Number(item.ITEM);
    const fixed = (item.ITEM as unknown) == null || !Number.isFinite(key) || used.has(key);
    if (fixed) key = ++max;
    used.add(key);
    if (merged.has(item)) mergedKeys.add(key);
    return fixed ? { ...item, ITEM: key } : item;
  });

  return { items: result, mergedKeys };
}
