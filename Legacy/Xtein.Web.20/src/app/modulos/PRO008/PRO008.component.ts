import { Component, HostListener, OnInit, ViewChild } from "@angular/core";
import { lastValueFrom, Subject, Subscription } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { SbarraService } from "../../containers/regbarra/_sbarra.service";
import { PRO008Service } from "../../services/PRO008/s_PRO008.service";
import { MSecciones } from "./clsPRO008.class";
import { SplitComponent, SplitAreaDirective, AngularSplitModule } from "angular-split";
import { clsBarraRegistro } from "../../containers/regbarra/_clsBarraReg";
import Swal from "sweetalert2";
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxComponent, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxScrollViewModule, DxSwitchModule, DxTextBoxModule, DxToolbarModule, DxTooltipModule, DxTreeListComponent, DxTreeListModule } from "devextreme-angular";
import { GlobalVariables } from '../../shared/common/global-variables';
import { VisorrepComponent } from "src/app/shared/visorrep/visorrep.component";
import { Tab } from "src/app/containers/tabs/tab.model";
import { TabService } from "src/app/containers/tabs/tab.service";
import { SfiltroService } from "src/app/shared/filtro/_sfiltro.service";
import { SvisorService } from "src/app/shared/vistarapida/_svisor.service";
import notify from 'devextreme/ui/notify';
import { AngularResizeEventModule, ResizedEvent } from "angular-resize-event";
import { CommonModule, DatePipe } from "@angular/common";
import { MenufloatComponent } from "src/app/shared/menufloat/menufloat.component";
import { VistarapidaComponent } from "src/app/shared/vistarapida/vistarapida.component";
import { showToast } from '../../shared/toast/toastComponent.js'
import { Workbook } from "exceljs";
import { exportDataGrid } from 'devextreme/excel_exporter';
import { exportDataGrid as pdfexport } from 'devextreme/pdf_exporter';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

@Component({
  selector: "PRO008-component",
  templateUrl: "./PRO008.component.html",
  styleUrls: ["./PRO008.component.scss",
    "../../../assets/xtein.scss"],
  standalone: true,
  imports: [CommonModule, AngularSplitModule, DxSwitchModule, DxTreeListModule, DxDataGridModule, DxFormModule,
    DxTextBoxModule, DxTooltipModule, DxLoadPanelModule, MenufloatComponent, VistarapidaComponent,
    AngularResizeEventModule, DxToolbarModule, DxNumberBoxModule, DxDropDownBoxModule,
    DxButtonModule, DxScrollViewModule
  ],
  providers: [AngularResizeEventModule]
})
export class PRO008Component implements OnInit {
  @ViewChild("ddBox", { static: false }) ddSeccAnt: DxDropDownBoxComponent;
  @ViewChild("treeListSecciones", { static: false }) treeListSecciones: DxTreeListComponent;
  @ViewChild("gridSeccAnt", { static: false }) gridSeccAnt: DxDataGridComponent;
  @ViewChild("gridTurnosPlanta", { static: false }) gridTurnosPlanta: DxDataGridComponent;
  @ViewChild("gridTurnosSeccion", { static: false }) gridTurnosSeccion: DxDataGridComponent;
  @ViewChild("formSecciones", { static: false }) form: DxFormComponent;


  public _unsubscribeAll: Subject<any>;

  // Variables fijas de la aplicación
  subscription: Subscription;
  subs_filtro: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = true;
  readOnlyIdSeccion: boolean = true;
  expandsecciones: boolean = true;
  btnContraer: string = 'Expandir';

  // Variables de datos
  treeSecciones: any;
  DatosSecciones: MSecciones[];
  FSecciones: MSecciones;
  FSecciones_prev: MSecciones;
  QFiltro: any;
  DEmpleados: any[] = [];
  DTurnosPlanta: any[] = [];
  DTurnos: any[] = [];
  DJornadasTurno: any[] = [];
  DTipoSeccion: any[] = [];
  GValorSeccAnt: number[] = [];
  dropDownOptions = { width: 500, height: 350 };
  GDatosSecc: any;
  isGridBoxOpened: boolean;
  visibleSwitchCostos: boolean = false;
  visibleSwitchMO: boolean = false;
  visibleSwitchInventario: boolean = false;
  seleccSeccAnt: any[] = new Array();
  focusedRowKey: number = 0;
  focusedSeccion: number = 0;
  iconoPlanta = '../../../assets/img/xtein/planta.png'
  iconoProceso = '../../../assets/img/xtein/proceso.png'
  iconoOperacion = '../../../assets/img/xtein/operacion.png'
  activarInv: boolean = true;
  activarMO: boolean = true;
  activarCostos: boolean = true;
  openTurno: boolean = false;
  buscarFiltro: boolean = false;
  autoExpandAll: boolean = false;
  idTargetToolTip: string;
  valorBaseCosto: string;
  valorFactorProteccion: string;
  msgToolTip: string;
  verToolTip: boolean;
  listaToolTips: any[] = []
  wrapperAttr = { class: "cls-tool|tip-reg" };
  loadingVisible: boolean = false;
  visibleGrupoHorarios: boolean = true;
  seccion_tipo_planta: boolean = false;
  validatorTurnoPlanta: boolean = false;
  selectTurno: any = [];
  openIdHorarios: boolean = false;
  templateGroup: any = ['ID_EMPLEADO'];

  //json de estados
  objReadOnly: any = {
    readOnly: false,
    esEdicion: false,
    iniEdicion: false,
    Factor: true,
    esEdicionFila: false,
    Tipo: false
  };
  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  numFila: number = 0;
  esVisibleSelecc: string = 'none';

  activaMenuFloat: boolean;
  targetMenuFloat: string = '';
  accion: string = '';
  dataMenuFloat: any;
  eventsSubject: Subject<void> = new Subject<void>();

  conCambios: number = 0;
  NOMBRE_SECCION_PADRE: any;
  DESCRIPCION: any;

  // notificaciones
  toaVisible: boolean;
  type = 'info';
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';

