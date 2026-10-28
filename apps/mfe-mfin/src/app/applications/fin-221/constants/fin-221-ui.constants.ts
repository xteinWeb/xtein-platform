import { RecordToolbarCapabilities } from '@xtein/sdk';
import { Fin221PlanRecord, Fin221ItemPlan } from '../models/fin-221.model';

export const Fin221StatusOptions = [
  { value: 'ACTIVO', text: 'ACTIVO' },
  { value: 'INACTIVO', text: 'INACTIVO' }
] as const;

export const Fin221FrecuenciaOptions = [
  { value: 'Constante', text: 'Constante' },
  { value: 'Variable', text: 'Variable' }
] as const;

export const Fin221FinanciarGravOptions = [
  { value: 'FINANCIADOS', text: 'FINANCIADOS' },
  { value: 'PRIMERA CUOTA', text: 'PRIMERA CUOTA' }
] as const;

export const Fin221SiNoOptions = [
  { value: 'Si', text: 'Si' },
  { value: 'No', text: 'No' }
] as const;

export const Fin221TipoCiOptions = [
  { value: 'Porcentaje', text: 'Porcentaje' },
  { value: 'Valor', text: 'Valor' }
] as const;

export const Fin221EmptyRecord: Fin221PlanRecord = {
  ID_UN: '',
  ID_PLAN: '',
  DESCRIPCION: '',
  DIAS_PRIMERA_CUOTA: 30,
  FINANCIAR_GRAV: 'FINANCIADOS',
  TIPO_FRECUENCIA: 'Constante',
  FRECUENCIA: 30,
  NUMERO_PAGOS: 1,
  ESTADO: 'ACTIVO',
  QFILTRO: '',
  ITM_PLANES: []
};

export const Fin221DefaultRecord: Fin221PlanRecord = {
  ...Fin221EmptyRecord
};

export const Fin221DefaultItem: Partial<Fin221ItemPlan> = {
  ITEM: 1,
  ID_TASA: 'Manual',
  PAGO: 1,
  FACTOR: 1,
  PORC_TASA: 0,
  DESCUENTO_PPP: 0,
  CUOTA_INICIAL: 'No',
  TIPO_CI: 'Porcentaje',
  MINIMO_CI: 0,
  MAXIMO_CI: 0,
  DIAS_PLAZO_CI: 0,
  DIFERIR_CI: 'No',
  DESCONTAR_CI: 'No',
  FINANCIAR_CI: 'No',
  DIAS: 30,
  PORC_GRAV: 0,
  PORC_PAGO: 0,
  ID_CONDICION: ''
};

export const Fin221RecordViewColumns = [
  { dataField: 'ID_PLAN', caption: 'Código', width: 120 },
  { dataField: 'ESTADO', caption: 'Estado', width: 100 },
  { dataField: 'TIPO_FRECUENCIA', caption: 'Tipo', width: 110 },
  { dataField: 'DESCRIPCION', caption: 'Descripción', minWidth: 220 },
  { dataField: 'NUMERO_PAGOS', caption: 'Nº Cuotas', width: 100 }
];

export const Fin221ToolbarCapabilities: Readonly<RecordToolbarCapabilities> = {
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
