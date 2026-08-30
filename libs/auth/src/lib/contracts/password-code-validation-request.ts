/**
 * Represents a password recovery code validation request.
 */
export interface PasswordCodeValidationRequest {

  /**
   * XTEIN user identifier.
   */
  userId: string;

  /**
   * Six-digit recovery code.
   */
  code: string;
}