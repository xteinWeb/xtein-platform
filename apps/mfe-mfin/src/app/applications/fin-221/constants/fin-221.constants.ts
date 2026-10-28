/**
 * Defines the FIN-221 application identifiers.
 */
export const Fin221Application = {
  Id: 'FIN-221',
  BackendId: 'FIN221',
  Table: 'PLANES'
} as const;

/**
 * Defines the backend endpoints used by FIN-221 and related lookups.
 */
export const Fin221Endpoint = {
  Query: `/${Fin221Application.BackendId}/consulta`,
  Save: `/${Fin221Application.BackendId}/save`,
  Delete: `/${Fin221Application.BackendId}/delete`,
  CondicionesQuery: `/FIN230/consulta`
} as const;

/**
 * Defines the backend actions supported by spPlanesFinanciacion and spCondicionesPlanes.
 */
export const Fin221Action = {
  Planes: 'PLANES',
  Tasas: 'lista tasas',
  Factor: 'factor',
  Query: 'consulta',
  New: 'new',
  Update: 'update',
  Delete: 'delete',
  Report: 'FIN-221-001',
  Condiciones: 'condiciones'
} as const;

export type Fin221Action = typeof Fin221Action[keyof typeof Fin221Action];
