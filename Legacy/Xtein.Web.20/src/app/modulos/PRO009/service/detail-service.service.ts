import { EventEmitter, Injectable, Output } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DetailServiceService {

	@Output() dataSecciones: EventEmitter<any> = new EventEmitter();

	public esEdicion: boolean = false;
	public DEsecciones: any = [];

  private subjectEMPsecciones = new Subject<any>();
  private subjectDETsecciones = new Subject<any>();

  constructor() { }

	setEMPSecciones(datosemp: any) {
		this.subjectEMPsecciones.next(datosemp);
	}

	getEMPSecciones(): Observable<any> {
		return this.subjectEMPsecciones.asObservable();
	}

	setDETSecciones(datosdet: any) {
		this.subjectDETsecciones.next(datosdet);
	}

	getDETSecciones(): Observable<any> {
		return this.subjectDETsecciones.asObservable();
	}

}
