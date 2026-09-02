import {
  RemoteDescriptor
} from '../remote/remote-descriptor';


/**
 * Represents an application or navigation node returned by
 * the XTEIN application tree.
 *
 * This is the internal platform representation and is intentionally
 * independent from the backend JSON property names.
 */
export interface ApplicationTreeNode {

  /**
   * Unique XTEIN application identifier.
   *
   * Examples:
   * MAD
   * MAD-005
   */
  applicationId:
    string;


  /**
   * Parent application or module identifier.
   *
   * Root modules use XTEIN as their logical parent.
   */
  parentApplicationId?:
    string;


  /**
   * Display name shown in the application tree.
   */
  name:
    string;


  /**
   * Application node type.
   *
   * Examples:
   * modulo
   * aplicacion
   * dashboard
   */
  type:
    string;


  /**
   * Current application status.
   */
  status:
    string;


  /**
   * Optional icon configured for the application.
   *
   * The presentation layer must provide a default icon
   * when this value is empty or unavailable.
   */
  icon?:
    string;


  /**
   * Indicates whether this application must be opened
   * automatically when the XTEIN Shell is initialized.
   *
   * The value originates from APLICACIONES_ASOCIADAS.DEFECTO.
   */
  openByDefault:
    boolean;


  /**
   * Optional application table configuration.
   */
  tableApplication?:
    string;


  /**
   * Optional program configuration associated with the application.
   */
  program?:
    string;


  /**
   * Optional serialized parameters associated with the application.
   */
  parameters?:
    string;


  /**
   * Optional application comments.
   */
  comments?:
    string;


  /**
   * Optional action associated with the application.
   */
  action?:
    string;


  /**
   * Optional lower target value.
   */
  lowerTarget?:
    number;


  /**
   * Optional upper target value.
   */
  upperTarget?:
    number;


  /**
   * Optional system type.
   */
  systemType?:
    string;


  /**
   * Optional unit of measure.
   */
  unitOfMeasure?:
    string;


  /**
   * Optional application level.
   */
  level?:
    string;


  /**
   * Microfrontend configuration associated with the application.
   *
   * This value is undefined for modules and for applications
   * that have not yet been migrated to the microfrontend architecture.
   */
  remote?:
    RemoteDescriptor;
}