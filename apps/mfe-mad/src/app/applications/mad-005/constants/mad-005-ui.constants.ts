import {
  RecordToolbarCapabilities
} from '@xtein/sdk';

import {
  Mad005DataSourceConfiguration
} from '../models/mad-005.model';


/**
 * Defines a boolean option displayed by MAD-005.
 */
export interface Mad005BooleanOption {

  /**
   * User-facing option text.
   */
  text: string;

  /**
   * Backend boolean value.
   */
  value: boolean;
}


/**
 * Defines the available active-state options.
 */
export const Mad005StatusOptions:
  readonly Mad005BooleanOption[] = [

    {
      text:
        'ACTIVO',

      value:
        true
    },

    {
      text:
        'INACTIVO',

      value:
        false
    }

  ];


/**
 * Defines the available default-connection options.
 */
export const Mad005DefaultOptions:
  readonly Mad005BooleanOption[] = [

    {
      text:
        'Sí',

      value:
        true
    },

    {
      text:
        'No',

      value:
        false
    }

  ];


/**
 * Defines the default MAD-005 record used when creating
 * a new data source configuration.
 */
export const Mad005DefaultRecord:
  Readonly<Mad005DataSourceConfiguration> = {

    ID_ORIGEN_DATO:
      -1,

    NOMBRE:
      '',

    ORIGEN_DATO:
      '',

    PARAMETROS:
      '',

    DEFECTO:
      false,

    ACTIVO:
      true,

    COMENTARIOS:
      null
  };


/**
 * Defines the record-toolbar capabilities implemented
 * by MAD-005.
 *
 * Every capability is declared explicitly so newly added
 * platform capabilities cannot become enabled accidentally
 * through shared defaults.
 */
export const Mad005ToolbarCapabilities:
  Readonly<RecordToolbarCapabilities> = {

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