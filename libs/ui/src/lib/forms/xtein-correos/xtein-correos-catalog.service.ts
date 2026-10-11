import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { XteinApiAccessMode, XteinApiClientService, XteinDataApiResponse } from '@xtein/api-client';

@Injectable({ providedIn: 'root' })
export class XteinCorreosCatalogService {
  constructor(private readonly api: XteinApiClientService) {}

  getTypes(): Observable<string[]> {
    return this.api.execute<XteinDataApiResponse<string>>({
      endpoint: '/ADM012/consulta',
      action: 'ITM_DOMINIOS',
      data: { ID_DOMINIO: 'correos_usuarios', ID_GRUPO_DOMINIO: 'emails' },
      accessMode: XteinApiAccessMode.Authenticated
    }).pipe(map(response => {
      const rows = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      if (!Array.isArray(rows) || rows.some(row => row?.ErrMensaje)) {
        throw new Error('No se pudieron cargar los tipos de correo.');
      }
      return [...new Set<string>(rows
        .map(row => typeof row?.VALOR1 === 'string' ? row.VALOR1.trim() : '')
        .filter(Boolean))];
    }));
  }
}
