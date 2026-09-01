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
  RecordToolbarPermissions
} from '@xtein/sdk';

import {
  RecordToolbarBackend
} from '../constants/record-toolbar-backend.constants';

import {
  LegacyRecordToolbarPermissionsRequest
} from '../contracts/legacy-record-toolbar-permissions.contract';

import {
  RecordToolbarPermissionsMapperService
} from '../mappers/record-toolbar-permissions-mapper.service';


/**
 * Loads the toolbar permissions granted to the current user
 * for an XTEIN application.
 *
 * Permission retrieval is centralized in the runtime layer so
 * individual applications do not depend on the existing backend
 * permission contract.
 */
@Injectable({
  providedIn: 'root'
})
export class RecordToolbarPermissionsService {

  constructor(
    private readonly apiClient:
      XteinApiClientService,

    private readonly sessionService:
      SessionService,

    private readonly permissionsMapper:
      RecordToolbarPermissionsMapperService
  ) {
  }


  /**
   * Loads the permissions of the authenticated user for
   * the requested XTEIN application.
   *
   * @param applicationId XTEIN application identifier.
   * @returns Standard record-toolbar permissions.
   */
  getPermissions(
    applicationId:
      string
  ): Observable<
    RecordToolbarPermissions
  > {

    const normalizedApplicationId =
      this.normalizeApplicationId(
        applicationId
      );

    const session =
      this.sessionService.current;

    if (!session) {

      return throwError(
        () =>
          new Error(
            'An authenticated XTEIN session is required to load record-toolbar permissions.'
          )
      );
    }


    const requestData:
      LegacyRecordToolbarPermissionsRequest = {

        usuario:
          session.userId,

        aplicacion:
          normalizedApplicationId
      };


    return this.apiClient
      .execute<
        XteinDataApiResponse<string>
      >({

        endpoint:
          RecordToolbarBackend
            .PermissionsEndpoint,

        action:
          RecordToolbarBackend
            .PermissionsAction,

        data:
          requestData,

        accessMode:
          XteinApiAccessMode.Authenticated
      })
      .pipe(

        map(response =>
          this.permissionsMapper
            .mapResponse(
              response.data
            )
        )
      );
  }


  /**
   * Normalizes an application identifier before sending it
   * to the existing backend.
   *
   * @param applicationId Application identifier.
   * @returns Normalized XTEIN application identifier.
   */
  private normalizeApplicationId(
    applicationId:
      string
  ): string {

    const normalizedApplicationId =
      applicationId
        ?.trim()
        .toUpperCase();

    if (!normalizedApplicationId) {

      throw new Error(
        'The XTEIN application identifier cannot be empty when loading toolbar permissions.'
      );
    }

    return normalizedApplicationId;
  }
}