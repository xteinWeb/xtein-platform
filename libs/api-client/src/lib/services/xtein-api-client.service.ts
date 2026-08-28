import {
  Inject,
  Injectable
} from '@angular/core';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import {
  Observable,
  catchError,
  map,
  throwError
} from 'rxjs';

import {
  XTEIN_API_CONFIG,
  XteinApiConfig
} from '../configuration/xtein-api-config';

import { XteinApiRequest } from '../contracts/xtein-api-request';
import { XteinApiResponse } from '../contracts/xtein-api-response';

/**
 * Central API client used to communicate with the existing
 * XTEIN Node.js backend.
 *
 * This service preserves the backend request and response protocol
 * while exposing a cleaner API to the new XTEIN platform.
 */
@Injectable({
  providedIn: 'root'
})
export class XteinApiClientService {

  /**
   * Existing local storage key used by XTEIN for the current user.
   */
  private static readonly userStorageKey = 'usuario';

  /**
   * Existing local storage key used by XTEIN for the current company.
   */
  private static readonly companyStorageKey = 'empresa';

  /**
   * Existing local storage key used by XTEIN for the authentication token.
   */
  private static readonly tokenStorageKey = 'token';

  constructor(
    private readonly httpClient: HttpClient,
    @Inject(XTEIN_API_CONFIG)
    private readonly apiConfig: XteinApiConfig
  ) {
  }

  /**
   * Executes a request against the existing XTEIN backend.
   *
   * The method:
   * - builds the legacy backend request envelope;
   * - sends the HTTP POST request;
   * - updates the authentication token when returned;
   * - parses the backend data payload;
   * - returns only the functional result to the caller.
   *
   * @param request XTEIN API request.
   * @returns Parsed backend operation result.
   */
  execute<T>(
    request: XteinApiRequest
  ): Observable<T> {

    const url =
      this.buildUrl(request.endpoint);

    const body =
      this.buildRequestBody(request);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.httpClient
      .post<XteinApiResponse>(
        url,
        body,
        {
          headers
        }
      )
      .pipe(
        map(response => {

          this.updateAuthenticationToken(
            response.token
          );

          return this.parseResponseData<T>(
            response.data
          );
        }),

        catchError(error =>
          throwError(() => error)
        )
      );
  }

  /**
   * Builds the request body expected by the existing Node.js backend.
   *
   * The property names used here belong to the existing backend contract
   * and must remain unchanged for compatibility.
   *
   * @param request Internal XTEIN API request.
   * @returns Serialized backend request body.
   */
  private buildRequestBody(
    request: XteinApiRequest
  ): string {

    const company =
      localStorage.getItem(
        XteinApiClientService.companyStorageKey
      );

    const user =
      localStorage.getItem(
        XteinApiClientService.userStorageKey
      );

    const token =
      localStorage.getItem(
        XteinApiClientService.tokenStorageKey
      );

    const backendRequest = {
      prmAccion: request.action,

      prmDatos:
        JSON.stringify(request.data),

      prmConexion: {
        EMPRESA: company
      },

      prmTokenDatos: {
        USUARIO: user,
        EMPRESA: company,
        TOKEN: token
      }
    };

    return JSON.stringify(backendRequest);
  }

  /**
   * Builds the complete backend URL.
   *
   * @param endpoint Relative backend endpoint.
   * @returns Complete backend URL.
   */
  private buildUrl(
    endpoint: string
  ): string {

    const baseUrl =
      this.apiConfig.baseUrl.trim().replace(/\/+$/, '');

    const normalizedEndpoint =
      endpoint.trim().startsWith('/')
        ? endpoint.trim()
        : `/${endpoint.trim()}`;

    if (!normalizedEndpoint || normalizedEndpoint === '/') {
      throw new Error(
        'The XTEIN API endpoint cannot be empty.'
      );
    }

    return `${baseUrl}${normalizedEndpoint}`;
  }

  /**
   * Updates the authentication token when the backend returns
   * a refreshed token.
   *
   * @param token Refreshed authentication token.
   */
  private updateAuthenticationToken(
    token?: string
  ): void {

    if (!token) {
      return;
    }

    localStorage.setItem(
      XteinApiClientService.tokenStorageKey,
      token
    );
  }

  /**
   * Parses the data value returned by the existing backend.
   *
   * The existing backend commonly returns JSON serialized inside
   * the data property. Non-string values are returned directly.
   *
   * @param data Backend data payload.
   * @returns Parsed operation result.
   */
  private parseResponseData<T>(
    data: unknown
  ): T {

    if (typeof data !== 'string') {
      return data as T;
    }

    const normalizedData =
      data.trim();

    if (!normalizedData) {
      return data as T;
    }

    try {
      return JSON.parse(normalizedData) as T;
    } catch {
      return data as T;
    }
  }
}