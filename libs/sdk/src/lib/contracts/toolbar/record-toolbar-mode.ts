/**
 * Defines the functional modes supported by the
 * XTEIN record toolbar.
 *
 * Every opened application maintains its own mode.
 */
export const RecordToolbarMode = {

  /**
   * Application has been initialized but does not yet
   * expose a browsable record collection.
   */
  Initial:
    'initial',

  /**
   * Existing records are available for browsing.
   */
  Browsing:
    'browsing',

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
   * A new record is being created by copying the
   * current record.
   */
  Copying:
    'copying'

} as const;


/**
 * Represents a valid record-toolbar mode.
 */
export type RecordToolbarMode =
  typeof RecordToolbarMode[
    keyof typeof RecordToolbarMode
  ];