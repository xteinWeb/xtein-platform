import { Component, HostListener, OnInit, ViewChild, ChangeDetectorRef  } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxComponent, DxDropDownBoxModule, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxRadioGroupModule, DxTemplateHost, DxTextBoxModule, DxTreeListModule } from 'devextreme-angular';
import { elementAt, lastValueFrom, Subject, Subscription, switchAll, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { PRO019Service } from 'src/app/services/PRO019/PRO019.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import Swal from 'sweetalert2';
import notify from 'devextreme/ui/notify';
import { SvisorRutasService } from 'src/app/shared/visor-img/_svisor-img.service';
import { CommonModule } from '@angular/common';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { MenufloatComponent } from 'src/app/shared/menufloat/menufloat.component';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { ListaOpcionesComponent } from 'src/app/shared/lista-opciones/lista-opciones.component';
import { VisorImgComponent } from 'src/app/shared/visor-img/visor-img.component';
import { AngularResizeEventModule } from 'angular-resize-event';
import { showToast } from '../../shared/toast/toastComponent.js';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { PRO01901Component } from '../PRO019UP/PRO01901/PRO01901.component';
import { PRO01904Component } from '../PRO019UP/PRO01904/PRO01904.component';
import { PRO01905Component } from '../PRO019UP/PRO01905/PRO01905.component';
import { COSTOSDIRECTOSComponent } from '../PRO019UP/COSTOS-DIRECTOS/COSTOS-DIRECTOS.component';
import { MMatriz } from '../PRO019UP/clsPRO019.class';
import { PRO019DataService } from '../PRO019UP/SERVICE/pro019.service';

@Component({
  selector: 'app-PRO019',
  templateUrl: './PRO019.component.html',
  styleUrls: ['./PRO019.component.css'],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxDataGridModule, DxDropDownBoxModule, DxTextBoxModule,
            DxNumberBoxModule, DxButtonModule, DxTreeListModule, DxRadioGroupModule, CdkAccordionModule,
            MenufloatComponent, VistarapidaComponent, ListaOpcionesComponent, VisorImgComponent,
            PRO01901Component, PRO01904Component, PRO01905Component,
            COSTOSDIRECTOSComponent, AngularResizeEventModule, DxLoadPanelModule
          ],
  providers: [AngularResizeEventModule, DxTemplateHost],
  animations: [
    trigger('accordionAnimation', [
      state('expanded', style({ height: '*' })),
      state('collapsed', style({ height: '0', overflow: 'hidden' })),
      transition('expanded <=> collapsed', animate('.5s ease-in-out'))
    ])
  ]
})
export class PRO019Component implements OnInit {

  @ViewChild("dropRuta", { static: false }) dropRuta: DxDropDownBoxComponent;
  @ViewChild("dropSelectProducto", { static: false }) dropSelectProducto: DxDropDownBoxComponent;
  @ViewChild("FMProductos", { static: false }) FMProductos: DxDataGridComponent;

  subscription: Subscription;
  subscriptionConCambios: Subscription;
  subscriptionRefresh: Subscription;
  subscriptionRefrescarTotales: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  subs_filtro: Subscription;
  subs_visor: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  colCountByScreen: object;

	FMatriz: MMatriz;
  DGProductos: any = [];
  DGAtributosSimple: any = [];
  DGAtributosCompuesto: any = [];
  DRutasProductos: any = [];
  DPartes: any = [];
  DCIF: any = [];
  DataGridSeccion: any = [];
  modoGrid: any = [];
  getDataTotales: any = [];
  totalesCIF: any;
  modoGridValue: string;
  dataTotales: any;
  mnuAccion: string;
	readOnly: boolean;
	readOnlyMargen: boolean;
  readOnlyRutasProductos: boolean;
  loadingVisible: boolean = false;
	esVisibleSelecc: string = 'none';
  TOTAL_MATERIALES: number = 0;
  SUBTOTAL_MA: number = 0;
  PROTECCION_MA: number = 0;
  TOTAL_GRAVADOS: number = 0;
  TOTAL_SIN_IVA: number = 0;
  TOTAL_MANO_OBRA: number = 0;
  SUBTOTAL_MO: number = 0;
  PROTECCION_MO: number = 0;
  TOTAL_COSTO_DIRECTO: number = 0;
  TOTAL_CIF: number = 0;
  TOTAL_CIF_FIJO: number = 0;
  TOTAL_CIF_VARIABLE: number = 0;
  TOTAL_COSTO: number = 0;
  TOTAL_UTILIDAD: number = 0;
  PRECIO_BASE: number = 0;
  CON_OPERATIVA: number = 0;
  TOTAL_AJUSTE_PRECIO: number = 0;
  TOTAL_PAG: number = 0;
  TOTAL_GRAVAMENES: number = 0;
  TOTAL_PDG: number = 0;
  TOTAL_MATRIZ: number = 0;
  totalSeccionesMateriales: number = 0;
  totalSeccionesManoObra: number = 0;
  TOTAL_FACTOR_MOD: number = 0;
	data_prev: any = '';
  VDatosReg: any;
  QFiltro: any;
  accordionExpand: any;
	openProductos: boolean = false;
	openRutas: boolean = false;
  visiblePartes: boolean = false;
  activeItems: boolean = false;
  clase: number;
  MATERIALES_PRODUCTO: any = [];
  MO_PRODUCTO: any = [];
  CIF_PRODUCTO: any = [];
  VACIO: any = '';
  TipoCIF: any = [
    {ITEM: 1, TIPO: 'CIF FIJO', DESC: 'Fijo', TOTAL: 0},
    {ITEM: 2, TIPO: 'CIF VARIABLE', DESC: 'Variable', TOTAL: 0}
  ];
  
  //Variables de configuracion
  visibleListaConfig: boolean = false;
  visibleListaOpc: boolean = false;
  listaConfigData: any [] = [];
  listaOpciones: any[] = [];

  activaMenuFloat: boolean;
  targetMenuFloat: string = '';
  dataMenuFloat: any;
  eventsSubject: Subject<void> = new Subject<void>();

  //notificaciones.
	// conCambios: number = 0;
	FMProductoSeleccionado: number = 0;
  widthSerchProductos:any = 200;
  widthSerchTreeList:any = 200;
  widthSerchRutas:any = 200;
  widthSerchAtributos:any = 200;
  dropDownRutas:any = {width:440, height:350, hideOnParentScroll: true, container:'#router-container'};
  dropDownProductos: any = {width:500, height:350, hideOnParentScroll: true, container:'#formMatriz'};

  items:any = [];
  expandedIndex = 0;
  
  selectProducto: any[] = [];
  selectRutasProductos: any[] = [];

