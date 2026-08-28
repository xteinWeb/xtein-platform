import { ToolbarAction } from './toolbar-action';

/**
 * Defines the visual and interaction state of a toolbar action.
 */
export interface ToolbarActionState {

  /**
   * Indicates whether the toolbar action is visible.
   */
  visible: boolean;

  /**
   * Indicates whether the toolbar action can currently be executed.
   */
  enabled: boolean;
}

/**
 * Represents the toolbar state published by an application.
 *
 * The Shell uses this contract to configure the platform toolbar according
 * to the requirements and current state of the active application.
 */
export interface ToolbarState {

  /**
   * Identifier of the application that owns this toolbar state.
   *
   * Example:
   * MAD-005
   */
  applicationId: string;

  /**
   * Defines the state of each toolbar action supported by the application.
   *
   * Actions not included in this collection are considered unavailable
   * for the current application.
   */
  actions: Partial<Record<ToolbarAction, ToolbarActionState>>;
}