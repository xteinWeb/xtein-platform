import { Ven229PedidoItem, Ven229PedidoRecord, Ven229PedidoGrav, Ven229PedidoPago } from './ven-229.model';

export interface Ven229Lookup {
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
  PLAZOS?: string | Ven229Lookup[];
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
  PRESENTACION?: Ven229Lookup[];
  IVAS?: Ven229Lookup[];
  UDM_VENTA?: string;
  UDM_COMPRA?: string;
  UDM_EQUIV?: string;
  CANTIDAD_PRES?: number;
  CANTIDAD_EQUIV?: number;
  PORCENTAJE?: number;
  VALOR?: string;
  CONFIG?: string;
  ErrMensaje?: string;
}

export interface Ven229Details {
  ErrMensaje?: string;
  ITM_PEDIDO?: Ven229PedidoItem[];
  PEDIDO_GRAV_AUX?: Ven229PedidoItem[];
  PEDIDO_GRAV?: Ven229PedidoGrav[];
  PEDIDO_PAGOS?: Ven229PedidoPago[];
}

export interface Ven229TaxResult {
  ENCAB?: Ven229PedidoGrav[];
  ITEMS?: Ven229PedidoItem[];
}

export interface Ven229SettingResult extends Ven229Lookup {
  tipoAccion?: string;
  dataSource?: Ven229Lookup[];
  titulo?: string;
  modoSeleccion?: 'single' | 'multiple' | 'multiple-grupo';
  colsConfig?: string;
  container?: string;
  dataElecStatus?: Ven229Lookup[];
  EMAIL?: string;
  NIT_EMPRESA?: string | number;
  ITM_Pedido?: Ven229PedidoItem[];
  DATA_GRAV?: Ven229TaxResult[];
}

export type Ven229Header = Partial<Ven229PedidoRecord>;
