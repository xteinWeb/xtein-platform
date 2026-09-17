import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiRestService {

  private endPoint = environment.apiUrl;
  public collapsed: boolean = false;
  private subject_collapsed = new Subject<any>();

  constructor(private http:HttpClient)
  { }

  // Comunicación Ordenamiento atributos
  setObs_collapsed(prmDatos: any): void {
    this.subject_collapsed.next(prmDatos);
  }
  getObs_collapsed(): Observable<any> {
    return this.subject_collapsed.asObservable();
  }

  usuarioValido(Accion: string, prmDatos: any): Observable<any> {
		const prmJ = {
			"prmAccion": Accion,
			"prmDatos": JSON.stringify(prmDatos),
      "prmConexion": "ConexionBD"
		};
    
    const body = JSON.stringify(prmJ);

    let url = this.endPoint+'/usuarioValido';
    return this.http.post<any>(url, body,
    {headers: {'Content-Type': 'application/json'} }).
    pipe(
      map((vec: any) => {
        // console.log('URL: '+url);
        return vec;
      }),
      catchError((err) => {
        return throwError(err);
      })
    );
	};

  usuarioLogin(Accion: string, prmDatos: any): Observable<any> {
		const prmJ = {
			"prmAccion": Accion,
			"prmDatos": JSON.stringify(prmDatos),
      "prmConexion": "ConexionBD"
		};
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/usuarioLogin';
    
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

  usuarioAplicaciones(Accion: string, prmDatos: any): Observable<any> {
		const prmJ = {
			"prmAccion": Accion,
			"prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
		};
    const body = JSON.stringify(prmJ);
    
    let url = this.endPoint+'/home';
    
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

  // Consultas varias
  consulta(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    
    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-','');
    let url = this.endPoint+'/generales/consulta';
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

  
  getUsuarios(accion: any, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/usuarios';
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

  getResponsables(Accion: string, prmDatos: any): Observable<any> {
		const prmJ = {
			"prmAccion": Accion,
			"prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
		};
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/GES00/responsables';
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

  getAplicacion(accion: any, prmDatos: any): Observable<any> {
    const prmJ = {
        "prmAccion": accion,
        "prmDatos": JSON.stringify(prmDatos),
        "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
        "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/CHAT/aplicacion';
    return this.http.post<any>
      (url, 
        body,
        { headers: {'Content-Type': 'application/json' } })
        .pipe(
            map((vec: any) => {
            return vec;
          }),
        catchError((err) => {
          return throwError(() => new Error(err));
      })
    );
  }

  generarCodigo(Accion: string, prmDatos: any): Observable<any> {
		const prmJ = {
			"prmAccion": Accion,
			"prmDatos": JSON.stringify(prmDatos),
      "prmConexion": "ConexionBD"
		};
    const body = JSON.stringify(prmJ);

    let url = this.endPoint+'/getCodigoResetPassword';
    return this.http.post<any>(url, body,
      {headers: {'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          // console.log('URL: '+url);
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
    );
	};

  validateCodigo(Accion: string, prmDatos: any): Observable<any> {
		const prmJ = {
			"prmAccion": Accion,
			"prmDatos": JSON.stringify(prmDatos),
      "prmConexion": "ConexionBD"
		};
    const body = JSON.stringify(prmJ);

    let url = this.endPoint+'/validatePassword';
    return this.http.post<any>(url, body,
      {headers: {'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          // console.log('URL: '+url);
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
    );
	};

  changePassword(Accion: string, prmDatos: any): Observable<any> {
		const prmJ = {
			"prmAccion": Accion,
			"prmDatos": JSON.stringify(prmDatos),
      "prmConexion": "ConexionBD"
		};
    const body = JSON.stringify(prmJ);

    let url = this.endPoint+'/updatePassword';
    return this.http.post<any>(url, body,
      {headers: {'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          console.log('URL: '+url);
          return vec;
        }),
        catchError((err) => {
          console.log('Error API ',err+' .... '+url)
          return throwError(err);
        })
    );
	};

}
