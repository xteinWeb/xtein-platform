import {
  RecordToolbarCapabilities
} from '@xtein/sdk';


/**
 * Toolbar capabilities currently implemented by MAD-002.
 *
 * Dashboard creation, edition and persistence are handled
 * by the DevExpress Dashboard Designer itself.
 *
 * The shared XTEIN record toolbar only exposes operations
 * that belong to MAD-002 at application level.
 */
export const Mad002ToolbarCapabilities:
  Partial<RecordToolbarCapabilities> = {

    create:
      false,

    edit:
      false,

    delete:
      false,

    search:
      false,

    refresh:
      true,

    copy:
      false,

    view:
      false,

    sort:
      false,

    navigation:
      false,

    download:
      false,

    print:
      false,

    configure:
      false
  };


/**
 * Fields included in the local application-tree search.
 */
export const Mad002TreeSearchFields:
  readonly string[] = [

    'ID_APLICACION',

    'NOMBRE',

    'TIPO'

  ];