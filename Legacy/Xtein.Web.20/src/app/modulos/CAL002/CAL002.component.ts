import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule,
  DxDropDownBoxModule, DxFormComponent, DxFormModule, DxLoadPanelModule,
  DxNumberBoxModule, DxRadioGroupModule, DxSelectBoxModule,
  DxTextAreaModule, DxTextBoxModule, DxToolbarModule, DxTooltipModule, DxTreeListComponent, DxTreeListModule, DxValidatorModule
} from 'devextreme-angular';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { Subject, Subscription } from 'rxjs';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { showToast } from 'src/app/shared/toast/toastComponent.js';
import Swal from 'sweetalert2';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { CAL002Service } from 'src/app/services/CAL002/CAL002.service';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { CAL001Service } from '../CAL001/Service/CAL001.service';
import { clsPlanAccion } from './clsCAL002.class';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { GES000Component } from '../GESPRO/GES000/GES000.component';
import { GeneralesService } from 'src/app/services/generales/generales.service';

@Component({
  selector: 'app-CAL002',
  templateUrl: './CAL002.component.html',
  styleUrls: ['./CAL002.component.css'],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxDropDownBoxModule, DxValidatorModule,
    DxDataGridModule, DxButtonModule, VistarapidaComponent, DxTextBoxModule,
    DxDateBoxModule, DxTextAreaModule, DxNumberBoxModule, DxLoadPanelModule,
    DxToolbarModule, DxSelectBoxModule, DxTooltipModule, DxRadioGroupModule,
    CdkAccordionModule, DxLoadPanelModule, GES000Component, DxTreeListModule
  ]
})
export class CAL002Component {

  @ViewChild("formPlanAccion", { static: false }) formPlanAccion: DxFormComponent;
  @ViewChild("GplanesAccion", { static: false }) GplanesAccion: DxDataGridComponent;
  @ViewChild("GAnalisis", { static: false }) GAnalisis: DxDataGridComponent;
  @ViewChild("TreeListAnalisis", { static: false }) TreeListAnalisis: DxTreeListComponent;


  eventsSubjectDatos: Subject<any> = new Subject<any>();
  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  subs_filtro: Subscription;
  subs_visor: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string = '';

  FPlanAccion: any;
  modoLectura: boolean = true;
  readOnly: boolean = true;
  loadingVisible: boolean = false;
  openDropAccion: boolean = false;
  openDropResponsable: boolean = false;

  itemsAcodeon: any = ['No conformidades', 'Analisis', 'Planes de Acción'];
  accordionExpand = [true, true, true];

  DGplanesAccion: clsPlanAccion[] = [];
  DATOS_CONFIG: any[] = [];
  nodos_principales: any[] = [];
  NODO_PRINCIPAL: [];
  ListaAcciones: any[] = [];
  DGProductos: any[] = [];
  DGEmpleados: any[] = [];
  DGAnalisis: any[] = [];
  DGCausasClientes: any[] = [];
  selectResponsable: any = [];
  selectCausaCliente: any = [];
  selectCausante: any = [];
  selectProducto: any = [];
  selectListaAccion: any[] = [];
  parametrosFiltro: any[] = [];
  DAcciones: any[] = [
    { ID: 1, DESCRIPCION: 'Causal' },
    { ID: 2, DESCRIPCION: 'Causante' },
    { ID: 3, DESCRIPCION: 'Producto' }
  ];
  newData: any[] = [];
  selectGAccion: any = [];
  selectAccion: any = [];
  selectListaCausal: any = [];
  selectListaProducto: any = [];
  selectListaCausante: any = [];
  openDropProducto: boolean = false;
  openDropCausante: boolean = false;
  openDropCausal: boolean = false;
  activeBtnCargar: boolean = true;
  USUARIO_LOCAL: any = '';

  labelLocation: string = 'left';
  esVisibleSelecc: string = 'none';
  valueExpr: any = '';
  displayExpr: any = '';
  data_prev: any = '';
  accion: any = '';
  VDatosReg: any;
  QFiltro: any;
  conCambios: number = 0;
  groupIdCausante: any = null;
  groupIdCausa: any = null;
  groupIdCausaCliente: any = null;
  groupProducto: any = null;

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  numFila: number = -1;


