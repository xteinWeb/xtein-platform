import { RemoteDescriptor } from '../remote/remote-descriptor';

/**
 * Represents an application or navigation node returned by
 * the XTEIN application tree.
 *
 * This is the internal platform representation and is intentionally
 * independent from the legacy JSON property names returned by the backend.
 */
export interface ApplicationTreeNode {

  /**
   * Unique XTEIN application identifier.
   *
   * Example:
   * MAD-005
   */
  applicationId: string;

  /**
   * Parent application or module identifier.
   *
   * Example:
   * MAD
   */
  parentApplicationId?: string;

  /**
   * Display name shown in the application tree.
   */
  name: string;

  /**
   * Application node type.
   *
   * Examples:
   * APLICACION
   * DASHBOARD
   * KPI
   * MODULO
   */
  type: string;

  /**
   * Optional application comments.
   */
  comments?: string;

  /**
   * Current application status returned by XTEIN.
   */
  status: string;

  /**
   * Optional action associated with the application.
   */
  action?: string;

  /**
   * Optional lower target value.
   */
  lowerTarget?: number;

  /**
   * Optional upper target value.
   */
  upperTarget?: number;

  /**
   * Optional system type.
   */
  systemType?: string;

  /**
   * Optional unit of measure.
   */
  unitOfMeasure?: string;

  /**
   * Optional application level.
   */
  level?: string;

  /**
   * Microfrontend configuration associated with the application.
   *
   * This value is undefined for applications that have not yet
   * been migrated to the microfrontend architecture.
   */
  remote?: RemoteDescriptor;
}