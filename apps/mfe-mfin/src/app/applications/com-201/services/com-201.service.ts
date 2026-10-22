import { createCom201Log } from '../constants/com-201-logging.constants';
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
  Com201Action,
  Com201Endpoint
} from '../constants/com-201.constants';


/**
 * Provides backend communication for COM-201.
 *
 * Transport, authentication, company context and token handling are
 * delegated to XteinApiClientService.
 */
@Injectable()
export class Com201Service {
  private readonly log = createCom201Log();

  constructor(
    private readonly apiClient:
      XteinApiClientService
  ) {
  }


  /**
   * Executes an action on another application endpoint (catalogs).
   */
  request(endpoint: string, action: string, data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({ endpoint, action, data,
      logContext: this.log.Query, accessMode: XteinApiAccessMode.Authenticated });
  }


  /**
   * Executes a query operation on COM-201.
   */
  query(
    action: Com201Action,
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient
      .execute<XteinDataApiResponse<string>>({
        endpoint: Com201Endpoint.Query,
        action,
        data,
        logContext: this.log.Query,
        accessMode: XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Saves a price list with its complete item array (new or update).
   */
  save(
    action: typeof Com201Action.New | typeof Com201Action.Update,
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient
      .execute<XteinDataApiResponse<string>>({
        endpoint: Com201Endpoint.Save,
        action,
        data,
        logContext: this.log.Save,
        accessMode: XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Deletes a price list and its items.
   */
  delete(
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient
      .execute<XteinDataApiResponse<string>>({
        endpoint: Com201Endpoint.Delete,
        action: Com201Action.Delete,
        data,
        logContext: this.log.Delete,
        accessMode: XteinApiAccessMode.Authenticated
      });
  }
}
