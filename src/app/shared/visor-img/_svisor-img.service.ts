import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, Subject, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SvisorRutasService {

  private endPoint = environment.apiUrl;

  public subject_ruta = new Subject<any>();

  constructor(private http: HttpClient) { }

  // Comunicación Ordenamiento atributos
  setObs_VisorRutas(prmDatos: any): void {
    this.subject_ruta.next(prmDatos);
  }
  getObs_VisorRutas(): Observable<any> {
    return this.subject_ruta.asObservable();
  }


  // Consultas
  consulta(accion: any, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };    
    const body = JSON.stringify(prmJ);    
    let url = this.endPoint+'/generales/visorImagen';
    return this.http.post<any>(url, body, { headers: {'Content-Type': 'application/json' } }).
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