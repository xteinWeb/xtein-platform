/**
 * Represents one application opened in the XTEIN workspace.
 *
 * An XTEIN application can have at most one open workspace tab.
 * The applicationId is therefore the unique workspace tab identifier.
 *
 * The workspace tab does not reference Angular component types directly.
 * Application rendering is delegated to the platform runtime.
 */
export interface WorkspaceTab {

  /**
   * Unique XTEIN application identifier.
   *
   * This value also uniquely identifies the workspace tab because
   * an application can only be opened once in the workspace.
   *
   * Example:
   * MAD-005
   */
  applicationId:
    string;

  /**
   * Display title shown in the workspace tab header.
   */
  title:
    string;

  /**
   * Optional icon identifier displayed by the workspace.
   */
  icon?:
    string;

  /**
   * Name of the microfrontend that owns the application.
   *
   * Example:
   * mfe-mad
   */
  remoteName:
    string;

  /**
   * Module exposed by the microfrontend.
   *
   * Example:
   * ./ApplicationHost
   */
  exposedModule:
    string;

  /**
   * URL used to load the microfrontend remote entry.
   *
   * Example:
   * http://localhost:4201/remoteEntry.json
   */
  remoteEntryUrl:
    string;

  /**
   * Optional deployed microfrontend version.
   */
  version?:
    string;

  /**
   * Indicates whether the tab can be closed by the user.
   */
  closable:
    boolean;

  /**
   * Indicates whether this is the currently active workspace tab.
   */
  active:
    boolean;

  /**
   * Indicates whether the application contains unsaved changes.
   *
   * The workspace uses this state to prevent accidental data loss
   * when closing an application.
   */
  dirty:
    boolean;

  /**
   * Optional parameters passed when the application was opened.
   */
  parameters?:
    Readonly<
      Record<
        string,
        unknown
      >
    >;
}