import { Component, ViewChild } from '@angular/core';
import {
  DxButtonModule, DxDataGridModule, DxDropDownBoxModule,
  DxFormComponent, DxFormModule, DxLoadPanelModule, DxSchedulerComponent,
  DxSchedulerModule, DxSelectBoxModule, DxTabsModule, DxTagBoxModule,
  DxTextBoxModule, DxTreeListModule, DxValidatorModule
} from 'devextreme-angular';
import { lastValueFrom, Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import Swal from 'sweetalert2';
import { GES003Service } from 'src/app/services/GES003/GES003.service';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { CommonModule, DatePipe } from '@angular/common';
import { DataActividad, clsCargos } from './clsGES003.class';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { GES00Service } from 'src/app/shared/Tareas/Service/GES00.service';
import { MatTabsModule } from '@angular/material/tabs';
import { GES00302Component } from './GES00302/GES00302.component';
import { showToast } from '../../shared/toast/toastComponent.js';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { GES000Component } from '../GESPRO/GES000/GES000.component';
import { GeneralesService } from 'src/app/services/generales/generales.service';

@Component({
  selector: 'app-GES003',
  templateUrl: './GES003.component.html',
  styleUrls: ['./GES003.component.css'],
  standalone: true,
  imports: [DxDataGridModule, DxButtonModule, CommonModule, DxTreeListModule, DxSelectBoxModule,
    DxDropDownBoxModule, DxTagBoxModule, DxFormModule, DxTextBoxModule, DxValidatorModule,
    VistarapidaComponent, DxLoadPanelModule, MatTabsModule, GES00302Component,
    DxTabsModule, CdkAccordionModule, DxSchedulerModule, GES000Component
  ]
})
export class GES003Component {

  @ViewChild("formCargos", { static: false }) formCargos: DxFormComponent;
  @ViewChild("schedulerProg", { static: false }) schedulerProg: DxSchedulerComponent;

  eventsSubjectDatos: Subject<any> = new Subject<any>();

  // Variables fijas de la aplicación
  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  subs_tareas: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string;
  VDatosReg: any[] = [];
  readOnly: boolean = true;
  readOnlyFcargos: boolean = true;
  readOnlyEstado: boolean = true;
  loadingVisible: boolean = false;
  openDropTipo: boolean = false;
  openDropEstado: boolean = false;
  integridadReferencial: boolean = false;

  items: any = ['Responsabilidades', 'Responsables'];
  accordionExpand = [true, true];

  // Variables de datos
  FCargos: clsCargos;
  treeSecciones: any;
  DCargos: any[];
  DResponsables: any[];
  data_prev: any = [];
  treeBoxCargo: any[] = [];
  gridBoxResponsables: any[] = [];
  DActividadesCargo: any[] = [];
  tareasEliminadas: any[] = [];
  responsablesEliminados: any[] = [];
  isTreeBoxOpened: boolean;
  isGridBoxOpened: boolean;
  focusedRowIndex: number;
  conCambios: number = 0;
  focusedRowKey: string;
  colCountByScreen: object;
  QFiltro: any;
  DClaseAtr: any;
  imageAtributo: string = '';
  valItemCargo: number;
  keyItemGrid: number;
  DlEstados: any = ["ACTIVO", "INACTIVO"];
  DlTipo: any = ["Contractual", "Funcional"];
  openResponsables: boolean;
  dropDownOptions = {
    width: 600,
    height: 400,
    hideOnParentScroll: true,
    container: '#router-container'
  };

  // Operaciones de grid
  filaDatosEdit: any;
  filaDatosEditOld: any;
  filaDatosSelecc: any;
  modoImagen: boolean = false;
  altoFilaDatos: string[] = ["10px"];
  seleccDelete: boolean[] = [false];
  modoSeleccDelete: boolean = false;
  responsablesCargos: any;
  tabSeleccIndex: number = 0;
  eventsGestor: Subject<any> = new Subject<any>();

  PERMISOS: any;
  targetIdTooltip: string;
  tooltipText: string;
  toolTipVisible: boolean = false;

  // notificaciones
  toaVisible: boolean;
  type = 'info'
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';
  USUARIO_LOCAL: any = '';

  tabsCargos: any = [true, false];

  dataProg: any[] = [
    {
      text: 'Website Re-Design Plan',
      startDate: new Date('2021-03-29T16:30:00.000Z'),
      endDate: new Date('2021-03-29T18:30:00.000Z'),
      allDay: false
    }];
  fechaHoy: Date = new Date(2023, 2, 28);
  dataAct: DataActividad[] = [
    {
      actividad: 0,
      startDate: new Date(2015, 4, 24, 9, 10),
      endDate: new Date(2015, 4, 24, 11, 1)
    }, {
      actividad: 1,
      startDate: new Date(2015, 4, 24, 11, 30),
      endDate: new Date(2015, 4, 24, 13, 2)
    }
  ];

  //Variables y datos del GES000
  DATOS_CONFIG: any[] = [];
  NODO_PRINCIPAL: {};

  constructor(
    private _sdatos: GES003Service,
    private _sbarreg: SbarraService,
    private tabService: TabService,
    private _sfiltro: SfiltroService,
    private SVisor: SvisorService,
    private Ges00Service: GES00Service,
    public datepipe: DatePipe,
    public generalesService: GeneralesService,
  ) {

    // Servicio de barra de registro
    this.subscription = this._sbarreg
      .getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((dempeg) => {
        // Valida si la petición es para esta aplicacion
        if (dempeg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(dempeg);
      });

    // Respuesta del filtro
    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe(resp => {
      // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opPrepararBuscar(resp);
    });

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex(d => d.ID_CARGO === resp.ID_CARGO);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    });

    this.onValueChangedTipo = this.onValueChangedTipo.bind(this);

  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    const user: any = localStorage.getItem("usuario");
    this.prmUsrAplBarReg = {
      tabla: "CARGOS",
      aplicacion: "GES-003",
      usuario: user,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_modificar: false }
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';
    this.readOnly = true;
    // Inicializacion de items
    this.FCargos = {
      ID_CARGO: '',
      CONSECUTIVO: 0,
      NOMBRE: '',
      DESCRIPCION: '',
      ESTADO: '',
      TIPO: '',
      RESPONSABLES: [],
      RESPONSABILIDADES: [],
      CONDICIONES: [],
    };
    this.valoresObjetos('configurar', 'CARGOS');
    this.valoresObjetos('actividad', -20);
    this.valoresObjetos('todos', '');
    setTimeout(() => {
      this.eventsSubjectDatos.next({
        accion: 'init',
        config: { accion: 'init', readOnly: this.readOnly, APLICACION: this.prmUsrAplBarReg.aplicacion }
      });
    }, 500);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  getSizeQualifier(width: any) {
    if (width < 768) return "xs";
    if (width < 992) return "sm";
    if (width < 1366) return "md";
    return "lg";
  }

  onTabChanged(e: any) {
    switch (e.itemIndex) {
      case 0:
        this.tabsCargos[0] = true;
        this.tabsCargos[1] = false;
        break;

      case 1:
        this.tabsCargos[0] = false;
        this.tabsCargos[1] = true;
        break;

      default:
        break;
    }
  }

  onRespuestaComponent(e: any) {
    switch (e.accion) {
      case 'cargar nodo':
        this.valoresObjetos('actividad', e.data);
        break;
      case 'update datasource':
        this.conCambios++;
        if (e.accionLocal.match('new|update')) {
          const npos: any = this.FCargos.RESPONSABILIDADES.findIndex((d: any) => d.ID_ACTIVIDAD === e.data.ID_ACTIVIDAD);
          if (npos !== -1)
            this.FCargos.RESPONSABILIDADES[npos] = e.data;
          else
            this.FCargos.RESPONSABILIDADES.push(e.data);

        } else if (e.accionLocal === 'delete') {
          const npos: any = this.FCargos.RESPONSABILIDADES.findIndex((d: any) => d.ID_ACTIVIDAD === e.data.ID_ACTIVIDAD);
          if (npos !== -1)
            this.FCargos.RESPONSABILIDADES.splice(npos, 1);
        }
        break;

      default:
        break;
    }
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        const user: any = localStorage.getItem("usuario");
        this.prmUsrAplBarReg = {
          tabla: "CARGOS",
          aplicacion: "GES-003",
          usuario: user,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_modificar: false }
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.readOnly = false;
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.mnuAccion = "update";
        this.opPrepararModificar(this.mnuAccion);
        break;

      case "r_guardar":
        if (this.mnuAccion === "copiar")
          this.mnuAccion = "new";
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case "r_copiar":
        Swal.fire({
          title: '',
          text: 'Para copiar este Registro recuerde: Se agregara un nuevo Código.',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: false,
          confirmButtonColor: '#DF3E3E',
          confirmButtonText: 'Aceptar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.mnuAccion = "copiar";
            this.readOnly = false;
            this.readOnlyFcargos = true;
            this.readOnlyEstado = true;
            this.FCargos.ID_CARGO = '';
            this.valoresObjetos('consecutivo', '');
            this.FCargos.RESPONSABILIDADES.forEach((tar: any) => {
              tar.TIPO = this.FCargos.ID_CARGO;
            });
            this.opPrepararModificar(this.mnuAccion);
            this.conCambios++;
            this.formCargos.instance._refresh();
          }
        });
        break;


      case 'r_buscar':
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_buscar_ejec':
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case "r_eliminar":
        // if (this.FCargos.ESTADO === 'INACTIVO')
        //   showToast('El cargo ya esta Inactivo.', 'warning');
        // else
        if (this.prmUsrAplBarReg.r_totReg > 0)
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
        var mensaje = '¿Desea cancelar la operación?';
        if (this.conCambios != 0) mensaje = 'Desea cancelar sin guardar cambios?';
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
            this.readOnly = true;
            this.readOnlyFcargos = true;
            this.readOnlyEstado = true;
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} }
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            // Restituye los valores
            this.mnuAccion = "";
            if (this.VDatosReg.length > 0) {
              this.opIrARegistro('r_numreg');
            } else {
              this.FCargos = {
                ID_CARGO: '',
                CONSECUTIVO: 0,
                NOMBRE: '',
                DESCRIPCION: '',
                ESTADO: '',
                TIPO: '',
                RESPONSABLES: [],
                RESPONSABILIDADES: [],
                CONDICIONES: [],
              };
              this.formCargos.instance._refresh();
              this.eventsSubjectDatos.next({
                accion: 'cargar datos',
                config: { accion: 'update dataSource', readOnly: this.readOnlyFcargos, dataSource: [...this.FCargos.RESPONSABILIDADES, this.NODO_PRINCIPAL] }
              });
              this._sdatos.setObsResponsables({
                accion: 'cancelar',
                Datos: this.FCargos,
                readOnly: this.readOnly
              });
              // this._sdatos.setObsCondiciones({
              //   accion: 'cancelar',
              //   Datos: this.FCargos,
              //   readOnly: this.readOnly
              // });
            }

          }
        });

        break;

      case "r_vista":
        this.opVista();
        break;

      case 'r_refrescar':
        this.refreshComponent();
        break;

      case "r_imprimir":
        this.imprimirReporte(operMenu.operacion.id_reporte, operMenu.operacion.archivo, operMenu.operacion.data_rpt);
        break;

      case "r_configurar":
        break;

      default:
        break;
    }
  }
  refreshComponent() {
    if (this.FCargos.ID_CARGO !== '' && this.FCargos.ID_CARGO !== null && this.FCargos.ID_CARGO !== undefined) {
      this.loadingVisible = true;
      const prm = {
        CARGOS: [
          { "CAMPO": "ID_CARGO", "EXPRESION": this.FCargos.ID_CARGO, "TABLA": "CARGOS" }
        ]
      };
      this._sdatos
        .consulta_filtro('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          try {
            this.loadingVisible = false;
            const res = JSON.parse(data.data);
            if ((data.token != undefined)) {
              const refreshToken = data.token;
              localStorage.setItem("token", refreshToken);
            }
            const datares = res;
            if (datares[0].ErrMensaje === '') {
              let cont: number = 0;
              datares[0].RESPONSABILIDADES.forEach((ele: any) => {
                cont++;
                ele.ITEM = cont;
                this.setProgramacion(ele);
              });
              this.FCargos.ID_CARGO = datares[0].ID_CARGO;
              this.FCargos.NOMBRE = datares[0].NOMBRE;
              this.FCargos.DESCRIPCION = datares[0].DESCRIPCION;
              this.FCargos.RESPONSABLES = datares[0].RESPONSABLES;
              this.FCargos.RESPONSABILIDADES = datares[0].RESPONSABILIDADES;
              this.eventsSubjectDatos.next({
                accion: 'cargar datos',
                config: { accion: 'update dataSource', readOnly: this.readOnlyFcargos, dataSource: [...this.FCargos.RESPONSABILIDADES, this.NODO_PRINCIPAL] }
              });
              this._sdatos.setObsResponsables({
                accion: 'cargar datos',
                Datos: this.FCargos,
                readOnly: this.readOnly
              });
              this.formCargos.instance._refresh();
            }
          } catch (error) {
            this.loadingVisible = false;
            this.readOnly = true;
            this.showModal(error);
          }
        });
    }
  };

  onInitializedFromResponsables(e: any, data: any) {
    for (let i = 0; i < data.length; i++) {
      const npos: any = data[i].NOMBRE.indexOf(" ");
      const name = data[i].NOMBRE.charAt(0).toUpperCase();
      const lastName = data[i].NOMBRE.substring(npos + 1, data[i].NOMBRE.length + 1);
      const Lape = lastName.charAt(0).toUpperCase();
      const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
      data[i].iconNameUser = newName;
    }
  }

  onValueChangedIdCargo(e: any) {
    if (this.mnuAccion.match('new|update|copiar')) {
      if (e.value !== '') {
        const prm: any = { ID_CARGO: e.value };
        this._sdatos.getExisteIdCargo('existe cargo', prm).subscribe((data: any) => {
          const res = validatorRes(data);
          if (res[0].ErrMensaje !== '') {
            Swal.fire({
              title: '',
              text: '',
              html: res[0].ErrMensaje +
                ", ¿Asignar un nuevo Código?.",
              iconHtml: "<i class='icon-alert-ol'></i>",
              showCancelButton: false,
              confirmButtonColor: '#DF3E3E',
              confirmButtonText: 'Si, continuar'
            }).then((result) => {
              if (result.isConfirmed) {
                this.FCargos.ID_CARGO = '';
                this.FCargos.CONSECUTIVO = 0;
                this.readOnlyFcargos = true;
                this.readOnlyEstado = true;
                this.valoresObjetos('consecutivo', '');
              }
            });
          } else {
            this.FCargos.ID_CARGO = e.value;
            this.readOnlyFcargos = false;
            this.readOnlyEstado = false;
            // Inicializa treelist de responsabilidades
            this.eventsGestor.next({ accion: 'ini' });
            this.Ges00Service.setObsActividades({ accion: this.mnuAccion, readOnly: this.readOnlyFcargos });
            this._sdatos.setObsResponsables({ accion: this.mnuAccion, readOnly: this.readOnlyFcargos });
            // this.formCargos.instance._refresh();
            this.conCambios++;
          }
        });
      } else {
        this.FCargos.ID_CARGO = e.value;
        this.readOnlyFcargos = true;
        this.readOnlyEstado = true;
        this.Ges00Service.setObsActividades({ accion: this.mnuAccion, readOnly: this.readOnlyFcargos });
        this._sdatos.setObsResponsables({ accion: this.mnuAccion, readOnly: this.readOnlyFcargos });
        // this.formCargos.instance._refresh();
        this.conCambios++;
      };

    }

  }

  onValueChangedNombre(e: any) {
    if (this.mnuAccion.match('new|update|copiar')) {
      this.FCargos.NOMBRE = e.value;
      this.conCambios++;
    }
  }

  onValueChangedDescripcion(e: any) {
    if (this.mnuAccion.match('new|update|copiar')) {
      this.FCargos.DESCRIPCION = e.value;
      this.conCambios++;
    }
  }

  onValueChangedEstado(e: any) {
    if (this.mnuAccion.match('new|update|copiar')) {
      if (e.value !== null && e.value !== undefined)
        this.FCargos.ESTADO = e.value;
      else
        this.FCargos.ESTADO = '';
      //se verifica el estado anterior para asi, activar las Responsabilidades ya inactivas
      if (e.previousValue === 'INACTIVO' && e.value === 'ACTIVO') {
        this.FCargos.RESPONSABILIDADES.forEach((res: any) => {
          res.INACTIVO = false;
        });
        this.eventsSubjectDatos.next({
          accion: 'cargar datos',
          config: { accion: 'update dataSource', readOnly: this.readOnlyFcargos, dataSource: [...this.FCargos.RESPONSABILIDADES, this.NODO_PRINCIPAL] }
        });
      }
      this.openDropEstado = false;
      this.conCambios++;
    }
  }

  onValueChangedTipo(e: any) {
    if (this.mnuAccion.match('new|update|copiar')) {
      if (e.value !== '') {
        this.FCargos.TIPO = e.value;
        this.openDropTipo = false;
        this.conCambios++;
        this.valoresObjetos('consecutivo', '');
      } else {
        this.readOnlyFcargos = true;
        this.readOnlyEstado = true;
        this.openDropTipo = false;
      }
    }
  }

  // Llama a Acciones de registro

  opPrepararNuevo(): void {
    this.seleccDelete = [false];
    this.FCargos = {
      ID_CARGO: '',
      CONSECUTIVO: 0,
      NOMBRE: '',
      DESCRIPCION: '',
      ESTADO: 'ACTIVO',
      TIPO: '',
      RESPONSABLES: [],
      RESPONSABILIDADES: [],
      CONDICIONES: [],
    };
    // this.Ges00Service.setObsActividades({
    //   accion: 'new',
    //   Datos: this.FCargos,
    //   readOnly: this.readOnly
    // })
    this.eventsSubjectDatos.next({
      accion: 'cargar datos',
      config: { accion: 'update dataSource', readOnly: this.readOnlyFcargos, dataSource: [this.NODO_PRINCIPAL] }
    });

    // this.schedulerProg.instance.showAppointmentPopup(this.dataAct[0], false);
  }

  opBlanquearForma(): void {
    this.FCargos = {
      ID_CARGO: '',
      CONSECUTIVO: 0,
      NOMBRE: '',
      DESCRIPCION: '',
      ESTADO: '',
      TIPO: '',
      RESPONSABLES: [],
      RESPONSABILIDADES: [],
      CONDICIONES: [],
    };
    this.eventsSubjectDatos.next({
      accion: 'cargar datos',
      config: { accion: 'update dataSource', readOnly: this.readOnlyFcargos, dataSource: [this.NODO_PRINCIPAL] }
    });
    this._sdatos.setObsResponsables({
      accion: 'blanquear forma',
      Datos: this.FCargos
    })
  }

  async opPrepararModificar(accion: string) {
    await this.validarIntegridad('update');
    if (this.integridadReferencial) {
      this.readOnly = true;
      this.readOnlyFcargos = false;
      this.eventsSubjectDatos.next({
        accion: 'init',
        config: { accion: 'init', readOnly: this.readOnlyFcargos, APLICACION: this.prmUsrAplBarReg.aplicacion }
      });
      this._sdatos.setObsResponsables({ accion: this.mnuAccion, readOnly: this.readOnlyFcargos });
    }
  }

  async validarIntegridad(accion: string) {
    const prm: any = { ID_CARGO: this.FCargos.ID_CARGO };
    const apiRest = this._sdatos.getIntegridad('integridad referencial', prm);
    let res = await lastValueFrom(apiRest, { defaultValue: true });
    res = JSON.parse(res.data);
    if (res[0].ErrMensaje !== '') {
      if (accion !== 'delete') {
        await Swal.fire({
          title: '',
          text: '',
          html: res[0].ErrMensaje,
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#DF3E3E',
          confirmButtonText: 'Continuar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.integridadReferencial = true;
            this.readOnlyEstado = true;
          }
          if (result.isDismissed) {
            this.integridadReferencial = false;
          }
        });
      } else {
        await Swal.fire({
          title: '',
          text: '',
          html: res[0].ErrMensaje +
            ", No se puede Eliminar el cargo.",
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: false,
          confirmButtonColor: '#DF3E3E',
          confirmButtonText: 'Continuar'
        }).then((result) => {
          this.integridadReferencial = false;
        });
      }
    } else {
      this.integridadReferencial = true;
      this.readOnlyEstado = false;
    }
  }

  opPrepararBuscar(accion: any) {
    if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Cargos",
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { CARGOS: arrFiltro };

      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this._sdatos
        .consulta_filtro('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          try {
            const res = JSON.parse(data.data);
            this._sfiltro.enConsulta = false;
            if ((data.token != undefined)) {
              const refreshToken = data.token;
              localStorage.setItem("token", refreshToken);
            }
            const datares = res;
            if (datares[0].ErrMensaje === '') {
              if (datares[0].NOMBRE === 'Gestor de procesos')
                datares.splice(0, 1);
              // Asocia datos
              if (datares ?? '' != '') {
                for (let i = 0; i < datares.length; i++) {
                  let cont: number = 0;
                  datares[i].RESPONSABILIDADES.forEach((ele: any) => {
                    cont++;
                    ele.ITEM = cont;
                    ele.visibleBtnAgregar = false;
                    ele.visibleBtnComentarios = false;
                    this.setProgramacion(ele);
                  });

                  if (datares[i].RESPONSABLES.length > 0) {
                    datares[i].RESPONSABLES.forEach((ele: any) => {
                      if (ele.NOMBRE !== '' && ele.NOMBRE !== null) {
                        const npos: any = ele.NOMBRE.indexOf(" ");
                        const name = ele.NOMBRE.charAt(0).toUpperCase();
                        const lastName = ele.NOMBRE.substring(npos + 1, ele.NOMBRE.length + 1);
                        const Lape = lastName.charAt(0).toUpperCase();
                        const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
                        ele.iconNameUser = newName;
                      }
                    });
                  }
                };

                this.VDatosReg = datares;
                this.FCargos.ID_CARGO = datares[0].ID_CARGO;
                this.FCargos.NOMBRE = datares[0].NOMBRE;
                this.FCargos.DESCRIPCION = datares[0].DESCRIPCION;
                this.FCargos.RESPONSABLES = datares[0].RESPONSABLES;
                this.FCargos.RESPONSABILIDADES = datares[0].RESPONSABILIDADES;
                this.QFiltro = datares[0].QFILTRO;
              }
            } else {
              this.VDatosReg = [];
              this.loadingVisible = false;
              showToast(res[0].ErrMensaje, 'warning');
              return;
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
            this.readOnly = true;
          } catch (error) {
            this.loadingVisible = false;
            this.readOnly = true;
            this._sfiltro.enConsulta = false;
            this.showModal(error);
          }
        });
    }
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        this.prmUsrAplBarReg.r_numReg = 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        if (this.VDatosReg.length != 0) {
          this.FCargos = JSON.parse(JSON.stringify(this.VDatosReg[0]));
        }
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1
            ? 1
            : this.prmUsrAplBarReg.r_numReg - 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.FCargos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.FCargos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.FCargos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
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
          this.FCargos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        }
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          this.FCargos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        } else {
          this.opBlanquearForma();
        }
        break;

      default:
        break;
    }

    if (this.VDatosReg.length <= 0) {
      this.opBlanquearForma();
      this.prmUsrAplBarReg = {
        ...this.prmUsrAplBarReg,
        accion: "r_ini",
        error: "",
        r_numReg: 0,
        r_totReg: 0,
        operacion: { r_modificar: false }
      };
    }

    this.FCargos.RESPONSABILIDADES.forEach((tarea: any) => {
      if (this.FCargos.RESPONSABILIDADES.findIndex((d: any) => tarea.ID_ACTIVIDAD_PADRE === d.ID_ACTIVIDAD) === -1) {
        tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
        tarea.ID_ACTIVIDAD_PADRE = -20;
      }
    });
    this.eventsSubjectDatos.next({
      accion: 'cargar datos',
      config: { accion: 'update dataSource', readOnly: this.readOnlyFcargos, dataSource: [...this.FCargos.RESPONSABILIDADES, this.NODO_PRINCIPAL] }
    });
    this._sdatos.setObsResponsables({
      accion: 'cargar datos',
      Datos: this.FCargos,
      readOnly: this.readOnly
    });

  }

  opCargarResponsabilidades(data: any) {
    switch (data.accion) {
      case 'cargar':
        const npos: any = this.FCargos.RESPONSABILIDADES.findIndex((d: any) => d.ID_ACTIVIDAD === data.data.ACTIVIDAD.ID_ACTIVIDAD);
        if (npos !== -1) {
          this.FCargos.RESPONSABILIDADES[npos] = data.data.ACTIVIDAD;
        } else {
          this.FCargos.RESPONSABILIDADES.push(data.data.ACTIVIDAD);
        }
        this.conCambios++;
        break;

      case 'eliminar':
        this.tareasEliminadas.push(data.data);
        this.conCambios++;
        break;

      default:
        break;
    }
    this.formCargos.instance._refresh();
  }

  // Valida si hay cambios pendientes
  seleccTabCargos(e: any) {
    if (this._sdatos.M_esEdicionRespo && e.index !== 0) {
      showToast('Debe completar la edidión de los datos de los responsables', 'warning')
      setTimeout(() => {
        this.tabSeleccIndex = 1;
      }, 200);
    }
  }

  opCargarResponsables(datos: any) {
    switch (datos.accion) {
      case 'eliminar':
        const index = this.FCargos.RESPONSABLES.findIndex((d: any) => d.ID_RESPONSABLE === datos.data.ID_RESPONSABLE);
        if (index > -1)
          this.FCargos.RESPONSABLES.splice(index, 1);
        break;

      default:
        const npos: any = this.FCargos.RESPONSABLES.findIndex((d: any) => d.ID_RESPONSABLE === datos.data.ID_RESPONSABLE);
        if (npos === -1)
          this.FCargos.RESPONSABLES.push(datos.data);
        else
          this.FCargos.RESPONSABLES[npos] = datos.data;
        break;
    }
    this.conCambios++;
    this.formCargos.instance._refresh();
  }

  // Compone cadena que muestra la programacion escogida
  setProgramacion(data: any) {
    var respProg = '';
    let compInicial: any
    let compFinal: any
    const fecha_inicial = new Date(data.FECHA_INICIO);
    const fecha_final = new Date(data.FECHA_FIN);

    if (fecha_inicial && fecha_final) {
      compInicial = this.generalesService.getFechaComponents(fecha_inicial);
      compFinal = this.generalesService.getFechaComponents(fecha_final);

      const mismoDia =
        compInicial.dia === compFinal.dia &&
        fecha_inicial.getMonth() === fecha_final.getMonth() &&
        fecha_inicial.getFullYear() === fecha_final.getFullYear();
      const mismoMes =
        fecha_inicial.getMonth() === fecha_final.getMonth() &&
        fecha_inicial.getFullYear() === fecha_final.getFullYear();
    }
    // if ((data.FECHA_INICIO !== null && data.FECHA_INICIO !== undefined && data.FECHA_INICIO !== '') ||
    //   (data.FECHA_FIN !== null && data.FECHA_FIN !== undefined && data.FECHA_FIN !== '')
    // ) {
    //   if ((data.TODO_DIA) && (data.TODO_DIA !== null)) {
    //     respProg = 'El ' + this.datepipe.transform(data.FECHA_INICIO, 'dd/MM/yyyy') + ' todo el dia';
    //   }
    //   if ((!data.TODO_DIA && !data.REPETIR) && (data.TODO_DIA !== null && data.REPETIR !== null)) {
    //     respProg = 'De: ' + this.datepipe.transform(data.FECHA_INICIO, 'dd/MM/yyyy') + ', ' +
    //       'a: ' + this.datepipe.transform(data.FECHA_FIN, 'dd/MM/yyyy');
    //   }
    //   if (data.REPETIR && data.REPETIR !== null) {
    //     var titfrec = '';
    //     switch (data.FRECUENCIA) {
    //       case 'Horas':
    //         respProg = 'Siempre a las ' + data.PERIODO_FRECUENCIA;
    //         break;

    //       case 'Diario':
    //         respProg = 'Cada ' + data.INTERVALO_FRECUENCIA + ' días ';
    //         break;

    //       case 'Semanal':
    //         if (data.PERIODO_FRECUENCIA !== null && data.PERIODO_FRECUENCIA !== undefined && data.PERIODO_FRECUENCIA !== '') {
    //           const frec = data.PERIODO_FRECUENCIA.map((d: any) => d.substring(0, 2));
    //           titfrec = frec.join(',');
    //           respProg = 'Cada ' + data.INTERVALO_FRECUENCIA + ' semanas, el ' + titfrec;
    //         }
    //         break;

    //       case 'Mensual':
    //         if (data.PERIODO_FRECUENCIA !== null && data.PERIODO_FRECUENCIA !== undefined && data.PERIODO_FRECUENCIA !== '') {
    //           titfrec = data.PERIODO_FRECUENCIA.join(',');
    //           respProg = 'Cada ' + data.INTERVALO_FRECUENCIA + ' meses, el ' + titfrec;
    //         }
    //         break;

    //       case 'Anual':
    //         if (data.PERIODO_FRECUENCIA !== null && data.PERIODO_FRECUENCIA !== undefined && data.PERIODO_FRECUENCIA !== '') {
    //           titfrec = data.PERIODO_FRECUENCIA.join(',');
    //           respProg = 'Cada ' + data.INTERVALO_FRECUENCIA + ' años, en ' + titfrec;
    //         }
    //         break;

    //       default:
    //         break;
    //     }
    //   }
    // }

    let fechaHoy = new Date()
    if (fecha_final.getFullYear() === fechaHoy.getFullYear()) {
      respProg = `${compFinal.dia}-${compFinal.mes}`;
    } else {
      respProg = `${compFinal.dia}-${compFinal.mes}-${compFinal.ano}`;
    }
    // Actualiza valor en el treelist
    data.PROGRAMACION = respProg;

  }

  // Vista/Zoom de los datos consultados
  opVista() {
    const VDatosRegAux = this.VDatosReg.map(({ ID_CARGO, DESCRIPCION, RESPONSABLES }) => ({ ID_CARGO, DESCRIPCION, RESPONSABLES }));
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(VDatosRegAux));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'Cargos',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: ['ID_CARGO|Nombre', 'DESCRIPCION|Descripción', 'RESPONSABLES|Responsables'],
      Filtro: '',
      keyGrid: ['ID_CARGO'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  async opEliminar() {
    await this.validarIntegridad('delete');
    if (this.integridadReferencial) {
      // Confirma...
      Swal.fire({
        title: '',
        text: '',
        html: "¿Desea Eliminar el Cargo <i>" +
          this.FCargos.ID_CARGO +
          "</i> ? Al eliminar, se eliminan " +
          " las responsabilidades asignadas" +
          " y sus responsables.",
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
          this.AccionEliminar();
        }
      });
    }

  }

  // Ejecuta la eliminación
  AccionEliminar() {

    // API eliminación de datos
    const prm = { CARGO: this.FCargos, USUARIO: this.USUARIO_LOCAL };
    this._sdatos
      .delete('eliminar', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data: any) => {
        try {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== '') {
            this.showModal(res[0].ErrMensaje);
            return;
          }

          // Elimina y posiciona en el Array de Consulta
          this.prmUsrAplBarReg.r_totReg--;
          this.opIrARegistro("Eliminado");
          // this.FCargos.RESPONSABILIDADES = res;
          // const npos:any = this.VDatosReg.findIndex((d:any) => d.ID_CARGO === this.FCargos.ID_CARGO);
          // this.VDatosReg[npos] = this.FCargos;
          showToast('Cargo Eliminado!', 'success');
          this.readOnly = true;

          // Operaciones de barra
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: "",
            accion: this.prmUsrAplBarReg.r_totReg !== 0 ? 'r_navegar' : 'r_ini',
            operacion: {}
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this.opIrARegistro('r_numreg');
        } catch (error) {
          this.showModal('Error al eliminar cargo: ' + error);
        }
      });
  }

  validatingData() {
    if (this.FCargos.ID_CARGO === '' || this.FCargos.ID_CARGO === undefined || this.FCargos.ID_CARGO === null) {
      showToast('Debe asignar un Código al cargo.', 'error');
      return false;
    } else {
      if (this.FCargos.NOMBRE === '' || this.FCargos.NOMBRE === undefined || this.FCargos.NOMBRE === null) {
        showToast('Debe asignar un Nombre al cargo.', 'error');
        return false;
      } else {
        if (this.FCargos.ESTADO === '' || this.FCargos.ESTADO === undefined || this.FCargos.ESTADO === null) {
          showToast('Debe asignar un Estado al cargo.', 'error');
          return false;
        } else {
          if (this.FCargos.RESPONSABILIDADES.length <= 0) {
            showToast('Debe asignar Responsabilidades al cargo.', 'error');
            return false;
          } else {
            return true;
          }
        }
      }
    }
  }

  opPrepararGuardar(accion: string): void {
    if (this.conCambios <= 0) {
      showToast('No hay cambios por Guardar.', 'error');
      return;
    } else {
      if (this.validatingData()) {
        var prm: any;
        if (accion === 'update') {
          if (this.tareasEliminadas.length > 0) {
            this.tareasEliminadas.forEach((ele: any) => {
              this.FCargos.RESPONSABILIDADES.push(ele);
            });
          }
        };
        // API guardado de datos del cargo
        prm = { CARGO: this.FCargos, USUARIO: this.USUARIO_LOCAL };
        this._sdatos
          .save(accion, prm)
          .subscribe((data) => {
            const res = JSON.parse(data.data);
            if ((data.token != undefined)) {
              const refreshToken = data.token;
              localStorage.setItem("token", refreshToken);
            }
            if (res[0].ErrMensaje !== "") {
              this.showModal(res[0].ErrMensaje);
            } else {
              // Operaciones de barra
              if (this.VDatosReg.length <= 0) {
                this.QFiltro = "CARGO='" + this.FCargos.ID_CARGO + "'";
                this.prmUsrAplBarReg = {
                  ...this.prmUsrAplBarReg,
                  error: "",
                  accion: "r_navegar",
                  r_numReg: 1,
                  r_totReg: 1,
                  operacion: {}
                };
                this.FCargos.RESPONSABILIDADES = res;
              } else {
                if (this.mnuAccion === 'new')
                  this.prmUsrAplBarReg.r_totReg++;
                const npos: any = this.VDatosReg.findIndex((d: any) => d.ID_CARGO === this.FCargos.ID_CARGO);
                if (npos === -1) {
                  this.VDatosReg.push(this.FCargos);
                } else {
                  this.VDatosReg[npos] = this.FCargos;
                }
                this.prmUsrAplBarReg = {
                  ...this.prmUsrAplBarReg,
                  error: "",
                  accion: "r_navegar",
                  operacion: {}
                };
              }
              this.readOnly = true;
              this.readOnlyFcargos = true;
              this.readOnlyEstado = true;
              this.tareasEliminadas = [];

              this.mnuAccion = this.prmUsrAplBarReg.accion;
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
              showToast('Registro actualizado', 'success');
              // Inicializacion objetos
              this.seleccDelete = [false];

              this.eventsSubjectDatos.next({
                accion: 'cargar datos',
                config: { accion: 'update dataSource', readOnly: this.readOnlyFcargos, dataSource: [...this.FCargos.RESPONSABILIDADES, this.NODO_PRINCIPAL] }
              });
              // const prmfiltro = '{"FILTRO":"ID_CARGO=\''+this.FCargos.ID_CARGO+'\'",' + 
              //                   '"ESTRUCTURA":[{"CAMPO":"ID_CARGO","EXPRESION":"'+this.FCargos.ID_CARGO+'","TABLA":"CARGOS"}],"aplicacion":"GES-003"}';
              // this.opPrepararBuscar(prmfiltro);

            }
          });

      }
    }

  }

  toggleToolTip(item: any, cellInfo: any) {
    this.targetIdTooltip = '#USER-' + item.id + cellInfo.data.ITEM;
    this.toolTipVisible = !this.toolTipVisible;
    this.tooltipText = item.NOMBRE;
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, data: any) {
    if (obj === 'consecutivo') {
      const prm = { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, CLASE: this.FCargos.TIPO };
      this._sdatos.getConsecutivo('CONSECUTIVO', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if (res.ErrMensaje !== '') {
          this.showModal(res.ErrMensaje);
        } else {
          this.FCargos.ID_CARGO = res.VAR_CONSECUTIVO;
          this.FCargos.CONSECUTIVO = res.CONSECUTIVO;
          const data: any = { value: this.FCargos.ID_CARGO }
          this.onValueChangedIdCargo(data);
        }
      });
    };
    if (obj === 'dominios' || obj === 'todos') {
      const prm: any = {};
      this._sdatos.getDominios('DOMINIOS', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje != '') {
          this.showModal(mensaje, 'Error');
        } else {
          this.DlTipo = newArray;
        };
      });
    };
    if (obj === 'integridad referencial') {
      const prm: any = {};
      this._sdatos.getIntegridad('integridad referencial', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje != '') {
          this.showModal(mensaje, 'Error');
        } else {
          this.DlTipo = newArray;
        };
      });
    };
    if (obj === 'configurar') {
      this.loadingVisible = true;
      const prm = { ID_APLICACION: 'GES-003', PLANTILLA: data };
      this._sdatos.consulta('CONFIGURACION', prm).subscribe((data: any) => {
        this.loadingVisible = false;
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          showToast(mensaje, 'Error');
          this.DATOS_CONFIG = [];
        } else {
          this.DATOS_CONFIG = newArray;
          this.eventsSubjectDatos.next({ accion: 'configurar', dataSource: this.DATOS_CONFIG });
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
          this.eventsSubjectDatos.next({
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
    if (obj === 'actividad') {
      const prm: any = { ID_ACTIVIDAD: data };
      this.loadingVisible = true;
      this._sdatos.getActividad('ACTIVIDAD', prm).subscribe((data: any) => {
        this.loadingVisible = false;
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
          return;
        }
        for (let i = 0; i < res.length; i++) {
          const element = res[i];
          element.ITEM = i;
          element.PROGRAMACION = '';
          element.DATOS_PROG = {};
        };
        this.NODO_PRINCIPAL = res[0];
        this.eventsSubjectDatos.next({
          accion: 'cargar datos',
          config: { accion: 'update dataSource', dataSource: [res[0]] }
        });
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

  showModal(mensaje: any, titulo = '¡Error!', msg_html = '') {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
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
