import {
  ToolbarAction
} from './toolbar-action';

import {
  RecordToolbarMode
} from './record-toolbar-mode';


/**
 * Defines the visual and interaction state of one
 * toolbar action.
 */
export interface ToolbarActionState {

  /**
   * Indicates whether the action is rendered.
   */
  visible:
    boolean;


  /**
   * Indicates whether the action can currently
   * be executed.
   */
  enabled:
    boolean;
}


/**
 * Defines the record information associated with
 * one application's toolbar state.
 */
export interface RecordToolbarState {

  /**
   * Current functional mode.
   */
  mode:
    RecordToolbarMode;


  /**
   * Zero-based index of the current record.
   *
   * Zero is also used when the application does not
   * currently expose records.
   */
  currentIndex:
    number;


  /**
   * Total number of available records.
   */
  totalRecords:
    number;
}


/**
 * Represents the complete toolbar state published by
 * one XTEIN application.
 *
 * ToolbarRuntimeService stores this state independently
 * for every opened application.
 */
export interface ToolbarState {

  /**
   * Application that owns this state.
   *
   * Example:
   * MAD-005
   */
  applicationId:
    string;


  /**
   * Current state of all toolbar actions.
   */
  actions:
    Partial<
      Record<
        ToolbarAction,
        ToolbarActionState
      >
    >;


  /**
   * Current application record/mode state.
   */
  record:
    RecordToolbarState;


  /**
   * Indicates whether the application currently contains
   * unsaved modifications.
   */
  dirty?:
    boolean;
}