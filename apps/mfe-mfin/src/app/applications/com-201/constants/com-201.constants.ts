/**
 * Defines the COM-201 application identifiers.
 */
export const Com201Application = {

  Id:
    'COM-201',

  BackendId:
    'COM201',

  Table:
    'LISTAS_PRECIOS'

} as const;


/**
 * Defines the existing backend endpoints used by COM-201.
 */
export const Com201Endpoint = {

  Query:
    `/${Com201Application.BackendId}/consulta`,

  Save:
    `/${Com201Application.BackendId}/save`,

  Delete:
    `/${Com201Application.BackendId}/delete`

} as const;


/**
 * Defines the backend actions supported by spListasPrecios.
 */
export const Com201Action = {

  /**
   * Base price lists available for a VENTAS / Generada / Precio Mercado list.
   */
  BaseLists:
    'LISTA BASE',

  /**
   * Validates whether a price list code already exists.
   */
  Exists:
    'EXISTE LISTA',

  /**
   * Standard record query (record filter).
   */
  Query:
    'consulta',

  /**
   * Loads the items of a price list (paged or complete).
   */
  Items:
    'consulta items lista',

  /**
   * Generates the prices of a product group.
   */
  GenerateGroup:
    'generar precios grupo',

  /**
   * Calculates PRECIO / PRECIO_BASE / PRECIO_IVA for one item.
   */
  CalculatePrice:
    'calcular precio',

  New:
    'new',

  Update:
    'update',

  Delete:
    'delete'

} as const;


/**
 * Represents a valid COM-201 backend action.
 */
export type Com201Action =
  typeof Com201Action[
    keyof typeof Com201Action
  ];
