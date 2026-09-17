import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, Subject, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SDocElecService {

  private endPoint = environment.apiDocElec;

  // Modos de operación
  accion: any;

  constructor(private http: HttpClient) { }

  // Servicio de Documentos Electrónicos
  servElectronica(accion: any, prmDatos: any, tipoDocumentoElec: any): Observable<any> {
    const prmJ = {
      prmAccion: accion,
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: localStorage.getItem('empresa') ,
      prmTokenDatos: localStorage.getItem('token')
    };

    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/api/' + tipoDocumentoElec + '/' + accion;
    return this.http.post<any>(url, body,
                          {headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(() => err);
        })
      );
  }

  // Servicio de Archivo Documentos Electrónicos
  archivoElec(accion: any, prmDatos: any, tipoDocumentoElec: any): Observable<any> {
    const prmJ = {
      prmAccion: accion,
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: localStorage.getItem('empresa') ,
      prmTokenDatos: localStorage.getItem('token')
    };

    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/api/' + tipoDocumentoElec + '/' + accion;
    return this.http.post<any>(url, body,
                          {headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                           responseType: 'blob' as 'json'
                         }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(() => err);
        })
      );
  }

}
