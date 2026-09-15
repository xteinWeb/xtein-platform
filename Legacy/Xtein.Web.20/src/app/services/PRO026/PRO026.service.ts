import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PRO026Service {

  private endPoint = environment.apiUrl;

  constructor( private http:HttpClient ) { }

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
}
