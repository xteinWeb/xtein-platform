import type { XteinGridColumn, XteinRecordViewColumn } from '@xtein/ui';
import type { Ven229Lookup } from '../models/ven-229-business.model';
import type { Ven229PedidoRecord } from '../models/ven-229.model';

/**
 * Columns displayed in the quick view modal (XteinRecordViewComponent).
 */
export const Ven229RecordViewColumns: XteinRecordViewColumn[] = [
  { dataField: 'DOCUMENTO', caption: 'Documento' },
  { dataField: 'FECHA', caption: 'Fecha de Entrega' },
  { dataField: 'ID_CLIENTE', caption: 'Nit / Cédula' },
  { dataField: 'NOMBRE_CLIENTE', caption: 'Cliente' },
  { dataField: 'TOTAL', caption: 'Total' },
  { dataField: 'ESTADO', caption: 'Estado' }
];

/**
 * Available document status options for Pedidos.
 */
export const Ven229StatusOptions = [
  { text: 'REGISTRADO', value: 'REGISTRADO' },
  { text: 'EN PROCESO', value: 'EN PROCESO' },
  { text: 'COMPLETADO', value: 'COMPLETADO' },
  { text: 'PROGRAMADO', value: 'PROGRAMADO' },
  { text: 'ANULADO', value: 'ANULADO' }
] as const;

/**
 * Available sale type options.
 */
export const Ven229TipoVentaOptions = [
  { text: 'CONTADO', value: 'CONTADO' },
  { text: 'CREDITO', value: 'CREDITO' }
] as const;

/**
 * Initial empty record for new pedidos.
 */
export const Ven229DefaultRecord: Readonly<Ven229PedidoRecord> = {
  ID_UN: '',
  ID_UN_ITEM: '',
  ID_DOCUMENTO: '',
  NOMBRE_DOCUMENTO: 'Pedido',
  PREFIJO: '',
  CONSECUTIVO: 0,
  SUFIJO: '',
  DOCUMENTO: '',
  DOCUMENTO_FAC: '',
  FECHA_REGISTRO: null,
  FECHA: null,
  HORA: null,
  ID_CLIENTE: '',
  NOMBRE_CLIENTE: '',
  ID_ADC: '',
  ID_CONDICION: '',
  DESCRIPCION: '',
  ID_MONEDA: '',
  TASA_CAMBIO: 1,
  VIGENCIA: null,
  ID_DOC_SOPORTE: '',
  NC_DOC_SOPORTE: 0,
  FECHA_AUTORIZACION: null,
  CUOTA_INICIAL: 0,
  PLAZO: 0,
  CONDICIONES_GENERALES: '',
  SUB_TOTAL: 0,
  VALOR_DESCUENTO: 0,
  GRAVAMENES: '',
  VALOR_COSTOS: 0,
  TOTAL: 0,
  TIPO_VENTA: 'CONTADO',
  VALOR_CUOTA: 0,
  VALOR_PRIMER_CUOTA: 0,
  FECHA_PRIMER_VENC: null,
  DIAS_CUOTA: 0,
  UM_DIAS_CUOTA: 'DIAS',
  USUARIO: '',
  ESTADO: 'REGISTRADO',
  VALOR_FIN_COSTOS: 0,
  FECHA_OC: null,
  ID_UBICACION: '',
  DIRECCION: '',
  ID_UN_BODEGA: '',
  CUFE: '',
  VALOR_BASE: 0
};

export const Ven229ClientColumns: XteinGridColumn<Ven229Lookup, unknown>[] = [
  { dataField: 'ID_CLIENTE', caption: 'Documento del Cliente', width: 130 },
  { dataField: 'NOMBRE_COMPLETO', caption: 'Nombre del Cliente' }
];

export const Ven229UnitColumns: XteinGridColumn<Ven229Lookup, unknown>[] = [
  { dataField: 'ID_UN', caption: 'Código', width: 110 },
  { dataField: 'NOMBRE', caption: 'Nombre de Unidad de Negocio' }
];

export const Ven229CurrencyColumns: XteinGridColumn<Ven229Lookup, unknown>[] = [
  { dataField: 'ID_MONEDA', caption: 'Código', width: 130 },
  { dataField: 'DESCRIPCION', caption: 'Nombre de Moneda' }
];

export const Ven229SellerColumns: XteinGridColumn<Ven229Lookup, unknown>[] = [
  { dataField: 'ID_ADC', caption: 'Código de Vendedor', width: 130 },
  { dataField: 'NOMBRE_COMPLETO', caption: 'Nombre de Vendedor' }
];

export const Ven229WarehouseColumns: XteinGridColumn<Ven229Lookup, unknown>[] = [
  { dataField: 'ID_UN_BODEGA', caption: 'Bodega', width: 130 },
  { dataField: 'DESCRIPCION', caption: 'Descripción' },
  { dataField: 'NOMBRE_UN', caption: 'Unidad de Negocio' }
];

export const Ven229ConditionColumns: XteinGridColumn<Ven229Lookup, unknown>[] = [
  { dataField: 'CODIGO', caption: 'Código', width: 130 },
  { dataField: 'NOMBRE', caption: 'Nombre de Condición/Lista' }
];
