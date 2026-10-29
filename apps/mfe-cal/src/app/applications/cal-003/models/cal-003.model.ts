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

/** Próximo documento del movimiento (acción 'consecutivo'): SEN-1, STR-1, SSA-1. */
export interface Cal003Consecutivo {
  MOVIMIENTO: string;
  ID_DOCUMENTO: string;
  CONSECUTIVO: number;
  DOCUMENTO: string;
  USUARIO: string;
}

/** Lo que devuelve CAL-001 al crear la no conformidad. */
export interface Cal003NcCreada {
  ID_REGISTRO_NC: number;
  DOCUMENTO: string;
}

/** Permisos de CAL-001 (crear una NC de cliente pide PUEDE_CREAR y ES_GESTOR). */
export interface Cal003NcPermisos {
  PUEDE_VER: number;
  PUEDE_CREAR: number;
  ES_GESTOR: number;
}

/** Cabecera común de la pantalla: estado del documento REGISTRADO / ANULADO / AUTORIZADO. */
export interface Cal003Cabecera {
  documento: string;
  estado: string;
  usuario: string;
  fechaRegistro: string | null;
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

export type Cal003EstadoEntrega = 'EN TIEMPO' | 'POR VENCER' | 'VENCIDO';

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
  /** Estado del documento SEN: REGISTRADO o ANULADO. */
  ESTADO_DOCUMENTO?: string;
  /** No conformidad de CAL-001 ligada (obligatoria): mientras sea null, la entrada la pide. */
  ID_REGISTRO_NC?: number | null;
  NC_DOCUMENTO?: string | null;
  /** Fecha de entrega comprometida con el cliente (yyyy-MM-dd). */
  FECHA_ENTREGA?: string | null;
  /** Días que faltan para la fecha de entrega (negativo = atraso); solo mientras está en DEPOSITO. */
  DIAS_PARA_ENTREGA?: number | null;
  /** Semáforo de la fecha de entrega: EN TIEMPO, POR VENCER o VENCIDO (null si ya salió o se anuló). */
  ESTADO_ENTREGA?: Cal003EstadoEntrega | null;
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
  /** Estado del documento STR: REGISTRADO, AUTORIZADO o ANULADO. */
  ESTADO_DOCUMENTO?: string;
  USUARIO_ENVIA?: string;
  FECHA_ENVIA?: string;
  ENVIO: string;
  RESPUESTA: string | null;
}

/** Servicio candidato para el despacho: OK = 1 si sale como llegó desde la bodega de salida. */
export interface Cal003ServicioEntregable {
  ID_SERVICIO: number;
  DOCUMENTO: string;
  NOMBRE: string;
  TIPO_SERVICIO: Cal003ServiceType;
  N_SERVICIO_CLIENTE: string | null;
  N_ORDEN_DEVOLUCION?: string | null;
  CODIGO_ASOCIADO: string | null;
  OK: number;
  /** Qué falta reunir cuando OK = 0. */
  MOTIVO: string | null;
  /** Producto registrado, estado del servicio (tipo depósito) y saldo: servicios de ese producto del cliente aún en DEPOSITO. */
  PRODUCTO?: string;
  ESTADO_SERVICIO?: string;
  SALDO?: number;
  /** Lo que se muestra: el producto registrado si llegó completo; si no, lo que llegó (productos completos y partes). */
  PIEZAS: Cal003Pieza[];
  UNIDADES: Cal003Unidad[];
}

/** Fila de la entrega: producto completo o parte suelta (dbo.FN_ST_PIEZAS). */
export interface Cal003Pieza {
  NOMBRE: string;
  CANTIDAD: number;
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
  /** Estado del documento SSA: REGISTRADO, AUTORIZADO (soporte firmado) o ANULADO. */
  ESTADO_DOCUMENTO?: string;
  FECHA_CREA?: string;
  LINEAS_SG: number;
  LINEAS_SR: number;
  SOPORTE: string | null;
  USUARIO_CREA: string;
}

export interface Cal003LineaEntrega {
  ID_SERVICIO: number;
  DOCUMENTO: string;
  N_SERVICIO_CLIENTE: string | null;
  N_ORDEN_DEVOLUCION?: string | null;
  CODIGO_ASOCIADO: string | null;
  TIPO_SERVICIO: Cal003ServiceType;
  ESTADO: 'ACTIVA' | 'ANULADA';
  OBSERVACION_ANULA: string | null;
  /** Producto registrado, estado del servicio (tipo depósito) y saldo: servicios de ese producto del cliente aún en DEPOSITO. */
  PRODUCTO?: string;
  ESTADO_SERVICIO?: string;
  SALDO?: number;
  PIEZAS: Cal003Pieza[];
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
  FECHA_ENTREGA: string | null;
  DIAS_PARA_ENTREGA: number | null;
  ESTADO_ENTREGA: Cal003EstadoEntrega | null;
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
  /** Fecha de entrega comprometida con el cliente, obligatoria (yyyy-MM-dd). */
  FECHA_ENTREGA: string;
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
