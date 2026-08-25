/**
 * Represents a request to open an application in the XTEIN workspace.
 *
 * This contract is intentionally independent from Angular components,
 * routes, and microfrontend implementation details.
 */
export interface ApplicationRequest {

 /**
   * Unique application identifier registered in XTEIN.
   *
   * Examples:
   * MAD-005
   * INV-209
   * ADM-015
   */
  applicationId: string;

  /**
   * Display title used by the workspace tab.
   */
  title: string;

  /**
   * Optional icon identifier associated with the application.
   */
  icon?: string;

  /**
   * Optional parameters passed to the target application.
   */
  parameters?: Readonly<Record<string, unknown>>;
}