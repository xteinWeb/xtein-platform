/**
 * Defines the existing backend contract used to load
 * record-toolbar permissions.
 *
 * These values belong to the XTEIN legacy backend protocol and
 * are centralized here so they are not duplicated throughout
 * the platform.
 */
export const RecordToolbarBackend = {

  /**
   * Backend endpoint used to retrieve application permissions.
   */
  PermissionsEndpoint:
    '/operacionesAplUsr',

  /**
   * Backend action used to retrieve application permissions.
   */
  PermissionsAction:
    'OPERACIONES APLICACIONES USUARIO'

} as const;


/**
 * Defines the field names returned by the existing backend
 * record-toolbar permission response.
 *
 * These legacy names must remain isolated inside the runtime layer.
 */
export const LegacyRecordToolbarPermissionField = {

  /**
   * Permission to create records.
   */
  Create:
    'r_nuevo',

  /**
   * Permission to modify records.
   */
  Edit:
    'r_modificar',

  /**
   * Permission to delete records.
   */
  Delete:
    'r_eliminar',

  /**
   * Permission to search records.
   */
  Search:
    'r_buscar',

  /**
   * Permission to list or print records.
   */
  Print:
    'r_imprimir',

  /**
   * Permission to configure the application.
   */
  Configure:
    'r_configurar',

  /**
   * Existing backend error message.
   */
  ErrorMessage:
    'ErrMensaje'

} as const;