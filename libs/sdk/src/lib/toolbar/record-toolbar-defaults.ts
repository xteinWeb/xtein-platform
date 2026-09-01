import {
  RecordToolbarCapabilities
} from '../contracts/toolbar/record-toolbar-capabilities';

import {
  RecordToolbarPermissions
} from '../contracts/toolbar/record-toolbar-permissions';


/**
 * Defines the capabilities supported by the standard
 * XTEIN record toolbar.
 *
 * Individual applications can disable capabilities that
 * they do not implement.
 */
export const DefaultRecordToolbarCapabilities:
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

    navigation:
      true,

    print:
      true,

    configure:
      true
  };


/**
 * Defines a deny-by-default permission set.
 *
 * This value can be used while permissions are not yet loaded
 * or when no application/user association exists.
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