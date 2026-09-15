import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SPasswordService {
  
  private endPoint = environment.apiUrl;

	private subjectPassword = new Subject<any>();

  constructor( private http:HttpClient ) { }

  setPassword(prmDatos: any) {
		this.subjectPassword.next(prmDatos);
	}
	getPassword(): Observable<any> {
		return this.subjectPassword.asObservable();
	}

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
