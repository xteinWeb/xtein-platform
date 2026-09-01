/**
 * Represents the request data expected by the existing
 * XTEIN record-toolbar permission endpoint.
 *
 * Property names intentionally preserve the existing
 * backend JSON contract.
 */
export interface LegacyRecordToolbarPermissionsRequest {

  /**
   * Authenticated XTEIN user identifier.
   */
  usuario:
    string;

  /**
   * XTEIN application identifier.
   */
  aplicacion:
    string;
}


/**
 * Represents the permission object returned by the existing
 * XTEIN backend.
 *
 * Properties remain optional because the runtime mapper must
 * safely handle missing or incomplete backend responses.
 */
export interface LegacyRecordToolbarPermissionsResponse {

  /**
   * Existing CREATE permission.
   */
  r_nuevo?:
    boolean | number | string | null;

  /**
   * Existing MODIFY permission.
   */
  r_modificar?:
    boolean | number | string | null;

  /**
   * Existing DELETE permission.
   */
  r_eliminar?:
    boolean | number | string | null;

  /**
   * Existing SEARCH permission.
   */
  r_buscar?:
    boolean | number | string | null;

  /**
   * Existing LIST permission.
   */
  r_imprimir?:
    boolean | number | string | null;

  /**
   * Existing CONFIGURE permission.
   */
  r_configurar?:
    boolean | number | string | null;

  /**
   * Existing backend error message.
   */
  ErrMensaje?:
    string | null;
}