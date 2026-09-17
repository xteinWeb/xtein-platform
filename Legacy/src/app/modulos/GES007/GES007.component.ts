import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DxCheckBoxModule, DxDropDownButtonModule, DxFormModule, DxListModule, DxScrollViewModule, DxSortableModule, DxTabsModule, DxTextBoxModule, DxToolbarModule } from 'devextreme-angular';
import { Subject, Subscription } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { GES00701Component } from './GES00701/GES00701.component';
import { GES007Service } from 'src/app/services/GES007/GES007.service';
import { GES00702Component } from './GES00702/GES00702.component';
import { GES00703Component } from './GES00703/GES00703.component';
import { showToast } from 'src/app/shared/toast/toastComponent.js';
import Swal from 'sweetalert2';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { validatorRes } from 'src/app/shared/validator/validator';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import notify from 'devextreme/ui/notify';
import { SocketService } from 'src/app/services/socket/socket.service';
import { dataSource, IDashboardSerializationInfo, position } from 'devexpress-dashboard/model/index.metadata';
import { GeneralesService } from 'src/app/services/generales/generales.service';

@Component({
  selector: 'app-GES007',
  templateUrl: './GES007.component.html',
  styleUrls: ['./GES007.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    DxScrollViewModule,
    DxSortableModule,
    DxToolbarModule,
    DxDropDownButtonModule,
    DxListModule,
    DxCheckBoxModule,
    DxTabsModule,
    GES00701Component,
    GES00702Component,
    GES00703Component,
    DxTextBoxModule,
    DxFormModule
  ]

})
export class GES007Component {
  eventsDatosForm: Subject<any> = new Subject<any>();
  eventsDatosList: Subject<any> = new Subject<any>();
  eventsDatosGantt: Subject<any> = new Subject<any>();

  USUARIO_LOCAL: any = '';
  statusSelected: string = '';
  EMPRESA: any = '';
  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  subs_filtro: Subscription;
  subs_visor: Subscription;
  mnuAccion: string;
  VDatosReg: any = [];

  // createProyect: boolean = false;
  openDropFiltroMaestro: boolean = false;
  loadingVisible: boolean = false;
  lists: any[] = [];
  selectFiltroMaestro: any = [];
  DProyectos: any = {};
  QFiltro: any;

  statuses = ['Sin Iniciar', 'En Progreso', 'Pausado', 'Finalizado'];
  listaProyectos: any = [];
  filtroMaestro: any = [
    { ID: 0, DESCRIPCION: 'ACTIVO', VALOR: false },
    { ID: 1, DESCRIPCION: 'INACTIVO', VALOR: false },
    { ID: 2, DESCRIPCION: 'FINALIZADO', VALOR: false },
  ];

  tabsProyectos: any = [
    {
      ID: 0,
      text: 'Proyectos',
      icon: 'user',
      content: true,
    },
    {
      ID: 1,
      text: 'Gestión',
      icon: 'find',
      content: false,
    },
    {
      ID: 2,
      text: 'Gantt',
      icon: 'find',
      content: false,
    }
  ];
  conCambios: number = 0;
  proyectos: any = [];
  selectedIndex: number = 0;
  position: number = 0;
  data_prev: any;
  DProyectos_prev: any = {};
  DResponsables: any = [];
  mnuAccionBack: string;

  constructor(
    private sDatos: GES007Service,
    private datepipe: DatePipe,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    public wsocket: SocketService,
    private SVisor: SvisorService,
    public generalesService: GeneralesService,
  ) {
    // Servicio de barra de registro
    this.subscription = this._sbarreg
      .getObsRegApl()
      .subscribe((datreg) => {
        // Valida si la petición es para esta aplicacion
        if (datreg.aplicacion === this.sDatos.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(datreg);
      });

    // Respuesta del filtro
    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe(resp => {
      // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.sDatos.prmUsrAplBarReg.aplicacion)
        this.opPrepararBuscar(resp);
    });

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.sDatos.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex(d => d.ID_DOCUMENTO === resp.ID_DOCUMENTO);
      if (nx !== -1) {
        this.sDatos.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    });
  }

