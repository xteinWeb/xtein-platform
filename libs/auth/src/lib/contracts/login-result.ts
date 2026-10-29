/**
 * Represents the result of an XTEIN authentication attempt.
 */
export interface LoginResult {

  /**
   * Indicates whether authentication succeeded.
   */
  isAuthenticated: boolean;

  /**
   * Optional authentication error message.
   */
  errorMessage?: string;

  /**
   * Seconds until a new attempt is allowed, when too many
   * wrong passwords locked the login.
   */
  retryAfterSeconds?: number;
}