import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { XteinApiClientService, XteinApiAccessMode } from '@xtein/api-client';
import { SessionService } from '@xtein/session';
import { XteinDashboardDefinition, XteinDashboardTypeRow } from '../models/xtein-dashboard-definition.model';
import { XteinDashboardKpiOption } from '../models/xtein-dashboard-editor.model';

@Injectable({ providedIn: 'root' })
export class XteinDashboardDataService {
  private readonly api = inject(XteinApiClientService);
  private readonly session = inject(SessionService);

  loadKpis(): Observable<XteinDashboardKpiOption[]> {
    return this.api.execute<{ data: string | { ID_APLICACION?: string; NOMBRE?: string; ErrMensaje?: string }[] }>({
      endpoint: 'dashboard-data/consulta', action: 'KpiList', data: {}, accessMode: XteinApiAccessMode.Authenticated
    }).pipe(map(response => {
      const rows: { ID_APLICACION?: string; NOMBRE?: string; ErrMensaje?: string }[] =
        typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      if (!Array.isArray(rows) || rows[0]?.ErrMensaje) throw new Error('No fue posible cargar los KPI.');
      return rows.filter(row => row.ID_APLICACION).map(row => ({ value: String(row.ID_APLICACION), text: row.NOMBRE?.trim() || String(row.ID_APLICACION) }));
    }));
  }

  load(applicationId: string): Observable<XteinDashboardDefinition> {
    const user = this.session.current?.userId;
    if (!applicationId.trim() || !user) {
      throw new Error('Se requiere una aplicación y una sesión activa.');
    }
    return this.api.execute<{ data: string | XteinDashboardTypeRow[] }>({
      endpoint: 'dashboard-data/consulta', action: 'DashboardType',
      data: { ID_APLICACION: applicationId }, accessMode: XteinApiAccessMode.Authenticated
    }).pipe(map(response => {
      const rows: XteinDashboardTypeRow[] = typeof response.data === 'string'
        ? JSON.parse(response.data) : response.data;
      const row = Array.isArray(rows) ? rows[0] : undefined;
      if (!row || row.ErrMensaje !== '' || typeof row.TIPO !== 'string') {
        throw new Error(row?.ErrMensaje || 'No se encontró la configuración del dashboard.');
      }
      return {
        dashboardType: row.TIPO,
        dashboardId: JSON.stringify({ dashboardId: applicationId, user: user.toUpperCase(),
          type: 'view', filter: [{ Field: '', Value: '' }] })
      };
    }));
  }
}
