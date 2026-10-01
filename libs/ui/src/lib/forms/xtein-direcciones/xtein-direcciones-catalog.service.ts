import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { XteinApiAccessMode, XteinApiClientService, XteinDataApiResponse } from '@xtein/api-client';
import { XteinDireccionPostal, XteinDireccionTipo, XteinDireccionUbicacion } from './xtein-direcciones.model';

@Injectable({ providedIn: 'root' })
export class XteinDireccionesCatalogService {
  constructor(private readonly api: XteinApiClientService) {}
  types(): Observable<XteinDireccionTipo[]> { return this.query('tipos direccion', {}); }
  locations(type: 'Ciudad' | 'Barrio' | 'Dependiente', city?: string, neighborhood?: string): Observable<XteinDireccionUbicacion[]> {
    return this.query('ubicaciones', {
      TIPO_UBICACION: type,
      ...(city ? { CIUDAD: city } : {}),
      ...(neighborhood ? { BARRIO: neighborhood } : {})
    });
  }
  postalCodes(city: string): Observable<XteinDireccionPostal[]> {
    return this.query('codigos postales', { ID_UBICACION: city });
  }
  private query<T>(action: string, data: Record<string, unknown>): Observable<T[]> {
    return this.api.execute<XteinDataApiResponse<string>>({
      endpoint: '/ADM006/consulta', action, data, accessMode: XteinApiAccessMode.Authenticated
    }).pipe(map(response => {
      const rows = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      if (!Array.isArray(rows) || rows.some(row => row?.ErrMensaje)) throw new Error('No se pudo cargar el catálogo de direcciones.');
      return rows as T[];
    }));
  }
}