  constructor(
    private sData: PRO008Service,
    private _sbarreg: SbarraService,
    private tabService: TabService,
    private _sfiltro: SfiltroService,
    private SVisor: SvisorService,
    private datepipe: DatePipe
  ) {
    this._unsubscribeAll = new Subject();

    this.subscription = this._sbarreg
      .getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
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


    this.selectSeccion = this.selectSeccion.bind(this);
    this.onChangedTipo = this.onChangedTipo.bind(this);
    this.validarRecursividad = this.validarRecursividad.bind(this);
    this.opPrepararModificar = this.opPrepararModificar.bind(this);
    this.switchManoObra = this.switchManoObra.bind(this);
    this.ValideExistencia = this.ValideExistencia.bind(this);

  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        const user: any = localStorage.getItem("usuario");
        this.prmUsrAplBarReg = {
          tabla: "SECCIONES",
          aplicacion: "PRO-008",
          usuario: user,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: {}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.readOnly = false;
        this.readOnlyIdSeccion = false;
        this.objReadOnly.Tipo = false;
        this.objReadOnly.Factor = true;
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        if (this.FSecciones.TIPO === 'Planta') {
          showToast('No puede modificar las Secciones Tipo "Planta" ', 'error');
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            r_totReg: 1,
            r_numReg: 1,
            accion: 'r_navegar',
            // operacion: { r_modificar: false, r_eliminar: false }
            operacion: {}
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.mnuAccion = "update";
          this.readOnly = false;
          this.readOnlyIdSeccion = false;
          this.esVisibleSelecc = 'onClick';
          this.opPrepararModificar();
        }
        break;

      case "r_guardar":
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case "r_buscar":
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case "r_buscar_ejec":
        this.opBlanquearForma();
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case "r_eliminar":
        if (this.FSecciones.TIPO !== 'Planta')
          this.opEliminar();
        else
          this.showModal('No se puede eliminar una Plana.', '¡Importante!');

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
            this.FSecciones = JSON.parse(JSON.stringify(this.FSecciones_prev));
            this.mnuAccion = "";
            this.readOnly = true;
            this.readOnlyIdSeccion = true;
            this.activarInv = false;
            this.activarMO = false;
            this.activarCostos = false;
            this.conCambios = 0;
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.empleadosSecciones(this.FSecciones.ID_SECCION);
            this.objReadOnly.Tipo = true;
            this.objReadOnly.Factor = true;
            this.verToolTip = false;
          }
        });
        break;

      case "r_copiar":
        if (this.FSecciones.ID_SECCION !== '') {
          this.copiarSeccion();
        } else {
          showToast('Seleccione sección a copiar', 'Error');
        }
        break;

      case "r_vista":
        this.opVista();
        break;

      case 'r_refrescar':
        this.valoresObjetos('todos');
        break;

      case "r_imprimir":
        this.imprimirReporte(operMenu.operacion.id_reporte, operMenu.operacion.archivo, operMenu.operacion.data_rpt, 'INFORME');
        break;

      default:
        break;
    }
  }


  opPrepararNuevo(): void {
    this.opBlanquearForma();
    this.FSecciones.ESTADO = 'ACTIVO';
  }
  opBlanquearForma(): void {
    this.FSecciones.ITEM = 99;
    this.FSecciones.ID_SECCION = '';
    this.FSecciones.DESCRIPCION = '';
    this.NOMBRE_SECCION_PADRE = '';
    this.FSecciones.ANTERIOR = 0;
    this.FSecciones.CAPACIDAD = [];
    this.FSecciones.TIPO = '';
    this.FSecciones.FACTOR_PROTECCION_MO = 0;
    this.FSecciones.ESTADO = '';
    this.FSecciones.INVENTARIO = false;
    this.FSecciones.MANO_OBRA = false;
    this.FSecciones.ASIGNABLE = false;
    this.DEmpleados = [];
    this.FSecciones_prev = JSON.parse(JSON.stringify(this.FSecciones));
  }

  // Prepara datos antes de modificar 
  arrSeccRes = [] as MSecciones[];
  opPrepararModificar(): void {
    // Clona los datos para restituir valores
    this.FSecciones_prev = JSON.parse(JSON.stringify(this.FSecciones));
    this.validarRecursividad(this.mnuAccion);

    if (this.mnuAccion === 'new') {
      this.readOnlyIdSeccion = false;
      // this.objReadOnly.Tipo = true;
    }


    // Valida si tiene hijas, bloquear campo Tipo (no puede ser OPERATIVA)
    if (this.DatosSecciones.findIndex(s => s.ANTERIOR === this.FSecciones.ITEM) !== -1) {
      if (this.FSecciones.TIPO === 'Planta') {
        this.objReadOnly.Tipo = true;
        this.listaToolTips[4].msg = 'Esta sección ya tiene secciones hijas. Solo puede ser Tipo PLANTA y no puede modificarce.';
        this.listaToolTips[4].ver = true;
      }
      if (this.FSecciones.TIPO === 'PROCESO') {
        this.objReadOnly.Tipo = true;
        this.listaToolTips[4].msg = 'Esta sección ya tiene secciones hijas. Solo puede ser Tipo PROCESO y no puede modificarce.';
        this.listaToolTips[4].ver = true;
        if (this.FSecciones.INVENTARIO)
          this.esVisibleSelecc = 'onClick';
        else
          this.esVisibleSelecc = 'none';
      }
    } else {
      this.objReadOnly.Tipo = false;
      this.listaToolTips[4].ver = false;
    }

    if (this.FSecciones.TIPO === 'Planta')
      this.FSecciones.TIPO.toUpperCase();
    if (this.valorFactorProteccion === this.FSecciones.TIPO) {
      this.objReadOnly.Factor = false;
    } else {
      this.objReadOnly.Factor = true;
    }

    if (this.mnuAccion === 'update') {
      // Valida integridad referencial
      const prm = { ID_SECCION: this.FSecciones.ID_SECCION };
      this.sData
        .consulta('integridad referencial', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {

          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje !== '') {
            this.showModal(datares[0].ErrMensaje, '¡Importante!');
            this.readOnlyIdSeccion = true;
          }
          else {
            this.readOnlyIdSeccion = false;
          }

          // Caso de asignacion de costos
          if (datares[0].MAT !== undefined && datares[0].MAT !== '') {
            this.listaToolTips[3].msg = datares[0].MAT;
            this.listaToolTips[3].ver = true;
            this.activarCostos = true;
          }

        });
    }

  }

  copiarSeccion(): void {
    this.mnuAccion = "new";
    this.readOnly = false;
    this.FSecciones.ITEM = this.FSecciones.ITEM + 1;
    this.opPrepararModificar();
  }

  // Valida Control de gestión
  validarRecursividad(operSeccion: any) {
    let child: any;

    // ** Validacion HIJAS **
    // Inactivar si hay inventario en las hijas
    this.listaToolTips[3].msg = 'Ya tiene secciones hijas marcadas con Asignación de costos';
    if (operSeccion === 'update') {
      this.arrSeccRes = [];
      child = this.recurSeccionesGestionDown(this.DatosSecciones.filter(s => s.ANTERIOR === this.FSecciones.ITEM));
      var exis = child.findIndex(i => i.INVENTARIO);
      this.activarInv = (exis >= 0);
      if (exis >= 0) this.listaToolTips[1].msg = this.listaToolTips[1].msg.replace('padres', 'hijas');
      this.listaToolTips[1].ver = (exis >= 0);

      // Inactivar si hay mano de obra en las hijas
      exis = child.findIndex(i => i.MANO_OBRA);
      this.activarMO = (exis >= 0);
      if (exis >= 0) this.listaToolTips[2].msg = this.listaToolTips[2].msg.replace('padres', 'hijas');
      this.listaToolTips[2].ver = (exis >= 0);

      // Inactivar si hay materiales en las hijas
      exis = child.findIndex(i => i.ASIGNABLE);
      this.activarCostos = (exis >= 0);
      if (exis >= 0) this.listaToolTips[3].msg = this.listaToolTips[3].msg.replace('padres', 'hijas');
      this.listaToolTips[3].ver = (exis >= 0);
    } else {
      // Cuando está creando, activar control gestion x defecto
      this.activarInv = false;
      this.activarMO = false;
      this.activarCostos = false;
    }

    // ** Validacion PADRES **
    // Inactivar si hay inventario en las padres
    this.arrSeccRes = [];
    const seccAnt = this.FSecciones.ANTERIOR[0] !== undefined ? this.FSecciones.ANTERIOR[0] : this.FSecciones.ANTERIOR;

    child = this.recurSeccionesGestionUp(this.DatosSecciones.filter(s => s.ITEM === seccAnt));
    var exis = child.findIndex(i => i.INVENTARIO);
    this.activarInv = this.activarInv || (exis >= 0);
    if (exis >= 0) this.listaToolTips[1].msg = this.listaToolTips[1].msg.replace('hijas', 'padres');
    this.listaToolTips[1].ver = this.activarInv || (exis >= 0);

    // Inactivar si hay mano de obra en las hijas
    exis = child.findIndex(i => i.MANO_OBRA);
    this.activarMO = this.activarMO || (exis >= 0);
    if (exis >= 0) this.listaToolTips[2].msg = this.listaToolTips[2].msg.replace('hijas', 'padres');
    this.listaToolTips[2].ver = this.activarMO || (exis >= 0);

    // Inactivar si hay materiales en las hijas
    exis = child.findIndex(i => i.ASIGNABLE);
    this.activarCostos = this.activarCostos || (exis >= 0);
    if (exis >= 0) this.listaToolTips[3].msg = this.listaToolTips[3].msg.replace('hijas', 'padres');
    this.listaToolTips[3].ver = this.activarCostos || (exis >= 0);

  }

  // Recursividad hacia abajo
  recurSeccionesGestionDown(arrSecc: any): MSecciones[] {
    arrSecc.forEach(item => {
      // acc -> "acumulador" (array)
      // item -> item actual

      if (item.INVENTARIO || item.MANO_OBRA || item.ASIGNABLE) {
        // Si encuentra un hijo con manejo de inventario
        this.arrSeccRes.push(item);
      }

      // llamar recursivamente
      this.recurSeccionesGestionDown(this.DatosSecciones.filter(s => s.ANTERIOR === item.ITEM));

    });

    // Siempre retorna un vector
    return this.arrSeccRes;
  }

  // Recursividad hacia arriba
  recurSeccionesGestionUp(arrSecc: any): MSecciones[] {
    arrSecc.forEach(item => {
      // acc -> "acumulador" (array)
      // item -> item actual

      if (item.INVENTARIO || item.MANO_OBRA || item.ASIGNABLE) {
        // Si encuentra un hijo con manejo de inventario
        this.arrSeccRes.push(item);
      }

      // llamar recursivamente
      this.recurSeccionesGestionUp(this.DatosSecciones.filter(s => s.ITEM === item.ANTERIOR));

    });

    // Siempre retorna un vector
    return this.arrSeccRes;
  }

  // Guarda modificaciones
  opPrepararGuardar(accion: string): void {
    if (this.conCambios != 0) {
      // Acción validación de datos
      if (!this.ValidaDatos("requerido")) {
        return;
      }

      // Datos de la seccion a guardar
      if (this.FSecciones.ANTERIOR === undefined || this.FSecciones.ANTERIOR === null || this.FSecciones.ANTERIOR === 0) {
        this.showModal('Debe seleccionar una sección padre!');
        return;
      }
      if (Array.isArray(this.FSecciones.ANTERIOR)) {
        console.log(this.FSecciones_prev);
        this.FSecciones.ANTERIOR = this.FSecciones.ANTERIOR[0];
      }
      const prm = {
        OPERACION: accion,
        DATOS_SECCIONES: this.FSecciones,
        ID_SECCION_ANT: this.FSecciones_prev.ID_SECCION,
        ID_HORARIO: this.selectTurno[0]
      };

      // API guardado de datos
      this.sData.save(accion, prm).subscribe((data) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== "") {
          this.showModal(res[0].ErrMensaje);
        }
        else {

          if (this.mnuAccion === 'new') {
            this.VDatosReg = [this.FSecciones];
            this.QFiltro = "PRODUCTO='" + this.FSecciones.ID_SECCION + "'";
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              r_numReg: 1,
              r_totReg: 1,
              operacion: {}
            };
          } else {
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1] = JSON.parse(JSON.stringify(this.FSecciones));
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              operacion: {}
            };
          }
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

          showToast('Registro actualizado', 'success');

          // Actualiza el Item creado y añade nodo al árbol de secciones
          if (this.mnuAccion === 'new' && res[0].ITEM !== undefined) {
            this.FSecciones.ITEM = res[0].ITEM;
          }
          if (this.FSecciones.ITEM !== undefined) {
            const ix_secc = this.DatosSecciones.findIndex(s => s.ITEM === this.FSecciones.ITEM);
            this.DatosSecciones.splice(ix_secc, 1);
          }
          const dsecc: any = ({
            ID_UN: localStorage.getItem('empresa'),
            ID_SECCION: this.FSecciones.ID_SECCION,
            ITEM: this.FSecciones.ITEM,
            DESCRIPCION: this.FSecciones.DESCRIPCION,
            ANTERIOR: this.FSecciones.ANTERIOR,
            CAPACIDAD: this.FSecciones.CAPACIDAD,
            ID_UN_ITEM: this.FSecciones.ID_UN_ITEM,
            ASIGNABLE: this.FSecciones.ASIGNABLE,
            ESTADO: this.FSecciones.ESTADO,
            INVENTARIO: this.FSecciones.INVENTARIO,
            TIPO: this.FSecciones.TIPO,
            MANO_OBRA: this.FSecciones.MANO_OBRA,
            MSG: this.FSecciones.MSG,
            IsActive: true
          })
          this.valoresObjetos('secciones');
          this.DatosSecciones.push(dsecc);
          this.focusedSeccion = res[0].ITEM;
          this.treeSecciones.refresh();
          this.mnuAccion = "";
          this.readOnly = true;
          this.readOnlyIdSeccion = true;
          this.objReadOnly.Tipo = true;
          this.objReadOnly.Factor = true;
        }
      });
    } else {
      showToast('No hay cambios por guardar', 'error');
    }

  }

  ValidaDatos(Accion: string): boolean {
    if (Accion === "requerido") {
      if (
        this.FSecciones.ID_SECCION === '' ||
        this.FSecciones.DESCRIPCION === '' ||
        this.FSecciones.TIPO === '' ||
        this.FSecciones.ESTADO === ''
      ) {
        this.showModal('Error al guardar', "Faltan datos", "Hay datos incompletos. Llena todos los items!");
        return false;
      }
    }
    return true;
  }

  opPrepararBuscar(accion: any): void {
    if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Secciones",
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: 'RS_SECCIONES',
        aplicacion: this.prmUsrAplBarReg.aplicacion
      };
      this._sfiltro.getObsFiltro.emit(true);
    }

    // Navega la búsqueda
    else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { RS_SECCIONES: arrFiltro };

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
            this.VDatosReg = datares;

            // Asocia datos
            this.FSecciones = datares[0];
            this.QFiltro = datares[0].QFILTRO;

          } else {
            this.VDatosReg = [];
            this.opBlanquearForma();
            //notificació
            showToast(datares[0].ErrMensaje, 'error');
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
    this.readOnly = true;
    this.readOnlyIdSeccion = true;

    this.buscarFiltro = true;

    // this.readOnly = false;
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        if (this.VDatosReg.length != 0) {
          this.FSecciones = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this.prmUsrAplBarReg.r_numReg = 1;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.readOnly = true;
          this.readOnlyIdSeccion = true;
          showToast("No se encontraron datos", 'error');
        }
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.FSecciones = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.FSecciones = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.FSecciones = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
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
          this.FSecciones = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

        }
        else {
          this.opBlanquearForma();
          setTimeout(() => {
            this.form.instance.resetValues();
          }, 100);
        }
        this.readOnly = true;
        this.readOnlyIdSeccion = true;
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          this.FSecciones =
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        } else {
          this.opBlanquearForma();
        }
        break;

      default:
        break;
    }

    // Trae los empledos asociados a una sección
    this.empleadosSecciones(this.FSecciones.ID_SECCION);

    // Otras funciones
    this.objReadOnly.Tipo = false;
    this.verToolTip = false;

  }

  onExpanding(e: any) {
    if (this.expandsecciones) {
      this.autoExpandAll = true;
      this.btnContraer = 'Contraer';
      this.expandsecciones = !this.expandsecciones;
      return;
    }
    if (!this.expandsecciones) {
      this.autoExpandAll = false;
      this.btnContraer = 'Expandir';
      this.expandsecciones = !this.expandsecciones;
      const newArray: any = this.DatosSecciones.filter((d: any) => d.TIPO === 'Planta');
      newArray.forEach((ele: any) => {
        this.treeListSecciones.instance.collapseRow(ele.ITEM);
      });
      return;
    }
  };

  opEliminar(): void {
    Swal.fire({
      title: '',
      text: '',
      html: '¿Eliminar la sección ' + this.FSecciones.ID_SECCION + ' ' + this.FSecciones.DESCRIPCION + '?<br/>' +
        '<b style="color: red;">¡ADVERTENCIA!</b> Se eliminarán los empleados asociados a esta sección!',
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
  // Ejecuta la eliminación
  AccionEliminar(): void {
    const prm = {
      OPERACION: 'delete',
      DATOS_SECCIONES: this.FSecciones,
      ID_SECCION_ANT: ''
    };
    this.sData
      .delete('delete', prm)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (data) => {
          try {
            const res = JSON.parse(data.data);
            if ((data.token != undefined)) {
              const refreshToken = data.token;
              localStorage.setItem("token", refreshToken);
            }
            if (res[0].ErrMensaje !== '') {
              // alert de error
              this.showModal(res[0].ErrMensaje);
            }
            else {
              this.prmUsrAplBarReg = {
                ...this.prmUsrAplBarReg,
                error: '',
                accion: '',
                // operacion: { r_modificar: false, r_eliminar: false} }
                operacion: {}
              }
              this.readOnly = true;
              this.readOnlyIdSeccion = true;
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

              // Elimina de datos
              const isecc = this.DatosSecciones.findIndex(s => s.ITEM === this.FSecciones.ITEM);
              this.DatosSecciones.splice(isecc, 1);
              this.mnuAccion = "";
              this.opBlanquearForma();
              this.treeSecciones.refresh();

              const type = 'success';
              this.type = type;
              this.toaMessage = "Sección eliminada";
              this.toaVisible = true;
              showToast('Sección eliminada', 'success');
            }
          } catch (error) {
            this.showModal('Error respuesta eliminar sección: ' + error + ' Rta:' + data.data);
          }
        },
        error: (err => {
          this.showModal('Error al eliminar sección: ' + err.message);
        })
      });
  }
  // Vista/Zoom de los datos consultados
  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: "Secciones",
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: '',
      Filtro: '',
      keyGrid: ['ID_SECCION']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  dragEnd(unit: any, sizes: any): any {
    // const ed = this.diagLay.instance.element();
    // ed.style.width = sizes[1];
  }
  onRowPrepared(e: any) {
    if (e.rowType === "data") {
      if (e.data) {
        if (e.data.TIPO === 'Planta') {
          e.rowElement.style.fontWeight = '700';
        }
      }
    }
  }

  onToolbarPreparing(e: any) { }

  onRowClickSeccion(e: any) {
    const rowd = { row: { data: e.data } };
    this.selectSeccion(rowd);
  }

  selectSeccion(e: any) {
    if (e.row === undefined) return;

    if (this.readOnly !== false) {
      // No permite navegar si está en modo edición
      if (this.mnuAccion.match('new|update') && e.row.data.ID_SECCION !== this.FSecciones.ID_SECCION) {
        this.showModal('', '', '<head>' +
          '<style>' +
          'tr:nth-child(even) {background: #e4f3fa}' +
          'tr:nth-child(odd) {background: #e4f3fa}' +
          '</style>' +
          '</head><table style="text-align: left; width: 100%; border: 1px dotted gray;">' +
          '<tr><td>Se encuentra en modo edición (creando o modificando) de la sección ' +
          this.FSecciones.ID_SECCION + '.</td></tr><tr><td> ' +
          'Finalice la operación de edición para permitir navegar.</td></tr></table>');
        this.focusedSeccion = this.FSecciones.ITEM;
        return;
      }
      // Traer datos del array principal ya consultado en el arbol
      const secc = JSON.parse(JSON.stringify(this.DatosSecciones.find((s) => s.ID_SECCION == e.row.data.ID_SECCION)));
      if (secc !== undefined) {
        //verifica parametro de asignación del costo al tipo se seccion
        // if(this.valorBaseCosto === secc.TIPO) {
        //   this.visibleSwitchCostos = true;
        //   this.visibleSwitchMO = true;
        //   this.visibleSwitchInventario = false;
        // } else {
        //   this.visibleSwitchCostos = false;
        //   this.visibleSwitchMO = false;
        //   this.visibleSwitchInventario = true;
        // }
        if (secc.TIPO === 'PROCESO') {
          this.visibleSwitchInventario = true;
          this.visibleSwitchMO = false;
          this.visibleSwitchCostos = false;
        } else if (secc.TIPO === 'OPERATIVA') {
          this.visibleSwitchInventario = false;
          this.visibleSwitchCostos = true;
          this.visibleSwitchMO = true;
        } else {
          this.visibleSwitchInventario = false;
          this.visibleSwitchCostos = false;
          this.visibleSwitchMO = false;
        }
        // Datos del registro de navegación
        this.FSecciones = JSON.parse(JSON.stringify(secc));
        this.VDatosReg = [JSON.parse(JSON.stringify(this.FSecciones))];
        this.QFiltro = "ID_SECCION = '" + this.FSecciones.ID_SECCION + "'"

        this.focusedRowKey = secc.ANTERIOR;
        this.seleccSeccAnt = [secc.ANTERIOR];
        this.DESCRIPCION = secc.DESCRIPCION;
        // this.selectTurno = [ secc.ID_HORARIO ];
        if (secc.ANTERIOR !== 0) {
          this.NOMBRE_SECCION_PADRE = this.DatosSecciones.find((d: any) => d.ITEM === secc.ANTERIOR)?.DESCRIPCION;
        } else {
          this.NOMBRE_SECCION_PADRE = '';
        }

        // Si es tipo Planta, no modificar
        if (secc.TIPO === 'Planta') {
          const npos: any = this.GDatosSecc.findIndex((d: any) => d.ID_SECCION === secc.ID_UN_SUPERIOR);
          if (npos === -1) {
            this.GDatosSecc.push({ ID_SECCION: secc.ID_UN_SUPERIOR, ITEM: this.GDatosSecc.length });
            this.seleccSeccAnt = [this.GDatosSecc[this.GDatosSecc.length - 1].ITEM];
          } else {
            this.seleccSeccAnt = [this.GDatosSecc[npos].ITEM];
          }
          this.NOMBRE_SECCION_PADRE = secc.NOMBRE_SUPERIOR;
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            r_totReg: 1,
            r_numReg: 1,
            accion: 'r_navegar',
            // operacion: { r_modificar: false, r_eliminar: false }};
            operacion: {}
          };
          this.DTipoSeccion = ['Planta', 'PROCESO', 'OPERATIVA'];
          this.objReadOnly.Tipo = true;
        } else {
          this.DTipoSeccion = ['PROCESO', 'OPERATIVA'];
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            r_totReg: 1,
            r_numReg: 1,
            accion: 'r_navegar',
            // operacion: { r_modificar: true, r_eliminar: true }};
            operacion: {}
          };

          if (secc.TIPO === 'PROCESO' && this.FSecciones.INVENTARIO) {
            //valida las secciones hijas
            const child = this.DatosSecciones.filter((s: any) => s.ANTERIOR === this.FSecciones.ITEM);
          }

        }

        // Trae los empledos asociados a una sección
        this.empleadosSecciones(e.row.data.ID_SECCION);

        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      }
    } else {
      showToast('No se puede seleccionar otra sección si esta en modo edición', 'warning');
      this.focusedSeccion = this.FSecciones.ITEM;
      var newRowIndex = e.component.getRowIndexByKey(this.FSecciones.ITEM);
      e.component.focus(e.component.getCellElement(newRowIndex, 0));
    }

  }

  // Consulta los datos de empleado por seccion
  empleadosSecciones(seccion: any) {
    this.sData
      .empleadosSecciones('secciones_empleados', { ID_SECCION: seccion })
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje === '')
          this.DEmpleados = res;
        else
          this.DEmpleados = [];
      });
  }

  templateHtml(columna: any, element: any): any {
    let cad = [{ ID_HORARIO: '', DESCRIPCION_HORARIO: '', TIPO: '', N_EMPLEADOS: 0 }];
    let res: any = '';
    this.templateGroup.forEach((col: any) => {
      if (columna.row.data.items !== null) {
        switch (element) {
          case 'ID_HORARIO':
            cad[0].ID_HORARIO = columna.row.data.items[0].items[0].ID_HORARIO;
            res = cad[0].ID_HORARIO;
            break;
          case 'DESCRIPCION_HORARIO':
            cad[0].DESCRIPCION_HORARIO = columna.row.data.items[0].items[0].DESCRIPCION_HORARIO;
            res = cad[0].DESCRIPCION_HORARIO;
            break;
          case 'TIPO':
            cad[0].TIPO = columna.row.data.items[0].TIPO;
            res = cad[0].TIPO;
            break;
          case 'N_EMPLEADOS':
            let cont: number = 0;
            columna.row.data.items.forEach((ele: any) => {
              cont = cont + ele.items.length;
            });
            cad[0].N_EMPLEADOS = cont;
            res = cad[0].N_EMPLEADOS;
            break;
          default:
            break;
        }
      }
      if (columna.row.data.collapsedItems !== undefined) {
        cad[0].ID_HORARIO = columna.row.data.collapsedItems[0].ID_HORARIO;
        cad[0].DESCRIPCION_HORARIO = columna.row.data.collapsedItems[0].DESCRIPCION_HORARIO;
        cad[0].TIPO = columna.row.data.collapsedItems[0].TIPO;
        switch (element) {
          case 'ID_HORARIO':
            res = cad[0].ID_HORARIO;
            break;
          case 'DESCRIPCION_HORARIO':
            res = cad[0].DESCRIPCION_HORARIO;
            break;
          case 'TIPO':
            res = cad[0].TIPO;
            break;
          default:
            break;
        }
      }
    });
    return res;
  }


  onExporting(e: any) {
    if (this.DatosSecciones.length > 0) {
      var name: string = '';
      let fecha: Date = new Date();
      const newFecha = this.datepipe.transform(fecha, 'MM/dd/yyyy');
      name = 'Informe de secciones ' + newFecha;

      if (e.format == 'xls') {
        const exportFile = new Workbook();
        const dataExport: any = this.DatosSecciones;
        const worksheet = exportFile.addWorksheet('dataExport');
        exportDataGrid({
          component: e.component,
          worksheet,
          autoFilterEnabled: true,
        }).then(() => {
          exportFile.xlsx.writeBuffer().then((buffer) => {
            saveAs(new Blob([buffer], { type: 'application/octet-stream' }), name + '.xlsx');
          });
        });
      } else {
        const doc = new jsPDF();
        pdfexport({
          jsPDFDocument: doc,
          component: e.component,
          indent: 5,
        }).then(() => {
          doc.save(name + '.pdf');
        });
      }

    } else {
      showToast('No hay datos para exportar.', 'error');
    }
  }


  onFocusedRowChanging(e: any) {
    const rowsCount = e.component.getVisibleRows().length;
    const pageCount = e.component.pageCount();
    const pageIndex = e.component.pageIndex();
    const key = e.event && e.event.key;

    if (key && e.prevRowIndex === e.newRowIndex) {
      if (e.newRowIndex === rowsCount - 1 && pageIndex < pageCount - 1) {
        e.component.pageIndex(pageIndex + 1).done(() => {
          e.component.option('focusedRowIndex', 0);
        });
      } else if (e.newRowIndex === 0 && pageIndex > 0) {
        e.component.pageIndex(pageIndex - 1).done(() => {
          e.component.option('focusedRowIndex', rowsCount - 1);
        });
      }
    }
  }
  onSeleccRowSeccionAnt(e) {
    if (this.seleccSeccAnt.length > 0) {
      this.FSecciones.ANTERIOR = this.seleccSeccAnt[0];
      this.NOMBRE_SECCION_PADRE = e.data.DESCRIPCION;
    }
    this.isGridBoxOpened = false;

    // Activa/Inactiva control de gestión
    this.validarRecursividad(this.mnuAccion);

  }

  // Valide unicidad de la llave
  async ValideExistencia(e: any) {
    if (this.mnuAccion === undefined) return (true);
    if (this.readOnly || !this.mnuAccion.match('new|update')) {
      return (true);
    }
    if (this.mnuAccion === 'update' && this.FSecciones_prev.ID_SECCION === e.value) {
      return (true);
    }

    // Valida la existencia de la llave respectiva
    const prm = { ID_SECCION: e.value };
    const apiRest = this.sData.validellave('EXISTE SECCION', prm, 'PRO008');
    let res = await lastValueFrom(apiRest, { defaultValue: true });
    res = JSON.parse(res.data);
    if (res[0].ErrMensaje === '') {
      this.conCambios++;
    }
    else {
      showToast(res[0].ErrMensaje, 'error');
      var fNextEditor: any = this.form.instance.getEditor('ID_SECCION');
      fNextEditor.focus();
      return (false);
    }

    // Notifica si tiene hijos
    this.onValidarSeccion(e);
    return (true);

  }

  // Valida si hubo cambio en la seccion 
  onValidarSeccion(e: any) {
    // if (!this.ValideExistencia(this.FSecciones.ID_SECCION)) return;

    // Valida si tiene hijos y confirma
    if (this.FSecciones.ID_SECCION !== this.FSecciones_prev.ID_SECCION) {
      const child = this.DatosSecciones.filter(s => s.ANTERIOR === this.FSecciones_prev.ITEM);
      if (child !== undefined && child.length !== 0) {
        Swal.fire({
          title: '',
          text: 'Esta sección tiene secciones hijas. ¿Desea reasignar el código para dichas secciones?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, reasignar'
        }).then((result) => {
          if (!result.isConfirmed) {
            this.FSecciones.ID_SECCION = this.FSecciones_prev.ID_SECCION;
          }
        });

      }
    }
  }

  onContentReady(e: any) {
    e.component.columnOption("command:edit", "visible", false);
  }

  // Cambio de Tipo
  onChangedTipo(e: any) {
    if (this.valorBaseCosto === e.value) {
      this.visibleSwitchCostos = true;
      this.visibleSwitchMO = true;
      this.visibleSwitchInventario = false;
    } else {
      this.visibleSwitchCostos = false;
      this.visibleSwitchMO = false;
    }
    if (e.value === 'PROCESO')
      this.visibleSwitchInventario = true;
    this.conCambios++;
  }

  onValueChangedCapacidadProd(e: any) {
    if (this.mnuAccion.match('new|update')) {
      //Analiza si las secciones hijas esceden el valor por asignar
      const hijas: any[] = this.DatosSecciones.filter((d: any) => d.ANTERIOR === this.FSecciones.ID_SECCION);
      if (hijas.length > 0) {
        var cont: number = 0;
        hijas.forEach((secc: any) => {
          cont = cont + secc.CAPACIDAD_PROD;
        });

        if (e.value < cont) {
          this.FSecciones.CAPACIDAD_PROD = e.value;
        } else {
          Swal.fire({
            title: '',
            text: 'El valor no iguala la capacidad instalda en las secciones hijas. Aumente el valor o configure las secciones hijas.',
            iconHtml: "<i class='icon-alert-ol'></i>",
            showCancelButton: false,
            confirmButtonColor: '#DF3E3E',
            confirmButtonText: 'Continuar'
          }).then((result) => {
            if (result.isConfirmed) {
              this.FSecciones.CAPACIDAD_PROD = 0;
            }
          });
        }
      } else {
        //Analiza la seecion padre para no exceder la capacidad
        const padre: any[] = this.DatosSecciones.filter((d: any) => d.ID_SECCION === this.FSecciones.ANTERIOR);
        switch (padre[0].TIPO) {
          case 'Planta':
            this.FSecciones.CAPACIDAD_PROD = e.value;
            break;

          case 'PROCESO':
            if (!this.FSecciones.INVENTARIO)
              this.FSecciones.CAPACIDAD_PROD = e.value;
            else {
              if (e.value <= padre[0].CAPACIDAD_PROD) {
                this.FSecciones.CAPACIDAD_PROD = e.value;
              } else {
                Swal.fire({
                  title: '',
                  text: 'El supera la capacidad instalda en las sección padre. Disminuya el valor o configure la sección padre.',
                  iconHtml: "<i class='icon-alert-ol'></i>",
                  showCancelButton: false,
                  confirmButtonColor: '#DF3E3E',
                  confirmButtonText: 'Continuar'
                }).then((result) => {
                  if (result.isConfirmed) {
                    this.FSecciones.CAPACIDAD_PROD = 0;
                  }
                });
              }
            }
            break;

          case 'OPERATIVA':
            if (e.value <= padre[0].CAPACIDAD_PROD) {
              this.FSecciones.CAPACIDAD_PROD = e.value;
            } else {
              Swal.fire({
                title: '',
                text: 'El supera la capacidad instalda en las sección padre. Disminuya el valor o configure las sección padre.',
                iconHtml: "<i class='icon-alert-ol'></i>",
                showCancelButton: false,
                confirmButtonColor: '#DF3E3E',
                confirmButtonText: 'Continuar'
              }).then((result) => {
                if (result.isConfirmed) {
                  this.FSecciones.CAPACIDAD_PROD = 0;
                }
              });
            }
            break;

          default:
            break;
        }

      }

    }
  }

  onValueChangedStockSeguridad(e: any) {
    if (this.mnuAccion.match('new|update')) {
      this.FSecciones.STOCK_SEGURIDAD = e.value;
    }
  }

  onSelectionTurnos(e: any) {
    if (!this.gridTurnosSeccion.instance.hasEditData()) {
      this.filasSelecc = e.selectedRowKeys;
      if (this.filasSelecc.length > 0) {
        if (this.filasSelecc.length === 1) {
          this.filasSelecc = [e.component.getRowIndexByKey(e.selectedRowKeys[0])];
          this.rowEdit = true;
        } else {
          this.rowEdit = false;
        }
        this.rowDelete = true;
      } else {
        this.rowDelete = false;
        this.rowEdit = false;
      }
    } else {
      this.rowDelete = false;
      this.rowEdit = false;
    }
  }

  onSelectionTurno(e: any, cellInfo: any) {
    if (this.mnuAccion.match('new|update')) {
      this.gridTurnosSeccion.instance.cellValue(cellInfo.rowIndex, 'ID_HORARIO', e.selectedRowKeys[0]);
      this.gridTurnosSeccion.instance.cellValue(cellInfo.rowIndex, 'DESCRIPCION', e.selectedRowsData[0].DESCRIPCION);
      this.conCambios += 1;
      this.openIdHorarios = false;
    } else {
      this.openIdHorarios = false;
    }
  }

  // Cambio de valor en el inventario
  onChangedInv(e: any) {
  }

  // Acciones sobre cambio en Mano de Obra
  async switchManoObra(e: any) {

    if (e.event === undefined) return;

    const prm = { ID_SECCION: this.FSecciones.ID_SECCION };
    const apiRest = this.sData.validellave('cambios mano de obra', prm, 'PRO008');
    let res = await lastValueFrom(apiRest, { defaultValue: true });
    res = JSON.parse(res.data);

    if (res[0].ErrMensaje === '') {
      this.conCambios++;
      e.component.option('value', e.value);
    } else {
      this.showModal(res[0].ErrMensaje, '¡IMPORTANTE!');
      e.component.option('value', e.previousValue);
    }

  }

  onContentReadyFSecc(e: any) {
    let elements = e.component.element().querySelectorAll(".dx-field-item-content");
    let that = this;
    elements.forEach((el: any, index: any) => {
      const npos = this.listaToolTips.map(t => t.id).indexOf(index);
      if (npos >= 0) {
        el.addEventListener("mouseenter", (event) => {
          if (!this.readOnly) {
            this.msgToolTip = this.listaToolTips[npos].msg;
            this.idTargetToolTip = event.target;
            this.verToolTip = this.listaToolTips[npos].ver;
          }
        });
        el.addEventListener("mouseleave", (event) => {
          this.verToolTip = false;
        });
      }
    });
  }

  onInitNewRowPro(e: any) {
    e.data.ID_HORARIO = '';
    e.data.CAPACIDAD = 0;
    if (this.FSecciones.CAPACIDAD.length > 0) {
      const item = this.FSecciones.CAPACIDAD.reduce((ant: any, act: any) => { return (ant.ITEM > act.ITEM) ? ant : act })
      e.data.ITEM = item.ITEM + 1;
    } else {
      e.data.ITEM = 1;
    }
    this.numFila = e.data.ITEM;
    this.selectTurno = [];
  }

  selectionGrid(e: any) {
    this.filasSelecc = e.selectedRowKeys;
    this.numFila = this.FSecciones.CAPACIDAD.findIndex((d: any) => d.ITEM === e.selectedRowKeys[0]);
    if (this.filasSelecc.length > 0) {
      if (this.gridTurnosSeccion.instance.hasEditData()) {
        this.rowDelete = false;
      } else {
        this.rowDelete = true;
      }
    } else {
      this.rowDelete = false;
    }
  }

  onRowValidating(e: any) {
    let mensaje: any = '';
    if (this.accion === 'new') {
      if (((e.newData.ID_HORARIO === '') || (e.newData.ID_HORARIO === null)) ||
        ((e.newData.CAPACIDAD <= 0) || (e.newData.CAPACIDAD === null))
      ) {
        mensaje = `Seleccione el horario, complete la información.`;
        if (e.newData.CAPACIDAD <= 0)
          mensaje = 'Número de trabajadores debe ser mayor a cero(0).';

        e.isValid = false;
        showToast(mensaje, 'error');
      } else {
        e.isValid = true;
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.rowDelete = false;
        this.conCambios += 1;
        this.accion = '';
      };
    };
    if (this.accion === 'update') {
      for (let prop in e.newData) {
        if (e.newData.hasOwnProperty(prop) && e.oldData.hasOwnProperty(prop)) {
          e.oldData[prop] = e.newData[prop];
        }
      }

      if (((e.newData.ID_HORARIO === '') || (e.newData.ID_HORARIO === null)) ||
        ((e.newData.CAPACIDAD <= 0) || (e.newData.CAPACIDAD === null))
      ) {
        mensaje = `Seleccione el horario, complete la información.`;
        if (e.newData.CAPACIDAD <= 0)
          mensaje = 'Número de trabajadores debe ser mayor a cero(0).';

        e.isValid = false;
        showToast(mensaje, 'error');
      } else {
        e.isValid = true;
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.rowDelete = false;
        this.conCambios += 1;
        this.accion = '';
      };
    };
    return e.isValid;
  }

  // Operaciones de grid
  operGrid(e: any, operacion: any) {
    switch (operacion) {
      case 'new':
        this.gridTurnosSeccion.instance.clearSelection();
        this.gridTurnosSeccion.instance.addRow();
        this.rowApplyChanges = true;
        this.rowNew = false;
        this.rowDelete = false;
        this.accion = 'new';
        this.esVisibleSelecc = 'none';
        break;
      case 'edit':
        this.gridTurnosSeccion.instance.editRow(this.filasSelecc[0]);
        this.rowApplyChanges = true;
        this.rowNew = false;
        this.rowDelete = false;
        this.gridTurnosSeccion.instance.clearSelection();
        this.accion = 'update';
        this.esVisibleSelecc = 'none';
        break;
      case 'save':
        this.gridTurnosSeccion.instance.saveEditData();
        break;
      case 'cancel':
        this.gridTurnosSeccion.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        if (this.filasSelecc.length > 0) {
          if (this.filasSelecc.length === 1)
            this.rowEdit = true;
          else
            this.rowEdit = false;
          this.rowDelete = true;
        } else {
          this.rowDelete = false;
        }
        this.esVisibleSelecc = 'onClick';
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
            this.filasSelecc.forEach((key: any) => {
              const index = this.FSecciones.CAPACIDAD.findIndex((a: any) => a.ITEM === key);
              this.FSecciones.CAPACIDAD.splice(index, 1);
            });
            this.gridTurnosSeccion.instance.refresh();
            this.conCambios += 1;
            this.rowApplyChanges = false;
            this.rowNew = true;
            if (this.filasSelecc.length > 0) {
              this.rowDelete = true;
            } else {
              this.rowDelete = false;
            }
            this.accion = '';
          }
        });
        break;

      default:
        break;
    }
  }

  // Imprimir reporte de aplicación
  imprimirReporte(id_reporte: any, archivo: any, datosrpt: any, tipo: any) {

    let filtroRep = { FILTRO: this.QFiltro };
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

  // Heredar objeto secciones
  onInitialized(e: any) {
    this.treeSecciones = e.component;
  }

  ngOnInit(): void {
    const user: any = localStorage.getItem("usuario");
    this.prmUsrAplBarReg = {
      tabla: "SECCIONES",
      aplicacion: "PRO-008",
      usuario: user,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: {}
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';

    this.FSecciones = {
      ID_UN: '',
      ID_SECCION: '',
      ITEM: 99,
      DESCRIPCION: '',
      ANTERIOR: 0,
      ID_UN_ITEM: '',
      ASIGNABLE: false,
      ESTADO: '',
      INVENTARIO: false,
      TIPO: '',
      CAPACIDAD: [],
      CAPACIDAD_PROD: 0,
      STOCK_SEGURIDAD: 0,
      FACTOR_PROTECCION_MO: 0,
      MANO_OBRA: false,
      MSG: '',
      IsActive: false
    };
    this.DTipoSeccion = ['PROCESO', 'OPERATIVA'];

    this.valoresObjetos('todos');
    window.addEventListener('scroll', this.onScroll, true);

    // Msensajes de apoyo
    this.listaToolTips = [];
    this.listaToolTips.push({ id: 2, msg: 'Solo se permiten asociar secciones tipo Proceso.', ver: true });
    this.listaToolTips.push({ id: 7, msg: 'Ya tiene secciones hijas marcadas con Inventario.', ver: false });
    this.listaToolTips.push({ id: 8, msg: 'Ya tiene secciones hijas marcadas con Mano de Obra.', ver: false });
    this.listaToolTips.push({ id: 9, msg: 'Ya tiene secciones hijas marcadas con Asignación de costos.', ver: false });
    this.listaToolTips.push({ id: 4, msg: 'Esta sección ya tiene secciones hijas. Solo puede ser Tipo PROCESO.', ver: false });

  }

  // Función para agregar un cero delante de los números menores a 10
  agregarCeroDelante(numero: any) {
    return numero < 10 ? `0${numero}` : numero;
  }

  ngAfterViewInit(): void {
    // Puesta a punto
    this.prmUsrAplBarReg = {
      ...this.prmUsrAplBarReg,
      accion: '',
      operacion: {}
    };
    this.readOnly = true;
    this.readOnlyIdSeccion = true;

  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string) {
    if (obj === 'secciones' || obj === 'todos') {
      // Carga las secciones registradas
      this.sData
        .getSecciones({ FILTRO: "" })
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((data) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          for (let i = 0; i < res.length; i++) {
            res[i].COD = i;
          }
          this.DatosSecciones = res;
          // Toma las mismas secciones para el drop de consulta de Seccion Anterior
          this.GDatosSecc = this.DatosSecciones.filter(s => s.TIPO !== 'OPERATIVA');

        });
    };
    if (obj === 'turnos' || obj === 'todos') {
      const prm = {};
      this.sData.getTurnos('TURNOS', prm).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.showModal(mensaje, 'Error');
        }
        else {
          newArray.forEach((turno: any) => {
            turno.ITM_TURNOS.forEach((jornada: any) => {
              var fecha: any;
              for (let i = 0; i <= 1; i++) {
                if (i === 0)
                  fecha = new Date(jornada.INICIO);
                else if (i === 1)
                  fecha = new Date(jornada.FINAL);
                // Obtener las partes de la hora
                const horas = fecha.getHours();
                const minutos = fecha.getMinutes();

                // Formatear la hora como cadena
                const horaFormateada = `${this.agregarCeroDelante(horas)}:${this.agregarCeroDelante(minutos)}`;
                if (i === 0)
                  jornada.INICIO = horaFormateada;
                else if (i === 1)
                  jornada.FINAL = horaFormateada;
              }
            });
          });
          this.DTurnos = newArray;
        };
      },
        (err => {
          this.showModal(err.message, 'Error');
        })
      );
    };
    if (obj === 'jornadas turno') {
      const prm = { ID_HORARIO: this.selectTurno };
      this.sData.getJornadasTurnos('JORNADAS TURNOS', prm).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.showModal(mensaje, 'Error');
        }
        else {
          this.DJornadasTurno = newArray;
        };
      },
        (err => {
          this.showModal(err.message, 'Error');
        })
      );
    };
    if (obj === 'EspecProd' || obj === 'todos') {
      const prm = { DATOS: '' };
      this.sData.getBasesdelCosto('VALOR BASE', prm).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.showModal(mensaje, 'Error');
        } else {
          const costos: any = newArray.filter((d: any) => d.CLASE === 'ASIGNACION DE COSTOS');
          const factor: any = newArray.filter((d: any) => d.CLASE === 'FACTOR PROTECCION MANO DE OBRA');
          this.valorBaseCosto = costos[0].CODIGO;
          if (factor[0].CODIGO === 'SECCIONES TIPO PROCESO') factor[0].CODIGO = 'PROCESO';
          this.valorFactorProteccion = factor[0].CODIGO;
        };
      },
        (err => {
          this.showModal(err.message, 'Error');
        })
      );
    };
  }

  getSizeQualifier(width: any) {
    if (width < 768) return "xs";
    if (width < 992) return "sm";
    if (width < 1366) return "md";
    return "lg";
  }

  onResized(event: any) {
    const width: number = event.newRect.width;
    const height: number = event.newRect.height;
    const constainer_expandir: any = document.getElementById('constainer-expandir');
    if (constainer_expandir !== null && constainer_expandir !== undefined) {
      if (width < 330) {
        constainer_expandir.style.width = '100%';
        constainer_expandir.style.position = 'relative';
      } else {
        constainer_expandir.style.width = '110px';
        constainer_expandir.style.position = 'absolute';
      };
    }
  }

  ngOnDestroy() {
    this._unsubscribeAll.next('');
    this._unsubscribeAll.complete();
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
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

  // Eventos del menu float
  // Si está desplegado el menu float de apoyo, ocultarlo
  onScroll(e: Event): void {
    if (this.eventsSubject === undefined) return;
    this.eventsSubject.next();
  }
  // Mostrar el menu float de apoyo, con Control+click-derecho
  @HostListener("document:contextmenu", ["$event"])
  clickout(e: any) {
    console.log(e.srcElement);
    if (!e.ctrlKey) return;
    if (e.srcElement.id !== undefined && e.srcElement.id !== '') {
      this.targetMenuFloat = '#' + e.srcElement.id;
      console.log('ayuda....', e.srcElement.name ?? e.srcElement.id);
      this.dataMenuFloat = { aplicacion: this.prmUsrAplBarReg.aplicacion, objeto: e.srcElement.name ?? e.srcElement.id };
      this.activaMenuFloat = true;
    }
    else {
      if (e.srcElement.name !== undefined && e.srcElement.name !== '') {
        this.targetMenuFloat = '#xs__' + e.srcElement.name;  //e.srcElement.name;
        this.dataMenuFloat = { titulo: 'Accesos a ' + e.srcElement.name, aplicacion: 'SECCIONES' };
        this.activaMenuFloat = true;
      }
    }
    e.preventDefault();
  }
  // Ocultar el menu float de apoyo, con click-fuera
  onClickMe() {
    this.activaMenuFloat = false;
  }

}
