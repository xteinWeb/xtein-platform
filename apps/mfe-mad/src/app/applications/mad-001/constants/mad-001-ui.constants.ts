import {
  RecordToolbarCapabilities
} from '@xtein/sdk';

import {
  Mad001ApplicationRecord
} from '../models/mad-001.model';


/**
 * Empty MAD-001 record used by the create operation.
 */
export const Mad001DefaultRecord:
  Readonly<Mad001ApplicationRecord> = {

    ID_APLICACION:
      '',

    ID_APLICACION_PADRE:
      null,

    NOMBRE:
      '',

    TIPO:
      null,

    COMENTARIOS:
      null,

    ESTADO:
      'ACTIVO',

    ACCION:
      null,

    META_INFERIOR:
      0,

    META_SUPERIOR:
      0,

    UDM:
      null,

    NIVEL:
      null
  };


/**
 * Toolbar capabilities implemented by MAD-001
 * in the current migration stage.
 *
 * Search, quick view, print and configuration remain disabled
 * until their corresponding shared platform functionality is
 * migrated.
 *
 * Copy remains disabled because the legacy MAD-001 copy action
 * does not contain a functional implementation.
 */
export const Mad001ToolbarCapabilities:
  Partial<RecordToolbarCapabilities> = {

    create:
      true,

    edit:
      true,

    delete:
      true,

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
      true,

    download:
      false,

    print:
      false,

    configure:
      false
  };


/**
 * Application fields included in the local tree search.
 */
export const Mad001TreeSearchFields:
  readonly string[] = [

    'ID_APLICACION',

    'NOMBRE'
  ];