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
  Mad001Action,
  Mad001Endpoint,
  Mad001ParentApplicationType
} from '../constants/mad-001.constants';


/**
 * Provides the existing backend operations required by MAD-001.
 *
 * Authentication, session data and legacy request-envelope
 * construction remain delegated to XteinApiClientService.
 */
@Injectable()
export class Mad001Service {

  constructor(
    private readonly apiClient:
      XteinApiClientService
  ) {
  }


  /**
   * Executes a MAD-001 query.
   */
  query(
    action:
      string,

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
          Mad001Endpoint.Query,

        action,

        data,

        accessMode:
          XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Loads MAD-001 lookup lists.
   */
  getDataLists():
    Observable<
      XteinDataApiResponse<string>
    > {

    return this.query(
      Mad001Action.DataLists,
      {}
    );
  }


  /**
   * Loads applications that can act as parent modules.
   */
  getParentApplications():
    Observable<
      XteinDataApiResponse<string>
    > {

    return this.query(
      Mad001Action.ParentApplications,
      {
        TIPO:
          Mad001ParentApplicationType
      }
    );
  }


  /**
   * Loads the complete application hierarchy.
   */
  getApplicationTree():
    Observable<
      XteinDataApiResponse<string>
    > {

    return this.query(
      Mad001Action.ApplicationTree,
      {}
    );
  }


  /**
   * Validates an application identifier.
   */
  validateKey(
    applicationId:
      string
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.query(
      Mad001Action.Exists,
      {
        ID_APLICACION:
          applicationId
      }
    );
  }


  /**
   * Creates an application.
   */
  create(
    data:
      unknown
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.save(
      Mad001Action.New,
      data
    );
  }


  /**
   * Updates an application.
   */
  update(
    data:
      unknown
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.save(
      Mad001Action.Update,
      data
    );
  }


  /**
   * Deletes an application.
   */
  delete(
    applicationId:
      string
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.apiClient
      .execute<
        XteinDataApiResponse<string>
      >({

        endpoint:
          Mad001Endpoint.Delete,

        action:
          Mad001Action.Delete,

        data: {
          ID_APLICACION:
            applicationId
        },

        accessMode:
          XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Executes an existing MAD-001 save operation.
   */
  private save(
    action:
      typeof Mad001Action.New |
      typeof Mad001Action.Update,

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
          Mad001Endpoint.Save,

        action,

        data,

        accessMode:
          XteinApiAccessMode.Authenticated
      });
  }
}