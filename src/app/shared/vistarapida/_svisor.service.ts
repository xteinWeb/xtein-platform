import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, Output } from '@angular/core';
import { catchError, map, Observable, Subject, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SvisorService {
  
  private endPoint = environment.apiUrl;

  public subject_Visor = new Subject<any>();
  public subject_Apl = new Subject<any>();

  public DatosVisor: any;
  public PrmVisor: any;
  public ColSort = { Columna: "", Clase: "" };

  constructor(private http: HttpClient) { }
  
  // Asocia datos
  setDatosVisor(DatosV: any) {
    this.DatosVisor = DatosV;
  }

  // Parámetros del Visor
  getPrmVisor() {
    return this.PrmVisor;
  }

  // Comunicación Ordenamiento atributos
  setObs_Visor(prmDatos: any): void {
    this.subject_Visor.next(prmDatos);
  }
  getObs_Visor(): Observable<any> {
    return this.subject_Visor.asObservable();
  }
  // Comunicación Ordenamiento atributos
  setObs_Apl(prmDatos: any): void {
    this.subject_Apl.next(prmDatos);
  }
  getObs_Apl(): Observable<any> {
    return this.subject_Apl.asObservable();
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
        console.log('Error API ',err)
        return throwError(() => new Error(err));
        })
    );
  }

}
