import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  XteinApiAccessMode,
  XteinApiClientService,
  XteinDataApiResponse
} from '@xtein/api-client';
import { createVen209Log } from '../constants/ven-209-logging.constants';
import {
  Ven209Application,
  Ven209Endpoint
} from '../constants/ven-209.constants';

@Injectable()
export class Ven209Service {
  private readonly log = createVen209Log();

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
    return Ven209Application.Id;
  }

  query(action: string, data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Ven209Endpoint.Query,
      action,
      data,
      logContext: this.log.Query,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  save(action: 'new' | 'update', data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Ven209Endpoint.Save,
      action,
      data,
      logContext: this.log.Save,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  delete(data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Ven209Endpoint.Delete,
      action: 'delete',
      data,
      logContext: this.log.Delete,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  getRecords(data: unknown = {}): Observable<XteinDataApiResponse<string>> {
    return this.query('consulta', data);
  }

  create(data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.save('new', data);
  }

  update(data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.save('update', data);
  }
}
