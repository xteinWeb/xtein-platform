import { Component, HostListener, OnInit, ViewChild } from "@angular/core";
import { lastValueFrom, Subject, Subscription } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { SbarraService } from "../../containers/regbarra/_sbarra.service";
import { PRO008Service } from "../../services/PRO008/s_PRO008.service";
import { MAreas } from "./clsGES005.class";
import { SplitComponent, SplitAreaDirective, AngularSplitModule } from "angular-split";
import { clsBarraRegistro } from "../../containers/regbarra/_clsBarraReg";
import Swal from "sweetalert2";
import { DxDataGridComponent, DxDataGridModule, DxDropDownBoxComponent, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxLoadPanelModule, DxSelectBoxModule, DxSwitchModule, DxTextAreaModule, DxTextBoxModule, DxToolbarModule, DxTooltipModule, DxTreeListComponent, DxTreeListModule } from "devextreme-angular";
import { GlobalVariables } from '../../shared/common/global-variables';
import { VisorrepComponent } from "src/app/shared/visorrep/visorrep.component";
import { Tab } from "src/app/containers/tabs/tab.model";
import { TabService } from "src/app/containers/tabs/tab.service";
import { SfiltroService } from "src/app/shared/filtro/_sfiltro.service";
import { SvisorService } from "src/app/shared/vistarapida/_svisor.service";
import notify from 'devextreme/ui/notify';
import { AngularResizeEventModule, ResizedEvent } from "angular-resize-event";
import { CommonModule } from "@angular/common";
import { MenufloatComponent } from "src/app/shared/menufloat/menufloat.component";
import { VistarapidaComponent } from "src/app/shared/vistarapida/vistarapida.component";
import { GES005Service } from "src/app/services/GES005/s_GES005.service";
import { GES003Service } from "src/app/services/GES003/GES003.service";
import { showToast } from '../../shared/toast/toastComponent.js';

@Component({
  selector: "GES005-component",
  templateUrl: "./GES005.component.html",
  styleUrls: ["./GES005.component.scss",
              "../../../assets/xtein.scss"],
  standalone: true,
  imports: [CommonModule, AngularSplitModule, DxSwitchModule, DxTreeListModule, DxDataGridModule, DxFormModule,
            DxTextBoxModule, DxTooltipModule, DxLoadPanelModule, MenufloatComponent, VistarapidaComponent, 
            AngularResizeEventModule, DxTextAreaModule, DxToolbarModule, DxSelectBoxModule, DxDropDownBoxModule
          ],
  providers: [AngularResizeEventModule]
})
export class GES005Component implements OnInit {
  @ViewChild("ddBox", { static: false }) ddSeccAnt: DxDropDownBoxComponent;
  @ViewChild("treeListAreas", { static: false }) treeListAreas: DxTreeListComponent;
  @ViewChild("gridSeccAnt", { static: false }) gridSeccAnt: DxDataGridComponent;
  @ViewChild("gridTurnosPlanta", { static: false }) gridTurnosPlanta: DxDataGridComponent;
  @ViewChild("forMAreas", { static: false }) form: DxFormComponent;
  

  public _unsubscribeAll: Subject<any>;

  // Variables fijas de la aplicación
  subscription: Subscription;
  subs_filtro: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = true;
  readOnlyIdArea: boolean = true;
  expandAreas: boolean = true;
  btnContraer: string = 'Expandir';

  // Variables de datos
  treeAreas: any;
  DListaAreas: MAreas[];
  FAreas: MAreas;
  FAreas_prev: MAreas;
  LCargos: any[] = [];
  QFiltro: any;
  DAreasAsociadas: any[] = [];
  DTurnosPlanta: any[] = [];
  DTurnos: any[] = [];
  DJornadasTurno: any[] = [];
  DTipoArea: any[] = [];
  GValorSeccAnt: number[] = [];
  dropDownOptions = { width: 700, height: 350, hideOnParentScroll: true, container:'#router-container'  };
  LDatosAreas: any[] = [];
  isGridBoxOpened: boolean;
  isGridBoxOpenedCargo: boolean;
  visibleSwitch: boolean = false;
  seleccSeccAnt: any[] = new Array();
  seleccSeccCargo: any[] = new Array();
  focusedRowKey: number = 0;
  focusedRowKeyCargo: string = '';
  focusedSeccion: number = 0;
  iconoPlanta = '../../../assets/img/xtein/planta.png'
  iconoProceso = '../../../assets/img/xtein/proceso.png'
  iconoOperacion = '../../../assets/img/xtein/operacion.png'
  activarInv: boolean = true;
  activarMO: boolean = true;
  activarCostos: boolean = true;
  buscarFiltro: boolean = false;
  autoExpandAll: boolean = false;
  idTargetToolTip: string;
  valorBaseCosto: string;
  msgToolTip: string;
  verToolTip: boolean;
  listaToolTips: any[] = []
  wrapperAttr = { class: "cls-tool|tip-reg" };
  loadingVisible: boolean = false;
  visibleGrupoHorarios: boolean = true;
  seccion_tipo_planta: boolean = false;
  validatorTurnoPlanta: boolean = false;
  integridadReferencial: boolean = false;
  selectTurno: any = [];  
  openIdHorarios: boolean = false;

