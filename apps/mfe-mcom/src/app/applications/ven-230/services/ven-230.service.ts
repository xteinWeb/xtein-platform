import { createVen230Log } from '../constants/ven-230-logging.constants';
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
  Ven230Action,
  Ven230Application,
  Ven230Endpoint
} from '../constants/ven-230.constants';


/**
 * Provides backend communication for VEN-230.
 *
 * Transportation, session headers, and request envelopes are
 * handled through XteinApiClientService.
 */
@Injectable()
export class Ven230Service {
  private readonly log = createVen230Log();

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
   * Returns the application identifier.
   */
  getApplicationId(): string {
    return Ven230Application.Id;
  }


  /**
   * Executes a query operation on VEN-230.
   */
  query(
    action: string,
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient
      .execute<XteinDataApiResponse<string>>({
        endpoint: Ven230Endpoint.Query,
        action,
        data,
        logContext: this.log.Query,
        accessMode: XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Saves a prefactura document (new or update).
   */
  save(
    action: typeof Ven230Action.New | typeof Ven230Action.Update,
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient
      .execute<XteinDataApiResponse<string>>({
        endpoint: Ven230Endpoint.Save,
        action,
        data,
        logContext: this.log.Save,
        accessMode: XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Deletes / cancels a prefactura document.
   */
  delete(
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient
      .execute<XteinDataApiResponse<string>>({
        endpoint: Ven230Endpoint.Delete,
        action: Ven230Action.Delete,
        data,
        logContext: this.log.Delete,
        accessMode: XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Queries prefactura records matching criteria.
   */
  getRecords(
    data: unknown = {}
  ): Observable<XteinDataApiResponse<string>> {
    return this.query(
      Ven230Action.Query,
      data
    );
  }


  /**
   * Loads items, taxes and payment details for a specific prefactura.
   */
  getAdditionalData(
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.query(
      Ven230Action.QueryAdicionales,
      data
    );
  }


  /**
   * Creates a new prefactura.
   */
  create(
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.save(
      Ven230Action.New,
      data
    );
  }


  /**
   * Updates an existing prefactura.
   */
  update(
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.save(
      Ven230Action.Update,
      data
    );
  }
}
