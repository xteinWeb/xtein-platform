/**
 * Represents the result of validating a password
 * against the XTEIN password policy.
 */
export interface PasswordPolicyResult {

  /**
   * Indicates whether the password satisfies every rule.
   */
  isValid: boolean;

  /**
   * Individual password policy violations.
   */
  errors: readonly string[];

  /**
   * User-facing validation message.
   */
  message: string;
}