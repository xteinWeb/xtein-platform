import {
  Injectable
} from '@angular/core';

import {
  Observable
} from 'rxjs';

import {
  XteinApiAccessMode,
  XteinApiClientService,
  XteinDataApiResponse
} from '@xtein/api-client';

import {
  Mad005Action,
  Mad005Application,
  Mad005Endpoint
} from '../constants/mad-005.constants';


/**
 * Provides backend operations required by MAD-005.
 *
 * Transport, authentication, company context, token handling,
 * and legacy request-envelope construction are delegated to
 * XteinApiClientService.
 */
@Injectable({
  providedIn: 'root'
})
export class Mad005Service {

  /**
   * Returns the XTEIN application identifier represented
   * by this service.
   *
   * @returns MAD-005 application identifier.
   */
  getApplicationId():
    string {

    return Mad005Application.Id;
  }


  constructor(
    private readonly apiClient:
      XteinApiClientService
  ) {
  }


  /**
   * Executes a MAD-005 query operation.
   *
   * @param action Existing MAD-005 backend action.
   * @param data Functional request data.
   * @returns Existing XTEIN backend response.
   */
  query(
    action:
      Mad005Action,

    data:
      unknown
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.apiClient
      .execute<
        XteinDataApiResponse<string>
      >({
        endpoint:
          Mad005Endpoint.Query,

        action,

        data,

        accessMode:
          XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Saves a MAD-005 data source configuration.
   *
   * @param action Save action.
   * @param data Functional request data.
   * @returns Existing XTEIN backend response.
   */
  save(
    action:
      typeof Mad005Action.New |
      typeof Mad005Action.Update,

    data:
      unknown
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.apiClient
      .execute<
        XteinDataApiResponse<string>
      >({
        endpoint:
          Mad005Endpoint.Save,

        action,

        data,

        accessMode:
          XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Deletes a MAD-005 data source configuration.
   *
   * @param data Functional request data.
   * @returns Existing XTEIN backend response.
   */
  delete(
    data:
      unknown
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.apiClient
      .execute<
        XteinDataApiResponse<string>
      >({
        endpoint:
          Mad005Endpoint.Delete,

        action:
          Mad005Action.Delete,

        data,

        accessMode:
          XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Validates whether a data source configuration key
   * already exists.
   *
   * @param data Key values to validate.
   * @returns Existing XTEIN backend response.
   */
  validateKey(
    data:
      unknown
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.query(
      Mad005Action.Exists,
      data
    );
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

    return this.query(
      Mad005Action.DataLists,
      {}
    );
  }


  /**
   * Loads MAD-005 records.
   *
   * @param data Query parameters.
   * @returns Existing XTEIN backend response.
   */
  getRecords(
    data:
      unknown = {}
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.query(
      Mad005Action.Query,
      data
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
    dataSourceId:
      number
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.query(
      Mad005Action.ValidateDefault,
      {
        ID_ORIGEN_DATO:
          dataSourceId
      }
    );
  }


  /**
   * Creates a new data source configuration.
   *
   * @param data Configuration data.
   * @returns Existing XTEIN backend response.
   */
  create(
    data:
      unknown
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.save(
      Mad005Action.New,
      data
    );
  }


  /**
   * Updates an existing data source configuration.
   *
   * @param data Configuration data.
   * @returns Existing XTEIN backend response.
   */
  update(
    data:
      unknown
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.save(
      Mad005Action.Update,
      data
    );
  }
}