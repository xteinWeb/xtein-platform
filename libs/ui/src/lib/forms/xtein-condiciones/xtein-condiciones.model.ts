export interface XteinCondicion {
  ITEM?: number;
  ID_CONDICION?: string;
  NOMBRE_CONDICION?: string;
  DESCRIPCION?: string;
  PLAZO?: number;
  DIAS_ENTREGA?: number;
  TIPO_CONDICION?: string;
  VALOR?: number;
  isEdit?: boolean;
  [key: string]: unknown;
}

export interface XteinCondicionItem {
  ID_CONDICION: string;
  DESCRIPCION: string;
  PLAZO?: number;
  DIAS_ENTREGA?: number;
  TIPO_CONDICION?: string;
  VALOR?: number;
  [key: string]: unknown;
}
