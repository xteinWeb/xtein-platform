/**
 * Represents the response envelope returned by the existing
 * XTEIN Node.js backend.
 */
export interface XteinApiResponse {

  /**
   * Backend operation result.
   *
   * Depending on the existing endpoint, this value can be a JSON string
   * or an already serialized value.
   */
  data: unknown;

  /**
   * Optional refreshed authentication token returned by the backend.
   */
  token?: string;
}