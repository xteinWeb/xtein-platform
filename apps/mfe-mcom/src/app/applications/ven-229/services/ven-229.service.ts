import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  XteinApiAccessMode,
  XteinApiClientService,
  XteinDataApiResponse
} from '@xtein/api-client';
import {
  Ven229Action,
  Ven229Application,
  Ven229Endpoint
} from '../constants/ven-229.constants';
import { createVen229Log } from '../constants/ven-229-logging.constants';

/**
 * Provides backend communication for VEN-229 (Pedidos).
 */
@Injectable()
export class Ven229Service {
  private readonly log = createVen229Log();

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

  getApplicationId(): string {
    return Ven229Application.Id;
  }

  query(action: string, data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Ven229Endpoint.Query,
      action,
      data,
      logContext: this.log.Query,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  save(action: typeof Ven229Action.New | typeof Ven229Action.Update, data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Ven229Endpoint.Save,
      action,
      data,
      logContext: this.log.Save,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  delete(data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Ven229Endpoint.Delete,
      action: Ven229Action.Delete,
      data,
      logContext: this.log.Delete,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  getRecords(data: unknown = {}): Observable<XteinDataApiResponse<string>> {
    return this.query(Ven229Action.Query, data);
  }

  create(data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.save(Ven229Action.New, data);
  }

  update(data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.save(Ven229Action.Update, data);
  }
}