  //json de estados
  objReadOnly: any = {
    readOnly: false,
    esEdicion: false,
    iniEdicion: false,
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

  activaMenuFloat: boolean;
  targetMenuFloat: string = '';
  dataMenuFloat: any;
  eventsSubject: Subject<void> = new Subject<void>();

  conCambios: number = 0;
  NOMBRE_AREA_PADRE: any;
  DESCRIPCION: any;
  NOMBRE_CARGO: any;
  RESPONSABLE: any[];
  widthSerchTreeList:any = 200;
  // notificaciones
  toaVisible: boolean;
  type = 'info';
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';
  
  constructor(
    private sData: GES005Service,
    private sData_cargos: GES003Service,
    private _sbarreg: SbarraService,
    private tabService: TabService,
    private _sfiltro: SfiltroService,
    private SVisor: SvisorService
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


    this.selectArea = this.selectArea.bind(this);
    this.onChangedTipo = this.onChangedTipo.bind(this);
    this.validarRecursividad = this.validarRecursividad.bind(this);
    this.opPrepararModificar = this.opPrepararModificar.bind(this);
    this.switchManoObra = this.switchManoObra.bind(this);
    this.ValideExistencia = this.ValideExistencia.bind(this);

  }

  // Llama a Acciones de registro
  async opMenuRegistro(operMenu: clsBarraRegistro) {
    switch (operMenu.accion) {
      case "r_ini":
        const user:any = localStorage.getItem("usuario");
        this.prmUsrAplBarReg = {
          tabla: "Areas",
          aplicacion: "GES-005",
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
        this.readOnlyIdArea = false;
        this.objReadOnly.Tipo = false;
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.mnuAccion = "update";
        this.opPrepararModificar('update');
        break;

      case "r_guardar":
        let apro = await this.ValideExistencia({value: this.FAreas.ID_AREA})
        if (apro)
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
        if (this.prmUsrAplBarReg.r_totReg > 0)
          this.opEliminar();
        break;

      case "r_primero":
      case "r_ID_AREA_SUPERIOR":
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
            this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} }
            this.FAreas = JSON.parse(JSON.stringify(this.FAreas_prev));
            this.mnuAccion = "";
            this.readOnly = true;
            this.readOnlyIdArea = true;
            this.activarInv = false;
            this.activarMO = false;
            this.activarCostos = false;
            this.conCambios = 0;
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            // this.areasAsociadas(this.FAreas.ID_AREA);
            this.objReadOnly.Tipo = true;
            this.verToolTip = false;  
          }
        });
        break;

      case "r_copiar":
        if (this.FAreas.ID_AREA !== '') {
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
    this.FAreas.ESTADO = 'ACTIVO';
    if (this.LDatosAreas.length === 0)
      this.LDatosAreas.push({ ID_AREA: 'RAIZ', DESCRIPCION: 'Area raiz', ID_UN: '',
                              ITEM: 0,
                              ID_AREA_SUPERIOR: '',
                              ID_UN_ITEM: '',
                              ESTADO: '',
                              TIPO: '',
                              IsActive: false });
  }
  opBlanquearForma(): void {
    this.FAreas.ITEM = 99;
    this.FAreas.ID_AREA = '';
    this.FAreas.DESCRIPCION = '';
    this.NOMBRE_AREA_PADRE = '';
    this.FAreas.ID_AREA_SUPERIOR = '';
    this.FAreas.TIPO = '';
    this.FAreas.ESTADO = '';
    this.DAreasAsociadas = [];
    this.seleccSeccCargo = [];
    this.seleccSeccAnt = [];
    this.NOMBRE_CARGO = '';
    this.RESPONSABLE = [];
    this.FAreas_prev = JSON.parse(JSON.stringify(this.FAreas));
  }

  // Prepara datos antes de modificar 
  arrSeccRes = [] as MAreas[];
  async opPrepararModificar(accion:string){
    if (accion === 'update') {
      await this.validarIntegridad('update');
      if (this.DListaAreas.findIndex(s => s.ID_AREA_SUPERIOR === this.FAreas.ID_AREA) !== -1) {
        this.readOnlyIdArea = true;
      }
    } else {
      this.integridadReferencial = true;
    }
    if(this.integridadReferencial){
      // if (this.mnuAccion === "copiar")
      //   this.mnuAccion = "new";
      this.readOnly = false;
      this.readOnlyIdArea = false;
      // Clona los datos para restituir valores
      this.FAreas_prev = JSON.parse(JSON.stringify(this.FAreas));
  
      if(this.mnuAccion === 'update') {
        this.readOnlyIdArea = true;
      }
    };
  }

  async validarIntegridad(accion:string) {
    const prm:any = { ID_AREA: this.FAreas.ID_AREA };
    const apiRest = this.sData.getIntegridad('integridad referencial', prm);
    let res = await lastValueFrom(apiRest, {defaultValue: true});
    res = JSON.parse(res.data); 
    if(res[0].ErrMensaje !== '') {
      if(accion !== 'delete') {
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
                ", No se puede Eliminar el Área.",
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
    }
  }

  copiarSeccion() {
    this.mnuAccion = "new";
    this.readOnly = false;
    this.FAreas.ITEM = this.FAreas.ITEM + 1;
    this.opPrepararModificar('new');
    this.ValideExistencia({value: this.FAreas.ID_AREA})
  }

  // Valida Control de gestión
  validarRecursividad(operSeccion:any) {
    let child: any;

    // ** Validacion HIJAS **
    // Inactivar si hay inventario en las hijas
    this.listaToolTips[3].msg = 'Ya tiene Areas hijas marcadas con Asignación de costos';
    if (operSeccion === 'update') {
      this.arrSeccRes = []; 
      child = this.recurAreasGestionDown(this.DListaAreas.filter(s => s.ID_AREA_SUPERIOR === this.FAreas.ID_AREA));
      var exis = child.findIndex(i => i.INVENTARIO);
      this.activarInv = (exis >= 0);
      if (exis >= 0) this.listaToolTips[1].msg = this.listaToolTips[1].msg.replace('padres','hijas');
      this.listaToolTips[1].ver = (exis >= 0);

      // Inactivar si hay mano de obra en las hijas
      exis = child.findIndex(i => i.MANO_OBRA);
      this.activarMO = (exis >= 0);
      if (exis >= 0) this.listaToolTips[2].msg = this.listaToolTips[2].msg.replace('padres','hijas');
      this.listaToolTips[2].ver = (exis >= 0);

      // Inactivar si hay materiales en las hijas
      exis = child.findIndex(i => i.ASIGNABLE);
      this.activarCostos = (exis >= 0);
      if (exis >= 0) this.listaToolTips[3].msg = this.listaToolTips[3].msg.replace('padres','hijas');
      this.listaToolTips[3].ver = (exis >= 0);
    } 
    else {
      // Cuando está creando, activar control gestion x defecto
      this.activarInv = false;
      this.activarMO = false;
      this.activarCostos = false;  
    }

  }

  // Recursividad hacia abajo
  recurAreasGestionDown(arrSecc: any): MAreas[] {
    arrSecc.forEach(item => {
      // acc -> "acumulador" (array)
      // item -> item actual

      if (item.INVENTARIO || item.MANO_OBRA || item.ASIGNABLE) {
        // Si encuentra un hijo con manejo de inventario
        this.arrSeccRes.push(item);
      }

      // llamar recursivamente
      this.recurAreasGestionDown(this.DListaAreas.filter(s => s.ID_AREA_SUPERIOR === item.ITEM));

    });

    // Siempre retorna un vector
    return this.arrSeccRes;
  }

  // Recursividad hacia arriba
  recurAreasGestionUp(arrSecc: any): MAreas[] {
    arrSecc.forEach(item => {
      // acc -> "acumulador" (array)
      // item -> item actual

      if (item.INVENTARIO || item.MANO_OBRA || item.ASIGNABLE) {
        // Si encuentra un hijo con manejo de inventario
        this.arrSeccRes.push(item);
      }

      // llamar recursivamente
      this.recurAreasGestionUp(this.DListaAreas.filter(s => s.ITEM === item.ID_AREA_SUPERIOR));

    });

    // Siempre retorna un vector
    return this.arrSeccRes;
  }

  // Guarda modificaciones
  opPrepararGuardar(accion: string): void {

    // Acción validación de datos
    if (!this.ValidaDatos("requerido")) {
      return;
    }

    // Datos de la seccion a guardar
    if (this.FAreas.ID_AREA_SUPERIOR === undefined || this.FAreas.ID_AREA_SUPERIOR === null || this.FAreas.ID_AREA_SUPERIOR === '') {
      this.showModal('Debe seleccionar una area superior!');
      return;
    }
    if (Array.isArray(this.FAreas.ID_AREA_SUPERIOR))
      this.FAreas.ID_AREA_SUPERIOR = this.FAreas.ID_AREA_SUPERIOR[0];
    if (Array.isArray(this.FAreas.ID_CARGO))
      this.FAreas.ID_CARGO = this.FAreas.ID_CARGO[0];

    var prm:any = [];
    if (this.mnuAccion === 'new')
      prm = this.FAreas;
    if (this.mnuAccion === 'update')
      prm = {NEWDATA: this.FAreas, OLDDATA: this.FAreas_prev};

    // API guardado de datos
    this.sData.save(accion, prm).subscribe((data) => {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      if (res[0].ErrMensaje !== "") {
        this.showModal(res[0].ErrMensaje);
      } 
      else {

        if (this.mnuAccion === 'new') {
          this.VDatosReg = [this.FAreas];
          this.QFiltro = "ID_AREA='"+this.FAreas.ID_AREA+"'";
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: "",
            accion: "r_navegar",
            r_numReg: 1,
            r_totReg: 1,
            operacion: {}
          };
        } else {
          this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1] = JSON.parse(JSON.stringify(this.FAreas));
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: "",
            accion: "r_navegar",
            operacion: {}
          };
        }
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        showToast('Registro actualizado', 'success');

        // Actualiza el Item creado y añade nodo al árbol de Areas
        if (this.FAreas_prev.ID_AREA !== undefined) {
          const ix = this.DListaAreas.findIndex(s => s.ID_AREA === this.FAreas_prev.ID_AREA);
          if (ix !== -1)
            this.DListaAreas.splice(ix, 1);  
        }
        const darea:any = ({
          ID_UN: localStorage.getItem('empresa'),
          ID_AREA: this.FAreas.ID_AREA,
          ITEM: 1,
          DESCRIPCION: this.FAreas.DESCRIPCION,
          ID_AREA_SUPERIOR: this.FAreas.ID_AREA_SUPERIOR,
          ID_UN_ITEM: '',
          ESTADO: this.FAreas.ESTADO,
          TIPO: this.FAreas.TIPO,
          IsActive: true
        })
        this.valoresObjetos('areas');
        this.focusedSeccion = res[0].ITEM;
        this.treeAreas.refresh();
        this.mnuAccion = "";
        this.readOnly = true;
        this.readOnlyIdArea = true;
      }
    });

  }

  ValidaDatos(Accion: string): boolean {
    if (Accion === "requerido") {
      if (
        this.FAreas.ID_AREA === '' ||
        this.FAreas.DESCRIPCION === '' ||
        this.FAreas.ESTADO === ''
      ) {
        this.showModal('Error al guardar',"Faltan datos","Hay datos incompletos. Llena todos los items!");
        return false;
      }
    }
    return true;
  }

  opPrepararBuscar(accion: any): void {
    if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Areas",
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
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
      const prm = { Areas: arrFiltro };

      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this.sData
        .consulta('consulta', prm,this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje === '') {
            this.VDatosReg = datares;
  
            // Asocia datos
            this.FAreas = datares[0];
            this.QFiltro = datares[0].QFILTRO;

          } else {
            this.VDatosReg = [];
            this.opBlanquearForma();
            //notificació
            showToast(datares[0].ErrMensaje, 'error');
          }

          // Prepara la barra para navegación
          this.prmUsrAplBarReg = {...this.prmUsrAplBarReg,
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
      this.readOnlyIdArea = true;

      this.buscarFiltro = true;

    // this.readOnly = false;
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        if ( this.VDatosReg.length != 0 ) {
          this.FAreas = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this.prmUsrAplBarReg.r_numReg = 1;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.readOnly = true;
          this.readOnlyIdArea = true;
          showToast('No se encontraron Datos', 'error');
        }
        break;

      case "r_ID_AREA_SUPERIOR":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.FAreas = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
        this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
          ? this.VDatosReg.length
          : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.FAreas = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.FAreas = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
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
          this.FAreas = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

        } 
        else {
          this.opBlanquearForma();
          setTimeout(() => {  
            this.form.instance.resetValues();  
          }, 100);  
        }
        this.readOnly = true;
        this.readOnlyIdArea = true;
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          this.FAreas =
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        } else {
          this.opBlanquearForma();
        }
        break;

      default:
        break;
    }

    // Datos asociados al área
    this.focusedRowKey = Number(this.FAreas.ID_AREA_SUPERIOR);
    this.seleccSeccAnt = [ this.FAreas.ID_AREA_SUPERIOR ];
    this.DESCRIPCION = this.FAreas.DESCRIPCION;
    this.NOMBRE_AREA_PADRE = this.DListaAreas.find((d:any) => d.ID_AREA === this.FAreas.ID_AREA_SUPERIOR)?.DESCRIPCION;
    //asocia cargo y responsable
    this.seleccSeccCargo = [ this.FAreas.ID_CARGO ];
    const ix = this.LCargos.findIndex((d:any) => d.ID_CARGO === this.FAreas.ID_CARGO);
    if ( ix !== -1 ) {
      this.NOMBRE_CARGO = this.LCargos[ix].NOMBRE;
      this.RESPONSABLE = this.LCargos[ix].RESPONSABLES;
    } else {
      this.NOMBRE_CARGO = '';
      this.RESPONSABLE = [];
    }
    // Trae los empledos asociados a una sección
    // this.areasAsociadas(this.FAreas.ID_AREA);

    // Otras funciones
    this.objReadOnly.Tipo = false;
    this.verToolTip = false;  

  }

  onExpanding(e:any) {
    if (this.expandAreas) {
      this.autoExpandAll = true;
      this.btnContraer = 'Contraer';
      this.expandAreas = !this.expandAreas;
      return;
    }
    if (!this.expandAreas) {
      this.autoExpandAll = false;
      this.btnContraer = 'Expandir';
      this.expandAreas = !this.expandAreas;
      const newArray:any = this.DListaAreas.filter((d:any) => d.ID_AREA_SUPERIOR === "RAIZ");
      newArray.forEach((ele:any) => {
        const newData:any = this.DListaAreas.filter((d:any) => d.ID_AREA_SUPERIOR === ele.ID_AREA);
        newArray.forEach((el:any) => {
          this.treeListAreas.instance.collapseRow(el.ID_AREA);
        });
      });
      return;
    }
	};

  async opEliminar() {
    await this.validarIntegridad('delete');
    if(this.integridadReferencial) {
      Swal.fire({
        title: '',
        text: '',
        html: '<b style="color: red;">¡ADVERTENCIA!</b><br/>'+
              '¿Eliminar el Área '+this.FAreas.ID_AREA+' - '+this.FAreas.DESCRIPCION+'?<br/>'+
              'Esta área tiene empleados asociados por lo que se perderá esta información ¿desea continuar?',
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
    const prm = { OPERACION: 'delete', 
                  ID_AREA: this.FAreas.ID_AREA, 
                  DATOS_AREAS: this.FAreas, 
                  ID_AREA_ANT: '' };
    this.sData
			.delete('delete', prm)
      .pipe(takeUntil(this._unsubscribeAll))
			.subscribe({ 
        next: (data) => {
          try {
            const res = JSON.parse(data.data);
            if ( (data.token != undefined) ){
              const refreshToken = data.token;
              localStorage.setItem("token", refreshToken);
            }
            if (res[0].ErrMensaje !== '') {
              // alert de error
              this.showModal(res[0].ErrMensaje);        
            }
            else {  
              this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, 
                error: '',
                accion: '',
                operacion: { r_modificar: false, r_eliminar: false} }
              this.readOnly = true;
              this.readOnlyIdArea = true;
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
  
              // Elimina de datos
              const isecc = this.DListaAreas.findIndex(s => s.ITEM === this.FAreas.ITEM);
              this.DListaAreas.splice(isecc, 1);
              this.mnuAccion = "";
              this.opBlanquearForma();
              this.treeAreas.refresh();
  
              showToast('Sección eliminada', 'success');
              }
          } catch (error) {
            this.showModal('Error respuesta eliminar sección: '+error+' Rta:'+data.data);
          }
        },
        error: (err => {
          this.showModal('Error al eliminar sección: '+err.message);
        })
      });
  }
  // Vista/Zoom de los datos consultados
  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: "Areas",
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: '',
      Filtro: '',
      keyGrid: ['ID_AREA']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  dragEnd(unit: any, sizes: any): any {
    // const ed = this.diagLay.instance.element();
    // ed.style.width = sizes[1];
  }
  onToolbarPreparing(e: any) {}
  
  onRowClickSeccion(e: any) {
    const rowd = { row: { data: e.data } };
    this.selectArea(rowd);
  }

  selectArea(e: any) {
    if (e.row === undefined) return;

    if (this.readOnly){
      // No permite navegar si está en modo edición
      if (this.mnuAccion.match('new|update') && e.row.data.ID_AREA !== this.FAreas.ID_AREA)  {
        this.showModal('','','<head>'+
                      '<style>'+
                      'tr:nth-child(even) {background: #e4f3fa}'+
                      'tr:nth-child(odd) {background: #e4f3fa}'+
                      '</style>'+
                      '</head><table style="text-align: left; width: 100%; border: 1px dotted gray;">'+
                      '<tr><td>Se encuentra en modo edición (creando o modificando) del área '+
                      this.FAreas.ID_AREA+'.</td></tr><tr><td> '+
                      'Finalice la operación de edición para permitir navegar.</td></tr></table>');
        return;
      }
      // Traer datos del array principal ya consultado en el arbol
      const area = JSON.parse(JSON.stringify(this.DListaAreas.find((s:any) => s.ID_AREA == e.row.data.ID_AREA)));
      if (area !== undefined && area !== null) {

        // Datos del registro de navegación
        this.FAreas = JSON.parse(JSON.stringify(area));
        this.VDatosReg = [ JSON.parse(JSON.stringify(this.FAreas)) ];
        this.QFiltro = "ID_AREA = '" + this.FAreas.ID_AREA + "'";

        this.focusedRowKey = area.ID_AREA_SUPERIOR;
        this.seleccSeccAnt = [ area.ID_AREA_SUPERIOR ];
        this.seleccSeccCargo = [ area.ID_CARGO ];
        this.DESCRIPCION = area.DESCRIPCION;
        this.NOMBRE_AREA_PADRE = this.DListaAreas.find((d:any) => d.ID_AREA === area.ID_AREA_SUPERIOR)?.DESCRIPCION;
        const ix = this.LCargos.findIndex((d:any) => d.ID_CARGO === area.ID_CARGO);
        if ( ix !== -1 ) {
          this.NOMBRE_CARGO = this.LCargos[ix].NOMBRE;
          // this.RESPONSABLE = this.LCargos[ix].RESPONSABLE+' '+this.LCargos[ix].NOMBRE;
          // this.RESPONSABLE = "";
          // for (var k=0; k < this.LCargos[ix].RESPONSABLES.length; k++) {
            // this.RESPONSABLE += (this.RESPONSABLE !== '' ? ', ' : '') + 
            //                     this.LCargos[ix].RESPONSABLES[k].ID_RESPONSABLE+'-'+this.LCargos[ix].RESPONSABLES[k].NOMBRE;
          // }
          this.RESPONSABLE = this.LCargos[ix].RESPONSABLES;
  
        } else {
          this.NOMBRE_CARGO = '';
          this.RESPONSABLE = [];
        }

        // Trae los empledos asociados a una sección
        // this.areasAsociadas(e.row.data.ID_AREA);

        this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, 
                                 r_totReg: 1,
                                 r_numReg: 1,
                                 accion: 'r_navegar',
                                 operacion: { r_modificar: true, r_eliminar: true }
                               };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

      }
    } else {
      showToast('No se puede seleccionar otra área si esta en modo edición', 'warning');
    }

  }

  // Consulta los datos de empleado por seccion
  areasAsociadas(seccion: any) {
    this.sData
      .consulta('Areas_empleados', { ID_AREA: seccion }, this.prmUsrAplBarReg.aplicacion)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if(res[0].ErrMensaje === '') {
          this.DAreasAsociadas = res;
        } else {
          this.DAreasAsociadas = [];
          showToast(res[0].ErrMensaje, 'error');
        }
      });
  }

  onFocusedRowChanging(e:any) {
    const rowsCount = e.component.getVisibleRows().length;
    const pageCount = e.component.pageCount();
    const pageIndex = e.component.pageIndex();
    const key = e.event && e.event.key;
​
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

  /*onSeleccRowSeccionAnt(e){
    if( this.seleccSeccAnt.length > 0 ) {
      this.FAreas.ID_AREA_SUPERIOR = this.seleccSeccAnt[0];
      this.NOMBRE_AREA_PADRE = e.data.DESCRIPCION;
    }
    this.isGridBoxOpened = false;

    // Activa/Inactiva control de gestión
    this.validarRecursividad(this.mnuAccion);

  }*/
  onSeleccRowSeccionAnt(e:any) {
    if( this.seleccSeccAnt.length > 0 ) {
      this.FAreas.ID_AREA_SUPERIOR = this.seleccSeccAnt[0];
      const child = this.DListaAreas.filter(s => s.ID_AREA === this.FAreas.ID_AREA_SUPERIOR);
      if (child !== undefined && child.length !== 0) {
        this.NOMBRE_AREA_PADRE = child[0].DESCRIPCION;
      }
      this.isGridBoxOpened = false;
    }
  }
  async onSeleccRowSeccionCargo(e:any, dataArea:any) {
    this.isGridBoxOpenedCargo = false;
    const apro:any = await this.ValideCargo({value: e.selectedRowKeys[0]});
    if (!apro) {
      this.FAreas.ID_CARGO = '';
      this.NOMBRE_CARGO = '';
      this.RESPONSABLE = [];
      this.seleccSeccCargo = [];
      return;
    };
    if( this.seleccSeccCargo.length > 0 ) {
      this.FAreas.ID_CARGO = this.seleccSeccCargo[0];
      const child = this.LCargos.filter(s => s.ID_CARGO === this.FAreas.ID_CARGO);
      if (child !== undefined && child.length !== 0) {
        this.NOMBRE_CARGO = child[0].NOMBRE;
        // this.RESPONSABLE = child[0].RESPONSABLE+' '+child[0].NOMBRE;
        this.RESPONSABLE = [];
        if (child[0].RESPONSABLES.length > 0) {
          for (var k=0; k < child[0].RESPONSABLES.length; k++) {
            this.RESPONSABLE.push({ ID_RESPONSABLE: child[0].RESPONSABLES[k].ID_RESPONSABLE,
                                    NOMBRE: child[0].RESPONSABLES[k].NOMBRE
                                 });
          }
        } else {
          this.RESPONSABLE = [];
        }
      }
    }
  }

  // Valide unicidad de la llave
  async ValideCargo(e: any) {
    let aprob:boolean = false;
    if (  (this.mnuAccion === undefined) ||
          (this.readOnly || !this.mnuAccion.match('new|update')) ||
          (this.mnuAccion === 'update' && this.FAreas_prev.ID_AREA === e.value)
    ) {
      aprob = true;
    }
    // Valida la existencia de la llave respectiva
    if (!aprob) {
      const prm = { ID_CARGO: e.value };
      const apiRest = this.sData.validellave('INTEGRIDAD CARGO', prm, this.prmUsrAplBarReg.aplicacion);
      let res = await lastValueFrom(apiRest, {defaultValue: true});
      res = JSON.parse(res.data);
      if (res[0].ErrMensaje === '') {
        this.conCambios++;
        aprob = true;
      } else {
        this.showModal(res[0].ErrMensaje, '¡IMPORTANTE!');
        aprob = false;
      }
    }

    return aprob;
  }

  onValueChangedCargo(e:any) {
    if (e.value === undefined || e.value === null || e.value === '') {
      this.FAreas.ID_CARGO = '';
      this.NOMBRE_CARGO = '';
      this.RESPONSABLE = [];
      this.seleccSeccCargo = [];
    }
  }

  onValueChangedIdArea(e:any) {
    if (e.value !== '') {
      if (this.mnuAccion === 'new') {
        this.ValideExistencia(e);
      }
      // Valida si tiene hijas, bloquear campo Tipo (no puede ser OPERATIVA)
      if (this.mnuAccion === 'update' && this.FAreas_prev.ID_AREA !== e.value) {
        if (this.DListaAreas.findIndex(s => s.ID_AREA_SUPERIOR === this.FAreas.ID_AREA) !== -1 && this.readOnlyIdArea) {
          showToast('Esta Area tiene áreas hija, no puede modificarse su código', 'warning');
        }
      }
    };
  }

  // Valide unicidad de la llave
  async ValideExistencia(e: any) {
    let aprob:boolean = false;
    if (  (this.mnuAccion === undefined) ||
          (this.readOnly || !this.mnuAccion.match('new|update')) ||
          (this.mnuAccion === 'update' && this.FAreas_prev.ID_AREA === e.value)
    ) {
      aprob = true;
    }
    // Valida la existencia de la llave respectiva
    if (!aprob) {
      const prm = { ID_AREA: e.value };
      const apiRest = this.sData.validellave('EXISTE AREA', prm, this.prmUsrAplBarReg.aplicacion);
      let res = await lastValueFrom(apiRest, {defaultValue: true});
      res = JSON.parse(res.data);
      if (res[0].ErrMensaje === '') {
        this.conCambios++;
        aprob = true;
      } else {
        this.showModal(res[0].ErrMensaje, '¡IMPORTANTE!');
        aprob = false;
      }
    }

    return aprob;
  }

  // Valida si hubo cambio en la seccion 
  onValidarSeccion(e: any) {
    // if (!this.ValideExistencia(this.FAreas.ID_AREA)) return;

    // Valida si tiene hijos y confirma
    if (this.FAreas.ID_AREA !== this.FAreas_prev.ID_AREA) {
      const child = this.DListaAreas.filter(s => s.ID_AREA_SUPERIOR === this.FAreas.ID_AREA);
      if (child !== undefined && child.length !== 0) {
        Swal.fire({
          title: '',
          text: 'Esta sección tiene Areas hijas. ¿Desea reasignar el código para dichas Areas?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
					confirmButtonColor: '#DF3E3E',
					cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, reasignar'
        }).then((result) => {
          if (!result.isConfirmed) {
            this.FAreas.ID_AREA = this.FAreas_prev.ID_AREA;
          }
        });

      }
    }
  }

  // Cambio de Tipo
  onChangedTipo(e:any) {
    if (this.valorBaseCosto === e.value) {
      this.visibleSwitch = true;
    } else {
      this.visibleSwitch = false;
    }
    this.conCambios++;
  }

  // Cambio de valor en el inventario
  onChangedInv(e:any) {
  }

  // Acciones sobre cambio en Mano de Obra
  async switchManoObra(e:any) {

    if (e.event === undefined) return;

    const prm = { ID_AREA: this.FAreas.ID_AREA };
    const apiRest = this.sData.validellave('cambios mano de obra',prm,'PRO008');
    let res = await lastValueFrom(apiRest, {defaultValue: true});
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
    elements.forEach((el, index)  => {  
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

  // Imprimir reporte de aplicación
  imprimirReporte(id_reporte:any, archivo:any, datosrpt:any, tipo:any) {
		
		let filtroRep = { FILTRO: this.QFiltro };
    const prmLiq = {  clid: localStorage.getItem('empresa'), 
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
    this.tabService.addTab( new Tab(VisorrepComponent,    // visor
                                    datosrpt.text,        // título
                                    { parent: "PrincipalComponent", args: prmLiq }, // parámetro: reporte,filtro
                                    id_reporte,           // código del reporte
                                    '',
                                    'reporte',
                                    true
                          ));

	}

  // Heredar objeto Areas
  onInitialized(e: any) {
    this.treeAreas = e.component;
  }

  ngOnInit(): void {
    const user:any = localStorage.getItem("usuario");
    this.prmUsrAplBarReg = {
      tabla: "Areas",
      aplicacion: "GES-005",
      usuario: user,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: {}
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';

    this.FAreas = { ID_UN:'', ID_AREA:'', ITEM:99, DESCRIPCION:'', ID_AREA_SUPERIOR:'', 
                    ID_UN_ITEM:'', ESTADO:'', IsActive:false, TIPO:'', ID_CARGO: '', RESPONSABLE: '' };
    this.DTipoArea = ['PROCESO','OPERATIVA'];

    this.valoresObjetos('todos');
    window.addEventListener('scroll', this.onScroll, true);

    // Msensajes de apoyo
    this.listaToolTips = [];
    this.listaToolTips.push({ id: 2, msg: 'Solo se permiten asociar Areas tipo Proceso.', ver: true});
    this.listaToolTips.push({ id: 7, msg: 'Ya tiene Areas hijas marcadas con Inventario.', ver: false});
    this.listaToolTips.push({ id: 8, msg: 'Ya tiene Areas hijas marcadas con Mano de Obra.', ver: false});
    this.listaToolTips.push({ id: 9, msg: 'Ya tiene Areas hijas marcadas con Asignación de costos.', ver: false});
    this.listaToolTips.push({ id: 4, msg: 'Esta sección ya tiene Areas hijas. Solo puede ser Tipo PROCESO.', ver: false});

  }

  ngAfterViewInit(): void {
    // Puesta a punto
    this.prmUsrAplBarReg = {
      ...this.prmUsrAplBarReg,
      accion: '',
      operacion: {}
    };
    this.readOnly = true;
    this.readOnlyIdArea = true;

  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string){
    if (obj === 'areas' || obj === 'todos') {
      // Carga las Areas registradas
      this.sData
      .getAreas({ FILTRO: "" })
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }        
        for (let i = 0; i < res.length; i++) {
          res[i].COD = i;
        }

        // Asocia datos de arbol y de areas padre
        this.DListaAreas = res;
        this.LDatosAreas = res;
        this.LDatosAreas.push({ ID_AREA: 'RAIZ', DESCRIPCION: 'Area raiz', ID_UN: '',
                                ITEM: 0,
                                ID_AREA_SUPERIOR: '',
                                ID_UN_ITEM: '',
                                ESTADO: '',
                                TIPO: '',
                                IsActive: false });
          
      });
    };

    if (obj === 'cargos' || obj === 'todos') {
      // Carga las Areas registradas
      const prm:any = {ESTADO: 'ACTIVO'};
      this.sData_cargos
      .consulta('cargos', prm)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }        
        for (let i = 0; i < res.length; i++) {
          res[i].COD = i;
        }
        // Asocia datos de arbol y de areas padre
        this.LCargos = res;
          
      });
    };

  }

  getSizeQualifier(width:any) {
    if (width < 768)  return "xs";
    if (width < 992)  return "sm";
    if (width < 1366) return "md";
    return "lg";
  }

  onResized(event: any) {
    const width:number = event.newRect.width;
    const height:number = event.newRect.height;
    const constainer_expandir:any = document.getElementById('constainer-expandir');
    this.widthSerchTreeList = width - 130;
    // if(constainer_expandir !== undefined && constainer_expandir!== null) {
    //   if(width < 330) {
    //     this.widthSerchTreeList = width;
    //     constainer_expandir.style.width = '100%';
    //     constainer_expandir.style.position = 'relative';
    //     constainer_expandir.style.padding = '5px';
    //   } else {
    //     constainer_expandir.style.width = '110px';
    //     constainer_expandir.style.position = 'absolute';
    //     constainer_expandir.style.padding = '0 5px';
    //   };
    // }
  }

  ngOnDestroy() {
    this._unsubscribeAll.next('');
    this._unsubscribeAll.complete();
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
  }

  showModal(mensaje:any, titulo:any='¡Error!', msg_html:any= '') {
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
    if (!e.ctrlKey) return;
    if (e.srcElement.id !== undefined && e.srcElement.id !== '') {
      this.targetMenuFloat = '#'+e.srcElement.id;
      this.dataMenuFloat = { aplicacion: this.prmUsrAplBarReg.aplicacion, objeto: e.srcElement.name??e.srcElement.id };
      this.activaMenuFloat = true;
    }
    else {
      if (e.srcElement.name !== undefined && e.srcElement.name !== '') {
        this.targetMenuFloat = '#xs__'+e.srcElement.name;  //e.srcElement.name;
        this.dataMenuFloat = { titulo: 'Accesos a '+e.srcElement.name, aplicacion: 'Areas' };
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
