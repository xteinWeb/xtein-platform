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
 * Defines the record-toolbar capabilities currently implemented
 * by MAD-005.
 *
 * Shared platform operations such as advanced filtering, quick view,
 * reporting, and application configuration are enabled in later
 * migration stages after their reusable platform components exist.
 */
export const Mad005ToolbarCapabilities:
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

    navigation:
      true,

    print:
      false,

    configure:
      false
  };