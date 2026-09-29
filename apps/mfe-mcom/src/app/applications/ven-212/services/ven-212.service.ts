import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  XteinApiAccessMode,
  XteinApiClientService,
  XteinDataApiResponse
} from '@xtein/api-client';
import {
  Ven212Action,
  Ven212Application,
  Ven212Endpoint
} from '../constants/ven-212.constants';
import { createVen212Log } from '../constants/ven-212-logging.constants';

/**
 * Provides backend communication for VEN-212 (Facturación).
 */
@Injectable()
export class Ven212Service {
  private readonly log = createVen212Log();

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
    return Ven212Application.Id;
  }

  query(action: string, data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Ven212Endpoint.Query,
      action,
      data,
      logContext: this.log.Query,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  save(action: 'new' | 'update' | string, data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Ven212Endpoint.Save,
      action,
      data,
      logContext: this.log.Save,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  delete(data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Ven212Endpoint.Delete,
      action: Ven212Action.Delete,
      data,
      logContext: this.log.Delete,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  getRecords(data: unknown = {}): Observable<XteinDataApiResponse<string>> {
    return this.query(Ven212Action.Query, data);
  }

  create(data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.save('new', data);
  }

  update(data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.save('update', data);
  }
}
