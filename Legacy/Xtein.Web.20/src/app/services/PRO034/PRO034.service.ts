import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PRO034Service {

    private endPoint = environment.apiUrl;

    constructor(private http: HttpClient) { }

    // Generic query method
    consulta(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
        const prmJ = {
            "prmAccion": accion,
            "prmDatos": JSON.stringify(prmDatos),
            "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
            "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
        };

        const body = JSON.stringify(prmJ);
        aplicacion = aplicacion.replace('-', '');
        let url = this.endPoint + '/' + aplicacion + '/consulta';
        return this.http.post<any>(url, body,
            { headers: { 'Content-Type': 'application/json' } }).
            pipe(
                map((vec: any) => {
                    return vec;
                }),
                catchError((err) => {
                    return throwError(() => new Error(err));
                })
            );
    }

    // Get Plans for the dropdown (Reusing PRO023 logic)
    getPlanes(prmDatos: any): Observable<any> {
        const prmJ = {
            "prmAccion": 'get-pmp',
            "prmDatos": JSON.stringify(prmDatos),
            "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
            "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
        };

        const body = JSON.stringify(prmJ);
        let url = this.endPoint + '/PRO023/get-pmp';

        return this.http.post<any>(url, body,
            { headers: { 'Content-Type': 'application/json' } }).
            pipe(
                map((vec: any) => {
                    return vec;
                }),
                catchError((err) => {
                    return throwError(err);
                })
            );
    };

    save(prmAccion: any, prmDatos: any): Observable<any> {
        const prmJ = {
            "prmAccion": prmAccion,
            "prmDatos": JSON.stringify(prmDatos),
            "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
            "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
        };

        const body = JSON.stringify(prmJ);
        let url = this.endPoint + '/PRO023/save';

        return this.http.post<any>(url, body,
            { headers: { 'Content-Type': 'application/json' } }).
            pipe(
                map((vec: any) => {
                    return vec;
                }),
                catchError((err) => {
                    return throwError(() => new Error(err));
                })
            );
    };

    consulta_fechas(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
        const prmJ = {
            "prmAccion": accion,
            "prmDatos": JSON.stringify(prmDatos),
            "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
            "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
        };

        const body = JSON.stringify(prmJ);
        aplicacion = aplicacion.replace('-', '');
        let url = this.endPoint + '/' + aplicacion + '/calcular_fechas';
        return this.http.post<any>(url, body,
            { headers: { 'Content-Type': 'application/json' } }).
            pipe(
                map((vec: any) => {
                    return vec;
                }),
                catchError((err) => {
                    return throwError(() => new Error(err));
                })
            );
    }

    postToWebhook(payload: any): Observable<any> {
        return this.http.post(environment.webhookNotifyUrl, payload);
    }
}
