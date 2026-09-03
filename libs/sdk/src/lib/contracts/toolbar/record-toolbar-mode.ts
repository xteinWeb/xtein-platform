/**
 * Defines the standard operating modes of an
 * XTEIN record-based application.
 */
export const RecordToolbarMode = {

  /**
   * Initial application state.
   */
  Initial:
    'initial',

  /**
   * A new record is being created.
   */
  Creating:
    'creating',

  /**
   * An existing record is being edited.
   */
  Editing:
    'editing',

  /**
   * The current record is being copied into a new record.
   */
  Copying:
    'copying',

  /**
   * Existing records are being browsed.
   */
  Browsing:
    'browsing'

} as const;


/**
 * Represents a valid record toolbar mode.
 */
export type RecordToolbarMode =
  typeof RecordToolbarMode[
    keyof typeof RecordToolbarMode
  ];