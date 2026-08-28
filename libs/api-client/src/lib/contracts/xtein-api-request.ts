/**
 * Defines a request executed against the existing XTEIN backend.
 *
 * Functional services provide only the endpoint, action, and data.
 * Backend-specific request formatting is handled by the API client.
 */
export interface XteinApiRequest {

  /**
   * Relative backend endpoint.
   *
   * Examples:
   * /home
   * /ADM401/aplicaciones
   */
  endpoint: string;

  /**
   * Backend action to execute.
   *
   * Example:
   * USUARIO APLICACIONES
   */
  action: string;

  /**
   * Data associated with the backend action.
   */
  data: unknown;
}