  constructor(
		private sData: PRO019Service,
    private _sdatos: PRO019DataService,
		private _sbarreg: SbarraService,
    private SVisor: SvisorService,
    private tabService: TabService,
    private _sfiltro: SfiltroService,
    private _service: SvisorRutasService,
    private _sgenerales: GeneralesService,
    private cdr: ChangeDetectorRef
  ) {
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
      const nx = this.VDatosReg.findIndex(d => d.PRODUCTO === resp.PRODUCTO);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx+1;
        this.opIrARegistro('r_numreg');
      }
    })

    this.subscriptionRefrescarTotales = this._sdatos
      .getTotales()
      .subscribe((datprm) => {
        if (datprm.GRUPO === 'PRINCIPAL' && datprm.ACCION === 'CARGAR') {
          this.TOTAL_COSTO =  datprm.TOTAL_COSTO;
          this._sdatos.TOTAL_COSTO = this.TOTAL_COSTO;
        }
      }
    );

    this.colCountByScreen = {
      xs: 1,
      sm: 2,
      md: 2,
      lg: 2,
    };

    this.onValueChangedRuta = this.onValueChangedRuta.bind(this);
    this.getTotalCostoDirecto = this.getTotalCostoDirecto.bind(this);
    this.onSelectionRuta = this.onSelectionRuta.bind(this);
    this.getTotalTCD = this.getTotalTCD.bind(this);
    this.getTotalCIF = this.getTotalCIF.bind(this);
    this.ValideExistencia = this.ValideExistencia.bind(this);
    this.onValueChangedModo = this.onValueChangedModo.bind(this);
    this.saveCopyData = this.saveCopyData.bind(this);
    this.refreshComponent = this.refreshComponent.bind(this);
    this.getMatrizSimple = this.getMatrizSimple.bind(this);
    this.loadDataGrids = this.loadDataGrids.bind(this);
  }

  ngOnInit(): void {
    const user:any = localStorage.getItem('usuario');
		this.prmUsrAplBarReg = {
			tabla: 'MATRIZ',
			aplicacion: 'PRO-019',
			usuario: user,
			accion: 'r_ini',
			error: '',
			r_numReg: 0,
			r_totReg: 0,
			operacion: { r_modificar: true }
		};
    this.clase = 1;
		this.FMatriz = { PRODUCTO:'', NOMBRE:'', ESTADO:'', CLASE:'', ETAPA:'', MARGEN_RENTABILIDAD:0, PORCENTAJE:0, BASES_COSTOS:'', PERFIL_TRIBUTARIO:'', RUTAS:''};
		this.readOnly = true;
		this.readOnlyMargen = true;
    this.readOnlyRutasProductos = true;
    this._sdatos.readonly = this.readOnly;
    this._sdatos.accion = 'r_ini';
		this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.valoresObjetos('productos', '');
    this.items = ['COSTOS DIRECTOS', 'COSTOS INDIRECTOS', 'TOTAL COSTOS'];
    this.accordionExpand = [true,true,true];
    window.addEventListener('scroll', this.onScroll, true);

  }

  ngOnDestroy() {
		this.opBlanquearForma();
    this.subscription.unsubscribe();
		this.subs_filtro.unsubscribe();
		this.subs_visor.unsubscribe();
    this.subscriptionRefrescarTotales.unsubscribe();
  }

  onResized(event: any, parametro:any) {
    var width:number = 0;
    switch (parametro) {
      case 'producto':
        width = this.dropDownProductos.width;
        this.widthSerchProductos = width - 60;
        break;
      case 'atributos':
        width = event.newRect.width;
        this.widthSerchAtributos = width - 130;
        break;
      case 'rutas':
        width = this.dropDownRutas.width;
        this.widthSerchRutas = width - 40;
        break;
    
      default:
        break;
    }
  }

  // Llama a Acciones de registro
	opMenuRegistro(operMenu: clsBarraRegistro): void {
		switch (operMenu.accion) {
			case "r_ini":
				const user:any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'MATRIZ',
          aplicacion: 'PRO-019',
          usuario: user,
					accion: "r_ini",
					error: "",
					r_numReg: 0,
					r_totReg: 0,
					operacion: {}
				};
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

			case 'r_nuevo':
				this.mnuAccion = "new";
        this.readOnly = false;
        this._sdatos.accion = 'nuevo';
				this.opPrepararNuevo();
				break;

			case 'r_modificar':
				this.mnuAccion = "update";
        this._sdatos.accion = 'modificar';
				this.opPrepararModificar();
				break;

			case 'r_guardar':
        this.opPrepararGuardar(this.mnuAccion);
				break;

			case 'r_buscar':
        this._sdatos.accion = 'consultar';
				if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
				if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
				break;

			case 'r_buscar_ejec':
        this._sdatos.accion = 'consultar';
				if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('');
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
        const tipo = 'Error';
				if (this._sdatos.conCambios != 0) mensaje = 'Desea cancelar sin guardar cambios?';
				Swal.fire({
					title: '',
					text: mensaje,
					iconHtml: "<i class='icon-alert-ol'></i>",
					showCancelButton: true,
          confirmButtonColor: tipo==='Error' ? '#DF3E3E !important':'#0F4C81 !important',
					cancelButtonColor: '#438ef1',
					cancelButtonText: 'No',
					confirmButtonText: 'Sí, cancelar'
					}).then((result) => {
					if (result.isConfirmed) {
            this._sdatos.accion = '';
            this.esVisibleSelecc = 'none';
            this.visiblePartes = false;
            this.activeItems = false;
						this.readOnly = true;
            this.readOnlyMargen = true;
            this.readOnlyRutasProductos = true;
						this._sdatos.conCambios = 0;
						// Restituye los valores
            if ( (this.data_prev.FMATRIZ.PRODUCTO === '') ) {
              this.opBlanquearForma();
            } else {
              this.FMatriz = JSON.parse(JSON.stringify(this.data_prev.FMATRIZ));
              
              this.selectProducto = [this.FMatriz.PRODUCTO];
              this.selectRutasProductos = [this.FMatriz.RUTAS];
              if (this.FMatriz.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
                // this.items = ['PRODUCTOS / PARTES', 'COSTOS DIRECTOS', 'COSTOS INDIRECTOS', 'TOTAL COSTOS'];
                this.items = ['COSTOS DIRECTOS', 'COSTOS INDIRECTOS', 'TOTAL COSTOS'];
                this.clase = 2;
              } else if (this.FMatriz.CLASE.match('Producto simple|Parte simple')) {
                this.items = ['COSTOS DIRECTOS', 'COSTOS INDIRECTOS', 'TOTAL COSTOS'];
                this.clase = 1;
              }
  
              this._sdatos.DGSECCIONES_MATERIALES = JSON.parse(JSON.stringify(this.data_prev.SECCIONES_MATERIALES));
              this._sdatos.MATRIZ_DETALLE_MATERIALES = JSON.parse(JSON.stringify(this.data_prev.MATERIALES));
              this._sdatos.DGSECCIONES_MANO_OBRA = JSON.parse(JSON.stringify(this.data_prev.SECCIONES_MANO_OBRA));
              this._sdatos.MATRIZ_DETALLE_MANO_OBRA = JSON.parse(JSON.stringify(this.data_prev.MANO_OBRA));
              this._sdatos.MATRIZ_CIF = JSON.parse(JSON.stringify(this.data_prev.TIPOS_CIF));
              this._sdatos.MATRIZ_DETALLE_CIF = JSON.parse(JSON.stringify(this.data_prev.CIF));
              // this.DCIF = JSON.parse(JSON.stringify(this.data_prev.CIF));

              this.SUBTOTAL_MA = this.data_prev.SUBTOTAL_MA;
              this.PROTECCION_MA = this.data_prev.PROTECCION_MA;
              this.TOTAL_MATERIALES = this.data_prev.TOTAL_MATERIALES;
              this.TOTAL_GRAVADOS = this.data_prev.TOTAL_GRAVADOS;
              this.TOTAL_SIN_IVA = this.data_prev.TOTAL_SIN_IVA;
              this.SUBTOTAL_MO = this.data_prev.SUBTOTAL_MO;
              this.PROTECCION_MO = this.data_prev.PROTECCION_MO;
              this.TOTAL_MANO_OBRA = this.data_prev.TOTAL_MO;
              this.TOTAL_COSTO_DIRECTO = this.data_prev.TOTAL_COSTO_DIRECTO;
              this.TOTAL_CIF = this.data_prev.TOTAL_CIF;
              this.TOTAL_CIF_VARIABLE = this.data_prev.TOTAL_CIF_VARIABLE;
              this.TOTAL_CIF_FIJO = this.data_prev.TOTAL_CIF_FIJO;
              this.TOTAL_COSTO = this.data_prev.TOTAL_COSTO;
              this.TOTAL_UTILIDAD = this.data_prev.UTILIDAD;
              this.PRECIO_BASE = this.data_prev.PRECIO_BASE;
              this.CON_OPERATIVA = this.data_prev.CON_OPERATIVA;
              this.TOTAL_PAG = this.data_prev.PRECIO_ANTES_GRAV;
              this.TOTAL_GRAVAMENES = this.data_prev.GRAVAMENES;
              this.TOTAL_PDG = this.data_prev.PRECIO_DESP_GRAV;
              this.TOTAL_AJUSTE_PRECIO = this.data_prev.AJUSTE_PRECIO;
              this.TOTAL_MATRIZ = this.data_prev.TOTAL;

              this._sdatos.SUBTOTAL_MA = this.SUBTOTAL_MA;
              this._sdatos.PROTECCION_MA = this.PROTECCION_MA;
              this._sdatos.TOTAL_MATERIALES = this.TOTAL_MATERIALES;
              this._sdatos.TOTAL_GRAVADOS = this.TOTAL_GRAVADOS;
              this._sdatos.TOTAL_SIN_IVA = this.TOTAL_SIN_IVA;
              this._sdatos.SUBTOTAL_MO = this.SUBTOTAL_MO;
              this._sdatos.PROTECCION_MO = this.PROTECCION_MO;
              this._sdatos.TOTAL_MANO_OBRA = this.TOTAL_MANO_OBRA;
              this._sdatos.TOTAL_COSTO_DIRECTO = this.TOTAL_COSTO_DIRECTO;
              this._sdatos.TOTAL_CIF = this.TOTAL_CIF;
              this._sdatos.TOTAL_CIF_VARIABLE = this.TOTAL_CIF_VARIABLE;
              this._sdatos.TOTAL_CIF_FIJO = this.TOTAL_CIF_FIJO;
              this._sdatos.TOTAL_COSTO = this.TOTAL_COSTO;
              this._sdatos.TOTAL_UTILIDAD = this.TOTAL_UTILIDAD;
              this._sdatos.PRECIO_BASE = this.PRECIO_BASE;
              this._sdatos.CON_OPERATIVA = this.CON_OPERATIVA;
              this._sdatos.TOTAL_PAG = this.TOTAL_PAG;
              this._sdatos.TOTAL_GRAVAMENES = this.TOTAL_GRAVAMENES;
              this._sdatos.TOTAL_PDG = this.TOTAL_PDG;
              this._sdatos.TOTAL_AJUSTE_PRECIO = this.TOTAL_AJUSTE_PRECIO;
              this._sdatos.TOTAL_MATRIZ = this.TOTAL_MATRIZ;

              this._sdatos.setTotales({ 
                GRUPO: 'TOTALES', ACCION: 'CARGAR',
                SUBTOTAL_MA: this.SUBTOTAL_MA,
                PROTECCION_MA: this.PROTECCION_MA,
                TOTAL_MATERIALES: this.TOTAL_MATERIALES,
                TOTAL_GRAVADOS: this.TOTAL_GRAVADOS,
                TOTAL_SIN_IVA: this.TOTAL_SIN_IVA,
                SUBTOTAL_MO: this.SUBTOTAL_MO,
                PROTECCION_MO: this.PROTECCION_MO,
                TOTAL_MANO_OBRA: this.TOTAL_MANO_OBRA,
                TOTAL_COSTO_DIRECTO: this.TOTAL_COSTO_DIRECTO,
                TOTAL_CIF: this.TOTAL_CIF,
                TOTAL_CIF_VARIABLE: this.TOTAL_CIF_VARIABLE,
                TOTAL_CIF_FIJO: this.TOTAL_CIF_FIJO,
                TOTAL_COSTO: this.TOTAL_COSTO,
                TOTAL_UTILIDAD: this.TOTAL_UTILIDAD,
                PRECIO_BASE: this.PRECIO_BASE,
                CON_OPERATIVA: this.CON_OPERATIVA,
                TOTAL_AJUSTE_PRECIO: this.TOTAL_AJUSTE_PRECIO,
                TOTAL_PAG: this.TOTAL_PAG,
                TOTAL_GRAVAMENES: this.TOTAL_GRAVAMENES,
                TOTAL_PDG: this.TOTAL_PDG,
                TOTAL_MATRIZ: this.TOTAL_MATRIZ
              });
  
              this.onRowValidating(this.FMatriz);
            }

            this.mnuAccion = "";
						// Modo edición en otros componentes
            this._sdatos.readonly = this.readOnly;
            this._sdatos.setReadOnly(this.readOnly);

						this.prmUsrAplBarReg.accion = 'r_cancelar';
						this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} }
						this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
					}
          // this.cdr.detectChanges();
				});
				break;

			case "r_vista":
        this.opVista();
        break;

      case 'r_refrescar':
        if( this.FMatriz.PRODUCTO !== '') {
          this.valoresObjetos('todos', 'refrescar');
          // this._sdatos.conCambios++;
          this._sdatos.setRefresh(true);
        } else {
          this.valoresObjetos('productos', '');
        }
        break;

			case 'r_imprimir':
				this.imprimirReporte(operMenu.operacion.id_reporte, operMenu.operacion.archivo, operMenu.operacion.data_rpt);
				break;

			case 'r_configurar':
        // if ( this.FMatriz.PRODUCTO !== '' ) {
        //   const Data = [{
        //     PRODUCTO: this.FMatriz.PRODUCTO,
        //     CLASE: this.FMatriz.CLASE,
        //     ACCION: 'INFO COPIA MATRIZ'
        //   }];
        //   this.getSelectProductos(Data);
        // } else {
        //   showToast('Seleccione Matriz como referencia a Copiar', 'error');
        // }
				break;

      case 'r_copiar':
        if ( this.FMatriz.PRODUCTO !== '' ) {
          const Data = [{
            PRODUCTO: this.FMatriz.PRODUCTO,
            CLASE: this.FMatriz.CLASE,
            ID_RUTA: this.FMatriz.RUTAS,
            ACCION: 'INFO COPIA MATRIZ'
          }];
          this.getSelectProductos(Data);
        } else {
          showToast('Seleccione Matriz como referencia a Copiar', 'error');
        }
				break;

      default:
				break;
		}
	}

  opPrepararNuevo(): void {
		this.esVisibleSelecc = 'onClick';
    this.data_prev = JSON.parse(JSON.stringify({ 
      FMATRIZ: this.FMatriz,
      SECCIONES_MATERIALES: this._sdatos.DGSECCIONES_MATERIALES,
      MATERIALES: this._sdatos.MATRIZ_DETALLE_MATERIALES,
      TOTAL_GRAVADOS: this._sdatos.TOTAL_GRAVADOS,
      TOTAL_SIN_IVA: this._sdatos.TOTAL_SIN_IVA,
      SECCIONES_MANO_OBRA: this._sdatos.DGSECCIONES_MANO_OBRA,
      MANO_OBRA: this._sdatos.MATRIZ_DETALLE_MANO_OBRA,
      SUBTOTAL_MO: this._sdatos.SUBTOTAL_MO,
      PROTECCION_MO: this._sdatos.PROTECCION_MO,
      TIPOS_CIF: this._sdatos.MATRIZ_CIF,
      CIF: this._sdatos.MATRIZ_DETALLE_CIF,
      TOTAL_MATERIALES: this._sdatos.TOTAL_MATERIALES,
      TOTAL_MO: this._sdatos.TOTAL_MANO_OBRA,
      TOTAL_COSTO_DIRECTO: this._sdatos.TOTAL_COSTO_DIRECTO,
      TOTAL_CIF: this._sdatos.TOTAL_CIF,
      TOTAL_CIF_FIJO: this._sdatos.TOTAL_CIF_FIJO,
      TOTAL_CIF_VARIABLE: this._sdatos.TOTAL_CIF_VARIABLE,
      TOTAL_COSTO: this._sdatos.TOTAL_COSTO,
      UTILIDAD: this._sdatos.TOTAL_UTILIDAD,
      PRECIO_BASE: this._sdatos.PRECIO_BASE,
      CON_OPERATIVA: this._sdatos.CON_OPERATIVA,
      PRECIO_ANTES_GRAV: this._sdatos.TOTAL_PAG,
      GRAVAMENES: this._sdatos.TOTAL_GRAVAMENES,
      PRECIO_DESP_GRAV: this._sdatos.TOTAL_PDG,
      AJUSTE_PRECIO: this._sdatos.TOTAL_AJUSTE_PRECIO,
      TOTAL: this._sdatos.TOTAL_MATRIZ
    }));
    this.opBlanquearForma();
    // Modo edición en otros componentes
    this._sdatos.readonly = this.readOnly;
    // this._sdatos.setReadOnly(this.readOnly);
	}

  opBlanquearForma(): void {
    this.activeItems = false;
    this.FMatriz.PRODUCTO = "";
    this.FMatriz.NOMBRE = "";
    this.FMatriz.CLASE = "";
    this.clase = 1;
    this.FMatriz.ETAPA = "";
    this.FMatriz.MARGEN_RENTABILIDAD = 0;
    this.FMatriz.BASES_COSTOS = "";
    this.FMatriz.PERFIL_TRIBUTARIO = "";
    this.FMatriz.RUTAS = "";
    this.selectProducto = [];
    this.selectRutasProductos = [];
    this.DGAtributosSimple = [];
    this.DGAtributosCompuesto = [];
    this.DCIF = [];
    this.items = [];
    this._sdatos.D_MATRIZ = [];
    this._sdatos.DGSECCIONES_MATERIALES = [];
    this._sdatos.MATRIZ_DETALLE_MATERIALES = [];
    this._sdatos.DGSECCIONES_MANO_OBRA = [];
    this._sdatos.MATRIZ_DETALLE_MANO_OBRA = [];
    this._sdatos.MATRIZ_CIF = [];
    this._sdatos.MATRIZ_DETALLE_CIF = [];
    this.SUBTOTAL_MA = 0;
    this.PROTECCION_MA = 0;
    this.TOTAL_MATERIALES = 0;
    this.SUBTOTAL_MO = 0;
    this.PROTECCION_MO = 0;
    this.TOTAL_MANO_OBRA = 0;
    this.TOTAL_COSTO_DIRECTO = 0;
    this.TOTAL_CIF = 0;
    this.TOTAL_COSTO = 0;
    this.TOTAL_UTILIDAD = 0;
    this.PRECIO_BASE = 0;
    this.CON_OPERATIVA = 0;
    this.TOTAL_PAG = 0;
    this.TOTAL_GRAVAMENES = 0;
    this.TOTAL_PDG = 0;
    this.TOTAL_AJUSTE_PRECIO = 0;
    this.TOTAL_MATRIZ = 0;
    this._sdatos.SUBTOTAL_MA = 0;
    this._sdatos.PROTECCION_MA = 0;
    this._sdatos.TOTAL_MATERIALES = 0;
    this._sdatos.TOTAL_GRAVADOS = 0;
    this._sdatos.TOTAL_SIN_IVA = 0;
    this._sdatos.TOTAL_MANO_OBRA = 0;
    this._sdatos.SUBTOTAL_MO = 0;
    this._sdatos.PROTECCION_MO = 0;
    this._sdatos.TOTAL_COSTO_DIRECTO = 0;
    this._sdatos.TOTAL_CIF = 0;
    this._sdatos.TOTAL_CIF_FIJO = 0,
    this._sdatos.TOTAL_CIF_VARIABLE = 0,
    this._sdatos.TOTAL_COSTO = 0;
    this._sdatos.TOTAL_UTILIDAD = 0;
    this._sdatos.PRECIO_BASE = 0;
    this._sdatos.CON_OPERATIVA = 0;
    this._sdatos.TOTAL_PAG = 0;
    this._sdatos.TOTAL_GRAVAMENES = 0;
    this._sdatos.TOTAL_PDG = 0;
    this._sdatos.TOTAL_AJUSTE_PRECIO = 0;
    this._sdatos.TOTAL_MATRIZ = 0;
    this._sdatos.VARIACION = 0;
    // this.cdr.detectChanges();
  }

  opPrepararModificar(): void {
    if ( this.modoGrid === 'Consolidado' ) {
      Swal.fire({
        title: '',
        text: 'Se desactivara el modo Consolidado para editar!',
        iconHtml: "<i class='icon-alert-ol'></i>",
        confirmButtonColor: '#438ef1',
        confirmButtonText: 'OK'
        }).then((result) => {
        if (result.isConfirmed) {
          if (this.FMatriz.CLASE.match('Producto simple|Parte simple')) {            
            this.modoGrid = ['Por Secciones'];
            this.clase = 1;
          }
          if (this.FMatriz.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
            this.modoGrid = ['Por Partes','Por Secciones'];
            this.clase = 2;
          }
          this._sdatos.setModoGrid({
            visibleGrupoPartes: false,
            modoGridValue: this.modoGridValue
          });
          this.readOnly = false;
          this.readOnlyMargen = false;
          this.readOnlyRutasProductos = true;
          this.esVisibleSelecc = 'onClick';
          this._sdatos.readonly = this.readOnly;
          this._sdatos.setReadOnly(this.readOnly);
          this.data_prev = JSON.parse(JSON.stringify({ 
            FMATRIZ: this.FMatriz,
            SECCIONES_MATERIALES: this._sdatos.DGSECCIONES_MATERIALES,
            SUBTOTAL_MA: this._sdatos.SUBTOTAL_MA,
            PROTECCION_MA: this._sdatos.PROTECCION_MA,
            MATERIALES: this._sdatos.MATRIZ_DETALLE_MATERIALES,
            TOTAL_GRAVADOS: this._sdatos.TOTAL_GRAVADOS,
            TOTAL_SIN_IVA: this._sdatos.TOTAL_SIN_IVA,
            SECCIONES_MANO_OBRA: this._sdatos.DGSECCIONES_MANO_OBRA,
            MANO_OBRA: this._sdatos.MATRIZ_DETALLE_MANO_OBRA,
            SUBTOTAL_MO: this._sdatos.SUBTOTAL_MO,
            PROTECCION_MO: this._sdatos.PROTECCION_MO,
            TIPOS_CIF: this._sdatos.MATRIZ_CIF,
            CIF: this._sdatos.MATRIZ_DETALLE_CIF,
            TOTAL_MATERIALES: this._sdatos.TOTAL_MATERIALES,
            TOTAL_MO: this._sdatos.TOTAL_MANO_OBRA,
            TOTAL_COSTO_DIRECTO: this._sdatos.TOTAL_COSTO_DIRECTO,
            TOTAL_CIF: this._sdatos.TOTAL_CIF,
            TOTAL_CIF_FIJO: this._sdatos.TOTAL_CIF_FIJO,
            TOTAL_CIF_VARIABLE: this._sdatos.TOTAL_CIF_VARIABLE,
            TOTAL_COSTO: this._sdatos.TOTAL_COSTO,
            UTILIDAD: this._sdatos.TOTAL_UTILIDAD,
            PRECIO_BASE: this._sdatos.PRECIO_BASE,
            CON_OPERATIVA: this._sdatos.CON_OPERATIVA,
            PRECIO_ANTES_GRAV: this._sdatos.TOTAL_PAG,
            GRAVAMENES: this._sdatos.TOTAL_GRAVAMENES,
            PRECIO_DESP_GRAV: this._sdatos.TOTAL_PDG,
            AJUSTE_PRECIO: this._sdatos.TOTAL_AJUSTE_PRECIO,
            TOTAL: this._sdatos.TOTAL_MATRIZ
          }));
        }
      });
    } else {
      this.readOnly = false;
      this.readOnlyMargen = false;
      this.readOnlyRutasProductos = false;
      this.esVisibleSelecc = 'onClick';
      this._sdatos.readonly = this.readOnly;
      this._sdatos.setReadOnly(this.readOnly);
      this.data_prev = JSON.parse(JSON.stringify({ 
        FMATRIZ: this.FMatriz,
        SECCIONES_MATERIALES: this._sdatos.DGSECCIONES_MATERIALES,
        SUBTOTAL_MA: this._sdatos.SUBTOTAL_MA,
        PROTECCION_MA: this._sdatos.PROTECCION_MA,
        MATERIALES: this._sdatos.MATRIZ_DETALLE_MATERIALES,
        TOTAL_GRAVADOS: this._sdatos.TOTAL_GRAVADOS,
        TOTAL_SIN_IVA: this._sdatos.TOTAL_SIN_IVA,
        SECCIONES_MANO_OBRA: this._sdatos.DGSECCIONES_MANO_OBRA,
        MANO_OBRA: this._sdatos.MATRIZ_DETALLE_MANO_OBRA,
        SUBTOTAL_MO: this._sdatos.SUBTOTAL_MO,
        PROTECCION_MO: this._sdatos.PROTECCION_MO,
        TIPOS_CIF: this._sdatos.MATRIZ_CIF,
        CIF: this._sdatos.MATRIZ_DETALLE_CIF,
        TOTAL_MATERIALES: this._sdatos.TOTAL_MATERIALES,
        TOTAL_MO: this._sdatos.TOTAL_MANO_OBRA,
        TOTAL_COSTO_DIRECTO: this._sdatos.TOTAL_COSTO_DIRECTO,
        TOTAL_CIF: this._sdatos.TOTAL_CIF,
        TOTAL_CIF_FIJO: this._sdatos.TOTAL_CIF_FIJO,
        TOTAL_CIF_VARIABLE: this._sdatos.TOTAL_CIF_VARIABLE,
        TOTAL_COSTO: this._sdatos.TOTAL_COSTO,
        UTILIDAD: this._sdatos.TOTAL_UTILIDAD,
        PRECIO_BASE: this._sdatos.PRECIO_BASE,
        CON_OPERATIVA: this._sdatos.CON_OPERATIVA,
        PRECIO_ANTES_GRAV: this._sdatos.TOTAL_PAG,
        GRAVAMENES: this._sdatos.TOTAL_GRAVAMENES,
        PRECIO_DESP_GRAV: this._sdatos.TOTAL_PDG,
        AJUSTE_PRECIO: this._sdatos.TOTAL_AJUSTE_PRECIO,
        TOTAL: this._sdatos.TOTAL_MATRIZ
      }));
    }
	}

  getTotalCostoDirecto(e:any) {
    if (e.TOTAL_MATERIALES !== undefined && e.TOTAL_MATERIALES !== null)
      this.TOTAL_MATERIALES = e.TOTAL_MATERIALES;
    if (e.TOTAL_MANO_OBRA !== undefined && e.TOTAL_MANO_OBRA !== null)
      this.TOTAL_MANO_OBRA = e.TOTAL_MANO_OBRA;

    this.TOTAL_COSTO_DIRECTO = this.TOTAL_MATERIALES + this.TOTAL_MANO_OBRA;
    this.getTotalTCD();
  }

  getTotalTCD() {
    if (this._sdatos.accion !== 'consultar') {
      const sumaTCD = this.TOTAL_MATERIALES + this.TOTAL_MANO_OBRA;
      this.TOTAL_COSTO_DIRECTO = sumaTCD;
      this._sdatos.TOTAL_COSTO_DIRECTO = this.TOTAL_COSTO_DIRECTO;
      this._sdatos.setTotales({GRUPO: 'TOTALES', ACCION: 'CALCULAR' });
      this._sdatos.setTotalTCDCIF(this.TOTAL_COSTO_DIRECTO);
    }
  }

  getTotalCIF(e: any) {
    if (this._sdatos.accion !== 'consultar') {
      this.TOTAL_CIF = e.TOTAL_CIF;
      this._sdatos.TOTAL_CIF = this.TOTAL_CIF;
      this._sdatos.setTotales({GRUPO: 'TOTALES', ACCION: 'CALCULAR' });
    }
  }

  opPrepararGuardar(accion: string): void {
		if ( this._sdatos.conCambios != 0 ) {
      let msj: any = [];
      if ((this.FMatriz.PRODUCTO === '') || (this.FMatriz.PRODUCTO === null)) msj.push('PRODUCTO');
      if ((this.FMatriz.NOMBRE === '') || (this.FMatriz.NOMBRE === null)) msj.push('NOMBRE');
      if ((this.FMatriz.CLASE === '') || (this.FMatriz.CLASE === null)) msj.push('CLASE');
      if ((this.FMatriz.ETAPA === '') || (this.FMatriz.ETAPA === null)) msj.push('ETAPA');
      if ((this.FMatriz.MARGEN_RENTABILIDAD <= 0) || (this.FMatriz.MARGEN_RENTABILIDAD === null)) msj.push('MARGEN DE RENTABILIDAD, mayor de Cero (0)');
      if ((this.FMatriz.BASES_COSTOS === '') || (this.FMatriz.BASES_COSTOS === null)) msj.push('BASES COSTOS');
      if ((this.FMatriz.PERFIL_TRIBUTARIO === '') || (this.FMatriz.PERFIL_TRIBUTARIO === null)) msj.push('PERFIL TRIBUTARIO');
      if ((this.FMatriz.RUTAS === '') || (this.FMatriz.RUTAS === null)) msj.push('RUTAS');
      if (this.FMatriz.CLASE.match('Producto simple|Parte simple')) {
        if (this._sdatos.DGSECCIONES_MATERIALES.length > this._sdatos.MATRIZ_DETALLE_MATERIALES.length) msj.push('MATERIALES');
        if (this._sdatos.DGSECCIONES_MANO_OBRA.length > this._sdatos.MATRIZ_DETALLE_MANO_OBRA.length) msj.push('MANO DE OBRA');
        if (this._sdatos.MATRIZ_DETALLE_CIF.length === 0) msj.push('CIF');
      }
  
      if( msj.length !== 0) {
        showToast('Hay datos nulos en '+msj+', complete toda la información', 'error');
        return;
      }

			const CABECERA = ({
        PRODUCTO: this.FMatriz.PRODUCTO,
        BASE_COSTO: this.FMatriz.BASES_COSTOS,
        MARGEN: this.FMatriz.MARGEN_RENTABILIDAD,
        USUARIO: localStorage.getItem("usuario"),
        ESTADO: 'ACTIVO',
        ID_RUTA: this.FMatriz.RUTAS,
        TOTAL_MATERIALES: this._sdatos.TOTAL_MATERIALES,
        SUBTOTAL_MA: this._sdatos.SUBTOTAL_MA,
        PROTECCION_MA: this._sdatos.PROTECCION_MA,
        TOTAL_GRAVADOS: this._sdatos.TOTAL_GRAVADOS,
        TOTAL_SIN_IVA: this._sdatos.TOTAL_SIN_IVA,
        TOTAL_MO: this._sdatos.TOTAL_MANO_OBRA,
        SUBTOTAL_MO: this._sdatos.SUBTOTAL_MO,
        PROTECCION_MO: this._sdatos.PROTECCION_MO,
        TOTAL_COSTO_DIRECTO: this._sdatos.TOTAL_COSTO_DIRECTO,
        TOTAL_CIF: this._sdatos.TOTAL_CIF,
        TOTAL_CIF_VARIABLE: this._sdatos.TOTAL_CIF_VARIABLE,
        TOTAL_CIF_FIJO: this._sdatos.TOTAL_CIF_FIJO,
        TOTAL_COSTO: this._sdatos.TOTAL_COSTO,
        UTILIDAD: this._sdatos.TOTAL_UTILIDAD,
        PRECIO_BASE: this._sdatos.PRECIO_BASE,
        CON_OPERATIVA: this._sdatos.CON_OPERATIVA,
        AJUSTE_PRECIO: this._sdatos.TOTAL_AJUSTE_PRECIO,
        PRECIO_ANTES_GRAV: this._sdatos.TOTAL_PAG,
        GRAVAMENES: this._sdatos.TOTAL_GRAVAMENES,
        PRECIO_DESP_GRAV: this._sdatos.TOTAL_PDG,
        TOTAL: this._sdatos.TOTAL_MATRIZ
      });
      var newDataMateriales: any = [];
      var newDataManoObra: any = [];
      var newDataCif: any = [];
      var DETALLE: any = {};
      const MA:any = JSON.parse(JSON.stringify(this._sdatos.MATRIZ_DETALLE_MATERIALES));
      for (let i = 0; i < MA.length; i++) {
        for (let j = 0; j < MA[i].DATA_SOURCE.length; j++) {
          newDataMateriales.push(MA[i].DATA_SOURCE[j]);
        }
      };
      const MO:any = JSON.parse(JSON.stringify(this._sdatos.MATRIZ_DETALLE_MANO_OBRA));
      for (let i = 0; i < MO.length; i++) {
        MO[i].DATA_SOURCE.forEach((mo:any) => {
        let horas:any = '';
        let minutos:any = '';
        let segundos:any = '';
        //formato para cantidad MO
          if(mo.TIPO === 'Tiempo') {
            if(mo.CANTIDAD.length < 8) {
              var valorSinFormato = mo.CANTIDAD;
              // Separa la cadena en horas, minutos y segundos
              horas = valorSinFormato.substring(0, 2);
              minutos = valorSinFormato.substring(2, 4);
              segundos = valorSinFormato.substring(4, 6);
              
              if(horas === undefined || horas === null || horas === '')
                horas = '00'
              if(minutos === undefined || minutos === null || minutos === '')
                minutos = '00'
              if(segundos === undefined || segundos === null || segundos === '')
                segundos = '00'
  
              // Formatea el valor
              var valorFormateado = horas + ":" + minutos + ":" + segundos;
              // Convertir la cadena de texto a un objeto de tipo Date
              let tiempo = new Date("2024-01-01T" + valorFormateado);
              // Obtener las horas, minutos y segundos del objeto de fecha
              horas = tiempo.getHours();
              minutos = tiempo.getMinutes();
              segundos = tiempo.getSeconds();
              // Formatear la cadena de tiempo para SQL Server (HH:MM:SS)
              let tiempoFormateado = `${horas < 10 ? '0' : ''}${horas}:${minutos < 10 ? '0' : ''}${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;
              
              mo.TIEMPO = tiempoFormateado;
              mo.CANTIDAD = 0;
            } else {
              mo.CANTIDAD = 0;
            }
          }
          if(mo.TIPO === 'Dinero') {
            mo.TIEMPO = '00:00:00';
          }
        });
        for (let j = 0; j < MO[i].DATA_SOURCE.length; j++) {
          newDataManoObra.push(MO[i].DATA_SOURCE[j]);
        }
      };
      const CIF:any = JSON.parse(JSON.stringify(this._sdatos.MATRIZ_DETALLE_CIF));
      for (let i = 0; i < CIF.length; i++) {
        for (let j = 0; j < CIF[i].DATA_SOURCE.length; j++) {
          newDataCif.push(CIF[i].DATA_SOURCE[j]);
        }
      };
      if ( this.FMatriz.CLASE.match('Producto simple|Parte simple') ) {
        DETALLE = ({
          MATERIALES: newDataMateriales,
          MANO_OBRA: newDataManoObra,
          CIF: newDataCif
        });
      };
      if (this.FMatriz.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
        DETALLE = ({
          MATERIALES: newDataMateriales.filter((d:any) => d.ID_PARTE === this.FMatriz.PRODUCTO),
          MANO_OBRA: newDataManoObra.filter((d:any) => d.ID_PARTE === this.FMatriz.PRODUCTO),
          CIF: newDataCif.filter((d:any) => d.ID_PARTE === this.FMatriz.PRODUCTO)
        });
      }
			const prm = ({ MATRIZ: CABECERA, ITM_MATRIZ: DETALLE });
			// API guardado de datos
      this.loadingVisible = true;
			this.sData.save(accion, prm, this.prmUsrAplBarReg.aplicacion).subscribe((data) => {
        this.loadingVisible = false;
				const res = JSON.parse(data.data);
				if ( (data.token != undefined) ){
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				if (res[0].ErrMensaje !== '' && res[0].ErrMensaje !== 'VALIDO') {
					this.prmUsrAplBarReg.error = 'Error';
					this.prmUsrAplBarReg.accion = 'r_guardar';
					this.esVisibleSelecc = 'onClick';
					this.showModal(res[0].ErrMensaje, 'Error');
				}
				else {
					this.readOnly = true;
          this.readOnlyMargen = true;
          this.readOnlyRutasProductos = true;

					// Operaciones de barra
					if (this.mnuAccion === 'new') {
						this.QFiltro = "PRODUCTO='"+this.FMatriz.PRODUCTO+"'";
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
          this._sdatos.conCambios = 0;
          this._sdatos.accion = "";
          showToast('Registro actualizado', 'success');
          this._sdatos.readonly = this.readOnly;
					this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this._sdatos.setReadOnly(this.readOnly);
				}
			});
		} else {
      showToast('No hay cambios por guardar', 'error');
      this.prmUsrAplBarReg = {
        ...this.prmUsrAplBarReg,
        error: "",
        accion: "r_navegar",
        r_numReg: 1,
        r_totReg: 1,
        operacion: {}
      };
      this.readOnly = true;
      this._sdatos.readonly = this.readOnly;
      this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      this._sdatos.setReadOnly(this.readOnly);
		}
	}

  opPrepararBuscar(accion): void {
		if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para MATRIZ",
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
      const prm = { MATRIZ: arrFiltro };
      this.loadingVisible = true;
      this.mnuAccion = "consulta";
      // Ejecuta búsqueda API
      this.sData
        .consulta_filtro('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
					try {
            this.loadingVisible = false;
						const res = JSON.parse(data.data);
						this._sfiltro.enConsulta = false;
						if ( (data.token != undefined) ){
							const refreshToken = data.token;
							localStorage.setItem("token", refreshToken);
						}
						const datares = res;
            if (datares[0].MATERIALES === null || datares[0].MATERIALES === undefined) datares[0].MATERIALES = [];
            if (datares[0].MANO_OBRA === null || datares[0].MANO_OBRA === undefined) datares[0].MANO_OBRA = [];
            if (datares[0].CIF === null || datares[0].CIF === undefined) datares[0].CIF = [];
            if (datares[0].TOTAL_MATERIALES === null || datares[0].TOTAL_MATERIALES === undefined) datares[0].TOTAL_MATERIALES = 0;
            if (datares[0].PROTECCION_MA === null || datares[0].PROTECCION_MA === undefined) datares[0].PROTECCION_MA = 0;
            if (datares[0].SUBTOTAL_MA === null || datares[0].SUBTOTAL_MA === undefined) datares[0].SUBTOTAL_MA = 0;
            if (datares[0].TOTAL_MO === null || datares[0].TOTAL_MO === undefined) datares[0].TOTAL_MO = 0;
            if (datares[0].PROTECCION_MO === null || datares[0].PROTECCION_MO === undefined) datares[0].PROTECCION_MO = 0;
            if (datares[0].SUBTOTAL_MO === null || datares[0].SUBTOTAL_MO === undefined) datares[0].SUBTOTAL_MO = 0;
            if (datares[0].TOTAL_CIF === null || datares[0].TOTAL_CIF === undefined) datares[0].TOTAL_CIF = 0;
            if (datares[0].TOTAL_COSTO_DIRECTO === null || datares[0].TOTAL_COSTO_DIRECTO === undefined) datares[0].TOTAL_COSTO_DIRECTO = 0;
            if (datares[0].TOTAL_COSTO === null || datares[0].TOTAL_COSTO === undefined) datares[0].TOTAL_COSTO = 0;
            if (datares[0].UTILIDAD === null || datares[0].UTILIDAD === undefined) datares[0].UTILIDAD = 0;
            if (datares[0].PRECIO_BASE === null || datares[0].PRECIO_BASE === undefined) datares[0].PRECIO_BASE = 0;
            if (datares[0].CON_OPERATIVA === null || datares[0].CON_OPERATIVA === undefined) datares[0].CON_OPERATIVA = 0;
            if (datares[0].PRECIO_ANTES_GRAV === null || datares[0].PRECIO_ANTES_GRAV === undefined) datares[0].PRECIO_ANTES_GRAV = 0;
            if (datares[0].GRAVAMENES === null || datares[0].GRAVAMENES === undefined) datares[0].GRAVAMENES = 0;
            if (datares[0].PRECIO_DESP_GRAV === null || datares[0].PRECIO_DESP_GRAV === undefined) datares[0].PRECIO_DESP_GRAV = 0;
            if (datares[0].AJUSTE_PRECIO === null || datares[0].AJUSTE_PRECIO === undefined) datares[0].AJUSTE_PRECIO = 0;
            if (datares[0].TOTAL === null || datares[0].TOTAL === undefined) datares[0].TOTAL = 0;

						if (datares[0].ErrMensaje === '') {
							// Asocia datos
							if ( datares??'' != '' ) {
                // cabecera
								this.VDatosReg = datares;

								this.QFiltro = datares[0].QFILTRO;
                
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
                this.readOnly = true;
                this.readOnlyMargen = true;
                this.readOnlyRutasProductos = true;
							}
						} else {
							this.VDatosReg = [];
							//notificación
              showToast(datares[0].ErrMensaje, 'warning');
              this.prmUsrAplBarReg.accion = 'r_cancelar';
              this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} }
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
							//this.opBlanquearForma();
						}
					} catch (error) {
            this.loadingVisible = false;
						this.readOnly = true;
            this.readOnlyMargen = true;
            this.readOnlyRutasProductos = true;
            this._sfiltro.enConsulta = false;
            this.mnuAccion = "";
						this.showModal(error, 'Error');
					}
      });
    }
	}

  opIrARegistro(accion: string): void {
    let newArray: any;
    this.prmUsrAplBarReg.accion = "r_numreg";
    this._sdatos.accion = 'r_numreg';

    switch (accion) {
      case "r_primero":
        this.prmUsrAplBarReg.r_numReg = 1;
        if (this.VDatosReg.length != 0){
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[0]));
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
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length > 0) {
          newArray = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        } else {
          this.opBlanquearForma();
        }
        break;

      default:
        break;
    }

    this.valoresObjetos('rutas', newArray);
    this.FMatriz.PRODUCTO = newArray.PRODUCTO;
    this.FMatriz.NOMBRE = newArray.DAT_PRO[0].NOMBRE;
    this.FMatriz.CLASE = newArray.DAT_PRO[0].CLASE;
    this.FMatriz.ETAPA = newArray.DAT_PRO[0].ETAPA;
    this.FMatriz.PERFIL_TRIBUTARIO = newArray.DAT_PRO[0].PERFIL_TRIBUTARIO;
    this.FMatriz.PORCENTAJE = newArray.DAT_PRO[0].PORCENTAJE;
    this.FMatriz.MARGEN_RENTABILIDAD = newArray.MARGEN;
    this.FMatriz.BASES_COSTOS = newArray.BASE_COSTO;
    this.FMatriz.RUTAS = newArray.ID_RUTA;
    if ( this.FMatriz.CLASE.match('Producto simple|Parte simple') ) {
      this.clase = 1;
      this.valoresObjetos('atributos simples', '');
      this.loadDataTotales(newArray);
      this.loadDataGrids(newArray, 'consulta');
      // this.setTotalesSecciones('');
      this.modoGrid = ['Por Secciones','Consolidado'];
      this.modoGridValue = 'Por Secciones';
      this._sdatos.modoGrid = this.modoGridValue;
    } else if (this.FMatriz.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
      this.clase = 2;
      // this.items = ['COSTOS DIRECTOS', 'COSTOS INDIRECTOS', 'TOTAL COSTOS'];
      this.modoGrid = ['Por Partes','Por Secciones','Consolidado'];
      this.modoGridValue = 'Por Partes';
      this._sdatos.modoGrid = this.modoGridValue;
      this.valoresObjetos('atributos compuestos', '');
      this.valoresObjetos('partes', '');
      if((newArray.MATERIALES !== undefined) && (newArray.MATERIALES !== null) && (newArray.MATERIALES !== ''))
        this.MATERIALES_PRODUCTO = JSON.parse(JSON.stringify(newArray.MATERIALES));
      else
        this.MATERIALES_PRODUCTO = [];

      if((newArray.MANO_OBRA !== undefined) && (newArray.MANO_OBRA !== null) && (newArray.MANO_OBRA !== ''))
        this.MO_PRODUCTO = JSON.parse(JSON.stringify(newArray.MANO_OBRA));
      else
        this.MO_PRODUCTO = [];

      if((newArray.CIF !== undefined) && (newArray.CIF !== null) && (newArray.CIF !== ''))
        this.CIF_PRODUCTO = JSON.parse(JSON.stringify(newArray.CIF));
      else
        this.CIF_PRODUCTO = [];
    }
    this.selectProducto = [this.FMatriz.PRODUCTO];
    this.selectRutasProductos = [this.FMatriz.RUTAS];

    this.data_prev = [{FMatriz:this.FMatriz}];
    this._sdatos.D_MATRIZ = this.FMatriz;
    // this.onRowValidating(this.FMatriz);
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
  }

  setTotalesSecciones(condicion:string) {
    if ( this.FMatriz.CLASE.match('Producto simple|Parte simple') ) { 
      const SeccMA:any = JSON.parse(JSON.stringify(this.DataGridSeccion.filter((d:any) => d.ASIGNABLE_MATERIALES === true) ));
      const SeccMO:any= JSON.parse(JSON.stringify(this.DataGridSeccion.filter((d:any) => d.ASIGNABLE_MO === true) ));
      if (condicion === 'refrescar' && this._sdatos.DGSECCIONES_MATERIALES.length > 0 && this._sdatos.DGSECCIONES_MANO_OBRA.length > 0) {
        //Validad que secciones nuevas se agregaron a la ruta
        SeccMA.forEach((sec:any) => {
          const pos:any = this._sdatos.DGSECCIONES_MATERIALES.findIndex((d:any) => d.ID_SECCION === sec.ID_SECCION);
          if (pos === -1)
            this._sdatos.DGSECCIONES_MATERIALES.push(sec);
        });
        SeccMO.forEach((sec:any) => {
          const pos:any = this._sdatos.DGSECCIONES_MANO_OBRA.findIndex((d:any) => d.ID_SECCION === sec.ID_SECCION);
          if (pos === -1)
            this._sdatos.DGSECCIONES_MANO_OBRA.push(sec);
        });
        //Valida que secciones salieron de la ruta
        for (let i = 0; i < this._sdatos.DGSECCIONES_MATERIALES.length; i++) {
          const ele = this._sdatos.DGSECCIONES_MATERIALES[i];
          const pos:any = SeccMA.findIndex((d:any) => d.ID_SECCION === ele.ID_SECCION);
          if (pos === -1)
            this._sdatos.DGSECCIONES_MATERIALES.splice(i, 1);
        }
        for (let i = 0; i < this._sdatos.DGSECCIONES_MANO_OBRA.length; i++) {
          const ele = this._sdatos.DGSECCIONES_MANO_OBRA[i];
          const pos:any = SeccMO.findIndex((d:any) => d.ID_SECCION === ele.ID_SECCION);
          if (pos === -1)
            this._sdatos.DGSECCIONES_MANO_OBRA.splice(i, 1);
        }
        
      } else {
        this._sdatos.DGSECCIONES_MATERIALES = SeccMA;
        this._sdatos.DGSECCIONES_MANO_OBRA = SeccMO;
      }

      for (let i = 0; i < this._sdatos.DGSECCIONES_MATERIALES.length; i++) {
        if (this._sdatos.MATRIZ_DETALLE_MATERIALES.length > 0) {
          for (let j = 0; j < this._sdatos.MATRIZ_DETALLE_MATERIALES.length; j++) { // validar si tamaños es mayor que 0.
            const newArray = this._sdatos.MATRIZ_DETALLE_MATERIALES.filter((d:any)=> d.ID_SECCION === this._sdatos.DGSECCIONES_MATERIALES[i].ID_SECCION);
            if ( newArray.length !== 0 ){
              // const totalSeccion: number = newArray[0].DATA_SOURCE.reduce( (acc:any, item:any) => {
              //   return acc += item.TOTAL;
              // }, 0);

              const subtotalSeccion: number = newArray[0].DATA_SOURCE.reduce( (acc:any, item:any) => {
                return acc += item.SUB_TOTAL;
              }, 0);
              const proteccion: number = newArray[0].DATA_SOURCE.reduce( (acc:any, item:any) => {
                return acc += item.PROTECCION;
              }, 0);
              const factor_ma: number = (proteccion/subtotalSeccion)*100;
              newArray[0].DATA_SOURCE.forEach((MA:any) => {
                if (MA.PORCENTAJE === 0) {
                  MA.EXCLUIDOS = MA.PORCENTAJE * MA.TOTAL;
                  MA.GRAVADOS = 0;
                } else {
                  MA.GRAVADOS = MA.PORCENTAJE * MA.TOTAL;
                  MA.EXCLUIDOS = 0;
                }
              });
              const total_gravados: number = newArray[0].DATA_SOURCE.reduce( (acc:any, item:any) => {
                return acc += item.GRAVADOS;
              }, 0);
              const total_excluidos: number = newArray[0].DATA_SOURCE.reduce( (acc:any, item:any) => {
                return acc += item.EXCLUIDOS;
              }, 0);

              this._sdatos.DGSECCIONES_MATERIALES[i].GRAVADOS = total_gravados;
              this._sdatos.DGSECCIONES_MATERIALES[i].EXCLUIDOS = total_excluidos;
              this._sdatos.DGSECCIONES_MATERIALES[i].SUBTOTAL = subtotalSeccion;
              this._sdatos.DGSECCIONES_MATERIALES[i].FACTOR_MA = factor_ma;
              this._sdatos.DGSECCIONES_MATERIALES[i].PROTECCION = proteccion;
              this._sdatos.DGSECCIONES_MATERIALES[i].TOTAL = subtotalSeccion + proteccion;
            } else {
              this._sdatos.DGSECCIONES_MATERIALES[i].GRAVADOS = 0;
              this._sdatos.DGSECCIONES_MATERIALES[i].EXCLUIDOS = 0;
              this._sdatos.DGSECCIONES_MATERIALES[i].SUBTOTAL = 0;
              this._sdatos.DGSECCIONES_MATERIALES[i].FACTOR_MA = 0;
              this._sdatos.DGSECCIONES_MATERIALES[i].PROTECCION = 0;
              this._sdatos.DGSECCIONES_MATERIALES[i].TOTAL = 0;
            }
          };
        } else {
          this._sdatos.DGSECCIONES_MATERIALES[i].GRAVADOS = 0;
          this._sdatos.DGSECCIONES_MATERIALES[i].EXCLUIDOS = 0;
          this._sdatos.DGSECCIONES_MATERIALES[i].SUBTOTAL = 0;
          this._sdatos.DGSECCIONES_MATERIALES[i].FACTOR_MA = 0;
          this._sdatos.DGSECCIONES_MATERIALES[i].PROTECCION = 0;
          this._sdatos.DGSECCIONES_MATERIALES[i].TOTAL = 0;
        }
      };
      for (let i = 0; i < this._sdatos.DGSECCIONES_MANO_OBRA.length; i++) {
        if (this._sdatos.MATRIZ_DETALLE_MANO_OBRA.length > 0) {
          for (let j = 0; j < this._sdatos.MATRIZ_DETALLE_MANO_OBRA.length; j++) {
            const newArray = this._sdatos.MATRIZ_DETALLE_MANO_OBRA.filter((d:any)=> d.ID_SECCION === this._sdatos.DGSECCIONES_MANO_OBRA[i].ID_SECCION);
            if ( newArray.length !== 0 ) {
              const totalSeccion: number = newArray[0].DATA_SOURCE.reduce( (acc:any, item:any) => {
                return acc += item.TOTAL;
              }, 0);

              const subtotalSeccion: number = newArray[0].DATA_SOURCE.reduce( (acc:any, item:any) => {
                return acc += item.SUB_TOTAL;
              }, 0);
              const proteccion: number = newArray[0].DATA_SOURCE.reduce( (acc:any, item:any) => {
                return acc += item.PROTECCION;
              }, 0);

              this._sdatos.DGSECCIONES_MANO_OBRA[i].PROTECCION = proteccion;
              this._sdatos.DGSECCIONES_MANO_OBRA[i].SUBTOTAL = subtotalSeccion;
              this._sdatos.DGSECCIONES_MANO_OBRA[i].TOTAL = subtotalSeccion + proteccion;
            } else {
              this._sdatos.DGSECCIONES_MANO_OBRA[i].PROTECCION = 0;
              this._sdatos.DGSECCIONES_MANO_OBRA[i].SUBTOTAL = 0;
              this._sdatos.DGSECCIONES_MANO_OBRA[i].TOTAL = 0;
            }
          };
        } else {
          this._sdatos.DGSECCIONES_MANO_OBRA[i].PROTECCION = 0;
          this._sdatos.DGSECCIONES_MANO_OBRA[i].SUBTOTAL = 0;
          this._sdatos.DGSECCIONES_MANO_OBRA[i].TOTAL = 0;
        }
      };
    }
    if ( this.FMatriz.CLASE.match('Juego|Producto compuesto|Parte compuesta') ) {
      for (let i = 0; i < this._sdatos.MATRIZ_DETALLE_MATERIALES.length; i++) {
        const newArray = [this._sdatos.MATRIZ_DETALLE_MATERIALES[i]];
        for (let m = 0; m < newArray.length; m++) {
          let memo: any = 0;
          for (let k = 0; k < newArray[m].DATA_SOURCE.length; k++) {
            let npos = this._sdatos.DGSECCIONES_MATERIALES.findIndex((d:any) => (d.ID_SECCION === newArray[m].DATA_SOURCE[k].ID_SECCION) && (d.ID_PARTE === newArray[m].DATA_SOURCE[k].ID_PARTE) );
            if(npos !== -1) {
              if (memo === npos) {
                this._sdatos.DGSECCIONES_MATERIALES[npos].TOTAL = this._sdatos.DGSECCIONES_MATERIALES[npos].TOTAL + newArray[m].DATA_SOURCE[k].TOTAL;
                memo = npos;
              } else {
                this._sdatos.DGSECCIONES_MATERIALES[npos].TOTAL = newArray[m].DATA_SOURCE[k].TOTAL;
                memo = npos;
              }
            } else {
              this._sdatos.DGSECCIONES_MATERIALES.push(newArray[m].DATA_SOURCE[k]);
            }
          }
        }
      };
      for (let j = 0; j < this._sdatos.MATRIZ_DETALLE_MANO_OBRA.length; j++) {
        const newArray = [this._sdatos.MATRIZ_DETALLE_MANO_OBRA[j]];
        for (let m = 0; m < newArray.length; m++) {
          let memo: any = 0;
          for (let k = 0; k < newArray[m].DATA_SOURCE.length; k++) {
            let npos = this._sdatos.DGSECCIONES_MANO_OBRA.findIndex((d:any) => (d.ID_SECCION === newArray[m].DATA_SOURCE[k].ID_SECCION) && (d.ID_PARTE === newArray[m].DATA_SOURCE[k].ID_PARTE) );
            if(npos !== -1) {
              if (memo === npos) {
                this._sdatos.DGSECCIONES_MANO_OBRA[npos].TOTAL = this._sdatos.DGSECCIONES_MANO_OBRA[npos].TOTAL + newArray[m].DATA_SOURCE[k].TOTAL;
                memo = npos;
              } else {
                this._sdatos.DGSECCIONES_MANO_OBRA[npos].TOTAL = newArray[m].DATA_SOURCE[k].TOTAL;
                memo = npos;
              }
            } else {
              this._sdatos.DGSECCIONES_MANO_OBRA.push(newArray[m].DATA_SOURCE[k]);
            }
          }
        }
      };
    }
    this._sdatos.setDataSeccionesMateriales(this._sdatos.DGSECCIONES_MATERIALES);
    this._sdatos.setDataSeccionesManoObra(this._sdatos.DGSECCIONES_MANO_OBRA);
    // this._sdatos.setDataTiposCif(this._sdatos.MATRIZ_CIF);
  }

  loadDataGrids(data:any, accion:string) {
    this._sdatos.MATRIZ_DETALLE_MATERIALES = [];
    this._sdatos.MATRIZ_DETALLE_MANO_OBRA = [];
    this._sdatos.MATRIZ_DETALLE_CIF = [];
    this._sdatos.MATRIZ_CIF = [];
    let conExcluidos: any = 0;
    let conGravados: any = 0;

    if (data.MATERIALES === null || data.MATERIALES === undefined || data.MATERIALES.length === undefined) data.MATERIALES = [];
    for (let i = 0; i < data.MATERIALES.length; i++) {
      const idSeccion = data.MATERIALES[i].ID_SECCION;
      const element = data.MATERIALES.filter((d:any) => d.ID_SECCION === idSeccion );
      if ( this._sdatos.MATRIZ_DETALLE_MATERIALES.findIndex((d:any) => d.ID_SECCION === idSeccion) === -1 ) {
        this._sdatos.MATRIZ_DETALLE_MATERIALES.push({ ID_SECCION: idSeccion, DATA_SOURCE: element });
        for (let j = 0; j < element.length; j++) {
          if (element[j].PORCENTAJE === 0) {
            const subT = element[j].PORCENTAJE * element[j].TOTAL;
            conExcluidos = conExcluidos + subT;
          } else {
            const subT = element[j].PORCENTAJE * element[j].TOTAL;
            conGravados = conGravados + subT;
          }
        };
      }
    };
    this.getDataTotales = ({
      TOTAL_MATERIALES: this.TOTAL_MATERIALES,
      SUBTOTAL_MA: this.SUBTOTAL_MA,
      PROTECCION_MA: this.PROTECCION_MA,
      TOTAL_SIN_IVA: conExcluidos,
      TOTAL_GRAVADOS: conGravados,
      TOTAL_MANO_OBRA: this.TOTAL_MANO_OBRA,
      SUBTOTAL_MO: this.SUBTOTAL_MO,
      PROTECCION_MO: this.PROTECCION_MO
    });

    if (data.MANO_OBRA === null || data.MANO_OBRA === undefined || data.MANO_OBRA.length === undefined) data.MANO_OBRA = [];
    for (let i = 0; i < data.MANO_OBRA.length; i++) {
      const idSeccion = data.MANO_OBRA[i].ID_SECCION;
      const element: any [] = data.MANO_OBRA.filter((d:any) => d.ID_SECCION === idSeccion );
      element.forEach((mo:any) => {
        if (mo.TIPO === 'Tiempo') {
          mo.CANTIDAD = mo.TIEMPO;
        }
      });
      if ( this._sdatos.MATRIZ_DETALLE_MANO_OBRA.findIndex((d:any) => d.ID_SECCION === idSeccion) === -1 )
        this._sdatos.MATRIZ_DETALLE_MANO_OBRA.push({ ID_SECCION: idSeccion, DATA_SOURCE: element });
    };

    if (data.CIF === null || data.CIF === undefined || data.CIF.length === undefined) {
      data.CIF = [];
      var index:number = 0;
      this._sdatos.MATRIZ_CIF.push(
        {ITEM: index, TIPO: 'CIF FIJO', DESC: 'Fijo', TOTAL: 0, TOTAL_PARTE: 0, TIPO_COMPONENTE: 'PARTE', ErrMensaje: 'old'}
      );
      this._sdatos.MATRIZ_CIF.push(
        {ITEM: index + 1, TIPO: 'CIF VARIABLE', DESC: 'Variable', TOTAL: 0, TOTAL_PARTE: 0, TIPO_COMPONENTE: 'PARTE', ErrMensaje: 'old'}
      );
    }
    for (let i = 0; i < data.CIF.length; i++) {
      var index:number = 0;
      const idParte = data.CIF[i].ID_PARTE;
      const nombre_parte = data.CIF[i].NOMBRE_PARTE;
      const element = data.CIF.filter((d:any) => d.ID_PARTE === idParte );
      if ( this._sdatos.MATRIZ_DETALLE_CIF.findIndex((d:any) => d.ID_PARTE === idParte) === -1 )
        this._sdatos.MATRIZ_DETALLE_CIF.push({ ID_PARTE: idParte, DATA_SOURCE: element });
        
      if ( this._sdatos.MATRIZ_CIF.findIndex((d:any) => d.ID_PARTE === idParte) === -1 ) {
        let cif_fijos:any = [];
        let cif_variables:any = [];
        if ( this.FMatriz.CLASE.match('Producto simple|Parte simple') ) {
          cif_fijos = data.CIF.filter((d:any) => d.TIPO === 'Fijo');
          cif_variables = data.CIF.filter((d:any) => d.TIPO === 'Variable');
        };
        if ( this.FMatriz.CLASE.match('Juego|Producto compuesto|Parte compuesta') ) {
          cif_fijos = data.CIF.filter((d:any) => d.TIPO === 'Fijo' && d.ID_PARTE === idParte);
          cif_variables = data.CIF.filter((d:any) => d.TIPO === 'Variable' && d.ID_PARTE === idParte);
        }

        var totalCifFijo: number = cif_fijos.reduce( (acc:any, item:any) => {
          return acc += item.TOTAL;
        }, 0);
        var totalCifVariables: number = cif_variables.reduce( (acc:any, item:any) => {
          return acc += item.TOTAL;
        }, 0);
        if (this._sdatos.MATRIZ_CIF.length > 0) {
          const item = this._sdatos.MATRIZ_CIF.reduce((ant:any, act:any)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
          index = item.ITEM + 1;
        } else {
          index = 1;
        }

        this._sdatos.MATRIZ_CIF.push(
          {ITEM: index, TIPO: 'CIF FIJO', DESC: 'Fijo', ID_PARTE: idParte, NOMBRE_PARTE: nombre_parte, TOTAL: totalCifFijo, TOTAL_PARTE: totalCifFijo, TIPO_COMPONENTE: 'PARTE', ErrMensaje: 'old'}
        );
        this._sdatos.MATRIZ_CIF.push(
          {ITEM: index + 1, TIPO: 'CIF VARIABLE', DESC: 'Variable',ID_PARTE: idParte, NOMBRE_PARTE: nombre_parte, TOTAL: totalCifVariables, TOTAL_PARTE: totalCifVariables, TIPO_COMPONENTE: 'PARTE', ErrMensaje: 'old'}
        );
        if ( this.FMatriz.CLASE.match('Juego|Producto compuesto|Parte compuesta') ) {
          const cifs = this._sdatos.MATRIZ_CIF.filter((d:any) => d.ID_PARTE === idParte);
          var totalparte: number = cifs.reduce( (acc:any, item:any) => {
            return acc += item.TOTAL;
          }, 0);

          //Consulta la parte y su cantidad para calcular total
          const PARTE:any[] = this._sdatos.DPartes.filter((d:any) => d.ID_PARTE === idParte);
          var T_PARTE:number = 0;
          if (idParte === this._sdatos.D_MATRIZ.PRODUCTO)
            T_PARTE = totalparte * 1;
          else
            T_PARTE = totalparte * PARTE[0].CANTIDAD;
          
          this._sdatos.MATRIZ_CIF.forEach((tipo_cif:any) => {
            if(tipo_cif.ID_PARTE === idParte)
              tipo_cif.TOTAL_PARTE = T_PARTE;
          });

          if (this.mnuAccion === "consulta") {
            const partes:any = this._sdatos.MATRIZ_CIF.filter((d:any) => d.ID_PARTE !== this.FMatriz.PRODUCTO);
            const producto:any = this._sdatos.MATRIZ_CIF.filter((d:any) => d.ID_PARTE === this.FMatriz.PRODUCTO);

            const total_parte:number = partes[0].TOTAL_PARTE;
            const total_producto:number = producto.reduce( (acc:any, item:any) => {
              return acc += item.TOTAL;
            }, 0);

            this.TOTAL_CIF = total_parte + total_producto;
          }

        };
      }
    };
    this._sdatos.setDataTiposCif(this._sdatos.MATRIZ_CIF);

    if ( this.FMatriz.CLASE.match('Producto simple|Parte simple') ) this.clase = 1;
    if ( this.FMatriz.CLASE.match('Juego|Producto compuesto|Parte compuesta') ) this.clase = 2;
    
    this._sdatos.modoGrid = this.modoGridValue;
    // this._sdatos.setModoGrid({
    //   visibleGrupoPartes: true,
    //   modoGridValue: this.modoGridValue
    // });
  }

  loadDataTotales(data:any) {
    this.TOTAL_MATERIALES =  data.TOTAL_MATERIALES;
    this.SUBTOTAL_MA =  data.SUBTOTAL_MA;
    this.PROTECCION_MA =  data.PROTECCION_MA;
    this.TOTAL_GRAVADOS = data.TOTAL_GRAVADOS;
    this.TOTAL_SIN_IVA = data.TOTAL_SIN_IVA;
    this.TOTAL_MANO_OBRA =  data.TOTAL_MO;
    this.SUBTOTAL_MO =  data.SUBTOTAL_MO;
    this.PROTECCION_MO =  data.PROTECCION_MO;
    this.TOTAL_CIF =  data.TOTAL_CIF;
    this.TOTAL_CIF_FIJO =  data.TOTAL_CIF_FIJO;
    this.TOTAL_CIF_VARIABLE =  data.TOTAL_CIF_VARIABLE;
    this.TOTAL_COSTO_DIRECTO =  data.TOTAL_COSTO_DIRECTO;
    this.TOTAL_COSTO =  data.TOTAL_COSTO;
    this.TOTAL_UTILIDAD =  data.UTILIDAD;
    this.PRECIO_BASE = data.PRECIO_BASE,
    this.CON_OPERATIVA = data.CON_OPERATIVA,
    this.TOTAL_PAG =  data.PRECIO_ANTES_GRAV;
    this.TOTAL_GRAVAMENES =  data.GRAVAMENES;
    this.TOTAL_PDG =  data.PRECIO_DESP_GRAV;
    this.TOTAL_AJUSTE_PRECIO =  data.AJUSTE_PRECIO;
    this.TOTAL_MATRIZ =  data.TOTAL;
    this._sdatos.TOTAL_MATERIALES = this.TOTAL_MATERIALES;
    this._sdatos.SUBTOTAL_MA =  this.SUBTOTAL_MA;
    this._sdatos.PROTECCION_MA =  this.PROTECCION_MA;
    this._sdatos.TOTAL_GRAVADOS = this.TOTAL_GRAVADOS;
    this._sdatos.TOTAL_SIN_IVA = this.TOTAL_SIN_IVA;
    this._sdatos.TOTAL_MANO_OBRA = this.TOTAL_MANO_OBRA;
    this._sdatos.SUBTOTAL_MO =  this.SUBTOTAL_MO;
    this._sdatos.PROTECCION_MO =  this.PROTECCION_MO;
    this._sdatos.TOTAL_CIF = this.TOTAL_CIF;
    this._sdatos.TOTAL_CIF_FIJO =  this.TOTAL_CIF_FIJO;
    this._sdatos.TOTAL_CIF_VARIABLE = this.TOTAL_CIF_VARIABLE;
    this._sdatos.TOTAL_COSTO_DIRECTO = this.TOTAL_COSTO_DIRECTO;
    this._sdatos.TOTAL_COSTO = this.TOTAL_COSTO;
    this._sdatos.TOTAL_UTILIDAD = this.TOTAL_UTILIDAD;
    this._sdatos.PRECIO_BASE = this.PRECIO_BASE;
    this._sdatos.CON_OPERATIVA = this.CON_OPERATIVA;
    this._sdatos.TOTAL_PAG = this.TOTAL_PAG;
    this._sdatos.TOTAL_GRAVAMENES = this.TOTAL_GRAVAMENES;
    this._sdatos.TOTAL_PDG = this.TOTAL_PDG;
    this._sdatos.TOTAL_AJUSTE_PRECIO = this.TOTAL_AJUSTE_PRECIO;
    this._sdatos.TOTAL_MATRIZ = this.TOTAL_MATRIZ;
    
    this._sdatos.setTotales({
      GRUPO: 'TOTALES', ACCION: 'CARGAR',
      TOTAL_MATERIALES: this.TOTAL_MATERIALES,
      TOTAL_MANO_OBRA: this.TOTAL_MANO_OBRA,
      TOTAL_COSTO_DIRECTO: this.TOTAL_COSTO_DIRECTO,
      TOTAL_CIF: this.TOTAL_CIF,
      TOTAL_CIF_VARIABLE: this.TOTAL_CIF_VARIABLE,
      TOTAL_CIF_FIJO: this.TOTAL_CIF_FIJO,
      TOTAL_COSTO: this.TOTAL_COSTO,
      TOTAL_UTILIDAD: this.TOTAL_UTILIDAD,
      PRECIO_BASE: this.PRECIO_BASE,
      CON_OPERATIVA: this.CON_OPERATIVA,
      TOTAL_AJUSTE_PRECIO: this.TOTAL_AJUSTE_PRECIO,
      TOTAL_PAG: this.TOTAL_PAG,
      TOTAL_GRAVAMENES: this.TOTAL_GRAVAMENES,
      TOTAL_PDG: this.TOTAL_PDG,
      TOTAL_MATRIZ: this.TOTAL_MATRIZ
    });
    this._sdatos.setTotales({
      GRUPO: 'COSTOS DIRECTOS', ACCION: 'CARGAR',
      TOTAL_MATERIALES: this.TOTAL_MATERIALES,
      SUBTOTAL_MA: this.SUBTOTAL_MA,
      PROTECCION_MA: this.PROTECCION_MA,
      TOTAL_GRAVADOS: this.TOTAL_GRAVADOS,
      TOTAL_SIN_IVA: this.TOTAL_SIN_IVA,
      SUBTOTAL_MO: this.SUBTOTAL_MO,
      PROTECCION_MO: this.PROTECCION_MO,
      TOTAL_MANO_OBRA: this.TOTAL_MANO_OBRA,
      TOTAL_COSTO_DIRECTO: this.TOTAL_COSTO_DIRECTO
    });
  }

  // Vista/Zoom de los datos consultados
  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: "Matriz",
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: ['PRODUCTO|Id Producto','FECHA_CREACION|Fecha de Registro','ESTADO|Estado'],
      Filtro: '',
      keyGrid: ['PRODUCTO']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opEliminar(): void {
    // Confirma...
    Swal.fire({
      title: '',
      text: '',
      html: "¿Desea <b class='fw-bold'>eliminar</b> la Matriz del producto <b class='fw-bold'>" +
            this.FMatriz.PRODUCTO +
            " -- " +
            this.FMatriz.NOMBRE +
            "</b> ?",
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

    // API eliminación de datos
		const prm = { PRODUCTO: this.FMatriz.PRODUCTO };
    this.sData
      .delete('delete',prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'Error');
          return;
        }

        this.opIrARegistro("Eliminado");
        showToast('Matriz eliminada', 'success');
        this.readOnly = true;
        this.readOnlyMargen = true;
        this.readOnlyRutasProductos = true;

        // Operaciones de barra
        this.prmUsrAplBarReg.r_totReg--;
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          error: "",
          accion: 'r_navegar',
          operacion: {}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.opIrARegistro('r_numreg');
    });
  }

  onSelectionProducto(e: any) {
    if (this.mnuAccion.match('new|update')) {
      this._sdatos.conCambios++;
      if (e.selectedRowsData.length > 0){
        this.ValideExistencia(e.selectedRowsData);
      } else {
        this.opBlanquearForma();
        this.esVisibleSelecc = 'none';
        this.visiblePartes = false;
        this.activeItems = false;
        this.readOnlyMargen = true;
        this.readOnlyRutasProductos = true;
      }
    }
	}

  onSelectMargen(e: any) { 
    if (this.mnuAccion.match('new|update')) {
      this._sdatos.conCambios++;
      if ( e.value !== null ) {
        this.FMatriz.MARGEN_RENTABILIDAD = e.value;
        if (this.TOTAL_COSTO > 0)
          this._sdatos.setTotales({GRUPO: 'TOTALES', ACCION: 'CALCULAR' });
          // this.getTotalUtilidad();
      } else {
        this.FMatriz.MARGEN_RENTABILIDAD = 0;
      }
    }
    if(this.FMatriz.RUTAS !== '' && this.FMatriz.RUTAS !== null)
      this.onRowValidating(this.FMatriz);
  }

  onValueChangedRuta(e:any) {
    if (this.mnuAccion.match('new|update')) {
      if (e.value === null ||e.value === undefined || e.value.length === 0) {
        this.TOTAL_MATERIALES = 0;
        this.PROTECCION_MA = 0;
        this.SUBTOTAL_MA = 0;
        this.TOTAL_MANO_OBRA = 0;
        this.PROTECCION_MO = 0;
        this.SUBTOTAL_MO = 0;
        this.TOTAL_COSTO_DIRECTO = 0;
        this.TOTAL_CIF = 0;
        this.TOTAL_COSTO = 0;
        this.TOTAL_UTILIDAD = 0;
        this.PRECIO_BASE = 0;
        this.CON_OPERATIVA = 0;
        this.TOTAL_PAG = 0;
        this.TOTAL_GRAVAMENES = 0;
        this.TOTAL_PDG = 0;
        this.TOTAL_AJUSTE_PRECIO = 0;
        this.TOTAL_MATRIZ = 0;
        this._sdatos.TOTAL_MATERIALES = 0;
        this._sdatos.PROTECCION_MA = 0;
        this._sdatos.SUBTOTAL_MA = 0;
        this._sdatos.TOTAL_MANO_OBRA = 0;
        this._sdatos.PROTECCION_MO = 0;
        this._sdatos.SUBTOTAL_MO = 0;
        this._sdatos.TOTAL_COSTO_DIRECTO = 0;
        this._sdatos.TOTAL_CIF = 0;
        this._sdatos.TOTAL_COSTO = 0;
        this._sdatos.TOTAL_UTILIDAD = 0;
        this._sdatos.PRECIO_BASE = 0;
        this._sdatos.CON_OPERATIVA = 0;
        this._sdatos.TOTAL_PAG = 0;
        this._sdatos.TOTAL_GRAVAMENES = 0;
        this._sdatos.TOTAL_PDG = 0;
        this._sdatos.TOTAL_AJUSTE_PRECIO = 0;
        this._sdatos.TOTAL_MATRIZ = 0;
        this._sdatos.TOTAL_MATRIZ = 0;
        this._sdatos.DGSECCIONES_MATERIALES = [];
        this._sdatos.MATRIZ_DETALLE_MATERIALES = [];
        this._sdatos.DGSECCIONES_MANO_OBRA = [];
        this._sdatos.MATRIZ_DETALLE_MANO_OBRA = [];
        this._sdatos.MATRIZ_CIF = [];
        this._sdatos.MATRIZ_DETALLE_CIF = [];
      } else {
        this.onSelectionRuta(e);
      }
    }
  }

  onSelectionRuta(e:any) {
    this._sdatos.conCambios++;
    if ( e.value.length !== 0 ) {
      this.activeItems = false;
      this.FMatriz.RUTAS = e.value[0];
      const infoSeccion:any = this.DRutasProductos.filter((d:any) => d.ID_RUTA === e.value[0]);
      this._sdatos.DESCRIPCION_RUTA = infoSeccion[0].INFO;
      this._sdatos.MATRIZ_CIF = this._sdatos.MATRIZ_CIF.length > 0 ? this._sdatos.MATRIZ_CIF : JSON.parse(JSON.stringify(this.TipoCIF));
      switch (this.FMatriz.CLASE) {
        case 'Parte simple':
        case 'Producto simple':
          this.DataGridSeccion = infoSeccion[0].SECCIONES;
          this.DataGridSeccion.forEach((secc:any) => {
            if(secc.GRAVADOS === undefined || secc.GRAVADOS === null)
              secc.GRAVADOS = 0;
            if(secc.EXCLUIDOS === undefined || secc.EXCLUIDOS === null)
              secc.EXCLUIDOS = 0;
            if(secc.PROTECCION === undefined || secc.PROTECCION === null)
              secc.PROTECCION = 0;
            if(secc.SUBTOTAL === undefined || secc.SUBTOTAL === null)
              secc.SUBTOTAL = 0;
          });
          this.TipoCIF.forEach((cif:any) => {
            cif.ID_PARTE = this.FMatriz.PRODUCTO;
          });
          this._sdatos.DGSECCIONES_MATERIALES = JSON.parse(JSON.stringify(this.DataGridSeccion.filter((d:any) => d.ASIGNABLE_MATERIALES === true) ));
          this._sdatos.DGSECCIONES_MANO_OBRA = JSON.parse(JSON.stringify(this.DataGridSeccion.filter((d:any) => d.ASIGNABLE_MO === true) ));
          break;

        case 'Juego':
        case 'Producto compuesto':
        case 'Parte compuesta':
          const newData:any = JSON.parse(infoSeccion[0].SECCIONES);
          this.DataGridSeccion = newData;
          this.DataGridSeccion.forEach((secc:any) => {
            if(secc.GRAVADOS === undefined || secc.GRAVADOS === null)
              secc.GRAVADOS = 0;
            if(secc.EXCLUIDOS === undefined || secc.EXCLUIDOS === null)
              secc.EXCLUIDOS = 0;
            if(secc.PROTECCION === undefined || secc.PROTECCION === null)
              secc.PROTECCION = 0;
            if(secc.SUBTOTAL === undefined || secc.SUBTOTAL === null)
              secc.SUBTOTAL = 0;
          });
          this._sdatos.SECCIONES_RUTA_SELECCIONADA = JSON.parse(JSON.stringify(this.DataGridSeccion));
          break;
      
        default:
          break;
      }

      this.onRowValidating(this.FMatriz);
      if(e.previousValue.length > 0 )
        this._sdatos.setRefresh(true);
    } else {
      this.FMatriz.RUTAS = '';
      this.clase = 1;
      this.activeItems = false;
      this.TOTAL_MATERIALES = 0;
      this.PROTECCION_MA = 0;
      this.SUBTOTAL_MA = 0;
      this.TOTAL_MANO_OBRA = 0;
      this.PROTECCION_MO = 0;
      this.SUBTOTAL_MO = 0;
      this.TOTAL_COSTO_DIRECTO = 0;
      this.TOTAL_CIF = 0;
      this.TOTAL_COSTO = 0;
      this.TOTAL_UTILIDAD = 0;
      this.PRECIO_BASE = 0;
      this.CON_OPERATIVA = 0;
      this.TOTAL_PAG = 0;
      this.TOTAL_GRAVAMENES = 0;
      this.TOTAL_PDG = 0;
      this.TOTAL_AJUSTE_PRECIO = 0;
      this.TOTAL_MATRIZ = 0;
      this._sdatos.TOTAL_MATERIALES = 0;
      this._sdatos.PROTECCION_MA = 0;
      this._sdatos.SUBTOTAL_MA = 0;
      this._sdatos.TOTAL_MANO_OBRA = 0;
      this._sdatos.PROTECCION_MO = 0;
      this._sdatos.SUBTOTAL_MO = 0;
      this._sdatos.TOTAL_COSTO_DIRECTO = 0;
      this._sdatos.TOTAL_CIF = 0;
      this._sdatos.TOTAL_COSTO = 0;
      this._sdatos.TOTAL_UTILIDAD = 0;
      this._sdatos.PRECIO_BASE = 0;
      this._sdatos.CON_OPERATIVA = 0;
      this._sdatos.TOTAL_PAG = 0;
      this._sdatos.TOTAL_GRAVAMENES = 0;
      this._sdatos.TOTAL_PDG = 0;
      this._sdatos.TOTAL_AJUSTE_PRECIO = 0;
      this._sdatos.TOTAL_MATRIZ = 0;
      this._sdatos.TOTAL_MATRIZ = 0;
      this._sdatos.DGSECCIONES_MATERIALES = [];
      this._sdatos.MATRIZ_DETALLE_MATERIALES = [];
      this._sdatos.DGSECCIONES_MANO_OBRA = [];
      this._sdatos.MATRIZ_DETALLE_MANO_OBRA = [];
      this._sdatos.MATRIZ_CIF = [];
      this._sdatos.MATRIZ_DETALLE_CIF = [];
    }
    this.openRutas = false;
  }

  refreshComponent() {
    this._sdatos.setRefresh(true);
    this.TOTAL_MATERIALES =  0;
    this.SUBTOTAL_MA =  0;
    this.PROTECCION_MA =  0;
    this.TOTAL_SIN_IVA = 0;
    this.TOTAL_MANO_OBRA =  0;
    this.SUBTOTAL_MO =  0;
    this.PROTECCION_MO =  0;
    this.TOTAL_CIF =  0;
    this.TOTAL_COSTO_DIRECTO =  0;
    this.TOTAL_COSTO =  0;
    this.TOTAL_UTILIDAD =  0;
    this.PRECIO_BASE = 0;
    this.CON_OPERATIVA = 0;
    this.TOTAL_PAG =  0;
    this.TOTAL_GRAVAMENES =  0;
    this.TOTAL_PDG =  0;
    this.TOTAL_AJUSTE_PRECIO =  0;
    this.TOTAL_MATRIZ =  0;
    this._sdatos.SUBTOTAL_MA = this.SUBTOTAL_MA;
    this._sdatos.PROTECCION_MA = this.PROTECCION_MA ;
    this._sdatos.TOTAL_MATERIALES = this.TOTAL_MATERIALES;
    this._sdatos.PROTECCION_MO = this.PROTECCION_MO;
    this._sdatos.SUBTOTAL_MO = this.SUBTOTAL_MO;
    this._sdatos.TOTAL_MANO_OBRA = this.TOTAL_MANO_OBRA;
    this._sdatos.TOTAL_COSTO_DIRECTO = this.TOTAL_COSTO_DIRECTO;
    this._sdatos.TOTAL_CIF = this.TOTAL_CIF;
    this._sdatos.TOTAL_COSTO = this.TOTAL_COSTO;
    this._sdatos.TOTAL_UTILIDAD = this.TOTAL_UTILIDAD;
    this._sdatos.PRECIO_BASE = this.PRECIO_BASE;
    this._sdatos.CON_OPERATIVA = this.CON_OPERATIVA;
    this._sdatos.TOTAL_PAG = this.TOTAL_PAG;
    this._sdatos.TOTAL_GRAVAMENES = this.TOTAL_GRAVAMENES;
    this._sdatos.TOTAL_PDG = this.TOTAL_PDG;
    this._sdatos.TOTAL_AJUSTE_PRECIO = this.TOTAL_AJUSTE_PRECIO;
    this._sdatos.TOTAL_MATRIZ = this.TOTAL_MATRIZ;
    this._sdatos.setTotales({ 
      GRUPO: 'TOTALES', ACCION: 'CARGAR',
      TOTAL_MATERIALES: this.TOTAL_MATERIALES,
      SUBTOTAL_MA: this.SUBTOTAL_MA,
      PROTECCION_MA: this.PROTECCION_MA,
      TOTAL_GRAVADOS: this.TOTAL_GRAVADOS,
      TOTAL_SIN_IVA: this.TOTAL_SIN_IVA,
      SUBTOTAL_MO: this.SUBTOTAL_MO,
      PROTECCION_MO: this.PROTECCION_MO,
      TOTAL_MANO_OBRA: this.TOTAL_MANO_OBRA,
      TOTAL_COSTO_DIRECTO: this.TOTAL_COSTO_DIRECTO,
      TOTAL_CIF: this.TOTAL_CIF,
      TOTAL_CIF_VARIABLE: this.TOTAL_CIF_VARIABLE,
      TOTAL_CIF_FIJO: this.TOTAL_CIF_FIJO,
      TOTAL_COSTO: this.TOTAL_COSTO,
      TOTAL_UTILIDAD: this.TOTAL_UTILIDAD,
      PRECIO_BASE: this.PRECIO_BASE,
      CON_OPERATIVA: this.CON_OPERATIVA,
      TOTAL_AJUSTE_PRECIO: this.TOTAL_AJUSTE_PRECIO,
      TOTAL_PAG: this.TOTAL_PAG,
      TOTAL_GRAVAMENES: this.TOTAL_GRAVAMENES,
      TOTAL_PDG: this.TOTAL_PDG,
      TOTAL_MATRIZ: this.TOTAL_MATRIZ
    });
    this.getDataTotales = ({
      TOTAL_MATERIALES: this.TOTAL_MATERIALES,
      SUBTOTAL_MA: this.SUBTOTAL_MA,
      PROTECCION_MA: this.PROTECCION_MA,
      TOTAL_SIN_IVA: this.TOTAL_SIN_IVA,
      TOTAL_GRAVADOS: this.TOTAL_GRAVADOS,
      TOTAL_MANO_OBRA: this.TOTAL_MANO_OBRA,
      SUBTOTAL_MO: this.SUBTOTAL_MO,
      PROTECCION_MO: this.PROTECCION_MO
    });
  }

  onValueChangedModo(e: any) {
    if ( (this.readOnly === false) && (e.value === 'Consolidado') ) {
      showToast('No puede usar el modo Consolidado al Editar una Matriz', 'error');
      if ( this.FMatriz.CLASE.match('Producto simple|Parte simple') ) {
        this.modoGridValue = 'Por Secciones';
        this._sdatos.modoGrid = this.modoGridValue;
      }
      if ( this.FMatriz.CLASE.match('Juego|Producto compuesto|Parte compuesta') ) {
        this.modoGridValue = 'Por Partes';
        this._sdatos.modoGrid = this.modoGridValue;
      }
    } else {
      let visible: any = false;
      if ( e.value === 'Por Partes') visible = true;
      this._sdatos.modoGrid = e.value;
      this._sdatos.setModoGrid({
        visibleGrupoPartes: visible,
        modoGridValue: e.value
      });
    }
	}

  // Valide unicidad de la llave
  async ValideExistencia(e: any) {
    this.openProductos = false;
    let isValid: boolean = true;
    if (this.readOnly || !this.mnuAccion.match('new|update')) {
      isValid = false;
    }
    if (this.mnuAccion === 'update' && this.data_prev.PRODUCTO === e[0].PRODUCTO) {
      isValid = false;
    }

    if ( isValid ) {

      if (this.FMatriz.CLASE !== '' &&
          this.FMatriz.CLASE !== e[0].CLASE ||
          this._sdatos.MATRIZ_DETALLE_MATERIALES.length > 0 ||
          this._sdatos.MATRIZ_DETALLE_MANO_OBRA.length > 0 ||
          this._sdatos.MATRIZ_DETALLE_CIF.length > 0
      ) {
        let msj:string = '';
        if(this._sdatos.MATRIZ_DETALLE_MATERIALES.length > 0) msj = msj+'Materiales, ';
        if(this._sdatos.MATRIZ_DETALLE_MANO_OBRA.length > 0) msj = msj+'Mano de Obra, ';
        if(this._sdatos.MATRIZ_DETALLE_CIF.length > 0) msj = msj+'CIF, ';

        await Swal.fire({
          title: '¡ADVERTENCIA!',
          text: 'El producto seleccionado pertenece a una clase diferente, se perderan los datos registrados de '+ msj +'si cambia el producto seleccionado. ¿Desea continuar?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#0F4C81',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, continuar'
        }).then((result) => {
          if (result.isConfirmed) {
            isValid = true;
          }
          if (result.isDismissed) {
            this.dropSelectProducto.instance.option('value',this.FMatriz.PRODUCTO);
            // this.cdr.detectChanges();
            isValid = false;
          }
        });
      }
      
      // Valida la existencia de la llave respectiva
      const prm = { PRODUCTO: e[0].PRODUCTO };
      const apiRest = this.sData.validellave('EXISTE MATRIZ',prm,'PRO019');
      let res = await lastValueFrom(apiRest, {defaultValue: true});
      res = JSON.parse(res.data);
      if (res[0].ErrMensaje === '') {
        this.readOnlyMargen = false;
        // this.readOnlyRutasProductos = false;
        this.valoresObjetos('rutas', e[0]);
        this.FMatriz.PRODUCTO = e[0].PRODUCTO;
        this.FMatriz.CLASE = e[0].CLASE;
        this.FMatriz.RUTAS = e[0].ID_RUTA;
        this.FMatriz.NOMBRE = e[0].NOMBRE;
        this.FMatriz.ETAPA = e[0].ETAPA;
        this.FMatriz.PERFIL_TRIBUTARIO = e[0].PERFIL_TRIBUTARIO;
        this.FMatriz.PORCENTAJE = e[0].PORCENTAJE;
        this.selectProducto = [this.FMatriz.PRODUCTO];
        // this.selectRutasProductos = [this.FMatriz.RUTAS];
  
        if (this.FMatriz.PERFIL_TRIBUTARIO === '') {
          showToast('Debe asignar un Perfil Tributario al Producto.', 'warning');
          this.onRowValidating(this.FMatriz);
        }
  
        if (this.FMatriz.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
          this.clase = 2;
          // this.items = ['PRODUCTOS / PARTES', 'COSTOS DIRECTOS', 'COSTOS INDIRECTOS', 'TOTAL COSTOS'];
          this.items = ['COSTOS DIRECTOS', 'COSTOS INDIRECTOS', 'TOTAL COSTOS'];
          this.modoGrid = ['Por Partes','Por Secciones','Consolidado'];
          this.modoGridValue = 'Por Partes';
          this._sdatos.modoGrid = this.modoGridValue;
        }
        if (this.FMatriz.CLASE.match('Producto simple|Parte simple')) {
          this.clase = 1;
          this.items = ['COSTOS DIRECTOS', 'COSTOS INDIRECTOS', 'TOTAL COSTOS'];
          this.modoGrid= ['Por Secciones','Consolidado'];
          this.modoGridValue = 'Por Secciones';
          this._sdatos.modoGrid = this.modoGridValue;
        }
        this.valoresObjetos('todos', '');
        this._sdatos.conCambios++;
        // return true;
      } else {
        showToast(res[0].ErrMensaje, 'error');
        this.opBlanquearForma();
      }
      
    }

  }

  getMatrizSimple() {
    const prm = {PRODUCTO: this.FMatriz.PRODUCTO};
    this.sData.getMatrizSimple('CONSULTA MATRIZ SIMPLE', prm).subscribe((data: any) => {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      const mensaje = res[0].ErrMensaje;
      if (mensaje !== '') {
        showToast(mensaje, 'error');
      } else {
        let SECCIONES_MATERIALES: any = [];
        let SECCIONES_MO: any = [];
        let TIPOS_CIF: any = [];
        let MATERIALES: any = [];
        let MO: any = [];
        let CIF: any = [];
        let data_materiales: any = [];
        let data_mo: any = [];
        let data_cif: any = [];
        let total_ajuste_precio: any = 0;
        let total_precio_base: any = 0;
        let total_con_operativa: any = 0;
        let total_gravamenes: any = 0;
        let total_pag: any = 0;
        let total_pdg: any = 0;
        let total_matriz: any = 0;
        let total_cif: any = 0;
        let total_cif_fijo: any = 0;
        let total_cif_variable: any = 0;
        let total_costo: any = 0;
        let total_costo_directo: any = 0;
        let total_materiales: any = 0;
        let subtotal_ma: any = 0;
        let proteccion_ma: any = 0;
        let total_gravados: any = 0;
        let total_sin_iva: any = 0;
        let total_mo: any = 0;
        let subtotal_mo: any = 0;
        let proteccion_mo: any = 0;
        let total_utilidad: any = 0;
        for (let i = 0; i < res.length; i++) {
          MATERIALES = JSON.parse(JSON.stringify(res[i].MATERIALES));
          MO = JSON.parse(JSON.stringify(res[i].MANO_OBRA));
          CIF = JSON.parse(JSON.stringify(res[i].CIF));

          //Consulta la parte y su cantidad para calcular total
          const PARTE:any[] = this._sdatos.DPartes.filter((d:any) => d.ID_PARTE === res[i].ID_PARTE);

          if (MATERIALES !== null && MATERIALES !== undefined && MATERIALES !== '') {
            for (let k = 0; k < MATERIALES.length; k++) {
              data_materiales.push(MATERIALES[k]);
              const element = res[i].SECCIONES.filter((d:any) => d.ID_SECCION === MATERIALES[k].ID_SECCION);
              let conGravados:number = 0;
              let conExcluidos:number = 0;
              if (MATERIALES[k].PORCENTAJE === 0) {
                conExcluidos = MATERIALES[k].PORCENTAJE * MATERIALES[k].TOTAL;
              } else {
                conGravados = MATERIALES[k].PORCENTAJE * MATERIALES[k].TOTAL;
              }

              const data = { 
                ...element[0],
                ID_PARTE: res[i].ID_PARTE,
                NOMBRE_PARTE: res[i].NOMBRE_PARTE,
                ID_RUTA: res[i].ID_RUTA,
                DESCRIPCION_RUTA: res[i].DESCRIPCION_RUTA,
                SUBTOTAL: MATERIALES[k].SUB_TOTAL,
                FACTOR_MA: MATERIALES[k].FACTOR_MA,
                PROTECCION: MATERIALES[k].PROTECCION,
                TOTAL_PARTE: (res[i].TOTAL_MATERIALES * PARTE[0].CANTIDAD),
                GRAVADOS: conGravados,
                EXCLUIDOS: conExcluidos,
                TIPO: 'PARTE',
                ErrMensaje: 'old'
              }
              if ( SECCIONES_MATERIALES.findIndex((d:any) => d.ID_SECCION === data.ID_SECCION) === -1 ) {
                SECCIONES_MATERIALES.push(data);
              } else if ( SECCIONES_MATERIALES.findIndex((d:any) => (d.ID_PARTE === data.ID_PARTE) && (d.ID_SECCION === data.ID_SECCION) ) === -1 ) {
                SECCIONES_MATERIALES.push(data);
              };
            }
          }
          if (MO !== undefined && MO !== null && MO !== '') {
            for (let j = 0; j < MO.length; j++) {
              data_mo.push(MO[j]);
              const element = res[i].SECCIONES.filter((d:any) => d.ID_SECCION === MO[j].ID_SECCION);
              const data = {
                ...element[0],
                ID_PARTE: res[i].ID_PARTE,
                NOMBRE_PARTE: res[i].NOMBRE_PARTE,
                ID_RUTA: res[i].ID_RUTA,
                DESCRIPCION_RUTA: res[i].DESCRIPCION_RUTA,
                SUBTOTAL: MO[j].SUB_TOTAL,
                FACTOR_MOD: MO[j].FACTOR_MOD,
                PROTECCION: MO[j].PROTECCION,
                TOTAL_PARTE: (res[i].TOTAL_MO * PARTE[0].CANTIDAD),
                TIPO: 'PARTE',
                ErrMensaje: 'old'
              }
              if ( SECCIONES_MO.findIndex((d:any) => d.ID_SECCION === data.ID_SECCION) === -1 ) {
                SECCIONES_MO.push(data);
              } else if ( SECCIONES_MO.findIndex((d:any) => (d.ID_PARTE === data.ID_PARTE) && (d.ID_SECCION === data.ID_SECCION) ) === -1 ) {
                SECCIONES_MO.push(data);
              }
            };
          }
          if (CIF !== null && CIF !== undefined && CIF !== '') {
            for (let h = 0; h < CIF.length; h++) {
              data_cif.push(CIF[h]);
              const element = JSON.parse(JSON.stringify(this.TipoCIF.filter((d:any) => d.DESC === CIF[h].TIPO)));
              if ( element[0].TIPO === 'CIF FIJO' )
                element[0].TOTAL = res[i].TOTAL_CIF_FIJO;
              if ( element[0].TIPO === 'CIF VARIABLE' )
                element[0].TOTAL = res[i].TOTAL_CIF_VARIABLE;
              if (TIPOS_CIF.length > 0) {
                const item = TIPOS_CIF.reduce((ant:any, act:any)=>{return (ant.ITEM > act.ITEM) ? ant : act});
                element[0].ITEM = item.ITEM + 1;
              } else {
                element[0].ITEM = 1;
              }
              const data = {
                ...element[0],
                ID_PARTE: res[i].ID_PARTE,
                NOMBRE_PARTE: res[i].NOMBRE_PARTE,
                TOTAL_PARTE: (res[i].TOTAL_CIF * PARTE[0].CANTIDAD),
                TIPO_COMPONENTE: 'PARTE',
                ErrMensaje: 'old'
              }
              if ( TIPOS_CIF.findIndex((d:any) => d.ID_PARTE === data.ID_PARTE) === -1 ) {
                TIPOS_CIF.push(data);
              } else if ( TIPOS_CIF.findIndex((d:any) => (d.ID_PARTE === data.ID_PARTE) && (d.TIPO === data.TIPO) ) === -1 ) {
                TIPOS_CIF.push(data);
              }
            };
          }
          
          subtotal_ma = (res[i].SUBTOTAL_MA * PARTE[0].CANTIDAD) + subtotal_ma;
          proteccion_ma = (res[i].PROTECCION_MA * PARTE[0].CANTIDAD) + proteccion_ma;
          total_materiales = (res[i].TOTAL_MATERIALES * PARTE[0].CANTIDAD) + total_materiales;
          total_gravados = res[i].TOTAL_GRAVADOS + total_gravados;
          total_sin_iva = res[i].TOTAL_SIN_IVA + total_sin_iva;

          subtotal_mo = (res[i].SUBTOTAL_MO * PARTE[0].CANTIDAD) + subtotal_mo;
          proteccion_mo = (res[i].PROTECCION_MO * PARTE[0].CANTIDAD) + proteccion_mo;
          total_mo = (res[i].TOTAL_MO * PARTE[0].CANTIDAD) + total_mo;
          
          total_costo_directo = (res[i].TOTAL_COSTO_DIRECTO * PARTE[0].CANTIDAD) + total_costo_directo;
          
          total_cif_fijo = (res[i].TOTAL_CIF_FIJO * PARTE[0].CANTIDAD) + total_cif_fijo;
          total_cif_variable = (res[i].TOTAL_CIF_VARIABLE * PARTE[0].CANTIDAD) + total_cif_variable;
          total_cif = (res[i].TOTAL_CIF * PARTE[0].CANTIDAD) + total_cif;
          
          total_costo = (res[i].TOTAL_COSTO * PARTE[0].CANTIDAD) + total_costo;
          total_pag = (res[i].PRECIO_ANTES_GRAV * PARTE[0].CANTIDAD) + total_pag;
          total_gravamenes = (res[i].GRAVAMENES * PARTE[0].CANTIDAD) + total_gravamenes;
          total_pdg = (res[i].PRECIO_DESP_GRAV * PARTE[0].CANTIDAD) + total_pdg;
          total_precio_base = (res[i].PRECIO_BASE * PARTE[0].CANTIDAD) + total_precio_base;
          total_con_operativa = (res[i].CON_OPERATIVA * PARTE[0].CANTIDAD) + total_con_operativa;
          total_matriz = (res[i].TOTAL * PARTE[0].CANTIDAD) + total_matriz;
        };
        
        if(this.MATERIALES_PRODUCTO.length > 0) {
          this.MATERIALES_PRODUCTO.forEach((element:any) => {
            element.ID_PARTE = this.FMatriz.PRODUCTO;
            element.NOMBRE_PARTE = this.FMatriz.NOMBRE;
            element.ID_RUTA = this.FMatriz.RUTAS;
            element.DESCRIPCION_RUTA = this._sdatos.DESCRIPCION_RUTA;
            element.TIPO = 'PRODUCTO';
            element.ErrMensaje ='old';
            element.TOTAL_PARTE = this.MATERIALES_PRODUCTO.reduce( (acc:any, item:any) => {
              return acc += item.TOTAL;
            }, 0);
            data_materiales.push(element);
            // SECCIONES_MATERIALES.push(element);
          });
        };
        
        if(this.MO_PRODUCTO.length > 0) {
          this.MO_PRODUCTO.forEach((element:any) => {
            element.ID_PARTE = this.FMatriz.PRODUCTO;
            element.NOMBRE_PARTE = this.FMatriz.NOMBRE;
            element.ID_RUTA = this.FMatriz.RUTAS;
            element.DESCRIPCION_RUTA = this._sdatos.DESCRIPCION_RUTA;
            element.TIPO = 'PRODUCTO';
            element.ErrMensaje ='old';
            element.TOTAL_PARTE = this.MO_PRODUCTO.reduce( (acc:any, item:any) => {
              return acc += item.TOTAL;
            }, 0);
            data_mo.push(element);
            // SECCIONES_MO.push(element);
          });
        };

        if(this.CIF_PRODUCTO.length > 0) {
          this.CIF_PRODUCTO.forEach((element:any) => {
            element.ID_PARTE = this.FMatriz.PRODUCTO;
            element.NOMBRE_PARTE = this.FMatriz.NOMBRE;
            element.TIPO_COMPONENTE = 'PRODUCTO';
            element.ErrMensaje ='old';
            element.TOTAL_PARTE = this.CIF_PRODUCTO.reduce( (acc:any, item:any) => {
              return acc += item.TOTAL;
            }, 0);
            data_cif.push(element);
          });

          const cif_fijos = this.CIF_PRODUCTO.filter((d:any) => d.TIPO === "Fijo");
          const cif_variables = this.CIF_PRODUCTO.filter((d:any) => d.TIPO === "Variable");

          var totalCIF_fijos = cif_fijos.reduce( (acc:any, item:any) => {
            return acc += item.TOTAL;
          }, 0);
          var totalCIF_variables = cif_variables.reduce( (acc:any, item:any) => {
            return acc += item.TOTAL;
          }, 0);
          var total_parte = this.CIF_PRODUCTO.reduce( (acc:any, item:any) => {
            return acc += item.TOTAL;
          }, 0);
          
          var index:number = 0;
          if (TIPOS_CIF.length > 0) {
            const item = TIPOS_CIF.reduce((ant:any, act:any)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
            index = item.ITEM + 1;
          } else {
            index = 1;
          }
          TIPOS_CIF.push(
            { ITEM: index,
              TIPO: 'CIF FIJO',
              DESC: 'Fijo',
              ID_PARTE: this.CIF_PRODUCTO[0].ID_PARTE,
              NOMBRE_PARTE: this.CIF_PRODUCTO[0].NOMBRE_PARTE,
              TOTAL: totalCIF_fijos,
              TOTAL_PARTE: total_parte,
              TIPO_COMPONENTE: 'PRODUCTO',
              ErrMensaje: 'new'
            }
          );
          TIPOS_CIF.push(
            { ITEM: index + 1,
              TIPO: 'CIF VARIABLE',
              DESC: 'Variable',
              ID_PARTE: this.CIF_PRODUCTO[0].ID_PARTE,
              NOMBRE_PARTE: this.CIF_PRODUCTO[0].NOMBRE_PARTE,
              TOTAL: totalCIF_variables,
              TOTAL_PARTE: total_parte,
              TIPO_COMPONENTE: 'PRODUCTO',
              ErrMensaje: 'new'
            }
          );
        };

        const data_totales: any [] = [{
          TOTAL_MATERIALES: total_materiales,
          SUBTOTAL_MA: subtotal_ma,
          PROTECCION_MA: proteccion_ma,
          TOTAL_GRAVADOS: total_gravados,
          TOTAL_SIN_IVA: total_sin_iva,
          TOTAL_MO: total_mo,
          SUBTOTAL_MO: subtotal_mo,
          PROTECCION_MO: proteccion_mo,
          TOTAL_CIF: total_cif,
          TOTAL_CIF_FIJO: total_cif_fijo,
          TOTAL_CIF_VARIABLE: total_cif_variable,
          TOTAL_COSTO_DIRECTO: total_costo_directo,
          TOTAL_COSTO: total_costo,
          UTILIDAD: total_utilidad,
          PRECIO_BASE: total_precio_base,
          CON_OPERATIVA: total_con_operativa,
          PRECIO_ANTES_GRAV: total_pag,
          GRAVAMENES: total_gravamenes,
          PRECIO_DESP_GRAV: total_pdg,
          AJUSTE_PRECIO: total_ajuste_precio,
          TOTAL: total_matriz
        }];
        const data_grids: any [] = [{
          MATERIALES: data_materiales,
          MANO_OBRA: data_mo,
          CIF: data_cif
        }];
        this.TipoCIF = TIPOS_CIF;
        this._sdatos.DGSECCIONES_MATERIALES = JSON.parse(JSON.stringify(SECCIONES_MATERIALES));
        this._sdatos.DGSECCIONES_MANO_OBRA = JSON.parse(JSON.stringify(SECCIONES_MO));
        this._sdatos.MATRIZ_CIF = JSON.parse(JSON.stringify(TIPOS_CIF));
        this.loadDataGrids(data_grids[0], 'matriz simple');
        this.loadDataTotales(data_totales[0]);
        this.setTotalesSecciones('');
        // this.onRowValidating(this.FMatriz);
      };
    },
      (err => {
        this.showModal(err.message, 'Error');
      })
    );
  }

  getSelectProductos(e: any) {
    const prm = ({ PRODUCTO: e[0].PRODUCTO, CLASE: e[0].CLASE, ID_RUTA: e[0].ID_RUTA });
    this.sData.getSelectProductos(e[0].ACCION, prm).subscribe((data) => {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      if (res[0].ErrMensaje !== '' && res[0].ErrMensaje !== 'VALIDO') {
        this.showModal(res[0].ErrMensaje, 'Error');
      }
      else {
        this.listaConfigData = res;
        this.visibleListaConfig = true;
      }
    });
  }

  showVistaRutas(e:any, cellInfo:any) {
    if((cellInfo.data !== undefined) && (cellInfo.data !== null) && (cellInfo.data !== '')) {
      this._service.setObs_VisorRutas({ TITULO: 'Vista de Ruta',
                                        VISIBLE: true,
                                        DATO: cellInfo.data.ID_RUTA,
                                        ID_APLICACION: this.prmUsrAplBarReg.aplicacion 
                                      });
    } else {
      this._service.setObs_VisorRutas({ TITULO: 'Vista de Ruta',
                                        VISIBLE: true,
                                        DATO: cellInfo[0],
                                        ID_APLICACION: this.prmUsrAplBarReg.aplicacion 
                                      });
    };
  }

  saveCopyData(e:any) {
    this.visibleListaConfig = false;
    
    this.mnuAccion = "new";
    this._sdatos.accion = 'nuevo';
    this.opPrepararModificar();

    this.FMatriz.PRODUCTO = e.PRODUCTO;
    this.FMatriz.NOMBRE = e.NOMBRE;
    this.FMatriz.CLASE = e.CLASE;
    this.FMatriz.ETAPA = e.ETAPA;
    this.FMatriz.PERFIL_TRIBUTARIO = e.PERFIL_TRIBUTARIO;
    this.FMatriz.PORCENTAJE = e.PORCENTAJE;
    this.selectProducto = [ this.FMatriz.PRODUCTO ];
    this.selectRutasProductos = [ this.FMatriz.RUTAS ]

    this._sdatos.MATRIZ_DETALLE_MATERIALES.forEach((mate:any) => {
      mate.DATA_SOURCE.forEach((mat:any) => {
        if (mat.ID_PARTE !== undefined && mat.ID_PARTE !== null) 
          mat.ID_PARTE = this.FMatriz.PRODUCTO;
        if (mat.NOMBRE_PARTE !== undefined && mat.NOMBRE_PARTE !== null)
          mat.NOMBRE_PARTE = this.FMatriz.NOMBRE;
      });
    });
    this._sdatos.MATRIZ_DETALLE_MANO_OBRA.forEach((mo:any) => {
      mo.DATA_SOURCE.forEach((mano:any) => {
        if (mano.ID_PARTE !== undefined && mano.ID_PARTE !== null)
          mano.ID_PARTE = this.FMatriz.PRODUCTO;
        if (mano.NOMBRE_PARTE !== undefined && mano.NOMBRE_PARTE !== null)
          mano.NOMBRE_PARTE = this.FMatriz.NOMBRE;
      });
    });
    this._sdatos.MATRIZ_DETALLE_CIF.forEach((ele:any) => {
      if (ele.ID_PARTE !== undefined && ele.ID_PARTE !== null)
        ele.ID_PARTE = this.FMatriz.PRODUCTO;
      ele.DATA_SOURCE.forEach((ite:any) => {
        if (ele.ID_PARTE !== undefined && ele.ID_PARTE !== null)
          ele.ID_PARTE = this.FMatriz.PRODUCTO;
        if (ele.NOMBRE_PARTE !== undefined && ele.NOMBRE_PARTE !== null)
          ele.NOMBRE_PARTE = this.FMatriz.NOMBRE;
      });
    });
    this._sdatos.MATRIZ_CIF.forEach((item:any) => {
      if (item.ID_PARTE !== undefined && item.ID_PARTE !== null)
        item.ID_PARTE = this.FMatriz.PRODUCTO;
      if (item.NOMBRE_PARTE !== undefined && item.NOMBRE_PARTE !== null)
        item.NOMBRE_PARTE = this.FMatriz.NOMBRE;
    });

  }

  cancelCopyData(e:any) {
    this.visibleListaConfig = false;
    this.prmUsrAplBarReg.accion = 'r_cancelar';
    this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, condicion: any){
    
    if (obj === 'productos' || obj === 'todos') {
      const prm = { };
      this.sData.getProductos('PRODUCTOS MATRIZ', prm).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje != '') {
          this.showModal(mensaje, 'Error');
        }
        else {
          this.DGProductos = newArray;
        };
      },
        (err => {
          this.showModal(err.message, 'Error');
        })
      );
    }
    if (obj === 'rutas') {
      const prm = { PRODUCTO: condicion.PRODUCTO, CLASE: condicion.CLASE !== undefined ? condicion.CLASE : condicion.DAT_PRO[0].CLASE, ID_RUTA: condicion.ID_RUTA };
      this.sData.getRutasProductos('RUTA PRODUCTO', prm).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje != '') {
          this.showModal(mensaje, 'Error');
        } else {
          this.DRutasProductos = newArray;
          for (let i = 0; i < this.DRutasProductos.length; i++) {
            const element = this.DRutasProductos[i];
            this.DRutasProductos[i] = {...element, INFO: element.ID_RUTA+' | '+element.DESCRIPCION};           
          }
          if (this.mnuAccion === 'new')
            this.selectRutasProductos = [condicion.ID_RUTA];
          if (this.mnuAccion === 'refrescar' || this.mnuAccion === 'consulta' ) {
            const loadSecciones = this.DRutasProductos.filter((d:any) => d.ID_RUTA === this.selectRutasProductos[0]);
            if (this.FMatriz.CLASE.match('Producto simple|Parte simple')) {
              this.onRowValidating(this.FMatriz);
              this.DataGridSeccion = loadSecciones[0].SECCIONES;
            }
            if ( this.FMatriz.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
              this.DataGridSeccion = JSON.parse(loadSecciones[0].SECCIONES);
              this._sdatos.SECCIONES_RUTA_SELECCIONADA = JSON.parse(JSON.stringify(this.DataGridSeccion));
              this._sdatos.DESCRIPCION_RUTA = loadSecciones[0].INFO;
            }
            this.setTotalesSecciones(condicion);
          }
        };
      },
        (err => {
          this.showModal(err.message, 'Error');
        })
      );
    }
    if (obj === 'atributos simples' || obj === 'todos') {
      if(this.FMatriz.CLASE.match('Producto simple|Parte simple')) {
        const prm = { PRODUCTO: this.FMatriz.PRODUCTO };
        this.sData.getAtributos('atributos simples', prm).subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }        
          const mensaje = res[0].ErrMensaje;
          if (mensaje != '') {
            // this.showModal(mensaje);
            this.DGAtributosSimple = [];
            showToast(mensaje, 'warning');
          }
          else {
            if(this.clase === 1)
              this.DGAtributosSimple = res;
            else
              this.DGAtributosSimple = [];
          }
        },
          (err => {
            this.showModal(err.message, 'Error');
          })
        );
      }
    }
    if (obj === 'atributos compuestos' || obj === 'todos') {
      if (this.FMatriz.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
        // const prm = { PRODUCTO: this.FMatriz.PRODUCTO };
        const prm: any = {TIPO:'PRODUCTO', DATOS: [this.FMatriz.PRODUCTO] };
        this.sData.getAtributos('atributos partes', prm).subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }        
          const mensaje = res[0].ErrMensaje;
          if (mensaje != '') {
            // this.showModal(mensaje);
            this.DGAtributosCompuesto = [];
            showToast(mensaje, 'warning');
          }
          else {
            if(this.clase === 2)
              this.DGAtributosCompuesto = res;
            else
              this.DGAtributosCompuesto = [];
          }
        },
          (err => {
            this.showModal(err.message, 'Error');
          })
        );
      }
    }
    if (obj === 'baseCosto' || obj === 'todos') {
      const prm = { DATOS: '' };
      this.sData.getBasesCostos('VALOR BASE', prm).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const mensaje = res[0].ErrMensaje;
        if (mensaje != '') {
          this.showModal(mensaje, 'Error');
        }
        else {
          const base_costo:any = res.filter((d:any) => d.CLASE === 'BASES COSTO');
          this.FMatriz.BASES_COSTOS = base_costo[0].CODIGO;
        }
      },
        (err => {
          this.showModal(err.message, 'Error');
        })
      );
    }
    if (obj === 'partes' || obj === 'todos') {
      if (this.FMatriz.CLASE.match('Juego|Producto compuesto|Parte compuesta')){
        const prm = { PRODUCTO: this.FMatriz.PRODUCTO };
        this.sData.getPartes('PRODUCTOS PARTES', prm).subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const newArray = res;
          const mensaje = newArray[0].ErrMensaje;
          if (mensaje != '') {
            // this.showModal(mensaje);
            this._sdatos.DPartes = [];
            showToast(mensaje, 'warning');
          } else {
            this._sdatos.DPartes = newArray;
            this.getMatrizSimple();
          };
        },
        (err => {
          this.showModal(err.message, 'Error');
        })
        );
      }
    }
    if (obj === 'valorBaseCif' || obj === 'todos') {
      const prm = { PRODUCTO: this.FMatriz.PRODUCTO };
      this.sData.getValorBase('CIF', prm).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje != '') {
          this.showModal(mensaje, 'Error');
        }
        else {
          // this.DCIF = ({DATA: newArray, accion: 'new'});
        };
      },
        (err => {
          this.showModal(err.message, 'Error');
        })
      );
    }
  }

  onRowValidating(e: any) {
    let msj: any = [];
    if ((e.PRODUCTO === '') || (e.PRODUCTO === null)) msj.push('PRODUCTO');
    if ((e.NOMBRE === '') || (e.NOMBRE === null)) msj.push('NOMBRE');
    if ((e.CLASE === '') || (e.CLASE === null)) msj.push('CLASE');
    if ((e.ETAPA === '') || (e.ETAPA === null)) msj.push('ETAPA');
    if ((e.MARGEN_RENTABILIDAD <= 0) || (e.MARGEN_RENTABILIDAD === null)) msj.push('MARGEN DE RENTABILIDAD, mayor de Cero (0)');
    if ((e.BASES_COSTOS === '') || (e.BASES_COSTOS === null)) msj.push('BASES COSTOS');
    if ((e.PERFIL_TRIBUTARIO === '') || (e.PERFIL_TRIBUTARIO === null)) msj.push('PERFIL TRIBUTARIO');
    if ((e.RUTAS === '') || (e.RUTAS === null)) msj.push('RUTAS');

		if( msj.length !== 0) {
			e.isValid = false;
      showToast('Hay datos nulos en '+msj+', complete toda la información', 'error');
      this.activeItems = false;
			return false;
		} else {
			e.isValid = true;
      this.activeItems = true;
      this._sdatos.D_MATRIZ = this.FMatriz;
			return true;
		};	
	}
  
  // Imprimir reporte de aplicación
  imprimirReporte(id_reporte:any, archivo:any, datosrpt:any) {
		
    let filtroRep = {FILTRO: this.FMatriz.PRODUCTO};
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

  showModal(mensaje: any, title: any) {
    const tipo = title;
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo==='Error' ? 'DF3E3E':'#0F4C81 !important',
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
  
  // Eventos del menu float
  // Si está desplegado el menu float de apoyo, ocultarlo
  onScroll(e: Event): void {
    if (this.eventsSubject === undefined) return;
    this.eventsSubject.next();
  }
  // Mostrar el menu float de apoyo, con Control+click-derecho
  @HostListener("document:contextmenu", ["$event"])
  clickout(e: any) {
    // console.log(e.srcElement);
    if (!e.ctrlKey) return;
    if (e.srcElement.id !== undefined && e.srcElement.id !== '') {
      this.targetMenuFloat = '#'+e.srcElement.id;
      // console.log(e.srcElement.name??e.srcElement.id);
      this.dataMenuFloat = { aplicacion: this.prmUsrAplBarReg.aplicacion, objeto: e.srcElement.name??e.srcElement.id };
      this.activaMenuFloat = true;
    }
    else {
      if (e.srcElement.name !== undefined && e.srcElement.name !== '') {
        this.targetMenuFloat = '#xs__'+e.srcElement.name;  //e.srcElement.name;
        this.dataMenuFloat = { aplicacion: this.prmUsrAplBarReg.aplicacion, objeto: e.srcElement.name??e.srcElement.id };
        this.activaMenuFloat = true;
      }
    }
    e.preventDefault();
  }
  // Ocultar el menu float de apoyo, con click-fuera
  onClickMe() {
    this.activaMenuFloat = false;
  }
  abrirApl() {
    // console.log("abrir..............");
  }

}
