import { RecordToolbarCapabilities } from '@xtein/sdk';

/**
 * COM-208 Consumos: salidas de inventario de tipo CONSUMO de producción.
 * Los movimientos se guardan en MOVIMIENTOS_PRO / ITM_MOVIMIENTOS_PRO (spMovimientosConsumos).
 */
export const Com208Application = {
  Id: 'COM-208',
  BackendId: 'COM208',
  Table: 'MOVIMIENTOS',
  Title: 'Consumos',
  Movement: 'SALIDA',
  Type: 'CONSUMO',
  InventoryType: 'NUEVO'
} as const;
export type Com208Application = typeof Com208Application[keyof typeof Com208Application];

export const Com208Endpoint = {
  Query: `/${Com208Application.BackendId}/consulta`,
  Save: `/${Com208Application.BackendId}/save`,
  Delete: `/${Com208Application.BackendId}/delete`
} as const;
export type Com208Endpoint = typeof Com208Endpoint[keyof typeof Com208Endpoint];

export const Com208Action = {
  New: 'new',
  Update: 'update',
  Delete: 'delete',
  Query: 'consulta',
  Additional: 'consulta adicionales'
} as const;
export type Com208Action = typeof Com208Action[keyof typeof Com208Action];

/** Igual que Legacy: un consumo guardado no se modifica, solo se anula. */
export const Com208ToolbarCapabilities: Readonly<RecordToolbarCapabilities> = {
  create: true,
  edit: false,
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
