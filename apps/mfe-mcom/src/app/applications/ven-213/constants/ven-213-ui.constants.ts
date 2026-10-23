import type { XteinGridColumn } from '@xtein/ui';
import type { Ven213Lookup } from '../models/ven-213-business.model';
import {
  RecordToolbarCapabilities,
  RecordToolbarMode
} from '@xtein/sdk';

import {
  XteinRecordViewColumn
} from '@xtein/ui';

import { Ven213DevolucionRecord } from '../models/ven-213.model';


/**
 * Columns displayed in the quick view modal (XteinRecordViewComponent).
 */
export const Ven213RecordViewColumns: XteinRecordViewColumn[] = [
  { dataField: 'DOCUMENTO', caption: 'Documento' },
  { dataField: 'FECHA', caption: 'Fecha' },
  { dataField: 'ID_CLIENTE', caption: 'Nit / Cédula' },
  { dataField: 'NOMBRE_CLIENTE', caption: 'Cliente' },
  { dataField: 'ORIGEN_DOCUMENTO', caption: 'Documento origen' },
  { dataField: 'TOTAL', caption: 'Total' },
  { dataField: 'ESTADO', caption: 'Estado' }
];


/**
 * Devolución states. Only ACTIVA can be cancelled; no state can be edited.
 */
export const Ven213Estado = {
  Activa: 'ACTIVA',
  Anulada: 'ANULADA'
} as const;


/**
 * Initial empty record for new devoluciones.
 */
export const Ven213DefaultRecord: Readonly<Ven213DevolucionRecord> = {
  ID_UN: '',
  ID_UN_ITEM: '',
  ID_DOCUMENTO: '',
  NOMBRE_DOCUMENTO: 'Devolución',
  PREFIJO: '',
  CONSECUTIVO: 0,
  SUFIJO: '',
  DOCUMENTO: '',
  FECHA_REGISTRO: null,
  FECHA: null,
  HORA: null,
  ID_CLIENTE: '',
  NOMBRE_CLIENTE: '',
  DIRECCION: '',
  ID_ADC: '',
  ID_CONDICION: '',
  ID_MONEDA: '',
  TASA_CAMBIO: 1,
  PLAZO: 0,
  TIPO_VENTA: '',
  ID_CAUSA: '',
  DESCRIPCION: '',
  SUB_TOTAL: 0,
  VALOR_DESCUENTO: 0,
  TOTAL: 0,
  VALOR_CARTERA: 0,
  VALOR_NO_APLICADO: 0,
  ORIGEN_TIPO: null,
  ORIGEN_ID_DOCUMENTO: null,
  ORIGEN_PREFIJO: null,
  ORIGEN_CONSECUTIVO: null,
  ORIGEN_SUFIJO: null,
  ORIGEN_DOCUMENTO: null,
  USUARIO: '',
  ESTADO: Ven213Estado.Activa
};


/**
 * Record-toolbar capabilities for VEN-213 (a devolución is never edited).
 */
export const Ven213ToolbarCapabilities: Readonly<RecordToolbarCapabilities> = {
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
  configure: true
};

export const Ven213ClientColumns: XteinGridColumn<Ven213Lookup,unknown>[] = [
 {dataField:'ID_CLIENTE',caption:'Documento',width:140},
 {dataField:'NOMBRE_COMPLETO',caption:'Nombre del Cliente'}
];


/**
 * Configure options of VEN-213 (fixed constants: no application settings rows are required).
 * MODO is the selection mode of the popup; MODOS the record modes where the option is offered.
 */
export interface Ven213SettingOption {
  CLAVE: 'CARGAR_ORIGEN';
  TITULO: string;
  MODO: 'single' | 'multiple';
  MODOS: readonly RecordToolbarMode[];
  COLUMNAS: string;
}

export const Ven213SettingOptions: readonly Ven213SettingOption[] = [
  {
    CLAVE: 'CARGAR_ORIGEN',
    TITULO: 'Cargar documento origen',
    MODO: 'single',
    MODOS: [RecordToolbarMode.Creating],
    COLUMNAS: JSON.stringify([
      { dataField: 'TIPO', caption: 'Tipo', width: 110 },
      { dataField: 'DOCUMENTO', caption: 'Documento', width: 160 },
      { dataField: 'FECHA', caption: 'Fecha', dataType: 'date', width: 120 },
      { dataField: 'CREDITO', caption: 'Crédito', width: 90 },
      { dataField: 'TOTAL', caption: 'Total', dataType: 'number', alignment: 'right' },
      { dataField: 'TOTAL_DEVOLVIBLE', caption: 'Total devolvible', dataType: 'number', alignment: 'right' }
    ])
  }
];
