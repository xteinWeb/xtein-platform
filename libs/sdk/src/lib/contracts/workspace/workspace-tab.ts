/**
 * Represents an application opened as a tab in the XTEIN workspace.
 *
 * The workspace tab does not reference Angular component types directly.
 * Application rendering is delegated to the platform runtime.
 */
export interface WorkspaceTab {

  /**
   * Unique tab identifier inside the workspace.
   *
   * In most cases this value can be derived from the application identifier,
   * but it remains independent to support multiple instances in the future.
   */
  id: string;

  /**
   * Unique application identifier registered in XTEIN.
   *
   * Example:
   * MAD-005
   */
  applicationId: string;

  /**
   * Display title shown in the workspace tab header.
   */
  title: string;

  /**
   * Optional icon identifier displayed by the workspace.
   */
  icon?: string;

  /**
   * Name of the microfrontend that owns the application.
   *
   * Example:
   * mfe-mad
   */
  remoteName: string;

  /**
   * Module exposed by the microfrontend.
   *
   * Example:
   * ./ApplicationHost
   */
  exposedModule: string;

  /**
   * Indicates whether the tab can be closed by the user.
   */
  closable: boolean;

  /**
   * Indicates whether this is the currently active workspace tab.
   */
  active: boolean;

  /**
   * Indicates whether the application contains unsaved changes.
   *
   * This value will later allow the Shell to request confirmation
   * before closing the tab.
   */
  dirty: boolean;

  /**
   * Optional parameters passed to the opened application.
   */
  parameters?: Readonly<Record<string, unknown>>;
}