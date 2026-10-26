import { createVen210Log } from '../constants/ven-210-logging.constants';
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
  Ven210Action,
  Ven210Application,
  Ven210Endpoint
} from '../constants/ven-210.constants';


/**
 * Provides backend communication for VEN-210.
 *
 * Transportation, session headers, and request envelopes are
 * handled through XteinApiClientService.
 */
@Injectable()
export class Ven210Service {
  private readonly log = createVen210Log();

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
    return Ven210Application.Id;
  }


  /**
   * Executes a query operation on VEN-210.
   */
  query(
    action: string,
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient
      .execute<XteinDataApiResponse<string>>({
        endpoint: Ven210Endpoint.Query,
        action,
        data,
        logContext: this.log.Query,
        accessMode: XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Saves a remisión document (new or update).
   */
  save(
    action: typeof Ven210Action.New | typeof Ven210Action.Update,
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient
      .execute<XteinDataApiResponse<string>>({
        endpoint: Ven210Endpoint.Save,
        action,
        data,
        logContext: this.log.Save,
        accessMode: XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Deletes / cancels a remisión document.
   */
  delete(
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient
      .execute<XteinDataApiResponse<string>>({
        endpoint: Ven210Endpoint.Delete,
        action: Ven210Action.Delete,
        data,
        logContext: this.log.Delete,
        accessMode: XteinApiAccessMode.Authenticated
      });
  }


  /**
   * Queries remisión records matching criteria.
   */
  getRecords(
    data: unknown = {}
  ): Observable<XteinDataApiResponse<string>> {
    return this.query(
      Ven210Action.Query,
      data
    );
  }


  /**
   * Loads items, warehouse distribution and payment details for a specific remisión.
   */
  getAdditionalData(
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.query(
      Ven210Action.QueryAdicionales,
      data
    );
  }


  /**
   * Creates a new remisión.
   */
  create(
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.save(
      Ven210Action.New,
      data
    );
  }


  /**
   * Updates an existing remisión.
   */
  update(
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.save(
      Ven210Action.Update,
      data
    );
  }
}
