/**
 * Represents the authenticated XTEIN user session.
 *
 * This contract contains the session information required by the Shell,
 * microfrontends, API client, guards, and shared platform services.
 */
export interface SessionContext {

  /**
   * Authenticated XTEIN user identifier.
   */
  userId: string;

  /**
   * Display name of the authenticated user.
   */
  userName: string;

  /**
   * User email address.
   */
  email: string;

  /**
   * Current company identifier.
   */
  companyId: string;

  /**
   * Current company display name.
   */
  companyName: string;

  /**
   * Associated organizational unit identifier.
   */
  associatedUnitId: string;

  /**
   * Optional user profile image.
   */
  profilePhoto?: string;

  /**
   * Current authentication token.
   */
  token: string;

  /**
   * Session timeout expressed in seconds.
   */
  sessionTimeoutSeconds: number;
}