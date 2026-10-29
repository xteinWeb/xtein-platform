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
 * Tabla base del buscador de la barra (xtein-record-filter): uno solo para toda la pantalla, con el campo
 * OPERACION para escoger qué documentos buscar. Sus campos están en ITM_DOMINIOS COLUMNAS / FILTRO
 * (apiRest sql/seed/55_cal003_filtros.sql) y el SP aplica los criterios.
 */
export const Cal003FilterTable = 'RS_ST_OPERACIONES';
export const Cal003FilterOperationField = 'OPERACION';

/** Valor del campo OPERACION del buscador → operación que se abre. */
export const Cal003FilterOperations: Readonly<Record<string, Cal003Tab>> = {
  ENTRADA: 'entrada',
  TRASLADO: 'traslado',
  ENTREGA: 'entrega',
  AJUSTE: 'ajuste',
  'PRECIOS ESPECIAL': 'precios',
  CONSULTAS: 'consultas'
};

/** Operaciones que se crean con Nuevo y se buscan con Buscar. */
export const Cal003RecordTabs: readonly Cal003Tab[] = ['entrada', 'traslado', 'entrega', 'ajuste'];

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
  NextDocument: 'consecutivo',
  Clients: 'clientes',
  Warehouses: 'bodegas',
  Areas: 'areas servicio',
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
  EntryReschedule: 'entrada reprogramar',
  TransferSend: 'traslado enviar',
  DeliveryDispatch: 'entrega despachar',
  DeliveryVoidLine: 'entrega anular linea',
  AdjustmentPropose: 'ajuste proponer',
  ServiceNc: 'servicio nc',
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

/**
 * Select Movimiento de la cabecera: ENTRADA (SEN), TRASLADO (STR) y SALIDA (SSA, la entrega). Ajuste, Precios
 * ESPECIAL y Consultas se abren desde Buscar → Operación.
 */
export const Cal003Movimientos: readonly { id: Cal003Tab; label: string }[] = [
  { id: Cal003Tab.Entry, label: 'ENTRADA' },
  { id: Cal003Tab.Transfer, label: 'TRASLADO' },
  { id: Cal003Tab.Delivery, label: 'SALIDA' }
];

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
  Deposit: 'DEPOSITO',
  Inactive: 'INACTIVO',
  Voided: 'ANULADO',
  AdjustmentProposed: 'AJUSTE PROPUESTO',
  Dispatched: 'DESPACHADO',
  Delivered: 'ENTREGADO',
  Adjusted: 'AJUSTADO'
} as const;

/** Como los consumos de PRO-039: REGISTRADO hasta que se autoriza o rechaza en Autorizaciones (ADM-225). */
export const Cal003TransferStatus = {
  Registered: 'REGISTRADO',
  Authorized: 'AUTORIZADO',
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
  [Cal003Tab.Prices]: { create: true, edit: true, delete: false, search: true, refresh: true, copy: false, view: false, sort: false, navigation: false, download: false, print: false, configure: false },
  [Cal003Tab.Queries]: { create: true, edit: false, delete: false, search: true, refresh: true, copy: false, view: false, sort: false, navigation: false, download: false, print: false, configure: false }
};
