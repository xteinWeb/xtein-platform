import type { XteinGridColumn } from '@xtein/ui';
import type { Ven230Lookup } from '../models/ven-230-business.model';
import {
  RecordToolbarCapabilities
} from '@xtein/sdk';

import {
  XteinRecordViewColumn
} from '@xtein/ui';

import {
  Ven230Option,
  Ven230PrefacturaRecord
} from '../models/ven-230.model';


/**
 * Columns displayed in the quick view modal (XteinRecordViewComponent).
 */
export const Ven230RecordViewColumns: XteinRecordViewColumn[] = [
  { dataField: 'DOCUMENTO', caption: 'Documento' },
  { dataField: 'FECHA', caption: 'Fecha' },
  { dataField: 'ID_CLIENTE', caption: 'Nit / Cédula' },
  { dataField: 'NOMBRE_CLIENTE', caption: 'Cliente' },
  { dataField: 'TOTAL', caption: 'Total' },
  { dataField: 'ESTADO', caption: 'Estado' }
];


/**
 * Available document status options.
 */
export const Ven230StatusOptions: readonly Ven230Option[] = [
  { text: 'REGISTRADO', value: 'REGISTRADO' },
  { text: 'EN PROCESO', value: 'EN PROCESO' },
  { text: 'COMPLETADO', value: 'COMPLETADO' },
  { text: 'PROGRAMADO', value: 'PROGRAMADO' },
  { text: 'ANULADO', value: 'ANULADO' }
];


/**
 * Available sale type options.
 */
export const Ven230TipoVentaOptions: readonly Ven230Option[] = [
  { text: 'CONTADO', value: 'CONTADO' },
  { text: 'CREDITO', value: 'CREDITO' }
];


/**
 * Initial empty record for new prefacturas.
 */
export const Ven230DefaultRecord: Readonly<Ven230PrefacturaRecord> = {
  ID_UN: '',
  ID_UN_ITEM: '',
  ID_DOCUMENTO: '',
  NOMBRE_DOCUMENTO: 'Prefactura',
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
  TIPO_VENTA: '',
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


/**
 * Record-toolbar capabilities for VEN-230.
 */
export const Ven230ToolbarCapabilities: Readonly<RecordToolbarCapabilities> = {
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

export const Ven230ClientColumns: XteinGridColumn<Ven230Lookup,unknown>[] = [
 {dataField:'ID_CLIENTE',caption:'Documento del Cliente',width:170},
 {dataField:'NOMBRE_COMPLETO',caption:'Nombre del Cliente'}
];
