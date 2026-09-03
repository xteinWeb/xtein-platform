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
 * Capabilities that require an application-specific implementation,
 * such as ordering and downloading, remain disabled by default and
 * must be enabled explicitly by each application.
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

    sort:
      false,

    navigation:
      true,

    download:
      false,

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