import {
  RecordToolbarCapabilities
} from '@xtein/sdk';

import {
  __APPLICATION_CLASS_PREFIX__Record
} from '../models/__APPLICATION_FILE_PREFIX__-record.model';


/**
 * Defines the initial record used when a create operation starts.
 *
 * Add a default value for every field introduced in
 * __APPLICATION_CLASS_PREFIX__Record.
 */
export const __APPLICATION_CLASS_PREFIX__DefaultRecord:
  Readonly<__APPLICATION_CLASS_PREFIX__Record> = {};


/**
 * Defines every standard toolbar capability for the application base.
 *
 * These values describe the functionality exposed by the generated
 * application. User authorization is loaded independently by
 * RecordToolbarPermissionsService.
 */
export const __APPLICATION_CLASS_PREFIX__ToolbarCapabilities:
  Readonly<RecordToolbarCapabilities> = {

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
      true,

    view:
      true,

    sort:
      true,

    navigation:
      true,

    download:
      true,

    print:
      true,

    configure:
      true
  };
