import { Ven212FacturaItem, Ven212FacturaRecord, Ven212FacturaGrav, Ven212FacturaPago, Ven212IvaItem, Ven212PresentacionItem } from './ven-212.model';

export interface Ven212Lookup {
  [key: string]: unknown;
  ID_TASA?: string;
  DESCRIPCION?: string;
  CAN_INV?: number;
  ID_DOCUMENTO?: string;
  DOCUMENTO?: string;
  CONSECUTIVO?: number;
  PREFIJO?: string;
  SUFIJO?: string;
  ID_UN?: string;
  NOMBRE?: string;
  ID_CLIENTE?: string;
  NOMBRE_COMPLETO?: string;
  ID_UBICACION?: string;
  DIRECCION?: string;
  ID_ADC?: string;
  ID_MONEDA?: string;
  CODIGO?: string;
  TIPO?: string;
  PLAZOS?: string | Ven212Lookup[];
  PLAZO?: number;
  DIAS_VENC?: number;
  NOMBRE_OBJETO?: string;
  VALOR_DEFECTO?: string;
  ACTIVADO?: boolean | number;
  FORMATO?: string;
  PRODUCTO?: string;
  PRECIO?: number;
  VALOR_BASE?: number;
  PORC_IVA?: number;
  REFERENCIA?: string;
  PRESENTACION?: Ven212PresentacionItem[];
  IVAS?: Ven212IvaItem[];
  UDM_VENTA?: string;
  UDM_COMPRA?: string;
  UDM_EQUIV?: string;
  CANTIDAD_PRES?: number;
  CANTIDAD_EQUIV?: number;
  PORCENTAJE?: number;
  VALOR?: string;
  CONFIG?: string;
  BANCO?: string;
  ErrMensaje?: string;
}

export interface Ven212Details {
  ErrMensaje?: string;
  ITM_FACTURA?: Ven212FacturaItem[];
  FACTURA_GRAV_AUX?: Ven212FacturaItem[];
  FACTURA_GRAV?: Ven212FacturaGrav[];
  FACTURA_PAGOS?: Ven212FacturaPago[];
}

export interface Ven212TaxResult {
  ENCAB?: Ven212FacturaGrav[];
  ITEMS?: Ven212FacturaItem[];
}

export interface Ven212SettingResult {
  ErrMensaje?: string;
  tipoAccion?: string;
  titulo?: string;
  modoSeleccion?: string;
  dataSource?: unknown[];
  colsConfig?: string;
  container?: string;
  height?: number;
  width?: number;
  EMAIL?: string;
  NIT_EMPRESA?: string | number;
  dataElecStatus?: Ven212Lookup[];
  ITM_FACTURA?: Ven212FacturaItem[];
  DATA_GRAV?: Ven212TaxResult[];
  GRID_TOTALES?: { key: string; value: number }[];
  FACTURA?: Partial<Ven212FacturaRecord>;
  DATA_FIN?: { FECHA_PRIMER_VENC?: string; FECHA_ULT_VENC?: string };
}

export type Ven212Header = Partial<Ven212FacturaRecord>;
