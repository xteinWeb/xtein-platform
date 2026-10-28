import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  XteinApiAccessMode,
  XteinApiClientService,
  XteinDataApiResponse
} from '@xtein/api-client';
import {
  Fin221Action,
  Fin221Endpoint
} from '../constants/fin-221.constants';
import { createFin221Log } from '../constants/fin-221-logging.constants';

/**
 * Provides backend communication for FIN-221.
 *
 * Transport, authentication, company context and token handling are
 * delegated to XteinApiClientService.
 */
@Injectable()
export class Fin221Service {
  private readonly log = createFin221Log();

  constructor(
    private readonly apiClient: XteinApiClientService
  ) {}

  /**
   * Executes an action on another application endpoint (e.g. FIN230 condiciones catalog).
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
   * Executes a query operation on FIN-221 (spPlanesFinanciacion).
   */
  query(
    action: Fin221Action,
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Fin221Endpoint.Query,
      action,
      data,
      logContext: this.log.Query,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  /**
   * Saves a financing plan with its complete item array (new or update).
   */
  save(
    action: typeof Fin221Action.New | typeof Fin221Action.Update,
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Fin221Endpoint.Save,
      action,
      data,
      logContext: this.log.Save,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  /**
   * Deletes a financing plan and its items.
   */
  delete(
    data: unknown
  ): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Fin221Endpoint.Delete,
      action: Fin221Action.Delete,
      data,
      logContext: this.log.Delete,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }
}
