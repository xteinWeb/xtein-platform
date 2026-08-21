import { Injectable, Output } from "@angular/core";
import { custShapesDiagrama, MVisor } from "./interface";
import { Observable, of, Subject } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { catchError, map } from "rxjs/operators";
import { EventEmitter } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class SVisorService {
  @Output() getObsVisor: EventEmitter<any> = new EventEmitter();
  @Output() setObsVisor: EventEmitter<any> = new EventEmitter();

  public DatosVisor: any;
  public PrmVisor: MVisor;
  public ColSort = { Columna: "", Clase: "" };
  private subject = new Subject<any>();

  constructor() {}

  // Asocia datos
  setDatosVisor(DatosV: any) {
    this.DatosVisor = DatosV;
  }

  // Parámetros del Visor
  getPrmVisor() {
    return this.PrmVisor;
  }

}

const SETTINGS_LOCATION = "./assets/libsvg.json";

@Injectable({
  providedIn: "root",
})
export class LibsvgService {
  custShapes: custShapesDiagrama[];

  constructor(private http: HttpClient) {}

  getArchivo(): Observable<custShapesDiagrama> {
    return this.http.get(SETTINGS_LOCATION).pipe(
      map((response: any) => {
        this.custShapes = response;
        return response || [{}];
      }),
      catchError((err) => {
        return this.handleErrors(err);
      })
    );
  }

  private handleErrors(error: any): Observable<custShapesDiagrama> {
    // Return default configuration values
    // alert(error);
    return of<custShapesDiagrama>(new custShapesDiagrama());
  }
}
