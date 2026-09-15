import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { DxButtonModule, DxCheckBoxComponent, DxCheckBoxModule, DxDropDownBoxModule, DxDropDownButtonModule, DxListComponent, DxListModule, DxLoadPanelModule, DxTabsModule, DxToolbarModule, DxTreeListComponent, DxTreeListModule } from 'devextreme-angular';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { GES001Service } from 'src/app/services/GES001/GES001.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import Swal from 'sweetalert2';
import { GES00103Component } from './GES00103/GES00103.component';
import { GES00104Component } from './GES00104/GES00104.component';
import { GES00Service } from 'src/app/shared/Tareas/Service/GES00.service';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { showToast } from '../../shared/toast/toastComponent.js';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { GES000Component } from '../GES000/GES000.component';
import { GES_INFOComponent } from 'src/app/shared/Tareas/GES_INFO/GES_INFO.component';
import { SocketService } from 'src/app/services/socket/socket.service';
import { GeneralesService } from 'src/app/services/generales/generales.service';


@Component({
  selector: 'app-GES001',
  templateUrl: './GES001.component.html',
  styleUrls: ['./GES001.component.css'],
  standalone: true,
  imports: [CommonModule, MatTabsModule, DxLoadPanelModule,
    GES00103Component, GES00104Component, DxTabsModule, DxDropDownBoxModule, DxCheckBoxModule, DxToolbarModule,
    DxDropDownButtonModule, DxListModule, DxListModule, MatDividerModule, GES000Component,
    GES_INFOComponent, DxTreeListModule, DxButtonModule
  ]
})
export class GES001Component implements OnInit {

  @ViewChild("lstfilterMaestro", { static: false }) lstfilterMaestro: DxListComponent;
  @ViewChild("checkActivas", { static: false }) checkActivas: DxCheckBoxComponent;
  @ViewChild("checkFinalizadas", { static: false }) checkFinalizadas: DxCheckBoxComponent;
  @ViewChild("checkMisActividades", { static: false }) checkMisActividades: DxCheckBoxComponent;
  @ViewChild("checkAsignadas", { static: false }) checkAsignadas: DxCheckBoxComponent;
  @ViewChild("checkInactivas", { static: false }) checkInactivas: DxCheckBoxComponent;
  @ViewChild("checkArea", { static: false }) checkArea: DxCheckBoxComponent;
  @ViewChild("checkCol", { static: false }) checkCol: DxCheckBoxComponent;
  @ViewChild("treeListAreas", { static: false }) treeListAreas: DxTreeListComponent;
  @ViewChild("listColumnChooser", { static: false }) listColumnChooser: DxListComponent;

  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();

  //Configuracion GES-000
  eventsDatosGES000: Subject<any> = new Subject<any>();
  eventsDatosTablas: Subject<any> = new Subject<any>();
  eventsDatosCalendario: Subject<any> = new Subject<any>();
  eventsGesInfo: Subject<any> = new Subject<any>();
  DATOS_CONFIG: any[] = [];
  config_obj: any = [];
  nodos_principales: any[] = [];
  ListaAcciones: any[] = [];
  //--------------------------------------

  tabsMovilGespro: any = [
    {
      ID: 0,
      text: 'Actividades',
      icon: 'user',
      content: true,
    },
    {
      id: 1,
      text: 'Tablas',
      icon: 'comment',
      content: false,
    },
    {
      id: 2,
      text: 'Calendario',
      icon: 'find',
      content: false,
    },
    {
      id: 3,
      text: 'Calendario',
      icon: 'find',
      content: false,
    },
    {
      id: 4,
      text: 'Calendario',
      icon: 'find',
      content: false,
    }
  ]
  filtroSecciones: any[] = [
    { ID_FILTRO: 'Mis actividades', VALUE: true },
    { ID_FILTRO: 'Asignadas', VALUE: false },
    { ID_FILTRO: 'Colaborador', VALUE: false },
    { ID_FILTRO: 'Finalizadas', VALUE: false }
  ];
  filtroMaestro: any = [
    { ID: 1, DESCRIPCION: 'Activas', VALOR: false },
    { ID: 2, DESCRIPCION: 'Finalizadas', VALOR: false },
    { ID: 3, DESCRIPCION: 'Inactivas', VALOR: false }
  ];
  apliFiltros: any;
  filtroActividades: any = [false, false, false];
  selectFiltroMaestro: any = [];
  MOFiltros: boolean = true;
  readOnlyFiltros: boolean = false;
  openDropFiltroMaestro: boolean = false;
  openDropFiltroAreas: boolean = false;
  openDropColumnChooser: boolean = false;
  DGareasF: string[] = [];
  DColumnChooser: any = [];
  selectAreas: string[] = [];
  selectedItemColumnChooser: any = [];
  selectedItemColumnChooser_prev: any = [];

  DataResTareas: any = [];
  DataResTareas_prev: any = [];
  DataFiltroAreas: any = [];
  DataFiltroAreas_prev: any = [];
  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string;
  readOnly: boolean;
  QFiltro: any;
  data_prev: any;
  VDatosReg: any;
  PERMISOS: any;
  USUARIO_LOCAL: any = '';
  EMPRESA: any = '';
  noDataAreas: string = 'No hay Data';
  loadingVisible: boolean = false;
  DResponsables: any = [];

