import { RecordToolbarCapabilities } from '@xtein/sdk';

/**
 * CAL-003 Servicios técnicos: inventario de los productos que los clientes devuelven por garantía (SG)
 * o reparación (SR), desde la entrada hasta su entrega o ajuste.
 * Contrato: docs/contratos/cal-003-spServicioTecnico.md (rutas /api/CAL003/*, SP dbo.spServicioTecnico).
 */
export const Cal003Application = {
  Id: 'CAL-003',
  BackendId: 'CAL003',
  Title: 'Servicios técnicos'
} as const;

/**
 * Tablas base del buscador estándar de la barra (xtein-record-filter). Sus campos están en
 * ITM_DOMINIOS COLUMNAS / FILTRO (apiRest sql/seed/55_cal003_filtros.sql) y el SP aplica sus criterios.
 */
export const Cal003FilterTable = {
  Services: 'RS_ST_SERVICIOS',
  Transfers: 'RS_ST_TRASLADOS',
  Deliveries: 'RS_ST_ENTREGAS',
  Adjustments: 'AJUSTES_ST'
} as const;

export const Cal003Endpoint = {
  Query: `/${Cal003Application.BackendId}/consulta`,
  Save: `/${Cal003Application.BackendId}/save`,
  SupportUpload: `/${Cal003Application.BackendId}/soporte-subir`,
  Support: `/${Cal003Application.BackendId}/soporte`
} as const;

/** prmAccion de cada ruta (lista blanca del controlador, contrato §2). */
export const Cal003Action = {
  // /consulta
  Permissions: 'permisos',
  Clients: 'clientes',
  Warehouses: 'bodegas',
  Areas: 'areas',
  ServiceTypes: 'tipos servicio',
  Products: 'productos',
  ProductTree: 'producto arbol',
  Services: 'servicios',
  Service: 'servicio',
  Transferable: 'servicios trasladables',
  Transfers: 'traslados',
  Deliverable: 'servicios entregables',
  Deliveries: 'entregas',
  Delivery: 'entrega',
  Adjustable: 'servicios ajustables',
  Adjustments: 'ajustes',
  SpecialPrices: 'precios especial',
  StockByWarehouse: 'inventario bodega',
  ClientServices: 'servicios cliente',
  History: 'historial',
  Notices: 'avisos',
  // /save
  EntryNew: 'entrada nueva',
  EntryVoid: 'entrada anular',
  TransferSend: 'traslado enviar',
  TransferReceive: 'traslado recibir',
  TransferReject: 'traslado rechazar',
  DeliveryDispatch: 'entrega despachar',
  DeliveryVoidLine: 'entrega anular linea',
  AdjustmentPropose: 'ajuste proponer',
  AdjustmentAuthorize: 'ajuste autorizar',
  AdjustmentReject: 'ajuste rechazar',
  PricesSave: 'precios guardar',
  // /soporte-subir y /soporte
  SupportAttach: 'soporte adjuntar',
  SupportView: 'soporte ver'
} as const;
export type Cal003Action = typeof Cal003Action[keyof typeof Cal003Action];

export const Cal003Tab = {
  Entry: 'entrada',
  Transfer: 'traslado',
  Delivery: 'entrega',
  Adjustment: 'ajuste',
  Prices: 'precios',
  Queries: 'consultas'
} as const;
export type Cal003Tab = typeof Cal003Tab[keyof typeof Cal003Tab];

export const Cal003Tabs: readonly { id: Cal003Tab; label: string }[] = [
  { id: Cal003Tab.Entry, label: 'Entrada' },
  { id: Cal003Tab.Transfer, label: 'Traslado' },
  { id: Cal003Tab.Delivery, label: 'Salida · Entrega' },
  { id: Cal003Tab.Adjustment, label: 'Salida · Ajuste' },
  { id: Cal003Tab.Prices, label: 'Precios ESPECIAL' },
  { id: Cal003Tab.Queries, label: 'Consultas' }
];

/**
 * Códigos con significado propio en el despacho: SG no genera cobro, SR genera pre-factura.
 * La lista de tipos sale de la BD (CALIDAD / TIPOS_SERVICIO_TECNICO, acción 'tipos servicio').
 */
export const Cal003ServiceType = {
  Warranty: 'SG',
  Repair: 'SR'
} as const;
export type Cal003ServiceType = string;

export const Cal003ServiceStatus = {
  InStock: 'EN INVENTARIO',
  Inactive: 'INACTIVO',
  Voided: 'ANULADO',
  AdjustmentProposed: 'AJUSTE PROPUESTO',
  Dispatched: 'DESPACHADO',
  Delivered: 'ENTREGADO',
  Adjusted: 'AJUSTADO'
} as const;

export const Cal003TransferStatus = {
  Sent: 'ENVIADO',
  Received: 'RECIBIDO',
  Rejected: 'RECHAZADO',
  Voided: 'ANULADO'
} as const;

export const Cal003DeliveryStatus = {
  Dispatched: 'DESPACHADO',
  Closed: 'CERRADO'
} as const;

export const Cal003AdjustmentStatus = {
  Proposed: 'PROPUESTO',
  Authorized: 'AUTORIZADO',
  Rejected: 'RECHAZADO'
} as const;

export const Cal003AdjustmentDestination = {
  New: 'NUEVO',
  Special: 'ESPECIAL',
  Scrap: 'BAJA'
} as const;
export type Cal003AdjustmentDestination = typeof Cal003AdjustmentDestination[keyof typeof Cal003AdjustmentDestination];

/** Límites del contrato (§1.4). */
export const Cal003Limits = {
  /** Clientes activos que se cargan en el selector. */
  ClientsTop: 5000,
  Observation: 500,
  ClientServiceNumber: 50,
  ReturnOrderNumber: 50,
  SupportMaxBytes: 3 * 1024 * 1024
} as const;

/**
 * Capacidades de la barra por pestaña. Los documentos solo se crean o se anulan (no se editan):
 * Delete es "Anular" en Entrada y "Anular la línea seleccionada" en Entrega.
 */
export const Cal003ToolbarCapabilities: Readonly<Record<Cal003Tab, Partial<RecordToolbarCapabilities>>> = {
  [Cal003Tab.Entry]: { create: true, edit: false, delete: true, search: true, refresh: true, copy: false, view: true, sort: false, navigation: true, download: false, print: false, configure: false },
  [Cal003Tab.Transfer]: { create: true, edit: false, delete: false, search: true, refresh: true, copy: false, view: true, sort: false, navigation: true, download: false, print: false, configure: false },
  [Cal003Tab.Delivery]: { create: true, edit: false, delete: true, search: true, refresh: true, copy: false, view: true, sort: false, navigation: true, download: false, print: true, configure: false },
  [Cal003Tab.Adjustment]: { create: true, edit: false, delete: false, search: true, refresh: true, copy: false, view: true, sort: false, navigation: true, download: false, print: false, configure: false },
  [Cal003Tab.Prices]: { create: false, edit: true, delete: false, search: false, refresh: true, copy: false, view: false, sort: false, navigation: false, download: false, print: false, configure: false },
  [Cal003Tab.Queries]: { create: false, edit: false, delete: false, search: false, refresh: true, copy: false, view: false, sort: false, navigation: false, download: false, print: false, configure: false }
};
