/**
 * Represents a prefactura header record stored in PREFACTURAS.
 *
 * Backend property names are intentionally preserved to match the
 * existing XTEIN API contract.
 */
export interface Ven230PrefacturaRecord {

  /**
   * Business unit identifier.
   */
  ID_UN: string;

  /**
   * Item business unit identifier.
   */
  ID_UN_ITEM?: string;

  /**
   * Document type identifier (e.g. FAC, PRE).
   */
  ID_DOCUMENTO: string;

  /**
   * Document type display name.
   */
  NOMBRE_DOCUMENTO?: string;

  /**
   * Document sequence prefix.
   */
  PREFIJO: string;

  /**
   * Document sequence consecutive number.
   */
  CONSECUTIVO: number;

  /**
   * Document sequence suffix.
   */
  SUFIJO: string;

  /**
   * Formatted full document identifier (e.g. PRE-10023).
   */
  DOCUMENTO: string;

  /**
   * Associated invoice document identifier when billed.
   */
  DOCUMENTO_FAC?: string;

  /**
   * Document registration timestamp.
   */
  FECHA_REGISTRO?: string | null;

  /**
   * Transaction effective date.
   */
  FECHA: string | null;

  /**
   * Transaction time.
   */
  HORA?: string | null;

  /**
   * Customer / Client identifier.
   */
  ID_CLIENTE: string;

  /**
   * Customer / Client commercial name.
   */
  NOMBRE_CLIENTE?: string;

  /**
   * Customer commercial branch identifier.
   */
  ID_ADC?: string;

  /**
   * Payment condition / pricing list identifier.
   */
  ID_CONDICION?: string;

  /**
   * Header description or notes.
   */
  DESCRIPCION?: string;

  /**
   * Currency identifier (e.g. COP, USD).
   */
  ID_MONEDA?: string;

  /**
   * Currency exchange rate.
   */
  TASA_CAMBIO?: number;

  /**
   * Document validity date.
   */
  VIGENCIA?: string | null;

  /**
   * Supporting document identifier.
   */
  ID_DOC_SOPORTE?: string;

  /**
   * Supporting document consecutive number.
   */
  NC_DOC_SOPORTE?: number;

  /**
   * Authorization timestamp.
   */
  FECHA_AUTORIZACION?: string | null;

  /**
   * Initial payment amount.
   */
  CUOTA_INICIAL?: number;

  /**
   * Payment term days.
   */
  PLAZO?: number;

  /**
   * General contract terms.
   */
  CONDICIONES_GENERALES?: string;

  /**
   * Subtotal amount before discounts and taxes.
   */
  SUB_TOTAL: number;

  /**
   * Total discount amount.
   */
  VALOR_DESCUENTO: number;

  /**
   * Tax identifiers list.
   */
  GRAVAMENES?: string;

  /**
   * Total operational / logistics costs.
   */
  VALOR_COSTOS?: number;

  /**
   * Total payable amount.
   */
  TOTAL: number;

  /**
   * Sale / purchase transaction type (e.g. CONTADO, CREDITO).
   */
  TIPO_VENTA?: string;

  /**
   * Installment value.
   */
  VALOR_CUOTA?: number;

  /**
   * First installment value.
   */
  VALOR_PRIMER_CUOTA?: number;

  /**
   * First expiration date.
   */
  FECHA_PRIMER_VENC?: string | null;

  /**
   * Days per installment.
   */
  DIAS_CUOTA?: number;

  /**
   * Unit of measure for installment days.
   */
  UM_DIAS_CUOTA?: string;

  /**
   * Operating user code.
   */
  USUARIO: string;

  /**
   * Current document status (REGISTRADO, ANULADO, etc.).
   */
  ESTADO: string;

  /**
   * Final costs amount.
   */
  VALOR_FIN_COSTOS?: number;

  /**
   * Purchase order date.
   */
  FECHA_OC?: string | null;

  /**
   * Delivery location identifier.
   */
  ID_UBICACION?: string;

  /**
   * Delivery address.
   */
  DIRECCION?: string;

  /**
   * Warehouse business unit.
   */
  ID_UN_BODEGA?: string;

  /**
   * Electronic invoice unique code.
   */
  CUFE?: string;

  /**
   * Base value for tax calculation.
   */
  VALOR_BASE?: number;

  /**
   * Backend error message if validation failed.
   */
  ErrMensaje?: string;

  /**
   * Query filter expression for reports.
   */
  QFILTRO?: string;
}


/**
 * Represents an individual line item of a prefactura.
 */
export interface Ven230PrefacturaItem {

  ID_UN?: string;

  ID_UN_ITEM?: string;

  ID_DOCUMENTO?: string;

  PREFIJO?: string;

  CONSECUTIVO?: number;

  SUFIJO?: string;

  ITEM: number;

  PRODUCTO: string;

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

  VALOR_DESCUENTO: number;

  VALOR_COSTOS?: number;

  VALOR_IVA: number;

  POR_IVA: number;

  GRAVAMENES?: string;

  GRAV_TOTAL?: number;

  GRAV_ORG?: unknown;

  TOTAL: number;

  UDM_VENTA?: string;

  FECHA?: string | null;

  ESTADO?: string;
}


/**
 * Represents a payment transaction registered on a prefactura.
 */
export interface Ven230PrefacturaPago {

  ITEM: number;

  ID_RECAUDO: string;

  NC_RECAUDO: string;

  FECHA: string | Date;

  ID_Prefactura: string;

  NC_Prefactura: string;

  SALDO: number;

  VALOR: number;
}


/**
 * Represents an applied tax breakdown line on a prefactura.
 */
export interface Ven230PrefacturaGrav {

  ID_UN?: string;

  ID_DOCUMENTO?: string;

  PREFIJO?: string;

  CONSECUTIVO?: number;

  SUFIJO?: string;

  ITEM: number;

  APLICACION?: number;

  ID_TASA: string;

  CLASE?: string;

  POR_TASA: number;

  VALOR: number;

  BASE: number;
}


/**
 * Key-value option used by select boxes.
 */
export interface Ven230Option<T = string> {

  text: string;

  value: T;
}


/**
 * Catalogs and lists used by VEN-230 selectors.
 */
export interface Ven230DataLists {

  documentos?: Array<{
    DOCUMENTO: string;
    ID_DOCUMENTO: string;
    NOMBRE?: string;
    PREFIJO?: string;
  }>;

  clientes?: Array<{
    ID_CLIENTE: string;
    NOMBRE_CLIENTE: string;
    DIRECCION?: string;
    ID_ADC?: string;
  }>;

  monedas?: Array<{
    ID_MONEDA: string;
    MONEDA: string;
  }>;

  condiciones?: Array<{
    ID_CONDICION: string;
    CONDICION: string;
  }>;

  unidadesNegocio?: Array<{
    ID_UN: string;
    NOMBRE: string;
  }>;

  tiposVenta?: Array<{
    TIPO_VENTA: string;
    DESCRIPCION: string;
  }>;

  bodegas?: Array<{
    ID_BODEGA: string;
    NOMBRE: string;
  }>;
}
