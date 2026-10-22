import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  XteinApiAccessMode,
  XteinApiClientService,
  XteinDataApiResponse
} from '@xtein/api-client';
import {
  Com208Action,
  Com208Endpoint
} from '../constants/com-208.constants';
import { createCom208Log } from '../constants/com-208-logging.constants';

/**
 * Provides backend communication for COM-208 (Consumos).
 */
@Injectable()
export class Com208Service {
  private readonly log = createCom208Log();

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
    return this.request(Com208Endpoint.Query, action, data);
  }

  save(action: typeof Com208Action.New | typeof Com208Action.Update, data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Com208Endpoint.Save,
      action,
      data,
      logContext: this.log.Save,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  delete(data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Com208Endpoint.Delete,
      action: Com208Action.Delete,
      data,
      logContext: this.log.Delete,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }
}
