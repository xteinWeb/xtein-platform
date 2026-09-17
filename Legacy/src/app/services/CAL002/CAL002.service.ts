import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CAL002Service {

  private endPoint = environment.apiUrl;

  constructor( private http:HttpClient ) { }

  //Consultas y peticiones:
  getActividad(Accion: string, prmDatos: any): Observable<any> {    
		const prmJ = {
			"prmAccion": Accion,
			"prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
		};
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/CAL002/actividad';
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

  getResponsables(Accion: string, prmDatos: any): Observable<any> {    
		const prmJ = {
			"prmAccion": Accion,
			"prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
		};
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/CAL002/responsables';
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

  getEstados(Accion: string, prmDatos: any): Observable<any> {    
		const prmJ = {
			"prmAccion": Accion,
			"prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
		};
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/CAL002/estados';
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

  consulta(accion: any, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/CAL002/consulta';

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

  getConsecutivo(accion: any, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/CAL002/consecutivo';

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

  getHistorial(Accion: string, prmDatos: any): Observable<any> {
		const prmJ = {
			"prmAccion": Accion,
			"prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
		};

    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/CAL002/historial';

    return this.http.post<any>(url, body,
    {headers: {'Content-Type': 'application/json' } }).
    pipe(
      map((vec: any) => {
        return vec;
      }),
      catchError((err:any) => {
        return throwError(err);
      })
    );
	};

  save(Accion: string, prmDatos: any): Observable<any> {
		const prmJ = {
			"prmAccion": Accion,
			"prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
		};

    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/CAL002/new';

    return this.http.post<any>(url, body,
      {headers: {'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err:any) => {
          return throwError(err);
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



}
