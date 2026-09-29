import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { DxDateBoxModule, DxFormComponent, DxFormModule, DxNumberBoxModule, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { Subject, takeUntil } from 'rxjs';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import Swal from 'sweetalert2';
import { showToast } from '../../shared/toast/toastComponent';
import { PRO033Service } from 'src/app/services/PRO033/PRO033.service';
import { FiltrobusqComponent } from 'src/app/shared/filtrobusq/filtrobusq.component';

@Component({
  selector: 'app-PRO033',
  templateUrl: './PRO033.component.html',
  styleUrls: ['./PRO033.component.css'],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxNumberBoxModule, DxSelectBoxModule, DxTextBoxModule, DxDateBoxModule, FiltrobusqComponent]
})
export class PRO033Component {
  @ViewChild("formPlanesProd", { static: false }) formPlanesProd: DxFormComponent;

  unSubscribe: Subject<boolean> = new Subject<boolean>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();
  eventsSubjectFiltro: Subject<any> = new Subject<any>();

  mnuAccion: string = '';
  esVisibleSelecc: string = 'none';
  conCambios: number = 0;

  subscription: any;
  subs_filtro: any;
  subs_visor: any;
  prmUsrAplBarReg: any = { aplicacion: '' };
  VDatosReg: any[] = [];
  QFiltro: any;

  USUARIO_LOCAL: any = '';
  FPlanes: any = {};
  readOnly: boolean = true;
  loadingVisible: boolean = false;

  type = 'info'
  toaVisible: boolean;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';
  positionOf: string;


