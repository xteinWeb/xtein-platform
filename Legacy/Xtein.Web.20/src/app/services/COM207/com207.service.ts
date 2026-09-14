import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, Subject, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class COM207Service {
  private endPoint = environment.apiUrl;

  public ID_FACTURA: any;
  public CONSECUTIVO: any;
  public ID_FACTURA_prev: any;
  public CONSECUTIVO_prev: any;

  // Modos de operación
  accion: any;

  // Observers para los componentes
  private subject_Facturas = new Subject<any>();

  constructor( private http: HttpClient) { }

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
        return throwError(() => new Error(err));
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
          return throwError(err);
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
  }

  getObs_Facturas(): Observable<any> {
    return this.subject_Facturas.asObservable();
  }

  setObs_Facturas(prmDatos: any): void {
    this.subject_Facturas.next(prmDatos);
  }
  
}
