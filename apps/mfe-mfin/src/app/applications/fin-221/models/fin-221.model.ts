/**
 * Represents a single detail item of a financing plan.
 */
export interface Fin221ItemPlan {
  ID_UN?: string;
  ID_PLAN?: string;
  ITEM: number;
  ID_TASA: string;
  PAGO: number;
  FACTOR: number;
  PORC_TASA: number;
  CUOTA_INICIAL: 'Si' | 'No' | boolean;
  TIPO_CI: string;
  MINIMO_CI: number;
  MAXIMO_CI: number;
  DIAS_PLAZO_CI: number;
  DIFERIR_CI: 'Si' | 'No' | boolean;
  DESCONTAR_CI: 'Si' | 'No' | boolean;
  FINANCIAR_CI?: 'Si' | 'No' | boolean;
  DIAS: number;
  PORC_GRAV: number;
  PORC_PAGO: number;
  DESCUENTO_PPP: number;
  ID_CONDICION: string;
}

/**
 * Represents the main header record of a financing plan.
 */
export interface Fin221PlanRecord {
  ID_UN?: string;
  ID_PLAN: string;
  DESCRIPCION: string;
  DIAS_PRIMERA_CUOTA: number;
  FINANCIAR_GRAV: string;
  TIPO_FRECUENCIA: 'Constante' | 'Variable';
  FRECUENCIA: number;
  NUMERO_PAGOS: number;
  ESTADO: string;
  QFILTRO?: string;
  ITM_PLANES: Fin221ItemPlan[];
  ErrMensaje?: string;
}

/**
 * Catalog item for financial rates.
 */
export interface Fin221TasaOption {
  ID_TASA: string;
  DESCRIPCION: string;
  PORCENTAJE: number;
  ErrMensaje?: string;
}

/**
 * Catalog item for negotiation conditions.
 */
export interface Fin221CondicionOption {
  ID_UN: string;
  ID_CONDICION: string;
  ErrMensaje?: string;
}

/**
 * Payload sent to calculate the factor.
 */
export interface Fin221FactorPayload {
  ID_TASA: string;
  PAGO: number;
}

/**
 * Response structure for factor calculation.
 */
export interface Fin221FactorResult {
  FACTOR: number;
  ErrMensaje?: string;
}

/**
 * Save payload sent to spPlanesFinanciacion.
 */
export interface Fin221SavePayload {
  PLANES: Omit<Fin221PlanRecord, 'ITM_PLANES' | 'ErrMensaje' | 'QFILTRO'>;
  ITM_PLANES: Fin221ItemPlan[];
}
