/**
 * Contratos de CAL-003 (docs/contratos/cal-003-spServicioTecnico.md §2). Conservan los nombres del SP.
 * Fechas `yyyy-MM-dd`; sellos `yyyy-MM-ddTHH:mm:ss` (hora de Colombia).
 */
import type { Cal003AdjustmentDestination, Cal003ServiceType } from '../constants/cal-003.constants';

export type Cal003Level = 'JU' | 'PF' | 'PA';

/** Qué puede hacer el usuario en CAL-003 (lo calcula el SP desde USUARIOS_APLICACIONES y BODEGAS_USUARIOS). */
export interface Cal003Permisos {
  PUEDE_VER: number;
  /** Quien gestiona las garantías: entrada, traslado, despacho, ajuste propuesto. */
  PUEDE_CREAR: number;
  /** Persona de facturación: anular un servicio con traslados recibidos (queda INACTIVO). */
  PUEDE_ANULAR_RECIBIDO: number;
  /** Quien hace las devoluciones: autoriza o rechaza ajustes. */
  PUEDE_AUTORIZAR: number;
  /** Persona de costos: pone el precio de los productos ESPECIAL. */
  PUEDE_PRECIO: number;
  /** Bodegas donde el usuario recibe traslados (BODEGAS_USUARIOS). Vacío = ninguna. */
  BODEGAS: string[];
  /** Ve todas las bodegas en traslados y consultas (no está limitado a las suyas). */
  VE_TODAS: number;
}

export interface Cal003Cliente {
  ID_CLIENTE: string;
  NOMBRE: string;
  LABEL?: string;
}

export interface Cal003Bodega {
  ID_UN_BODEGA: string;
  DESCRIPCION: string;
  LABEL?: string;
}

/** Tipo de servicio de CALIDAD / TIPOS_SERVICIO_TECNICO (SG, SR…). */
export interface Cal003TipoServicio {
  TIPO_SERVICIO: string;
  DESCRIPCION: string;
  LABEL?: string;
}

export interface Cal003Area {
  ID_AREA: string;
  DESCRIPCION: string;
}

/** Juego o producto que se puede recibir ('productos'), para la lista de la entrada. */
export interface Cal003ProductoLista {
  PRODUCTO: string;
  NOMBRE: string;
  CODIGO_ASOCIADO: string | null;
  NIVEL: 'JU' | 'PF';
}

/** Nodo del árbol del producto que se recibe ('producto arbol'): juego → productos → partes. */
export interface Cal003NodoProducto {
  NIVEL: Cal003Level;
  PRODUCTO: string;
  CODIGO_ASOCIADO: string | null;
  NOMBRE: string;
  /** Cantidad por unidad del padre (las partes ya vienen multiplicadas por la del producto). */
  CANTIDAD: number;
  HIJOS: Cal003NodoProducto[];
}

export interface Cal003ArbolProducto {
  /** Código que se buscó cuando fue un código asociado o el de un producto del juego. */
  CODIGO_BUSCADO: string;
  /** Producto (PF) del juego que corresponde al código buscado, para marcar solo ese. */
  PRODUCTO_BUSCADO: string | null;
  RAIZ: Cal003NodoProducto;
}

/** Servicio técnico (una por producto recibido en una entrada). */
export interface Cal003Servicio {
  ID_SERVICIO: number;
  DOCUMENTO: string;
  FECHA: string;
  FECHA_REGISTRO: string;
  ID_CLIENTE: string;
  NOMBRE_CLIENTE: string;
  TIPO_SERVICIO: Cal003ServiceType;
  N_SERVICIO_CLIENTE: string | null;
  N_ORDEN_DEVOLUCION: string | null;
  ID_AREA: string | null;
  PRODUCTO: string;
  CODIGO_ASOCIADO: string | null;
  NOMBRE: string;
  PARCIAL: number;
  ESTADO: string;
  ULTIMO_MOVIMIENTO: string;
  DETALLE_MOVIMIENTO: string;
  OBSERVACION_ANULA: string | null;
  USUARIO_CREA: string;
  ID_UN_BODEGA_ENTRADA: string;
  DIAS_INVENTARIO: number;
  VERSION: string;
}

/** Unidad física de un servicio (producto o parte) y dónde está. */
export interface Cal003Unidad {
  ID_UNIDAD: number;
  ID_SERVICIO: number;
  NIVEL: 'PF' | 'PA';
  PRODUCTO_JUEGO: string | null;
  NOMBRE_JUEGO: string | null;
  PRODUCTO: string;
  NOMBRE_PRODUCTO: string;
  PARTE: string | null;
  NOMBRE_PARTE: string | null;
  CODIGO_ASOCIADO: string | null;
  CANTIDAD: number;
  ID_UN_BODEGA: string | null;
  BODEGA: string | null;
  /** Documento del traslado enviado sin recibir, si lo hay. */
  TRASLADO_PENDIENTE: string | null;
}

export interface Cal003ServicioCompleto {
  SERVICIO: Cal003Servicio;
  UNIDADES: Cal003Unidad[];
}

