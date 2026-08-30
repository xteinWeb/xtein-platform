import { CompanyOption } from './company-option';

/**
 * Represents the result of validating an XTEIN user before login.
 */
export interface UserValidationResult {

  /**
   * Indicates whether the user validation succeeded.
   */
  isValid: boolean;

  /**
   * Optional backend validation message.
   */
  errorMessage?: string;

  /**
   * Organizational unit associated with the user.
   */
  associatedUnitId?: string;

  /**
   * Companies available to the user.
   */
  companies: readonly CompanyOption[];
}