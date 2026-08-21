import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SxalertService {

  private subject_alert = new Subject<any>();
  private subject_accion = new Subject<any>();

  constructor() { }

  // Comunicación opciones de alert
  setAlert(prmDatos: any): void {
    this.subject_alert.next(prmDatos);
  }
  getAlert(): Observable<any> {
    return this.subject_alert.asObservable();
  }
  setAccion(prmDatos: any): void {
    this.subject_accion.next(prmDatos);
  }
  getAccion(): Observable<any> {
    return this.subject_accion.asObservable();
  }
  
}
