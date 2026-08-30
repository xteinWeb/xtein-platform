/**
 * Defines how a request accesses the existing XTEIN backend.
 *
 * Public requests are used before authentication and do not require
 * an authenticated session.
 *
 * Authenticated requests require the current XTEIN session and include
 * the user, company, and authentication token.
 */
export type XteinApiAccessMode =
  | 'public'
  | 'authenticated';

/**
 * Defines a request executed against the existing XTEIN backend.
 *
 * Backend-specific request formatting is handled exclusively by
 * XteinApiClientService.
 */
export interface XteinApiRequest<TData = unknown> {

  /**
   * Relative backend endpoint.
   *
   * Examples:
   * /usuarioLogin
   * /usuarioValido
   * /home
   * /ADM401/aplicaciones
   */
  endpoint: string;

  /**
   * Backend action to execute.
   *
   * Examples:
   * USUARIO CREDENCIALES
   * USUARIO VALIDO
   * USUARIO APLICACIONES
   */
  action: string;

  /**
   * Data associated with the backend action.
   */
  data: TData;

  /**
   * Determines whether the request requires an authenticated session.
   */
  accessMode: XteinApiAccessMode;
}