import { RecordToolbarCapabilities } from '@xtein/sdk';

export const DASHBOARD_TOOLBAR_CAPABILITIES: Readonly<RecordToolbarCapabilities> = {
  create: false, edit: false, delete: false, search: false, refresh: true,
  copy: false, view: false, sort: false, navigation: false,
  download: false, print: false, configure: false
};
