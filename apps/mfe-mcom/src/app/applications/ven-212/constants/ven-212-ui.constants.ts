import { XteinRecordViewColumn, XteinGridColumn } from '@xtein/ui';
import { Ven212Lookup } from '../models/ven-212-business.model';

/**
 * Record view columns for VEN-212 (Facturación).
 */
export const Ven212RecordViewColumns: readonly XteinRecordViewColumn[] = [
  { dataField: 'DOCUMENTO', caption: 'Documento' },
  { dataField: 'FECHA', caption: 'Fecha' },
  { dataField: 'ID_CLIENTE', caption: 'Cliente' },
  { dataField: 'NOMBRE_CLIENTE', caption: 'Nombre Cliente' },
  { dataField: 'TIPO_VENTA', caption: 'Tipo Venta' },
  { dataField: 'ID_ADC', caption: 'Vendedor' },
  { dataField: 'TOTAL', caption: 'Total' },
  { dataField: 'ESTADO', caption: 'Estado' }
];

/**
 * Default record state for new facturas.
 */
export const Ven212DefaultRecord = {
  ID_UN: '',
  ID_UN_ITEM: '',
  ID_DOCUMENTO: '',
  NOMBRE_DOCUMENTO: '',
  PREFIJO: '',
  CONSECUTIVO: 0,
  SUFIJO: '',
  DOCUMENTO: '',
  DOCUMENTO_FAC: '',
  FECHA_REGISTRO: null as string | null,
  FECHA: null as string | null,
  HORA: null as string | null,
  ID_CLIENTE: '',
  NOMBRE_CLIENTE: '',
  ID_ADC: '',
  ID_CONDICION: '',
  DESCRIPCION: '',
  ID_MONEDA: '',
  TASA_CAMBIO: 1,
  VIGENCIA: null as string | null,
  ID_DOC_SOPORTE: '',
  NC_DOC_SOPORTE: 0,
  FECHA_AUTORIZACION: null as string | null,
  CUOTA_INICIAL: 0,
  PLAZO: 0,
  CONDICIONES_GENERALES: '',
  SUB_TOTAL: 0,
  VALOR_DESCUENTO: 0,
  GRAVAMENES: '',
  VALOR_COSTOS: 0,
  TOTAL: 0,
  VALOR_CUOTA: 0,
  VALOR_PRIMER_CUOTA: 0,
  FECHA_PRIMER_VENC: null as string | null,
  DIAS_CUOTA: 0,
  UM_DIAS_CUOTA: '',
  TIPO_VENTA: 'CONTADO',
  USUARIO: '',
  ESTADO: 'REGISTRADO',
  VALOR_FIN_COSTOS: 0,
  FECHA_OC: null as string | null,
  ID_UBICACION: '',
  DIRECCION: '',
  ID_UN_BODEGA: '',
  CUFE: '',
  VALOR_BASE: 0,
  FECHA_ULT_VENC: null as string | null,
  CLIENTE_PADRE: '',
  BANCO: ''
};

export const Ven212ClientColumns: XteinGridColumn<Ven212Lookup, unknown>[] = [
  { dataField: 'ID_CLIENTE', caption: 'Documento del Cliente', width: 130 },
  { dataField: 'NOMBRE_COMPLETO', caption: 'Nombre del Cliente' }
];

export const Ven212UnitColumns: XteinGridColumn<Ven212Lookup, unknown>[] = [
  { dataField: 'ID_UN', caption: 'Código', width: 110 },
  { dataField: 'NOMBRE', caption: 'Nombre de Unidad de Negocio' }
];

export const Ven212CurrencyColumns: XteinGridColumn<Ven212Lookup, unknown>[] = [
  { dataField: 'ID_MONEDA', caption: 'Código', width: 130 },
  { dataField: 'DESCRIPCION', caption: 'Nombre de Moneda' }
];

export const Ven212SellerColumns: XteinGridColumn<Ven212Lookup, unknown>[] = [
  { dataField: 'ID_ADC', caption: 'Código de Vendedor', width: 130 },
  { dataField: 'NOMBRE_COMPLETO', caption: 'Nombre de Vendedor' }
];

export const Ven212WarehouseColumns: XteinGridColumn<Ven212Lookup, unknown>[] = [
  { dataField: 'ID_UN_BODEGA', caption: 'Bodega', width: 130 },
  { dataField: 'DESCRIPCION', caption: 'Descripción' },
  { dataField: 'NOMBRE_UN', caption: 'Unidad de Negocio' }
];

export const Ven212ConditionColumns: XteinGridColumn<Ven212Lookup, unknown>[] = [
  { dataField: 'ID_CONDICION', caption: 'Condición', width: 120 },
  { dataField: 'DESCRIPCION', caption: 'Descripción' }
];

export const Ven212BankColumns: XteinGridColumn<Ven212Lookup, unknown>[] = [
  { dataField: 'BANCO', caption: 'Código', width: 110 },
  { dataField: 'DESCRIPCION', caption: 'Banco' }
];
