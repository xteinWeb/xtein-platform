/**
 * Base response returned by the existing XTEIN backend.
 *
 * Different backend endpoints can return additional properties.
 */
export interface XteinApiResponse {

  /**
   * Optional refreshed authentication token.
   */
  token?: string;

  /**
   * Allows endpoint-specific response properties.
   */
  [key: string]: unknown;
}

/**
 * Represents the common XTEIN response shape used by endpoints
 * that return their functional result inside the data property.
 */
export interface XteinDataApiResponse<TData = unknown>
  extends XteinApiResponse {

  /**
   * Functional backend result.
   */
  data: TData;
}