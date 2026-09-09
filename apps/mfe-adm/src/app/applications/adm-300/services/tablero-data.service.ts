import { Injectable, inject } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';
import { XteinApiAccessMode, XteinApiClientService } from '@xtein/api-client';
import { SessionService } from '@xtein/session';

export interface TableroApplication {
  ID_APLICACION: string;
  NOMBRE: string;
  icon?: string;
}

@Injectable({ providedIn: 'root' })
export class TableroDataService {
  private readonly api = inject(XteinApiClientService);
  private readonly session = inject(SessionService);

  loadApplications(kind: 'frequent' | 'favorites' | 'available'): Observable<TableroApplication[]> {
    const user = this.session.current?.userId;
    if (!user) return throwError(() => new Error('Se requiere una sesión activa.'));
    const action = { frequent: 'apl mas usadas', favorites: 'apl favoritas', available: 'consulta aplicacion' }[kind];
    return this.api.execute<{ data: string | unknown[] }>({
      endpoint: 'generales/consulta', action,
      data: kind === 'available' ? { USUARIO: user, opcion: 'usuario' } : { usuario: user },
      accessMode: XteinApiAccessMode.Authenticated
    }).pipe(map(response => {
      const rows: unknown = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      if (!Array.isArray(rows)) throw new Error('La respuesta de aplicaciones no es válida.');
      const error = rows[0]?.ErrMensaje;
      if (error && error !== 'No hay registros en la base de datos') throw new Error(String(error));
      const seen = new Set<string>();
      return rows.filter(row => row && typeof row.ID_APLICACION === 'string').map(row => ({
        ID_APLICACION: row.ID_APLICACION.trim().toUpperCase(),
        NOMBRE: String(row.NOMBRE || row.ID_APLICACION).trim(), icon: typeof row.icon === 'string' ? row.icon : undefined
      })).filter(row => {
        if (!row.ID_APLICACION || seen.has(row.ID_APLICACION)) return false;
        seen.add(row.ID_APLICACION);
        return true;
      });
    }));
  }
}
