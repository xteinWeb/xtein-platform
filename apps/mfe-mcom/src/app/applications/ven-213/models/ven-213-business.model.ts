import { Ven213DevolucionItem, Ven213DevolucionRecord, Ven213ItemBodega } from './ven-213.model';
export interface Ven213Lookup {
  [key: string]: unknown;
  DESCRIPCION?: string; UDM?: string; ID_UN_BODEGA?: string;
  ID_DOCUMENTO?: string; DOCUMENTO?: string; CONSECUTIVO?: number; PREFIJO?: string; SUFIJO?: string;
  ID_UN?: string; NOMBRE?: string; ID_CLIENTE?: string; NOMBRE_COMPLETO?: string;
  ID_UBICACION?: string; DIRECCION?: string; ID_CAUSA?: string; TIPO?: string;
  NOMBRE_OBJETO?: string; VALOR_DEFECTO?: string; ACTIVADO?: boolean | number; FORMATO?: string;
  ErrMensaje?: string;
}
export interface Ven213Details {
  ErrMensaje?: string;
  ITM_DEVOLUCION?: Ven213SourceLine[];
  ITM_DEVOLUCION_BOD?: Ven213ItemBodega[];
}
/** Source line as returned by CARGAR ORIGEN / consulta adicionales (SIN_INVENTARIO and CIERRA come as 'S'/'N'). */
export type Ven213SourceLine = Partial<Omit<Ven213DevolucionItem, 'SIN_INVENTARIO' | 'CIERRA'>>
  & { NOMBRE?: string; SIN_INVENTARIO?: string | boolean; CIERRA?: string | boolean };
export interface Ven213SourceLoad {
  DEVOLUCION?: Partial<Ven213DevolucionRecord>;
  ITM_DEVOLUCION?: Ven213SourceLine[];
}
/** Source document of a devolución (one factura or one remisión). */
export interface Ven213SourceLink {
  TIPO: string; ID_DOCUMENTO: string; PREFIJO: string; CONSECUTIVO: number; SUFIJO: string;
}
export interface Ven213SettingResult {
  dataSource?: Ven213Lookup[]; titulo?: string;
  modoSeleccion?: 'single' | 'multiple' | 'multiple-grupo'; colsConfig?: string;
  width?: number; height?: number;
  [key: string]: unknown;
}
export type Ven213Header = Partial<Ven213DevolucionRecord>;
