/**
 * Defines the GHU-250 application identifiers.
 */
export const Ghu250Application = {

  Id:
    'GHU-250',

  BackendId:
    'GHU250',

  /**
   * Stored procedure that serves every GHU-250 action.
   */
  Procedure:
    'spLiqPrestaciones'

} as const;


/**
 * Defines the existing backend endpoints used by GHU-250.
 */
export const Ghu250Endpoint = {

  /**
   * Read-only actions (lists and employee queries).
   */
  Query:
    `/${Ghu250Application.BackendId}/consulta`,

  /**
   * Actions that write LIQUIDACION_NOMINA / LIQUIDACION_OTROS.
   */
  Save:
    `/${Ghu250Application.BackendId}/save`

} as const;


export type Ghu250Endpoint =
  typeof Ghu250Endpoint[
    keyof typeof Ghu250Endpoint
  ];


/**
 * Defines the @ACCION values supported by spLiqPrestaciones.
 */
export const Ghu250Action = {

  Causes:
    'causas',

  Companies:
    'empresas',

  Groups:
    'grupos',

  Employees:
    'empleados',

  PrepareEmployees:
    'preparar empleados',

  Benefits:
    'prestaciones',

  Adjustments:
    'ajustes'

} as const;


export type Ghu250Action =
  typeof Ghu250Action[
    keyof typeof Ghu250Action
  ];


/**
 * Liquidation classes (ID_CONCEPTO written in LIQUIDACION_OTROS).
 */
export const Ghu250LiquidationClass = {

  ContractTermination:
    'LCJ',

  ServiceBonus:
    'LPS',

  Vacations:
    'LVS',

  Severance:
    'LCS',

  SeveranceInterest:
    'LIN'

} as const;


export type Ghu250LiquidationClass =
  typeof Ghu250LiquidationClass[
    keyof typeof Ghu250LiquidationClass
  ];


/**
 * Wizard steps.
 */
export const Ghu250Step = {

  Parameters:
    1,

  Employees:
    2,

  Liquidation:
    3,

  Reports:
    4

} as const;


export type Ghu250Step =
  typeof Ghu250Step[
    keyof typeof Ghu250Step
  ];
