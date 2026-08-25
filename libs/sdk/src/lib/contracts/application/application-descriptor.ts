/**
 * Describes an application discovered and available in the XTEIN platform.
 *
 * The descriptor contains only the information required by the platform
 * runtime to locate and load the application.
 */
export interface ApplicationDescriptor {

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
   * Name of the microfrontend that owns the application.
   *
   * Examples:
   * mfe-mad
   * mfe-inv
   * mfe-adm
   */
  remoteName: string;

  /**
   * Module exposed by the microfrontend and loaded by the platform runtime.
   *
   * The initial XTEIN convention will use a common application host
   * exposed by each microfrontend.
   *
   * Example:
   * ./ApplicationHost
   */
  exposedModule: string;

  /**
   * Indicates whether the application is currently available for loading.
   */
  enabled: boolean;
}