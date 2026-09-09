/** Inventory fields expected by the Legacy Top Compras card. */
export interface TableroPurchase {
  PRODUCTO: string;
  NOMBRE: string;
  ID_UDM: string;
  MARCA_MIN: number;
  CANT_BODEGA: number;
  PUNTO_MINIMO: number;
  PUNTO_MAXIMO: number;
  PORCENTAJE: number;
  color_ind: string;
  NOMBRE_PROVEEDOR: string;
  CANT_COMPRAR: number;
}
