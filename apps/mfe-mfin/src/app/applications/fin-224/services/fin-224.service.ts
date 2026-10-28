import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  XteinApiAccessMode,
  XteinApiClientService,
  XteinDataApiResponse
} from '@xtein/api-client';
import {
  Fin224Action,
  Fin224Endpoint
} from '../constants/fin-224.constants';
import { createFin224Log } from '../constants/fin-224-logging.constants';

/**
 * Provides backend communication for FIN-224.
 *
 * Transport, authentication, company context and token handling are
 * delegated to XteinApiClientService.
 */
@Injectable()
export class Fin224Service {
  private readonly log = createFin224Log();

  constructor(
    private readonly apiClient: XteinApiClientService
  ) {}

  /**
   * Executes an action on another application endpoint (e.g. COM201 or FIN221 catalogs).
   */
  request(endpoint: string, action: string, data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint,
      action,
      data,
      logContext: this.log.Catalog,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  /**
   * Executes a query operation on FIN-224 (spCondicionNegocio).
   */
  query(
    action: Fin224Action,
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Fin224Endpoint.Query,
      action,
      data,
      logContext: this.log.Query,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  /**
   * Saves a negotiation condition with its associated price lists.
   */
  save(
    action: typeof Fin224Action.New | typeof Fin224Action.Update,
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Fin224Endpoint.Save,
      action,
      data,
      logContext: this.log.Save,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  /**
   * Deletes a negotiation condition.
   */
  delete(
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Fin224Endpoint.Delete,
      action: Fin224Action.Delete,
      data,
      logContext: this.log.Delete,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }
}
