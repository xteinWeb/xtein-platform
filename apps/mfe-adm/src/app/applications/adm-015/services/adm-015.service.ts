import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  XteinApiAccessMode,
  XteinApiClientService,
  XteinDataApiResponse
} from '@xtein/api-client';
import { createAdm015Log } from '../constants/adm-015-logging.constants';
import {
  Adm015Application,
  Adm015Endpoint
} from '../constants/adm-015.constants';

@Injectable()
export class Adm015Service {
  private readonly log = createAdm015Log();

  constructor(
    private readonly apiClient: XteinApiClientService
  ) {}

  getApplicationId(): string {
    return Adm015Application.Id;
  }

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
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Adm015Endpoint.Query,
      action,
      data,
      logContext: this.log.Query,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  save(action: string, data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Adm015Endpoint.Save,
      action,
      data,
      logContext: this.log.Save,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  delete(data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Adm015Endpoint.Delete,
      action: 'delete',
      data,
      logContext: this.log.Delete,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  changePassword(data: unknown): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Adm015Endpoint.ChangePassword,
      action: 'GENERAR PASSWORD',
      data,
      logContext: this.log.ChangePassword,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }

  checkUserExists(username: string, action: string): Observable<XteinDataApiResponse<string>> {
    return this.apiClient.execute<XteinDataApiResponse<string>>({
      endpoint: Adm015Endpoint.Integrity,
      action: 'EXISTE USUARIO',
      data: { USUARIO: username, accion: action },
      logContext: this.log.Query,
      accessMode: XteinApiAccessMode.Authenticated
    });
  }
}
