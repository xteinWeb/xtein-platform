import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ConnectionField } from '../models/connection-field.model';

@Injectable({
  providedIn: 'root'
})
export class ConnectionFieldsService {

  private endPoint = environment.apiUrl;

  // Caché de los campos cargados desde BD
  private fieldsMap: { [key: string]: ConnectionField[] } = {};

  constructor(private http: HttpClient) { }

  // Carga todos los parámetros desde el backend. Solo consulta una vez.  
  getParameter(aplicacion: string): Observable<any> {

    // Si ya están cargados no vuelve al servidor
    if (Object.keys(this.fieldsMap).length > 0) {
      return of(this.fieldsMap);
    }

    const prmJ = {
      prmAccion: 'getParameters',
      prmDatos: JSON.stringify({}),
      prmConexion: {
        EMPRESA: localStorage.getItem('empresa')
      },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token')
      }
    };

    const body = JSON.stringify(prmJ);    
    const url = `${this.endPoint}/${aplicacion}/getParameters`;
    return this.http.post<any>(url, body, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      map(r => r),
      tap(r => {
        const jsonData = JSON.parse(r.data);        
        const data: ConnectionField[] = jsonData.connectionFields ?? [];
        this.fieldsMap = {};
        data.forEach(f => {
          if (!this.fieldsMap[f.source]) {
            this.fieldsMap[f.source] = [];
          }
          this.fieldsMap[f.source].push(f);
        });
      }),
      catchError(err => throwError(() => err))
    );
  }

  // Nuevo método para probar conexión
  testConnection(prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      prmAccion: 'testConnection',
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: { EMPRESA: localStorage.getItem('empresa') },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token'),
      },
    };

    const body = JSON.stringify(prmJ);       
    let url = this.endPoint + '/' + aplicacion + '/testConnection';
    
    return this.http
      .post<any>(url, body, {
        headers: {
          'Content-Type': 'application/json'
        },
      })
      .pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(() => new Error(err));
        })
      );
  }

  getFields(origin: string): ConnectionField[] {
    return this.fieldsMap[origin] || [];
  }

  hasFields(origin: string): boolean {
    return !!this.fieldsMap[origin];
  }

  getAvailableOrigins(): string[] {
    return Object.keys(this.fieldsMap);
  }

}