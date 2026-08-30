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
  tap,
  throwError
} from 'rxjs';

import {
  SessionService
} from '@xtein/session';

import {
  XTEIN_API_CONFIG,
  XteinApiConfig
} from '../configuration/xtein-api-config';

import {
  XteinApiAccessMode,
  XteinApiRequest
} from '../contracts/xtein-api-request';

/**
 * Central HTTP client used to communicate with the existing
 * XTEIN Node.js backend.
 *
 * The service preserves the existing backend protocol while isolating
 * transport, session, and legacy request-envelope concerns from
 * functional platform services.
 */
@Injectable({
  providedIn: 'root'
})
export class XteinApiClientService {

  /**
   * Existing backend connection identifier used by public requests.
   */
  private static readonly publicConnectionName =
    'ConexionBD';

  constructor(
    private readonly httpClient: HttpClient,

    private readonly sessionService: SessionService,

    @Inject(XTEIN_API_CONFIG)
    private readonly apiConfig: XteinApiConfig
  ) {
  }

  /**
   * Executes a request against the existing XTEIN backend.
   *
   * Public requests use the backend connection identifier directly.
   * Authenticated requests obtain security information exclusively
   * from SessionService.
   *
   * @param request Request to execute.
   * @returns Raw backend response.
   */
  execute<TResponse>(
    request: XteinApiRequest
  ): Observable<TResponse> {

    const url =
      this.buildUrl(request.endpoint);

    const body =
      this.buildRequestBody(request);

    const headers =
      new HttpHeaders({
        'Content-Type': 'application/json'
      });

    return this.httpClient
      .post<TResponse>(
        url,
        body,
        {
          headers
        }
      )
      .pipe(
        tap(response => {
          this.updateAuthenticationToken(
            request.accessMode,
            response
          );
        }),

        catchError(error =>
          throwError(() => error)
        )
      );
  }

  /**
   * Builds the request body expected by the existing backend.
   *
   * @param request Internal XTEIN request.
   * @returns Serialized backend request body.
   */
  private buildRequestBody(
    request: XteinApiRequest
  ): string {

    if (request.accessMode === 'public') {
      return this.buildPublicRequestBody(request);
    }

    return this.buildAuthenticatedRequestBody(request);
  }

  /**
   * Builds a request that does not require an authenticated session.
   *
   * These requests are primarily used by authentication and password
   * recovery operations.
   *
   * @param request Internal XTEIN request.
   * @returns Serialized public backend request.
   */
  private buildPublicRequestBody(
    request: XteinApiRequest
  ): string {

    const backendRequest = {
      prmAccion: request.action,

      prmDatos:
        JSON.stringify(request.data),

      prmConexion:
        XteinApiClientService.publicConnectionName
    };

    return JSON.stringify(backendRequest);
  }

  /**
   * Builds a request using the current authenticated session.
   *
   * @param request Internal XTEIN request.
   * @returns Serialized authenticated backend request.
   * @throws Error when no authenticated session exists.
   */
  private buildAuthenticatedRequestBody(
    request: XteinApiRequest
  ): string {

    const session =
      this.sessionService.current;

    if (!session) {
      throw new Error(
        'An authenticated XTEIN session is required to execute this request.'
      );
    }

    const backendRequest = {
      prmAccion: request.action,

      prmDatos:
        JSON.stringify(request.data),

      prmConexion: {
        EMPRESA: session.companyId
      },

      prmTokenDatos: {
        USUARIO: session.userId,
        EMPRESA: session.companyId,
        TOKEN: session.token
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

    const normalizedBaseUrl =
      this.apiConfig.baseUrl
        .trim()
        .replace(/\/+$/, '');

    const normalizedEndpointValue =
      endpoint.trim();

    if (!normalizedEndpointValue) {
      throw new Error(
        'The XTEIN API endpoint cannot be empty.'
      );
    }

    const normalizedEndpoint =
      normalizedEndpointValue.startsWith('/')
        ? normalizedEndpointValue
        : `/${normalizedEndpointValue}`;

    return `${normalizedBaseUrl}${normalizedEndpoint}`;
  }

  /**
   * Updates the current session when an authenticated backend request
   * returns a refreshed token.
   *
   * Public requests do not update the session automatically because
   * authentication has not yet been established.
   *
   * @param accessMode Request access mode.
   * @param response Backend response.
   */
  private updateAuthenticationToken(
    accessMode: XteinApiAccessMode,
    response: unknown
  ): void {

    if (accessMode !== 'authenticated') {
      return;
    }

    const token =
      this.getResponseToken(response);

    if (!token) {
      return;
    }

    this.sessionService.updateToken(token);
  }

  /**
   * Extracts an authentication token from a backend response.
   *
   * @param response Backend response.
   * @returns Token when available.
   */
  private getResponseToken(
    response: unknown
  ): string | undefined {

    if (
      response === null ||
      typeof response !== 'object' ||
      Array.isArray(response)
    ) {
      return undefined;
    }

    const record =
      response as Record<string, unknown>;

    const token =
      record['token'];

    if (
      typeof token !== 'string' ||
      !token.trim()
    ) {
      return undefined;
    }

    return token.trim();
  }
}