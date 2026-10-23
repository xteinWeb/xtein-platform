/**
 * Represents a devolución header record stored in DEVOLUCION.
 *
 * Backend property names are intentionally preserved to match the
 * spDevolucion contract. Amounts are computed by the SP: the front only previews them.
 */
export interface Ven213DevolucionRecord {
  /** Business unit identifier. */
  ID_UN: string;

  /** Item business unit identifier (inherited from the source document). */
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

  /** Customer address (display only). */
  DIRECCION?: string;

  /** Seller identifier (inherited). */
  ID_ADC?: string;

  /** Payment condition / pricing list identifier (inherited). */
  ID_CONDICION?: string;

  /** Currency identifier (inherited). */
  ID_MONEDA?: string;

  /** Currency exchange rate (inherited). */
  TASA_CAMBIO?: number;

  /** Payment term (inherited). */
  PLAZO?: number;

  /** Sale type (inherited). */
  TIPO_VENTA?: string;

  /** Return cause (CAUSAS of VEN-213, required). */
  ID_CAUSA: string;

  /** Return cause name. */
  NOMBRE_CAUSA?: string;

  /** Header description or notes. */
  DESCRIPCION?: string;

  /** Subtotal amount. */
  SUB_TOTAL: number;

  /** Total discount amount. */
  VALOR_DESCUENTO: number;

  /** Taxes text with the source format (ID_TASA^POR^VALOR|…), aggregated by ID_TASA. */
  GRAVAMENES?: string | number;

  /** Total amount. */
  TOTAL: number;

  /** Amount applied to the invoice receivables (Σ DEVOLUCION − Σ ANULACION DEVOLUCION). */
  VALOR_CARTERA?: number;

  /** TOTAL − amount applied to receivables (0 when ANULADA or not credit). */
  VALOR_NO_APLICADO?: number;

  /** Source document: 'FACTURA' or 'REMISION'. */
  ORIGEN_TIPO?: string | null;
  ORIGEN_ID_DOCUMENTO?: string | null;
  ORIGEN_PREFIJO?: string | null;
  ORIGEN_CONSECUTIVO?: number | null;
  ORIGEN_SUFIJO?: string | null;
  ORIGEN_DOCUMENTO?: string | null;

  /** Operating user code. */
  USUARIO: string;

  /** Document status (ACTIVA, ANULADA). */
  ESTADO: string;

  /** Backend error message if validation failed. */
  ErrMensaje?: string;

  /** Query filter expression for reports. */
  QFILTRO?: string;
}


/**
 * One tax of a line (GRAVAMENES text: ID_TASA^POR^VALOR; retentions are negative).
 */
export interface Ven213Gravamen {
  ID_TASA: string;
  POR?: number;
  VALOR: number;
}


/**
 * Amounts of a line, each field proportional to its own source value.
 */
export interface Ven213Amounts {
  SUB_TOTAL: number;
  VALOR_DESCUENTO: number;
  TOTAL: number;
  GRAV: Ven213Gravamen[];
}


/**
 * Represents an individual line item of a devolución (ITM_DEVOLUCION).
 * ITEM is the ITEM of the source line; quantities are in the unit of the source line.
 */
export interface Ven213DevolucionItem {
  ITEM: number;
  PRODUCTO: string;
  ATRIBUTO?: string;
  NOMBRE_PRODUCTO?: string;
  REFERENCIA?: string;
  UDM_VENTA?: string;

  /** Source document of the line (the factura or remisión loaded). */
  ID_SOPORTE: string;
  NC_PREFIJO: string;
  NC_CONSECUTIVO: number;
  NC_SUFIJO: string;
  SOPORTE?: string;

  /** Quantity to return. */
  CANTIDAD: number;
  /** Quantity of the source line. */
  CANTIDAD_ORIGEN: number;
  /** Quantity already returned from the source line (active devoluciones). */
  CANTIDAD_DEVUELTA: number;
  /** Pending (not invoiced) quantity of a source remisión line. */
  CANTIDAD_PENDIENTE?: number | null;
  /** Upper bound for CANTIDAD. */
  CANTIDAD_MAX?: number | null;

  VALOR_UNITARIO: number;
  VALOR_BASE?: number;
  SUB_TOTAL: number;
  VALOR_DESCUENTO: number;
  TOTAL: number;
  /** Taxes of the line (from GRAVAMENES_LISTA or proportional to the source). */
  GRAVAMENES_LISTA?: Ven213Gravamen[];
  /** Taxes text as stored by the SP. */
  GRAVAMENES?: string;

  /** Amounts of the source line. */
  ORIGEN?: Ven213Amounts;
  /** Source amounts minus the active web devoluciones of the line (closing rule). */
  RESTANTE?: Ven213Amounts;
  /** True when this quantity exhausts the source line (amounts come from RESTANTE). */
  CIERRA?: boolean;
  /**
   * CIERRA of CARGAR ORIGEN: the SP can apply the closing rule (RESTANTE) to this line. False when earlier
   * desktop devoluciones make RESTANTE unreliable; then the simple proportional formula applies.
   */
  CIERRA_SP?: boolean;
  /** True when the source line did not move inventory: no restock distribution. */
  SIN_INVENTARIO?: boolean;

  /** Restock distribution of the item (front only, flattened into ITM_DEVOLUCION_BOD). */
  BODEGAS?: Ven213ItemBodega[];
  /** True when the item has no valid restock distribution. */
  SIN_REPARTO?: boolean;
}


/**
 * Restock distribution row of an item (ITM_DEVOLUCION_BOD).
 */
export interface Ven213ItemBodega {
  ITEM: number;
  ID_UN_BODEGA: string;
  /** Quantity in the unit of the source line. */
  CANTIDAD: number;
  DESCRIPCION?: string;
  /** Unit cost (returned by consulta adicionales). */
  COSTO?: number;
  /** 'ORIGEN', 'PROMEDIO_LINEA' or 'PROMEDIO_ACTUAL' (returned by consulta adicionales). */
  ORIGEN_COSTO?: string;
}
