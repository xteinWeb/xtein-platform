import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UbicacionesService {

	// Objetos públicos de intercambio de datos
  public send_DActividad: any;

	// Modos de edición de cada componente
  public readOnlyUbicaciones: any;

	// Observers para los componentes
  private subjectActividad = new Subject<any>();

	// Modos de operación
  accion: any;

  constructor() { }

	// Comunicación Principal-Ubicaciones
	setObj_Ubicaciones(prmDatos: any) {
		this.subjectActividad.next(prmDatos);
	}

	getObj_Ubicaciones(): Observable<any> {
		return this.subjectActividad.asObservable();
	}

}
