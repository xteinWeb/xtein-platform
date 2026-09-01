import {
  Injectable
} from '@angular/core';

import {
  Observable,
  map,
  throwError
} from 'rxjs';

import {
  XteinApiAccessMode,
  XteinApiClientService,
  XteinDataApiResponse
} from '@xtein/api-client';

import {
  SessionService
} from '@xtein/session';

import {
  ApplicationTreeNode
} from '@xtein/sdk';

import {
  ApplicationTreeMapperService
} from '@xtein/runtime';

/**
 * Provides application-tree communication with
 * the existing XTEIN Node.js backend.
 *
 * Backend endpoint and action details are isolated inside this service.
 * Backend response mapping is delegated to the platform runtime.
 */
@Injectable({
  providedIn: 'root'
})
export class ApplicationTreeApiService {

  /**
   * Existing backend endpoint used to retrieve
   * the applications available to the authenticated user.
   */
  private static readonly endpoint =
    '/home';

  /**
   * Existing backend action used to retrieve
   * the authenticated user's application tree.
   */
  private static readonly action =
    'USUARIO APLICACIONES';

  constructor(
    private readonly apiClient:
      XteinApiClientService,

    private readonly sessionService:
      SessionService,

    private readonly applicationTreeMapper:
      ApplicationTreeMapperService
  ) {
  }

  /**
   * Loads the application tree for the current authenticated user.
   *
   * Authentication envelope information is handled automatically
   * by XteinApiClientService.
   *
   * Backend-specific response fields are converted to the normalized
   * XTEIN platform model by ApplicationTreeMapperService.
   *
   * @returns Normalized application-tree nodes.
   */
  load(): Observable<ApplicationTreeNode[]> {

    const session =
      this.sessionService.current;

    if (!session) {

      return throwError(
        () =>
          new Error(
            'An authenticated XTEIN session is required to load the application tree.'
          )
      );
    }

    return this.apiClient
      .execute<
        XteinDataApiResponse<unknown>
      >({
        endpoint:
          ApplicationTreeApiService.endpoint,

        action:
          ApplicationTreeApiService.action,

        data: {
          USUARIO:
            session.userId,

          EMPRESA:
            session.companyId
        },

        accessMode:
           XteinApiAccessMode.Authenticated
      })
      .pipe(
        map(response => {

          const items =
            this.applicationTreeMapper
              .mapResponse(
                response.data
              );

          /*
           * DevExtreme TreeView expects a mutable array.
           * The mapper intentionally exposes a readonly collection,
           * so the Shell receives its own array instance.
           */
          return [
            ...items
          ];

        })
      );
  }
}