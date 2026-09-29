import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ADM205Service {

  private endPoint = environment.apiUrl;

  // Objetos públicos de intercambio de datos
  conCambios: number;
  public USUARIO: any;
  public USUARIO_prev: any;
  public D_Imagen: any;

  // Modos de operación
  accion: any;

  // Modos de edición de cada componente
  public M_esEdicionImagen: any;

  // Observers para los componentes
  private subject_Identificacion = new Subject<any>();
  private subject_Imagen = new Subject<any>();
  private subject_Contabilidad = new Subject<any>();

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

  save(prmAccion: any, prmDatos: any): Observable<any> {
    const prmJ = {
      prmAccion: prmAccion,
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: { EMPRESA: localStorage.getItem('empresa') },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token'),
      },
    };

    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/ADM205/update';

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

  delete(prmAccion: any, prmDatos: any): Observable<any> {
    const prmJ = {
      prmAccion: prmAccion,
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: { EMPRESA: localStorage.getItem('empresa') },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token'),
      },
    };

    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/ADM205/' + prmAccion;

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
          return throwError(err);
        })
      );
  }

  getIntegridad(Accion: string, prmDatos: any): Observable<any> {
    const prmJ = {
      prmAccion: Accion,
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: { EMPRESA: localStorage.getItem('empresa') },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token'),
      },
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/ADM205/integridad';
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
          return throwError(err);
        })
      );
  }

  setObs_Identificacion(prmDatos: any): void {
    this.subject_Identificacion.next(prmDatos);
  }
  setObs_Imagen(prmDatos: any): void {
    this.subject_Imagen.next(prmDatos);
  }
  setObs_Contabilidad(prmDatos: any): void {
    this.subject_Contabilidad.next(prmDatos);
  }
}
