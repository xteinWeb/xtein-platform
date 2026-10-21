/**
 * Returns the group and all its subgroups (legacy listaGruposRecur, COM201.component.ts:1412-1419),
 * without duplicates and protected against cyclic parents.
 */
export function descendantGroups(
  groups: readonly { ID_GRUPO: string; ID_GRUPO_PADRE: string }[],
  idGrupo: string
): Set<string> {
  const result = new Set<string>([idGrupo]);
  const pending = [idGrupo];
  while (pending.length) {
    const parent = pending.pop();
    for (const group of groups) {
      if (group.ID_GRUPO_PADRE === parent && !result.has(group.ID_GRUPO)) {
        result.add(group.ID_GRUPO);
        pending.push(group.ID_GRUPO);
      }
    }
  }
  return result;
}
