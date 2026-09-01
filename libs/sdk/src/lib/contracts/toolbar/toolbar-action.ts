/**
 * Defines the standard actions available in the XTEIN platform toolbar.
 *
 * Applications receive these actions through the platform SDK without
 * depending on the Shell toolbar implementation.
 */
export const ToolbarAction = {

  /**
   * Initializes the toolbar for the active application.
   */
  Initialize:
    'initialize',

  /**
   * Creates a new record.
   */
  New:
    'new',

  /**
   * Edits the current record.
   */
  Edit:
    'edit',

  /**
   * Saves the current changes.
   */
  Save:
    'save',

  /**
   * Cancels the current changes.
   */
  Cancel:
    'cancel',

  /**
   * Deletes the current record.
   */
  Delete:
    'delete',

  /**
   * Searches existing records.
   */
  Search:
    'search',

  /**
   * Refreshes application data.
   */
  Refresh:
    'refresh',

  /**
   * Copies the current record.
   */
  Copy:
    'copy',

  /**
   * Opens the current record in view mode.
   */
  View:
    'view',

  /**
   * Opens application configuration.
   */
  Configure:
    'configure',

  /**
   * Navigates to the first record.
   */
  First:
    'first',

  /**
   * Navigates to the previous record.
   */
  Previous:
    'previous',

  /**
   * Navigates to the next record.
   */
  Next:
    'next',

  /**
   * Navigates to the last record.
   */
  Last:
    'last',

  /**
   * Executes the application print or list operation.
   */
  Print:
    'print'

} as const;


/**
 * Represents a valid XTEIN toolbar action.
 */
export type ToolbarAction =
  typeof ToolbarAction[
    keyof typeof ToolbarAction
  ];