  constructor(
    private tabService: TabService,
    private SVisor: SvisorService,
    private _sfiltro: SfiltroService,
    private _sdatos: GES001Service,
    private Ges00Service: GES00Service,
    private _sbarreg: SbarraService,
    public socket: SocketService,
    public generalesService: GeneralesService,

  ) {
    this.subscription = this._sbarreg
      .getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((dempeg) => {
        // Valida si la petición es para esta aplicacion
        if (dempeg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(dempeg);
      });

    this.onRespuestaComponent = this.onRespuestaComponent.bind(this);
    this.valoresObjetos = this.valoresObjetos.bind(this);
  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.EMPRESA = localStorage.getItem('empresa')?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'GESPRO',
      aplicacion: 'GES-001',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_refrescar: true }
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.readOnly = false;
    setTimeout(() => {
      this.eventsDatosGES000.next({
        accion: 'init',
        config: { accion: 'init', readOnly: this.readOnly, APLICACION: this.prmUsrAplBarReg.aplicacion }
      });
      this.eventsGesInfo.next({
        accion: 'init',
        config: { accion: 'init', readOnly: this.readOnly, APLICACION: this.prmUsrAplBarReg.aplicacion }
      });
    }, 300);

    this.valoresObjetos('configurar', 'GESPRO');
    this.valoresObjetos('datos columnas', '');
    this.valoresObjetos('actividades', '');
    this.valoresObjetos('areas', '');
    this.valoresObjetos('prioridad', '');
    this.filtroMaestro[0].VALOR = true;
    this.filtroActividades[0] = true;
    this.selectFiltroMaestro = [1];
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  mostrarOcultarFiltros(e: any) {
    this.MOFiltros = !this.MOFiltros;
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.prmUsrAplBarReg = {
          tabla: 'GESPRO',
          aplicacion: 'GES-001',
          usuario: this.USUARIO_LOCAL,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_refrescar: true }
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_nuevo':
        this.mnuAccion = "new";
        this.readOnly = false;
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = "update";
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        // this.opPrepararGuardar(this.mnuAccion);
        break;

      case 'r_buscar':
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        if (this._sfiltro.enConsulta === false) {
          // this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_buscar_ejec':
        if (this._sfiltro.enConsulta === false) {
          // this.opPrepararBuscar('');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
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

      case 'r_cancelar':
        var mensaje = '¿Desea cancelar la operación?';
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
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} }
            this.readOnly = true;
            this.mnuAccion = "";
            if (this.VDatosReg ?? '' != '')
              this.opIrARegistro('r_numreg');
          }
        });
        break;

      case "r_vista":
        this.opVista('vista');
        break;

      case 'r_refrescar':
        this.valoresObjetos('todos', '');
        setTimeout(() => {
          if (this.tabsMovilGespro[0].content) {
            this.eventsDatosGES000.next({
              accion: 'init',
              config: { accion: 'init', readOnly: this.readOnly, APLICACION: this.prmUsrAplBarReg.aplicacion }
            });
          }
          if (this.tabsMovilGespro[1].content) {
            this.eventsDatosTablas.next({
              accion: 'init',
              config: { accion: 'init', dataSource: this.DataResTareas }
            });
          }
          if (this.tabsMovilGespro[2].content) {
            this.eventsDatosCalendario.next({
              accion: 'init',
              config: { accion: 'init', dataSource: this.DataResTareas }
            });
          }
        }, 1000);

        break;

      case 'r_imprimir':
        this.imprimirReporte(operMenu.operacion.id_reporte, operMenu.operacion.archivo, operMenu.operacion.data_rpt);
        break;

      case 'r_configurar':
        break;


      default:
        break;
    }
  }

  opPrepararNuevo(): void {
    this.opBlanquearForma();
  }

  opBlanquearForma(): void {
  }

  opEliminar(): void { }

  // Ejecuta la eliminación
  AccionEliminar(): void { }

  opPrepararModificar(): void {
    this.readOnly = false;
  }


  opVista(e: any): void {
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: '',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: ['ID_EMPLEADO|Id Empleado', 'NOMBRE_COMPLETO|Nombre', 'ESTADO|Estado'],
      Filtro: '',
      keyGrid: ['ID_EMPLEADO']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = "r_numreg";
    let newArray: any;
    switch (accion) {
      case "r_primero":
        this.prmUsrAplBarReg.r_numReg = 1;
        if (this.VDatosReg.length != 0) {
          // this.FEmpleados = JSON.parse(JSON.stringify(this.VDatosReg[0]));
        }
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
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
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));

        }
        this.readOnly = true;
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          newArray =
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        }
        this.opBlanquearForma();
        break;

      default:
        break;
    }

  }

  showColumnChooser(e: any) {
    if (!e) {
      this.eventsDatosGES000.next({
        accion: 'column chooser',
        filtro: 'filtro',
        config: { accion: 'column chooser', dataSource: this.selectedItemColumnChooser }
      });
    }
  }

  onSelectionChangedColumn(e: any) {
    e.addedItems.forEach((ele: any) => {
      if (this.selectedItemColumnChooser.indexOf(ele) === -1)
        this.selectedItemColumnChooser.push(ele);
    });
    e.removedItems.forEach((ele: any) => {
      const pos: any = this.selectedItemColumnChooser.indexOf(ele);
      if (pos > -1)
        this.selectedItemColumnChooser.splice(pos, 1);
    });
  }

  onTabChanged(e: any) {
    switch (e.itemIndex) {
      case 0:
        this.tabsMovilGespro[0].content = true;
        this.tabsMovilGespro[1].content = false;
        this.tabsMovilGespro[2].content = false;
        this.valoresObjetos('configurar', 'GESPRO');
        this.valoresObjetos('datos columnas', '');
        this.valoresObjetos('actividades', '');
        setTimeout(() => {
          this.eventsDatosGES000.next({
            accion: 'init',
            config: { accion: 'init', readOnly: this.readOnly, APLICACION: this.prmUsrAplBarReg.aplicacion }
          });
        }, 500);
        break;

      case 1:
        this.tabsMovilGespro[0].content = false;
        this.tabsMovilGespro[1].content = true;
        this.tabsMovilGespro[2].content = false;
        setTimeout(() => {
          this.eventsDatosTablas.next({
            accion: 'init',
            config: { accion: 'init', dataSource: this.DataResTareas }
          });
        }, 500);
        break;

      case 2:
        this.tabsMovilGespro[0].content = false;
        this.tabsMovilGespro[1].content = false;
        this.tabsMovilGespro[2].content = true;
        setTimeout(() => {
          this.eventsDatosCalendario.next({
            accion: 'init',
            config: { accion: 'init', dataSource: this.DataResTareas }
          });
        }, 500);
        break;

      default:
        break;
    }

  }

  onRespuestaGesInfo(datos: any) {
    switch (datos.accion) {
      case 'update datasource':
        this.prmUsrAplBarReg.accion = datos.accionLocal;
        this.opPrepararGuardar(datos, 'web');
        break;

      default:
        break;
    }
  }

  onRespuestaComponent(datos: any) {
    switch (datos.accion) {
      case 'cargar nodo':
        // this.valoresObjetos('actividad', e.data);
        break;

      case 'update datasource':
        this.prmUsrAplBarReg.accion = datos.accionLocal;
        this.opPrepararGuardar(datos, 'web');
        break;

      case 'historial tarea':
        const tarea: any = {
          TITULO: datos.data.NOMBRE,
          VISIBLE: true,
          DATA: datos.data,
          readOnly: datos.readOnly
        }
        this.eventsGesInfo.next({
          accion: 'cargar datos',
          config: { accion: 'update dataSource', dataSource: tarea }
        });
        break;

      case 'column chooser':
        datos.data.forEach((ele: any) => {
          if (this.selectedItemColumnChooser.indexOf(ele) === -1)
            this.selectedItemColumnChooser.push(ele);
        });
        break;

      case 'save column for user':
        this.sendStorageRequest(datos.data);
        break;

      case 'enviar email':
        //notificacion al Responsable
        this.envioNotificacion('enviar email', datos.data, '');
        break;

      default:
        break;
    }
  }

  opPrepararGuardar(datos: any, screen: string) {
    var prm: any;
    var act: any = JSON.parse(JSON.stringify(datos.data));
    prm = { USUARIO: this.USUARIO_LOCAL, ACTIVIDAD: act };

    // Guarda la actividad
    this._sdatos.saveActividades(datos.accionLocal, prm).subscribe((data: any) => {
      this._sdatos.loadingVisible = false;
      const res = validatorRes(data);
      if ((data.token !== undefined)) {
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      const mensaje = res[0].ErrMensaje;
      if (mensaje !== '') {
        Swal.fire({
          title: 'Error',
          text: mensaje,
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: false,
          confirmButtonColor: '#DF3E3E',
          confirmButtonText: 'Continuar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.eventsDatosGES000.next({
              accion: 'error',
              config: { accion: 'error de guardado', dataSource: prm.ACTIVIDAD, accionLocal: datos.accionLocal }
            });
          }
        });

      } else {
        showToast('Registro exitoso.', 'success');

        const TIMELINE = res[0].TIMELINE;
        const ACT = res[0].ID_ACTIVIDAD;
        const ACT_PA = res[0].ID_ACTIVIDAD_PADRE;
        const ASIGNADA_POR = res[0].ASIGNADA_POR;

        var TIPO_TAREA: any = '';
        switch (prm.ACTIVIDAD.CLASE) {
          case 'RESPONSABILIDADES':
            TIPO_TAREA = 'RESPONSABILIDAD';
            break;

          case 'TAREAS':
            TIPO_TAREA = 'TAREA';
            break;

          case 'EVENTOS':
            TIPO_TAREA = 'EVENTO';
            break;

          default:
            break;
        }

        // Actualiza tarea en datasource principal
        var regAct: any = {};
        const prmAct = prm.ACTIVIDAD;
        const exisAct = this.DataResTareas_prev.findIndex((t: any) => t.ID_ACTIVIDAD == prmAct.ID_ACTIVIDAD);
        regAct = {
          ID_ACTIVIDAD: ACT,
          ID_ACTIVIDAD_PADRE: prmAct.ID_ACTIVIDAD_PADRE,
          TEMP: ACT_PA,
          NOMBRE: prmAct.NOMBRE,
          DESCRIPCION: prmAct.DESCRIPCION,
          FECHA_INICIO: prmAct.FECHA_INICIO,
          FECHA_FIN: prmAct.FECHA_FIN,
          PRIORIDAD: prmAct.PRIORIDAD,
          ETIQUETAS: prmAct.ETIQUETAS,
          MEDICION: prmAct.MEDICION,
          ESTADO: prmAct.ESTADO,
          USUARIO: (exisAct == -1 ? this.USUARIO_LOCAL : prmAct.USUARIO),
          CLASE: prmAct.CLASE,
          TIPO: prmAct.TIPO,
          ANULADO: prmAct.ANULADO,
          REPETIR: prmAct.REPETIR,
          TODO_DIA: prmAct.TODO_DIA,
          FRECUENCIA: prmAct.FRECUENCIA,
          PERIODO_FRECUENCIA: prmAct.PERIODO_FRECUENCIA,
          INTERVALO_FRECUENCIA: prmAct.INTERVALO_FRECUENCIA,
          RESPONSABLE: prmAct.RESPONSABLE,
          COLABORADORES: prmAct.COLABORADORES,
          PROGRAMACION: prmAct.PROGRAMACION,
          ELIMINADO: prmAct.ELIMINADO,
          ORDEN: prmAct.ORDEN,
          DESCRIPCION_ESTILO: prmAct.DESCRIPCION_ESTILO,
          ASIGNADA_POR: ASIGNADA_POR,
          ACT_MIAS: (prmAct.RESPONSABLE == this.USUARIO_LOCAL ? true : false),
          ACT_ASIG: (exisAct == -1 ? true : (prmAct.USUARIO == this.USUARIO_LOCAL ? true : false)),
          ACT_AREA: false,
          ACT_COLAB: (prmAct.COLABORADORES.findIndex((col: any) => col.ID_RESPONSABLE == this.USUARIO_LOCAL) != -1 ? true : false),
          ACT_FIN: (prmAct.ESTADO == 'Finalizado' ? true : false),
          ErrMensaje: "",
          ITEM: prmAct.ITEM,
          btnComentarios: true,
          readOnlyResponsables: true,
          readOnlyColaboradores: true,
          readOnlyTipo: true,
          esEdit: true
        }
        this.DataResTareas_prev = [...this.DataResTareas_prev, regAct];
        const pos = this.DataResTareas.findIndex((d: any) => d.ID_ACTIVIDAD === prmAct.ID_ACTIVIDAD);
        this.DataResTareas[pos] = regAct;
        if (this.tabsMovilGespro[0].content) {
          this.eventsDatosGES000.next({
            accion: 'cargar datos',
            config: { accion: 'update dataSource', dataSource: this.DataResTareas }
          });
        }

        // Actualiza la padre si las vbles de filtro quedaron activas/inactivas
        const actPadre = this.DataResTareas_prev.findIndex((t: any) => t.ID_ACTIVIDAD == prmAct.ID_ACTIVIDAD_PADRE);
        if (actPadre != -1) {
          let actMias = false;
          if (this.DataResTareas_prev.findIndex((t: any) => t.ID_ACTIVIDAD_PADRE === prmAct.ID_ACTIVIDAD_PADRE && t.ACT_MIAS) !== -1) actMias = true;
          this.actualizFiltrosRecur(prmAct.ID_ACTIVIDAD_PADRE, 'ACT_MIAS', actMias);
          let actAsig = false;
          if (this.DataResTareas_prev.findIndex((t: any) => t.ID_ACTIVIDAD_PADRE === prmAct.ID_ACTIVIDAD_PADRE && t.ACT_ASIG) !== -1) actAsig = true;
          this.actualizFiltrosRecur(prmAct.ID_ACTIVIDAD_PADRE, 'ACT_ASIG', actAsig);
          let actColab = false;
          if (this.DataResTareas_prev.findIndex((t: any) => t.ID_ACTIVIDAD_PADRE === prmAct.ID_ACTIVIDAD_PADRE && t.ACT_COLAB) !== -1) actColab = true;
          this.actualizFiltrosRecur(prmAct.ID_ACTIVIDAD_PADRE, 'ACT_COLAB', actColab);
        }

        //notificacion al Responsable
        this.envioNotificacion('notificacion', prm.ACTIVIDAD, TIMELINE);

      };
    },
      (err => {
        this._sdatos.loadingVisible = false;
        // this.showModal(err.message, 'error');
        Swal.fire({
          title: 'Error',
          text: err.message,
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: false,
          confirmButtonColor: '#DF3E3E',
          confirmButtonText: 'Continuar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.eventsDatosGES000.next({
              accion: 'error',
              config: { accion: 'error de guardado', dataSource: prm.ACTIVIDAD, accionLocal: datos.accionLocal }
            });
          }
        });
      })
    );

  }

  envioNotificacion(fuente: any, prm: any, TIMELINE: any) {
    const TIPO_TAREA: any = prm.CLASE;
    const usr_env: any = this.DResponsables.filter((d: any) => d.ID_RESPONSABLE === this.USUARIO_LOCAL);
    let usr_rec: String[] = [];
    usr_rec.push(prm.RESPONSABLE);
    usr_rec.push(prm.USUARIO);
    if (prm.COLABORADORES.length > 0 && prm.COLABORADORES != undefined && prm.COLABORADORES != null) {
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

    if (fuente === 'notificacion') {
      sendMail = false;
    } else if (fuente === 'enviar email') {
      sendMail = true;
    }

    if (this.prmUsrAplBarReg.accion === 'new') {
      if (TIPO_TAREA === 'RESPONSABILIDAD' || TIPO_TAREA === 'TAREA')
        msj = usr_env[0].NOMBRE + ', te asignó una ' + TIPO_TAREA;
      if (TIPO_TAREA === 'EVENTO')
        msj = usr_env[0].NOMBRE + ', te asignó un ' + TIPO_TAREA;
      if (TIPO_TAREA === 'COMUNITARIAS')
        msj = usr_env[0].NOMBRE + ', te asignó un tarea ' + TIPO_TAREA;

      desc = usr_env[0].NOMBRE + ', te añadio como Colaborador a una ' + TIPO_TAREA;

    } else if (this.prmUsrAplBarReg.accion === 'update') {
      if (TIPO_TAREA === 'RESPONSABILIDAD' || TIPO_TAREA === 'TAREA')
        msj = usr_env[0].NOMBRE + ', modificó una ' + TIPO_TAREA;
      if (TIPO_TAREA === 'EVENTO')
        msj = usr_env[0].NOMBRE + ', modificó un ' + TIPO_TAREA;
      if (TIPO_TAREA === 'COMUNITARIAS')
        msj = usr_env[0].NOMBRE + ', modificó un tarea ' + TIPO_TAREA;

      desc = usr_env[0].NOMBRE + ', modifico una ' + TIPO_TAREA;
    }
    //Envia el responsable
    const posApl: any = this.generalesService.APLICACIONES.findIndex((d: any) => d.ID_APLICACION === this.prmUsrAplBarReg.aplicacion);

    var dataNotificacion: any = {
      SEND_EMAIL: sendMail,
      EMPRESA: this.EMPRESA,
      NOMBRE_APLICACION: posApl > -1 ? this.generalesService.APLICACIONES[posApl].NOMBRE : null,
      ESPEC: 'NOTIFICACION',
      ACCION: 'REGISTRO',
      APLICACION: this.prmUsrAplBarReg.aplicacion,
      FECHA: new Date(),
      USUARIO_ENV: usr_env[0],
      USUARIO_REC: usr_rec,
      DESCRIPCION: msj,
      TIMELINE: TIMELINE,
      TIPO: 'AUTOMATICA',
      FECHA_UPDATE: new Date(),
      ESTADO: 'Enviado'
    }
    // API guardado de datos
    const data1: any = {
      TIPO: 'NOTIFICACION',
      DATOS: dataNotificacion
    }
    this.socket.saveInfo('SAVE NOTIFICACION', data1).subscribe((data) => {
      const res = JSON.parse(data.data);
      if (res[0].ErrMensaje !== '') {
        this.showModal(res[0].ErrMensaje, 'Error al enviar notificación.');
      } else {
        //this.socket.sendNotifications(dataNotificacion);
      }
    });
  }

  // Actualiza recursivamente las actividades padre con los filtros activo/inactivo
  actualizFiltrosRecur(actPadre: any, nomFiltro: any, valor: boolean) {
    if (actPadre < 0) return;
    const ix = this.DataResTareas_prev.findIndex(p => p.ID_ACTIVIDAD == actPadre);
    if (ix !== -1) {
      this.DataResTareas_prev[ix][nomFiltro] = valor;
      const arrActPadre = this.DataResTareas_prev.find(p => p.ID_ACTIVIDAD == this.DataResTareas_prev[ix].ID_ACTIVIDAD_PADRE);
      if (arrActPadre !== undefined)
        this.actualizFiltrosRecur(arrActPadre.ID_ACTIVIDAD, nomFiltro, valor);
    }
  }

  onValueChangedFiltro(e: any) {
    this.openDropFiltroMaestro = false;
    if (e.addedItems !== undefined || e.removedItems !== undefined) {
      this.loadingVisible = true;
      if (e.addedItems !== undefined && e.addedItems.length > 0) {
        const npos: any = this.filtroMaestro.findIndex((d: any) => d.ID === e.addedItems[0].ID)
        this.filtroMaestro[npos].VALOR = true;
      }
      if (e.removedItems !== undefined && e.removedItems.length > 0) {
        const npos: any = this.filtroMaestro.findIndex((d: any) => d.ID === e.removedItems[0].ID)
        this.filtroMaestro[npos].VALOR = false;
      }
      this.selectAreas = [];
      this.readOnlyFiltros = false;
      this.filtrarActividades('Filtro Maestro');
      this.loadingVisible = false;
    }
  }

  onButtonClickAreas(e: any) {
    if (this.selectAreas.length > 0) {
      this.selectAreas = [];
      this.readOnlyFiltros = false;
      this.openDropFiltroAreas = false;
      this.filtrarActividades('Filtro Areas');
    } else {
      this.openDropFiltroAreas = !this.openDropFiltroAreas;
    }
  }

  onSelectionChangedArea(e: any) {
    const row = this.treeListAreas.instance.getSelectedRowKeys("true");
    this.selectAreas = row;
  }

  aceptarBottom(e: any, btn: any) {
    switch (btn) {
      case 'AREAS':
        this.openDropFiltroAreas = false;
        if (this.selectAreas.length > 0) {
          this.readOnlyFiltros = true;
          this.valoresObjetos('filtro areas', this.selectAreas);
        } else {
          this.readOnlyFiltros = false;
          this.filtrarActividades('Filtro Areas');
        }
        break;

      case 'COLUMNAS':
        this.openDropColumnChooser = false;
        this.eventsDatosGES000.next({
          accion: 'column chooser',
          filtro: 'filtro',
          config: { accion: 'column chooser', dataSource: this.selectedItemColumnChooser }
        });
        break;

      default:
        break;
    }

  }

  closeBottom(e: any, btn: any) {
    switch (btn) {
      case 'AREAS':
        this.readOnlyFiltros = false;
        this.openDropFiltroAreas = false;
        break;

      case 'COLUMNAS':
        this.openDropColumnChooser = false;
        this.selectedItemColumnChooser = this.selectedItemColumnChooser_prev;
        break;

      default:
        break;
    }
  }

  onButtonClickColumnas(e: any) {
    this.openDropColumnChooser = true;
    this.selectedItemColumnChooser_prev = JSON.parse(JSON.stringify(this.selectedItemColumnChooser));
  }

  // Compone cadena que muestra la programacion escogida
  setProgramacion(data: any) {
    var respProg = '';
    if ((data.data.FECHA_INICIO !== null && data.data.FECHA_INICIO !== undefined && data.data.FECHA_INICIO !== '') &&
      (data.data.FECHA_FIN !== null && data.data.FECHA_FIN !== undefined && data.data.FECHA_FIN !== '')
    ) {
      const fecha_inicial: any = new Date(data.data.FECHA_INICIO);
      const fecha_final: any = new Date(data.data.FECHA_FIN);

      const diaUno = fecha_inicial.getDate();
      const mesActualUno = fecha_inicial.getMonth() + 1;
      const añoActualUno = fecha_inicial.getFullYear();

      const diaDos = fecha_final.getDate();
      const mesActualDos = fecha_final.getMonth() + 1;
      const añoActualDos = fecha_final.getFullYear();

      if ((data.data.TODO_DIA) && (data.data.TODO_DIA !== null)) {
        if (fecha_inicial !== fecha_final) {
          if (fecha_inicial.getFullYear() === fecha_final.getFullYear()) {
            if (fecha_inicial.getMonth() === fecha_final.getMonth()) {
              respProg = 'El ' + diaUno + ' Todo el día';
            } else {
              respProg = diaUno + ' ' + fecha_inicial.toLocaleString('default', { month: 'short' }) + ' - ' +
                diaDos + ' ' + fecha_final.toLocaleString('default', { month: 'short' }) + ' Todo el día';
            }
          } else {
            respProg = diaUno + ' ' + fecha_inicial.toLocaleString('default', { month: 'short' }) + ' ' + fecha_inicial.getFullYear()
            ' - ' +
              diaDos + ' ' + fecha_final.toLocaleString('default', { month: 'short' }) + ' ' + fecha_final.getFullYear()
              + ' Todo el día'
          }
        } else {
          respProg = 'El' + diaUno + ' todo el dia';
        }
      }
      if ((!data.data.TODO_DIA && !data.data.REPETIR) && (data.data.TODO_DIA !== null && data.data.REPETIR !== null)) {
        if (fecha_inicial !== fecha_final) {
          if (fecha_inicial.getFullYear() === fecha_final.getFullYear()) {
            if (fecha_inicial.getMonth() === fecha_final.getMonth()) {
              respProg = diaUno + ' ' + fecha_inicial.toLocaleString('default', { month: 'short' });
            } else {
              respProg = diaUno + ' ' + fecha_inicial.toLocaleString('default', { month: 'short' }) + ' - ' +
                diaDos + ' ' + fecha_final.toLocaleString('default', { month: 'short' });
            }
          } else {
            respProg = diaUno + ' ' + fecha_inicial.toLocaleString('default', { month: 'short' }) + ' ' + fecha_inicial.getFullYear()
            ' - ' +
              diaDos + ' ' + fecha_final.toLocaleString('default', { month: 'short' }) + ' ' + fecha_final.getFullYear()
              + ' Todo el día'
          }
        } else {
          respProg = diaUno + ' ' + fecha_inicial.toLocaleString('default', { month: 'short' });
        }
      }
      if (data.data.REPETIR && data.data.REPETIR !== null) {
        var titfrec = '';
        switch (data.data.FRECUENCIA) {
          case 'Horas':
            if (data.data.PERIODO_FRECUENCIA !== null && data.data.PERIODO_FRECUENCIA !== undefined && data.data.PERIODO_FRECUENCIA !== '') {
              if (data.data.INTERVALO_FRECUENCIA !== null && data.data.INTERVALO_FRECUENCIA !== undefined && data.data.INTERVALO_FRECUENCIA > 0) {
                respProg = 'Siempre a las ' + data.data.PERIODO_FRECUENCIA + 'cada ' + data.data.INTERVALO_FRECUENCIA;
              } else {
                respProg = 'Siempre a las ' + data.data.PERIODO_FRECUENCIA;
              }
            } else {
              respProg = 'Siempre cada Hora';
            }
            break;

          case 'Diario':
            if (data.data.INTERVALO_FRECUENCIA !== null && data.data.INTERVALO_FRECUENCIA !== undefined && data.data.INTERVALO_FRECUENCIA > 0) {
              respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' días ';
            } else {
              respProg = 'Cada día';
            }
            break;

          case 'Semanal':
            if (data.data.PERIODO_FRECUENCIA !== null && data.data.PERIODO_FRECUENCIA !== undefined && data.data.PERIODO_FRECUENCIA !== '') {
              var frec = '';
              if (data.data.PERIODO_FRECUENCIA.length > 1) {
                data.data.PERIODO_FRECUENCIA.forEach((item: any) => {
                  frec = frec + ', ' + item;
                });
              } else if (data.data.PERIODO_FRECUENCIA.length > 1) {
                frec = data.data.PERIODO_FRECUENCIA[0];
              }
              if (data.data.INTERVALO_FRECUENCIA !== null && data.data.INTERVALO_FRECUENCIA !== undefined && data.data.INTERVALO_FRECUENCIA > 0) {
                if (data.data.PERIODO_FRECUENCIA.length > 1)
                  respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' semanas, los ' + frec;
                else
                  respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' semanas, el ' + frec;
              } else {
                if (data.data.PERIODO_FRECUENCIA.length > 1)
                  respProg = 'Cada semana, los ' + frec;
                else
                  respProg = 'Cada semana, el ' + frec;
              }
            } else {
              respProg = 'Cada semana';
            }
            break;

          case 'Mensual':
            if (data.data.PERIODO_FRECUENCIA !== null && data.data.PERIODO_FRECUENCIA !== undefined && data.data.PERIODO_FRECUENCIA !== '') {
              titfrec = data.data.PERIODO_FRECUENCIA.join(',');
              respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' meses, el ' + titfrec;
            } else {
              respProg = 'Cada mes';
            }
            break;

          case 'Anual':
            if (data.data.PERIODO_FRECUENCIA !== null && data.data.PERIODO_FRECUENCIA !== undefined && data.data.PERIODO_FRECUENCIA !== '') {
              titfrec = data.data.PERIODO_FRECUENCIA.join(',');
              respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' años, en ' + titfrec;
            } else {
              respProg = 'Cada año';
            }
            break;

          default:
            break;
        }
      }
    } else {
      if ((data.data.TODO_DIA && !data.data.REPETIR) && (data.data.TODO_DIA !== null && data.data.REPETIR !== null)) {
        respProg = 'El todo el dia';
      }
      if ((data.data.TODO_DIA && data.data.REPETIR) && (data.data.TODO_DIA !== null && data.data.REPETIR !== null)) {
        respProg = 'Repetir todo el dia';
      }
      if (data.data.REPETIR && data.data.REPETIR !== null) {
        var titfrec = '';
        switch (data.data.FRECUENCIA) {
          case 'Horas':
            if (data.data.PERIODO_FRECUENCIA !== null && data.data.PERIODO_FRECUENCIA !== undefined && data.data.PERIODO_FRECUENCIA !== '') {
              if (data.data.INTERVALO_FRECUENCIA !== null && data.data.INTERVALO_FRECUENCIA !== undefined && data.data.INTERVALO_FRECUENCIA > 0) {
                respProg = 'Siempre a las ' + data.data.PERIODO_FRECUENCIA + 'cada ' + data.data.INTERVALO_FRECUENCIA;
              } else {
                respProg = 'Siempre a las ' + data.data.PERIODO_FRECUENCIA;
              }
            } else {
              respProg = 'Siempre cada Hora';
            }
            break;

          case 'Diario':
            if (data.data.INTERVALO_FRECUENCIA !== null && data.data.INTERVALO_FRECUENCIA !== undefined && data.data.INTERVALO_FRECUENCIA > 0) {
              respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' días ';
            } else {
              respProg = 'Cada día';
            }
            break;

          case 'Semanal':
            if (data.data.PERIODO_FRECUENCIA !== null && data.data.PERIODO_FRECUENCIA !== undefined && data.data.PERIODO_FRECUENCIA !== '') {
              var frec = '';
              if (data.data.PERIODO_FRECUENCIA.length > 1) {
                data.data.PERIODO_FRECUENCIA.forEach((item: any) => {
                  frec = frec + ', ' + item;
                });
              } else if (data.data.PERIODO_FRECUENCIA.length > 1) {
                frec = data.data.PERIODO_FRECUENCIA[0];
              }
              if (data.data.INTERVALO_FRECUENCIA !== null && data.data.INTERVALO_FRECUENCIA !== undefined && data.data.INTERVALO_FRECUENCIA > 0) {
                if (data.data.PERIODO_FRECUENCIA.length > 1)
                  respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' semanas, los ' + frec;
                else
                  respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' semanas, el ' + frec;
              } else {
                if (data.data.PERIODO_FRECUENCIA.length > 1)
                  respProg = 'Cada semana, los ' + frec;
                else
                  respProg = 'Cada semana, el ' + frec;
              }
            } else {
              respProg = 'Cada semana';
            }
            break;

          case 'Mensual':
            if (data.data.PERIODO_FRECUENCIA !== null && data.data.PERIODO_FRECUENCIA !== undefined && data.data.PERIODO_FRECUENCIA !== '') {
              titfrec = data.data.PERIODO_FRECUENCIA.join(',');
              if (data.data.INTERVALO_FRECUENCIA !== null && data.data.INTERVALO_FRECUENCIA !== undefined && data.data.INTERVALO_FRECUENCIA > 0) {
                respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' meses, el ' + titfrec;
              } else {
                respProg = 'Cada mes, el ' + titfrec;
              }
            } else {
              respProg = 'Cada mes';
            }
            break;

          case 'Anual':
            if (data.data.PERIODO_FRECUENCIA !== null && data.data.PERIODO_FRECUENCIA !== undefined && data.data.PERIODO_FRECUENCIA !== '') {
              titfrec = data.data.PERIODO_FRECUENCIA.join(',');
              if (data.data.INTERVALO_FRECUENCIA !== null && data.data.INTERVALO_FRECUENCIA !== undefined && data.data.INTERVALO_FRECUENCIA > 0) {
                respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' años, en ' + titfrec;
              } else {
                respProg = 'Cada año, en ' + titfrec;
              }
            } else {
              respProg = 'Cada año';
            }
            break;

          default:
            break;
        }
      }
    }
    // Actualiza valor en el treelist
    data.data.PROGRAMACION = respProg;
    // this.TreeListTareas.instance.cellValue(data.rowIndex, 'PROGRAMACION', respProg);
    // this.filtrarActividades();
  }

  filtrarActividades(accionFiltro: string) {
    this.loadingVisible = true;
    this.selectAreas = [];
    let Nodos: any = JSON.parse(JSON.stringify(this.DataResTareas_prev.filter((d: any) => d.CLASE === 'NODOS' && (d.TIPO === '' || d.TIPO === null))));

    // APLICA EL FILTRO MAESTRO
    var newArray = JSON.parse(JSON.stringify(this.DataResTareas_prev));

    var DMaestro: any = [];
    // Activas
    if (this.filtroMaestro[0].VALOR) {
      if (DMaestro.length <= 0) {
        DMaestro = JSON.parse(JSON.stringify(newArray.filter((d: any) => d.ESTADO !== 'Finalizado' && d.ANULADO === false)));
      } else {
        DMaestro = [...DMaestro, ...JSON.parse(JSON.stringify(newArray.filter((d: any) => d.ESTADO !== 'Finalizado' && d.ANULADO === false)))];
      }
    }
    // Finalizadas
    if (this.filtroMaestro[1].VALOR) {
      if (DMaestro.length <= 0) {
        DMaestro = JSON.parse(JSON.stringify(newArray.filter((d: any) => d.ESTADO === 'Finalizado' && d.ANULADO === false)));
      } else {
        DMaestro = [...DMaestro, ...JSON.parse(JSON.stringify(newArray.filter((d: any) => d.ESTADO === 'Finalizado' && d.ANULADO === false)))];
      }
    }
    // Inactivas
    if (this.filtroMaestro[2].VALOR) {
      if (DMaestro.length <= 0) {
        DMaestro = JSON.parse(JSON.stringify(newArray.filter((d: any) => d.ANULADO === true)));
      } else {
        DMaestro = [...DMaestro, ...JSON.parse(JSON.stringify(newArray.filter((d: any) => d.ANULADO === true)))];
      }
    }
    // Comunitarias
    if (this.filtroMaestro[2].VALOR) {
      if (DMaestro.length <= 0) {
        DMaestro = JSON.parse(JSON.stringify(newArray.filter((d: any) => d.CLASE === 'COMUNITARIAS')));
      } else {
        DMaestro = [...DMaestro, ...JSON.parse(JSON.stringify(newArray.filter((d: any) => d.CLASE === 'COMUNITARIAS')))];
      }
    }

    //SE APLICA LOS SUB-FILTROS
    let DFiltrados: any = [];
    // Mis Actividades
    if (this.filtroActividades[0]) {
      const misAct: any = JSON.parse(JSON.stringify(DMaestro.filter((d: any) => d.ACT_MIAS === true)));
      for (let i = 0; i < misAct.length; i++) {
        if (DFiltrados.findIndex((a: any) => a.ID_ACTIVIDAD === misAct[i].ID_ACTIVIDAD) === -1)
          DFiltrados.push(misAct[i]);
      }
    }
    // Asignadas -- Que asignó a otros usuarios
    if (this.filtroActividades[1]) {
      const asig: any = JSON.parse(JSON.stringify(DMaestro.filter((d: any) => d.ACT_ASIG === true)));
      for (let i = 0; i < asig.length; i++) {
        if (DFiltrados.findIndex((a: any) => a.ID_ACTIVIDAD === asig[i].ID_ACTIVIDAD) === -1)
          DFiltrados.push(asig[i]);
      }
    }
    // Colaborador -- En aquellas que es colaborador
    if (this.filtroActividades[2]) {
      const col: any = JSON.parse(JSON.stringify(DMaestro.filter((d: any) => d.ACT_COLAB === true)));
      for (let i = 0; i < col.length; i++) {
        if (DFiltrados.findIndex((a: any) => a.ID_ACTIVIDAD === col[i].ID_ACTIVIDAD) === -1)
          DFiltrados.push(col[i]);
      }
    }
    // Comunitarias -- Aquellas que son publicas
    const col: any = JSON.parse(JSON.stringify(DMaestro.filter((d: any) => d.CLASE === 'COMUNITARIAS')));
    for (let i = 0; i < col.length; i++) {
      if (DFiltrados.findIndex((a: any) => a.ID_ACTIVIDAD === col[i].ID_ACTIVIDAD) === -1)
        DFiltrados.push(col[i]);
    }

    DFiltrados.forEach((tarea: any) => {
      if (DFiltrados.findIndex((d: any) => tarea.ID_ACTIVIDAD_PADRE === d.ID_ACTIVIDAD) === -1) {
        switch (tarea.CLASE) {
          case 'TAREAS':
            tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
            tarea.ID_ACTIVIDAD_PADRE = -10;
            break;
          case 'RESPONSABILIDADES':
            tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
            tarea.ID_ACTIVIDAD_PADRE = -20;
            break;
          case 'EVENTOS':
            tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
            tarea.ID_ACTIVIDAD_PADRE = -30;
            break;
          case 'COMUNITARIAS':
            tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
            tarea.ID_ACTIVIDAD_PADRE = -50;
            break;

          default:
            break;
        }
      }
    });

    if (DFiltrados.length > 0)
      this.DataResTareas = [...Nodos, ...DFiltrados];
    else
      this.DataResTareas = Nodos;

    this.loadingVisible = false;
    if (this.tabsMovilGespro[0].content) {
      this.eventsDatosGES000.next({
        accion: 'cargar datos',
        config: { accion: 'update dataSource', dataSource: this.DataResTareas, accionFiltro }
      });
      // this.eventsDatosGES000.next({ 
      //   accion: 'config column for user',
      //   config: { accion: 'config column for user', dataSource: this.config_obj} 
      // });
    }
    if (this.tabsMovilGespro[1].content) {
      this.eventsDatosTablas.next({
        accion: 'cargar datos',
        config: { accion: 'update dataSource', dataSource: this.DataResTareas }
      });
    }
    if (this.tabsMovilGespro[2].content) {
      this.eventsDatosCalendario.next({
        accion: 'cargar datos',
        config: { accion: 'update dataSource', dataSource: this.DataResTareas }
      });
    }
  }

  filtrarPorAreas(accionFiltro: string) {
    this.loadingVisible = true;
    let Nodos: any = JSON.parse(JSON.stringify(this.DataResTareas_prev.filter((d: any) => d.CLASE === 'NODOS' && (d.TIPO === '' || d.TIPO === null))));
    let DFiltrados: any = [];

    DFiltrados = this.DataFiltroAreas;
    // this.filtroMaestro[0].VALOR = false;
    // this.filtroMaestro[1].VALOR = false;
    // this.filtroMaestro[2].VALOR = false;
    // this.filtroActividades[0] = false;
    // this.filtroActividades[1] = false;
    // this.filtroActividades[2] = false;

    if (DFiltrados.length > 0)
      this.DataResTareas = [...Nodos, ...DFiltrados];
    else
      this.DataResTareas = Nodos;

    this.loadingVisible = false;
    if (this.tabsMovilGespro[0].content) {
      this.eventsDatosGES000.next({
        accion: 'cargar datos',
        config: { accion: 'update dataSource', dataSource: this.DataResTareas, accionFiltro }
      });
    }
    if (this.tabsMovilGespro[1].content) {
      this.eventsDatosTablas.next({
        accion: 'cargar datos',
        config: { accion: 'update dataSource', dataSource: this.DataResTareas }
      });
    }
    if (this.tabsMovilGespro[2].content) {
      this.eventsDatosCalendario.next({
        accion: 'cargar datos',
        config: { accion: 'update dataSource', dataSource: this.DataResTareas }
      });
    }
  }

  sendStorageRequest = (datos: any) => {
    const prm: any = {
      ID_APLICACION: this.prmUsrAplBarReg.aplicacion,
      ID_USUARIO: this.USUARIO_LOCAL,
      ID_OBJETO: datos.obj,
      CONFIGURACION: datos.state
    };
    this._sdatos.saveConfigObjeto('GUARDAR CONFIGURACION OBJETOS', prm).subscribe((data: any) => {
      const res = validatorRes(data);
      const mensaje = res[0].ErrMensaje;
      if (mensaje !== '') {
        showToast(mensaje, 'error');
      }
    },
      (err => {
        this._sdatos.loadingVisible = false;
        this.showModal(err.message, 'error');
      })
    );
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, data: any) {

    if (obj === 'permisos') {
      const user: any = localStorage.getItem('usuario');
      const prm = { USUARIO: user, ID_APLICACION: this.prmUsrAplBarReg.aplicacion };
      this._sdatos.getPermisos('PERMISOS', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        };
        this.PERMISOS = res[0];
      });
    };
    if (obj === 'config user treeList') {
      const prm: any = { ID_USUARIO: this.USUARIO_LOCAL, ID_APLICACION: this.prmUsrAplBarReg.aplicacion, ID_OBJETO: 'TreeListTareas' };
      this._sdatos.getConsultaConfigObjeto('CONSULTA CONFIGURACION OBJETOS', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
          return;
        }
        this.config_obj = JSON.parse(res[0].CONFIGURACION);
        this.eventsDatosGES000.next({
          accion: 'config column for user',
          filtro: 'config',
          config: { accion: 'config column for user', dataSource: this.config_obj }
        });
      });
    };
    if (obj === 'configurar') {
      this.loadingVisible = true;
      const prm = { ID_APLICACION: 'GES-001', PLANTILLA: data };
      this._sdatos.consulta('CONFIGURACION', prm).subscribe((data: any) => {
        this.loadingVisible = false;
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DColumnChooser = [];
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          showToast(mensaje, 'Error');
          this.DATOS_CONFIG = [];
        } else {
          this.DATOS_CONFIG = JSON.parse(JSON.stringify(newArray));
          // if (this.config_obj.columns) {
          //   for (let i = 0; i < this.config_obj.columns.length; i++) {
          //     const element = this.config_obj.columns[i];
          //     const npos:any = this.DATOS_CONFIG.findIndex((d:any) => d.CONFIG_PADRE === element.dataField && d.CONFIG === 'VISIBLE')
          //     if (npos > -1) {
          //       this.DATOS_CONFIG[npos].VALOR = (element.visible !== undefined && element.visible !== null) ? element.visible.toString() : "false";
          //       // if (element.width !== undefined && element.width !== null)
          //       //   this.DATOS_CONFIG[npos].WIDTH = element.width;
          //       if (element.visibleIndex !== undefined && element.visibleIndex !== null)
          //         this.DATOS_CONFIG[npos].INDEX = element.visibleIndex.toString();
          //     }
          //   }
          // }
          newArray.push({ readOnly: this.readOnly });
          var newData = this.DATOS_CONFIG.filter((d: any) => d.CONFIG_PADRE === 'COLUMNAS' && !d.CONFIG.match('ID_|Err|Mensaje|Read|btn'));
          newData.forEach((ele: any) => {
            const edi: any[] = this.DATOS_CONFIG.filter((d: any) => d.CONFIG === 'EDITABLE' && d.CONFIG_PADRE === ele.CONFIG);
            if (edi.length > 0) {
              const val = JSON.parse(edi[0].VALOR);
              if (val.valor)
                this.DColumnChooser.push(ele.CONFIG);
            }
          });
          this.eventsDatosGES000.next({ accion: 'configurar', dataSource: this.DATOS_CONFIG });
          this.valoresObjetos('config user treeList', '');
        }
      },
        ((err: any) => {
          this.showModal(err.message, 'Error');
        })
      );
    };
    // Filtro especial por áreas
    if (obj === 'filtro areas') {
      const prm: any = { AREAS: data };
      this.loadingVisible = true;
      this._sdatos.getActividades('FILTRO AREAS', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
          this.selectAreas = [];
          this.readOnlyFiltros = false;
          this.openDropFiltroAreas = false;
          this.loadingVisible = false;
          return;
        }
        for (let i = 0; i < res.length; i++) {
          const element = res[i];
          element.ITEM = i;
          element.btnComentarios = false;
          element.readOnlyResponsables = true;
          element.readOnlyColaboradores = true;
          element.readOnlyTipo = true;
          if (element.PERIODO_FRECUENCIA === null || element.PERIODO_FRECUENCIA === '' || element.PERIODO_FRECUENCIA === undefined) {
            element.PERIODO_FRECUENCIA = [];
          } else {
            element.PERIODO_FRECUENCIA = JSON.parse(element.PERIODO_FRECUENCIA);
          }
        };
        this.DataFiltroAreas_prev = JSON.parse(JSON.stringify(res));
        this.DataFiltroAreas_prev.forEach((tarea: any) => {
          if (tarea.CLASE !== 'NODOS') {
            tarea.readOnlyResponsables = true;
            tarea.readOnlyColaboradores = true;
            const prm: any = { data: tarea };
            this.setProgramacion(prm);
          };
        });
        this.DataFiltroAreas = JSON.parse(JSON.stringify(this.DataFiltroAreas_prev));
        this.loadingVisible = false;
        this.filtrarPorAreas('areas');

      });
    };
    if (obj === 'responsables' || obj === 'todos') {
      const prm: any = {};
      this._sdatos.getResponsables('RESPONSABLES', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          showToast(mensaje, 'Error');
        } else {
          for (let i = 0; i < res.length; i++) {
            const element = res[i];
            //   const npos: any = element.NOMBRE.indexOf(" ");
            //   const name = element.NOMBRE.charAt(0).toUpperCase();
            //   const lastName = element.NOMBRE.substring(npos + 1, element.NOMBRE.length + 1);
            //   const Lape = lastName.charAt(0).toUpperCase();
            //   const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
            //   element.iconNameUser = newName;
            element.ITEM = i;
          };
          this.DResponsables = res;
          this.eventsDatosGES000.next({
            accion: 'cargar datos',
            config: { accion: 'update data config', parametro: 'RESPONSABLE', dataSource: res }
          });
          this.eventsDatosGES000.next({
            accion: 'cargar datos',
            config: { accion: 'update data config', parametro: 'COLABORADORES', dataSource: res }
          });
          this.eventsGesInfo.next({
            accion: 'cargar datos',
            config: { accion: 'update data config', parametro: 'RESPONSABLE', dataSource: res }
          });
          this.eventsGesInfo.next({
            accion: 'cargar datos',
            config: { accion: 'update data config', parametro: 'COLABORADORES', dataSource: res }
          });
        }
      },
        ((err: any) => {
          this.showModal(err.message, 'Error');
        })
      );
    };
    if (obj === 'estados' || obj === 'todos') {
      const prm: any = { ID_GRUPO_DOMINIO: 'ESTADOS GES' };
      this._sdatos.getEstados('ESTADOS', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          showToast(mensaje, 'Error');
        } else {
          this.eventsDatosGES000.next({
            accion: 'cargar datos',
            config: { accion: 'update data config', parametro: 'ESTADO', dataSource: res }
          });
        }

      },
        ((err: any) => {
          this.showModal(err.message, 'Error');
        })
      );
    };
    if (obj === 'areas' || obj === 'todos') {
      const prm: any = { USUARIO: this.USUARIO_LOCAL };
      this._sdatos.getAreas('AREAS', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.noDataAreas = mensaje;
        } else {
          newArray.forEach((area: any) => {
            if (newArray.findIndex((d: any) => area.ID_AREA_SUPERIOR === d.ID_AREA) === -1)
              area.ID_AREA_SUPERIOR = 'RAIZ'
          });
          newArray.push({
            ID_AREA: 'RAIZ',
            DESCRIPCION: 'Area raiz', ID_UN: '',
            ITEM: 0,
            ID_AREA_SUPERIOR: '',
            ID_UN_ITEM: '',
            ESTADO: '',
            TIPO: '',
            IsActive: false
          });
          this.DGareasF = newArray;
          this.eventsDatosGES000.next({
            accion: 'init',
            config: { accion: 'readOnly', dataSource: res, readOnly: this.readOnly }
          });
        }

      },
        ((err: any) => {
          this.showModal(err.message, 'Error');
        })
      );
    };
    if (obj === 'prioridad' || obj === 'todos') {
      const prm: any = { ID_GRUPO_DOMINIO: 'PRIORIDAD GES' };
      this._sdatos.getEstados('ESTADOS', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          showToast(mensaje, 'Error');
        } else {
          this.eventsDatosGES000.next({
            accion: 'cargar datos',
            config: { accion: 'update data config', parametro: 'PRIORIDAD', dataSource: res }
          });
        }

      },
        ((err: any) => {
          this.showModal(err.message, 'Error');
        })
      );
    };
    if (obj === 'datos columnas') {
      const prm: any = {};
      this._sdatos.consulta('datos columnas', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          showToast(mensaje, 'Error');
        } else {
          for (let i = 0; i < res[0].RESPONSABLES.length; i++) {
            const element = res[0].RESPONSABLES[i];
            // const npos: any = element.NOMBRE.indexOf(" ");
            // const name = element.NOMBRE.charAt(0).toUpperCase();
            // const lastName = element.NOMBRE.substring(npos + 1, element.NOMBRE.length + 1);
            // const Lape = lastName.charAt(0).toUpperCase();
            // const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
            // element.iconNameUser = newName;
            element.ITEM = i;
          };
          for (let i = 0; i < res[0].COLABORADORES.length; i++) {
            const element = res[0].COLABORADORES[i];
            // const npos: any = element.NOMBRE.indexOf(" ");
            // const name = element.NOMBRE.charAt(0).toUpperCase();
            // const lastName = element.NOMBRE.substring(npos + 1, element.NOMBRE.length + 1);
            // const Lape = lastName.charAt(0).toUpperCase();
            // const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
            // element.iconNameUser = newName;
            element.ITEM = i;
            element.heightColaboradores = '40';
          };
          this.DResponsables = res[0].RESPONSABLES;
          this.eventsDatosGES000.next({
            accion: 'cargar datos',
            config: { accion: 'update data config', parametro: 'RESPONSABLE', dataSource: res[0].RESPONSABLES }
          });
          this.eventsDatosGES000.next({
            accion: 'cargar datos',
            config: { accion: 'update data config', parametro: 'COLABORADORES', dataSource: res[0].COLABORADORES }
          });
          this.eventsDatosGES000.next({
            accion: 'cargar datos',
            config: { accion: 'update data config', parametro: 'ESTADO', dataSource: res[0].ESTADOS }
          });

          this.eventsGesInfo.next({
            accion: 'cargar datos',
            config: { accion: 'update data config', parametro: 'RESPONSABLE', dataSource: res[0].RESPONSABLES }
          });
          this.eventsGesInfo.next({
            accion: 'cargar datos',
            config: { accion: 'update data config', parametro: 'COLABORADORES', dataSource: res[0].COLABORADORES }
          });
          this.eventsGesInfo.next({
            accion: 'cargar datos',
            config: { accion: 'update data config', parametro: 'ESTADO', dataSource: res[0].ESTADOS }
          });
        }
      },
        ((err: any) => {
          this.showModal(err.message, 'Error');
        })
      );
    };
    if (obj === 'actividades' || obj === 'todos') {
      const prm: any = { USUARIO: this.USUARIO_LOCAL };
      this.loadingVisible = true;
      this._sdatos.getActividades('ACTIVIDADES MAESTRO', prm).subscribe((data: any) => {
        this.loadingVisible = false;
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
          this.DataResTareas = [];
          return;
        }
        for (let i = 0; i < res.length; i++) {
          const element = res[i];
          element.ITEM = i;
          element.btnComentarios = false;
          element.readOnlyResponsables = true;
          element.readOnlyColaboradores = true;
          element.readOnlyTipo = true;
          element.COLABORADORES = JSON.parse(element.COLABORADORES);
          if (element.PERIODO_FRECUENCIA === null || element.PERIODO_FRECUENCIA === '' || element.PERIODO_FRECUENCIA === undefined) {
            element.PERIODO_FRECUENCIA = [];
          } else {
            element.PERIODO_FRECUENCIA = JSON.parse(element.PERIODO_FRECUENCIA);
          }
        };
        // this.DataResTareas = JSON.parse(JSON.stringify(res));
        this.DataResTareas_prev = JSON.parse(JSON.stringify(res));
        this.DataResTareas_prev.forEach((tarea: any) => {
          if (tarea.CLASE !== 'NODOS') {
            if (this.DataResTareas_prev.findIndex((d: any) => tarea.ID_ACTIVIDAD_PADRE === d.ID_ACTIVIDAD) === -1) {
              switch (tarea.CLASE) {
                case 'TAREAS':
                  tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
                  tarea.ID_ACTIVIDAD_PADRE = -10;
                  break;
                case 'RESPONSABILIDADES':
                  tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
                  tarea.ID_ACTIVIDAD_PADRE = -20;
                  break;
                case 'EVENTOS':
                  tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
                  tarea.ID_ACTIVIDAD_PADRE = -30;
                  break;
                case 'COMUNITARIAS':
                  tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
                  tarea.ID_ACTIVIDAD_PADRE = -50;
                  break;

                default:
                  break;
              }
            }

            tarea.isEdit = false;
            tarea.readOnlyResponsables = true;
            tarea.readOnlyColaboradores = true;
            const prm: any = { data: tarea };
            this.setProgramacion(prm);
          };
        });
        //Se asignan valores por defecto al filtro
        // this.filtroMaestro[0].VALOR = true;
        // this.filtroActividades[0] = true;
        // this.selectFiltroMaestro = [1];
        this.filtrarActividades('actividades');
      });
    };
  }

  // Imprimir reporte de aplicación
  imprimirReporte(id_reporte: any, archivo: any, datosrpt: any) {

    let filtroRep = { FILTRO: '' };
    const prmLiq = {
      clid: localStorage.getItem('empresa'),
      usuario: localStorage.getItem('usuario'),
      idrpt: archivo,
      id_reporte,
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      filtro: filtroRep
    };

    // Si no existe, no está abierta entonces agrega Tab
    const listaTab = this.tabService.tabs.find(c => c.aplicacion === id_reporte);
    if (listaTab === undefined)
      GlobalVariables.listaAplicaciones.unshift({ aplicacion: id_reporte, barra: undefined, statusEdicion: '' });

    // Abre pestaña con nuevo reporte
    this.tabService.addTab(new Tab(VisorrepComponent,    // visor
      datosrpt.text,        // título
      { parent: "PrincipalComponent", args: prmLiq }, // parámetro: reporte,filtro
      id_reporte,           // código del reporte
      '',
      'reporte',
      true
    ));

  }

  showModal(mensaje: any, title: any) {
    const tipo = title;
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo === 'Error' ? 'DF3E3E' : '#0F4C81 !important',
      title: title,
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
      stopKeydownPropagation: false,
    });
  }

}
