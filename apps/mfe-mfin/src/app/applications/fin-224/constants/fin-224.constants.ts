/**
 * Defines the FIN-224 application identifiers.
 */
export const Fin224Application = {
  Id: 'FIN-224',
  BackendId: 'FIN224',
  Table: 'CONDICIONES_NEGOCIACION'
} as const;

/**
 * Defines the backend endpoints used by FIN-224 and related lookups.
 */
export const Fin224Endpoint = {
  Query: `/${Fin224Application.BackendId}/consulta`,
  Save: `/${Fin224Application.BackendId}/save`,
  Delete: `/${Fin224Application.BackendId}/delete`,
  PlanesQuery: `/FIN221/consulta`,
  ListasQuery: `/COM201/consulta`
} as const;

/**
 * Defines the backend actions supported by spCondicionNegocio and related SPs.
 */
export const Fin224Action = {
  Query: 'consulta',
  New: 'new',
  Update: 'update',
  Delete: 'delete',
  Report: 'FIN-224-001',
  Condiciones: 'CONDICIONES',
  Planes: 'PLANES',
  ListasPrecios: 'LISTAS PRECIOS'
} as const;

export type Fin224Action = typeof Fin224Action[keyof typeof Fin224Action];
