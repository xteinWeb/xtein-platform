/**
 * Represents a request to generate a password recovery code.
 */
export interface PasswordCodeRequest {

  /**
   * XTEIN user identifier.
   */
  userId: string;
}