export interface Cal003ServicioFiltro {
  TEXTO: string;
  FECHA_DESDE: string;
  FECHA_HASTA: string;
}

export interface Cal003Traslado {
  ID_TRASLADO: number;
  DOCUMENTO: string;
  ID_SERVICIO: number;
  SERVICIO: string;
  QUE_SE_TRASLADA: string;
  ID_UN_BODEGA_ORIGEN: string;
  BODEGA_ORIGEN: string;
  ID_UN_BODEGA_DESTINO: string;
  BODEGA_DESTINO: string;
  ESTADO: string;
  ENVIO: string;
  RESPUESTA: string | null;
  /** El usuario recibe en la bodega destino: puede recibir o rechazar. */
  PUEDE_RESPONDER: number;
}

/** Servicio candidato para el despacho: OK = 1 si sale como llegó desde la bodega de salida. */
export interface Cal003ServicioEntregable {
  ID_SERVICIO: number;
  DOCUMENTO: string;
  NOMBRE: string;
  TIPO_SERVICIO: Cal003ServiceType;
  N_SERVICIO_CLIENTE: string | null;
  CODIGO_ASOCIADO: string | null;
  OK: number;
  /** Qué falta reunir cuando OK = 0. */
  MOTIVO: string | null;
  UNIDADES: Cal003Unidad[];
}

export interface Cal003Entrega {
  ID_ENTREGA: number;
  DOCUMENTO: string;
  FECHA: string;
  ID_CLIENTE: string;
  NOMBRE_CLIENTE: string;
  ID_UN_BODEGA: string;
  BODEGA: string;
  ESTADO: string;
  LINEAS_SG: number;
  LINEAS_SR: number;
  SOPORTE: string | null;
  USUARIO_CREA: string;
}

export interface Cal003LineaEntrega {
  ID_SERVICIO: number;
  DOCUMENTO: string;
  N_SERVICIO_CLIENTE: string | null;
  CODIGO_ASOCIADO: string | null;
  TIPO_SERVICIO: Cal003ServiceType;
  ESTADO: 'ACTIVA' | 'ANULADA';
  OBSERVACION_ANULA: string | null;
  UNIDADES: Cal003Unidad[];
}

export interface Cal003EntregaCompleta {
  ENTREGA: Cal003Entrega;
  LINEAS: Cal003LineaEntrega[];
}

export interface Cal003Ajuste {
  ID_AJUSTE: number;
  ID_SERVICIO: number;
  SERVICIO: string;
  PRODUCTO: string;
  DESTINO: string;
  ESTADO: string;
  PROPUSO: string;
  RESPUESTA: string | null;
  RESULTADO: string | null;
}

export interface Cal003PrecioPendiente {
  ID_SERVICIO: number;
  SERVICIO: string;
  PRODUCTO: string;
  FECHA_AUTORIZA: string;
  DIAS_HABILES: number;
}

export interface Cal003PrecioPuesto {
  ID_SERVICIO: number;
  SERVICIO: string;
  PRODUCTO: string;
  PRECIO: number;
  USUARIO: string;
  FECHA: string;
}

export interface Cal003Precios {
  SIN_PRECIO: Cal003PrecioPendiente[];
  CON_PRECIO: Cal003PrecioPuesto[];
}

export interface Cal003InventarioFila {
  NOMBRE_JUEGO: string | null;
  NOMBRE_PRODUCTO: string;
  NOMBRE_PARTE: string | null;
  CANTIDAD: number;
  SERVICIO: string;
  NOMBRE_CLIENTE: string;
  DIAS_INVENTARIO: number;
  TRASLADO_PENDIENTE: string | null;
}

export interface Cal003ServicioCliente {
  SERVICIO: string;
  NOMBRE: string;
  TIPO_SERVICIO: Cal003ServiceType;
  DONDE: string;
  ESTADO: string;
  DIAS_INVENTARIO: number | null;
}

export interface Cal003Historial {
  FECHA: string;
  MOVIMIENTO: string;
  DETALLE: string;
  USUARIO: string;
}

export interface Cal003Aviso {
  TITULO: string;
  DETALLE: string;
}

/* ------------------------------------ escritura ------------------------------------ */

export interface Cal003EntradaEncabezado {
  FECHA: string;
  ID_CLIENTE: string;
  TIPO_SERVICIO: string;
  ID_UN_BODEGA: string;
  N_SERVICIO_CLIENTE: string;
  N_ORDEN_DEVOLUCION: string;
  ID_AREA: string;
}

/** Lo que llega de un producto: las unidades hoja marcadas (PF sin partes marcadas, o PA). */
export interface Cal003EntradaProducto {
  PRODUCTO: string;
  UNIDADES: { NIVEL: 'PF' | 'PA'; PRODUCTO: string; PARTE: string | null; CANTIDAD: number }[];
}

export interface Cal003EntradaGuardada {
  ID_SERVICIO: number;
  DOCUMENTO: string;
  NOMBRE: string;
}

export interface Cal003Resultado {
  ErrMensaje: string;
  DOCUMENTO?: string;
  MENSAJE?: string;
}

export type Cal003Destino = Cal003AdjustmentDestination;
