/**
 * Represents a Factura header record stored in FACTURAS.
 */
export interface Ven212FacturaRecord {
  FACTURA_GRAV?: Ven212FacturaGrav[];
  FACTURA_PAGOS?: Ven212FacturaPago[];
  Factura_GRAV?: Ven212FacturaGrav[];
  Factura_PAGOS?: Ven212FacturaPago[];

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
  FECHA_ULT_VENC?: string | null;
  CLIENTE_PADRE?: string;
  BANCO?: string;
  ErrMensaje?: string;
  QFILTRO?: string;
  ITM_FACTURA?: Ven212FacturaItem[];
  ITM_Factura?: Ven212FacturaItem[];
}

export interface Ven212PresentacionItem {
  UDM_VENTA?: string;
  UDM_COMPRA?: string;
  UDM_EQUIV?: string;
  CANTIDAD_PRES?: number;
  CANTIDAD_EQUIV?: number;
  PRECIO?: number;
}

export interface Ven212IvaItem {
  ID_TASA: string;
  TASA?: number;
  PORCENTAJE?: number;
  CLASE?: string;
  BASE?: number;
  VALOR?: number;
  [key: string]: unknown;
}

/**
 * Detail line item for a Factura.
 */
export interface Ven212FacturaItem {
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
  CANTIDAD_REAL?: number;
  VALOR_BASE?: number;
  VALOR_UNITARIO: number;
  SUB_TOTAL: number;
  VALOR_DESCUENTO?: number;
  VALOR_COSTOS?: number;
  VALOR_IVA?: number;
  POR_IVA?: number;
  PORC_IVA?: number;
  GRAVAMENES?: unknown;
  GRAV_TOTAL?: number;
  GRAV_ORG?: unknown;
  TOTAL: number;
  UDM_VENTA?: string;
  UDM_COMPRA?: string;
  UDM_EQUIV?: string;
  CANTIDAD_PRES?: number;
  CANTIDAD_EQUIV?: number;
  FECHA?: string | null;
  ESTADO?: string;
  PRECIO?: number;
  APLICACION?: number;
  PRESENTACION?: Ven212PresentacionItem[];
  IVAS?: Ven212IvaItem[];
}

/**
 * Tax / gravamen record associated with a Factura.
 */
export interface Ven212FacturaGrav {
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

export interface Ven212FacturaGravAux {
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
 * Payment or Advance associated with a Factura.
 */
export interface Ven212FacturaPago {
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

export interface Ven212Option {
  text: string;
  value: string;
}
