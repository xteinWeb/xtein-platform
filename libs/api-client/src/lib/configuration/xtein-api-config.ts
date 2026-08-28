import { InjectionToken } from '@angular/core';

/**
 * Defines the configuration required to communicate with
 * the existing XTEIN Node.js backend.
 */
export interface XteinApiConfig {

  /**
   * Base URL of the XTEIN backend.
   *
   * Relative endpoint paths are appended to this URL by the API client.
   *
   * Example:
   * http://localhost:3000
   */
  baseUrl: string;
}

/**
 * Injection token used to provide the XTEIN API configuration.
 */
export const XTEIN_API_CONFIG =
  new InjectionToken<XteinApiConfig>(
    'XTEIN_API_CONFIG'
  );