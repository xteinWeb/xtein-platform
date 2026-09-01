/**
 * Defines the record toolbar permissions granted to the
 * current user for a specific XTEIN application.
 *
 * These permissions originate from USUARIOS_APL_ASO.
 */
export interface RecordToolbarPermissions {

  /**
   * Permission to create records.
   *
   * Database field:
   * CREAR
   */
  create: boolean;

  /**
   * Permission to modify existing records.
   *
   * Database field:
   * MODIFICAR
   */
  edit: boolean;

  /**
   * Permission to delete records.
   *
   * Database field:
   * ELIMINAR
   */
  delete: boolean;

  /**
   * Permission to search records.
   *
   * Database field:
   * BUSCAR
   */
  search: boolean;

  /**
   * Permission to list or print information.
   *
   * Database field:
   * LISTAR
   */
  print: boolean;

  /**
   * Permission to configure the application.
   *
   * Database field:
   * CONFIGURAR
   */
  configure: boolean;
}