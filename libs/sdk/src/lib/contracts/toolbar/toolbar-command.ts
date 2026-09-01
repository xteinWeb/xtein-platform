import {
  ToolbarAction
} from './toolbar-action';


/**
 * Represents a toolbar action dispatched to one specific
 * XTEIN workspace application.
 *
 * Because each application can only have one open workspace tab,
 * applicationId uniquely identifies the command destination.
 */
export interface ToolbarCommand<TPayload = unknown> {

  /**
   * Application that must receive the command.
   *
   * Example:
   * MAD-005
   */
  applicationId:
    string;

  /**
   * Toolbar action requested by the user.
   */
  action:
    ToolbarAction;

  /**
   * Optional action-specific information.
   *
   * Most standard record-toolbar actions do not require a payload,
   * but the contract allows future actions to provide additional data
   * without changing the command infrastructure.
   */
  payload?:
    TPayload;
}