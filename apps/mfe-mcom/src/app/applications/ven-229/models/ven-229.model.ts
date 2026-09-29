/**
 * Represents a Pedido header record stored in PEDIDOS.
 */
export interface Ven229PedidoRecord {
  PEDIDO_GRAV?: Ven229PedidoGrav[];
  PEDIDO_PAGOS?: Ven229PedidoPago[];
  Pedido_GRAV?: Ven229PedidoGrav[];
  Pedido_PAGOS?: Ven229PedidoPago[];

  ID_UN: string;
  ID_UN_ITEM?: string;
  ID_DOCUMENTO: string;
  NOMBRE_DOCUMENTO?: string;
  PREFIJO: string;
  CONSECUTIVO: number;
  SUFIJO: string;
  DOCUMENTO: string;
  DOCUMENTO_FAC?: string;
  FECHA_REGISTRO?: string | null;
  FECHA: string | null;
  HORA?: string | null;
  ID_CLIENTE: string;
  NOMBRE_CLIENTE?: string;
  ID_ADC?: string;
  ID_CONDICION?: string;
  DESCRIPCION?: string;
  ID_MONEDA?: string;
  TASA_CAMBIO?: number;
  VIGENCIA?: string | null;
  ID_DOC_SOPORTE?: string;
  NC_DOC_SOPORTE?: number;
  FECHA_AUTORIZACION?: string | null;
  CUOTA_INICIAL?: number;
  PLAZO?: number;
  CONDICIONES_GENERALES?: string;
  SUB_TOTAL: number;
  VALOR_DESCUENTO: number;
  GRAVAMENES?: unknown;
  VALOR_COSTOS?: number;
  TOTAL: number;
  TIPO_VENTA?: string;
  VALOR_CUOTA?: number;
  VALOR_PRIMER_CUOTA?: number;
  FECHA_PRIMER_VENC?: string | null;
  DIAS_CUOTA?: number;
  UM_DIAS_CUOTA?: string;
  USUARIO: string;
  ESTADO: string;
  VALOR_FIN_COSTOS?: number;
  FECHA_OC?: string | null;
  ID_UBICACION?: string;
  DIRECCION?: string;
  ID_UN_BODEGA?: string;
  CUFE?: string;
  VALOR_BASE?: number;
  ErrMensaje?: string;
  QFILTRO?: string;
}

export interface Ven229PresentacionItem {
  UDM_VENTA?: string;
  UDM_COMPRA?: string;
  UDM_EQUIV?: string;
  CANTIDAD_PRES?: number;
  CANTIDAD_EQUIV?: number;
}

export interface Ven229IvaItem {
  ID_TASA: string;
  TASA?: number;
  PORCENTAJE?: number;
  CLASE?: string;
  BASE?: number;
  VALOR?: number;
  [key: string]: unknown;
}

/**
 * Detail line item for a Pedido.
 */
export interface Ven229PedidoItem {
  ID_UN?: string;
  ID_UN_ITEM?: string;
  ID_DOCUMENTO?: string;
  PREFIJO?: string;
  CONSECUTIVO?: number;
  SUFIJO?: string;
  ITEM: number;
  PRODUCTO: string;
  NOMBRE_PRODUCTO?: string;
  REFERENCIA?: string;
  ATRIBUTO?: string;
  ID_SOPORTE?: string;
  NC_PREFIJO?: string;
  NC_CONSECUTIVO?: number;
  NC_SUFIJO?: string;
  SOPORTE?: string;
  CANTIDAD: number;
  CANTIDAD_AUTORIZADA?: number;
  CANTIDAD_PENDIENTE?: number;
  VALOR_BASE?: number;
  VALOR_UNITARIO: number;
  SUB_TOTAL: number;
  VALOR_DESCUENTO?: number;
  VALOR_COSTOS?: number;
  VALOR_IVA?: number;
  POR_IVA?: number;
  PORC_IVA?: number;
  GRAVAMENES?: string;
  GRAV_TOTAL?: number;
  GRAV_ORG?: unknown;
  TOTAL: number;
  UDM_VENTA?: string;
  UDM_EQUIV?: string;
  CANTIDAD_PRES?: number;
  CANTIDAD_EQUIV?: number;
  FECHA?: string | null;
  FECHA_ENTREGA?: string | null;
  ESTADO?: string;
  PRECIO?: number;
  APLICACION?: number;
  PRESENTACION?: Ven229PresentacionItem[];
  IVAS?: Ven229IvaItem[];
}

/**
 * Tax / gravamen record associated with a Pedido.
 */
export interface Ven229PedidoGrav {
  ID_UN?: string;
  ID_DOCUMENTO?: string;
  PREFIJO?: string;
  CONSECUTIVO?: number;
  SUFIJO?: string;
  ITEM?: number;
  APLICACION?: number;
  ID_TASA?: string;
  CLASE?: string;
  POR_TASA?: number;
  VALOR?: number;
  BASE?: number;
}

export interface Ven229PedidoGravAux {
  ITEM: number;
  PRODUCTO: string;
  ATRIBUTO: string;
  GRAV_ORG?: unknown;
  GRAVAMENES?: unknown;
  GRAV_TOTAL?: unknown;
  CANTIDAD: number;
  VALOR_UNITARIO: number;
  VALOR_DESCUENTO: number;
  VALOR_IVA: number;
  SUB_TOTAL: number;
  TOTAL: number;
}

/**
 * Payment or Advance associated with a Pedido.
 */
export interface Ven229PedidoPago {
  ITEM: number;
  ID_RECAUDO: string;
  NC_RECAUDO: string;
  FECHA?: string | Date;
  ID_PEDIDO?: string;
  NC_PEDIDO?: string;
  SALDO?: number;
  VALOR: number;
  TOTAL?: number;
}

export interface Ven229Option {
  text: string;
  value: string;
}
