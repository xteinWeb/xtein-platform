import { RecordToolbarCapabilities } from '@xtein/sdk';

/**
 * PRO-039 Consumos: salidas de inventario de tipo CONSUMO de producción.
 * Los movimientos se guardan en MOVIMIENTOS_PRO / ITM_MOVIMIENTOS_PRO (spMovimientosConsumos).
 */
export const Pro039Application = {
  Id: 'PRO-039',
  BackendId: 'PRO039',
  Table: 'MOVIMIENTOS',
  Title: 'Consumos',
  Movement: 'SALIDA',
  Type: 'CONSUMO',
  InventoryType: 'NUEVO'
} as const;
export type Pro039Application = typeof Pro039Application[keyof typeof Pro039Application];

export const Pro039Endpoint = {
  Query: `/${Pro039Application.BackendId}/consulta`,
  Save: `/${Pro039Application.BackendId}/save`,
  Delete: `/${Pro039Application.BackendId}/delete`
} as const;
export type Pro039Endpoint = typeof Pro039Endpoint[keyof typeof Pro039Endpoint];

export const Pro039Action = {
  New: 'new',
  Update: 'update',
  Delete: 'delete',
  Query: 'consulta',
  Additional: 'consulta adicionales'
} as const;
export type Pro039Action = typeof Pro039Action[keyof typeof Pro039Action];

/** Igual que Legacy: un consumo guardado no se modifica, solo se anula. */
export const Pro039ToolbarCapabilities: Readonly<RecordToolbarCapabilities> = {
  create: true,
  edit: false,
  delete: true,
  search: true,
  refresh: true,
  copy: false,
  view: true,
  sort: false,
  navigation: true,
  download: true,
  print: true,
  configure: false
};
