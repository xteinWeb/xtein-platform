/**
 * Represents a password change request.
 */
export interface PasswordChangeRequest {

  /**
   * XTEIN user identifier.
   */
  userId: string;

  /**
   * New password.
   */
  newPassword: string;
}