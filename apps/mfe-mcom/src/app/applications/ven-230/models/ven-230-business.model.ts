import { Ven230PrefacturaItem, Ven230PrefacturaRecord, Ven230PrefacturaGrav, Ven230PrefacturaPago } from './ven-230.model';
export interface Ven230Lookup {
  [key: string]: unknown;
  ID_TASA?: string; DESCRIPCION?: string; CAN_INV?: number;
  ID_DOCUMENTO?: string; DOCUMENTO?: string; CONSECUTIVO?: number; PREFIJO?: string; SUFIJO?: string;
  ID_UN?: string; NOMBRE?: string; ID_CLIENTE?: string; NOMBRE_COMPLETO?: string;
  ID_UBICACION?: string; DIRECCION?: string; ID_ADC?: string; ID_MONEDA?: string;
  CODIGO?: string; TIPO?: string; PLAZOS?: string | Ven230Lookup[]; PLAZO?: number; DIAS_VENC?: number;
  NOMBRE_OBJETO?: string; VALOR_DEFECTO?: string; ACTIVADO?: boolean | number; FORMATO?: string;
  PRODUCTO?: string; PRECIO?: number; VALOR_BASE?: number; PORC_IVA?: number; REFERENCIA?: string;
  PRESENTACION?: Ven230Lookup[]; IVAS?: Ven230Lookup[]; UDM_VENTA?: string; UDM_COMPRA?: string;
  UDM_EQUIV?: string; CANTIDAD_PRES?: number; CANTIDAD_EQUIV?: number; PORCENTAJE?: number;
  VALOR?: string; CONFIG?: string; ErrMensaje?: string;
}
export interface Ven230Details {
  ErrMensaje?: string;
  ITM_PREFACTURA?: Ven230PrefacturaItem[];
  PREFACTURA_GRAV_AUX?: Ven230PrefacturaItem[];
  PREFACTURA_GRAV?: Ven230PrefacturaGrav[];
  PREFACTURA_PAGOS?: Ven230PrefacturaPago[];
}
export interface Ven230TaxResult { ENCAB?: Ven230PrefacturaGrav[]; ITEMS?: Ven230PrefacturaItem[]; }
export interface Ven230SettingResult extends Ven230Lookup {
  tipoAccion?: string; dataSource?: Ven230Lookup[]; titulo?: string;
  modoSeleccion?: 'single' | 'multiple' | 'multiple-grupo'; colsConfig?: string; container?: string;
  dataElecStatus?: Ven230Lookup[]; EMAIL?: string; NIT_EMPRESA?: string | number;
  ITM_Prefactura?: Ven230PrefacturaItem[]; DATA_GRAV?: Ven230TaxResult[];
}
export type Ven230Header = Partial<Ven230PrefacturaRecord>;
