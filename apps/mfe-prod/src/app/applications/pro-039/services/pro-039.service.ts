import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  XteinApiAccessMode,
  XteinApiClientService,
  XteinDataApiResponse
} from '@xtein/api-client';
import {
  Pro039Action,
  Pro039Endpoint
} from '../constants/pro-039.constants';
import { createPro039Log } from '../constants/pro-039-logging.constants';

/**
 * Provides backend communication for PRO-039 (Consumos).
 */
@Injectable()
export class Pro039Service {
  private readonly log = createPro039Log();

  constructor(
    private readonly apiClient: XteinApiClientService
  ) {}

  request(endpoint: string, action: string, data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint,
      action,
      data,
      logContext: this.log.Query,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  query(action: string, data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.request(Pro039Endpoint.Query, action, data);
  }

  save(action: typeof Pro039Action.New | typeof Pro039Action.Update, data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Pro039Endpoint.Save,
      action,
      data,
      logContext: this.log.Save,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  delete(data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Pro039Endpoint.Delete,
      action: Pro039Action.Delete,
      data,
      logContext: this.log.Delete,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }
}
