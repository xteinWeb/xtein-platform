import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

import { BehaviorSubject, Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { environment } from "../../../environments/environment";

@Injectable()
export class PRO011Service  {
  
  private endPoint = environment.apiUrl;
  
  public apiData: any;
  public onDataChanged: BehaviorSubject<any>;

  // Modos de operación
  accion: any;

  constructor(private http: HttpClient) {
    this.onDataChanged = new BehaviorSubject({});
  }

  // Buscar Rutas tipo layout planta
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

  valideLayoutRuta(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    
    const body = JSON.stringify(prmJ);    
    aplicacion = aplicacion.replace('-','');
    let url = this.endPoint+'/'+aplicacion+'/validar-layout';
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

  async consulta92(prmJson: any): Promise<any> {
    const prmJ = {
      "prmAccion": "consulta",
      "data": prmJson,
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    let url = environment.apiUrlNode + "/utils/consulta";
    return this.http.post<any>(url, prmJ).toPromise();
  }
  
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

  // Consulta por una ruta con su id
  idruta(IdRuta: any): Observable<any> {
    /*let url = `${env.url1}/rutasdp/ruta/${IdRuta}`;
		return this.http.get(url, {
			headers: { token: fnLocal.get('token') },
		});*/
    let url = `${environment.apiUrlNode}/PRO011/${IdRuta}`;
    return this.http.get<any>(url);
  }

  // Valida existencia de una llave de la tabla
  validellave(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    
    const body = JSON.stringify(prmJ);    
    aplicacion = aplicacion.replace('-','');
    let url = this.endPoint+'/'+aplicacion+'/consulta';
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

  // Guardar registro -> ejecutar de acuerdo a la acción
  save(accion: any, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    
    const body = JSON.stringify(prmJ);    
    let url = this.endPoint+'/PRO012/'+accion;
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

  // Actualización de registro
  delete(prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": 'delete',
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);    
    let url = this.endPoint+'/PRO013/delete';
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

  // Trae todas las secciones
  qsecciones(): Observable<any> {
    const data = {
      prmAccion: "qsecciones",
      data: {
        FILTRO: "",
      },
    };

    let url = environment.apiUrlNode + "/PRO011";
    return this.http.post<any>(url, data);
  }

  // Trae todas las secciones
  qlistas(prmJson: any): Observable<any> {
    const url = `${environment.apinet}/rutasdp/qlistas`;
    return this.http.post(url, prmJson, {
      headers: {'Content-Type': 'application/json' },
    });
  }

}
