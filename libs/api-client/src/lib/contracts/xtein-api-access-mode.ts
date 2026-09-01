/**
 * Defines the access modes supported by the XTEIN API client.
 *
 * Public requests are executed without an authenticated session.
 * Authenticated requests require the current XTEIN session.
 */
export const XteinApiAccessMode = {

  /**
   * Request executed without an authenticated XTEIN session.
   */
  Public:
    'public',

  /**
   * Request executed using the current authenticated XTEIN session.
   */
  Authenticated:
    'authenticated'

} as const;


/**
 * Represents a valid XTEIN API access mode.
 */
export type XteinApiAccessMode =
  typeof XteinApiAccessMode[
    keyof typeof XteinApiAccessMode
  ];