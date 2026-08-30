/**
 * Represents the result of changing an XTEIN password.
 */
export interface PasswordChangeResult {

  /**
   * Indicates whether the password was updated successfully.
   */
  isSuccessful: boolean;

  /**
   * Optional error message.
   */
  errorMessage?: string;
}