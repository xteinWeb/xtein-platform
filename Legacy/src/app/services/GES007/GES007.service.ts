import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GES007Service {

  private endPoint = environment.apiUrl;

  prmUsrAplBarReg: clsBarraRegistro;
  DResponsables: any = [];
  DPrecedentes: any = [];

  constructor(private http: HttpClient) { }

  consulta(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };

    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-', '');
    let url = this.endPoint+'/' + aplicacion + '/consulta';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(() => new Error(err));
        })
      );
  }

  getResponsables(Accion: string, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": Accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/GES001/responsables';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  };

  getEstados(Accion: string, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": Accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/GES001/estados';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  };
}