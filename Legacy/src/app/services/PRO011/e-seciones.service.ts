import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable, Subject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SSeccionesdpService {
  private subject = new Subject<any>();
  public datosEdicionSeccDP: any;
  public datosSeccionesSelecc: any;

  constructor(private http: HttpClient) {
  }

  datosSeccDP: any;
  async getSeccRutasDP(IdRuta: string) {
    // Datos de secciones
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      }),
    };
    const prmRuta = { ID_RUTA: IdRuta };
    const prmJ = {
      "prmAccion": "SECCIONES RUTAS DP",
      "prmDatos": JSON.stringify(prmRuta),
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const url = `${environment.apinet}/XPro/AccionSQL`;
    const body = JSON.stringify(prmJ);
    await this.http
      .post(url, body, httpOptions)
      .toPromise()
      .then((result) => (this.datosSeccDP = result))
      .catch((error) => console.log(error));

    return this.datosSeccDP; // you can return what you want here
  }

  // Paso del parámetro de la ruta
  setDatosSeleccionDP(vdatselecc: any): void {
    this.datosEdicionSeccDP = vdatselecc;
  }

  // Paso del parámetro de la ruta
  setObsDatosSeccDP(prmRuta: string): void {
    this.subject.next(prmRuta);
  }

  getObsDatosSeccDP(): Observable<any> {
    return this.subject.asObservable();
  }
}
