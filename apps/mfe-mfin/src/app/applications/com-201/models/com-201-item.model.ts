/**
 * Represents one row of ITM_LISTA_PRECIOS.
 */
export interface Com201Item {
  ITEM: number;
  ID_GRUPO: string;
  PRODUCTO: string;
  NOMBRE: string;
  ATRIBUTO: string;
  UDM_PRES: string;
  PRECIO_BASE: number;
  PRECIO: number;
  PRECIO_IVA: number;
}

/**
 * Result of one `consulta items lista` request.
 *
 * serverPaged is true when the response carried TOTAL_REGISTROS.
 */
export interface Com201ItemsPage {
  rows: Com201Item[];
  total: number;
  serverPaged: boolean;
}
