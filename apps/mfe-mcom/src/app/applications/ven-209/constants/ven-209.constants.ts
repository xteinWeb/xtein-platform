import { RecordToolbarCapabilities } from '@xtein/sdk';

/**
 * Defines the VEN-209 application identifiers.
 */
export const Ven209Application = {
  Id: 'VEN-209',
  BackendId: 'VEN209',
  Table: 'CLIENTES',
  Title: 'Clientes'
} as const;

export type Ven209Application = typeof Ven209Application[keyof typeof Ven209Application];

/**
 * Defines the existing backend endpoints used by VEN-209.
 */
export const Ven209Endpoint = {
  Query: `/${Ven209Application.BackendId}/consulta`,
  Save: `/${Ven209Application.BackendId}/save`,
  Delete: `/${Ven209Application.BackendId}/delete`,
  Filter: `/${Ven209Application.BackendId}/consulta-filtro`
} as const;

export type Ven209Endpoint = typeof Ven209Endpoint[keyof typeof Ven209Endpoint];

/**
 * Standard capabilities for VEN-209 toolbar integration.
 */
export const Ven209ToolbarCapabilities: Readonly<RecordToolbarCapabilities> = {
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
