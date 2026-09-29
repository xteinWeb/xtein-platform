/**
 * Represents one application configuration option returned
 * by the XTEIN backend or provided by an application.
 */
export interface XteinApplicationSetting {
  /**
   * Option display title or operation name.
   */
  VALOR?: string;

  /**
   * Text alias for display title.
   */
  text?: string;

  /**
   * Icon class (e.g. 'icon-configurar-ol').
   */
  FUENTE?: string;

  /**
   * Icon class alias.
   */
  icon?: string;

  /**
   * JSON configuration string or object.
   */
  CONFIG?: string | Record<string, unknown>;

  /**
   * Action code or identifier.
   */
  ACCION?: string;

  /**
   * Raw or additional payload data.
   */
  data?: unknown;

  [key: string]: unknown;
}
