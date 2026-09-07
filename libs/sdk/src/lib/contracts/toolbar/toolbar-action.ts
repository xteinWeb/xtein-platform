/**
 * Defines all standard actions supported by the
 * XTEIN platform record toolbar.
 *
 * Applications communicate with the toolbar through
 * these actions without depending on the Shell UI.
 */
export const ToolbarAction = {

  /**
   * Initializes the toolbar.
   *
   * This is an internal platform action and is not
   * rendered as a visual toolbar button.
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
   * Creates a new record based on the current record.
   */
  Copy:
    'copy',

  /**
   * Saves the current create/edit/copy operation.
   */
  Save:
    'save',

  /**
   * Cancels the current create/edit/copy operation.
   */
  Cancel:
    'cancel',

  /**
   * Deletes the current record.
   */
  Delete:
    'delete',

  /**
   * Opens or executes application search.
   */
  Search:
    'search',

  /**
   * Opens the quick record view.
   */
  View:
    'view',

  /**
   * Executes application sorting.
   */
  Sort:
    'sort',

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
   * Navigates directly to a record number.
   */
  GoTo:
    'go-to',

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
   * Opens print/reporting options.
   */
  Print:
    'print',

  /**
   * Downloads information exposed by the application.
   */
  Download:
    'download',

  /**
   * Reloads application information.
   */
  Refresh:
    'refresh',

  /**
   * Opens application configuration options.
   */
  Configure:
    'configure'

} as const;


/**
 * Represents a valid XTEIN toolbar action.
 */
export type ToolbarAction =
  typeof ToolbarAction[
    keyof typeof ToolbarAction
  ];