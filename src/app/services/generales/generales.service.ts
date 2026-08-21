import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";

import { BehaviorSubject, Observable, Subject, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { ImageFile } from "src/app/shared/img-manager/img-manager.component";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn: 'root'
  })
export class GeneralesService {

  private endPoint = environment.apiUrl;
  private endPointArchivos = environment.apiArchivos;
  private endPointResportes = environment.reportes;

  public apiData: any;
  public onDataChanged: BehaviorSubject<any>;
  public APLICACIONES: any [] = [];
  public D_USUARIOS: any [] = [];

  private subjectEmitAplicaciones = new Subject<any>();

  constructor(private http: HttpClient) {
    this.onDataChanged = new BehaviorSubject({});
  }

  //Emitir las aplicaciones del usuario
  setAplicaciones(prmDatos: any): void {
    this.subjectEmitAplicaciones.next(prmDatos);
  }
  getAplicaciones(): Observable<any> {
    return this.subjectEmitAplicaciones.asObservable();
  }

  // Obtiene la IP de conexion cliente local
  public getIPAddress()
  {
    return this.http.get("http://api.ipify.org/?format=json");
  }

  // API para Enviar correo electronico
  public sendMail(accion: any, prmDatos: any, aplicacion: any): Observable<any>
  {
    const prmJ = {
        "prmAccion": accion,
        "prmDatos": JSON.stringify(prmDatos),
        "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
        "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };

    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-','');
    let url = this.endPoint+'/generales/emailer';
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
  // API para Enviar correo electronico AUTOMATICO
  public sendMailAuto(accion: any, prmDatos: any, aplicacion: any): Observable<any>
  {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };

    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-','');
    let url = this.endPoint+'/generales/emailerAuto';
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


  // API de reportes para exportar PDF y devolver stream
  public ExportarPDF(prmDatos: any): Observable<Blob>
  {
    const body = JSON.stringify(prmDatos);
    // let params = new HttpParams().set("urlprm", encodeURIComponent(prmDatos));
    let url = this.endPointResportes+'/api/ApiReport/ExportPDF';
    return this.http.post<any>(url, body,
    { headers: {'Content-Type': 'application/json' },
      responseType : 'blob' as 'json'
    }).
    pipe(
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

  // Buscar Rutas tipo layout planta
  columnas(prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": "columnas",
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/generales/columnas';
    return this.http.post<any>(url, body,
    {headers: {'Content-Type': 'application/json' } }).
    pipe(
      map((vec: any) => {
        return vec;
      }),
      catchError((err) => {
        return throwError(() => new Error(err));
      })
    );
  }

  // Cargar archivo a la url de la aplicación
  cargar_archivo(ruta: any, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": ruta,
      "prmDatos": prmDatos,
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/generales/cargar_archivo';
    return this.http.post<any>(url, body,
    {headers: {'Content-Type': 'application/json' } }).
    pipe(
      map((vec: any) => {
        return vec;
      }),
      catchError((err) => {
        return throwError(() => new Error(err));
      })
    );
    }

  // Bajar archivo a la url de la aplicación
  bajar_archivo(accion: any, prmDatos: any, sqlProc: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      sqlProc,
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/generales/bajar_archivo';
    return this.http.post<any>(url, body,
    {headers: {'Content-Type': 'application/json' } }).
    pipe(
      map((vec: any) => {
        return vec;
      }),
      catchError((err) => {
        return throwError(() => new Error(err));
      })
        );
  }

  // Bajar imagenes a la url de la aplicación con varias opciones
  bajar_imagen(accion: any, prmDatos: any, sqlProc: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      sqlProc,
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/generales/bajar_imagen';
    return this.http.post<any>(url, body,
    {headers: {'Content-Type': 'application/json' } }).
    pipe(
      map((vec: any) => {
        return vec;
      }),
      catchError((err) => {
        return throwError(() => new Error(err));
      })
    );
  }

  // API para Enviar correo electronico
  public log(accion: any, prmDatos: any, aplicacion: any): Observable<any>
  {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };

    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-','');
    let url = this.endPoint+'/generales/log';
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
  getFechaComponents = (fecha) => {
    fecha = new Date(fecha)
    return {
      dia: fecha.getDate(),
      mes: fecha.toLocaleString('default', { month: 'short' }),
      mesName: fecha.toLocaleString('default', { month: 'long' }),
      mesFromatoNumero: fecha.getMonth() + 1,
      ano: fecha.getFullYear(),
      horas: String(fecha.getHours()).padStart(2, '0'),
      minutos: String(fecha.getMinutes()).padStart(2, '0'),
      segundos: String(fecha.getSeconds()).padStart(2, '0'),
    };
  };

  // Subir imágenes
  uploadImages(aplicacion: string, files: ImageFile[], apl_uso: string): Observable<any> {

    const filesImg: any[] = [];
    files.forEach((file, idx) => {
      filesImg.push({ name: file.name, base64: file.url, prefijo: file.item })
    });

    const prmJ = {
      "prmAccion": "uploadImages",
      "prmDatos": JSON.stringify({aplicacion: aplicacion, apl_uso: apl_uso}),
      "files": JSON.stringify(filesImg),
      "prmConexion": { EMPRESA: '00' },
      "prmTokenDatos": { USUARIO: 'XTEIN', EMPRESA: '00', TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IlhURUlOIiwiYnVzaW5lc3MiOiIwMCIsImNoZWNrIjp0cnVlLCJpYXQiOjE3NTI4NjkwNDAsImV4cCI6MTc1Mjg3MjY0MH0.MBDtgG4YT4hyKQkKfruJXcJs4iQ3uGu_lKVPhR9FdKc' }
    };

    const body = JSON.stringify(prmJ);

    // const formData = new FormData();
    // files.forEach((file, idx) => {
    //   formData.append('images', file.file!, file.file?.name);
    // });

    aplicacion = aplicacion.replace('-', '');
    const url = this.endPoint+`/MGD001/uploadImages`;
    return this.http.post<any>(url, body,
      { headers: {'Content-Type': 'application/json' } }).
      pipe(
      map((response: any) => response),
      catchError((err) => throwError(() => err))
    );
  }

  // Subir PDFs
  uploadPdfs(aplicacion: string, files: any[], apl_uso: string): Observable<any> {

    const filesPdf: any[] = [];
    files.forEach((file, idx) => {
      filesPdf.push({ name: file.name, base64: file.url, prefijo: file.item })
    });

    const prmJ = {
      "prmAccion": "uploadPdfs",
      "prmDatos": JSON.stringify({aplicacion: aplicacion, apl_uso: apl_uso}),
      "files": JSON.stringify(filesPdf),
      "prmConexion": { EMPRESA: '00' },
      "prmTokenDatos": { USUARIO: 'XTEIN', EMPRESA: '00', TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IlhURUlOIiwiYnVzaW5lc3MiOiIwMCIsImNoZWNrIjp0cnVlLCJpYXQiOjE3NTI4NjkwNDAsImV4cCI6MTc1Mjg3MjY0MH0.MBDtgG4YT4hyKQkKfruJXcJs4iQ3uGu_lKVPhR9FdKc' }
    };

    const body = JSON.stringify(prmJ);

    aplicacion = aplicacion.replace('-', '');
    const url = this.endPoint+`/MGD001/uploadImages`;
    return this.http.post<any>(url, body,
      { headers: {'Content-Type': 'application/json' } }).
      pipe(
        map((response: any) => response),
      catchError((err) => throwError(() => err))
    );
  }

  // Carga de datos con paginación
  loadPage(prmDatos: any, aplicacion: any, page: number, pageSize: number) {
    const prmJ = {
        "prmAccion": 'listaQuery',
        "prmDatos": JSON.stringify({ID_APLICACION: prmDatos.ID_APLICACION, USUARIO: prmDatos.USUARIO, PAGE: page, PAGE_SIZE: pageSize }),
        "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
        "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') },
    };
    aplicacion = aplicacion.replace('-','');
    const body = JSON.stringify(prmJ);
    let url = this.endPoint+'/generales/consulta';
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
