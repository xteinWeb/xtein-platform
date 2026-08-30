/**
 * Represents the information required to authenticate an XTEIN user.
 */
export interface LoginRequest {

  /**
   * XTEIN user identifier.
   */
  userId: string;

  /**
   * User password.
   */
  password: string;

  /**
   * Selected company identifier.
   */
  companyId: string;

  /**
   * Selected company display name.
   */
  companyName: string;

  /**
   * Organizational unit associated with the user.
   */
  associatedUnitId: string;
}