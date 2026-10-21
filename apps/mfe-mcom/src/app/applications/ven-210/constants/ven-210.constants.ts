/**
 * Defines the VEN-210 application identifiers.
 */
export const Ven210Application = {

  Id:
    'VEN-210',

  BackendId:
    'VEN210',

  Table:
    'REMISION'

} as const;


/**
 * Represents a valid VEN-210 application identifier.
 */
export type Ven210Application =
  typeof Ven210Application[
    keyof typeof Ven210Application
  ];


/**
 * Defines the existing backend endpoints used by VEN-210.
 *
 * Endpoint values are centralized here to avoid duplicating
 * backend route strings throughout the application.
 */
export const Ven210Endpoint = {

  /**
   * Query endpoint.
   */
  Query:
    `/${Ven210Application.BackendId}/consulta`,

  /**
   * Save endpoint.
   */
  Save:
    `/${Ven210Application.BackendId}/save`,

  /**
   * Delete endpoint.
   */
  Delete:
    `/${Ven210Application.BackendId}/delete`

} as const;


/**
 * Represents a valid VEN-210 backend endpoint.
 */
export type Ven210Endpoint =
  typeof Ven210Endpoint[
    keyof typeof Ven210Endpoint
  ];


/**
 * Defines the backend actions supported by VEN-210.
 *
 * These values belong to the existing backend contract and
 * must not be duplicated as string literals throughout
 * the application.
 */
export const Ven210Action = {

  /**
   * Executes the standard query operation.
   */
  Query:
    'consulta',

  /**
   * Loads detail items, warehouse distribution and payments for a selected remisión.
   */
  QueryAdicionales:
    'consulta adicionales',

  /**
   * Creates a new remisión record.
   */
  New:
    'new',

  /**
   * Updates an existing remisión record.
   */
  Update:
    'update',

  /**
   * Cancels (ANULADA) an existing remisión record.
   */
  Delete:
    'delete',

  /**
   * Loads available client records.
   */
  Clientes:
    'CLIENTES',

  /**
   * Loads available currencies.
   */
  Monedas:
    'MONEDAS',

  /**
   * Loads pricing conditions.
   */
  CondicionesListas:
    'CONDICIONES LISTAS',

  /**
   * Loads business units.
   */
  UnidadesNegocios:
    'UNIDADES NEGOCIOS',

  /**
   * Loads document consecutive sequence.
   */
  DocumentosConsecutivo:
    'DOCUMENTOS CONSECUTIVO'

} as const;


/**
 * Represents a valid VEN-210 backend action.
 */
export type Ven210Action =
  typeof Ven210Action[
    keyof typeof Ven210Action
  ];
