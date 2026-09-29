import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Condicion } from 'src/app/modulos/FIN230/FIN230.class';

@Injectable({
  providedIn: 'root'
})
export class FIN230Service {
  // Cambia esta URL por la URL de tu API
  private endPoint = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los empleados
  getEmpleados(): Observable<Condicion[]> {
    return this.http.get<Condicion[]>(this.endPoint);
  }

  // Obtener un empleado por ID
  getEmpleado(id: string): Observable<Condicion> {
    return this.http.get<Condicion>(`${this.endPoint}/${id}`);
  }

  // Crear nuevo empleado
  createEmpleado(empleado: Condicion): Observable<Condicion> {
    return this.http.post<Condicion>(this.endPoint, empleado, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  // Actualizar empleado
  updateEmpleado(id: string, empleado: Condicion): Observable<Condicion> {
    return this.http.put<Condicion>(`${this.endPoint}/${id}`, empleado, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  // Eliminar empleado
  deleteEmpleado(id: string): Observable<any> {
    return this.http.delete(`${this.endPoint}/${id}`);
  }

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
            return throwError(() => err);
        })
    );
  }

  save(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
        "prmAccion": accion,
        "prmDatos": JSON.stringify(prmDatos),
        "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
        "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    
    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-','');
    let url = this.endPoint+'/'+aplicacion+'/save';
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

  delete(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
        "prmAccion": accion,
        "prmDatos": JSON.stringify(prmDatos),
        "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
        "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);
    aplicacion = aplicacion.replace('-','');
    let url = this.endPoint+'/'+aplicacion+'/delete';
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
  };


}
