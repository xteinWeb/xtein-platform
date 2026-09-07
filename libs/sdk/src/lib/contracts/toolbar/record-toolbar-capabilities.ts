/**
 * Defines which record-toolbar features are implemented
 * by an application.
 *
 * Permissions answer:
 *
 * "Can this user execute the operation?"
 *
 * Capabilities answer:
 *
 * "Does this application implement the operation?"
 */
export interface RecordToolbarCapabilities {

  /**
   * Application supports creating records.
   */
  create:
    boolean;


  /**
   * Application supports editing records.
   */
  edit:
    boolean;


  /**
   * Application supports deleting records.
   */
  delete:
    boolean;


  /**
   * Application supports searching.
   */
  search:
    boolean;


  /**
   * Application supports refreshing its information.
   */
  refresh:
    boolean;


  /**
   * Application supports copying the current record.
   */
  copy:
    boolean;


  /**
   * Application supports quick record view.
   */
  view:
    boolean;


  /**
   * Application supports sorting.
   */
  sort:
    boolean;


  /**
   * Application supports record navigation.
   */
  navigation:
    boolean;


  /**
   * Application supports downloading information.
   */
  download:
    boolean;


  /**
   * Application supports printing/reporting.
   */
  print:
    boolean;


  /**
   * Application supports configuration options.
   */
  configure:
    boolean;
}


/**
 * Standard capabilities used when an application does
 * not explicitly restrict individual toolbar features.
 */
export const DefaultRecordToolbarCapabilities:
  Readonly<RecordToolbarCapabilities> = {

    create:
      true,

    edit:
      true,

    delete:
      true,

    search:
      true,

    refresh:
      true,

    copy:
      true,

    view:
      true,

    sort:
      true,

    navigation:
      true,

    download:
      true,

    print:
      true,

    configure:
      true
  };