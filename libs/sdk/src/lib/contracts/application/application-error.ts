/**
 * Defines the error codes that can occur while resolving or loading
 * an application in the XTEIN platform.
 */
export type ApplicationErrorCode =
  | 'INVALID_APPLICATION_ID'
  | 'REMOTE_NOT_FOUND'
  | 'APPLICATION_NOT_FOUND'
  | 'APPLICATION_DISABLED'
  | 'APPLICATION_LOAD_FAILED';


/**
 * Represents a controlled application error in the XTEIN platform.
 *
 * Application errors must be handled by the platform without interrupting
 * the execution of the Shell or other opened applications.
 */
export interface ApplicationError {

  /**
   * Error classification used by the platform to determine how the
   * error should be handled and presented to the user.
   */
  code: ApplicationErrorCode;

  /**
   * Application identifier associated with the error.
   *
   * Example:
   * MAD-005
   */
  applicationId: string;

  /**
   * Human-readable technical description of the error.
   *
   * This value is intended primarily for diagnostics and logging.
   */
  message: string;

  /**
   * Optional microfrontend name associated with the error.
   *
   * Example:
   * mfe-mad
   */
  remoteName?: string;

  /**
   * Original error received while loading the application, when available.
   *
   * The unknown type is intentionally used to avoid coupling the SDK
   * to a specific error implementation.
   */
  cause?: unknown;
}