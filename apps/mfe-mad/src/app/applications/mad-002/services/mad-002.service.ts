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
  Mad002Action,
  Mad002Endpoint
} from '../constants/mad-002.constants';


/**
 * Provides the existing backend operations required by MAD-002.
 *
 * Authentication, session, company and token data are delegated
 * to XteinApiClientService.
 */
@Injectable()
export class Mad002Service {

  constructor(
    private readonly apiClient:
      XteinApiClientService
  ) {
  }


  /**
   * Loads the application hierarchy used by MAD-002.
   *
   * @returns Existing backend application-tree response.
   */
  getApplicationTree():
    Observable<
      XteinDataApiResponse<string>
    > {

    return this.apiClient
      .execute<
        XteinDataApiResponse<string>
      >({

        endpoint:
          Mad002Endpoint.Query,

        action:
          Mad002Action.ApplicationTree,

        data:
          {},

        accessMode:
          XteinApiAccessMode.Authenticated
      });
  }
}