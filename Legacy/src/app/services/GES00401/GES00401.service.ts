import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GES00401service {

  private endPoint = environment.apiUrl;

  // Objetos públicos de intercambio de datos
  public USUARIO: any;
  public USUARIO_prev: any;
  public readonly: any;
  public readonlyForm: any;

  // Modos de operación
  accion: any;

  // Observers para los componentes
  private subject_DominioAutorizaciones = new Subject<any>();
  private subject_DominioPermisosEspeciales = new Subject<any>();
  private subject_DominioDMsociadas = new Subject<any>();
  private subject_DominioConexiones = new Subject<any>();

  constructor(private http: HttpClient) { }


  // Consultas varias
  consulta(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
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
    aplicacion = aplicacion.replace('-', '');
    let url = this.endPoint + '/' + aplicacion + '/consulta';
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

  
  saveGroup(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
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
    aplicacion = aplicacion.replace('-', '');
    let url = this.endPoint + '/GES004/save';
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

  deleteGroup(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      prmAccion: 'delete',
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: { EMPRESA: localStorage.getItem('empresa') },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token'),
      },
    };
    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-', '');
    let url = this.endPoint + '/' + aplicacion + '/save';
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

  validellave(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
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
    aplicacion = aplicacion.replace('-', '');
    let url = this.endPoint + '/' + aplicacion + '/consulta';
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

  getResponsables(Accion: string, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": Accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/GES001/responsables';
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
