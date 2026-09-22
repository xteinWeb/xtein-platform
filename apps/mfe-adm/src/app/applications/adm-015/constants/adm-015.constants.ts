import { RecordToolbarCapabilities } from '@xtein/sdk';

/**
 * Defines the ADM-015 (Usuarios) application identifiers.
 */
export const Adm015Application = {
  Id: 'ADM-015',
  BackendId: 'ADM015',
  Table: 'USUARIOS',
  Title: 'Usuarios'
} as const;

export type Adm015Application = typeof Adm015Application[keyof typeof Adm015Application];

/**
 * Defines backend endpoints used by ADM-015.
 */
export const Adm015Endpoint = {
  Query: `/${Adm015Application.BackendId}/consulta`,
  Save: `/${Adm015Application.BackendId}/save`,
  Create: `/${Adm015Application.BackendId}/create`,
  Update: `/${Adm015Application.BackendId}/update`,
  Delete: `/${Adm015Application.BackendId}/delete`,
  ChangePassword: `/${Adm015Application.BackendId}/generatePassword`,
  Integrity: `/${Adm015Application.BackendId}/consulta`
} as const;

export type Adm015Endpoint = typeof Adm015Endpoint[keyof typeof Adm015Endpoint];

/**
 * Standard capabilities for ADM-015 toolbar integration.
 */
export const Adm015ToolbarCapabilities: Readonly<RecordToolbarCapabilities> = {
  create: true,
  edit: true,
  delete: true,
  search: true,
  refresh: true,
  copy: false,
  view: true,
  sort: false,
  navigation: true,
  download: false,
  print: true,
  configure: false
};
