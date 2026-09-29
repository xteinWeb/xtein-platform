import { RecordToolbarCapabilities } from '@xtein/sdk';

/**
 * Defines the VEN-212 (Facturación) application identifiers and base configuration.
 */
export const Ven212Application = {
  Id: 'VEN-212',
  AliasId: 'VEN-012',
  Name: 'Facturación',
  Table: 'FACTURA'
} as const;

export type Ven212ApplicationId = typeof Ven212Application.Id | typeof Ven212Application.AliasId;

/**
 * Backend endpoints used by VEN-212.
 */
export const Ven212Endpoint = {
  Query: '/VEN212/consulta',
  Save: '/VEN212/save',
  Delete: '/VEN212/delete'
} as const;

export type Ven212Endpoint = typeof Ven212Endpoint[keyof typeof Ven212Endpoint];

/**
 * Supported operations on the VEN-212 endpoints.
 */
export const Ven212Action = {
  Query: 'consulta',
  QueryAdditional: 'consulta adicionales',
  Save: 'save',
  Delete: 'delete',
  Taxes: 'GRAVAMENES',
  Stock: 'EXISTENCIAS PRODUCTO',
  UpdateQuantity: 'actualizar cantidad',
  SettingsActions: 'acciones settings',
  LoadData: 'cargar datos'
} as const;

export type Ven212Action = typeof Ven212Action[keyof typeof Ven212Action];

/**
 * Record-toolbar capabilities for VEN-212.
 */
export const Ven212ToolbarCapabilities: Readonly<RecordToolbarCapabilities> = {
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
  configure: true
};
