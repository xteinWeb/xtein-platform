/**
 * MAD-002 application identifiers.
 */
export const Mad002Application = {

  /**
   * XTEIN application identifier.
   */
  Id:
    'MAD-002',

  /**
   * Backend application identifier.
   */
  BackendId:
    'MAD002'

} as const;


/**
 * Existing MAD-002 backend endpoints.
 */
export const Mad002Endpoint = {

  /**
   * Generic MAD-002 query endpoint.
   */
  Query:
    `/${Mad002Application.BackendId}/consulta`

} as const;


/**
 * Existing MAD-002 backend actions.
 */
export const Mad002Action = {

  /**
   * Loads the application hierarchy used by the
   * Dashboard and KPI designer.
   */
  ApplicationTree:
    'ARBOL_APLICACIONES'

} as const;


/**
 * Application types that can be opened inside the
 * Dashboard Designer.
 */
export const Mad002DesignableApplicationTypes =
  new Set<string>([

    'DASHBOARD',

    'KPI'

  ]);