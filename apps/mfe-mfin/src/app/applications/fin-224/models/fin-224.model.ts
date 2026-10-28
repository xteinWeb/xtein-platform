/**
 * Represents a price list item associated with a negotiation condition.
 */
export interface Fin224ItemCondicion {
  ID_UN?: string;
  ID_CONDICION?: string;
  ID_LISTA: string;
  DESCRIPCION?: string;
}

/**
 * Represents the main negotiation condition header record.
 */
export interface Fin224CondicionRecord {
  ID_UN?: string;
  ID_CONDICION: string;
  DESCRIPCION: string;
  TIPO_CONDICION?: string | null;
  TIPO: 'VENTAS' | 'PROVEEDOR' | string;
  ID_LISTA?: string | null;
  ID_PLAN: string;
  ID_DESCUENTO?: string | null;
  ID_COSTOS?: string | null;
  ESTADO: string;
  QFILTRO?: string;
  ITM_CONDICIONES: Fin224ItemCondicion[];
  ErrMensaje?: string;
}

/**
 * Catalog item for financing plans (from FIN-221).
 */
export interface Fin224PlanOption {
  ID_PLAN: string;
  DESCRIPCION: string;
  ESTADO?: string;
  ErrMensaje?: string;
}

/**
 * Catalog item for price lists (from COM-201).
 */
export interface Fin224ListaPrecioOption {
  ID_LISTA: string;
  DESCRIPCION: string;
  TIPO?: string;
  ESTADO?: string;
  ErrMensaje?: string;
}

/**
 * Save payload sent to spCondicionNegocio.
 */
export interface Fin224SavePayload {
  CONDICIONES: {
    ID_CONDICION: string;
    DESCRIPCION: string;
    TIPO: string;
    ID_PLAN: string;
    ESTADO: string;
  };
  ITM_CONDICIONES: {
    ID_CONDICION: string;
    ID_LISTA: string;
    DESCRIPCION?: string;
  }[];
}
