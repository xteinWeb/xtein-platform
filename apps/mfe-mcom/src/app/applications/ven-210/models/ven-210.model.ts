import type { Ven210Lookup } from './ven-210-business.model';

/**
 * Represents a remisión header record stored in REMISION.
 *
 * Backend property names are intentionally preserved to match the
 * spRemision contract (columns marked "a confirmar con DDL").
 */
export interface Ven210RemisionRecord {
  REMISION_PAGOS?: Ven210RemisionPago[];

  /** Business unit identifier. */
  ID_UN: string;

  /** Item business unit identifier. */
  ID_UN_ITEM?: string;

  /** Document type identifier. */
  ID_DOCUMENTO: string;

  /** Document type display name. */
  NOMBRE_DOCUMENTO?: string;

  /** Document sequence prefix. */
  PREFIJO: string;

  /** Document sequence consecutive number. */
  CONSECUTIVO: number;

  /** Document sequence suffix. */
  SUFIJO: string;

  /** Formatted full document identifier. */
  DOCUMENTO: string;

  /** Document registration timestamp. */
  FECHA_REGISTRO?: string | null;

  /** Transaction effective date. */
  FECHA: string | null;

  /** Transaction time. */
  HORA?: string | null;

  /** Customer identifier. */
  ID_CLIENTE: string;

  /** Customer name. */
  NOMBRE_CLIENTE?: string;

  /** Seller identifier. */
  ID_ADC?: string;

  /** Payment condition / pricing list identifier. */
  ID_CONDICION?: string;

  /** Header description or notes. */
  DESCRIPCION?: string;

  /** Currency identifier. */
  ID_MONEDA?: string;

  /** Currency exchange rate. */
  TASA_CAMBIO?: number;

  /** Document validity date. */
  VIGENCIA?: string | null;

  /** Purchase order (supporting document) identifier. */
  ID_DOC_SOPORTE?: string;

  /** Supporting document consecutive number. */
  NC_DOC_SOPORTE?: number;

  /** Authorization timestamp. */
  FECHA_AUTORIZACION?: string | null;

  /** Initial payment amount. */
  CUOTA_INICIAL?: number;

  /** Payment term. */
  PLAZO?: number;

  /** General contract terms. */
  CONDICIONES_GENERALES?: string;

  /** Subtotal amount. */
  SUB_TOTAL: number;

  /** Total discount amount. */
  VALOR_DESCUENTO: number;

  /** Total operational costs. */
  VALOR_COSTOS?: number;

  /** Total payable amount (TOTAL = SUB_TOTAL). */
  TOTAL: number;

  /** Sale type (CONTADO, CREDITO). */
  TIPO_VENTA?: string;

  /** Installment value. */
  VALOR_CUOTA?: number;

  /** First installment value. */
  VALOR_PRIMER_CUOTA?: number;

  /** First expiration date. */
  FECHA_PRIMER_VENC?: string | null;

  /** Days per installment. */
  DIAS_CUOTA?: number;

  /** Unit of measure for installment days. */
  UM_DIAS_CUOTA?: string;

  /** Operating user code. */
  USUARIO: string;

  /** Document status (ACTIVA, FACTURADA, ANULADA). */
  ESTADO: string;

  /** Final costs amount. */
  VALOR_FIN_COSTOS?: number;

  /** Purchase order date. */
  FECHA_OC?: string | null;

  /** Delivery location identifier. */
  ID_UBICACION?: string;

  /** Delivery address. */
  DIRECCION?: string;

  /** 'S' when the remisión was loaded from an order, 'N' otherwise. */
  ORIGEN_PEDIDO?: string | null;

  /** Source order keys (a confirmar con DDL). */
  PED_ID_DOCUMENTO?: string | null;
  PED_PREFIJO?: string | null;
  PED_CONSECUTIVO?: number | null;
  PED_SUFIJO?: string | null;

  /** Backend error message if validation failed. */
  ErrMensaje?: string;

  /** Query filter expression for reports. */
  QFILTRO?: string;
}


/**
 * Represents an individual line item of a remisión (ITM_REMISION).
 */
export interface Ven210RemisionItem {
  FECHA_ENTREGA?: string | null;
  NOMBRE_PRODUCTO?: string;
  REFERENCIA?: string;
  /** Presentation options of the product (array, not a factor). */
  PRESENTACION?: Ven210Lookup[];
  UDM_EQUIV?: string;
  CANTIDAD_PRES?: number;
  CANTIDAD_EQUIV?: number;
  /** Quantity in base unit = CANTIDAD_PRES × CANTIDAD_EQUIV × CANTIDAD. */
  CANTIDAD_REAL?: number;

  ID_UN?: string;
  ID_UN_ITEM?: string;
  ID_DOCUMENTO?: string;
  PREFIJO?: string;
  CONSECUTIVO?: number;
  SUFIJO?: string;
  ITEM: number;
  PRODUCTO: string;
  ATRIBUTO?: string;

  /** Source order line (a confirmar con DDL). */
  ITEM_PED?: number | null;
  ID_SOPORTE?: string;
  NC_PREFIJO?: string;
  NC_CONSECUTIVO?: number;
  NC_SUFIJO?: string;
  SOPORTE?: string;

  /** Quantity in the item presentation. */
  CANTIDAD: number;
  CANTIDAD_AUTORIZADA?: number;
  CANTIDAD_PENDIENTE?: number;
  /** Upper bound for CANTIDAD when the item comes from an order. */
  CANTIDAD_MAX?: number | null;

  VALOR_BASE?: number;
  VALOR_UNITARIO: number;
  SUB_TOTAL: number;
  VALOR_DESCUENTO: number;
  VALOR_COSTOS?: number;
  TOTAL: number;
  UDM_VENTA?: string;
  FECHA?: string | null;
  ESTADO?: string;

  /** Warehouse distribution of the item (front only, flattened into ITM_REMISION_BOD). */
  BODEGAS?: Ven210ItemBodega[];
  /** True when the item has no valid warehouse distribution. */
  SIN_REPARTO?: boolean;
}


/**
 * Warehouse distribution row of an item (ITM_REMISION_BOD).
 */
export interface Ven210ItemBodega {
  ITEM: number;
  ID_UN_BODEGA: string;
  /** Quantity in the item presentation. */
  CANTIDAD: number;
  /** Quantity in base unit. */
  CANTIDAD_REAL?: number;
  /** Available stock in base unit. */
  EXISTENCIA?: number;
  DESCRIPCION?: string;
}


/**
 * Represents an advance applied to a remisión (REMISION_PAGOS, a confirmar con DDL).
 */
export interface Ven210RemisionPago {
  ITEM: number;
  ID_RECAUDO?: string;
  NC_RECAUDO?: string;
  ID_DOCUMENTO?: string;
  CONSECUTIVO?: number;
  FECHA: string | Date;
  SALDO: number;
  VALOR: number;
}



/**
 * Catalogs and lists used by VEN-210 selectors.
 */
export interface Ven210Catalogs {
  monedas?: Array<{
    ID_MONEDA: string;
    MONEDA: string;
    DESCRIPCION?: string;
  }>;

  condiciones?: Array<{
    ID_CONDICION: string;
    CONDICION: string;
    CODIGO?: string;
    NOMBRE?: string;
  }>;

  unidadesNegocio?: Array<{
    ID_UN: string;
    NOMBRE: string;
    UN_NOMBRE?: string;
  }>;

  tiposVenta?: Array<{
    TIPO_VENTA: string;
    DESCRIPCION: string;
  }>;
}
