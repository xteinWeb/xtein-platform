import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class PRO007Service {

  private endPoint = environment.apiUrl;

  // Objetos públicos de intercambio de datos
  public PRODUCTO: any;
  public NOMBRE_PRODUCTO: string;
  public PRODUCTO_CLASE: string;
  public LGrupos: any;
  public D_Atributos: any [];
  public D_Partes: any [];
  public D_Espec: any [];
  public D_Compo: any [];
  public D_Proveedores: any [];
  public D_Combos: any [];
  public D_Bodegas: any [];
  public D_Cubicaje: any [];
  public D_Documentacion: any [];
  public D_Presentacion: any [];

  // Modos de edición de cada componente
  public M_esEdicionAtr: any;
  public M_esEdicionPartes: any;
  public M_esEdicionEspec: any;
  public M_esEdicionCompo: any;
  public M_esEdicionProv: any;
  public M_esEdicionCombo: any;
  public M_esEdicionBodegas: any;
  public M_esEdicionCubicaje: any;
  public M_esEdicionDocum: any;
  public M_esEdicionPres: any;

  // Observers para los componentes
  private subject_OrdenAtr = new Subject<any>();
  private subject_Pro = new Subject<any>();
  private subject_ProAtr = new Subject<any>();
  private subject_ProPartes = new Subject<any>();
  private subject_ProEspec = new Subject<any>();
  private subject_ProCompo = new Subject<any>();
  private subject_Proveedores = new Subject<any>();
  private subject_Combos = new Subject<any>();
  private subject_Bodegas = new Subject<any>();
  private subject_Cubicaje = new Subject<any>();

  // Modos de operación
  accion: any;
  conCambios: number;
  
  constructor(private http:HttpClient) { }

  // Inicializa variables de estado edicion
  iniStatus() {
    this.M_esEdicionAtr = false;
    this.M_esEdicionPartes = false;
    this.M_esEdicionEspec = false;
    this.M_esEdicionCompo = false;
    this.M_esEdicionProv = false;
    this.M_esEdicionCombo = false;
    this.M_esEdicionBodegas = false;
  }

  // Comunicación Ordenamiento atributos
  setObs_OrdenAtr(prmDatos: any): void {
    this.subject_OrdenAtr.next(prmDatos);
  }
  getObs_OrdenAtr(): Observable<any> {
    return this.subject_OrdenAtr.asObservable();
  }


  // Comunicación de Productos a los demás elementos
  setObs_Productos(prmDatos: any): void {
    this.subject_Pro.next(prmDatos);
  }
  getObs_Productos(): Observable<any> {
    return this.subject_Pro.asObservable();
  }

  // Comunicación Productos-Atributos
  setObs_ProAtributos(prmDatos: any): void {
    this.subject_ProAtr.next(prmDatos);
  }
  getObs_ProAtributos(): Observable<any> {
    return this.subject_ProAtr.asObservable();
  }

  // Comunicación Productos-Partes
  setObs_ProPartes(prmDatos: any): void {
    this.subject_ProPartes.next(prmDatos);
  }
  getObs_ProPartes(): Observable<any> {
    return this.subject_ProPartes.asObservable();
  }

  // Comunicación Productos-Especificaciones
  setObs_ProEspec(prmDatos: any): void {
    this.subject_ProEspec.next(prmDatos);
  }
  getObs_ProEspec(): Observable<any> {
    return this.subject_ProEspec.asObservable();
  }

  // Comunicación Productos-Composicion
  setObs_ProCompo(prmDatos: any): void {
    this.subject_ProCompo.next(prmDatos);
  }
  getObs_ProCompo(): Observable<any> {
    return this.subject_ProCompo.asObservable();
  }

  // Comunicación Productos-Proveedores
  setObs_Proveedores(prmDatos: any): void {
    this.subject_Proveedores.next(prmDatos);
  }
  getObs_Proveedores(): Observable<any> {
    return this.subject_Proveedores.asObservable();
  }

  // Comunicación Productos-Combos
  setObs_Combos(prmDatos: any): void {
    this.subject_Combos.next(prmDatos);
  }
  getObs_Combos(): Observable<any> {
    return this.subject_Combos.asObservable();
  }

  // Comunicación Productos-Bodegas
  setObs_Bodegas(prmDatos: any): void {
    this.subject_Bodegas.next(prmDatos);
  }
  getObs_Bodegas(): Observable<any> {
    return this.subject_Bodegas.asObservable();
  }

  // Comunicación Productos-Cubicaje
  setObs_Cubicaje(prmDatos: any): void {
    this.subject_Cubicaje.next(prmDatos);
  }
  getObs_Cubicaje(): Observable<any> {
    return this.subject_Cubicaje.asObservable();
  }

  getAtributos(prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": "atributos",
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    
    const body = JSON.stringify(prmJ);    
    let url = this.endPoint+'/getAtributos';
    
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
	};

    getDominios(prmDatos: any): Observable<any> {
      const prmJ = {
        "prmAccion": "clases atributos",
        "prmDatos": JSON.stringify(prmDatos),
        "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
        "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
      };
      
      const body = JSON.stringify(prmJ);    
      let url = this.endPoint+'/getClasesAtributos';
      
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
    };

    getConsecutivo(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
      const prmJ = {
        "prmAccion": accion,
        "prmDatos": JSON.stringify(prmDatos),
        "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
        "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
      };
      
      const body = JSON.stringify(prmJ);    
      aplicacion = aplicacion.replace('-','');
      let url = this.endPoint+'/'+aplicacion+'/consecutivo';
      return this.http.post<any>(url, body,
        { headers: {'Content-Type': 'application/json' } }).
        pipe(
        map((vec: any) => {
        return vec;
        }),
        catchError((err) => {
        return throwError(() => new Error(err));
        })
      );
    }

    getExitencias(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
      const prmJ = {
        "prmAccion": accion,
        "prmDatos": JSON.stringify(prmDatos),
        "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
        "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
      };
      const body = JSON.stringify(prmJ);   
      aplicacion = aplicacion.replace('-','');
      let url = this.endPoint+'/'+aplicacion+'/existencias-producto';
      return this.http.post<any>(url, body,
        { headers: {'Content-Type': 'application/json' } }).
        pipe(
        map((vec: any) => {
        return vec;
        }),
        catchError((err) => {
        return throwError(() => new Error(err));
        })
      );
    }

    // Consultas varias
    consulta(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
      const prmJ = {
        "prmAccion": accion,
        "prmDatos": JSON.stringify(prmDatos),
        "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
        "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
      };
      
      const body = JSON.stringify(prmJ);    
      aplicacion = aplicacion.replace('-','');
      let url = this.endPoint+'/'+aplicacion+'/consulta';
      return this.http.post<any>(url, body,
        { headers: {'Content-Type': 'application/json' } }).
        pipe(
        map((vec: any) => {
        return vec;
        }),
        catchError((err) => {
        return throwError(() => new Error(err));
        })
      );
    }

    // Consultas Bodegas
    bodegas(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
      const prmJ = {
        "prmAccion": accion,
        "prmDatos": JSON.stringify(prmDatos),
        "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
        "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
      };
      
      const body = JSON.stringify(prmJ);    
      aplicacion = aplicacion.replace('-','');
      let url = this.endPoint+'/'+aplicacion+'/bodegas';
      return this.http.post<any>(url, body,
        { headers: {'Content-Type': 'application/json' } }).
        pipe(
        map((vec: any) => {
        return vec;
        }),
        catchError((err) => {
        return throwError(() => new Error(err));
        })
      );
    }

    // Guardar registro -> ejecutar de acuerdo a la acción
    save(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
      const prmJ = {
        "prmAccion": accion,
        "prmDatos": JSON.stringify(prmDatos),
        "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
        "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
      };
      
      const body = JSON.stringify(prmJ);    
      aplicacion = aplicacion.replace('-','');
      let url = this.endPoint+'/'+aplicacion+'/'+accion;
      return this.http.post<any>(url, body,
        { headers: {'Content-Type': 'application/json' } }).
        pipe(
        map((vec: any) => {
        return vec;
        }),
        catchError((err) => {
        return throwError(() => new Error(err));
        })
      );
    }

update(prmAccion: any, prmDatos: any): Observable<any> {
  const prmJ = {
    "prmAccion": prmAccion,
    "prmDatos": JSON.stringify(prmDatos),
    "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
    "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
  };

  // Llama a la api de update
  const body = JSON.stringify(prmJ);    
  let url = this.endPoint+'/PRO008/'+prmAccion;
  
  return this.http.post<any>(url, body,
    {headers: {'Content-Type': 'application/json' } }).
      pipe(
      map((vec: any) => {
        return vec;
      }),
      catchError((err) => {
        return throwError(() => new Error(err));
      })
    );
};

  delete(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      "prmAccion": 'delete',
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    const body = JSON.stringify(prmJ);    
    aplicacion = aplicacion.replace('-','');
    let url = this.endPoint+'/'+aplicacion+'/'+accion;
    return this.http.post<any>(url, body,
      { headers: {'Content-Type': 'application/json' } }).
      pipe(
      map((vec: any) => {
      return vec;
      }),
      catchError((err) => {
      return throwError(() => new Error(err));
      })
    );
};

  empleadosSecciones(prmAccion: any, prmDatos: any): Observable<any> {
    const prmJ = {
      "prmAccion": prmAccion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    
    const body = JSON.stringify(prmJ);    
    let url = this.endPoint+'/PRO009/'+prmAccion;
    
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
	};

  // Valida existencia de una llave de la tabla
  validellave(accion: any, prmDatos: any, aplicacion: any): Observable<any> {
    const prmJ = {
      "prmAccion": accion,
      "prmDatos": JSON.stringify(prmDatos),
      "prmConexion": { EMPRESA: localStorage.getItem('empresa') },
      "prmTokenDatos": { USUARIO: localStorage.getItem('usuario'), EMPRESA: localStorage.getItem('empresa'), TOKEN: localStorage.getItem('token') }
    };
    
    const body = JSON.stringify(prmJ);    
    aplicacion = aplicacion.replace('-','');
    let url = this.endPoint+'/'+aplicacion+'/consulta';
    return this.http.post<any>
      (url, 
        body,
        { headers: {'Content-Type': 'application/json' } })
        .pipe(
        map((vec: any) => {
        return vec;
      }),
      catchError((err) => {
        return throwError(() => new Error(err));
      })
  );
  }


}
