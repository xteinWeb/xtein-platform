/**
 * Defines the record-toolbar permissions returned by
 * the existing XTEIN authorization infrastructure.
 *
 * These properties correspond to the user operations
 * configured for one application.
 */
export interface RecordToolbarPermissions {

  /**
   * User can create records.
   *
   * Legacy operation:
   * r_nuevo
   */
  create:
    boolean;


  /**
   * User can modify records.
   *
   * Legacy operation:
   * r_modificar
   */
  edit:
    boolean;


  /**
   * User can delete records.
   *
   * Legacy operation:
   * r_eliminar
   */
  delete:
    boolean;


  /**
   * User can search records.
   *
   * Legacy operation:
   * r_buscar
   */
  search:
    boolean;


  /**
   * User can print/report information.
   *
   * Legacy operation:
   * r_imprimir
   */
  print:
    boolean;


  /**
   * User can configure the application.
   *
   * Legacy operation:
   * r_configurar
   */
  configure:
    boolean;
}


/**
 * Safe default permissions used until the application's
 * real permissions have been loaded.
 *
 * Deny-by-default prevents the toolbar from temporarily
 * exposing unauthorized operations.
 */
export const DeniedRecordToolbarPermissions:
  Readonly<RecordToolbarPermissions> = {

    create:
      false,

    edit:
      false,

    delete:
      false,

    search:
      false,

    print:
      false,

    configure:
      false
  };