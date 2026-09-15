/**
 * Defines the VEN-230 application identifiers.
 */
export const Ven230Application = {

  Id:
    'VEN-230',

  BackendId:
    'VEN230',

  Table:
    'PREFACTURA'

} as const;


/**
 * Represents a valid VEN-230 application identifier.
 */
export type Ven230Application =
  typeof Ven230Application[
    keyof typeof Ven230Application
  ];


/**
 * Defines the existing backend endpoints used by VEN-230.
 *
 * Endpoint values are centralized here to avoid duplicating
 * backend route strings throughout the application.
 */
export const Ven230Endpoint = {

  /**
   * Query endpoint.
   */
  Query:
    `/${Ven230Application.BackendId}/consulta`,

  /**
   * Save endpoint.
   */
  Save:
    `/${Ven230Application.BackendId}/save`,

  /**
   * Delete endpoint.
   */
  Delete:
    `/${Ven230Application.BackendId}/delete`

} as const;


/**
 * Represents a valid VEN-230 backend endpoint.
 */
export type Ven230Endpoint =
  typeof Ven230Endpoint[
    keyof typeof Ven230Endpoint
  ];


/**
 * Defines the backend actions supported by VEN-230.
 *
 * These values belong to the existing backend contract and
 * must not be duplicated as string literals throughout
 * the application.
 */
export const Ven230Action = {

  /**
   * Loads the lists required by VEN-230.
   */
  DataLists:
    'datalists',

  /**
   * Executes the standard query operation.
   */
  Query:
    'consulta',

  /**
   * Loads detail items, taxes and payments for a selected prefactura.
   */
  QueryAdicionales:
    'consulta adicionales',

  /**
   * Creates a new prefactura record.
   */
  New:
    'new',

  /**
   * Updates an existing prefactura record.
   */
  Update:
    'update',

  /**
   * Deletes (cancels) an existing prefactura record.
   */
  Delete:
    'delete',

  /**
   * Validates whether a prefactura document already exists.
   */
  Exists:
    'existe',

  /**
   * Loads available client records.
   */
  Clientes:
    'CLIENTES',

  /**
   * Loads available warehouse records.
   */
  Bodegas:
    'BODEGAS',

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
 * Represents a valid VEN-230 backend action.
 */
export type Ven230Action =
  typeof Ven230Action[
    keyof typeof Ven230Action
  ];
