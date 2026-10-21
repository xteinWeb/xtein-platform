import type { XteinGridColumn } from '@xtein/ui';
import type { Ven210Lookup } from '../models/ven-210-business.model';
import {
  RecordToolbarCapabilities,
  RecordToolbarMode
} from '@xtein/sdk';

import {
  XteinRecordViewColumn
} from '@xtein/ui';

import { Ven210RemisionRecord } from '../models/ven-210.model';


/**
 * Columns displayed in the quick view modal (XteinRecordViewComponent).
 */
export const Ven210RecordViewColumns: XteinRecordViewColumn[] = [
  { dataField: 'DOCUMENTO', caption: 'Documento' },
  { dataField: 'FECHA', caption: 'Fecha' },
  { dataField: 'ID_CLIENTE', caption: 'Nit / Cédula' },
  { dataField: 'NOMBRE_CLIENTE', caption: 'Cliente' },
  { dataField: 'TOTAL', caption: 'Total' },
  { dataField: 'ESTADO', caption: 'Estado' }
];


/**
 * Remisión states. Only ACTIVA can be edited or cancelled.
 */
export const Ven210Estado = {
  Activa: 'ACTIVA',
  Facturada: 'FACTURADA',
  Anulada: 'ANULADA'
} as const;


/**
 * Initial empty record for new remisiones.
 */
export const Ven210DefaultRecord: Readonly<Ven210RemisionRecord> = {
  ID_UN: '',
  ID_UN_ITEM: '',
  ID_DOCUMENTO: '',
  NOMBRE_DOCUMENTO: 'Remisión',
  PREFIJO: '',
  CONSECUTIVO: 0,
  SUFIJO: '',
  DOCUMENTO: '',
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
  VALOR_COSTOS: 0,
  TOTAL: 0,
  TIPO_VENTA: '',
  VALOR_CUOTA: 0,
  VALOR_PRIMER_CUOTA: 0,
  FECHA_PRIMER_VENC: null,
  DIAS_CUOTA: 0,
  UM_DIAS_CUOTA: 'DIAS',
  USUARIO: '',
  ESTADO: Ven210Estado.Activa,
  VALOR_FIN_COSTOS: 0,
  FECHA_OC: null,
  ID_UBICACION: '',
  DIRECCION: '',
  ORIGEN_PEDIDO: 'N',
  PED_ID_DOCUMENTO: null,
  PED_PREFIJO: null,
  PED_CONSECUTIVO: null,
  PED_SUFIJO: null
};


/**
 * Record-toolbar capabilities for VEN-210.
 */
export const Ven210ToolbarCapabilities: Readonly<RecordToolbarCapabilities> = {
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

export const Ven210ClientColumns: XteinGridColumn<Ven210Lookup,unknown>[] = [
 {dataField:'ID_CLIENTE',caption:'Documento',width:140},
 {dataField:'NOMBRE_COMPLETO',caption:'Nombre del Cliente'}
];

export const Ven210UnitColumns: XteinGridColumn<Ven210Lookup,unknown>[] = [
 {dataField:'ID_UN',caption:'Código',width:110},
 {dataField:'NOMBRE',caption:'Nombre de Unidad de Negocio'}
];

export const Ven210CurrencyColumns: XteinGridColumn<Ven210Lookup,unknown>[] = [
 {dataField:'ID_MONEDA',caption:'Código',width:130},
 {dataField:'DESCRIPCION',caption:'Nombre de Moneda'}
];

export const Ven210SellerColumns: XteinGridColumn<Ven210Lookup,unknown>[] = [
 {dataField:'ID_ADC',caption:'Código de Vendedor',width:130},
 {dataField:'NOMBRE_COMPLETO',caption:'Nombre de Vendedor'}
];

export const Ven210ConditionColumns: XteinGridColumn<Ven210Lookup,unknown>[] = [
 {dataField:'ID_CONDICION',caption:'Código',width:130},
 {dataField:'CONDICION',caption:'Nombre de Condición/Lista'}
];


/**
 * Configure options of VEN-210 (fixed constants: no application settings rows are required).
 * MODO is the selection mode of the popup; MODOS the record modes where the option is offered.
 */
export interface Ven210SettingOption {
  CLAVE: 'ANTICIPOS' | 'CARGAR_PEDIDO';
  TITULO: string;
  MODO: 'single' | 'multiple';
  MODOS: readonly RecordToolbarMode[];
  COLUMNAS: string;
}

export const Ven210SettingOptions: readonly Ven210SettingOption[] = [
  {
    CLAVE: 'ANTICIPOS',
    TITULO: 'Anticipos a aplicar',
    MODO: 'multiple',
    MODOS: [RecordToolbarMode.Creating, RecordToolbarMode.Editing],
    COLUMNAS: JSON.stringify([
      { dataField: 'ID_DOCUMENTO', caption: 'Documento', width: 120 },
      { dataField: 'CONSECUTIVO', caption: 'Consecutivo', width: 120 },
      { dataField: 'FECHA', caption: 'Fecha', dataType: 'date', width: 120 },
      { dataField: 'SALDO', caption: 'Saldo', dataType: 'number', alignment: 'right' },
      { dataField: 'VALOR', caption: 'Valor a aplicar', dataType: 'number', alignment: 'right', editable: true,
        validationRules: 'Number(e.value) > 0 && Number(e.value) <= Number(e.data.SALDO)',
        msgError: 'El valor debe ser mayor que cero y no superar el saldo del anticipo.' }
    ])
  },
  {
    CLAVE: 'CARGAR_PEDIDO',
    TITULO: 'Cargar pedido',
    MODO: 'single',
    MODOS: [RecordToolbarMode.Creating],
    COLUMNAS: JSON.stringify([
      { dataField: 'DOCUMENTO', caption: 'Pedido', width: 160 },
      { dataField: 'CONSECUTIVO', caption: 'Consecutivo', width: 120 },
      { dataField: 'FECHA', caption: 'Fecha', dataType: 'date', width: 120 },
      { dataField: 'TOTAL_PENDIENTE', caption: 'Total pendiente', dataType: 'number', alignment: 'right' }
    ])
  }
];
