/**
 * Represents the result of validating a password recovery code.
 */
export interface PasswordCodeValidationResult {

  /**
   * Indicates whether the recovery code is valid.
   */
  isValid: boolean;

  /**
   * Optional backend error message.
   */
  errorMessage?: string;
}