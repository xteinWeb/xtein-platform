/**
 * Represents the result of requesting a password recovery code.
 */
export interface PasswordCodeResult {

  /**
   * Indicates whether the recovery code was generated successfully.
   */
  isSuccessful: boolean;

  /**
   * Email address where the recovery code was sent.
   */
  destinationEmail?: string;

  /**
   * Optional backend error message.
   */
  errorMessage?: string;
}