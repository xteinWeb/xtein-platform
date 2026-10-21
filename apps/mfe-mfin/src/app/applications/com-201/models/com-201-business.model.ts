import { Com201Item } from './com-201-item.model';

/**
 * Generic catalog row returned by PRO022 / ADM011 / COM201.
 */
export interface Com201Lookup {
  [key: string]: unknown;
  ID_PROVEEDOR?: string; NOMBRE?: string; ID_LISTA?: string; LISTA?: string;
  VALOR?: string; UDM_PRES?: string; UDM_EQUIV?: string;
  NOMBRE_OBJETO?: string; VALOR_DEFECTO?: string; TITULO?: string;
  ErrMensaje?: string;
}

/**
 * Product group from PRO022 `GRUPOS`.
 */
export interface Com201Grupo {
  [key: string]: unknown;
  ID_GRUPO: string;
  ID_GRUPO_PADRE: string;
  NOMBRE: string;
}

/**
 * Product from PRO022 `PRODUCTOS` (MODO simple).
 */
export interface Com201Producto {
  [key: string]: unknown;
  PRODUCTO: string;
  NOMBRE: string;
  ID_GRUPO: string;
}

/**
 * Response of `calcular precio`.
 */
export interface Com201PriceResult {
  PRECIO?: number;
  PRECIO_BASE?: number;
  PRECIO_IVA?: number;
  ErrMensaje?: string;
}

/**
 * Request of `consulta items lista`.
 *
 * Without PAGINA the stored procedure returns the complete list.
 */
export interface Com201ItemQuery {
  ID_LISTA: string;
  PAGINA?: number;
  TAMANO_PAGINA?: number;
  ID_GRUPO?: string;
  BUSQUEDA?: string;
}

/**
 * Item-editing rules derived from ACTUALIZACION (and TIPO).
 */
export interface Com201EditRule {
  product: boolean;
  precioBase: boolean;
  precio: boolean;
  add: boolean;
  remove: boolean;
  select: boolean;
}

/**
 * Item row returned by the legacy merge, with the keys that came from the backend.
 */
export interface Com201MergeResult {
  items: Com201Item[];
  mergedKeys: Set<number>;
}
