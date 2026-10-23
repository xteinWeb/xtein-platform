import { createVen213Log } from '../constants/ven-213-logging.constants';
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
  Ven213Action,
  Ven213Endpoint
} from '../constants/ven-213.constants';


/**
 * Provides backend communication for VEN-213.
 *
 * Transportation, session headers, and request envelopes are
 * handled through XteinApiClientService.
 */
@Injectable()
export class Ven213Service {
  private readonly log = createVen213Log();

  constructor(
    private readonly apiClient:
      XteinApiClientService
  ) {
  }


  request(endpoint: string, action: string, data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({ endpoint, action, data,
      logContext: this.log.Query, accessMode: XteinApiAccessMode.Authenticated });
  }

  /**
   * Executes a query operation on VEN-213.
   */
  query(
    action: string,
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient
      .execute<XteinDataApiResponse<string>>({
        endpoint: Ven213Endpoint.Query,
        action,
        data,
        logContext: this.log.Query,
        accessMode: XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Saves a new devolución document (a devolución is never updated).
   */
  save(
    action: typeof Ven213Action.New,
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient
      .execute<XteinDataApiResponse<string>>({
        endpoint: Ven213Endpoint.Save,
        action,
        data,
        logContext: this.log.Save,
        accessMode: XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Cancels (ANULADA) a devolución document.
   */
  delete(
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient
      .execute<XteinDataApiResponse<string>>({
        endpoint: Ven213Endpoint.Delete,
        action: Ven213Action.Delete,
        data,
        logContext: this.log.Delete,
        accessMode: XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Queries devolución records matching criteria.
   */
  getRecords(
    data: unknown = {}
  ): Observable<XteinDataApiResponse<string>> {
    return this.query(
      Ven213Action.Query,
      data
    );
  }


  /**
   * Loads items and the restock distribution of a specific devolución.
   */
  getAdditionalData(
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.query(
      Ven213Action.QueryAdicionales,
      data
    );
  }


  /**
   * Creates a new devolución.
   */
  create(
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.save(
      Ven213Action.New,
      data
    );
  }
}
