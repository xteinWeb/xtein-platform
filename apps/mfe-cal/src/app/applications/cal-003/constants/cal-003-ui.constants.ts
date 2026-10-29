import type { XteinGridColumn, XteinRecordViewColumn } from '@xtein/ui';
import type { Cal003Bodega, Cal003Cliente, Cal003ProductoLista, Cal003Servicio, Cal003ServicioEntregable } from '../models/cal-003.model';
import { Cal003AdjustmentDestination } from './cal-003.constants';

export const Cal003ClienteColumns: XteinGridColumn<Cal003Cliente, unknown>[] = [
  { dataField: 'ID_CLIENTE', caption: 'Cliente', width: 130 },
  { dataField: 'NOMBRE', caption: 'Nombre' }
];

export const Cal003BodegaColumns: XteinGridColumn<Cal003Bodega, unknown>[] = [
  { dataField: 'ID_UN_BODEGA', caption: 'Bodega', width: 110 },
  { dataField: 'DESCRIPCION', caption: 'Descripción' }
];

/** Lista de productos de la entrada (como la de materiales de PRO-039). */
export const Cal003ProductoColumns: XteinGridColumn<Cal003ProductoLista, unknown>[] = [
  { dataField: 'PRODUCTO', caption: 'Código', width: 120 },
  { dataField: 'NOMBRE', caption: 'Nombre' },
  { dataField: 'CODIGO_ASOCIADO', caption: 'Código asociado', width: 140 },
  { dataField: 'NIVEL', caption: 'Nivel', width: 70 }
];

/** Lista de servicios en los selects de Traslado, Ajuste y Consultas. */
export const Cal003ServicioColumns: XteinGridColumn<Pick<Cal003Servicio, 'DOCUMENTO' | 'NOMBRE' | 'NOMBRE_CLIENTE' | 'ESTADO'>, unknown>[] = [
  { dataField: 'DOCUMENTO', caption: 'Servicio', width: 100 },
  { dataField: 'NOMBRE', caption: 'Producto' },
  { dataField: 'NOMBRE_CLIENTE', caption: 'Cliente' },
  { dataField: 'ESTADO', caption: 'Estado', width: 120 }
];

/** Servicios del cliente que se pueden agregar a un despacho. */
export const Cal003ServicioEntregableColumns: XteinGridColumn<Pick<Cal003ServicioEntregable, 'DOCUMENTO' | 'NOMBRE' | 'TIPO_SERVICIO' | 'MOTIVO'>, unknown>[] = [
  { dataField: 'DOCUMENTO', caption: 'Servicio', width: 100 },
  { dataField: 'NOMBRE', caption: 'Producto' },
  { dataField: 'TIPO_SERVICIO', caption: 'Tipo', width: 70 },
  { dataField: 'MOTIVO', caption: 'Falta reunir' }
];

/** Columnas de Ver (xtein-record-view) con los registros que trajo Buscar. */
export const Cal003EntradaViewColumns: XteinRecordViewColumn[] = [
  { dataField: 'DOCUMENTO', caption: 'Número S' },
  { dataField: 'FECHA', caption: 'Fecha' },
  { dataField: 'NOMBRE_CLIENTE', caption: 'Cliente' },
  { dataField: 'NOMBRE', caption: 'Producto' },
  { dataField: 'TIPO_SERVICIO', caption: 'Tipo' },
  { dataField: 'ESTADO', caption: 'Estado' },
  // Texto armado en la pantalla con el semáforo (resumenEntrega)
  { dataField: 'ENTREGA', caption: 'Fecha de entrega' }
];

export const Cal003TrasladoViewColumns: XteinRecordViewColumn[] = [
  { dataField: 'DOCUMENTO', caption: 'Documento' },
  { dataField: 'SERVICIO', caption: 'Servicio' },
  { dataField: 'QUE_SE_TRASLADA', caption: 'Qué se traslada' },
  { dataField: 'BODEGA_ORIGEN', caption: 'Origen' },
  { dataField: 'BODEGA_DESTINO', caption: 'Destino' },
  { dataField: 'ESTADO', caption: 'Estado' },
  { dataField: 'ENVIO', caption: 'Envió' }
];

export const Cal003EntregaViewColumns: XteinRecordViewColumn[] = [
  { dataField: 'DOCUMENTO', caption: 'Documento' },
  { dataField: 'FECHA', caption: 'Fecha' },
  { dataField: 'NOMBRE_CLIENTE', caption: 'Cliente' },
  { dataField: 'BODEGA', caption: 'Bodega' },
  { dataField: 'LINEAS_SG', caption: 'SG' },
  { dataField: 'LINEAS_SR', caption: 'SR' },
  { dataField: 'ESTADO', caption: 'Estado' }
];

export const Cal003AjusteViewColumns: XteinRecordViewColumn[] = [
  { dataField: 'SERVICIO', caption: 'Servicio' },
  { dataField: 'PRODUCTO', caption: 'Producto' },
  { dataField: 'DESTINO', caption: 'Destino' },
  { dataField: 'ESTADO', caption: 'Estado' },
  { dataField: 'PROPUSO', caption: 'Propuso' },
  { dataField: 'RESPUESTA', caption: 'Autorizó o rechazó' }
];

export const Cal003DestinoOpciones = [
  { valor: Cal003AdjustmentDestination.New, texto: 'NUEVO', resultado: 'Entra a ARTDECON como nuevo' },
  { valor: Cal003AdjustmentDestination.Special, texto: 'ESPECIAL', resultado: 'Entra a ARTDECON, sin precio' },
  { valor: Cal003AdjustmentDestination.Scrap, texto: 'BAJA', resultado: 'Sale de forma definitiva' }
] as const;

export const Cal003ConsultaOpciones = [
  { valor: 'bodega', texto: 'Inventario por bodega' },
  { valor: 'cliente', texto: 'Servicios de un cliente' },
  { valor: 'historial', texto: 'Historial de un servicio' }
] as const;
