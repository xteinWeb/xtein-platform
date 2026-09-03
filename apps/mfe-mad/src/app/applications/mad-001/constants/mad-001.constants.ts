/**
 * Defines MAD-001 application identifiers.
 */
export const Mad001Application = {

  Id:
    'MAD-001',

  BackendId:
    'MAD001',

  Table:
    'APLICACIONES_ASOCIADAS'

} as const;


/**
 * Existing MAD-001 backend endpoints.
 */
export const Mad001Endpoint = {

  Query:
    `/${Mad001Application.BackendId}/consulta`,

  Save:
    `/${Mad001Application.BackendId}/save`,

  Delete:
    `/${Mad001Application.BackendId}/delete`

} as const;


/**
 * Existing MAD-001 backend actions.
 */
export const Mad001Action = {

  DataLists:
    'datalists',

  ParentApplications:
    'APLICACIONES',

  ApplicationTree:
    'ARBOL_APLICACIONES',

  Query:
    'consulta',

  Exists:
    'existe',

  New:
    'new',

  Update:
    'update',

  Delete:
    'delete'

} as const;


/**
 * Existing application type used to retrieve parent modules.
 */
export const Mad001ParentApplicationType =
  'MODULO';