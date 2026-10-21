/**
 * Represents one record from the base table LISTAS_PRECIOS.
 *
 * Backend field names are preserved because they are part of the
 * spListasPrecios contract.
 */
export interface Com201ListaPrecios {
  ID_LISTA: string;
  DESCRIPCION: string;
  TIPO: string;
  BASE_PRECIO: string;
  LISTA_BASE: string;
  ID_PROVEEDOR: string;
  APLICACION_PRECIO: string;
  MARGEN: number;
  ACTUALIZACION: string;
  FECHA_INICIO: string | null;
  FECHA_FINAL: string | null;
  INCLUYE_IVA: boolean;
  ESTADO: string;
  PRINCIPAL: boolean;
  APROXIMACION: number;
  NOMBRE_PROVEEDOR?: string;
  QFILTRO?: string;
}
