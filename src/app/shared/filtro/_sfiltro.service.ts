import { EventEmitter, Injectable, Output } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SfiltroService {

  @Output() getObsFiltro: EventEmitter<any> = new EventEmitter();
  @Output() setObsFiltro: EventEmitter<any> = new EventEmitter();

  public DatosFiltro: any;
  public PrmFiltro: any;
  public enConsulta: boolean = false;
  public ColSort = { Columna: "", Clase: "" };
  private subject = new Subject<any>();

  constructor() { }
  
  // Asocia datos
  setDatosFiltro(DatosV: any) {
    this.DatosFiltro = DatosV;
  }

  // Parámetros del Filtro
  getPrmFiltro() {
    return this.PrmFiltro;
  }
}
