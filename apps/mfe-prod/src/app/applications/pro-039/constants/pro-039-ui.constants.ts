import type { XteinGridColumn, XteinRecordViewColumn } from '@xtein/ui';
import type { Pro039Lookup, Pro039Warehouse } from '../models/pro-039-business.model';
import type { Pro039MovementRecord } from '../models/pro-039.model';
import { Pro039Application } from './pro-039.constants';

export const Pro039RecordViewColumns: XteinRecordViewColumn[] = [
  { dataField: 'DOCUMENTO', caption: 'Documento' },
  { dataField: 'FECHA', caption: 'Fecha' },
  { dataField: 'PRODUCTO', caption: 'Producto' },
  { dataField: 'ID_SECCION', caption: 'Sección' },
  { dataField: 'ORIGEN', caption: 'Bodega origen' },
  { dataField: 'ESTADO', caption: 'Estado' }
];

export const Pro039DefaultRecord: Readonly<Pro039MovementRecord> = {
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
  MOVIMIENTO: Pro039Application.Movement,
  TIPO: Pro039Application.Type,
  TIPO_INVENTARIO: Pro039Application.InventoryType,
  TIPO_COMPRA: 'CONTADO',
  PRODUCTO: '',
  SECCION: '',
  COMPONENTE: '',
  CANTIDAD_LOTE: 1,
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

export const Pro039ProductColumns: XteinGridColumn<Pro039Lookup, unknown>[] = [
  { dataField: 'PRODUCTO', caption: 'Producto', width: 110 },
  { dataField: 'NOMBRE', caption: 'Nombre' },
  { dataField: 'GRUPO', caption: 'Grupo', width: 170 }
];

export const Pro039ComponentColumns: XteinGridColumn<Pro039Lookup, unknown>[] = [
  { dataField: 'PRODUCTO', caption: 'Producto', width: 110 },
  { dataField: 'NOMBRE', caption: 'Nombre' },
  { dataField: 'CANTIDAD', caption: 'Cant.', width: 70 }
];

export const Pro039SectionColumns: XteinGridColumn<Pro039Lookup, unknown>[] = [
  { dataField: 'ID_SECCION', caption: 'Sección', width: 120 },
  { dataField: 'NOMBRE_SECCION', caption: 'Descripción' },
  { dataField: 'MATRIZ', caption: 'Matriz', width: 80 }
];

export const Pro039OriginColumns: XteinGridColumn<Pro039Warehouse, unknown>[] = [
  { dataField: 'ID_UN_ORIGEN', caption: 'Bodega', width: 110 },
  { dataField: 'DESCRIPCION', caption: 'Descripción' },
  { dataField: 'NOMBRE_UN', caption: 'Unidad de negocio' }
];

export const Pro039DestinationColumns: XteinGridColumn<Pro039Warehouse, unknown>[] = [
  { dataField: 'ID_UN_DESTINO', caption: 'Unidad', width: 110 },
  { dataField: 'DESCRIPCION', caption: 'Descripción' }
];

export const Pro039ItemProductColumns: XteinGridColumn<Pro039Lookup, unknown>[] = [
  { dataField: 'PRODUCTO', caption: 'Producto', width: 110 },
  { dataField: 'NOMBRE', caption: 'Nombre' },
  { dataField: 'UBICACION', caption: 'Ubicación', width: 140 },
  { dataField: 'EXISTENCIA', caption: 'Existencia', width: 100 }
];
