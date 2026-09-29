import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ADM401Service {

  private endPoint = environment.apiUrl;

  constructor( private http:HttpClient ) { }

  getAplicaciones(accion: any, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/ADM401/aplicaciones';
    return this.http.post<any>
      (url, 
        body,
        { headers: {'Content-Type': 'application/json' } })
      .pipe(
        map((vec: any) => {
        return vec;
      }),
      catchError((err:any) => {
        return throwError(() => new Error(err));
      })
    );
  };

  getUsuarios(accion: any, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/ADM401/usuarios';
    return this.http.post<any>
      (url, 
        body,
        { headers: {'Content-Type': 'application/json' } })
      .pipe(
        map((vec: any) => {
        return vec;
      }),
      catchError((err:any) => {
        return throwError(() => new Error(err));
      })
    );
  };

  // Consultas filtro
  consulta_filtro(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
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

  //GUARDADO DE DATOS:::
  save(Accion: string, prmDatos: any, aplicacion: any): Observable<any> {
		const prmJ = {
			"prmAccion": Accion,
			"prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
		};
    
    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-','');
    let url = this.endPoint+'/'+aplicacion+'/save';
    
    return this.http.post<any>(url, body,
      {headers: {'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
    );
	};

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

  getConsecutivo(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    
    const body = JSON.stringify(prmJ);    
    aplicacion = aplicacion.replace('-','');
    let url = this.endPoint+'/'+aplicacion+'/consecutivo';
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
