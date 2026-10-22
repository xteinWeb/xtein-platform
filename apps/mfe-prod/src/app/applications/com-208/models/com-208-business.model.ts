import type { Com208MovementGrav, Com208MovementItem, Com208MovementRecord, Com208Total } from './com-208.model';

export interface Com208Lookup {
  [key: string]: unknown;
  ID_DOCUMENTO?: string;
  CONSECUTIVO?: number;
  DOCUMENTO?: string;
  PRODUCTO?: string;
  NOMBRE?: string;
  ID_SECCION?: string;
  NOMBRE_SECCION?: string;
  NOMBRE_OBJETO?: string;
  VALOR_DEFECTO?: string;
  FORMATO?: string;
  ACTIVADO?: boolean | number;
  ErrMensaje?: string;
}

/** Bodega/UN que devuelve 'UN MOVIMIENTOS' dentro de ORIGEN o DESTINO. */
export interface Com208Warehouse {
  ID_UN_ORIGEN?: string;
  ID_UN_DESTINO?: string;
  DESCRIPCION?: string;
  ORIGEN?: string;
  DESTINO?: string;
  NOMBRE_UN?: string;
}

/** Material de la matriz ('MATERIALES PRODUCTO'). */
export interface Com208Material {
  PRODUCTO: string;
  NOMBRE?: string;
  UDM?: string;
  ID_SECCION?: string;
  CONSUMO?: number;
  VALOR_UNITARIO?: number;
}

/** Datos del producto que devuelve 'EXISTENCIAS PRODUCTO' al agregarlo manualmente. */
export interface Com208ProductStock {
  PRODUCTO?: string;
  NOMBRE?: string;
  REFERENCIA?: string;
  PRODUCTO_KIT?: string;
  UBICACION?: string;
  PRECIO?: number;
  PRESENTACION?: { UDM_COMPRA?: string; CANTIDAD_PRES?: number; UDM_EQUIV?: string; CANTIDAD_EQUIV?: number }[];
  ATRIBUTOS?: { ATRIBUTO?: string }[];
  ErrMensaje?: string;
}

/** Respuesta de GRAVAMENES. */
export interface Com208TaxResult {
  ENCAB?: Com208MovementGrav[];
  ITEMS?: Partial<Com208MovementItem>[];
  TOTALES?: Com208Total[];
}

/** Respuesta de 'consulta adicionales'. */
export interface Com208AdditionalResult {
  ITM_MOVIMIENTOS?: Com208MovementItem[];
  MOVIMIENTOS_GRAV?: Com208MovementGrav[];
  TOTALES?: Com208Total[];
}

export type Com208Header = Partial<Com208MovementRecord>;