  constructor(
    private sData: CAL002Service,
    private sDataCAL001: CAL001Service,
    private _sbarreg: SbarraService,
    private SVisor: SvisorService,
    private tabService: TabService,
    private _sfiltro: SfiltroService,
    public generalesService: GeneralesService,
  ) {
    // Servicio de barra de registro
    this.subscription = this._sbarreg
      .getObsRegApl()
      .subscribe((datreg) => {
        // Valida si la petición es para esta aplicacion
        if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(datreg);
      });

    // Respuesta del filtro
    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe(resp => {
      // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opPrepararBuscar(resp);
    })

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex(d => d.PRODUCTO === resp.PRODUCTO);
      if (nx !== -1) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    })

    this.getSizeQualifier = this.getSizeQualifier.bind(this);
    this.valoresObjetos = this.valoresObjetos.bind(this);
    this.onSelectionChangedResponsable = this.onSelectionChangedResponsable.bind(this);
    this.onValueChangedTipoAccion = this.onValueChangedTipoAccion.bind(this);
    this.onValueChangedCorrectiva = this.onValueChangedCorrectiva.bind(this);
    this.onValueChangedAccionado = this.onValueChangedAccionado.bind(this);
    this.onValueChangedAnalisis = this.onValueChangedAnalisis.bind(this);
    this.onValueChangedFuente = this.onValueChangedFuente.bind(this);
    this.onValueChangedEstado = this.onValueChangedEstado.bind(this);
    this.onSelectionProducto = this.onSelectionProducto.bind(this);
    this.onSelectionCausante = this.onSelectionCausante.bind(this);
    this.onSelectionCausaCliente = this.onSelectionCausaCliente.bind(this);

  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'PLANES_ACCION',
      aplicacion: 'CAL-002',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_nuevo: true, r_modificar: false, r_refrescar: true }
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.modoLectura = true;
    this.selectAccion = [];
    this.DGplanesAccion = [];

    this.FPlanAccion = {
      CONSECUTIVO: '',
      DOCUMENTO: '',
      ID_DOCUMENTO: '',
      ORIGEN: '',
      ID_CAUSA_CLIENTE: '',
      ID_CAUSA_INTERNA: '',
      PRODUCTO: '',
      FECHA: '',
      ESTADO: '',
      USUARIO: '',
      ANALISIS: [],
      TAREAS: []
    };

    this.valoresObjetos('todos', '');
    this.valoresObjetos('configurar', 'PLAN_ACCION');
    this.valoresObjetos('actividad', '-40');
    setTimeout(() => {
      this.eventsSubjectDatos.next({
        accion: 'init',
        config: { accion: 'init', readOnly: this.readOnly, APLICACION: this.prmUsrAplBarReg.aplicacion }
      });
    }, 200);
  }

  onContentReady(e: any) {
    e.component.columnOption("command:edit", "visible", false);
  }

  getSizeQualifier(width: any) {
    if (width < 768) {
      this.labelLocation = 'top';
      return "xs"
    } else if (width < 992) {
      this.labelLocation = 'top';
      return "sm";
    } else if (width < 1366) {
      this.labelLocation = 'left';
      return "md";
    } else {
      this.labelLocation = 'left';
      return "lg";
    }
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.prmUsrAplBarReg = {
          tabla: 'PLANES_ACCION',
          aplicacion: 'CAL-002',
          usuario: this.USUARIO_LOCAL,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_nuevo: true, r_modificar: false, r_refrescar: true }
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_nuevo':
        this.mnuAccion = "new";
        this.modoLectura = false;
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = "update";
        this.opPrepararModificar();
        // if (this.filasSelecc.length > 0)
        //   this.rowEdit = true;
        // else
        //   this.rowEdit = false;
        break;

      case 'r_guardar':
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case 'r_buscar':
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        if (!this._sfiltro.enConsulta) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_buscar_ejec':
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
            this.readOnly = true;
            this.modoLectura = true;
            this.mnuAccion = "";
            if (this.data_prev !== '') {
              // if (this.activeFormCalidad) {
              // this.FCalidad = JSON.parse(JSON.stringify(this.data_prev));
              this.data_prev = { ...this.data_prev };
              // }
            } else {
              this.opBlanquearForma();
            }

            // this.eventsSubjectDatos.next({
            //   accion: 'cargar datos',
            //   config: { accion: 'update dataSource', dataSource: [...this.FPlanAccion.TAREAS, ...this.NODO_PRINCIPAL] }
            // });

            this.conCambios = 0;
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} }
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          }
        });
        break;

      case "r_vista":
        this.opVista();
        break;

      case 'r_copiar':
        break;

      case 'r_refrescar':
        this.valoresObjetos('todos', '');
        this.valoresObjetos('historial', '');
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

  // Vista/Zoom de los datos consultados
  opVista() {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'Planes de Acción',
      accion: '',
      opciones: '|',
      Grupo: [],
      Filtro: '',
      cols: ['DOCUMENTO|Documento', 'ORIGEN|Origen', 'ID_CAUSA_INTERNA|Causa Interna', 'ID_CAUSA_CLIENTE|Causa Cliente', 'PRODUCTO|Producto', 'ID_CAUSANTE|Causante', 'FECHA|Fecha', 'ESTADO|Estado'],
      keyGrid: ['DOCUMENTO'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opPrepararBuscar(accion: any) {
    if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Planes de Acción",
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
      const prm = { PLANES_ACCION: arrFiltro };

      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this.sData
        .consulta_filtro('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          try {
            this._sfiltro.enConsulta = false;
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
    var newArray: any = {};
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        this.prmUsrAplBarReg.r_numReg = 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        if (this.VDatosReg.length != 0) {
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[0]));
        }
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1
            ? 1
            : this.prmUsrAplBarReg.r_numReg - 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
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
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
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

    this.activeBtnCargar = true;
    this.FPlanAccion = newArray;
    this.selectAccion = this.FPlanAccion.ORIGEN;
    this.selectListaProducto = [this.FPlanAccion.PRODUCTO];
    this.selectListaCausante = [this.FPlanAccion.CAUSANTE];
    this.selectListaAccion = [this.FPlanAccion.ORIGEN_DATA];

    if (this.FPlanAccion.ID_CAUSA_INTERNA !== null && this.FPlanAccion.ID_CAUSA_INTERNA !== undefined && this.FPlanAccion.ID_CAUSA_INTERNA !== '')
      this.selectListaCausal = [this.FPlanAccion.ID_CAUSA_INTERNA];
    else if (this.FPlanAccion.ID_CAUSA_CLIENTE !== null && this.FPlanAccion.ID_CAUSA_CLIENTE !== undefined && this.FPlanAccion.ID_CAUSA_CLIENTE !== '')
      this.selectListaCausal = [this.FPlanAccion.ID_CAUSA_CLIENTE];

    this.DGplanesAccion = this.FPlanAccion.ITM;

    //arma el filtro:::
    const FILTRO = this.FPlanAccion.FILTRO;
    const partes = FILTRO.split(" AND ");
    const parametrosFiltro = partes.map(parte => {
      const [clave, valor] = parte.replace("C.", "").split(" = ");
      const valorSinComillas = valor.replace(/'/g, "");
      const objeto = {};
      objeto[clave] = valorSinComillas;
      return objeto;
    });
    this.parametrosFiltro = parametrosFiltro;

    this.formPlanAccion.instance.repaint();
    this.TreeListAnalisis.instance.refresh();
    this.GplanesAccion.instance.refresh();
    this.FPlanAccion.TAREAS.forEach((tarea: any) => {
      if (this.FPlanAccion.TAREAS.findIndex((d: any) => tarea.ID_ACTIVIDAD_PADRE === d.ID_ACTIVIDAD) === -1) {
        tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
        tarea.ID_ACTIVIDAD_PADRE = -40;
      }
      tarea.readOnlyResponsables = true;
    });
    // this.eventsSubjectDatos.next({
    //   accion: 'cargar datos',
    //   config: { accion: 'update dataSource', dataSource: [...this.FPlanAccion.TAREAS, ...this.NODO_PRINCIPAL] }
    // });

  }

  onRespuestaComponent(e: any) {
    switch (e.accion) {
      case 'cargar nodo':
        this.valoresObjetos('actividad', e.data);
        break;
      case 'update datasource':
        const npos: any = this.FPlanAccion.TAREAS.findIndex((d: any) => d.ID_ACTIVIDAD === e.data.ID_ACTIVIDAD);
        if (npos !== -1)
          this.FPlanAccion.TAREAS[npos] = e.data;
        else
          this.FPlanAccion.TAREAS.push(e.data);
        this.conCambios++;
        break;

      default:
        break;
    }
  }

  opPrepararNuevo(): void {
    this.conCambios = 0;
    this.FPlanAccion = {
      CONSECUTIVO: '',
      DOCUMENTO: '',
      ID_DOCUMENTO: '',
      ORIGEN: '',
      ID_CAUSA_CLIENTE: '',
      ID_CAUSA_INTERNA: '',
      PRODUCTO: '',
      FECHA: new Date(),
      ESTADO: 'REGISTRADO',
      USUARIO: this.USUARIO_LOCAL,
      ANALISIS: [],
      TAREAS: []
    };
    this.selectAccion = [];
    this.parametrosFiltro = [];
    this.DGplanesAccion = [];
    this.selectListaAccion = [];
    this.selectListaCausal = [];
    this.selectListaCausante = [];
    this.selectListaProducto = [];
    this.TreeListAnalisis.instance.refresh();
    this.GplanesAccion.instance.refresh();
    this.modoLectura = false;
    this.readOnly = false;
    this.activeBtnCargar = false;
    this.eventsSubjectDatos.next({
      accion: 'cargar datos',
      config: { accion: 'update dataSource', READONLY: this.modoLectura, dataSource: [...this.NODO_PRINCIPAL] }
    });
    this.valoresObjetos('documento', '');
  }

  initNewRowTreeList(e: any) {
    e.data.ID_DOCUMENTO = this.FPlanAccion.ID_DOCUMENTO,
      e.data.CONSECUTIVO = this.FPlanAccion.CONSECUTIVO,
      e.data.DOCUMENTO = this.FPlanAccion.DOCUMENTO
    e.data.ANALISIS_CAUSA = '';
    e.data.TIPO_ACCION = '';
    e.data.ACCIONADO = '';
    if (this.FPlanAccion.ANALISIS.length > 0) {
      const item = this.FPlanAccion.ANALISIS.reduce((ant: any, act: any) => { return (ant.ITEM > act.ITEM) ? ant : act });
      e.data.ITEM = item.ITEM + 1;
    } else {
      e.data.ITEM = 1;
    };
  }

  opBlanquearForma(): void {
    this.data_prev = JSON.parse(JSON.stringify(this.FPlanAccion));
    this.data_prev = { ...this.data_prev, ...this.selectProducto, ...this.selectAccion, ...this.parametrosFiltro };

    this.FPlanAccion = {
      CONSECUTIVO: '',
      DOCUMENTO: '',
      ID_DOCUMENTO: '',
      ORIGEN: '',
      ID_CAUSA_CLIENTE: '',
      ID_CAUSA_INTERNA: '',
      PRODUCTO: '',
      FECHA: '',
      ESTADO: '',
      USUARIO: '',
      ANALISIS: [],
      TAREAS: []
    };
    this.selectAccion = [];
    this.parametrosFiltro = [];
    this.DGplanesAccion = [];
    this.selectListaAccion = [];
    this.selectListaCausal = [];
    this.selectListaCausante = [];
    this.selectListaProducto = [];
    this.TreeListAnalisis.instance.refresh();
    this.GplanesAccion.instance.refresh();
    this.eventsSubjectDatos.next({
      accion: 'cargar datos',
      config: { accion: 'update dataSource', dataSource: [...this.NODO_PRINCIPAL] }
    });
  }

  opEliminar(): void { }

  // Ejecuta la eliminación
  AccionEliminar(): void { }

  opPrepararModificar(): void {
    this.data_prev = JSON.parse(JSON.stringify(this.FPlanAccion));
    this.data_prev = { ...this.data_prev, ...this.selectProducto, ...this.selectAccion, ...this.parametrosFiltro };
    this.modoLectura = false;
    this.readOnly = false;
    this.activeBtnCargar = false;
    this.eventsSubjectDatos.next({
      accion: 'init',
      config: { accion: 'readOnly', READONLY: this.modoLectura }
    });
  }

  onValueChangedDropAccion(e: any) {
    if (e.value === null || e.value === undefined || e.value.length <= 0) {
      this.parametrosFiltro = [];
    }
  }

  onValueChangedAccion(e: any) {
    switch (e.value) {
      case 'Causal':
        this.displayExpr = 'NOMBRE';
        this.valueExpr = 'ID_CAUSA';
        this.ListaAcciones = this.DGCausasClientes;
        break;

      case 'Causante':
        this.displayExpr = 'NOMBRE_COMPLETO';
        this.valueExpr = 'ID_EMPLEADO';
        this.ListaAcciones = this.DGEmpleados;
        break;

      case 'Producto':
        this.displayExpr = 'NOMBRE';
        this.valueExpr = 'PRODUCTO';
        this.ListaAcciones = this.DGProductos;
        break;

      default:
        // this.opBlanquearForma();
        break;
    }
    if (this.mnuAccion.match('new|update')) {
      this.FPlanAccion.ORIGEN = e.value;
      this.FPlanAccion.ORIGEN_DATA = '';
      this.FPlanAccion.ID_CAUSA_CLIENTE = '';
      this.FPlanAccion.ID_CAUSA_INTERNA = '';
      this.FPlanAccion.PRODUCTO = '';
      this.FPlanAccion.ANALISIS = [];
      this.FPlanAccion.TAREAS = [];
      this.selectListaAccion = [];
      this.selectListaCausal = [];
      this.selectListaCausante = [];
      this.selectListaProducto = [];
      this.DGplanesAccion = [];
    }
  }

  onValueChangedDato(e: any, campo: string) {
    if (this.mnuAccion.match('new|update')) {
      if (e.value === null || e.value === undefined || e.value.length === 0) {
        switch (campo) {
          case 'Causal':
            if (e.previousValue[0].match('NC')) { //Causa Interna
              const npos: any = this.parametrosFiltro.findIndex((d: any) => d.ID_CAUSA_INTERNA === e.previousValue[0]);
              if (npos !== -1)
                this.parametrosFiltro.splice(npos, 1);

              this.FPlanAccion.ID_CAUSA_INTERNA = '';

            } else if (e.previousValue[0].match('RC')) {  //Causa Cliente
              const npos: any = this.parametrosFiltro.findIndex((d: any) => d.ID_CAUSA_CLIENTE === e.previousValue[0]);
              if (npos !== -1)
                this.parametrosFiltro.splice(npos, 1);

              this.FPlanAccion.ID_CAUSA_CLIENTE = '';
            }

            break;

          case 'Causante':
            const pos: any = this.parametrosFiltro.indexOf((d: any) => d.ID_RESPONSABLE === e.previousValue[0]);
            if (pos !== -1)
              this.parametrosFiltro.splice(pos, 1);

            this.FPlanAccion.CAUSANTE = '';
            break;

          case 'Producto':
            const posi: any = this.parametrosFiltro.indexOf((d: any) => d.PRODUCTO === e.previousValue[0]);
            if (posi !== -1)
              this.parametrosFiltro.splice(posi, 1);

            this.FPlanAccion.PRODUCTO = '';
            break;

          default:
            break;
        }
        this.conCambios++;
        const condicionSQL = this.convertirACondicionSQL(this.parametrosFiltro);
        this.FPlanAccion.FILTRO = condicionSQL;
      }
    }
  }

  onSelectionCausaCliente(e: any) {
    this.openDropCausal = false;
    this.openDropAccion = false;

    if (this.mnuAccion.match('new|update')) {
      if (this.parametrosFiltro.length <= 0) {
        if (e.selectedRowKeys[0].match('NC')) {
          this.parametrosFiltro = [{ ID_CAUSA_INTERNA: e.selectedRowKeys[0] }];
          if (this.selectListaCausal.length > 0)
            this.FPlanAccion.ID_CAUSA_INTERNA = e.selectedRowKeys[0];
          else
            this.FPlanAccion.ORIGEN_DATA = e.selectedRowKeys[0];
        } else if (e.selectedRowKeys[0].match('RC')) {
          this.parametrosFiltro = [{ ID_CAUSA_CLIENTE: e.selectedRowKeys[0] }];
          if (this.selectListaCausal.length > 0)
            this.FPlanAccion.ID_CAUSA_CLIENTE = e.selectedRowKeys[0];
          else
            this.FPlanAccion.ORIGEN_DATA = e.selectedRowKeys[0];
        }
      } else {
        //borra cualquier ID_CAUSA ya agregada
        if (e.currentDeselectedRowKeys.length <= 0) {
          if (e.selectedRowKeys[0].match('NC')) { //Causa Interna
            //Se verifica que no se repita el dato
            const npos: any = this.parametrosFiltro.findIndex((d: any) => d.ID_CAUSA_INTERNA === e.selectedRowKeys[0]);
            if (npos !== -1)
              this.parametrosFiltro[npos] = { ID_CAUSA_INTERNA: e.selectedRowKeys[0] };
            else
              this.parametrosFiltro.push({ ID_CAUSA_INTERNA: e.selectedRowKeys[0] });

            if (this.selectListaCausal.length > 0)
              this.FPlanAccion.ID_CAUSA_INTERNA = e.selectedRowKeys[0];
            else
              this.FPlanAccion.ORIGEN_DATA = e.selectedRowKeys[0];

          } else if (e.selectedRowKeys[0].match('RC')) {  //Causa Cliente
            //Se verifica que no se repita el dato
            const npos: any = this.parametrosFiltro.findIndex((d: any) => d.ID_CAUSA_CLIENTE === e.selectedRowKeys[0]);
            if (npos !== -1)
              this.parametrosFiltro[npos] = { ID_CAUSA_CLIENTE: e.selectedRowKeys[0] };
            else
              this.parametrosFiltro.push({ ID_CAUSA_CLIENTE: e.selectedRowKeys[0] });

            if (this.selectListaCausal.length > 0)
              this.FPlanAccion.ID_CAUSA_CLIENTE = e.selectedRowKeys[0];
            else
              this.FPlanAccion.ORIGEN_DATA = e.selectedRowKeys[0];
          }
        } else if (e.currentDeselectedRowKeys.length > 0) {
          //elimina otra causa si existe
          if (e.currentDeselectedRowKeys[0].match('NC')) { //Causa Interna
            const pos: any = this.parametrosFiltro.findIndex((d: any) => d.ID_CAUSA_INTERNA === e.currentDeselectedRowKeys[0]);
            if (pos !== -1)
              this.parametrosFiltro.splice(pos, 1);
          } else if (e.currentDeselectedRowKeys[0].match('RC')) { //Causa Interna
            const pos: any = this.parametrosFiltro.findIndex((d: any) => d.ID_CAUSA_CLIENTE === e.currentDeselectedRowKeys[0]);
            if (pos !== -1)
              this.parametrosFiltro.splice(pos, 1);
          };
          //Se verifica que no se repita el dato y lo agrega
          if (e.selectedRowKeys[0].match('NC')) { //Causa Interna
            const npos: any = this.parametrosFiltro.findIndex((d: any) => d.ID_CAUSA_INTERNA === e.selectedRowKeys[0]);
            if (npos !== -1)
              this.parametrosFiltro[npos] = { ID_CAUSA_INTERNA: e.selectedRowKeys[0] };
            else
              this.parametrosFiltro.push({ ID_CAUSA_INTERNA: e.selectedRowKeys[0] });

            if (this.selectListaCausal.length > 0)
              this.FPlanAccion.ID_CAUSA_INTERNA = e.selectedRowKeys[0];
            else
              this.FPlanAccion.ORIGEN_DATA = e.selectedRowKeys[0];

          } else if (e.selectedRowKeys[0].match('RC')) {  //Causa Cliente
            const npos: any = this.parametrosFiltro.findIndex((d: any) => d.ID_CAUSA_CLIENTE === e.selectedRowKeys[0]);
            if (npos !== -1)
              this.parametrosFiltro[npos] = { ID_CAUSA_CLIENTE: e.selectedRowKeys[0] };
            else
              this.parametrosFiltro.push({ ID_CAUSA_CLIENTE: e.selectedRowKeys[0] });

            if (this.selectListaCausal.length > 0)
              this.FPlanAccion.ID_CAUSA_CLIENTE = e.selectedRowKeys[0];
            else
              this.FPlanAccion.ORIGEN_DATA = e.selectedRowKeys[0];

          }
        };

      };
      this.activeBtnCargar = false;
      this.conCambios++;
    }
  }

  getCargarFiltro(e: any) {
    if (this.parametrosFiltro.length > 0) {
      this.valoresObjetos('historial', '');
      this.readOnly = false;
      this.rowNew = true;
      this.esVisibleSelecc = 'onClick';
    } else {
      showToast('Seleccione valores para el filtro.', 'warning');
    }
  }

  onSelectionCausante(e: any) {
    this.openDropAccion = false;
    this.openDropCausante = false;
    if (this.parametrosFiltro.length <= 0) {
      this.parametrosFiltro = [{ ID_RESPONSABLE: e.selectedRowKeys[0] }];
    } else {
      const npos: any = this.parametrosFiltro.indexOf((d: any) => d.ID_RESPONSABLE === e.selectedRowKeys[0]);
      if (npos !== -1)
        this.parametrosFiltro[npos] = { ID_RESPONSABLE: e.selectedRowKeys[0] };
      else
        this.parametrosFiltro.push({ ID_RESPONSABLE: e.selectedRowKeys[0] });
    }
    this.activeBtnCargar = false;
    if (this.mnuAccion.match('new|update')) {
      this.conCambios++;
    }
    if (this.selectListaCausante.length > 0)
      this.FPlanAccion.CAUSANTE = e.selectedRowKeys[0];
    else
      this.FPlanAccion.ORIGEN_DATA = e.selectedRowKeys[0];
  }

  onSelectionProducto(e: any) {
    this.openDropAccion = false;
    this.openDropProducto = false;
    if (this.parametrosFiltro.length <= 0) {
      this.parametrosFiltro = [{ PRODUCTO: e.selectedRowKeys[0] }];
    } else {
      const npos: any = this.parametrosFiltro.indexOf((d: any) => d.PRODUCTO === e.selectedRowKeys[0]);
      if (npos !== -1)
        this.parametrosFiltro[npos] = { PRODUCTO: e.selectedRowKeys[0] };
      else
        this.parametrosFiltro.push({ PRODUCTO: e.selectedRowKeys[0] });
    }
    this.activeBtnCargar = false;
    if (this.mnuAccion.match('new|update')) {
      this.conCambios++;
    }
    if (this.selectListaProducto.length > 0)
      this.FPlanAccion.PRODUCTO = e.selectedRowKeys[0];
    else
      this.FPlanAccion.ORIGEN_DATA = e.selectedRowKeys[0];
  }

  onSelectionChangedResponsable(e: any, cellInfo: any) {
    if (this.mnuAccion.match('new|update')) {
      cellInfo.data.ID_RESPONSABLE = e.selectedRowKeys[0];
      this.GplanesAccion.instance.cellValue(cellInfo.rowIndex, 'ID_RESPONSABLE', e.selectedRowKeys[0]);
      this.openDropResponsable = false;
      this.conCambios++;
    }
  }

  onValueChangedTipoAccion(e: any, cellInfo: any) {
    if (this.mnuAccion.match('new|update')) {
      cellInfo.data.TIPO_ACCION = e.value;
      this.TreeListAnalisis.instance.cellValue(cellInfo.rowIndex, 'TIPO_ACCION', e.value);
      this.conCambios++;
    }
  }

  onValueChangedCorrectiva(e: any, cellInfo: any) {
    if (this.mnuAccion.match('new|update')) {
      cellInfo.data.ACCION_CORRECTIVA = e.value;
      this.GplanesAccion.instance.cellValue(cellInfo.rowIndex, 'ACCION_CORRECTIVA', e.value);
      this.conCambios++;
    }
  }

  onValueChangedAccionado(e: any, cellInfo: any) {
    if (this.mnuAccion.match('new|update')) {
      cellInfo.data.ACCIONADO = e.value;
      this.TreeListAnalisis.instance.cellValue(cellInfo.rowIndex, 'ACCIONADO', e.value);
      this.conCambios++;
    }
  }

  onValueChangedAnalisis(e: any, cellInfo: any) {
    if (this.mnuAccion.match('new|update')) {
      cellInfo.data.ANALISIS_CAUSA = e.value;
      this.TreeListAnalisis.instance.cellValue(cellInfo.rowIndex, 'ANALISIS_CAUSA', e.value);
      this.conCambios++;
    }
  }

  onValueChangedFechaReclamo(e: any, cellInfo: any) {
    if (this.mnuAccion.match('new|update')) {
      cellInfo.data.FECHA_RECLAMO = e.value;
      this.GplanesAccion.instance.cellValue(cellInfo.rowIndex, 'FECHA_RECLAMO', e.value);
      this.conCambios++;
    }
  }

  onValueChangedFuente(e: any, cellInfo: any) {
    if (this.mnuAccion.match('new|update')) {
      cellInfo.data.FUENTE = e.value;
      this.GplanesAccion.instance.cellValue(cellInfo.rowIndex, 'FUENTE', e.value);
      this.conCambios++;
    }
  }

  onValueChangedEstado(e: any, cellInfo: any) {
    if (this.mnuAccion.match('new|update')) {
      cellInfo.data.ESTADO = e.value;
      if (e.value === 'Ejecutada')
        cellInfo.data.FECHA_EJECUCION = new Date();
      this.GplanesAccion.instance.cellValue(cellInfo.rowIndex, 'ESTADO', e.value);
      this.conCambios++;
    }
  }

  onSelectionChangedDato(e: any) {
    if (!this.TreeListAnalisis.instance.hasEditData()) {
      this.filasSelecc = e.selectedRowKeys;
      this.numFila = this.FPlanAccion.ANALISIS.findIndex((d: any) => d.ITEM === e.selectedRowKeys[0]);
      if (this.filasSelecc.length === 1) {
        this.rowEdit = true;
      } else {
        this.rowEdit = false;
      }
      if (this.filasSelecc.length >= 1) {
        this.rowDelete = true;
      } else {
        this.rowDelete = false;
      }
    } else {
      this.rowDelete = false;
      this.rowEdit = false;
    }
  }

  agregarItemLista(e: any) {
    if (this.newData.length > 0) {
      const npos: any = this.newData.findIndex((d: any) => d.ITEM === e.ITEM);
      if (npos !== -1) {
        this.newData[npos] = e;
      } else {
        this.newData.push(e);
      }
    } else if (this.newData.length === 0) {
      this.newData.push(e);
    }
  }

  // Operaciones de grid
  operGrid(e: any, operacion: any) {
    switch (operacion) {
      case 'new':
        if (this.filasSelecc.length > 0) {
          this.TreeListAnalisis.instance.addRow(this.filasSelecc[0]);
        } else {
          this.TreeListAnalisis.instance.addRow();
        }
        this.accion = 'new';
        this.rowApplyChanges = true;
        this.rowNew = false;
        this.rowDelete = false;
        this.TreeListAnalisis.instance.clearSelection();
        // this.esVisibleSelecc = 'none';
        break;
      case 'edit':
        // this.TreeListAnalisis.instance.clearSelection();
        this.rowApplyChanges = true;
        this.rowNew = false;
        this.rowDelete = false;
        this.rowEdit = false;
        this.TreeListAnalisis.instance.editRow(this.numFila);
        this.accion = 'update';
        break;
      case 'save':
        this.TreeListAnalisis.instance.saveEditData();
        break;
      case 'cancel':
        this.TreeListAnalisis.instance.cancelEditData();
        this.accion = '';
        this.rowApplyChanges = false;
        this.rowNew = true;
        if (this.filasSelecc.length > 0) {
          // this.esVisibleSelecc = 'onClick';
          this.rowDelete = true;
          this.rowEdit = true;
        } else {
          // this.esVisibleSelecc = 'none';
          this.rowDelete = false;
          this.rowEdit = false;
        }
        break;
      case 'delete':
        // Elimina filas seleccionadas
        Swal.fire({
          title: '',
          text: '¿Desea eliminar los items seleccionados?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.filasSelecc.forEach((key) => {
              const index = this.FPlanAccion.ANALISIS.findIndex((a: any) => a.ITEM === key);
              this.FPlanAccion.ANALISIS.splice(index, 1);
            });
            this.TreeListAnalisis.instance.refresh();
            this.conCambios++;
            this.accion = '';
            this.rowApplyChanges = false;
            this.rowNew = true;
            // if(this.filasSelecc.length > 0) {
            // 	this.rowDelete = true;
            // } else {
            // 	this.rowDelete = false;
            // }
          }
        });
        break;

      default:
        break;
    }
  }

  onRowValidating(e: any) {
    let mensaje: any = '';
    var res: boolean = false;
    let propiedadesVacias: any = [];
    const propiedadesVerificar = ["TIPO_ACCION", "ANALISIS_CAUSA", "ACCIONADO"];

    if (this.accion === 'new') {
      if (
        (e.newData.TIPO_ACCION !== '' && e.newData.TIPO_ACCION !== null && e.newData.TIPO_ACCION !== undefined) &&
        (e.newData.ANALISIS_CAUSA !== '' && e.newData.ANALISIS_CAUSA !== null && e.newData.ANALISIS_CAUSA !== undefined) &&
        (e.newData.ACCIONADO !== '' && e.newData.ACCIONADO !== null && e.newData.ACCIONADO !== undefined)
      ) {
        res = true;
        this.rowApplyChanges = false;
        this.rowEdit = false;
        this.rowNew = true;
        // this.esVisibleSelecc = 'onClick';
        this.GplanesAccion.instance.clearSelection();
        // this.agregarItemLista(e.oldData);
      } else {
        for (let key in e.newData) {
          if (propiedadesVerificar.includes(key) && !e.newData[key]) {
            propiedadesVacias.push(key);
          }
        }
        if (propiedadesVacias.length > 0)
          mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;

        showToast(mensaje, 'error');
        e.isValid = false;
        // this.esVisibleSelecc = 'none';
        res = false;
      };
    } else if (this.accion === 'update') {
      for (let prop in e.newData) {
        if (e.newData.hasOwnProperty(prop) && e.oldData.hasOwnProperty(prop)) {
          e.oldData[prop] = e.newData[prop];
        };
      }
      if (
        (e.oldData.TIPO_ACCION !== '' && e.oldData.TIPO_ACCION !== null && e.oldData.TIPO_ACCION !== undefined) &&
        (e.oldData.ANALISIS_CAUSA !== '' && e.oldData.ANALISIS_CAUSA !== null && e.oldData.ANALISIS_CAUSA !== undefined) &&
        (e.oldData.ACCIONADO !== '' && e.oldData.ACCIONADO !== null && e.oldData.ACCIONADO !== undefined)
      ) {
        res = true;
        this.rowApplyChanges = false;
        this.rowEdit = false;
        this.rowNew = true;
        // this.esVisibleSelecc = 'onClick';
        this.GplanesAccion.instance.clearSelection();
        // this.agregarItemLista(e.oldData);
      } else {
        for (let key in e.oldData) {
          if (propiedadesVerificar.includes(key) && !e.oldData[key]) {
            propiedadesVacias.push(key);
          }
        }
        if (propiedadesVacias.length > 0)
          mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;

        showToast(mensaje, 'error');
        e.isValid = false;
        // this.esVisibleSelecc = 'none';
        res = false;
      };
    }

    if (res)
      this.conCambios++;

    return res;
  }

  opPrepararGuardar(accion: string): void {
    if (this.conCambios != 0) {
      this.loadingVisible = true;
      const user: any = localStorage.getItem('usuario')?.toUpperCase();
      //se saca el nodo planes de acción
      const npos: any = this.FPlanAccion.TAREAS.findIndex((d: any) => d.ID_ACTIVIDAD === -40);
      if (npos > -1)
        this.FPlanAccion.TAREAS.splice(npos, 1);
      //Armado de datos para ITM_PLANES_ACCION
      this.DGplanesAccion.forEach((reg: any) => {
        reg.ID_DOCUMENTO = this.FPlanAccion.ID_DOCUMENTO,
          reg.CONSECUTIVO = this.FPlanAccion.CONSECUTIVO,
          reg.DOCUMENTO = this.FPlanAccion.DOCUMENTO
      });

      // API guardado de datos
      var prm: any = { ENCABEZADO: this.FPlanAccion, ITM: this.DGplanesAccion };
      this.sData.save(accion, prm).subscribe((data) => {
        this.loadingVisible = false;
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.prmUsrAplBarReg.error = 'Error';
          this.prmUsrAplBarReg.accion = 'r_guardar';
          this.showModal(res[0].ErrMensaje, 'Error al guardar');
        } else {
          this.activeBtnCargar = true;
          this.mnuAccion = '';
          this.readOnly = true;
          this.modoLectura = true;
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            accion: "r_navegar",
            error: "",
            r_numReg: 0,
            r_totReg: 0,
            operacion: { r_nuevo: false, r_modificar: true, r_refrescar: true }
          };

          res.forEach((tarea: any) => {
            if (tarea.CLASE !== 'NODOS') {
              if (res.findIndex((d: any) => tarea.ID_ACTIVIDAD_PADRE === d.ID_ACTIVIDAD) === -1) {
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
                  case 'PLANES DE ACCION':
                    tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
                    tarea.ID_ACTIVIDAD_PADRE = -40;
                    break;

                  default:
                    break;
                }
              }
              tarea.isEdit = false;
              tarea.readOnlyResponsables = true;
            };
          });

          this.conCambios = 0;
          this.esVisibleSelecc = 'none';
          // this.eventsSubjectDatos.next({
          //   accion: 'cargar datos',
          //   config: { accion: 'update dataSource', dataSource: [...this.NODO_PRINCIPAL, ...res] }
          // });
          showToast('Registro actualizado', 'success');
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          // this.valoresObjetos('historial');
        }
      });
    } else {
      showToast('No hay cambios por guardar', 'error');
      this.esVisibleSelecc = 'onClick';
    }
  }

  convertirACondicionSQL(arreglo: any) {
    if (arreglo.length === 0) {
      return ""; // Si el arreglo está vacío, devolver una cadena vacía
    }
    // Mapear cada objeto en el arreglo a una cadena de condiciones SQL
    const condicionesSQL = arreglo.map((parametro: any) => {
      // Crear una cadena para cada objeto en el arreglo
      return `${Object.entries(parametro)
        .map(([clave, valor]) => `C.${clave} = '${valor}'`)
        .join(" AND ")}`;
    });
    // Unir todas las condiciones con AND para formar la condición final
    return condicionesSQL.join(" AND ");
  }


  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, data: any) {
    if (obj === 'documento') {
      this.loadingVisible = true;
      const prm = { ID_APLICACION: 'CAL-002', USUARIO: localStorage.getItem('usuario')?.toUpperCase() };
      this.sData.getConsecutivo('DOCUMENTOS CONSECUTIVO', prm).subscribe((data: any) => {
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
          this.FPlanAccion.CONSECUTIVO = '';
          this.FPlanAccion.ID_DOCUMENTO = '';
          this.FPlanAccion.DOCUMENTO = '';
        } else {
          this.FPlanAccion.CONSECUTIVO = newArray[0].CONSECUTIVO;
          this.FPlanAccion.ID_DOCUMENTO = newArray[0].ID_DOCUMENTO;
          this.FPlanAccion.DOCUMENTO = newArray[0].DOCUMENTO;
        }
      });
    };
    if (obj === 'actividad') {
      const prm: any = { ID_ACTIVIDAD: data };
      this.loadingVisible = true;
      this.sData.getActividad('ACTIVIDAD', prm).subscribe((dataResponse: any) => {
        this.loadingVisible = false;
        const res = validatorRes(dataResponse);
        if ((dataResponse.token !== undefined)) {
          const refreshToken = dataResponse.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
          return;
        }
        this.setProgramacion(res)
        for (let i = 0; i < res.length; i++) {
          const element = res[i];
          element.ID_ACTIVIDAD_PADRE = -1;
          element.ITEM = i;
        };
        this.NODO_PRINCIPAL = res;
        this.eventsSubjectDatos.next({
          accion: 'cargar datos',
          config: { accion: 'update dataSource', dataSource: [res[0]] }
        });
      });
    };
    if (obj === 'configurar') {
      this.loadingVisible = true;
      const prm = { ID_APLICACION: 'CAL-002', PLANTILLA: data };
      this.sData.consulta('CONFIGURACION', prm).subscribe((data: any) => {
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
    if (obj === 'responsables' || obj === 'todos') {
      const prm: any = {};
      this.sData.getResponsables('RESPONSABLES', prm).subscribe((data: any) => {
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
            const npos: any = element.NOMBRE.indexOf(" ");
            const name = element.NOMBRE.charAt(0).toUpperCase();
            const lastName = element.NOMBRE.substring(npos + 1, element.NOMBRE.length + 1);
            const Lape = lastName.charAt(0).toUpperCase();
            const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
            element.iconNameUser = newName;
            element.ITEM = i;
          };
          this.eventsSubjectDatos.next({
            accion: 'cargar datos',
            config: { accion: 'update data config', parametro: 'RESPONSABLE', dataSource: res }
          });
        }
      },
        ((err: any) => {
          this.showModal(err.message, 'Error');
        })
      );
    };
    if (obj === 'estados' || obj === 'todos') {
      const prm: any = { ID_GRUPO_DOMINIO: 'ESTADOS PAC' };
      this.sData.getEstados('ESTADOS', prm).subscribe((data: any) => {
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
    if (obj === 'historial') {
      // Obtener la cadena SQL
      this.loadingVisible = true;
      const condicionSQL = this.convertirACondicionSQL(this.parametrosFiltro);
      this.FPlanAccion.FILTRO = condicionSQL;
      var prm: any = { PARAMETRO: condicionSQL };
      // var prm:any = { PARAMETRO: this.parametrosFiltro };
      this.loadingVisible = true;
      this.sData.getHistorial('HISTORIAL', prm).subscribe((data: any) => {
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
          this.DGplanesAccion = [];
        } else {
          this.DGplanesAccion = newArray;
          this.loadingVisible = false;
        };
      },
        ((err: any) => {
          this.showModal(err.message, 'Error');
        })
      );

    };
    if (obj === 'productos' || obj === 'todos') {
      const prm = {};
      this.loadingVisible = true;
      this.sDataCAL001.getProductos('PRODUCTOS', prm).subscribe((data: any) => {
        this.loadingVisible = false;
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.showModal(mensaje, 'Error');
        } else {
          this.DGProductos = newArray;
        };
      },
        ((err: any) => {
          this.showModal(err.message, 'Error');
        })
      );
    };
    if (obj === 'empleados' || obj === 'todos') {
      const prm: any = {};
      this.sDataCAL001.getEmpleados('EMPLEADOS', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.showModal(mensaje, 'Error');
        } else {
          this.DGEmpleados = newArray;
        };
      });
    };
    if (obj === 'causas' || obj === 'todos') {
      const prm: any = {};
      this.sDataCAL001.getCausas('CAUSAS', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.showModal(mensaje, 'Error');
        } else {
          this.DGCausasClientes = newArray.filter((d: any) => !d.ID_CAUSA.includes('CN'));
        };
      });
    };
  }

  // Imprimir reporte de aplicación
  imprimirReporte(id_reporte: any, archivo: any, datosrpt: any) {

    let filtroRep = { FILTRO: this.DGplanesAccion };
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

    let fechaHoy = new Date()
    if (fecha_final.getFullYear() === fechaHoy.getFullYear()) {
      respProg = `${compFinal.dia}-${compFinal.mes}`;
    } else {
      respProg = `${compFinal.dia}-${compFinal.mes}-${compFinal.ano}`;
    }
    // Actualiza valor en el treelist
    data.PROGRAMACION = respProg;

  }
}
