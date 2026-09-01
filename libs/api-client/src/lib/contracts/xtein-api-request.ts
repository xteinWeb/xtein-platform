import {
  XteinApiAccessMode
} from './xtein-api-access-mode';


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
   * Determines whether the request requires
   * an authenticated XTEIN session.
   */
  accessMode: XteinApiAccessMode;
}