import { Ven210ItemBodega, Ven210RemisionItem, Ven210RemisionPago, Ven210RemisionRecord } from './ven-210.model';
export interface Ven210Lookup {
  [key: string]: unknown;
  DESCRIPCION?: string; EXISTENCIA?: number; EXISTENCIA_TOTAL?: number; UDM?: string; ID_UN_BODEGA?: string;
  ID_DOCUMENTO?: string; DOCUMENTO?: string; CONSECUTIVO?: number; PREFIJO?: string; SUFIJO?: string;
  ID_UN?: string; NOMBRE?: string; ID_CLIENTE?: string; NOMBRE_COMPLETO?: string;
  ID_UBICACION?: string; DIRECCION?: string; ID_ADC?: string; ID_MONEDA?: string;
  CODIGO?: string; TIPO?: string; PLAZOS?: string | Ven210Lookup[]; PLAZO?: number; DIAS_VENC?: number;
  NOMBRE_OBJETO?: string; VALOR_DEFECTO?: string; ACTIVADO?: boolean | number; FORMATO?: string;
  PRODUCTO?: string; PRECIO?: number; VALOR_BASE?: number; REFERENCIA?: string;
  PRESENTACION?: Ven210Lookup[]; UDM_VENTA?: string; UDM_COMPRA?: string;
  UDM_EQUIV?: string; CANTIDAD_PRES?: number; CANTIDAD_EQUIV?: number;
  ErrMensaje?: string;
}
export interface Ven210Details {
  ErrMensaje?: string;
  ITM_REMISION?: Ven210RemisionItem[];
  ITM_REMISION_BOD?: Ven210ItemBodega[];
  REMISION_PAGOS?: Ven210RemisionPago[];
}
export interface Ven210OrderLoad {
  REMISION?: Partial<Ven210RemisionRecord>;
  ITM_REMISION?: Ven210RemisionItem[];
}
export interface Ven210OrderLink {
  ID_DOCUMENTO: string; PREFIJO: string; CONSECUTIVO: number; SUFIJO: string;
}
export interface Ven210SettingResult {
  dataSource?: Ven210Lookup[]; titulo?: string;
  modoSeleccion?: 'single' | 'multiple' | 'multiple-grupo'; colsConfig?: string;
  width?: number; height?: number;
  [key: string]: unknown;
}
export type Ven210Header = Partial<Ven210RemisionRecord>;
