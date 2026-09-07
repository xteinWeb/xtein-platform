import {
  RecordToolbarCapabilities
} from '@xtein/sdk';
import { XteinRecordViewColumn } from '@xtein/ui';
import {
  Mad001ApplicationRecord
} from '../models/mad-001.model';

export const Mad001RecordViewColumns: XteinRecordViewColumn[] = [
  { dataField: 'ID_APLICACION', caption: 'Aplicación' },
  { dataField: 'NOMBRE', caption: 'Nombre' },
  { dataField: 'TIPO', caption: 'Tipo' },
  { dataField: 'ESTADO', caption: 'Estado' }
];


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
 * Search, quick view and reports use shared UI components.
 * Configuration remains disabled: the legacy form has no handler.
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
      true,

    refresh:
      true,

    copy:
      false,

    view:
      true,

    sort:
      false,

    navigation:
      true,

    download:
      false,

    print:
      true,

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
