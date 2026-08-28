/**
 * Describes a microfrontend associated with an application
 * in the XTEIN platform.
 *
 * Remote information is provided by the existing backend response
 * and originates from the XTEIN database configuration.
 */
export interface RemoteDescriptor {

  /**
   * Unique microfrontend identifier stored in XTEIN.
   *
   * Example:
   * MFE-MAD
   */
  microfrontendId: string;

  /**
   * Descriptive microfrontend name.
   */
  name: string;

  /**
   * Technical remote name used by the federation runtime.
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
   * URL used to load the microfrontend remote entry.
   */
  remoteEntryUrl: string;

  /**
   * Optional deployed microfrontend version.
   */
  version?: string;

  /**
   * Indicates whether the microfrontend is available for loading.
   */
  enabled: boolean;
}