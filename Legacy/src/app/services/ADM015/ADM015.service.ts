import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ADM015Service {

  private endPoint = environment.apiUrl;

  // Objetos públicos de intercambio de datos
  public USUARIO: any;
  public USUARIO_prev: any;
  public ROL: any;
  public D_Autorizaciones: any;
  public D_PermisosEspeciales: any;
  public D_UNAsociadas: any;
  public D_Conexiones: any;
  public D_Aplicaciones: any;
  
  public DSAplicaciones: any;

  // Modos de operación
  accion: any;

  // Modos de edición de cada componente
  public M_esEdicionAutorizaciones: any;
  public M_esEdicionPermisosEspeciales: any;
  public M_esEdicionUNAsociadas: any;
  public M_esEdicionConexiones: any;
  public M_esEdicionAplicaciones: any;

  // Observers para los componentes
  private subject_Usuario = new Subject<any>();
  private subject_UsuarioAutorizaciones = new Subject<any>();
  private subject_UsuarioPermisosEspeciales = new Subject<any>();
  private subject_UsuarioUNAsociadas = new Subject<any>();
  private subject_UsuarioConexiones = new Subject<any>();

  constructor(private http: HttpClient) { }



  getObs_Usuarios(): Observable<any> {
    return this.subject_Usuario.asObservable();
  }

  setObs_Usuario(prmDatos: any): void {
    this.subject_Usuario.next(prmDatos);
  }

  getObs_UsuarioAutorizaciones(): Observable<any> {
    return this.subject_UsuarioAutorizaciones.asObservable();
  }

  setObs_UsuarioAutorizaciones(prmDatos: any): void {
    this.subject_UsuarioAutorizaciones.next(prmDatos);
  }

  getObs_UsuarioPermisosEspeciales(): Observable<any> {
    return this.subject_UsuarioPermisosEspeciales.asObservable();
  }

  setObs_UsuarioPermisosEspeciales(prmDatos: any): void {
    this.subject_UsuarioPermisosEspeciales.next(prmDatos);
  }

  getObs_UsuarioUNAsociadas(): Observable<any> {
    return this.subject_UsuarioUNAsociadas.asObservable();
  }

  setObs_UsuarioUNAsociadas(prmDatos: any): void {
    this.subject_UsuarioUNAsociadas.next(prmDatos);
  }

  getObs_UsuarioConexiones(): Observable<any> {
    return this.subject_UsuarioConexiones.asObservable();
  }

  setObs_UsuarioConexiones(prmDatos: any): void {
    this.subject_UsuarioConexiones.next(prmDatos);
  }

  getObs_AppsRol(): Observable<any> {
    return this.subject_UsuarioAutorizaciones.asObservable();
  }

  setObs_AppsRol(prmDatos: any): void {
    this.subject_UsuarioAutorizaciones.next(prmDatos);
  }

  // Consultas varias
  consulta(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };

    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-', '');
    let url = this.endPoint+'/'+ aplicacion + '/consulta';
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

  // Guardar registro -> ejecutar de acuerdo a la acción
  save(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };

    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-', '');
    let url = this.endPoint+'/'+ aplicacion + "/" + accion;
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

  delete(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      "prmAccion": 'delete',
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-', '');
    let url = this.endPoint+'/'+ aplicacion + "/" + accion;
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
  };

  validellave(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };

    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-', '');
    let url = this.endPoint+'/'+ aplicacion + '/consulta';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } })
      .pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(() => new Error(err));
        })
      );
  }

  changePassword(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };

    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-', '');
    let url = this.endPoint+'/'+ aplicacion + '/generatePassword';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } })
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