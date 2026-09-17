import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class GHU230Service {

  accion: string = '';

  constructor(private http: HttpClient) { }

  consulta(accion: any, prmDatos: any, url:string): Observable<any> {
    const prmJ = {
      prmAccion: accion,
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: { EMPRESA: localStorage.getItem('empresa') },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token'),
      },
    };

    const body = JSON.stringify(prmJ);

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
}