import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ADM301Service {

  private endPoint = environment.apiUrl;

  //Modos de Operación
  accion: any;

  private subject_Calendario = new Subject<any>();

  constructor( private http: HttpClient ) { }

  getCalendarioApi(): Observable<any> {
    let url = 'https://api.generadordni.es/v2/holidays/holidays?year=2023&country=CO';
    return this.http.get<any>(url).
    pipe(
      map((vec: any) => {
        return vec;
      }),
      catchError((err) => {
        return throwError(() => new Error(err));
      })
    );
  }

  getActividadesUsuario(accion: any, prmDatos: any, aplicacion: any): Observable<any>{
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

  delete(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
        "prmAccion": 'delete',
        "prmDatos": JSON.stringify(prmDatos),
        "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
        "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-','');
    let url = this.endPoint+'/'+aplicacion+"/"+accion;
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

  getObs_Calendario(): Observable<any> {
    return this.subject_Calendario.asObservable();
  }

  setObs_Calendario(prmDatos: any): void {
    this.subject_Calendario.next(prmDatos);
  }
}