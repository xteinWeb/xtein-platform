import { RecordToolbarCapabilities } from '@xtein/sdk';

/**
 * Defines the VEN-229 (Pedidos) application identifiers.
 */
export const Ven229Application = {
  Id: 'VEN-229',
  BackendId: 'VEN229',
  Table: 'Pedido',
  Title: 'Pedidos'
} as const;

export type Ven229Application = typeof Ven229Application[keyof typeof Ven229Application];

/**
 * Defines backend endpoints used by VEN-229.
 */
export const Ven229Endpoint = {
  Query: `/${Ven229Application.BackendId}/consulta`,
  Save: `/${Ven229Application.BackendId}/save`,
  Delete: `/${Ven229Application.BackendId}/delete`
} as const;

export type Ven229Endpoint = typeof Ven229Endpoint[keyof typeof Ven229Endpoint];

export const Ven229Action = {
  New: 'new',
  Update: 'update',
  Delete: 'delete',
  Query: 'consulta'
} as const;

export type Ven229Action = typeof Ven229Action[keyof typeof Ven229Action];

/**
 * Standard toolbar capabilities for VEN-229.
 */
export const Ven229ToolbarCapabilities: Readonly<RecordToolbarCapabilities> = {
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
