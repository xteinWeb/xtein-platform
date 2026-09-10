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
  __APPLICATION_CLASS_PREFIX__Action,
  __APPLICATION_CLASS_PREFIX__Application,
  __APPLICATION_CLASS_PREFIX__Endpoint
} from '../constants/__APPLICATION_FILE_PREFIX__.constants';


/**
 * Provides backend operations required by __APPLICATION_ID__.
 *
 * Transport, authentication, company context and token handling are
 * delegated to XteinApiClientService.
 */
@Injectable()
export class __APPLICATION_CLASS_PREFIX__Service {

  constructor(
    private readonly apiClient:
      XteinApiClientService
  ) {
  }


  /**
   * Returns the XTEIN application identifier represented by this
   * service.
   */
  getApplicationId():
    string {

    return __APPLICATION_CLASS_PREFIX__Application.Id;
  }


  /**
   * Executes a query operation.
   */
  query(
    action:
      __APPLICATION_CLASS_PREFIX__Action,

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
          __APPLICATION_CLASS_PREFIX__Endpoint.Query,

        action,

        data,

        accessMode:
          XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Loads application data lists when the backend contract exposes
   * the standard datalists action.
   */
  getDataLists():
    Observable<
      XteinDataApiResponse<string>
    > {

    return this.query(
      __APPLICATION_CLASS_PREFIX__Action.DataLists,
      {}
    );
  }


  /**
   * Loads application records.
   */
  getRecords(
    data:
      unknown = {}
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.query(
      __APPLICATION_CLASS_PREFIX__Action.Query,
      data
    );
  }


  /**
   * Validates whether a record key already exists.
   */
  validateKey(
    data:
      unknown
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.query(
      __APPLICATION_CLASS_PREFIX__Action.Exists,
      data
    );
  }


  /**
   * Creates a new record.
   */
  create(
    data:
      unknown
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.save(
      __APPLICATION_CLASS_PREFIX__Action.New,
      data
    );
  }


  /**
   * Updates an existing record.
   */
  update(
    data:
      unknown
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.save(
      __APPLICATION_CLASS_PREFIX__Action.Update,
      data
    );
  }


  /**
   * Deletes an existing record.
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
          __APPLICATION_CLASS_PREFIX__Endpoint.Delete,

        action:
          __APPLICATION_CLASS_PREFIX__Action.Delete,

        data,

        accessMode:
          XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Executes a create or update operation.
   */
  private save(
    action:
      typeof __APPLICATION_CLASS_PREFIX__Action.New |
      typeof __APPLICATION_CLASS_PREFIX__Action.Update,

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
          __APPLICATION_CLASS_PREFIX__Endpoint.Save,

        action,

        data,

        accessMode:
          XteinApiAccessMode.Authenticated
      });
  }
}
