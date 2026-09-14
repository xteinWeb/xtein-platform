import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, Subject, throwError } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GES00Service {

  private endPoint = environment.apiUrl;

  public loadingVisible: boolean = false;

  private subjectGesproInfo = new Subject<any>();
  private subjectActividades = new Subject<any>();
  private subjectCondiciones = new Subject<any>();
  prmUsrAplBarReg: clsBarraRegistro;

  constructor(private http: HttpClient) { }

  setObsGesproInfo(data: any) {
    this.subjectGesproInfo.next(data);
  }

  getObsGesproInfo(): Observable<any> {
    return this.subjectGesproInfo.asObservable();
  }

  setObsActividades(data: any) {
    this.subjectActividades.next(data);
  }

  getObsActividades(): Observable<any> {
    return this.subjectActividades.asObservable();
  }

  setObsCondiciones(data: any) {
    this.subjectCondiciones.next(data);
  }

  getObsCondiciones(): Observable<any> {
    return this.subjectCondiciones.asObservable();
  }

  //CONSULTAS API::::
  getActividades(Accion: string, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": Accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/GES00/getActividades';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  };

  getConsecutivo(Accion: string, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": Accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/GES00/getConsecutivo';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } }).
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
    let url = this.endPoint + '/GES00/responsables';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  };
  getActividadById(Accion: string, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": Accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/GES00/estados';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  };

  getEstados(Accion: string, prmDatos: any, aplicacion = 'GES00', ruta = 'estados'): Observable<any> {
    const prmJ = {
      "prmAccion": Accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/' + aplicacion + '/' + ruta;
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  };
  changeStatus(Accion: string, actividad: any): Observable<any> {
    const prmJ = {
      "prmAccion": Accion,
      "prmDatos": JSON.stringify({ USUARIO: localStorage.getItem('usuario'), "ACTIVIDAD": actividad }),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/GES00/estados';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  };

  getCalendarioGespro(Accion: string, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": Accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/GES00/calendario-gespro';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  };


  //GUARDADO DE DATOS:::
  saveActividades(Accion: string, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": Accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/GES00/nueva-actividad';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  };

  saveComentarios(Accion: string, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": Accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/GES00/save-comentarios';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  };

  deleteActividades(Accion: string, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": Accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/GES00/elimina-actividad';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  };

  saveConfigObjeto(Accion: string, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": Accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/generales/saveConfigObjeto';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  };

  getConsultaConfigObjeto(Accion: string, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": Accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/generales/consultaConfigObjeto';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  };

  saveArchivos(Accion: string, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": Accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/generales/save_document';
    return this.http.post<any>(url, body,
      { headers: { 'Content-Type': 'application/json' } }).
      pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  };

}
