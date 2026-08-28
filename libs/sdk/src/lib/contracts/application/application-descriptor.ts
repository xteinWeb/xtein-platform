/**
 * Describes an application that has been resolved and is ready
 * to be loaded by the XTEIN platform runtime.
 */
export interface ApplicationDescriptor {

  /**
   * Unique XTEIN application identifier.
   *
   * Example:
   * MAD-005
   */
  applicationId: string;

  /**
   * Microfrontend identifier stored in XTEIN.
   *
   * Example:
   * MFE-MAD
   */
  microfrontendId: string;

  /**
   * Federation remote name.
   *
   * Example:
   * mfe-mad
   */
  remoteName: string;

  /**
   * Module exposed by the microfrontend.
   *
   * Example:
   * ./ApplicationHost
   */
  exposedModule: string;

  /**
   * URL used to load the remote entry.
   */
  remoteEntryUrl: string;

  /**
   * Optional deployed microfrontend version.
   */
  version?: string;

  /**
   * Indicates whether the application is available for loading.
   */
  enabled: boolean;
}