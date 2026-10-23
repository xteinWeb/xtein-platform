/**
 * Encabezado del consumo (MOVIMIENTOS_PRO). Conserva los nombres del backend.
 * PRODUCTO/SECCION son el producto y la sección de producción del consumo;
 * al consultar, la sección llega como ID_SECCION.
 */
export interface Pro039MovementRecord {
  ID_UN: string;
  ID_DOCUMENTO: string;
  PREFIJO: string;
  CONSECUTIVO: number;
  SUFIJO: string;
  DOCUMENTO: string;
  FECHA: string | null;
  FECHA_REGISTRO: string | null;
  FECHA_VENCIMIENTO: string | null;
  HORA: string | null;
  MOVIMIENTO: string;
  TIPO: string;
  TIPO_INVENTARIO: string;
  TIPO_COMPRA: string;
  PRODUCTO: string;
  SECCION: string;
  ID_SECCION?: string | null;
  /** Producto que compone el juego (solo cuando PRODUCTO es un JU); al consultar llega como PRODUCTO_COMPONENTE. */
  COMPONENTE: string;
  /** Unidades del producto que se fabrican: el consumo de la matriz es unitario x lote. */
  CANTIDAD_LOTE: number;
  PRODUCTO_COMPONENTE?: string | null;
  ID_UN_ORIGEN: string;
  ID_UN_DESTINO: string;
  ORIGEN?: string;
  DESTINO?: string;
  ID_SOPORTE: string;
  NC_SOPORTE: number;
  ID_PROVEEDOR: string;
  ID_CONDICION: string;
  PLAZO: number;
  ID_MONEDA: string;
  TASA_CAMBIO: number;
  DETALLE: string;
  USUARIO: string;
  ESTADO: string;
  SUB_TOTAL: number;
  TOTAL: number;
  ID_APLICACION?: string;
  QFILTRO?: string;
  ErrMensaje?: string;
  [key: string]: unknown;
}

/** Ítem del consumo (ITM_MOVIMIENTOS_PRO). */
export interface Pro039MovementItem {
  ITEM: number;
  PRODUCTO: string;
  NOMBRE_PRODUCTO: string;
  ATRIBUTO: string;
  TIPO_INVENTARIO: string;
  REFERENCIA: string;
  PRODUCTO_KIT: string;
  SOPORTE: string;
  UBICACION: string;
  UDM: string;
  UDM_PRES: string;
  UDM_PRESENTACION: string;
  CANTIDAD_PRES: number;
  UDM_EQUIV: string;
  CANTIDAD_EQUIV: number;
  /** Cantidad que indicaba la matriz ("Consumo"). */
  CONSUMO_BASE: number;
  /** Cantidad consumida ("Consumo modificado"). */
  CANTIDAD: number;
  CANTIDAD_REAL: number;
  VALOR_UNITARIO: number;
  VALOR_DESCUENTO: number;
  SUB_TOTAL: number;
  VALOR_IVA: number;
  TOTAL: number;
  GRAVAMENES: unknown;
  GRAV_TOTAL: unknown;
  DETALLE: string;
  /** true = viene de la matriz del producto/sección (no se elimina; se deja en 0 si no se usa). */
  ES_MATRIZ: boolean;
  APLICACION?: number;
  ESTADO?: string;
}

/** Gravamen liquidado (MOVIMIENTOS_GRAV / ENCAB de GRAVAMENES). */
export interface Pro039MovementGrav {
  ID_TASA?: string;
  POR_TASA?: number;
  VALOR?: number;
  BASE?: number;
  DESCRIPCION?: string;
}

/** Fila de totales que devuelve GRAVAMENES / consulta adicionales. */
export interface Pro039Total {
  CONCEPTO?: string;
  DESCRIPCION?: string;
  PORCENTAJE?: number;
  VALOR?: number;
  BASE?: number;
}
