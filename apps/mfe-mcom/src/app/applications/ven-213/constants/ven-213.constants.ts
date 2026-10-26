/**
 * Defines the VEN-213 application identifiers.
 */
export const Ven213Application = {

  Id:
    'VEN-213',

  BackendId:
    'VEN213',

  Table:
    'DEVOLUCION'

} as const;


/**
 * Represents a valid VEN-213 application identifier.
 */
export type Ven213Application =
  typeof Ven213Application[
    keyof typeof Ven213Application
  ];


/**
 * Defines the existing backend endpoints used by VEN-213.
 *
 * Endpoint values are centralized here to avoid duplicating
 * backend route strings throughout the application.
 */
export const Ven213Endpoint = {

  /**
   * Query endpoint.
   */
  Query:
    `/${Ven213Application.BackendId}/consulta`,

  /**
   * Save endpoint.
   */
  Save:
    `/${Ven213Application.BackendId}/save`,

  /**
   * Delete endpoint.
   */
  Delete:
    `/${Ven213Application.BackendId}/delete`

} as const;


/**
 * Represents a valid VEN-213 backend endpoint.
 */
export type Ven213Endpoint =
  typeof Ven213Endpoint[
    keyof typeof Ven213Endpoint
  ];


/**
 * Defines the backend actions supported by VEN-213 (see docs/contratos/ven-213-spDevolucion.md).
 *
 * A devolución is never edited: only created (new) and cancelled (delete).
 */
export const Ven213Action = {

  /**
   * Executes the standard query operation.
   */
  Query:
    'consulta',

  /**
   * Loads detail items and the restock distribution of a selected devolución.
   */
  QueryAdicionales:
    'consulta adicionales',

  /**
   * Creates a new devolución record.
   */
  New:
    'new',

  /**
   * Cancels (ANULADA) an existing devolución record.
   */
  Delete:
    'delete'

} as const;


/**
 * Represents a valid VEN-213 backend action.
 */
export type Ven213Action =
  typeof Ven213Action[
    keyof typeof Ven213Action
  ];
