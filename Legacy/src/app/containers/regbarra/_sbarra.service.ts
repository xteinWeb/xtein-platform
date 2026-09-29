import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { clsBarraRegistro } from './_clsBarraReg';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SbarraService {
  private subjectOrd = new Subject<any>();
  private subjectBar = new Subject<any>();
  private subjectApl = new Subject<any>();

  private endPoint = environment.apiUrl;
	
  constructor(private http: HttpClient) { }

	// Configuracion de dactavilidad a la pantalla
	setOnResized(width: any) {
		this.subjectOrd.next(width);
	}

  	// genera observable
	getOnResized(): Observable<any> {
		return this.subjectOrd.asObservable();
	}

	// Paso de parámetros de configuracion
	setObsMenuReg(menureg: any) {
		this.subjectBar.next(menureg);
	}

  	// genera observable
	getObsMenuReg(): Observable<any> {
		return this.subjectBar.asObservable();
	}

	// Entrada de 
	setObsRegApl(menureg: any) {
		this.subjectApl.next(menureg);
	}

  	// genera observable
	getObsRegApl(): Observable<any> {
		return this.subjectApl.asObservable();
	}

	// Trae toda la configuracion del menú
	carguemenu(datosCfg: clsBarraRegistro): Observable<any> {
		const prmJ = {
			"prmAccion": 'OPERACIONES APLICACIONES USUARIO',
			"prmDatos": JSON.stringify(datosCfg),
			"prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
		};
		const body = JSON.stringify(prmJ);
		let url = this.endPoint+'/operacionesAplUsr';
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
	  
	}

	// Trae la lista de informes de la aplicación
	listaInformes(datosCfg: any): Observable<any> {
		const prmJ = {
			"prmAccion": 'LISTA INFORMES',
			"prmDatos": JSON.stringify(datosCfg),
			"prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      		"prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
		};
		const body = JSON.stringify(prmJ);
		let url = this.endPoint+'/listaInformes';
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
	  
	}

}
