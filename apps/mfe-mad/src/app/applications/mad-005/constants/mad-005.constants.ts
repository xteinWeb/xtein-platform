/**
 * Defines the MAD-005 application identifiers.
 */
export const Mad005Application = {

  /**
   * XTEIN platform application identifier.
   */
  Id:
    'MAD-005',

  /**
   * Existing backend application identifier.
   */
  BackendId:
    'MAD005'

} as const;


/**
 * Represents a valid MAD-005 application identifier.
 */
export type Mad005Application =
  typeof Mad005Application[
    keyof typeof Mad005Application
  ];


/**
 * Defines the existing backend endpoints used by MAD-005.
 *
 * Endpoint values are centralized here to avoid duplicating
 * backend route strings throughout the application.
 */
export const Mad005Endpoint = {

  /**
   * Query endpoint.
   */
  Query:
    `/${Mad005Application.BackendId}/consulta`,

  /**
   * Save endpoint.
   */
  Save:
    `/${Mad005Application.BackendId}/save`,

  /**
   * Delete endpoint.
   */
  Delete:
    `/${Mad005Application.BackendId}/delete`

} as const;


/**
 * Represents a valid MAD-005 backend endpoint.
 */
export type Mad005Endpoint =
  typeof Mad005Endpoint[
    keyof typeof Mad005Endpoint
  ];


/**
 * Defines the backend actions supported by MAD-005.
 *
 * These values belong to the existing backend contract and
 * must not be duplicated as string literals throughout
 * the application.
 */
export const Mad005Action = {

  /**
   * Loads the lists required by MAD-005.
   */
  DataLists:
    'datalists',

  /**
   * Executes the standard query operation.
   */
  Query:
    'consulta',

  /**
   * Creates a new data source configuration.
   */
  New:
    'new',

  /**
   * Updates an existing data source configuration.
   */
  Update:
    'update',

  /**
   * Deletes an existing data source configuration.
   */
  Delete:
    'delete',

  /**
   * Validates whether a configuration key already exists.
   */
  Exists:
    'existe',

  /**
   * Validates whether another configuration is already
   * defined as the default data source.
   */
  ValidateDefault:
    'validatedefault'

} as const;


/**
 * Represents a valid MAD-005 backend action.
 */
export type Mad005Action =
  typeof Mad005Action[
    keyof typeof Mad005Action
  ];