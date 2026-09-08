import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
import { XteinApiAccessMode, XteinApiClientService, XteinDataApiResponse } from '@xtein/api-client';
import { SessionService } from '@xtein/session';

import { XTEIN_REPORTS_URL } from '../configuration/xtein-record-reports.config';
import { XteinReportDefinition, XteinReportParameters, XteinReportEmail, XteinReportEmailContext, XteinReportEmailRequest } from '../models/xtein-record-reports.model';
import { XteinRecordReportsBackend } from '../constants/xtein-record-reports.constants';

@Injectable({ providedIn: 'root' })
export class XteinRecordReportsService {
  readonly host = inject(XTEIN_REPORTS_URL).replace(/\/+$/, '') + '/';
  private readonly api = inject(XteinApiClientService);
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);

  list(applicationId: string): Observable<XteinReportDefinition[]> {
    return this.api.execute<XteinDataApiResponse<string>>({
      endpoint: XteinRecordReportsBackend.ListEndpoint,
      action: XteinRecordReportsBackend.ListAction,
      data: { ID_APLICACION: applicationId }, accessMode: XteinApiAccessMode.Authenticated
    }).pipe(map(response => {
      const rows: unknown = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      if (!Array.isArray(rows)) throw new Error('Respuesta de informes inválida.');
      if (rows[0]?.ErrMensaje) throw new Error(String(rows[0].ErrMensaje));
      return rows.filter(row => row.ID_REPORTE && row.ARCHIVO) as XteinReportDefinition[];
    }));
  }

  parameters(report: XteinReportDefinition, applicationId: string, table: string, filter: string): XteinReportParameters {
    const session = this.session.current;
    if (!session) throw new Error('No hay una sesión activa.');
    return {
      clid: session.companyId, usuario: session.userId,
      idrpt: report.ARCHIVO, id_reporte: report.ID_REPORTE,
      aplicacion: applicationId, tabla: table,
      filtro: JSON.stringify({ FILTRO: filter }), parametros: {}
    };
  }

  exportPdf(parameters: XteinReportParameters): Observable<Blob> {
    // Reporting uses its own raw JSON contract, not the Node API envelope.
    return this.http.post(this.host + XteinRecordReportsBackend.PdfEndpoint, {
      ...parameters, archivo: parameters.idrpt + '_' + crypto.randomUUID() + '.pdf'
    }, { responseType: 'blob' });
  }

  sendEmail(parameters: XteinReportParameters, email: XteinReportEmail,
    context: XteinReportEmailContext = {}): Observable<void> {
    const request: XteinReportEmailRequest = {
      ...parameters,
      archivo: parameters.idrpt + '_' + crypto.randomUUID() + '.pdf',
      prm_email: email,
      template: context.template ?? '',
      replacements: context.replacements ?? {}
    };
    // The PDF must be generated before the legacy mailer can attach that exact file.
    return this.http.post(this.host + XteinRecordReportsBackend.PdfEndpoint, request,
      { responseType: 'blob' }).pipe(
      switchMap(() => this.api.execute<XteinDataApiResponse<unknown>>({
        endpoint: XteinRecordReportsBackend.EmailEndpoint,
        action: XteinRecordReportsBackend.EmailAction,
        data: { datos: request }, accessMode: XteinApiAccessMode.Authenticated
      })),
      map(response => {
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        const result = Array.isArray(data) ? data[0] : data;
        if (result?.ErrMensaje) throw new Error(String(result.ErrMensaje));
      })
    );
  }
}

/** Restricts a report to the exact records currently loaded by its application. */
export function buildReportRecordFilter(table: string, key: string, ids: readonly (string | number)[]): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table) || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    throw new Error('Tabla o clave de informe inválida.');
  }
  const values = [...new Set(ids.map(id => String(id)))];
  if (!values.length) return '';
  return `${table}.${key} IN (${values.map(value => "'" + value.replace(/'/g, "''") + "'").join(',')})`;
}
