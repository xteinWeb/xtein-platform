import type { Pro039ConsumptionProduct, Pro039MovementGrav, Pro039MovementItem, Pro039MovementRecord, Pro039Presentation, Pro039Total } from './pro-039.model';

export interface Pro039Lookup {
  [key: string]: unknown;
  ID_DOCUMENTO?: string;
  CONSECUTIVO?: number;
  DOCUMENTO?: string;
  PRODUCTO?: string;
  NOMBRE?: string;
  ID_SECCION?: string;
  NOMBRE_SECCION?: string;
  /** Código y nombre, para mostrar en los selectores. */
  LABEL?: string;
  GRUPO?: string;
  /** Producto JU: se elige el componente. */
  ES_JUEGO?: boolean;
  /** La sección tiene materiales en la matriz del producto. */
  TIENE_MATRIZ?: boolean;
  MATRIZ?: string;
  CANTIDAD?: number;
  NOMBRE_OBJETO?: string;
  VALOR_DEFECTO?: string;
  FORMATO?: string;
  ACTIVADO?: boolean | number;
  ErrMensaje?: string;
}

/** Bodega/UN que devuelve 'UN MOVIMIENTOS' dentro de ORIGEN o DESTINO. */
export interface Pro039Warehouse {
  ID_UN_ORIGEN?: string;
  ID_UN_DESTINO?: string;
  DESCRIPCION?: string;
  ORIGEN?: string;
  DESTINO?: string;
  NOMBRE_UN?: string;
}

/** Material de la matriz ('MATERIALES PRODUCTO'). */
export interface Pro039Material {
  PRODUCTO: string;
  NOMBRE?: string;
  UDM?: string;
  ID_SECCION?: string;
  CONSUMO?: number;
  /** Consumo unitario x lote de su producto. */
  CANTIDAD?: number;
  VALOR_UNITARIO?: number;
  /** Producto del consumo al que pertenece el material. */
  PRODUCTO_CONSUMO?: string;
}

/** Datos del producto que devuelve 'EXISTENCIAS PRODUCTO' al agregarlo manualmente. */
export interface Pro039ProductStock {
  PRODUCTO?: string;
  NOMBRE?: string;
  REFERENCIA?: string;
  PRODUCTO_KIT?: string;
  UBICACION?: string;
  PRECIO?: number;
  PRESENTACION?: Pro039Presentation[];
  ATRIBUTOS?: { ATRIBUTO?: string }[];
  ErrMensaje?: string;
}

/** Respuesta de GRAVAMENES. */
export interface Pro039TaxResult {
  ENCAB?: Pro039MovementGrav[];
  ITEMS?: Partial<Pro039MovementItem>[];
  TOTALES?: Pro039Total[];
}

/** Respuesta de 'consulta adicionales'. */
export interface Pro039AdditionalResult {
  ITM_MOVIMIENTOS?: Pro039MovementItem[];
  MOVIMIENTOS_GRAV?: Pro039MovementGrav[];
  TOTALES?: Pro039Total[];
  /** Productos del consumo (los anteriores, de un solo producto, traen el del encabezado). */
  PRODUCTOS?: Partial<Pro039ConsumptionProduct>[] | null;
}

export type Pro039Header = Partial<Pro039MovementRecord>;
