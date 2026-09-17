import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ImageFile } from 'src/app/shared/img-manager/img-manager.component';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CXC220Service {

  private endPoint = environment.apiUrl;

  public ID_DOCUMENTO: any;
  public CONSECUTIVO: any;
  public ID_DOCUMENTO_prev: any;
  public CONSECUTIVO_prev: any;

  // Modos de operación
  accion: any;

  // Observers para los componentes
  private subject_Pedidos = new Subject<any>();

  constructor( private http: HttpClient ) { }

  consulta(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
        "prmAccion": accion,
        "prmDatos": JSON.stringify(prmDatos),
        "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
        "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };

    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-','');
    let url = this.endPoint+'/'+aplicacion+'/consulta';
    return this.http.post<any>(url, body,
        { headers: {'Content-Type': 'application/json' } }).
    pipe(
        map((vec: any) => {
        return vec;
        }),
        catchError((err) => {
            return throwError(() => err);
        })
    );
  }

  

  save(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
        "prmAccion": accion,
        "prmDatos": JSON.stringify(prmDatos),
        "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
        "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    
    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-','');
    let url = this.endPoint+'/'+aplicacion+'/save';
    return this.http.post<any>(url, body,
        { headers: {'Content-Type': 'application/json' } }).
    pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
            return throwError(() => err);
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
    aplicacion = aplicacion.replace('-','');
    let url = this.endPoint+'/'+aplicacion+'/'+accion;
    return this.http.post<any>(url, body,
        { headers: {'Content-Type': 'application/json' } }).
    pipe(
        map((vec: any) => {
        return vec;
        }),
        catchError((err) => {
        return throwError(() => new Error(err));
        })
    );
  };

  // Carga de datos con paginación
  loadPage(prmDatos: any, aplicacion: any, page: number, pageSize: number) {
    const prmJ = {
        "prmAccion": 'consulta',
        "prmDatos": JSON.stringify({ID_APLICACION: prmDatos.ID_APLICACION, USUARIO: prmDatos.USUARIO, PAGE: page, PAGE_SIZE: pageSize }),
        "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
        "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') },
    };
    aplicacion = aplicacion.replace('-','');
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/'+aplicacion+'/consulta';
    return this.http.post<any>(url, body,
                                { headers: {'Content-Type': 'application/json' } }).
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
