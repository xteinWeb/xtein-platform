/**
 * Defines the runtime configuration required by
 * the XTEIN Dashboard infrastructure.
 */
export interface XteinDashboardRuntimeConfig {

  /**
   * Dashboard Designer endpoint.
   *
   * The endpoint can be relative because the XTEIN Shell proxy
   * is responsible for forwarding Dashboard requests to the
   * corresponding backend.
   *
   * Example:
   * /api/dashboard-designer
   */
  designerEndpoint:
    string;
}