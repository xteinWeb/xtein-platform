import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PasosService {
  private subjectPasos = new Subject<any>();

  constructor() { 
  }

	// Entrada de 
	setObsPasos(dato: any) {
		this.subjectPasos.next(dato);
	}

  	// genera observable
	getObsPasos(): Observable<any> {
		return this.subjectPasos.asObservable();
	}

}
