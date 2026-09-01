/**
 * Defines the record-toolbar operations supported by an
 * XTEIN application.
 *
 * Capabilities describe application functionality.
 * They do not represent user permissions.
 */
export interface RecordToolbarCapabilities {

  /**
   * Application supports record creation.
   */
  create:
    boolean;

  /**
   * Application supports record editing.
   */
  edit:
    boolean;

  /**
   * Application supports record deletion.
   */
  delete:
    boolean;

  /**
   * Application supports record search.
   */
  search:
    boolean;

  /**
   * Application supports data refresh.
   */
  refresh:
    boolean;

  /**
   * Application supports copying the current record.
   */
  copy:
    boolean;

  /**
   * Application supports opening a record in view mode.
   */
  view:
    boolean;

  /**
   * Application supports record navigation.
   */
  navigation:
    boolean;

  /**
   * Application supports listing or printing information.
   */
  print:
    boolean;

  /**
   * Application supports configuration.
   */
  configure:
    boolean;
}