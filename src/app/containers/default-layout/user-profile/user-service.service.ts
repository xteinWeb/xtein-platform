import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {
  
	private subjectUserProfile = new Subject<any>();
  private endPoint = environment.apiUrl;

  constructor( private http:HttpClient ) { }

  setUserProfile(prmDatos: any) {
		this.subjectUserProfile.next(prmDatos);
	}
	getUserProfile(): Observable<any> {
		return this.subjectUserProfile.asObservable();
	}

	getDataUser(accion: string, prmDatos: any): Observable<any> {
		const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);

    let url = this.endPoint+'/infoUsuario';
    return this.http.post<any>(url, body,
      {headers: {'Content-Type': 'application/json' } }).
      pipe(
      map((vec: any) => {
        return vec;
      }),
      catchError((err) => {
        console.error('Error API ',err+' .... '+url)
        return throwError(err);
      })
    );
	};

}
