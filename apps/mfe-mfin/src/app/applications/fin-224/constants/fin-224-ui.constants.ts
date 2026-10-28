import { RecordToolbarCapabilities } from '@xtein/sdk';
import { Fin224CondicionRecord, Fin224ItemCondicion } from '../models/fin-224.model';

export const Fin224StatusOptions = [
  { value: 'ACTIVO', text: 'ACTIVO' },
  { value: 'INACTIVO', text: 'INACTIVO' }
] as const;

export const Fin224TipoOptions = [
  { value: 'VENTAS', text: 'VENTAS' },
  { value: 'PROVEEDOR', text: 'PROVEEDOR' }
] as const;

export const Fin224EmptyRecord: Fin224CondicionRecord = {
  ID_UN: '',
  ID_CONDICION: '',
  DESCRIPCION: '',
  TIPO_CONDICION: null,
  TIPO: '',
  ID_LISTA: null,
  ID_PLAN: '',
  ID_DESCUENTO: null,
  ID_COSTOS: null,
  ESTADO: 'ACTIVO',
  QFILTRO: '',
  ITM_CONDICIONES: []
};

export const Fin224DefaultRecord: Fin224CondicionRecord = {
  ...Fin224EmptyRecord
};

export const Fin224DefaultItem: Partial<Fin224ItemCondicion> = {
  ID_LISTA: '',
  DESCRIPCION: ''
};

export const Fin224RecordViewColumns = [
  { dataField: 'ID_CONDICION', caption: 'Código', width: 120 },
  { dataField: 'DESCRIPCION', caption: 'Descripción', minWidth: 240 },
  { dataField: 'TIPO', caption: 'Tipo', width: 120 },
  { dataField: 'ID_PLAN', caption: 'Plan Financiero', width: 130 },
  { dataField: 'ESTADO', caption: 'Estado', width: 100 }
];

export const Fin224ToolbarCapabilities: Readonly<RecordToolbarCapabilities> = {
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
