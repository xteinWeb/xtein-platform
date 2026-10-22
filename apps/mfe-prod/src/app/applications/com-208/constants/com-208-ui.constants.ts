import type { XteinGridColumn, XteinRecordViewColumn } from '@xtein/ui';
import type { Com208Lookup, Com208Warehouse } from '../models/com-208-business.model';
import type { Com208MovementRecord } from '../models/com-208.model';
import { Com208Application } from './com-208.constants';

export const Com208RecordViewColumns: XteinRecordViewColumn[] = [
  { dataField: 'DOCUMENTO', caption: 'Documento' },
  { dataField: 'FECHA', caption: 'Fecha' },
  { dataField: 'PRODUCTO', caption: 'Producto' },
  { dataField: 'ID_SECCION', caption: 'Sección' },
  { dataField: 'ORIGEN', caption: 'Bodega origen' },
  { dataField: 'ESTADO', caption: 'Estado' }
];

export const Com208DefaultRecord: Readonly<Com208MovementRecord> = {
  ID_UN: '',
  ID_DOCUMENTO: '',
  PREFIJO: '',
  CONSECUTIVO: 0,
  SUFIJO: '',
  DOCUMENTO: '',
  FECHA: null,
  FECHA_REGISTRO: null,
  FECHA_VENCIMIENTO: null,
  HORA: null,
  MOVIMIENTO: Com208Application.Movement,
  TIPO: Com208Application.Type,
  TIPO_INVENTARIO: Com208Application.InventoryType,
  TIPO_COMPRA: 'CONTADO',
  PRODUCTO: '',
  SECCION: '',
  ID_UN_ORIGEN: '',
  ID_UN_DESTINO: '',
  ID_SOPORTE: '',
  NC_SOPORTE: 0,
  ID_PROVEEDOR: '',
  ID_CONDICION: '',
  PLAZO: 0,
  ID_MONEDA: '',
  TASA_CAMBIO: 1,
  DETALLE: '',
  USUARIO: '',
  ESTADO: 'REGISTRADO',
  SUB_TOTAL: 0,
  TOTAL: 0
};

export const Com208ProductColumns: XteinGridColumn<Com208Lookup, unknown>[] = [
  { dataField: 'PRODUCTO', caption: 'Producto', width: 130 },
  { dataField: 'NOMBRE', caption: 'Nombre' }
];

export const Com208SectionColumns: XteinGridColumn<Com208Lookup, unknown>[] = [
  { dataField: 'ID_SECCION', caption: 'Sección', width: 130 },
  { dataField: 'NOMBRE_SECCION', caption: 'Descripción' }
];

export const Com208OriginColumns: XteinGridColumn<Com208Warehouse, unknown>[] = [
  { dataField: 'ID_UN_ORIGEN', caption: 'Bodega', width: 110 },
  { dataField: 'DESCRIPCION', caption: 'Descripción' },
  { dataField: 'NOMBRE_UN', caption: 'Unidad de negocio' }
];

export const Com208DestinationColumns: XteinGridColumn<Com208Warehouse, unknown>[] = [
  { dataField: 'ID_UN_DESTINO', caption: 'Unidad', width: 110 },
  { dataField: 'DESCRIPCION', caption: 'Descripción' }
];

export const Com208ItemProductColumns: XteinGridColumn<Com208Lookup, unknown>[] = [
  { dataField: 'PRODUCTO', caption: 'Producto', width: 130 },
  { dataField: 'NOMBRE', caption: 'Nombre' }
];