  ngOnInit(): void {
    // this.createProyect = false;
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.EMPRESA = localStorage.getItem('empresa')?.toUpperCase();
    this.sDatos.prmUsrAplBarReg = {
      tabla: 'PROYECTOS',
      aplicacion: 'GES-007',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_buscar: false },
    };
    this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);
    this.DProyectos = {
      ENCABEZADO: {},
      TAREAS: []
    };
    this.mnuAccion = '';
    this.filtroMaestro[0].VALOR = true;
    this.selectFiltroMaestro = [0];
    this.statusSelected = 'ACTIVO';
    this.valoresObjetos('responsables')
    this.onValueChangedFiltro({ addedItems: [this.filtroMaestro[0]] });
  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case 'r_ini':
        this.sDatos.prmUsrAplBarReg = {
          tabla: 'PROYECTOS',
          aplicacion: 'GES-007',
          usuario: this.USUARIO_LOCAL,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_buscar: false },
        };
        this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);
        break;

      case 'r_nuevo':
        this.data_prev = this.DProyectos.ENCABEZADO
        this.data_prev.TAREAS = this.DProyectos.TAREAS
        this.mnuAccion = "r_nuevo";
        this.DProyectos = {
          ENCABEZADO: {},
          TAREAS: []
        };
        this.changeTabs({ itemIndex: 1 })
        break;

      case "r_modificar":
        this.data_prev = this.DProyectos.ENCABEZADO
        this.data_prev.TAREAS = this.DProyectos.TAREAS
        this.mnuAccion = "update";
        this.eventsDatosForm.next({
          accion: 'cargar datos',
          config: {
            accion: 'update dataSource',
            readOnly: false,
            mnuAccion: this.mnuAccion,
            dataSource: this.DProyectos
          }
        });
        // this.opPrepararModificar();
        break;

      case "r_guardar":
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case "r_buscar":
        // if (GlobalVariables.idAplicacionActiva !== this.sDatos.prmUsrAplBarReg.aplicacion) return;
        // if (!this._sfiltro.enConsulta) {
        //   this.opPrepararBuscar('filtro');
        // } else {
        //   showToast('Consulta en proceso, por favor espere.', 'warning');
        // }
        break;

      case "r_buscar_ejec":
        this.opBlanquearForma();
        if (operMenu.operacion.filtro_arg) {
          this.opPrepararBuscar(operMenu.operacion.filtro_arg)
        } else {
          if (this._sfiltro.enConsulta === false) {
            this.opPrepararBuscar('');
          } else {
            showToast('Consulta en proceso, por favor espere.', 'warning');
          }
        }
        break;


      case "r_copiar":
        if (this.VDatosReg.length > 0 && this.DProyectos.ENCABEZADO.ESTADO === 'ACTIVO') {
          this.mnuAccion = 'new';
          this.copiarProyecto();
        } else {
          showToast('Consulte Proyectos para copiar', 'error');
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
        break;

      case "r_cancelar":
        Swal.fire({
          title: '',
          text: '¿Desea cancelar la operación?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            // this.createProyect = false;  
            if (
              this.data_prev === undefined ||
              this.data_prev === '' ||
              this.data_prev === null ||
              this.data_prev.length === 0
            ) {
              this.opBlanquearFormPY();
            } else {
              this.mnuAccion = '';
              // setTimeout(() => {
              //   this.opIrARegistro('r_primero')
              // }, 500);
            }
            this.sDatos.prmUsrAplBarReg = {
              ...this.sDatos.prmUsrAplBarReg,
              accion: 'r_navegar',
              r_totReg: this.VDatosReg.length,
              operacion: { r_refrescar: true },
            };
            this.sDatos.prmUsrAplBarReg = this.sDatos.prmUsrAplBarReg
            this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);
          }
        });
        break;

      case "r_vista":
        // this.opVista();
        break;

      case 'r_refrescar':
        this.mnuAccion = 'init';
        this.valoresObjetos('refrescar');
        break;

      case "r_imprimir":
        break;

      case 'r_configurar':
        break;

      default:
        break;
    }
  }

  copiarProyecto() {
    if (this.mnuAccion.match('new|update')) {
      setTimeout(() => {
        this.eventsDatosForm.next({
          accion: 'cargar datos',
          config: {
            accion: 'copiar proyecto',
            readOnly: this.mnuAccion.match('new|update') ? false : true,
            mnuAccion: this.mnuAccion,
            dataSource: this.DProyectos
          }
        });
      }, 500);
    }
  }

  opPrepararGuardar(accion: string) {
    if (this.conCambios > 0) {
      // Acción validación de datos
      if (!this.ValidaDatos()) {
        return;
      };

      const prmDatosGuardar = JSON.parse(JSON.stringify(this.DProyectos));
      prmDatosGuardar.ENCABEZADO.FECHA_ACTUALIZACION = new Date()
      prmDatosGuardar.TAREAS = prmDatosGuardar.TAREAS.filter(tarea => tarea.CLASE !== "NODOS");
      for (let i = 0; i < prmDatosGuardar.TAREAS.length; i++) {
        const ele = prmDatosGuardar.TAREAS[i];
        ele.PRECEDENTES = ele.PRECEDENTES !== '' && ele.PRECEDENTES.length > 0 ? ele.PRECEDENTES.map((d: any) => d) : [];
        ele.PRECEDENTES = ele.PRECEDENTES.length > 0 ? JSON.stringify(ele.PRECEDENTES) : '';
        ele.FECHA_UPDATE = new Date();
        if (ele.ESTADO === '') {
          ele.ESTADO = 'Sin Iniciar';
        }
        if (ele.ID_ACTIVIDAD_PADRE === 8000) {

          ele.ID_ACTIVIDAD_PADRE = ele.TEMP
        }
        if (ele.ID_ACTIVIDAD >= 8001 && ele.ID_ACTIVIDAD <= 8999) {
          ele.NEW = true;
        } else {
          ele.NEW = false;
        }
      }
      // API guardado de datos
      var exito = false;
      this.loadingVisible = true;
      this.sDatos
        .consulta(accion, prmDatosGuardar, this.sDatos.prmUsrAplBarReg.aplicacion)
        .subscribe((data) => {
          const res = validatorRes(data);
          this.loadingVisible = false;
          if (res[0].ErrMensaje !== "") {
            this.showModal(res[0].ErrMensaje);
          } else {
            // this.objReadOnly.readOnly = true;
            // Operaciones de barra
            this.DProyectos.ENCABEZADO = res[0]
            this.DProyectos.TAREAS = res[0].TAREAS
            if (this.mnuAccion === 'new') {
              this.VDatosReg.push(this.DProyectos.ENCABEZADO);
              this.QFiltro = "PROYECTO='" + this.DProyectos.ENCABEZADO.NOMBRE + "'";
              this.sDatos.prmUsrAplBarReg = {
                ...this.sDatos.prmUsrAplBarReg,
                error: "",
                accion: "r_navegar",
                r_numReg: this.VDatosReg.length,
                r_totReg: this.VDatosReg.length,
                operacion: {}
              };
            } else {

              this.VDatosReg.splice(this.sDatos.prmUsrAplBarReg.r_numReg - 1, 1)
              this.VDatosReg.push(this.DProyectos.ENCABEZADO)
              this.sDatos.prmUsrAplBarReg = {
                ...this.sDatos.prmUsrAplBarReg,
                error: "",
                accion: "r_navegar",
                operacion: {}
              };
            }
            setTimeout(() => {
              this.eventsDatosForm.next({
                accion: 'cargar datos',
                config: {
                  accion: 'update dataSource',
                  readOnly: true,
                  mnuAccion: '',
                  dataSource: this.DProyectos
                }
              });
            }, 300);
            this.valoresObjetos('proyectos', prmDatosGuardar.ENCABEZADO);
            // this.DProyectos.ENCABEZADO = prmDatosGuardar.ENCABEZADO
            // this.DProyectos.TAREAS = prmDatosGuardar.TAREAS


            this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);
            showToast('Registro actualizado', 'success');
            this.mnuAccionBack = this.mnuAccion;
            setTimeout(() => {
              this.ejecutarNotificaciones();
              //   this.changeTabs({ itemIndex: 0 })
              this.mnuAccion = ''
            }, 2000);
          }
        });
    } else {
      showToast('No hay cambios por guardar', 'error');
      this.sDatos.prmUsrAplBarReg = {
        ...this.sDatos.prmUsrAplBarReg,
        error: "",
        accion: "r_navegar",
        r_numReg: 1,
        r_totReg: 1,
        operacion: {}
      };
      this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);
    }

  }

  async ejecutarNotificaciones() {
    this.envioNotificacionProyecto('notificacion', this.DProyectos.ENCABEZADO, '', '');
    for (let i = 0; i < this.DProyectos.TAREAS.length; i++) {
      let element = this.DProyectos.TAREAS[i];
      let data = this.data_prev.TAREAS.filter((datos: any) => datos.ID_ACTIVIDAD === element.ID_ACTIVIDAD)[0]
      if (element.RESPONSABLE !== null && element.RESPONSABLE !== undefined) {

        if (element.PRECEDENTES === '' || element.PRECEDENTES === undefined || element.PRECEDENTES === null) {
          element.PRECEDENTES = []
        }
        if (data !== undefined && data !== null) {
          if (data.PRECEDENTES === '' || data.PRECEDENTES === undefined || data.PRECEDENTES === null) {
            data.PRECEDENTES = []
          }
        }

        element.PROGRAMACION = data.PROGRAMACION;
        element.btnComentarios = true;
        let validJSON: boolean = this.compareObjects(element, data);
        if (validJSON) {
          if (element.RESPONSABLE !== null && element.RESPONSABLE !== undefined) {
            this.envioNotificacion('notificacion', element, this.DProyectos.ENCABEZADO, '');
          }
        }
        await this.delay(1000);
      } else {
        element = {}
        data = {}
        await this.delay(1000);
      }
    }
  }

  compareObjects(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return false; // Son idénticos

    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
      return true; // Son primitivos o uno de ellos es null
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return true; // Diferente número de propiedades

    for (let key of keys1) {
      if (!keys2.includes(key) || this.compareObjects(obj1[key], obj2[key])) {
        return true; // Si falta una clave o los valores son distintos
      }
    }

    return false; // Son idénticos
  }


  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  ValidaDatos() {
    if (this.DProyectos.ENCABEZADO.ID_DOCUMENTO === "") {
      showToast('El proyecto no tiene un Codigo asignado. Por favor revisar la información.', 'warning');
      return false;
    };
    if (this.DProyectos.ENCABEZADO.NOMBRE === "") {
      showToast('El proyecto no tiene un Nombre asignado. Por favor revisar la información.', 'warning');
      return false;
    };
    if (this.DProyectos.ENCABEZADO.RESPONSABLE === "" || this.DProyectos.ENCABEZADO.RESPONSABLE === undefined) {
      showToast('El proyecto no tiene un Responsable asignado. Por favor revisar la información.', 'warning');
      return false;
    };
    if (this.DProyectos.ENCABEZADO.PLANTILLA === "" || this.DProyectos.ENCABEZADO.PLANTILLA === undefined) {
      showToast('El proyecto no tiene una Plantilla cargada. Por favor revisar la información.', 'warning');
      return false;
    };
    if ((this.DProyectos.ENCABEZADO.FECHA_INICIO === "" || this.DProyectos.ENCABEZADO.FECHA_INICIO === null) ||
      (this.DProyectos.ENCABEZADO.FECHA_FIN === "" || this.DProyectos.ENCABEZADO.FECHA_FIN === null)
    ) {
      showToast('El proyecto no tiene un rango de fechas establecido. Por favor revisar la información.', 'warning');
      return false;
    };
    if (this.DProyectos.TAREAS.length === 0) {
      showToast('El proyecto no tiene Tareas cargadas. Por favor revisar la información.', 'warning');
      return false;
    };

    return true;
  }

  opPrepararBuscar(accion): void {
    if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Proyectos",
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: this.sDatos.prmUsrAplBarReg.tabla,
        aplicacion: this.sDatos.prmUsrAplBarReg.aplicacion
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { PROYECTOS: arrFiltro };
      this.loadingVisible = true;
      this.sDatos
        .consulta('consulta', prm, this.sDatos.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          try {
            this.loadingVisible = false;
            const res = JSON.parse(data.data);
            this._sfiltro.enConsulta = false;
            if (data.token != undefined) {
              const refreshToken = data.token;
              localStorage.setItem('token', refreshToken);
            }
            const datares = res;
            if (datares[0].ErrMensaje === '') {
              // Asocia datos
              if (datares ?? '' != '') {
                // cabecera
                this.VDatosReg = datares;
                this.QFiltro = datares[0].QFILTRO;

                // Prepara la barra para navegación
                this.sDatos.prmUsrAplBarReg = {
                  ...this.sDatos.prmUsrAplBarReg,
                  r_totReg: datares.length,
                  r_numReg: 1,
                  accion: 'r_navegar',
                  operacion: {},
                };
                this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);
                // Trae los items en los componentes asociados
                this.opIrARegistro('r_primero');
              }
            } else {
              this.VDatosReg = [];
              //notificación
              showToast(datares[0].ErrMensaje, 'warning');
              this.sDatos.prmUsrAplBarReg.accion = 'r_cancelar';
              this.sDatos.prmUsrAplBarReg = { ...this.sDatos.prmUsrAplBarReg, operacion: {} };
              this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);
              //this.opBlanquearFormPY();
            }
          } catch (error) {
            this.loadingVisible = false;
            this._sfiltro.enConsulta = false;
            this.showModal(error, 'Error');
          }
        });
    }
  }

  opIrARegistro(accion: string): void {
    var newArray: any = {};
    this.sDatos.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        if (this.VDatosReg.length != 0) {
          newArray = this.VDatosReg[0];
          this.sDatos.prmUsrAplBarReg.r_numReg = 1;
          this.sDatos.prmUsrAplBarReg.r_totReg = this.VDatosReg.length
          this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);
        } else {
          showToast('No se encontraron datos', 'error');
        }
        this.position = this.sDatos.prmUsrAplBarReg.r_numReg;
        break;

      case "r_anterior":
        this.sDatos.prmUsrAplBarReg.r_numReg =
          this.sDatos.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.sDatos.prmUsrAplBarReg.r_numReg - 1;
        this.sDatos.prmUsrAplBarReg.r_totReg = this.VDatosReg.length
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.sDatos.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);
        this.position = this.sDatos.prmUsrAplBarReg.r_numReg;
        break;

      case "r_siguiente":
        this.sDatos.prmUsrAplBarReg.r_numReg =
          this.sDatos.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.sDatos.prmUsrAplBarReg.r_numReg + 1;
        this.sDatos.prmUsrAplBarReg.r_totReg = this.VDatosReg.length
        this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.sDatos.prmUsrAplBarReg.r_numReg - 1]));
        this.position = this.sDatos.prmUsrAplBarReg.r_numReg;

        break;

      case "r_ultimo":
        this.sDatos.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.sDatos.prmUsrAplBarReg.r_totReg = this.VDatosReg.length
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.sDatos.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);
        this.position = this.sDatos.prmUsrAplBarReg.r_numReg;

        break;

      case "r_numreg":
        if (this.sDatos.prmUsrAplBarReg.r_numReg !== 0) {
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
          if (this.VDatosReg.length > 0) {
            newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.sDatos.prmUsrAplBarReg.r_numReg - 1]));
          } else {
            this.opBlanquearForma();
          }
          this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);

        }
        else {
          this.opBlanquearForma();
        }
        this.position = this.sDatos.prmUsrAplBarReg.r_numReg;

        break;

      case "Eliminado":
        this.VDatosReg.splice(this.sDatos.prmUsrAplBarReg.r_numReg - 1, 1);
        this.sDatos.prmUsrAplBarReg.r_totReg--;
        if (this.sDatos.prmUsrAplBarReg.r_numReg > this.sDatos.prmUsrAplBarReg.r_totReg) {
          this.sDatos.prmUsrAplBarReg.r_numReg = this.sDatos.prmUsrAplBarReg.r_totReg;
        }
        this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);
        if (this.VDatosReg.length > 0) {
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.sDatos.prmUsrAplBarReg.r_numReg - 1]));
        } else {
          this.opBlanquearForma();
        }
        this.position = this.sDatos.prmUsrAplBarReg.r_numReg;

        break;

      default:
        break;
    }

    this.DProyectos = {
      ENCABEZADO: newArray,
      TAREAS: newArray.TAREAS
    }
    const pos = this.tabsProyectos.findIndex((v: any) => v.content === true);
    switch (pos) {
      case 0:
        break;

      case 1:
        setTimeout(() => {
          this.eventsDatosForm.next({
            accion: 'cargar datos',
            config: {
              accion: 'update dataSource',
              readOnly: true,
              mnuAccion: this.mnuAccion,
              dataSource: this.DProyectos
            }
          });
        }, 500);
        break;

      case 2:
        setTimeout(() => {
          this.eventsDatosGantt.next({
            accion: 'cargar datos',
            config: {
              accion: 'update dataSource',
              readOnly: true,
              mnuAccion: this.mnuAccion,
              dataSource: this.DProyectos
            }
          });
        }, 500);
        break;

      default:
        break;
    }


  }

  opEliminar(): void {
    // Confirma...
    Swal.fire({
      title: '',
      text: '',
      html: "¿Desea eliminar el Proyecto <i>" +
        this.DProyectos.ENCABEZADO.NOMBRE +
        "</i> ?",
      iconHtml: "<i class='icon-alert-ol'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      // Procesa eliminación. Llama a la API para validar referenciación y 
      // eliminación en tabla
      if (result.isConfirmed) {
        this.AccionEliminar(this.DProyectos.ENCABEZADO);
        // this.onTabChanged({ itemIndex: 0 })
      }
    });

  }

  // Ejecuta la eliminación
  AccionEliminar(proyecto): void {
    // API eliminación de datos
    if (proyecto) {
      const prm: any = { ID_DOCUMENTO: proyecto.ID_DOCUMENTO, CONSECUTIVO: proyecto.CONSECUTIVO };
      this.sDatos.consulta('delete', prm, this.sDatos.prmUsrAplBarReg.aplicacion).subscribe(
        (data: any) => {
          const res = validatorRes(data);
          if (res[0].ErrMensaje === '') {
            const proyectos = this.proyectos.filter((x: any) => x.ID_DOCUMENTO !== proyecto.ID_DOCUMENTO)
            if (this.selectedIndex === 1 || 2) {
              this.opIrARegistro('Eliminado');
              this.valoresObjetos('proyectos')
              showToast('El proyecto se elimino con exito!.', 'success');
            }
          } else {
            this.showModal(res[0].ErrMensaje);
          }
        })
    }
  }

  opBlanquearForma(): void {
    this.DProyectos = {
      ENCABZADO: {},
      TAREAS: []
    };
  }


  onRespuestaComponent(datos: any, componenet: string) {
    switch (componenet) {
      case 'CANVAS':
        switch (datos.accion) {
          case 'actividades proyectos':
            break;

          case 'view form':
            this.DProyectos = {
              ENCABEZADO: datos.dataSource,
              TAREAS: datos.dataSource.TAREAS
            };
            this.changeTabs({ itemIndex: 1 }, datos.position)
            break;

          case 'view gantt':
            this.viewGantt(datos.dataSource, datos.position)
            break;

          case 'get data':
            this.envioNotificacionProyecto('notificacion', datos.dataSource, '', datos.DESCRIPCION);
            this.valoresObjetos('refrescar');
            break;

          default:
            break;
        }
        break;

      case 'FORM':
        switch (datos.accion) {
          case 'update datasource':
            this.conCambios++
            this.DProyectos = {
              ENCABEZADO: datos.data.ENCABEZADO,
              TAREAS: datos.data.TAREAS
            };

            break;

          default:
            break;
        }
        break;

      case 'GANTT':
        switch (datos.accion) {
          case 'update datasource':
            this.conCambios++
            this.DProyectos = {
              ENCABEZADO: datos.data.ENCABEZADO,
              TAREAS: datos.data.TAREAS
            };
            break;

          default:
            break;
        }
        break;

      default:
        break;
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

  valoresObjetos(obj: string, dataLocal?: any) {
    if (obj === 'proyectos' || obj === 'refrescar') {
      const prm = { USUARIO: this.USUARIO_LOCAL, ESTADO: this.statusSelected };
      this.sDatos.consulta('PROYECTOS EXISTENTES', prm, this.sDatos.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        let res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== '' && res[0].ErrMensaje !== undefined && res[0].ErrMensaje !== null) {
          if (this.selectedIndex === 0) {
            this.alertNtf(res[0].ErrMensaje)
          }
          this.proyectos = [];
        } else {
          for (let i = 0; i < res.length; i++) {
            let element = res[i];
            let NODO = {
              ID_ACTIVIDAD: 8000,
              ID_ACTIVIDAD_PADRE: -1,
              NOMBRE: "",
              DESCRIPCION: "",
              FECHA_INICIO: null,
              FECHA_FIN: null,
              PRIORIDAD: null,
              ETIQUETAS: null,
              MEDICION: null,
              DATA_PROGRAMACION: null,
              RECORDATORIO: null,
              DATA_RECORDATORIO: null,
              ESTADO: null,
              CLASE: 'NODOS',
              TIPO: null,
              PRECEDENTES: "",
              ANULADO: false,
              ELIMINADO: false,
              REPETIR: false,
              TODO_DIA: false,
              RESPONSABLE: null,
              NOMBRE_RESPONSABLE: null,
              COLABORADORES: [],
              PROGRAMACION: "",
              ORDEN: null,
              DESCRIPCIO_ESTILO: "",
              USUARIO: "",
              ASIGNADO_POR: null,
              ACT_MIAS: false,
              ACT_ASIG: false,
              ACT_AREA: false,
              ACT_COLAB: false,
              ACT_FIN: false,
              AVANCE: false,
              TEMP: 0,
              ErrMessage: ""
            }
            element.TAREAS.push(NODO);
            for (let j = 0; j < element.TAREAS.length; j++) {
              let data = element.TAREAS[j];
              if (data.CLASE != 'NODOS' && data.ID_ACTIVIDAD_PADRE == -1) {

                data.TEMP = data.ID_ACTIVIDAD_PADRE;
                data.ID_ACTIVIDAD_PADRE = 8000;
              }
            }
          }
          this.proyectos = res;
          if (dataLocal !== null && dataLocal !== undefined) {

            for (let i = 0; i < res.length; i++) {
              const element = res[i];
              if (element.ID_DOCUMENTO === dataLocal.ID_DOCUMENTO) {
                this.DProyectos.ENCABEZADO = element;
                this.DProyectos.TAREAS = element.TAREAS;
              }
            }
          } else {
            this.DProyectos.ENCABEZADO = res[0];
            this.DProyectos.TAREAS = res[0].TAREAS;

          }
          if (obj === 'refrescar' && this.selectedIndex === 0) {
            this.setDataKanban();
          }
          for (let i = 0; i < this.DProyectos.TAREAS.length; i++) {
            const ele = this.DProyectos.TAREAS[i];
            ele.PRECEDENTES = ele.PRECEDENTES === '' || ele.PRECEDENTES === null || ele.PRECEDENTES === undefined ? [] : JSON.parse(ele.PRECEDENTES)
            let PRECEDENTES: any[] = [];
            ele.PRECEDENTES.forEach((d: any) => {
              PRECEDENTES.push(d)
            })
            ele.PRECEDENTES = PRECEDENTES
          }
          this.VDatosReg = res;
          if (res[0].QFILTRO) {
            this.QFiltro = res[0].QFILTRO;
          }
        }
      });
    };

    if (obj === 'responsables' || obj === 'todos') {
      const prm: any = {};
      this.sDatos.getResponsables('RESPONSABLES', prm).subscribe(
        (data: any) => {
          const res = validatorRes(data);
          if (data.token !== undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          const newArray = res;
          const mensaje = newArray[0].ErrMensaje;
          if (mensaje !== '') {
            showToast(mensaje, 'Error');
          } else {
            for (let i = 0; i < res.length; i++) {
              const element = res[i];
              element.ITEM = i;
            }
            this.DResponsables = res;
            this.sDatos.DResponsables = res;
          }
        },
        (err: any) => {
          this.showModal(err.message, 'Error');
        }
      );
    }

  }

  alertNtf(message: any, type: any = 'info') {
    const container: any = document.getElementById('router-container');

    notify(
      {
        // title: ,
        message: message,
        width: 300,
        height: 70,
        position: {
          at: 'bottom right',
          my: 'bottom right',
          of: container,
        },
        animation: {
          show: { type: 'fade', duration: 400, from: 0, to: 1 },
          hide: { type: 'fade', duration: 400, to: 0 },
        },
      },
      type,
      5000
    );
  }

  onValueChangedFiltro(e: any) {
    this.openDropFiltroMaestro = false;
    if (e.addedItems !== undefined || e.removedItems !== undefined) {
      this.loadingVisible = true;
      if (e.addedItems !== undefined && e.addedItems.length > 0) {
        // Establecer el valor en true solo para el seleccionado y false para los demás
        for (let i = 0; i < this.filtroMaestro.length; i++) {
          const item = this.filtroMaestro[i];
          if (item.ID === e.addedItems[0].ID) {
            item.VALOR = true;
            this.statusSelected = item.DESCRIPCION;
            this.selectFiltroMaestro = [item.ID];
          } else {
            item.VALOR = false;
          }
        }
        this.valoresObjetos('proyectos');
      }

      this.setDataKanban();
      this.loadingVisible = false;
    }
  }

  viewGantt(proyecto: any, position: number) {
    this.DProyectos = {
      ENCABEZADO: proyecto,
      TAREAS: proyecto.TAREAS
    };
    this.changeTabs({ itemIndex: 2 }, position);
  }

  setDataKanban() {
    setTimeout(() => {
      if (this.proyectos.length > 0) {
        this.eventsDatosList.next({
          accion: 'cargar datos',
          changeStatus: this.selectFiltroMaestro[0],
          config: { accion: 'update dataSource', dataSource: this.proyectos }
        });
      }
    }, 1000);
    // Prepara la barra para navegación
    this.sDatos.prmUsrAplBarReg = {
      ...this.sDatos.prmUsrAplBarReg,
      r_totReg: 0,
      r_numReg: 0,
      accion: 'r_ini',
      operacion: { r_nuevo: true, r_modificar: true, r_eliminar: true, r_buscar: false }
    }
    this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);
  }

  changeTabs(e: any, position?): void {
    if (position !== undefined) {
      this.position = position;
    }
    this.selectedIndex = e.itemIndex;
    if (!this.mnuAccion.match('new|update')) {

      switch (e.itemIndex) {
        case 0:
          this.setDataKanban();
          this.onTabChanged(e);
          break;
        case 1:
          if (this.mnuAccion === 'r_nuevo') {
            this.mnuAccion = 'new';
          }
          if (this.mnuAccion.match('new|update')) {
            setTimeout(() => {
              this.eventsDatosForm.next({
                accion: 'init',
                config: {
                  accion: 'init',
                  readOnly: false,
                  mnuAccion: this.mnuAccion,
                  dataSource: this.DProyectos,
                  APLICACION: this.sDatos.prmUsrAplBarReg.aplicacion
                },
              });
            }, 500);
          } else if (this.VDatosReg !== undefined && this.VDatosReg.length > 0) {
            // Prepara la barra para navegación
            if (this.position === undefined) {
              this.DProyectos = {
                ENCABEZADO: this.proyectos[this.sDatos.prmUsrAplBarReg.r_numReg],
                TAREAS: this.proyectos[this.sDatos.prmUsrAplBarReg.r_numReg].TAREAS
              }
            }
            this.sDatos.prmUsrAplBarReg = {
              ...this.sDatos.prmUsrAplBarReg,
              r_totReg: this.VDatosReg.length,
              r_numReg: this.position === undefined || this.position === 0 ? this.sDatos.prmUsrAplBarReg.r_numReg + 1 : this.position,
              accion: 'r_navegar',
              operacion: { r_buscar: false }
            }
            this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);
          } else {
            showToast('No puede cambiar la vista sin tener proyectos registrados.', 'warning');
            return;
          }
          setTimeout(() => {
            this.eventsDatosForm.next({
              accion: 'cargar datos',
              config: {
                accion: 'update dataSource',
                readOnly: this.mnuAccion.match('new|update') ? false : true,
                mnuAccion: this.mnuAccion,
                dataSource: this.DProyectos
              }
            });
          }, 500);
          this.onTabChanged(e);
          break;

        case 2:
          if (this.VDatosReg.length > 0) {
            this.mnuAccion = 'r_navegar';
            // Prepara la barra para navegación
            if (this.position === undefined) {
              this.DProyectos = {
                ENCABEZADO: this.proyectos[this.sDatos.prmUsrAplBarReg.r_numReg],
                TAREAS: this.proyectos[this.sDatos.prmUsrAplBarReg.r_numReg].TAREAS
              }
            }
            this.sDatos.prmUsrAplBarReg = {
              ...this.sDatos.prmUsrAplBarReg,
              r_totReg: this.VDatosReg.length,
              r_numReg: this.position === undefined || this.position === 0 ? this.sDatos.prmUsrAplBarReg.r_numReg + 1 : this.position,
              accion: this.mnuAccion,
              operacion: { r_nuevo: false, r_modificar: false, r_eliminar: false, r_buscar: false }
            }
            this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);
          } else {
            this.mnuAccion = 'r_ini';
            this.sDatos.prmUsrAplBarReg = {
              ...this.sDatos.prmUsrAplBarReg,
              error: "",
              r_numReg: 0,
              r_totReg: 0,
              accion: 'r_init',
              operacion: { r_buscar: false },
            };
            this._sbarreg.setObsMenuReg(this.sDatos.prmUsrAplBarReg);
            showToast('No puede cambiar la vista sin tener proyectos registrados.', 'warning');
            return;
          };

          // this.mnuAccion = '';
          setTimeout(() => {
            this.eventsDatosGantt.next({
              accion: 'cargar datos',
              config: {
                accion: 'update dataSource',
                readOnly: true,
                mnuAccion: this.mnuAccion,
                dataSource: this.DProyectos
              }
            });
          }, 500);
          this.onTabChanged(e);
          break;

        default:
          break;
      }
    } else {
      showToast('No puede cambiar la vista si esta editando datos.', 'warning');
      this.selectedIndex = 1;
    }
  }


  onTabChanged(e: any, readOnly: boolean = true) {
    switch (e.itemIndex) {
      case 0:
        this.tabsProyectos[0].content = true;
        this.tabsProyectos[1].content = false;
        this.tabsProyectos[2].content = false;
        break;
      case 1:
        this.tabsProyectos[0].content = false;
        this.tabsProyectos[1].content = true;
        this.tabsProyectos[2].content = false;
        break;
      case 2:
        this.tabsProyectos[0].content = false;
        this.tabsProyectos[1].content = false;
        this.tabsProyectos[2].content = true;
        break;
      default:
        break;
    }
    this.selectedIndex = e.itemIndex;
  }

  opBlanquearFormPY(): void {
    this.DProyectos = {
      ENCABEZADO: {},
      TAREAS: []
    };
    this.DProyectos_prev = JSON.parse(JSON.stringify(this.DProyectos));
    this.mnuAccion = '';
  }

  envioNotificacion(fuente: any, prm: any, proyecto: any, TIMELINE: any) {
    const TIPO_TAREA: any = prm.CLASE;
    const usr_env: any = this.DResponsables.filter(
      (d: any) => d.ID_RESPONSABLE === this.USUARIO_LOCAL
    );
    let fistName = usr_env[0].NOMBRE.split(' ')[0] !== undefined ? usr_env[0].NOMBRE.split(' ')[0] : ''
    let lastName = usr_env[0].NOMBRE.split(' ')[2] !== undefined ? ' ' + usr_env[0].NOMBRE.split(' ')[2] : ''
    let user_name = fistName + ' ' + lastName

    let usr_rec: String[] = [];
    usr_rec.push(prm.RESPONSABLE);
    usr_rec.push(prm.USUARIO);
    if (prm.COLABORADORES != undefined && prm.COLABORADORES != null && prm.COLABORADORES.length > 0) {
      prm.COLABORADORES.forEach((user) =>
        usr_rec.push(user))
    }
    const index = usr_rec.indexOf(this.USUARIO_LOCAL);
    if (index !== -1) {
      usr_rec.splice(index, 1); // Elimina ese elemento
    }
    usr_rec = [...new Set(usr_rec)];

    var sendMail: boolean = false;
    var msj: any = '';
    var desc: any = '';
    var accion: any = '';

    if (fuente === 'notificacion') {
      sendMail = false;
    } else if (fuente === 'enviar email') {
      sendMail = true;
      msj = 'Envio de Correo';
    }

    if (this.mnuAccionBack === 'new') {
      if (TIPO_TAREA === 'TAREAS') {
        msj = user_name + ', te asignó la TAREA ' + prm.NOMBRE.toUpperCase() + ' del proyecto ' + proyecto.NOMBRE.toUpperCase();
        desc = user_name + ', te añadio como Colaborador a la ' + 'TAREA ' + prm.NOMBRE.toUpperCase() + ' del proyecto ' + proyecto.NOMBRE.toUpperCase();
      }

      accion = 'nueva_actividad'
    } else if (this.mnuAccionBack === 'update') {
      desc = '';
      if (!prm.RESPONSABLE) {
        if (TIPO_TAREA === 'TAREAS') {
          msj = user_name + ', Te añadio como responsable de la ' + 'TAREA ' + prm.NOMBRE.toUpperCase() + ' del proyecto ' + proyecto.NOMBRE.toUpperCase();
        }
      } else {
        if (TIPO_TAREA === 'TAREAS') {
          msj = user_name + ', modificó la TAREA ' + prm.NOMBRE.toUpperCase() + ' del proyecto ' + proyecto.NOMBRE.toUpperCase();
        }
      }

      accion = 'modifico_actividad'
    }
    //Envia el responsable
    if (usr_rec.length > 0) {
      const posApl: any = this.generalesService.APLICACIONES.findIndex((d: any) => d.ID_APLICACION === this.sDatos.prmUsrAplBarReg.aplicacion);

      var dataNotificacion: any = {
        APLICACION: 'GES-001',
        ID_APLICACION: 'GES-001',
        NOMBRE_APLICACION: posApl > -1 ? this.generalesService.APLICACIONES[posApl].NOMBRE : null,

        FECHA: this.datepipe.transform(
          new Date(),
          'MM/dd/yyyy HH:mm:ss'
        ),
        USUARIO_ENV: usr_env[0],
        USUARIO_REC: usr_rec,
        DESCRIPCION: msj,
        TIPO: 'AUTOMATICA',
        FECHA_UPDATE: this.datepipe.transform(
          new Date(),
          'MM/dd/yyyy HH:mm:ss'
        ),
        ESTADO: 'Enviado',
        SEND_EMAIL: sendMail,
        EMPRESA: this.EMPRESA,
        ESPEC: 'NOTIFICACION',
        ACCION: accion,
        TIMELINE: TIMELINE,
        CLASE: TIPO_TAREA,
        ACTIVIDAD: JSON.stringify({
          EMPRESA: this.EMPRESA,
          ESPEC: 'NOTIFICACION',
          ACCION: accion,
          TIMELINE: TIMELINE,
          CLASE: TIPO_TAREA,
          ACTIVIDAD_DATA: prm
        })
      };
      const data1: any = {
        TIPO: 'NOTIFICACION',
        DATOS: dataNotificacion,
      };
      this.wsocket.saveInfo('SAVE NOTIFICACION', data1).subscribe((data) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'Error al enviar notificación.');
        } else {
          let datos = {
            data: dataNotificacion,
            USUARIO: dataNotificacion.USUARIO_ENV
          }
          this.wsocket.sendSocket('notificaciones', 'get_data_notificaciones', datos);
          if (sendMail === true) {
            showToast('Correo Enviado.', 'success');
          }
        }
      });
    }
  }

  envioNotificacionProyecto(fuente: any, prm: any, TIMELINE: any, msj: string) {
    const usr_env: any = this.DResponsables.filter(
      (d: any) => d.ID_RESPONSABLE === this.USUARIO_LOCAL
    );
    let fistName = usr_env[0].NOMBRE.split(' ')[0] !== undefined ? usr_env[0].NOMBRE.split(' ')[0] : ''
    let lastName = usr_env[0].NOMBRE.split(' ')[2] !== undefined ? ' ' + usr_env[0].NOMBRE.split(' ')[2] : ''
    let user_name = fistName + lastName

    let usr_rec: String[] = [];
    usr_rec.push(prm.RESPONSABLE);
    usr_rec.push(prm.USUARIO);
    if (prm.COLABORADORES != undefined && prm.COLABORADORES != null && prm.COLABORADORES.length > 0) {
      prm.COLABORADORES.forEach((user) =>
        usr_rec.push(user))
    }
    const index = usr_rec.indexOf(this.USUARIO_LOCAL);
    if (index !== -1) {
      usr_rec.splice(index, 1); // Elimina ese elemento
    }
    usr_rec = [...new Set(usr_rec)];
    var sendMail: boolean = false;

    if (fuente === 'notificacion') {
      sendMail = false;
    } else if (fuente === 'enviar email') {
      sendMail = true;
      msj = 'Envio de Correo';
    }

    if (this.mnuAccionBack === 'new') {
      msj = user_name + ', te asignó el ' + 'Proyecto ' + prm.NOMBRE.toUpperCase();
    } else if (this.mnuAccionBack === 'update') {
      msj = user_name + ', modifico el ' + 'Proyecto ' + prm.NOMBRE.toUpperCase();
    } else {
      msj = user_name.toUpperCase() + ' ' + msj.toUpperCase() + ' ' + prm.NOMBRE.toUpperCase();
    }
    //Envia el responsable
    var dataNotificacion: any = {
      APLICACION: this.sDatos.prmUsrAplBarReg.aplicacion,
      ID_APLICACION: this.sDatos.prmUsrAplBarReg.aplicacion,
      FECHA: this.datepipe.transform(
        new Date(),
        'MM/dd/yyyy HH:mm:ss'
      ),
      USUARIO_ENV: usr_env[0],
      USUARIO_REC: usr_rec,
      DESCRIPCION: msj,
      TIPO: 'AUTOMATICA',
      FECHA_UPDATE: this.datepipe.transform(
        new Date(),
        'MM/dd/yyyy HH:mm:ss'
      ),
      ESTADO: 'Enviado',
      SEND_EMAIL: sendMail,
      EMPRESA: this.EMPRESA,
      ESPEC: 'NOTIFICACION',
      ACCION: '',
      TIMELINE: TIMELINE,
      CLASE: 'PROYECTO',
      ACTIVIDAD: JSON.stringify({
        EMPRESA: this.EMPRESA,
        ESPEC: 'NOTIFICACION',
        ACCION: '',
        CLASE: 'PROYECTO',
      })
    };
    // API guardado de datos

    const data1: any = {
      TIPO: 'NOTIFICACION',
      DATOS: dataNotificacion,
    };
    this.wsocket.saveInfo('SAVE NOTIFICACION', data1).subscribe((data) => {
      const res = JSON.parse(data.data);
      if (res[0].ErrMensaje !== '') {
        this.showModal(res[0].ErrMensaje, 'Error al enviar notificación.');
      } else {
        let datos = {
          data: dataNotificacion,
          USUARIO: dataNotificacion.USUARIO_ENV
        }
        this.wsocket.sendSocket('notificaciones', 'get_data_notificaciones', datos);
        if (sendMail === true) {
          showToast('Correo Enviado.', 'success');
        }
      }
    });
  }


  onValueChangedFilter(e: any) {
    this.eventsDatosList.next({
      accion: 'filtrar datos',
      textFilter: e.value
    });
  }
}