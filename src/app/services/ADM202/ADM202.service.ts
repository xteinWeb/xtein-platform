import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ADM202Service {

  private endPoint = environment.apiUrl;

  // Objetos públicos de intercambio de datos
  conCambios: number;
  public USUARIO: any;
  public FUDnegocios: any;
  public USUARIO_prev: any;
  public D_Identificacion: any;
  public D_Imagen: any[] = [];
  public D_Contabilidad: any;
  public readonly: any;
  // Modos de operación
  accion: any;

  // Modos de edición de cada componente
  public M_esEdicionIdentificacion: any;
  public M_esEdicionImagen: any;
  public M_esEdicionContabilidad: any;

  // Observers para los componentes
  private subject_Identificacion = new Subject<any>();
  private subject_Imagen = new Subject<any>();
  private subject_Contabilidad = new Subject<any>();
  private subject_Configuraciones = new Subject<any>();
  private subjectReadOnly = new Subject<any>();

  constructor(private http: HttpClient) { }

  getGrupos(prmDatos: any): Observable<any> {
    const prmJ = {
      prmAccion: 'grupos',
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: { EMPRESA: localStorage.getItem('empresa') },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token'),
      },
    };

    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/ADM202/consulta';

    return this.http
      .post<any>(url, body, {
        headers: {
          'Content-Type': 'application/json'
        },
      })
      .pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  }

  getConsecutivo(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      prmAccion: accion,
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: { EMPRESA: localStorage.getItem('empresa') },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token'),
      },
    };

    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-', '');
    let url = this.endPoint + '/' + aplicacion + '/consecutivo';
    return this.http
      .post<any>(url, body, {
        headers: {
          'Content-Type': 'application/json'
        },
      })
      .pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(() => new Error(err));
        })
      );
  }

  // Consultas varias
  consulta(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      prmAccion: accion,
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: { EMPRESA: localStorage.getItem('empresa') },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token'),
      },
    };

    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-', '');
    let url = this.endPoint + '/' + aplicacion + '/consulta';
    return this.http
      .post<any>(url, body, {
        headers: {
          'Content-Type': 'application/json'
        },
      })
      .pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(() => new Error(err));
        })
      );
  }

  save(prmAccion: any, prmDatos: any): Observable<any> {
    const prmJ = {
      prmAccion: prmAccion,
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: { EMPRESA: localStorage.getItem('empresa') },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token'),
      },
    };

    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/ADM202/save';

    return this.http
      .post<any>(url, body, {
        headers: {
          'Content-Type': 'application/json'
        },
      })
      .pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(() => new Error(err));
        })
      );
  }

  delete(prmAccion: any, prmDatos: any): Observable<any> {
    const prmJ = {
      prmAccion: prmAccion,
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: { EMPRESA: localStorage.getItem('empresa') },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token'),
      },
    };

    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/ADM202/' + prmAccion;

    return this.http
      .post<any>(url, body, {
        headers: {
          'Content-Type': 'application/json'
        },
      })
      .pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  }

  areasAsociadas(prmAccion: any, prmDatos: any): Observable<any> {
    const prmJ = {
      prmAccion: prmAccion,
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: { EMPRESA: localStorage.getItem('empresa') },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token'),
      },
    };

    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/ADM202/areasAsociadas';

    return this.http
      .post<any>(url, body, {
        headers: {
          'Content-Type': 'application/json'
        },
      })
      .pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  }

  // Valida existencia de una llave de la tabla
  validellave(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      prmAccion: accion,
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: { EMPRESA: localStorage.getItem('empresa') },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token'),
      },
    };

    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-', '');
    let url = this.endPoint + '/' + aplicacion + '/consulta';
    return this.http
      .post<any>(url, body, {
        headers: {
          'Content-Type': 'application/json'
        },
      })
      .pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(() => new Error(err));
        })
      );
  }

  getIntegridad(Accion: string, prmDatos: any): Observable<any> {
    const prmJ = {
      prmAccion: Accion,
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: { EMPRESA: localStorage.getItem('empresa') },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token'),
      },
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/ADM202/integridad';
    return this.http
      .post<any>(url, body, {
        headers: {
          'Content-Type': 'application/json'
        },
      })
      .pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(err);
        })
      );
  }


  setReadOnly(prmDatos: any) {
    this.subjectReadOnly.next(prmDatos);
  }

  getReadOnly(): Observable<any> {
    return this.subjectReadOnly.asObservable();
  }

  setObs_Identificacion(prmDatos: any): void {
    this.subject_Identificacion.next(prmDatos);
  }
  getObs_Identificacion(): Observable<any> {
    return this.subject_Identificacion.asObservable();
  }
  getObs_Imagen(): Observable<any> {
    return this.subject_Imagen.asObservable();
  }

  setObs_Imagen(prmDatos: any): void {
    this.subject_Imagen.next(prmDatos);
  }
  setObs_Contabilidad(prmDatos: any): void {
    this.subject_Contabilidad.next(prmDatos);
  }
  getObs_Contabilidad(): Observable<any> {
    return this.subject_Contabilidad.asObservable();
  }
  setObs_Configuraciones(prmDatos: any): void {
    this.subject_Configuraciones.next(prmDatos);
  }
  getObs_Configuraciones(): Observable<any> {
    return this.subject_Configuraciones.asObservable();
  }
}
