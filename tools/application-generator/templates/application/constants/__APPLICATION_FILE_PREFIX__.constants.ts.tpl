/**
 * Defines the application identifiers.
 */
export const __APPLICATION_CLASS_PREFIX__Application = {

  Id:
    '__APPLICATION_ID__',

  BackendId:
    '__BACKEND_ID__',

  Table:
    '__TABLE_NAME__'

} as const;


/**
 * Defines the standard backend endpoints used by the application.
 */
export const __APPLICATION_CLASS_PREFIX__Endpoint = {

  Query:
    `/${__APPLICATION_CLASS_PREFIX__Application.BackendId}/consulta`,

  Save:
    `/${__APPLICATION_CLASS_PREFIX__Application.BackendId}/save`,

  Delete:
    `/${__APPLICATION_CLASS_PREFIX__Application.BackendId}/delete`

} as const;


/**
 * Represents a valid backend endpoint.
 */
export type __APPLICATION_CLASS_PREFIX__Endpoint =
  typeof __APPLICATION_CLASS_PREFIX__Endpoint[
    keyof typeof __APPLICATION_CLASS_PREFIX__Endpoint
  ];


/**
 * Defines the standard backend actions used by the application.
 */
export const __APPLICATION_CLASS_PREFIX__Action = {

  DataLists:
    'datalists',

  Query:
    'consulta',

  New:
    'new',

  Update:
    'update',

  Delete:
    'delete',

  Exists:
    'existe'

} as const;


/**
 * Represents a valid backend action.
 */
export type __APPLICATION_CLASS_PREFIX__Action =
  typeof __APPLICATION_CLASS_PREFIX__Action[
    keyof typeof __APPLICATION_CLASS_PREFIX__Action
  ];