  constructor(
    private sData: PRO033Service,
    private _sbarreg: SbarraService,
    private tabService: TabService,
    private _sfiltro: SfiltroService,
    private datepipe: DatePipe,
    private SVisor: SvisorService
  ) {

    this.subscription = this._sbarreg
      .getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((datreg) => {
        if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(datreg);
      });

    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe(resp => {
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opPrepararBuscar(resp);
    });

    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex((d: any) => d.ITEM === resp.ITEM);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    });

  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'PLANES_PRODUCCION',
      aplicacion: 'PRO-033',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_modificar: true }
    };
    this.readOnly = true;
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.valoresObjetos('todos');
  }
  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
    if (this.subs_filtro) this.subs_filtro.unsubscribe();
    if (this.subs_visor) this.subs_visor.unsubscribe();
  }

  // Unificada: Llama a Acciones de registro
  opMenuRegistro(operMenu: any): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.prmUsrAplBarReg = {
          tabla: "PLANES_PRODUCCION",
          aplicacion: "PRO-033",
          usuario: this.USUARIO_LOCAL,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_refrescar: false }
        };
        break;
      case "r_nuevo":
        this.mnuAccion = "new";
        this.readOnly = false;
        this.opPrepararNuevo();
        break;
      case "r_modificar":
        this.opPrepararModificar();
        break;
      case "r_guardar":
        this.opPrepararGuardar();
        break;
      case "r_buscar":
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          this.toaMessage = 'Consulta en proceso, por favor espere.';
          this.toaVisible = true;
          this.toaTipo = 'warning';
        }
        break;
      case "r_buscar_ejec":
        this.opBlanquearForma();
        if (operMenu.operacion.filtro_arg) {
          this.opPrepararBuscar(operMenu.operacion.filtro_arg)
        }
        else {
          if (this._sfiltro.enConsulta === false) {
            this.opPrepararBuscar('');
          } else {
            showToast('Consulta en proceso, por favor espere.', 'warning');
          }
        }
        break;
      case "r_eliminar":
        this.opEliminar();
        break;
      case "r_primero":
      case "r_anterior":
      case "r_siguiente":
      case "r_ultimo":
      case "r_numreg":
        this.opIrARegistro(operMenu.accion);
        this.esVisibleSelecc = 'none';
        break;
      case "r_cancelar":


        var mensaje = '¿Desea cancelar la operación?';
        if (this.conCambios != 0) mensaje = '¿Desea cancelar sin guardar cambios?';
        Swal.fire({
          title: '',
          text: mensaje,
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} }
            // Restituye los valores
            this.mnuAccion = "";
            this.esVisibleSelecc = 'none';
            this.readOnly = true;
            this.conCambios = 0;

            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.mnuAccion = "";
            this.opIrARegistro('r_numreg');
          }
        });

        break;
      case "r_copiar":
        // Implementar lógica de copiar si es necesario
        break;
      case "r_vista":
        this.opVista();
        break;
      case 'r_refrescar':
        // Implementar lógica de refrescar si es necesario
        break;
      case "r_imprimir":
        this.imprimirReporte(operMenu);
        break;
      default:
        break;
    }
  }


  opPrepararBuscar(accion): void {
    if (accion === "filtro") {

      // this._sfiltro.PrmFiltro = {
      //   Titulo: "Datos de filtro para Acreedores",
      //   accion: "PREPARAR FILTRO",
      //   Filtro: "",
      //   TablaBase: this.prmUsrAplBarReg.tabla,
      //   aplicacion: this.prmUsrAplBarReg.aplicacion
      // };
      // this._sfiltro.getObsFiltro.emit(true);

      const prmFiltro = {
        Titulo: "Datos de filtro para Planes Produccion",
        accion: "activar",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
        objRegistro: this._sbarreg,
        objTab: this.tabService,
        usuario: this.prmUsrAplBarReg.usuario,
        title: 'Planes Produccion'
      };
      this.eventsSubjectFiltro.next(prmFiltro);

    }
    else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { PLANES_PRODUCCION: arrFiltro };

      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this.sData
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje === '') {
            // Asocia datos
            if (datares ?? '' != '') {
              this.VDatosReg = datares;
              this.FPlanes = datares[0];
              this.QFiltro = datares[0].QFILTRO;
            }

          } else {
            this.VDatosReg = [];
            this.loadingVisible = false;
            //notificació
            showToast(datares[0].ErrMensaje, 'warning');
            //this.opBlanquearForma();
          }
          // Prepara la barra para navegación
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            r_totReg: datares.length,
            r_numReg: 1,
            accion: 'r_navegar',
            operacion: {}
          }
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

          // Trae los items en los componentes asociados
          this.opIrARegistro('r_primero');
          this.loadingVisible = false;
          this._sfiltro.enConsulta = false;
        });
    }
  }
  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        this.prmUsrAplBarReg.r_numReg = 1;
        if (this.VDatosReg.length != 0) {
          this.FPlanes = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.FPlanes = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.FPlanes = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.FPlanes = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_numreg":
        if (this.prmUsrAplBarReg.r_numReg !== 0) {
          // Valida si hubo cambio de ordenamiento en el visor
          if (this.SVisor.ColSort.Columna !== "") {
            if (this.SVisor.ColSort.Clase === "asc") {
              this.VDatosReg = this.VDatosReg.sort((a: any, b: any) =>
                a[this.SVisor.ColSort.Columna].toUpperCase() <
                  b[this.SVisor.ColSort.Columna].toUpperCase()
                  ? -1
                  : 1
              );
            } else {
              this.VDatosReg = this.VDatosReg.sort((a: any, b: any) =>
                a[this.SVisor.ColSort.Columna].toUpperCase() >
                  b[this.SVisor.ColSort.Columna].toUpperCase()
                  ? -1
                  : 1
              );
            }
          }
        }
        else {
          this.opBlanquearForma();
          setTimeout(() => {
            this.formPlanesProd.instance.resetValues();
          }, 100);
        }
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          this.FPlanes =
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        }
        this.prmUsrAplBarReg.r_totReg = this.VDatosReg.length;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      default:
        break;
    }

    try {
      // this.FPlanes.FECHA_INICIO = this.datepipe.transform(this.FPlanes.FECHA_INICIO, 'dd/MM/yyyy');
      // this.FPlanes.FECHA_FINAL = this.datepipe.transform(this.FPlanes.FECHA_FINAL, 'dd/MM/yyyy');
      // filepath: c:\Users\admin_artdecon\xtein-web-2.0\src\app\modulos\PRO033\PRO033.component.ts
      // ...existing code...
      if (this.FPlanes.FECHA_INICIO && !(this.FPlanes.FECHA_INICIO instanceof Date)) {
        this.FPlanes.FECHA_INICIO = new Date(this.FPlanes.FECHA_INICIO);
      }
      if (this.FPlanes.FECHA_FINAL && !(this.FPlanes.FECHA_FINAL instanceof Date)) {
        this.FPlanes.FECHA_FINAL = new Date(this.FPlanes.FECHA_FINAL);
      }
      // ...existing code... 
      this.readOnly = true;
    } catch (error) {
      this.showModal(error);
    }
  }
  opPrepararNuevo(): void {
    this.mnuAccion = "new";
    this.readOnly = false;
    this.opBlanquearForma();
    this.FPlanes.ESTADO = 'ACTIVO';
    this.FPlanes.FECHA_REGISTRO = new Date();
    this.FPlanes.FECHA_UPDATE = new Date();
    this.valoresObjetos('consecutivo');
  }

  opPrepararModificar(): void {
    // Lógica para preparar modificación
    this.mnuAccion = "update";
    this.readOnly = false;
    this.esVisibleSelecc = 'always';
  }

  opBlanquearForma(): void {
    this.FPlanes = {
      CONSECUTIVO: null,
      NOMBRE: '',
      FECHA_INICIO: null,
      FECHA_FINAL: null,
      ESTADO: '',
      FECHA_REGISTRO: null,
      FECHA_UPDATE: null
    };
  }

  opPrepararGuardar(): void {
    if (this.conCambios > 0) {

      if (this.FPlanes.FECHA_FINAL < this.FPlanes.FECHA_INICIO) {
        this.showModal('La Fecha Final no puede ser menor a la Fecha Inicial', 'Validación');
        return;
      }

      this.loadingVisible = true;
      this.readOnly = true;
      this.conCambios = 0;

      const prmDatos: any = {
        ID_UN: this.FPlanes.ID_UN,
        CONSECUTIVO: this.FPlanes.CONSECUTIVO,
        NOMBRE: this.FPlanes.NOMBRE,
        ESTADO: this.FPlanes.ESTADO,
        FECHA_INICIO: this.datepipe.transform(this.FPlanes.FECHA_INICIO, 'yyyy-MM-dd'),
        FECHA_FINAL: this.datepipe.transform(this.FPlanes.FECHA_FINAL, 'yyyy-MM-dd'),
        FECHA_REGISTRO: this.datepipe.transform(this.FPlanes.FECHA_REGISTRO, 'yyyy-MM-dd'),
        FECHA_UPDATE: this.datepipe.transform(new Date(), 'yyyy-MM-dd'),
      };
      this.sData.save(this.mnuAccion, prmDatos, 'PRO-033').subscribe((resp) => {
        this.loadingVisible = false;
        const res = JSON.parse(resp.data);
        if ((resp.token != undefined)) {
          const refreshToken = resp.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== "") {
          this.readOnly = false;
          this.showModal(res[0].ErrMensaje, 'Error');
        } else {
          // Operaciones de barra
          if (this.mnuAccion === 'new') {
            this.QFiltro = "CONSECUTIVO='" + this.FPlanes.CONSECUTIVO + "'";
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              r_numReg: 1,
              r_totReg: 1,
              operacion: {}
            };
          } else {
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              operacion: {}
            };
          }
          this.readOnly = true;
          showToast('Registro actualizado', 'success');
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }
      });



    } else {
      showToast('No hay cambios por guardar', 'error');
    }
  }


  opEliminar(): void {
    Swal.fire({
      title: '',
      text: '',
      html:
        'Desea eliminar el PLAN <i>' +
        this.FPlanes.NOMBRE +
        '</i> ?',
      iconHtml: "<i class='icon-alert-ol'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar',
    }).then((result) => {
      // Procesa eliminación. Llama a la API para validar referenciación y eliminación en tabla
      if (result.isConfirmed) {
        this.AccionEliminar();
      }
    });
  }


  AccionEliminar(): void {
    // API eliminación de datos
    const prm = { CONSECUTIVO: this.FPlanes.CONSECUTIVO };
    this.sData
      .delete('delete', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'error');
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        showToast('Plan eliminada!', 'success');
        this.readOnly = true;

        // Operaciones de barra
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          error: '',
          accion: 'r_navegar',
          operacion: { r_copiar: false },
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.opIrARegistro("Eliminado");
      });
  }



  opVista(): void {
    // Lógica para vista/zoom de datos
  }

  onValueChanged($event: any, campo: string) {
    if (this.readOnly && !this.mnuAccion.match('new|update')) return;
    if (campo === 'FECHA_INICIO' && $event.value != null) {
      this.validarFechas($event.value, campo);
      this.FPlanes.FECHA_INICIO = $event.value;
    }
    if (campo === 'FECHA_FINAL' && $event.value != null) {
      this.validarFechas($event.value, campo);
      this.FPlanes.FECHA_FINAL = $event.value;
    }
    if (campo === 'NOMBRE' && $event.value != null) {
      this.FPlanes.NOMBRE = $event.value.toUpperCase();
    }
    if (campo === 'ESTADO') {
      this.FPlanes.ESTADO = $event.value;
    }
    this.conCambios++;
  }

  validarFechas(fecha: string, tipo: string) {
    let prm = {};
    if (tipo === 'FECHA_INICIO') {
      prm = { FECHA_INICIO: this.datepipe.transform(fecha, 'yyyy-MM-dd'), CONSECUTIVO: this.FPlanes.CONSECUTIVO };
    } else {
      prm = { FECHA_FINAL: this.datepipe.transform(fecha, 'yyyy-MM-dd'), CONSECUTIVO: this.FPlanes.CONSECUTIVO };
    }
    this.sData.consulta('valida fecha', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, '');
        } else {
          this.conCambios++;
        }
      });
  }
  valoresObjetos(obj: string) {
    if (obj === 'consecutivo') {
      const prm = {};
      this.sData.consulta('CONSECUTIVO', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== '') {
            this.showModal(res[0].ErrMensaje, '');
          } else {
            this.FPlanes.CONSECUTIVO = res[0].CONSECUTIVO;
            this.conCambios++;
          }
        });
    };
  }



  onRespuestaFiltro(e: any) {
  }


  // Imprimir reporte de aplicación
  imprimirReporte(operMenu: any) {
    var prmRep = {
      ...operMenu.operacion,
      accion: 'previsualizar',
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      usuario: this.prmUsrAplBarReg.usuario,
      // QFiltro: (operMenu.operacion.registro === 'todos') ? this.QFiltro : " CAPACIDAD_PRODUCCION.ITEM = "+this.FCapacidad.ITEM
    };
    if (operMenu.operacion.modo === 'previsualizar')
      this.eventsSubjectInformes.next(prmRep);
    if (operMenu.operacion.modo === 'pdf') {
      prmRep = { ...prmRep, accion: 'pdf' };
      this.eventsSubjectInformes.next(prmRep);
    }
    if (operMenu.operacion.modo === 'email') {
      let template = '';
      let asunto = '';
      let email_sale = '';
      let nom_usr = '';
      var prmRep = {
        ...operMenu.operacion,
        accion: 'email',
        asunto,
        email_sale,
        especUsuarioEmail: nom_usr,
        // nombre: this.FCapacidad.ITEM,
        email: '',
        template,
        replacements: '',
        // dataSource: this.FCapacidad
      };
      this.eventsSubjectInformes.next(prmRep);
    }

  }

  showModal(mensaje: any, titulo: any = '¡Error!', msg_html: any = '') {
    let iconHtml = "<i class='icon-cancelar-ol error-color'></i>";
    if (titulo !== '¡Error!') iconHtml = "<i class='icon-alert-ol'></i>";
    Swal.fire({
      iconHtml: iconHtml,
      confirmButtonColor: '#0F4C81',
      title: titulo,
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: "center",
      html: msg_html,
      stopKeydownPropagation: false,
    });
  }

}
