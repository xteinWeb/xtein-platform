import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  XteinApiAccessMode,
  XteinApiClientService,
  XteinDataApiResponse
} from '@xtein/api-client';
import { SessionService } from '@xtein/session';
import { XteinApplicationSetting } from '../models/xtein-record-settings.model';

@Injectable({ providedIn: 'root' })
export class XteinRecordSettingsService {
  private readonly api = inject(XteinApiClientService);
  private readonly session = inject(SessionService);

  /**
   * Retrieves application settings from backend `settings_aplicacion`.
   *
   * @param applicationId Application identifier (e.g. 'VEN-212', 'ADM-015').
   * @returns List of configured options for the application.
   */
  loadSettings(applicationId: string): Observable<XteinApplicationSetting[]> {
    const usuario = this.session.current?.userId?.toUpperCase() ?? '';
    const normalizedApp = applicationId?.trim().toUpperCase();

    return this.api.execute<XteinDataApiResponse<unknown>>({
      endpoint: '/generales/consulta',
      action: 'settings_aplicacion',
      data: {
        aplicacion: normalizedApp,
        APLICACION: normalizedApp,
        usuario,
        USUARIO: usuario
      },
      accessMode: XteinApiAccessMode.Authenticated
    }).pipe(
      map(response => {
        let data = response.data;

        for (let depth = 0; depth < 3; depth++) {
          if (typeof data === 'string') {
            try {
              data = JSON.parse(data);
            } catch {
              break;
            }
          }
        }

        const rows = Array.isArray(data) ? data : data ? [data] : [];
        if (rows.length > 0 && rows[0]?.ErrMensaje) {
          throw new Error(String(rows[0].ErrMensaje));
        }

        return rows.map((item: any) => ({
          ...item,
          VALOR: item.VALOR || item.text || item.NOMBRE || '',
          FUENTE: item.FUENTE || item.icon || 'icon-configurar-ol'
        })) as XteinApplicationSetting[];
      })
    );
  }
}
