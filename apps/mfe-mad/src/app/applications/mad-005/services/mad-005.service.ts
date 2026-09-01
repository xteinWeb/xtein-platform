import {
  Injectable
} from '@angular/core';

import {
  Observable
} from 'rxjs';

import {
  XteinApiClientService,
  XteinDataApiResponse
} from '@xtein/api-client';


/**
 * Provides backend operations required by MAD-005.
 *
 * Transport, authentication, company context, and token refresh
 * are delegated to XteinApiClientService.
 */
@Injectable({
  providedIn: 'root'
})
export class Mad005Service {

  /**
   * XTEIN application identifier.
   */
  private static readonly applicationId =
    'MAD-005';

  /**
   * Backend application identifier.
   *
   * The existing backend exposes MAD-005 under the MAD005 route.
   */
  private static readonly backendApplicationId =
    'MAD005';

  constructor(
    private readonly apiClient:
      XteinApiClientService
  ) {
  }


  /**
   * Executes a MAD-005 query operation.
   *
   * Existing backend actions include:
   * - datalists
   * - consulta
   * - validatedefault
   *
   * @param action Existing backend action.
   * @param data Functional request data.
   * @returns Existing XTEIN backend response.
   */
  consulta(
    action: string,
    data: unknown
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.apiClient
      .execute<
        XteinDataApiResponse<string>
      >({
        endpoint:
          `/${Mad005Service.backendApplicationId}/consulta`,

        action,

        data,

        accessMode:
          'authenticated'
      });
  }


  /**
   * Saves a MAD-005 data source configuration.
   *
   * Existing backend actions are preserved:
   * - new
   * - update
   *
   * @param action Existing backend save action.
   * @param data Functional request data.
   * @returns Existing XTEIN backend response.
   */
  save(
    action: string,
    data: unknown
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.apiClient
      .execute<
        XteinDataApiResponse<string>
      >({
        endpoint:
          `/${Mad005Service.backendApplicationId}/save`,

        action,

        data,

        accessMode:
          'authenticated'
      });
  }


  /**
   * Deletes a MAD-005 data source configuration.
   *
   * @param data Functional request data.
   * @returns Existing XTEIN backend response.
   */
  delete(
    data: unknown
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.apiClient
      .execute<
        XteinDataApiResponse<string>
      >({
        endpoint:
          `/${Mad005Service.backendApplicationId}/delete`,

        action:
          'delete',

        data,

        accessMode:
          'authenticated'
      });
  }


  /**
   * Validates whether a data source key already exists.
   *
   * The existing backend performs this validation through
   * the MAD005/consulta endpoint using the "existe" action.
   *
   * @param data Key values to validate.
   * @returns Existing XTEIN backend response.
   */
  validateKey(
    data: unknown
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.apiClient
      .execute<
        XteinDataApiResponse<string>
      >({
        endpoint:
          `/${Mad005Service.backendApplicationId}/consulta`,

        action:
          'existe',

        data,

        accessMode:
          'authenticated'
      });
  }


  /**
   * Loads the lists required by MAD-005.
   *
   * @returns Existing XTEIN backend response.
   */
  getDataLists():
    Observable<
      XteinDataApiResponse<string>
    > {

    return this.consulta(
      'datalists',
      {}
    );
  }


  /**
   * Validates whether another connection is already configured
   * as the default data source.
   *
   * @param dataSourceId Current data source identifier.
   * @returns Existing XTEIN backend response.
   */
  validateDefault(
    dataSourceId: number
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.consulta(
      'validatedefault',
      {
        ID_ORIGEN_DATO:
          dataSourceId
      }
    );
  }


  /**
   * Returns the XTEIN application identifier represented
   * by this service.
   *
   * @returns MAD-005 application identifier.
   */
  getApplicationId():
    string {

    return Mad005Service
      .applicationId;
  }
}