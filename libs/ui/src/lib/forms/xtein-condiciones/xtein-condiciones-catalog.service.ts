import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { XteinApiAccessMode, XteinApiClientService, XteinDataApiResponse } from '@xtein/api-client';
import { XteinCondicionItem } from './xtein-condiciones.model';

@Injectable({ providedIn: 'root' })
export class XteinCondicionesCatalogService {
  constructor(private readonly api: XteinApiClientService) {}

  conditions(tipo = 'VENTAS'): Observable<XteinCondicionItem[]> {
    return this.api.execute<XteinDataApiResponse<string>>({
      endpoint: '/VEN003/consulta',
      action: 'CONDICIONES',
      data: { TIPO: tipo },
      accessMode: XteinApiAccessMode.Authenticated
    }).pipe(
      map(response => {
        const rows = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        if (!Array.isArray(rows) || rows.some(row => row?.ErrMensaje)) {
          throw new Error('No se pudo cargar el catálogo de condiciones.');
        }
        return rows as XteinCondicionItem[];
      })
    );
  }
}
