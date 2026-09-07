import {
  ToolbarAction
} from './toolbar-action';


/**
 * Represents a command emitted by the global XTEIN
 * record toolbar.
 *
 * Commands are routed to the application that owns the
 * active workspace tab.
 */
export interface ToolbarCommand<
  TPayload = unknown
> {

  /**
   * Application that must receive the command.
   *
   * Example:
   * MAD-005
   */
  applicationId:
    string;


  /**
   * Requested toolbar action.
   */
  action:
    ToolbarAction;


  /**
   * Optional action-specific information.
   *
   * Example:
   * GoTo can provide the requested record index.
   */
  payload?:
    TPayload;
}