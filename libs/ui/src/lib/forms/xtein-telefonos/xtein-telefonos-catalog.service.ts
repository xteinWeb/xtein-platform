import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { XteinApiAccessMode, XteinApiClientService, XteinDataApiResponse } from '@xtein/api-client';
import { XteinTelefonoTipo } from './xtein-telefonos.model';

@Injectable({ providedIn: 'root' })
export class XteinTelefonosCatalogService {
  constructor(private readonly api: XteinApiClientService) {}

  types(): Observable<XteinTelefonoTipo[]> {
    return this.api.execute<XteinDataApiResponse<string>>({
      endpoint: '/ADM006/consulta',
      action: 'tipos direccion',
      data: {},
      accessMode: XteinApiAccessMode.Authenticated
    }).pipe(
      map(response => {
        const rows = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        if (!Array.isArray(rows) || rows.some(row => row?.ErrMensaje)) {
          throw new Error('No se pudo cargar el catálogo de tipos de teléfono.');
        }
        return rows as XteinTelefonoTipo[];
      })
    );
  }
}
