/**
 * Defines the functional modes supported by the XTEIN record toolbar.
 *
 * Each application maintains its own toolbar mode independently so the
 * correct state can be restored when the active workspace tab changes.
 */
export const ToolbarMode = {

  /**
   * Initial application state.
   *
   * No record is currently being edited.
   */
  Initial: 'initial',

  /**
   * Existing records are available for browsing and navigation.
   */
  Browsing: 'browsing',

  /**
   * A new record is being created.
   */
  Creating: 'creating',

  /**
   * An existing record is being edited.
   */
  Editing: 'editing',

  /**
   * A new record is being created from an existing record.
   */
  Copying: 'copying'

} as const;

/**
 * Represents a valid XTEIN toolbar mode.
 */
export type ToolbarMode =
  typeof ToolbarMode[keyof typeof ToolbarMode];