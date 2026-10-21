import {
  Ghu250LiquidationClass
} from '../constants/ghu-250.constants';


/**
 * Backend field names are intentionally preserved (spLiqPrestaciones).
 */

/** Option of the "Clase de liquidación" tag box. */
export interface Ghu250LiquidationClassOption {
  text: string;
  value: Ghu250LiquidationClass;
}

/** CAUSAS (ID_APLICACION = 'GHU-003'). */
export interface Ghu250Cause {
  ID_CAUSA: string;
  DESCRIPCION: string;
}

/** EMPRESAS_PATRONALES. */
export interface Ghu250Company {
  ID_EMPRESA: string;
  NOMBRE: string;
}

/** GRUPOS (ID_GRUPO_SUPERIOR = 'EMPLEADOS'). */
export interface Ghu250Group {
  ID_GRUPO: string;
}

/** Employee returned by 'empleados' and 'preparar empleados'. */
export interface Ghu250Employee {
  ID_EMPLEADO: string;
  NOMBRE: string;
  FECHA_INICIAL: string | null;
  FECHA_FINAL: string | null;
  DIAS: number | null;
}

/** Step 1 values sent as @DATA_JSON. */
export interface Ghu250Parameters {
  CLASE_LIQUIDACION: Ghu250LiquidationClass[];
  FECHA_RETIRO: string | null;
  ID_CAUSA: string | null;
  ID_EMPRESA: string | null;
  ID_GRUPO: string | null;
  LISTA_EMPLEADOS: string[];
}

/** Common request context added to every @DATA_JSON. */
export interface Ghu250RequestContext {
  ID_UN: string;
  USUARIO: string;
}

/** Origin table of a liquidated concept. */
export type Ghu250ConceptOrigin = 'NOMINA' | 'OTROS';

/** Value type of a liquidated concept (LIQUIDACION_*.TIPO_VALOR). */
export type Ghu250ValueType = 'Devengado' | 'Deducido';

/** Concept present in the liquidation (one grid column). */
export interface Ghu250Concept {
  ORIGEN: Ghu250ConceptOrigin;
  ID_CONCEPTO: string;
  DESCRIPCION: string;
  TIPO_VALOR: Ghu250ValueType;
}

/** Liquidated value of one concept for one employee. */
export interface Ghu250ConceptValue extends Ghu250Concept {
  DIAS: number | null;
  VALOR_BASE: number | null;
  VALOR: number;
}

/** Employee liquidation returned by 'prestaciones' / 'ajustes'. */
export interface Ghu250EmployeeLiquidation {
  ID_EMPLEADO: string;
  NOMBRE: string;
  FECHA_INICIAL: string | null;
  FECHA_FINAL: string | null;
  SALARIO_BASICO: number;
  BASE_PRESTACIONAL: number;
  DETALLE: Ghu250ConceptValue[];
}

/** Result of 'prestaciones' / 'ajustes'. */
export interface Ghu250LiquidationResult {
  CONSECUTIVO: number;
  ID_LIQUIDACION: string;
  ID_DOCUMENTO: string;
  FECHA_RETIRO: string;
  CONCEPTOS: Ghu250Concept[];
  EMPLEADOS: Ghu250EmployeeLiquidation[];
}

/** One adjustment sent by the 'ajustes' action. */
export interface Ghu250Adjustment {
  ID_EMPLEADO: string;
  ORIGEN: Ghu250ConceptOrigin;
  ID_CONCEPTO: string;
  VALOR: number;
}

/**
 * Flat row displayed by the step 3 grid. Concept values are stored
 * under the keys produced by ghu250ConceptField().
 */
export interface Ghu250LiquidationRow {
  ID_EMPLEADO: string;
  NOMBRE: string;
  FECHA_INICIAL: string | null;
  FECHA_FINAL: string | null;
  SALARIO_BASICO: number;
  BASE_PRESTACIONAL: number;
  TOTAL_DEVENGADO: number;
  TOTAL_DEDUCIDO: number;
  TOTAL_PAGAR: number;
  [conceptField: string]: string | number | null;
}

/** Backend error envelope used by XTEIN procedures. */
export interface Ghu250BackendMessage {
  ErrMensaje?: string;
}
