import { ChangeDetectorRef, Component, ElementRef, HostBinding, HostListener, OnInit, Type, ViewChild } from '@angular/core';
import { DxButtonModule, DxCheckBoxModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxComponent, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxGalleryComponent, DxGalleryModule, DxListModule, DxLoadPanelComponent, DxLoadPanelModule, DxNumberBoxModule, DxPopupModule, DxSelectBoxComponent, DxSelectBoxModule, DxTabsComponent, DxTagBoxModule, DxTextBoxModule, DxToolbarModule, DxTreeListModule, DxTreeViewComponent, DxTreeViewModule, DxValidatorComponent, DxValidatorModule } from 'devextreme-angular';
import { lastValueFrom, Subject, Subscription } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { PRO007Service } from 'src/app/services/PRO007/PRO007.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { GeneralesService } from '../../../services/generales/generales.service';
import Swal from 'sweetalert2';
import { clsProductos } from './clsPRO022.class';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { listaEstadosBas } from 'src/app/shared/classes/estados';
import { CommonModule, formatNumber } from '@angular/common';
import { SxalertService } from 'src/app/shared/xalert/_sxalert.service';
import { validatorRes } from 'src/app/shared/validator/validator';
import notify from 'devextreme/ui/notify';
import {CdkAccordionModule} from '@angular/cdk/accordion';
import { SboxestadosComponent } from 'src/app/shared/sboxestados/sboxestados.component';
import { ThumbnailimgComponent } from 'src/app/shared/thumbnailimg/thumbnailimg.component';
import { PRO02201Component } from './PRO02201/PRO02201.component';
import { PRO02202Component } from './PRO02202/PRO02202.component';
import { PRO02203Component } from './PRO02203/PRO02203.component';
import { PRO02204Component } from './PRO02204/PRO02204.component';
import { PRO02205Component } from './PRO02205/PRO02205.component';
import { PRO02206Component } from './PRO02206/PRO02206.component';
import { PRO02207Component } from './PRO02207/PRO02207.component';
import { PRO02208Component } from './PRO02208/PRO02208.component';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { MenufloatComponent } from 'src/app/shared/menufloat/menufloat.component';
import { BarraimgComponent } from 'src/app/shared/barraimg/barraimg.component';
import { XalertComponent } from 'src/app/shared/xalert/xalert.component';
import { VEN002ModaltreeComponent } from '../../VEN002/VEN002_modaltree/VEN002_modaltree.component';
import { AngularResizeEventModule } from 'angular-resize-event';
import { PRO02209Component } from './PRO02209/PRO02209.component';
import { showToast } from '../../../shared/toast/toastComponent.js'
import { libtools } from 'src/app/shared/common/libtools';
import { FemailComponent } from 'src/app/shared/femail/femail.component';
import { PRO02210Component } from './PRO02210/PRO02210.component';
import { SvisorRutasService } from 'src/app/shared/visor-img/_svisor-img.service';

@Component({
  selector: 'app-PRO022',
  templateUrl: './PRO022.component.html',
  styleUrls: ['./PRO022.component.scss'],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxDropDownBoxModule, DxTreeViewModule, DxValidatorModule,
            DxTextBoxModule, DxNumberBoxModule, DxSelectBoxModule, DxTagBoxModule, DxTreeListModule,
            DxDataGridModule, DxButtonModule, DxCheckBoxModule, CdkAccordionModule, DxGalleryModule,
            DxPopupModule, DxLoadPanelModule, SboxestadosComponent, ThumbnailimgComponent, PRO02201Component,
            PRO02202Component, PRO02203Component, PRO02204Component, PRO02205Component, PRO02206Component,
            PRO02207Component, PRO02208Component, VistarapidaComponent, MenufloatComponent, BarraimgComponent,
            XalertComponent, VEN002ModaltreeComponent, AngularResizeEventModule, DxListModule,
            PRO02209Component, FemailComponent, PRO02210Component
          ],
  providers: [AngularResizeEventModule]
})
export class PRO022Component implements OnInit {
  @ViewChild("formProductos", { static: false }) formPro: DxFormComponent;
  @ViewChild("formProductosId", { static: false }) formProId: DxFormComponent;
  @ViewChild("valIdClase", { static: false }) validClase: DxValidatorComponent;
  @ViewChild("validEstado", { static: false }) validEstado: DxValidatorComponent;
  @ViewChild("valIdUM", { static: false }) validUM: DxValidatorComponent;
  @ViewChild("valIdUM", { static: false }) valIdUMProv: DxValidatorComponent;
  @ViewChild("galleryPro", { static: false }) galleryPro: DxGalleryComponent;
  @ViewChild("xs__ID_UDM", { static: false }) xs__ID_UDM: DxSelectBoxComponent;
  @ViewChild("xs__CLASE", { static: false }) ddClase: DxDropDownBoxComponent;
  @ViewChild("treeListaClases", { static: false }) treeListaClases: DxTreeViewComponent;
  @ViewChild("tabPanel", { static: false }) tabPanelPro: DxTabsComponent;
  @ViewChild("gridGravPT", { static: false }) gridGravPT: DxDataGridComponent;
  @ViewChild("loadPanelPro", { static: false }) loadPanelPro: DxLoadPanelComponent;
  
  

  public _unsubscribeAll: Subject<any>;
  @ViewChild('div') div: ElementRef;

  // Variables fijas de la aplicación
  subscription: Subscription;
  subscriptionPro: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string;
  VDatosReg: any;
  galleryTarget: string = 'galleryPro';
  eventsSubjectDocum: Subject<any> = new Subject<any>();
  eventsSubjectPres: Subject<any> = new Subject<any>();
  eventsSubjectEnvioCorreo: Subject<any> = new Subject<any>();
    
  treeBoxGrupo: any[] = [];
  gridBoxProv: any[] = [];
  gridBoxGrav: any[] = [];
  DGExitencias: any[] = [];
  gridBoxUDMProveedor: any[] = [];
  gridBoxUDMPresentacion: any[] = [];
  selectRutaProducto: any[] = [];
  isTreeBoxOpened: boolean;
  isGridBoxOpenedProv: boolean;
  openUDMedidas: boolean;
  openUDMProveedor: boolean;
  openUDMPresentacion: boolean;
  popUpExistenciasVisible: boolean = false;
  openRutas: boolean = false;
  focusedRowIndex: number;
  focusedRowKey: string;
  keyBod = ["ID_UN_BODEGA","PRODUCTO","TIPO_INVENTARIO","ATRIBUTO"];
  allowedPageSizes = [5, 10, 20, 50, 100, 'all'];
  dropDownOptions = { width: 600, 
                      height: 400, 
                      hideOnParentScroll: true,
                      container: '#router-container' };
  dropDownOptionsListBox = { width: 400, 
                             height: 400, 
                             hideOnParentScroll: true,
                             container: '#router-container'  };
  dropDownOptionsPT = { width: 600, 
                        height: 400, 
                        hideOnParentScroll: true,
                        container: '#router-container' 
                      };
  stylingMode = 'filled';
  labelLocation: string = 'left';
  listaEstados = listaEstadosBas;
  conCambios: number = 0;
  existenciaProducto: number = 0;
  puntoMinimo: number = 0;
  puntoMaximo: number = 0;

  // Variables de datos
  DProductos: clsProductos;
  // DAtrProductos: any;
  colCountByScreen: object;
  DClasePro: any;
  DGrupos: any;
  DPerfilesTrib: any;
  DMarcas: any;
  DUnidadesMedida: any;
  DProveedores: any;
  DGravamenes: any;
  DProductos_prev: any;
  D_Atributos_prev: any;
  D_Partes_prev: any;
  D_Espec_prev: any;
  D_Compo_prev: any;
  D_Proveedores_prev: any;
  D_Combos_prev: any;
  D_Bodegas_prev: any;
  D_Cubicaje_prev: any;
  D_Documentacion_prev: any;
  D_Presentacion_prev: any;
  DRutas:any [] = [];
  DRutas_prev:any [] = [];
  prev_PRODUCTO: any;   // Valor del Codigo del producto antes de la ultima modificacion
  controlCambiosPro: any;
  imageAtributo: string = '';
  valItemAtributo: number;
  DImagenesPro: string[] = ['/assets/no-image.jpg'];
  DImagenesThumb: any[];
  slideshowDelay: any;
  tabsInfoPro = ['Generales','Atributos','Combos','Partes','Especificaciones','Composición','Proveedores']; 
  seccionInfoPro: any;
  seccionInfoProDos: any;
  accordionExpand: any;
  itemsAccordion = ['Bodegas asignadas', 'Combos', 'Productos / Partes', 'Atributos de Producto', 'Cantidades presentación', 'Documentación', 'Especificaciones técnicas', 'Composición'];
  itemsAccordionDos = ['Proveedores','Cubicaje y Peso'];
  tabCombosVisible: string = 'none';
  tabPartesVisible: boolean = false;
  tabActiva: number = 0;
  QFiltro: any;
  objDatosIR: any = {};
  newConsecutivo: boolean = false;
  visibleConsecutivo: boolean = false;
  
  // Especificaciones
  especAplicacion: any;
  especUsuarioEmail: string = ''; 

  // Datos reporte
  rpt_id_reporte: string;
  rpt_archivo: string; 
  rpt_datosrpt: any;
  rpt_registro: string;
  ltool: any;
  
  //Variables de configuracion
  visibleListaPrecios: boolean = false;
  visibleListaOpc: boolean = false;
  listaPreciosData: any [] = [];
  listaOpciones: any[] = [];

  tvValorClase: string;
  isTvClaseBoxOpened: boolean = false;
  esVisibleProFab: boolean = false;
  verOpcionPartes: boolean = false;
  titProParte: string = 'Producto';
  activaMenuFloat: boolean;
  targetMenuFloat: string = '';
  dataMenuFloat: any;
  eventsSubject: Subject<void> = new Subject<void>();
  eventsBarraImg: Subject<any> = new Subject<any>();
  mostrarXAlert: Subject<any> = new Subject<any>();
  @HostBinding('style.color') color : string = 'black';
  esVisibleAlert: boolean = false;
  toolTipVisible: boolean = false;
  targetIdTooltip: string;
  tooltipTitulo: string;
  tooltipInfo: string;
  wrapperAttr = { class: "cls-tooltip-bar" };

  //json de estados
  objReadOnly: any = {
    readOnly: false,
    readOnlyProducto: false,
    readOnlyClase: false,
    esEdicion: false,
    iniEdicion: false,
    esEdicionFila: false,
    Bod: false,
    Inv: false,
    ETAPA: false
  };

  // notificaciones y alerts
  toaVisible: boolean;
  toaPosicion: string;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';
  loadingVisible: boolean = false;
  objToasPosiciones: string[] = [
    'top left', 'top center', 'top right',
    'bottom left', 'bottom center', 'bottom right',
    'left center', 'center', 'right center',
  ];
  notifyCounter: number;
  activeNotifies: number;

  constructor(
    private _sdatos: PRO007Service,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private _sgenerales: GeneralesService,
    private tabService: TabService,
    private salert: SxalertService,
    private cdf: ChangeDetectorRef,
    private _service: SvisorRutasService
  ) 
  {
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

    this.colCountByScreen = {
      xs: 1,
      sm: 1,
      md: 2,
      lg: 2,
    };

    // Servicio comunicacion entre pestañas
    this.subscriptionPro = this._sdatos
      .getObs_Productos()
      .subscribe((datreg) => {
        // Ejecuta de acuerdo al componente hijo
        switch (datreg.componente) {
          case 'atributos':
            
            break;
        
          default:
            break;
        }
    });

    this.notifyCounter = 0;
    this.activeNotifies = 0;

    this.ValideExistencia = this.ValideExistencia.bind(this);
    this.productosValor = this.productosValor.bind(this);
    this.opPrepararModificar = this.opPrepararModificar.bind(this);
    this.compressImage = this.compressImage.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.switchBodega = this.switchBodega.bind(this);
    this.switchInventario = this.switchInventario.bind(this);
    this.onOpenedGrav = this.onOpenedGrav.bind(this);
    this.toUpperCase = this.toUpperCase.bind(this);
    this.verificarIR = this.verificarIR.bind(this);
    this.onValueCODIGO_ASOCIADO = this.onValueCODIGO_ASOCIADO.bind(this);
    this.onContentReadyGrupo = this.onContentReadyGrupo.bind(this);
    this.getSizeQualifier = this.getSizeQualifier.bind(this);
    this.valoresDefecto = this.valoresDefecto.bind(this);
    this.valoresObjetos = this.valoresObjetos.bind(this);
    this.ltool = new libtools(this._sbarreg, this.tabService);

  }

  getSizeQualifier(width:any) {
    if (width < 768) {
      this.labelLocation = 'top';
      return "xs"
    }else if (width < 992) {
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

    // Activa modo de operacion para los demás componentes
    this._sdatos.accion = operMenu.accion;

    switch (operMenu.accion) {
      case "r_ini":
        const user:any = localStorage.getItem("usuario");
        this.prmUsrAplBarReg = {
          tabla: "PRODUCTOS",
          aplicacion: "PRO-022",
          usuario: user,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: {}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this._sdatos.conCambios = 0;
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.objReadOnly.readOnlyClase = false;
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.mnuAccion = "update";
        this.objReadOnly.readOnly = false;
        this.objReadOnly.readOnlyClase = false;
        this.verificarIR();
        this.opPrepararModificar();
        break;

      case "r_guardar":
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case "r_buscar":
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        if (!this._sfiltro.enConsulta) {
          this.opPrepararBuscar('filtro');
        } else {
          this.toaMessage = 'Consulta en proceso, por favor espere.';
          this.toaVisible = true;
          this.toaPosicion = 'top center';
          this.toaTipo = 'warning';
          showToast('Consulta en proceso, por favor espere.', 'warning');
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


      case "r_copiar":
        if (this.VDatosReg.length != '') {
          this.copiarProducto();
        } else {
          this.toaTipo = 'error';
          this.toaMessage = 'Consulte producto a copiar';
          this.toaVisible = true;
          this.toaPosicion = 'top center';
          showToast('Consulte producto a copiar', 'error');
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
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, 
                                    operacion: { } 
                                  }
            this.objReadOnly.readOnly = true;
            this.objReadOnly.readOnlyClase = true;
            this.objReadOnly.readOnlyProducto = true;
            this.objReadOnly.esEdicion = false;
            this.objReadOnly.Bod = true;
            this.objReadOnly.Inv = true;
            this.objReadOnly.ETAPA = true;
            this.newConsecutivo = false;
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.DProductos = JSON.parse(JSON.stringify(this.DProductos_prev));
            this._sdatos.D_Atributos = JSON.parse(JSON.stringify(this.D_Atributos_prev));
            this._sdatos.D_Partes = JSON.parse(JSON.stringify(this.D_Partes_prev));
            this._sdatos.D_Espec = JSON.parse(JSON.stringify(this.D_Espec_prev));
            this._sdatos.D_Compo = JSON.parse(JSON.stringify(this.D_Compo_prev));
            this._sdatos.D_Proveedores = JSON.parse(JSON.stringify(this.D_Proveedores_prev));
            this._sdatos.D_Combos = JSON.parse(JSON.stringify(this.D_Combos_prev));
            this._sdatos.D_Bodegas = JSON.parse(JSON.stringify(this.D_Bodegas_prev));
            this._sdatos.D_Cubicaje = JSON.parse(JSON.stringify(this.D_Cubicaje_prev));
            this._sdatos.D_Presentacion = JSON.parse(JSON.stringify(this.D_Presentacion_prev));
            this._sdatos.conCambios = 0;

            // Cancela acciones en los demás componentes
            this._sdatos.setObs_ProAtributos({ accion: 'r_cancelar' });
            this._sdatos.setObs_ProPartes({ accion: 'r_cancelar' });
            this._sdatos.setObs_ProEspec({ accion: 'r_cancelar' });
            this._sdatos.setObs_ProCompo({ accion: 'r_cancelar' });
            this._sdatos.setObs_Proveedores({ accion: 'r_cancelar' });
            this._sdatos.setObs_Combos({ accion: 'r_cancelar' });
            this._sdatos.setObs_Bodegas({ accion: 'r_cancelar' });
            this._sdatos.setObs_Cubicaje({ accion: 'r_cancelar' });
            this.eventsSubjectDocum.next({ accion: 'r_cancelar' });
            this.eventsSubjectPres.next({ accion: 'r_cancelar' });
        
            // Restituye los valores
            this.mnuAccion = "";
            this.opIrARegistro('r_numreg');
            this.eventsBarraImg.next({ accion: 'inactivar', docElem: document, target: this.galleryTarget});

            // Inactiva cambios
            const objControl = ['__obj__ddEstado','__obj__ddClase','__obj__ddMarca','__obj__xs__ID_UDM','__obj__ddGrupo','__obj__ddProveedor'];
            objControl.forEach(c => {
              this.cambiosItemForma({ dataField: c }, 'inactivar');
            })
            var itemsgru:any = this.formPro.instance.option("items");
            itemsgru.forEach((g:any) => {
              var items = g['items'];
              if (items !== undefined) {
                items.forEach(itemfrm => {
                  if (itemfrm.dataField)
                    this.cambiosItemForma({ dataField: itemfrm.dataField }, 'inactivar');
                });
              }
            })
            
          }
        });
        break;

      case "r_vista":
        this.opVista();
        break;

      case 'r_refrescar':
				this.valoresObjetos('todos');
        this._sdatos.setObs_ProAtributos({ accion: 'r_refrescar' });
        this._sdatos.setObs_ProPartes({ accion: 'r_refrescar', operacion: this.DProductos.CLASE });
        this._sdatos.setObs_ProEspec({ accion: 'r_refrescar' });
        this._sdatos.setObs_ProCompo({ accion: 'r_refrescar' });
        this._sdatos.setObs_Proveedores({ accion: 'r_refrescar' });
        this._sdatos.setObs_Combos({ accion: 'r_refrescar' });
        this._sdatos.setObs_Bodegas({ accion: 'r_refrescar' });
        this._sdatos.setObs_Cubicaje({ accion: 'r_refrescar' });
        this.eventsSubjectDocum.next({ accion: 'r_refrescar' });
        this.eventsSubjectPres.next({ accion: 'r_refrescar' });
				break;

      case "r_imprimir":
        if (operMenu.operacion.modo === 'previsualizar')
          this.imprimirReporte(operMenu.operacion);
        if (operMenu.operacion.modo === 'pdf')
          this.generarPDF(operMenu.operacion);
        if (operMenu.operacion.modo === 'email') {
          this.rpt_id_reporte = operMenu.operacion.id_reporte, 
          this.rpt_archivo = operMenu.operacion.archivo, 
          this.rpt_datosrpt = operMenu.operacion.data_rpt;
          this.enviarEmailPDF();
        }
        break;

      case 'r_configurar':
        switch (operMenu.operacion.data_config.data.VALOR) {
          case 'Existencias de Producto':
            this.valoresObjetos('existencias');
            break;

          case 'Lista de Precios':
            this.valoresObjetos('lista precios');
            break;
        
          default:
            break;
        }
        break;

      default:
        break;
    }
  }
  
  // Llama a Acciones de registro
  
  opPrepararNuevo(): void {
    this.visibleConsecutivo = false;
    this.objReadOnly.readOnly = false;
    this.objReadOnly.readOnlyClase = false;
    this.objReadOnly.esEdicion = true;
    this.objReadOnly.iniEdicion = true;
    this.objReadOnly.readOnlyProducto = false;
    this.objReadOnly.Bod = true;
    this.objReadOnly.Inv = false;
    this.objReadOnly.ETAPA = false;
    this.opBlanquearForma();
    this.resetValidaciones();

    this.DProductos.ESTADO = 'ACTIVO';
    this.DProductos.ID_UDM = 'Ud';
    this.DProductos.CLASE = '';
    this.DProductos.ETAPA = '';
    this.DProductos.MARCA = '';
    this.DProductos.INVENTARIO = false;
    this.DProductos.BODEGA = false;
    this.DProductos.CONTROL_SERIAL = false;
    this.DProductos.MAXIMO = 0;
    this.DProductos.MINIMO = 0;
    this.xs__ID_UDM.instance.option('value','Ud');
    this.formPro.instance.resetValues();
    // this.ddClase.instance.option('value','PRODUCTO');

    // Activa componentes
    this._sdatos.accion = 'r_nuevo';
    this._sdatos.setObs_ProAtributos({ accion: 'r_nuevo' });
    this._sdatos.setObs_ProPartes({ accion: 'r_nuevo' });
    this._sdatos.setObs_ProEspec({ accion: 'r_nuevo' });
    this._sdatos.setObs_ProCompo({ accion: 'r_nuevo' });
    this._sdatos.setObs_Proveedores({ accion: 'r_nuevo' });
    this._sdatos.setObs_Combos({ accion: 'r_nuevo' });
    this._sdatos.setObs_Bodegas({ accion: 'r_nuevo' });
    this._sdatos.setObs_Cubicaje({ accion: 'r_nuevo' });
    this.eventsSubjectDocum.next({ accion: 'r_nuevo'})
    this.eventsSubjectPres.next({ accion: 'r_nuevo'})

    // Ini img
    this.DImagenesPro = ['/assets/no-image.jpg'];
    this.DImagenesThumb = [];

    // Sin pestañas de partes, combos, bodegas
    this.seccionInfoPro[0] = 'none';
    this.seccionInfoPro[1] = 'none';
    this.seccionInfoPro[2] = 'none';
    this.verOpcionPartes = false; 
    // this.titProParte = 'Producto';
    this.eventsBarraImg.next({ accion: 'activar', docElem: document, target: this.galleryTarget, active: [true, true, true]});

    // Valores defecto
    this.valoresDefecto();

  }
  
  // Valores defecto tomado de las especificaciones de la aplicacion
  valoresDefecto() {
    const prm = { USUARIO: this.prmUsrAplBarReg.usuario };
    this._sdatos.consulta('valores defecto', prm, this.prmUsrAplBarReg.aplicacion)
    .subscribe((data: any) => {
      const res = validatorRes(data);
      this.objDatosIR = res[0];
      if (res[0].ErrMensaje !== '') {
        this.showModal(res[0].ErrMensaje,'¡Importante!');
      }
      else {
        let ix:any;
        // let ix = res.findIndex(e => e.NOMBRE_OBJETO === 'INVENTARIO');
        // if (ix !== -1) this.DProductos.INVENTARIO = res[ix].ACTIVADO;
        ix = res.findIndex(e => e.NOMBRE_OBJETO === 'PERFIL_TRIBUTARIO');
        if (ix !== -1) {
          this.DProductos.PERFIL_TRIBUTARIO = res[ix].VALOR_DEFECTO.split('|');
          this.gridBoxGrav = this.DProductos.PERFIL_TRIBUTARIO;
        }
        // ix = res.findIndex(e => e.NOMBRE_OBJETO === 'BODEGA');
        // if (ix !== -1) this.DProductos.BODEGA = res[ix].ACTIVADO;
        // ix = res.findIndex(e => e.NOMBRE_OBJETO === 'MARCA');
        // if (ix !== -1) this.DProductos.MARCA = res[ix].VALOR_DEFECTO;
      }
    });

    // Cuentas de email usuario
    this.especUsuarioEmail = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'EMAIL PRODUCTOS')?.TITULO ?? '';

  }

  opBlanquearForma(): void {
    this.DProductos = {
      PRODUCTO: '',
      PRO_CONSECUTIVO: 0,
      NOMBRE: '',
      CLASE: '',
      ETAPA: '',
      ID_GRUPO: '',
      TIPO_MARCA: '',
      MARCA: '',
      MODELO: '',
      NUMERO_PARTE: '',
      PERFIL_TRIBUTARIO: '',
      INVENTARIO: false,
      BODEGA: false,
      COMENTARIOS: '',
      ESTADO: '',
      CONTROL_SERIAL: false,
      CAMBIAR_NOMBRE: false,
      VALOR_NEGATIVO: false,
      MARGEN_RENTABILIDAD: 0,
      DOCUMENTO: '',
      ID_UDM: '',
      CAN_UDM: 0,
      MAXIMO: 0,
      MINIMO: 0,
      ID_PROVEEDOR: '',
      NOMBRE_PROVEEDOR: '',
      PRO_ATRIBUTOS: [],
      PRO_KITS: [],
      NUM_PARTES: 0,
      ID_UDM_PROV: '',
      ID_RUTA: '',
      CONTROL_CAMBIOS: [],
      CODIGO_ASOCIADO: '',
      COD_ASOCIADO: ''
    };
    this._sdatos.PRODUCTO = '';
    this.gridBoxGrav = [];
    this.gridBoxUDMProveedor = [];
    this.treeBoxGrupo = [];
    this._sdatos.D_Atributos = [];
    this._sdatos.D_Partes = [];
    this._sdatos.D_Espec = [];
    this._sdatos.D_Compo = [];
    this._sdatos.D_Proveedores = [];
    this._sdatos.D_Combos = [];
    this._sdatos.D_Bodegas = [];
    this._sdatos.D_Cubicaje = [];
    this._sdatos.D_Documentacion = [];
    this._sdatos.D_Presentacion = [];
    this.tvValorClase = '';
    this.DProductos_prev = JSON.parse(JSON.stringify(this.DProductos));
    this.D_Atributos_prev = JSON.parse(JSON.stringify(this._sdatos.D_Atributos));
    this.D_Partes_prev = JSON.parse(JSON.stringify(this._sdatos.D_Partes));
    this.D_Espec_prev = JSON.parse(JSON.stringify(this._sdatos.D_Espec));
    this.D_Compo_prev = JSON.parse(JSON.stringify(this._sdatos.D_Compo));
    this.D_Proveedores_prev = JSON.parse(JSON.stringify(this._sdatos.D_Proveedores));
    this.D_Combos_prev = JSON.parse(JSON.stringify(this._sdatos.D_Combos));
    this.D_Bodegas_prev = JSON.parse(JSON.stringify(this._sdatos.D_Bodegas));
    this.D_Cubicaje_prev = JSON.parse(JSON.stringify(this._sdatos.D_Cubicaje));
    this.D_Documentacion_prev = JSON.parse(JSON.stringify(this._sdatos.D_Documentacion));
    this.D_Presentacion_prev = JSON.parse(JSON.stringify(this._sdatos.D_Presentacion));
    this.prev_PRODUCTO = '';

    if (!this.mnuAccion.match('new|update')) {
      this._sdatos.setObs_ProAtributos({ accion: 'r_ini' });
      this._sdatos.setObs_ProPartes({ accion: 'r_ini' });
      this._sdatos.setObs_ProEspec({ accion: 'r_ini' });
      this._sdatos.setObs_ProCompo({ accion: 'r_ini' });
      this._sdatos.setObs_Proveedores({ accion: 'r_ini' });
      this._sdatos.setObs_Combos({ accion: 'r_ini' });
      this._sdatos.setObs_Bodegas({ accion: 'r_ini' });
      this._sdatos.setObs_Cubicaje({ accion: 'r_ini' });
      this.eventsSubjectDocum.next({ accion: 'r_ini' });
      this.eventsSubjectPres.next({ accion: 'r_ini' });
    }

    setTimeout(() => {
      this.objReadOnly.iniEdicion = false;

      // Reset validaciones
      this.resetValidaciones();

    }, 300);

  }

  verificarIR() {
    // Valida integridad referencial
    const prm = { PRODUCTO: this._sdatos.PRODUCTO };
    this._sdatos.consulta('integridad referencial', prm, this.prmUsrAplBarReg.aplicacion)
    .subscribe((data: any) => {        
      const res = validatorRes(data);
      this.objDatosIR = res[0];
      if (res[0].ErrMensaje !== '') {
        this.showModal(res[0].ErrMensaje,'¡Importante!');
      }
      else {
        if (res[0].BOD !== '') {
          // this.objReadOnly.Bod = true;
          // this._sdatos.setObs_Bodegas({ accion: 'r_cancelar' });
          showToast(res[0].BOD, 'warning');
        } else {
          // this.objReadOnly.Bod = false;
        }
        if (res[0].INV !== '') {
          // this.objReadOnly.Inv = true;
          showToast(res[0].INV, 'warning');
        } else {
          // this.objReadOnly.Inv = false;
        }
      }
    });
  }

  async opPrepararModificar() {
    this.objReadOnly.readOnlyClase = false;
    this.objReadOnly.readOnly = false;
    this.objReadOnly.esEdicion = true;
    this.objReadOnly.iniEdicion = true;

    // Valor del producto anterior
    this.DProductos_prev = JSON.parse(JSON.stringify(this.DProductos));
    this.D_Atributos_prev = JSON.parse(JSON.stringify(this._sdatos.D_Atributos));
    this.D_Partes_prev = JSON.parse(JSON.stringify(this._sdatos.D_Partes));
    this.D_Espec_prev = JSON.parse(JSON.stringify(this._sdatos.D_Espec));
    this.D_Compo_prev = JSON.parse(JSON.stringify(this._sdatos.D_Compo));
    this.D_Proveedores_prev = JSON.parse(JSON.stringify(this._sdatos.D_Proveedores));
    this.D_Combos_prev = JSON.parse(JSON.stringify(this._sdatos.D_Combos));
    this.D_Bodegas_prev = JSON.parse(JSON.stringify(this._sdatos.D_Bodegas));
    this.D_Cubicaje_prev = JSON.parse(JSON.stringify(this._sdatos.D_Cubicaje));
    this.D_Documentacion_prev = JSON.parse(JSON.stringify(this._sdatos.D_Documentacion));
    this.D_Presentacion_prev = JSON.parse(JSON.stringify(this._sdatos.D_Presentacion));

    // Activa componentes
    if (this.DProductos.CLASE !== 'Juego')
      this._sdatos.setObs_ProAtributos({ accion: 'r_modificar' });
    this._sdatos.setObs_ProPartes({ accion: 'r_modificar', operacion: this.DProductos.CLASE });
    this._sdatos.setObs_ProEspec({ accion: 'r_modificar' });
    this._sdatos.setObs_ProCompo({ accion: 'r_modificar' });
    if ( !this.DProductos.CLASE.match('Juego|Producto compuesto|Parte compuesta|Producto simple|Parte simple')) {
      this._sdatos.setObs_Proveedores({ accion: 'r_modificar' });
      this.seccionInfoProDos[0] = 'block';
      // this.objReadOnly.ETAPA = false;
    } else {
      this.seccionInfoProDos[0] = 'none';
      // this.objReadOnly.ETAPA = true;
    }
    this.objReadOnly.ETAPA = false;
    this._sdatos.setObs_Combos({ accion: 'r_modificar' });
    this._sdatos.setObs_Bodegas({ accion: 'r_modificar' });
    this._sdatos.setObs_Cubicaje({ accion: 'r_modificar' });
    this.eventsSubjectDocum.next({ accion: 'r_modificar' });
    this.eventsSubjectPres.next({ accion: 'r_modificar' });
    this.eventsBarraImg.next({ accion: 'activar', docElem: document, target: this.galleryTarget, active: [true, true, true]});

    // Activa modificación si hay integridad a validar
    const prm = { PRODUCTO: this.DProductos.PRODUCTO, accion: 'integridad' };
    const apiRest = this._sdatos.validellave('EXISTE PRODUCTO',prm,'PRO022');
    const res = await lastValueFrom(apiRest, {defaultValue: true});
    const msg = JSON.parse(res.data);
    if (msg[0].ErrMensaje !== '') {
      this.objReadOnly.readOnlyProducto = true;
      showToast(msg[0].ErrMensaje, 'warning');
    } 
    // Valida si codigo es un consecutivo
    if (this.DProductos.PRO_CONSECUTIVO === 0) {
      this.objReadOnly.readOnlyProducto = false;
      this.visibleConsecutivo = false;
    } else {
      this.objReadOnly.readOnlyProducto = true;
      this.visibleConsecutivo = true;
    }
  }

  opPrepararGuardar(accion: string): void {
    if ( this._sdatos.conCambios > 0 ) {
      // Acción validación de datos
      if (!this.ValidaDatos("requerido")) {
        return;
      }

      // De las especificaciones tomar solo lo necesario
      let espec:any = [];
      if (this._sdatos.D_Espec)
        espec = this._sdatos.D_Espec
                    .map(({ ITEM, CATEGORIA, ID_ESPECIFICACION, INFO, ID }) => ({ ITEM, CATEGORIA, ID_ESPECIFICACION, INFO, ID }))
                    .filter(e => e.INFO !== '' && e.INFO !== '|');

      // Elimina imagen no asociada
      let linoimg = this.DImagenesPro.filter(e => e.match('no-image'));
      linoimg.forEach(i => {
        const nix = this.DImagenesPro.findIndex(i => i.match('no-image'));
        if (nix !== -1)
          this.DImagenesPro.splice(nix,1);
      });

      // Formacion del control de cambios
      const ctrlCambios:any = [];
      this.DProductos.CONTROL_CAMBIOS.forEach((ele:any) => {
        ctrlCambios.push({ CONCEPTO: ele, USUARIO: localStorage.getItem('usuario'), 
                          ESTACION: '' });
      });

      const prmDatosGuardar = JSON.parse(
                        ( JSON.stringify({ PRODUCTOS: this.DProductos}) + 
                          JSON.stringify({ PRM_APL: { USUARIO: this.prmUsrAplBarReg.usuario }}) + 
                          JSON.stringify({ IMAGENES: this.DImagenesPro }) + 
                          JSON.stringify({ ITM_ATRIBUTOS: this._sdatos.D_Atributos ??= [] }) + 
                          JSON.stringify({ PARTES: this._sdatos.D_Partes ??= []}) + 
                          JSON.stringify({ ESPECIFICACIONES: espec}) + 
                          JSON.stringify({ CUBICAJE: this._sdatos.D_Cubicaje ??= []}) +
                          JSON.stringify({ COMPOSICION: this._sdatos.D_Compo ??= []}) +
                          JSON.stringify({ PROVEEDORES: this._sdatos.D_Proveedores ??= []}) +
                          JSON.stringify({ PRO_KITS: this._sdatos.D_Combos ??= [] }) +
                          JSON.stringify({ CONTROL_CAMBIOS: ctrlCambios }) +
                          JSON.stringify({ BODEGAS: this._sdatos.D_Bodegas ??= [] }) +  
                          JSON.stringify({ DOCUMENTACION: this._sdatos.D_Documentacion ??= [] }) +  
                          JSON.stringify({ PRESENTACION: this._sdatos.D_Presentacion ??= [] }) + 
                          JSON.stringify({ USUARIO: localStorage.getItem('usuario') }))  
                          .replace(/}{/g,","));


      // API guardado de datos
      var exito = false;
      this.loadingVisible = true;
      this._sdatos
      .save(accion, prmDatosGuardar, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = validatorRes(data);
        this.loadingVisible = false;
        try {
          if (res[0].ErrMensaje !== "") {
            this.showModal(res[0].ErrMensaje);
          } else {
            this.objReadOnly.readOnly = true;
            this.objReadOnly.readOnlyClase = true;
            this.objReadOnly.ETAPA = true;
            this.eventsBarraImg.next({ accion: 'inactivar', docElem: document, target: this.galleryTarget});
            // Operaciones de barra
            if (this.mnuAccion === 'new') {
              this.VDatosReg = [this.DProductos];
              this.QFiltro = "PRODUCTO='"+this.DProductos.PRODUCTO+"'";
              this.prmUsrAplBarReg = {
                ...this.prmUsrAplBarReg,
                error: "",
                accion: "r_navegar",
                r_numReg: 1,
                r_totReg: 1,
                operacion: {}
              };
            } else {
              this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1] = JSON.parse(JSON.stringify(this.DProductos));
              this.prmUsrAplBarReg = {
                ...this.prmUsrAplBarReg,
                error: "",
                accion: "r_navegar",
                operacion: {}
              };
            }
            
            // Datos de barra y presenrtación
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            showToast('Registro actualizado', 'success');
            this.newConsecutivo = false;
            if (this.DProductos.PRO_CONSECUTIVO !== 0)
              this.visibleConsecutivo = true;
            else
              this.visibleConsecutivo = false;
            this.eventsBarraImg.next({ accion: 'inactivar', docElem: document });
            if (this.DImagenesPro.length === 0) this.DImagenesPro = ['/assets/no-image.jpg'];

            //Remplaza los datos en vector de busqueda filtro
            if ( this.VDatosReg.length != 0 ){
              const npos = this.VDatosReg.findIndex((d:any) => d.PRODUCTO === this.DProductos.PRODUCTO );
              if (npos != -1){ 
                this.VDatosReg[npos] = this.DProductos;
              }
            }

            // Inactiva items
            this._sdatos.accion = 'r_numreg';
            this._sdatos.iniStatus();
            var prm: any = {};
            if(this.DProductos.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
              prm = {TIPO: 'PRODUCTO', DATOS: [this.DProductos.PRODUCTO]}
            } else {
              prm = this.DProductos.PRODUCTO;
            }
            this._sdatos.setObs_ProAtributos({ accion: 'r_numreg',
                                                PRODUCTO: prm,
                                                verPro: this.DProductos.CLASE.match('Juego|Producto compuesto|Parte compuesta') ? true : false });
            this._sdatos.setObs_ProPartes({ accion: 'r_numreg' });
            this._sdatos.setObs_Combos({ accion: 'r_numreg' });
            this._sdatos.setObs_ProEspec({ accion: 'r_numreg' });
            this._sdatos.setObs_ProCompo({ accion: 'r_numreg' });
            this._sdatos.setObs_Proveedores({ accion: 'r_numreg' });
            this._sdatos.setObs_Bodegas({ accion: 'r_numreg' });
            this._sdatos.setObs_Cubicaje({ accion: 'r_numreg' });
            this.eventsSubjectDocum.next({ accion: 'r_numreg' });
            this.eventsSubjectPres.next({ accion: 'r_numreg', PRODUCTO: this.DProductos.PRODUCTO });

            // Inactiva cambios
            const objControl = ['__obj__ddEstado','__obj__ddClase','__obj__ddMarca','__obj__xs__ID_UDM','__obj__ddGrupo','__obj__ddProveedor'];
            objControl.forEach(c => {
              this.cambiosItemForma({ dataField: c }, 'inactivar');
            })
            var itemsgru:any = this.formPro.instance.option("items");
            itemsgru.forEach(g => {
              var items = g['items'];
              if (items) {
                items.forEach(itemfrm => {
                if (itemfrm.dataField)
                  this.cambiosItemForma({ dataField: itemfrm.dataField }, 'inactivar');
                });
              }
            })

          }
        } catch (error:any) {
          this.showModal(error.message);
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
      this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      this.objReadOnly.readOnly = true;
      this.objReadOnly.readOnlyClase = true;
      this.objReadOnly.readOnlyProducto = true;
      this.objReadOnly.esEdicion = false;
      this.objReadOnly.iniEdicion = false;
      this.objReadOnly.Bod = true;
      this.objReadOnly.Inv = true;
      this.objReadOnly.ETAPA = true;

      // Inactiva componentes
      this._sdatos.setObs_ProAtributos({ accion: 'r_cancelar' });
      this._sdatos.setObs_ProPartes({ accion: 'r_cancelar', operacion: this.DProductos.CLASE });
      this._sdatos.setObs_ProEspec({ accion: 'r_cancelar' });
      this._sdatos.setObs_ProCompo({ accion: 'r_cancelar' });
      this._sdatos.setObs_Proveedores({ accion: 'r_cancelar' });
      this._sdatos.setObs_Combos({ accion: 'r_cancelar' });
      this._sdatos.setObs_Bodegas({ accion: 'r_cancelar' });
      this._sdatos.setObs_Cubicaje({ accion: 'r_cancelar' });
      this.eventsSubjectDocum.next({ accion: 'r_cancelar' });
      this.eventsBarraImg.next({ accion: 'inactivar', docElem: document });
      this.eventsSubjectPres.next({ accion: 'r_cancelar' });
    
		}

  }

  ValidaDatos(Accion: string): boolean {
    // Valida datos completados de pestaña <Generales>
    var result = this.formPro.instance.validate();
    if (this.validClase) this.validClase.instance.validate();
    //if (this.validEstado) this.validEstado.instance.validate();
    if (this.validUM) this.validUM.instance.validate();

    if (Accion === "requerido") {
      if (
        this.DProductos.PRODUCTO === "" ||
        this.DProductos.NOMBRE === "" ||
        this.DProductos.CLASE === ""  ||
        this.DProductos.ID_GRUPO === ""  ||
        this.DProductos.ID_UDM === "" 
      ) {
        let msg = (this.DProductos.PRODUCTO === "" ? "Falta asignar codigo de producto <br>" : "") +
                  (this.DProductos.NOMBRE === "" ? "Falta nombre de producto <br>" : "") +
                  (this.DProductos.CLASE === "" ? "Se debe definir una clase de producto <br>" : "") +
                  (this.DProductos.ID_GRUPO === "" ? "Falta asignar grupo de producto <br>" : "") +
                  (this.DProductos.ID_UDM === "" ? "Falta asignar unidad de medida para el producto <br>" : "");
        this.showModal('Error al guardar',"Faltan datos","Hay datos incompletos del producto. Revisar contenido de los items marcados! <br>" + msg);
        return false;
      }
      // if (this.DProductos.MARCA === "" || this.DProductos.MARCA === undefined || this.DProductos.MARCA === null) {
      //   this.showModal('Error al guardar',"Marca","Faltan datos de la marca. Debe seleccionar al menos uno!");
      //   return false;
      // }
      if (this.DProductos.PERFIL_TRIBUTARIO === "" || this.DProductos.PERFIL_TRIBUTARIO.length === 0) {
        this.showModal('Error al guardar',"Perfil tributario","Faltan datos del perfil tributario. Debe asignar al menos uno!");
        return false;
      }
      if (this.DProductos.ID_GRUPO === "P" || this.DProductos.ID_GRUPO === "MP") {
        if (!this.DProductos.INVENTARIO && this.DProductos.CLASE !== 'SERVICIO') {
          this.showModal('Error, campo requerido', "Campo Requerido","Debe asignar Inventario");
          return false;
        }
      } else {
        if (this.DGrupos.findIndex((d:any) => d.ID_GRUPO_PADRE === 'P' || d.ID_GRUPO_PADRE === 'MP') !== -1 ) {
          if (!this.DProductos.INVENTARIO && this.DProductos.CLASE !== 'SERVICIO') {
            this.showModal('Error, campo requerido', "Campo Requerido","Debe asignar Inventario");
            return false;
          }
        }
      }
    };
    if ((this.DProductos.PRODUCTO.length < 5) || this.DProductos.PRODUCTO.length > 15) {
      this.showModal('Error al guardar',"Código del producto","Debe ser mayor a 5 y menor a 15 caracteres!");
      return false;
    };
    if (this.DProductos.INVENTARIO && !this.DProductos.BODEGA && this._sdatos.D_Bodegas.length === 0) {
      this.showModal("Falta asignar bodegas. Al tener inventario activo y "+
                     "la opcion de Todas las bodegas inactiva, es necesario asignar bodegas específicas!", "Error al validar datos.");
      return false;
    };
    // if (this.DProductos.CLASE === 'MATERIALES') {
    //   if (this._sdatos.D_Atributos.length === 0) {
    //     this.showModal("Falta asignar atributos. Al ser un Material debe asignar los atributos correspondientes", "Error al validar datos.");
    //     return false;
    //   }
    // };
    
    return true;
  }

  opPrepararBuscar(accion): void {
    if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Productos",
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
      const prm = { PRODUCTOS: arrFiltro };

      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this._sdatos
        .consulta('consulta', prm,this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {

          this._sfiltro.enConsulta = false;
          const res = validatorRes(data);
          const datares = res;
          if (datares[0].ErrMensaje === '') {
            this.VDatosReg = datares;
            this.loadingVisible = false;
  
            // Asocia datos
            this.DProductos = datares[0];
            // this.DProductos.PRO_ATRIBUTOS = datares[0].ITM_ATRIBUTOS;
            this.DProductos.PRO_KITS = datares[0].PRO_KITS;
            // this.DAtrProductos = datares[0].ITM_ATRIBUTOS;
            this.QFiltro = datares[0].QFILTRO;
            this._sdatos.PRODUCTO = this.DProductos.PRODUCTO;
            this.DProductos.CODIGO_ASOCIADO = this.DProductos.COD_ASOCIADO;

            // Acondiciona peril tributario
            if (this.DProductos.PERFIL_TRIBUTARIO !== undefined) {
              this.DProductos.PERFIL_TRIBUTARIO = this.DProductos.PERFIL_TRIBUTARIO.split('|');
              this.gridBoxGrav = this.DProductos.PERFIL_TRIBUTARIO;
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

          } else {
            this.loadingVisible = false;
            this.VDatosReg = [];
            this.opBlanquearForma();
            // this.resetValidaciones();
            // this.DAtrProductos = [];
            //notificación
            showToast(datares[0].ErrMensaje, 'error');
            this.DImagenesPro = ['/assets/no-image.jpg'];
            this.prmUsrAplBarReg = {...this.prmUsrAplBarReg,
              accion: "r_ini",
              error: "",
              r_numReg: 0,
              r_totReg: 0,
              operacion: {}
            };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          }

        });
    }
    this.objReadOnly.readOnly = true;
    this.objReadOnly.readOnlyClase = true;
    this.objReadOnly.readOnlyProducto = true;
    this.objReadOnly.ETAPA = true;
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        if ( this.VDatosReg.length != 0 ) {
          this.DProductos = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this.prmUsrAplBarReg.r_numReg = 1;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          showToast('No se encontraron datos', 'error');
          this.objReadOnly.readOnly = true;
          this.objReadOnly.readOnlyClase = true;
          this.objReadOnly.readOnlyProducto = true;
          this.objReadOnly.ETAPA = true;
        }
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.DProductos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
        this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
          ? this.VDatosReg.length
          : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DProductos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DProductos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
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
          if (this.VDatosReg.length > 0) {
            this.DProductos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1]));
          } else {
            this.opBlanquearForma();
          }
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

        } 
        else {
          this.opBlanquearForma();
          this.resetValidaciones();
          setTimeout(() => {  
            this.formPro.instance.resetValues();  
          }, 100);  
        }
        this.objReadOnly.readOnly = true;
        this.objReadOnly.readOnlyClase = true;
        this.objReadOnly.readOnlyProducto = true;
        this.objReadOnly.ETAPA = true;
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        this.prmUsrAplBarReg.r_totReg--;
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length > 0) {
          this.DProductos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        } else {
          this.opBlanquearForma();
        }
        break;

      default:
        break;
    }

    // Navega  los componentes items
    this._sdatos.PRODUCTO = this.DProductos.PRODUCTO;
    this._sdatos.PRODUCTO_CLASE = this.DProductos.CLASE;
    if (this.DProductos.CODIGO_ASOCIADO === '' ||
      this.DProductos.CODIGO_ASOCIADO === null ||
      this.DProductos.CODIGO_ASOCIADO === undefined
    ){
      this.DProductos.CODIGO_ASOCIADO = this.DProductos.PRODUCTO;
    }
    this.gridBoxUDMProveedor = [this.DProductos.ID_UDM_PROV];
    this._sdatos.accion = 'r_numreg';
    const verPro = this.DProductos.NUM_PARTES !== 0;
    if(this.DProductos.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
      var prm: any = {TIPO:'PRODUCTO', DATOS: [this.DProductos.PRODUCTO] };
      this.selectRutaProducto = [this.DProductos.ID_RUTA];
      this.DRutas = this.DRutas_prev.filter((d:any) => d.TIPO === 'Rutas Compuestas');
    }
    if(!this.DProductos.CLASE.match('Juego|Producto compuesto|Parte compuesta')){
      var prm: any = this.DProductos.PRODUCTO;
      this.selectRutaProducto = [this.DProductos.ID_RUTA];
      this.DRutas = this.DRutas_prev.filter((d:any) => d.TIPO === 'Rutas Simples');
    }
    if(this.DProductos.CLASE !== 'COMBO')
      this._sdatos.setObs_ProAtributos({ accion: 'r_numreg', PRODUCTO: prm, verPro, modo: 'consulta' });
    this._sdatos.setObs_ProPartes({ accion: 'r_numreg', PRODUCTO: this.DProductos.PRODUCTO });
    this._sdatos.setObs_Combos({ accion: 'r_numreg', PRODUCTO: this.DProductos.PRODUCTO, 
                                 datos: this.VDatosReg ? JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1].PRO_KITS)) : [] 
                              });
    this._sdatos.setObs_ProEspec({ accion: 'r_numreg', PRODUCTO: this.DProductos.PRODUCTO });
    this._sdatos.setObs_ProCompo({ accion: 'r_numreg', PRODUCTO: this.DProductos.PRODUCTO });
    this._sdatos.setObs_Proveedores({ accion: 'r_numreg', PRODUCTO: this.DProductos.PRODUCTO });
    this._sdatos.setObs_Bodegas({ accion: 'r_numreg', PRODUCTO: this.DProductos.PRODUCTO });
    this._sdatos.setObs_Cubicaje({ accion: 'r_numreg', PRODUCTO: this.DProductos.PRODUCTO });
    this.eventsSubjectDocum.next({ accion: 'r_numreg', PRODUCTO: this.DProductos.PRODUCTO });
    this.eventsSubjectPres.next({ accion: 'r_numreg', PRODUCTO: this.DProductos.PRODUCTO });

    // Asocia faltantes
    if (this.prmUsrAplBarReg.r_numReg-1 >= 0 && this.VDatosReg.length !== 0) {
      this.DProductos.PRO_KITS = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1].PRO_KITS));
      this.QFiltro = this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1].QFILTRO;
        if (this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1].CONTROL_CAMBIOS.length === 0) {
          this.DProductos.CONTROL_CAMBIOS = [];
        }
        else {
          if (this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1].CONTROL_CAMBIOS.map(c => c.CONCEPTO) !== null)
            this.DProductos.CONTROL_CAMBIOS = this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1].CONTROL_CAMBIOS.map(c => c.CONCEPTO);
          else 
            this.DProductos.CONTROL_CAMBIOS = [];
        }

      // Acondiciona peril tributario
      if (this.DProductos.PERFIL_TRIBUTARIO !== undefined) {
        if (!Array.isArray(this.DProductos.PERFIL_TRIBUTARIO))
          this.DProductos.PERFIL_TRIBUTARIO = this.DProductos.PERFIL_TRIBUTARIO.split('|');
        this.gridBoxGrav = this.DProductos.PERFIL_TRIBUTARIO;
      }
  
    }
    // Visualiza la bodega
    if (this.DProductos.INVENTARIO) {
      this.seccionInfoPro[0] = 'block';
    }
    else {
      this.seccionInfoPro[0] = 'none';
    }

    // Activa objetos
    if (this.DProductos.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
      this.seccionInfoPro[1] = 'none';
      this.seccionInfoPro[2] = '';
      this.accordionExpand[1] = false;
      this.accordionExpand[2] = true;
      this.accordionExpand[3] = true;
      if (this.DProductos.CLASE.match('Producto simple|Parte simple')) {
        if (this.DProductos.NUM_PARTES === 0) {  // Sin Partes
          this.seccionInfoPro[2] = 'none';
          this.accordionExpand[2] = false;
          this.accordionExpand[3] = true;
        }
      } 
    } else {
      if (this.DProductos.CLASE === 'COMBO') {
        this._sdatos.setObs_Combos({ accion: 'r_numreg', 
                                     datos: JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1].PRO_KITS)) });
        this.seccionInfoPro[1] = '';
        this.seccionInfoPro[2] = 'none';
        this.accordionExpand[1] = true;
        this.accordionExpand[2] = false;
        this.accordionExpand[3] = true;
      } else {
        this.seccionInfoPro[1] = 'none';
        this.seccionInfoPro[2] = 'none';
        this.accordionExpand[1] = false;
        this.accordionExpand[2] = false;
        this.accordionExpand[3] = true;
      }
    }

    // Rutas de la imagenes
    this._sgenerales.bajar_archivo('BAJAR IMAGENES',{PRODUCTO:this.DProductos.PRODUCTO},'spProductos')
      .subscribe({ 
      next: (varch: any)=> {
        // Adiciona el path en el vector de la galería
        if (varch[0].ErrMensaje === '') {
          const vdatimg = varch.map(i => i.path);
          const vbaseimg = varch.map(i => i.data);

          this.DImagenesThumb = [];

          this.DImagenesPro = vdatimg;
          setTimeout(() => {
            this.galleryPro.instance.goToItem(0, false);
          }, 300);
        }
        else {
          this.DImagenesPro = ['/assets/no-image.jpg'];
        }
      },
      error: (err => {
        this.showModal('Error procesando imagenes: '+err.message);
      })
    });

    // Asocia a dropdowns
    this.treeBoxGrupo = [this.DProductos.ID_GRUPO];
    this.tvValorClase = this.DProductos.CLASE;

    // Inactiva cambios - Generales
    if (this.tabActiva === 0) {
      const objControl = ['__obj__ddEstado','__obj__ddClase','__obj__ddMarca','__obj__xs__ID_UDM','__obj__ddGrupo','__obj__ddProveedor'];
      objControl.forEach(c => {
        this.cambiosItemForma({ dataField: c }, 'inactivar');
      })
      var itemsgru:any = this.formPro.instance.option("items");
      itemsgru.forEach(g => {
        var items = g['items'];
        if (items !== undefined) {
          items.forEach(itemfrm => {
            if (itemfrm.dataField)
              this.cambiosItemForma({ dataField: itemfrm.dataField }, 'inactivar');
          });
        }
      })
    }

  }

  opEliminar(): void {
    // Confirma...
    Swal.fire({
      title: '',
      text: '',
      html: "¿Desea eliminar el producto <i>" +
            this.DProductos.PRODUCTO +
            " " +
            this.DProductos.NOMBRE +
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
				this.AccionEliminar();
      }
    });

  }
  // Ejecuta la eliminación
  AccionEliminar(): void {

    // API eliminación de datos
    const prm = { CODIGO: this.DProductos.PRODUCTO };
    this._sdatos
      .delete('delete',prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = validatorRes(data);
        try {
          // if ( (res.token != undefined) ){
          //   const refreshToken = res.token;
          //   localStorage.setItem("token", refreshToken);
          // }
          if (res[0].ErrMensaje !== '') {
            this.showModal(res[0].ErrMensaje);
            return;
          }

          // Elimina y posiciona en el Array de Consulta
          this.opIrARegistro("Eliminado");
          showToast('Producto eliminado', 'success');
          this.objReadOnly.readOnly = true;
          this.objReadOnly.readOnlyClase = true;
          this.objReadOnly.readOnlyProducto = true;
          this.objReadOnly.ETAPA = true;
          // Operaciones de barra
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: "",
            accion: this.prmUsrAplBarReg.r_totReg !== 0 ? 'r_navegar' : 'r_ini',
            operacion: {}
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } 
        catch (error) {
          this.showModal('Error al eliminar producto: '+error);
        }
    });
  }

  copiarProducto(): void {
    this.DProductos_prev = this.DProductos;
    this.D_Atributos_prev = this._sdatos.D_Atributos;
    this.D_Partes_prev = this._sdatos.D_Partes;
    this.D_Espec_prev = this._sdatos.D_Espec;
    this.D_Compo_prev = this._sdatos.D_Compo;
    this.D_Proveedores_prev = this._sdatos.D_Proveedores;
    this.D_Combos_prev = this._sdatos.D_Combos;
    this.D_Bodegas_prev = this._sdatos.D_Bodegas;
    this.D_Cubicaje_prev = this._sdatos.D_Cubicaje;
    this.valoresObjetos('consecutivo');
    this.mnuAccion = "new";
    this.objReadOnly.readOnlyClase = false;
    this.objReadOnly.readOnly = false;
    this.objReadOnly.ETAPA = false;
    this.opPrepararModificar();
  }
  
  // Vista/Zoom de los datos consultados
  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: "Productos",
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: '',
      Filtro: '',
      keyGrid: ['PRODUCTO']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  resetValidaciones() {
    // this.formPro.instance.resetValues();
    if (this.validClase) this.validClase.instance.reset();
    if (this.validEstado) this.validEstado.instance.reset();
    if (this.validUM) this.validUM.instance.reset();
    if (this.valIdUMProv) this.valIdUMProv.instance.reset();
  }
  
  // Altera texto de codigo de producto
  productosValor(e: any) {
    if(this.newConsecutivo) {
      if(e.value !== undefined && e.value !== null && e.value !== '') {
        this.DProductos.PRODUCTO = e.value.toUpperCase();
        this._sdatos.PRODUCTO = this.DProductos.PRODUCTO;
        if (this.DProductos.CODIGO_ASOCIADO === '' ||
          this.DProductos.CODIGO_ASOCIADO === null ||
          this.DProductos.CODIGO_ASOCIADO === undefined
        ){
          this.DProductos.CODIGO_ASOCIADO = this.DProductos.PRODUCTO;
        }
      }
    }
  }

  toUpperCase(e: any) {
    if (e.value !== '') {
      const element = e.value[0].toUpperCase() + e.value.slice(1).toLowerCase();
      this.DProductos.NOMBRE = element;
    }
  }

  // Navegacion con ENTER
  onEditorEnterKey(e:any) {
    e.event.preventDefault();
    var itemsgru:any = this.formPro.instance.option("items");
    itemsgru.forEach(g => {
      var items = g['items'];
      var index = items.findIndex(item => item.dataField === e.dataField);
      if (index !== -1) {
        var fNextEditor = this.formPro.instance.getEditor(items[++index < items.length ? index : 0].dataField);
        if (fNextEditor) fNextEditor.focus();
        return;
      }
    })
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
  onValueChangedRuta(e:any) {
    if (this.mnuAccion.match('new|update')) {
      if (e.value === null ||e.value === undefined || e.value.length === 0) {
        this.DProductos.ID_RUTA = '';
        this.openRutas = false;
      }
    }
  }
  onSeleccRuta(e: any): void {
    if (this.mnuAccion.match('new|update')) {
      this._sdatos.conCambios = this._sdatos.conCambios + 1;
      this.DProductos.ID_RUTA = e.selectedRowKeys[0];
      this.cambiosItemForma({ dataField: '__obj__ddRuta'});
      this.openRutas = false;
    }
  }
  onSeleccEstado(e: any): void {
    if (this.mnuAccion.match('new|update')) {
      this._sdatos.conCambios = this._sdatos.conCambios + 1;
      this.DProductos.ESTADO = e.value;
      this.cambiosItemForma({ dataField: '__obj__ddEstado'});
    }
  }
  onSeleccClase(e: any): void {
    if (this.mnuAccion.match('new|update')) {
      this.DProductos.CLASE = e.value;
      this.cambiosItemForma({ dataField: '__obj__ddClase'});
    }
  }
  onSeleccMarca(e: any): void {
    if (this.mnuAccion.match('new|update')) {
      if ((e.value !== null) && (e.value !== undefined) && (e.value !== '')) {
        this._sdatos.conCambios = this._sdatos.conCambios + 1;
        this.DProductos.MARCA = e.value;
        this.cambiosItemForma({ dataField: '__obj__ddMarca'});
      }
    }
  }
  onSeleccUM(e: any): void {
    if (this.mnuAccion.match('new|update')) {
      if ((e.value !== null) && (e.value !== undefined) && (e.value !== '')) {
        this._sdatos.conCambios = this._sdatos.conCambios + 1;
        this.DProductos.ID_UDM = e.value;
        this.cambiosItemForma({ dataField: '__obj__xs__ID_UDM'});
      }
    }
  }
  onSeleccUMProv(e: any): void {
    if (!e.value) return;
    this._sdatos.conCambios = this._sdatos.conCambios + 1;
    // this.DProductos.ID_UDM_PROV = e.value.split(';')[0];
    this.cambiosItemForma({ dataField: '__obj__xs__ID_UDM'});
  }

  onSelectionChangedUDMProveedor(e:any) {
    if(e.selectedRowKeys.length === 0) {
      this.openUDMProveedor = false;
      this.gridBoxUDMProveedor = [];
      this.DProductos.ID_UDM_PROV = '';
    } else {
      this.DProductos.ID_UDM_PROV = e.selectedRowKeys[0];
      this.openUDMProveedor = false;
    }
  }

  onSelectionChangedUDMPresentacion(e:any) {
    if(e.selectedRowKeys.length === 0) {
      this.openUDMedidas = false;
      this.gridBoxUDMPresentacion = [];
      this.DProductos.ID_UDM = '';
    } else {
      this.DProductos.ID_UDM = e.selectedRowKeys[0];
      this.openUDMedidas = false;
    }
  }

  // Cargar imagenes
  imagenClick(operacion, producto) {
    // Valida si hay producto 
    if (producto === null || producto === undefined || producto === '') {
      this.showModal('Debe tener asignado un código de producto!','Código inválido');
    }
    else {
      var event;
      var file;
      if (operacion["accion"]) {
        event = operacion.e;
        file = operacion.file;
        operacion = operacion.accion;
      }
      switch (operacion) {
        case 'icon-upload-file-sl':
        case 'file-loader':
          // this.operArcImg(operacion, producto);
          this.fileChangeEvent(event, producto, file);    
          break;
      
        case 'icon-eliminar-sl':
          if (this.DImagenesPro.length === 0) {
            this.showModal('No hay imagenes para eliminar','Sin imagenes');
            return;
          }
          Swal.fire({
            title: '',
            text: '¿Desea eliminar la imagen actual?',
            iconHtml: "<i class='icon-alert-ol'></i>",
            showCancelButton: true,
            confirmButtonColor: '#DF3E3E',
            cancelButtonColor: '#438ef1',
            cancelButtonText: 'No',
            confirmButtonText: 'Sí, eliminar'
          }).then((result) => {
            if (result.isConfirmed) {
              const index = this.galleryPro.selectedIndex;
              this.DImagenesPro.splice(index,1);
              this.galleryPro.instance.repaint();
              this._sdatos.conCambios = this._sdatos.conCambios + 1;
            }
          });
          break;
      
        case 'icon-eliminar-todo-sl':
          Swal.fire({
            title: '',
            text: '¿Desea eliminar todas las imagenes?',
            iconHtml: "<i class='icon-alert-ol'></i>",
            showCancelButton: true,
            confirmButtonColor: '#DF3E3E',
            cancelButtonColor: '#438ef1',
            cancelButtonText: 'No',
            confirmButtonText: 'Sí, eliminar'
          }).then((result) => {
            if (result.isConfirmed) {
              this.DImagenesPro.splice(0,this.DImagenesPro.length);
              this.DImagenesPro = ['/assets/no-image.jpg'];
              this.galleryPro.instance.repaint();
              this._sdatos.conCambios = this._sdatos.conCambios + 1;
            }
          });
          break;
      
        default:
          break;
      }
      this._sdatos.conCambios = this._sdatos.conCambios + 1;

    }
  }

  // Selecciona imagen del thumbnail
  seleccImg(img) {
    const ix = this.DImagenesPro.indexOf(img);
    if (ix !== -1)
      this.galleryPro.instance.goToItem(ix, false);
  }


  // Llama al cargue del archivo ** MODO INPUT **
  operArcImg(event: Event, producto) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result || null;
        this.fileChangeEvent(e, producto, e);
      };
      reader.readAsDataURL(file);
    }
    else {
      this.imageAtributo = "/assets/no-image.jpg";
    }
  }

  // Llama al cargue del archivo
  datAtr: any;
  operArcImg__old(operArch, producto) {
    // Operación de cargue de archivo
    if(operArch.match('cargar|icon-upload-file-sl')) {
      let input = document.createElement('input');
      input.type = 'file';
      input.accept="image/*";
      /*input.onchange = (e) => {
        this.fileChangeEvent(e, producto);    
      }*/
      input.addEventListener("change", (e) => {
        this.fileChangeEvent(e, producto, e);    
      });
      input.click();
    }
    //Elimina archivo
    else {
      this.imageAtributo = "/assets/no-image.jpg";
    }
  }

  imageError: string = '';
  tamArchivoImg: any;
  imgBase64zip: any;
  async fileChangeEvent(fileInput: any, producto: any, file: any) {
    this.imageError = '';
    producto = this.DProductos.PRODUCTO;
    const larch = file.name;
    if (file.name) {
      // Size Filter Bytes
      const max_size = 1000000;
      const allowed_types = ['image/png', 'image/jpeg'];
      const max_height = 15200;
      const max_width = 25600;

      /*if (fileInput.target.files[0].size > max_size) {
        this.imageError = 'El máximo tamaño no debe supearar los 1.000.000 Kbytes ó ' + max_size / 1000000 + 'Mb';
        this.showModal(this.imageError);
        return false;
      }*/
      this.tamArchivoImg = file.size;

      /*if (!_.includes(allowed_types, fileInput.target.files[0].type)) {
        this.imageError = 'Only Images are allowed ( JPG | PNG )';
        return false;
      }*/

      const image = new Image();
      image.src = fileInput.target.result;
      image.onload = async (rs:any) => {
        const img_height = rs.currentTarget['height'];
        const img_width = rs.currentTarget['width'];

        if (img_height > max_height && img_width > max_width) {
          this.imageError =
            'Máximas dimensiones permitidas: ' +
            max_height +
            '*' +
            max_width +
            'px';
          this.showModal(this.imageError);
          return false;
        } else {
          // Guarda archivo en la url
          var filename = producto.replace(/[ &\/\\#,+()$~%.'":*?<>{}]/g, "");
          const ext = larch.substring(larch.lastIndexOf(".")+1);
          var imgBase64Path = fileInput.target.result;
          if (this.DImagenesPro[0].match('no-image')) 
            filename += '_1.' + ext;
          else
            filename += '_' + (this.DImagenesPro.length+1) + '.' + ext;

          // Redimensionar tamaño si supera determinado tamaño
          if (this.tamArchivoImg > 100000) {
            await this.compressImage(imgBase64Path, 600, 600, img_width, img_height).then(compressed => {
              this.DImagenesThumb.push({ img: imgBase64Path, thumb: compressed } );
              imgBase64Path = compressed;
            })
          }

          this._sgenerales.cargar_archivo('PRO022/'+filename, imgBase64Path)
            .subscribe({ 
              next: (arch: any)=> {
                // Elimina el item 0 no-image
                if (this.DImagenesPro[0].match('no-image')) this.DImagenesPro.splice(0,1);
                // Adiciona el path en el vector de la galería
                this.DImagenesPro.push(arch);
                setTimeout(() => {
                  this.galleryPro.instance.goToItem(this.DImagenesPro.length-1, false);
                }, 1000);
              }, error: (err => {
                this.showModal('Error cargue de archivo: '+err.message);
              })
            });
          return true;
        }
      };
      this._sdatos.conCambios = this._sdatos.conCambios + 1;

      return true;
    } else {
      this._sdatos.conCambios = this._sdatos.conCambios - 1;
      return false;
    }
  }

  async fileChangeEvent__old(fileInput: any, producto: any) {
    this.imageError = '';
    const larch = fileInput.target.files[0].name;
    if (fileInput.target.files && fileInput.target.files[0]) {
      // Size Filter Bytes
      const max_size = 1000000;
      const allowed_types = ['image/png', 'image/jpeg'];
      const max_height = 15200;
      const max_width = 25600;

      /*if (fileInput.target.files[0].size > max_size) {
        this.imageError = 'El máximo tamaño no debe supearar los 1.000.000 Kbytes ó ' + max_size / 1000000 + 'Mb';
        this.showModal(this.imageError);
        return false;
      }*/
      this.tamArchivoImg = fileInput.target.files[0].size;

      /*if (!_.includes(allowed_types, fileInput.target.files[0].type)) {
        this.imageError = 'Only Images are allowed ( JPG | PNG )';
        return false;
      }*/
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const image = new Image();
        image.src = e.target.result;
        image.onload = async (rs:any) => {
          const img_height = rs.currentTarget['height'];
          const img_width = rs.currentTarget['width'];

          if (img_height > max_height && img_width > max_width) {
            this.imageError =
              'Máximas dimensiones permitidas: ' +
              max_height +
              '*' +
              max_width +
              'px';
            this.showModal(this.imageError);
            return false;
          } else {
            // Guarda archivo en la url
            var filename = producto.replace(/[ &\/\\#,+()$~%.'":*?<>{}]/g, "");
            const ext = larch.substring(larch.lastIndexOf(".")+1);
            var imgBase64Path = e.target.result;
            if (this.DImagenesPro[0].match('no-image')) 
              filename += '_1.' + ext;
            else
              filename += '_' + (this.DImagenesPro.length+1) + '.' + ext;

            // Redimensionar tamaño si supera determinado tamaño
            if (this.tamArchivoImg > 100000) {
              await this.compressImage(imgBase64Path, 600, 600, img_width, img_height).then(compressed => {
                this.DImagenesThumb.push({ img: imgBase64Path, thumb: compressed } );
                imgBase64Path = compressed;
              })
            }

            this._sgenerales.cargar_archivo('img/PRO022/'+filename, imgBase64Path)
              .subscribe({ 
                next: (arch: any)=> {
                  // Elimina el item 0 no-image
                  if (this.DImagenesPro[0].match('no-image')) this.DImagenesPro.splice(0,1);
                  // Adiciona el path en el vector de la galería
                  this.DImagenesPro.push(arch);
                  setTimeout(() => {
                    this.galleryPro.instance.goToItem(this.DImagenesPro.length-1, false);
                  }, 1000);
                }, error: (err => {
                  this.showModal('Error cargue de archivo: '+err.message);
                })
              });
            return true;
          }
        };
        this._sdatos.conCambios = this._sdatos.conCambios + 1;
      };

      if (this.imageError === '')
        reader.readAsDataURL(fileInput.target.files[0]);
      return true;
    } else {
      this._sdatos.conCambios = this._sdatos.conCambios - 1;
      return false;
    }
  }
  

  // Valide unicidad de la llave
  async ValideExistencia(e: any) {
    if (this.objReadOnly.readOnly || !this.mnuAccion.match('new|update')) {
      return (true);
    }
    if (this.mnuAccion === 'update' && this.DProductos_prev.PRODUCTO === e.value) {
      return (true);
    }

    // Valida la existencia de la llave respectiva
    const prm = { PRODUCTO: e.value, accion: this.mnuAccion };
    const apiRest = this._sdatos.validellave('EXISTE PRODUCTO',prm,'PRO022');
    let res = await lastValueFrom(apiRest, {defaultValue: true});
    res = JSON.parse(res.data); 
    if (res[0].ErrMensaje === '') {
      this._sdatos.conCambios = this._sdatos.conCambios + 1;
    }
    else {
      showToast(res[0].ErrMensaje, 'error');
      var fNextEditor:any = this.formPro.instance.getEditor('PRODUCTO');
      fNextEditor.focus();
      return (false);
    }

    // Valida si hay cambios de codigo, cambiar también los codigos de imagenes
    if (e.value !== '' && this.prev_PRODUCTO !== '' && this.prev_PRODUCTO !== e.value) {
      const nuevopro = e.value.replace(/[ &\/\\#,+()$~%.'":*?<>{}]/g, "");
      const antespro = this.prev_PRODUCTO;
      this._sgenerales.cargar_archivo('cambio|'+this.prev_PRODUCTO+'|'+nuevopro+'|img/PRO022', '')
      .subscribe({ 
        next: (arch: any)=> {
          for (var k=0; k<this.DImagenesPro.length; k++) {
            this.DImagenesPro[k] = this.DImagenesPro[k].replace(antespro, nuevopro);
          };
          setTimeout(() => {
            this.galleryPro.instance.goToItem(this.DImagenesPro.length-1, false);
          }, 1000);
        }, 
        error: (err => {
          this.showModal('Error en cambio de código de producto: '+err.message);
        })
      })
    }

    // Satisfactorio cambio
    this.prev_PRODUCTO = e.value;
    return (true);
  
  }

  onResized(event: any) {
    const width:number = event.newRect.width;
    const height:number = event.newRect.height;
    if(width < 728) {
      this.galleryTarget = 'galleryPro2';
      const constainer:any = document.getElementById('galleryPro2');
      if (constainer !== null)
        constainer.style.position = 'relative';
    } else {
      this.galleryTarget = 'galleryPro';
    };
  }

  valueSeleccGrupo(e:any) {}
  onContentReadyGrupo(e:any) {
    if(e.rowType === 'data') {
      if(!e.data.ASIGNABLE) {
        e.cellElement.style.opacity = '.5'
      }
    }
  }
  onSelectionGrupo(e:any) {
    if(e.selectedRowKeys.length > 0) {
      if(e.selectedRowsData[0].ASIGNABLE) {
        this._sdatos.conCambios = this._sdatos.conCambios + 1;
        this.isTreeBoxOpened = false;
        this.DProductos.ID_GRUPO = e.selectedRowKeys[0];
        this.cambiosItemForma({ dataField: '__obj__ddGrupo'});
      } else {
        this.DProductos.ID_GRUPO = '';
        this.treeBoxGrupo = [];
        this.isTreeBoxOpened = true;
      }
    } else {
      this.DProductos.ID_GRUPO = '';
      this.treeBoxGrupo = [];
    }
  }
  onSelectionProv(e) {
    if (e.name === 'value') {
      if (e.value === null) this.DProductos.NOMBRE_PROVEEDOR = '';
      this.isGridBoxOpenedProv = false;
      this.cambiosItemForma({ dataField: '__obj__ddProveedor'});
    }
  }
  onSeleccRowProv(e) {
    if (e.data){
      this.DProductos.NOMBRE_PROVEEDOR = e.data.NOMBRE;
    }
  }
  onKeyDownProv(e) {
    e.component.open();
  }
  onKeyDownGrupo(e) {
    e.component.open();
  }
  onValueChangedGrav(e: any) {
    if (e.value === null) {  
      this.gridBoxGrav = [];
    }    
  }
  onOpenedGrav(e: any) {
    setTimeout(() => {
      const hd = e.component.element().scrollHeight;
      this.gridGravPT.height = hd - 60;
    }, 300);
  }
  onSelectionChangedGrav(e, templateData: any) {
    var keys = e.selectedRowKeys;
    this._sdatos.conCambios = this._sdatos.conCambios + 1;
    //templateData.option('value', keys);
  }
  cerrarListaPT(e, accion, templateData) {
    if (accion === 'aceptar')
      templateData.option('value', this.gridBoxGrav);
    else
      this.gridBoxGrav = this.DProductos.PERFIL_TRIBUTARIO === '' ? [] : this.DProductos.PERFIL_TRIBUTARIO;
    templateData.close();
  }

  // Muestr las tasas solo seleccionadas
  onSoloSeleccGrav(e) {

    this.gridGravPT.instance.getDataSource().items().forEach(fdata => {
      fdata.IsActive = true;
      if (!this.gridGravPT.instance.isRowSelected(fdata.ID_TASA)) {
        fdata.IsActive = !e.value;
      }
    });
    this.gridGravPT.instance.option("filterValue", ["IsActive", "=", e.value]);
    this.gridGravPT.instance.repaint();
  }

  onValueCODIGO_ASOCIADO(e:any) {
    if(e.value !== this.DProductos.CODIGO_ASOCIADO) {
      this.DProductos.CODIGO_ASOCIADO = e.value;
      this._sdatos.conCambios = this._sdatos.conCambios + 1;
    }
  }

  verPorTasa(porc:any) {
    return formatNumber(porc, 'en-US', '1.2-2');
  }
  onOpenedClase(e:any) {
    if (this.treeListaClases === undefined) return;
    this.treeListaClases.instance.expandAll();
  }
  async claseProSelectedTVanterior(e:any, dropDownBoxComponent:any) {
    if (!e.event) return;
    if (e.component.getSelectedNodeKeys().length === 0) return;
    let cambioClase: any = false;
    if (this.mnuAccion === 'update') {
      cambioClase = await new Promise((resolve, reject) => {
        const prm = {PRODUCTO: this._sdatos.PRODUCTO, CLASE_ANT: this.tvValorClase, CLASE_NEW: e.itemData.CLASE};
        this._sdatos.consulta('cambios clase', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe(async (data: any) => {
          const res = validatorRes(data);
          if (res[0].ErrMensaje === '') {
            if ((res[0].FAC !== '') || (res[0].KAR !== '') || (res[0].MAT !== '') || (res[0].PED !== '') ) {
              await Swal.fire({
                title: '¡ADVERTENCIA!',
                text: 'El producto tiene movimientos no puede modificar su clase.',
                iconHtml: "<i class='icon-alert-ol'></i>",
                showCancelButton: false,
                confirmButtonColor: '#DF3E3E',
                confirmButtonText: 'OK'
              }).then((result) => {
                if (result.isConfirmed) {
                  resolve (true);
                }
                else {
                  resolve (true);
                }
              });
            } else {
              resolve (false);
            };
          } else {
            await this.showModal(res[0].ErrMensaje);
            resolve (true);
          }    
        });    
      });
    }

    if (cambioClase)
      return;

    // Valida si hubo cambio de clase
    if (this.tvValorClase === null) this.tvValorClase = '';
    const isCanceled = await new Promise((resolve, reject) => {
      let msgCambio: any = [];
      if (e.itemData.CLASE !== this.tvValorClase) {
        if(e.itemData.CLASE.match('Producto simple|Parte simple')) {
          this.DProductos.CLASE = e.itemData.CLASE;
          this._sdatos.PRODUCTO_CLASE = this.DProductos.CLASE;
          if(!this.tvValorClase.match('Producto simple|Parte simple'))
            if ((this._sdatos.D_Atributos??[]).length !== 0) {msgCambio.push(' Atributos')};
          if ((this._sdatos.D_Bodegas??[]).length !== 0) {msgCambio.push(' Bodegas')};
          if ((this._sdatos.D_Combos??[]).length !== 0) {msgCambio.push(' Combos')};
          if ((this._sdatos.D_Compo??[]).length !== 0) {
            let con = 0;
            this._sdatos.D_Compo.forEach(ele => {
              if (ele.DETALLE !== '') con = con + 1;
            });
            if (con > 0) msgCambio.push(' Composición');
          };
          if ((this._sdatos.D_Cubicaje??[]).length !== 0) {msgCambio.push(' Cubicaje')};
          if ((this._sdatos.D_Espec??[]).length !== 0) {
            let con = 0;
            this._sdatos.D_Espec.forEach(ele => {
              if (ele.INFO !== '') con = con + 1;
            });
            if (con > 0) msgCambio.push(' Especificaciones')
          };
          if ((this._sdatos.D_Partes??[]).length !== 0) {msgCambio.push(' Partes')};
          if ((this._sdatos.D_Proveedores??[]).length !== 0) {msgCambio.push(' Proveedores')};


          if (msgCambio.length !== 0) {
            Swal.fire({
              title: '¡ADVERTENCIA!',
              iconHtml: "<i class='icon-alert-ol'></i>",
              html: "Hay datos en: <br>" + 
                    "<b>"+ msgCambio + "</b><br>" +
                    "Se perderan si cambia la clase.",
              showCancelButton: true,
              confirmButtonColor: '#DF3E3E',
              cancelButtonColor: '#438ef1',
              cancelButtonText: 'No',
              confirmButtonText: 'Si, Perder datos'
            }).then((result) => {
              if (result.isConfirmed) {
                if(!this.tvValorClase.match('Producto simple|Parte simple'))
                  this._sdatos.setObs_ProAtributos({ accion: 'r_ini', esEdicion: true});
                this._sdatos.setObs_ProPartes({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Combos({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_ProEspec({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_ProCompo({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Proveedores({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Bodegas({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Cubicaje({ accion: 'r_ini', esEdicion: true });
                this.eventsSubjectDocum.next({ accion: 'r_ini', esEdicion: true });
                resolve (true);
              } else {
                resolve (false);
              }
            });
          } else {
            resolve (true);
          }

        } else 
        if(e.itemData.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
          this.DProductos.CLASE = e.itemData.CLASE;
          this._sdatos.PRODUCTO_CLASE = this.DProductos.CLASE;
          if (!this.tvValorClase.match('Juego|Producto compuesto|Parte compuesta')) {
            if ((this._sdatos.D_Atributos??[]).length !== 0) {msgCambio.push(' Atributos')};
            if ((this._sdatos.D_Partes??[]).length !== 0) {msgCambio.push(' Partes')};
          }
          if ((this._sdatos.D_Bodegas??[]).length !== 0) {msgCambio.push(' Bodegas')};
          if ((this._sdatos.D_Combos??[]).length !== 0) {msgCambio.push(' Combos')};
          if ((this._sdatos.D_Compo??[]).length !== 0) {
            let con = 0;
            this._sdatos.D_Compo.forEach(ele => {
              if (ele.DETALLE !== '') con = con + 1;
            });
            if (con > 0) msgCambio.push(' Composición');
          };
          if ((this._sdatos.D_Cubicaje??[]).length !== 0) {msgCambio.push(' Cubicaje')};
          if ((this._sdatos.D_Espec??[]).length !== 0) {
            let con = 0;
            this._sdatos.D_Espec.forEach(ele => {
              if (ele.INFO !== '') con = con + 1;
            });
            if (con > 0) msgCambio.push(' Especificaciones')
          };
          if ((this._sdatos.D_Proveedores??[]).length !== 0) {msgCambio.push(' Proveedores')};

          if (msgCambio.length !== 0) {
            Swal.fire({
              title: '¡ADVERTENCIA!',
              iconHtml: "<i class='icon-alert-ol'></i>",
              html: "Hay datos en: <br>" + 
                    "<b>"+ msgCambio + "</b><br>" +
                    "Se perderan si cambia la clase.",
              showCancelButton: true,
              confirmButtonColor: '#DF3E3E',
              cancelButtonColor: '#438ef1',
              cancelButtonText: 'No',
              confirmButtonText: 'Si, Perder datos'
            }).then((result) => {
              if (result.isConfirmed) {
                if (!this.tvValorClase.match('Juego|Producto compuesto|Parte compuesta')) {
                  this._sdatos.setObs_ProAtributos({ accion: 'r_ini', esEdicion: true});
                  this._sdatos.setObs_ProPartes({ accion: 'r_ini', esEdicion: true });
                }
                this._sdatos.setObs_Combos({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_ProEspec({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_ProCompo({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Proveedores({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Bodegas({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Cubicaje({ accion: 'r_ini', esEdicion: true });
                this.eventsSubjectDocum.next({ accion: 'r_ini', esEdicion: true });
                resolve (true);
              } else {
                resolve (false);
              }
            });
          } else {
            resolve (true);
          }

        } else {
          
          this.DProductos.CLASE = e.itemData.CLASE;
          this._sdatos.PRODUCTO_CLASE = this.DProductos.CLASE;
          if ((this._sdatos.D_Atributos??[]).length !== 0) {msgCambio.push(' Atributos')};
          if ((this._sdatos.D_Bodegas??[]).length !== 0) {msgCambio.push(' Bodegas')};
          if ((this._sdatos.D_Combos??[]).length !== 0) {msgCambio.push('Combos')};
          if ((this._sdatos.D_Compo??[]).length !== 0) {
            let con = 0;
            this._sdatos.D_Compo.forEach(ele => {
              if (ele.DETALLE !== '') con = con + 1;
            });
            if (con > 0) msgCambio.push(' Composición');
          };
          if ((this._sdatos.D_Cubicaje??[]).length !== 0) {msgCambio.push(' Cubicaje')};
          if ((this._sdatos.D_Espec??[]).length !== 0) {
            let con = 0;
            this._sdatos.D_Espec.forEach(ele => {
              if (ele.INFO !== '') con = con + 1;
            });
            if (con > 0) msgCambio.push(' Especificaciones')
          };
          if ((this._sdatos.D_Partes??[]).length !== 0) {msgCambio.push(' Partes')};
          if ((this._sdatos.D_Proveedores??[]).length !== 0) {msgCambio.push(' Proveedores')};

          if (msgCambio.length !== 0) {
            Swal.fire({
              title: '¡ADVERTENCIA!',
              iconHtml: "<i class='icon-alert-ol'></i>",
              html: "Hay datos en: <br>" + 
                    "<b>"+ msgCambio + "</b><br>" +
                    "Se perderan si cambia la clase.",
              showCancelButton: true,
              confirmButtonColor: '#DF3E3E',
              cancelButtonColor: '#438ef1',
              cancelButtonText: 'No',
              confirmButtonText: 'Si, Perder datos'
            }).then((result) => {
              if (result.isConfirmed) {
                this._sdatos.setObs_ProAtributos({ accion: 'r_ini', esEdicion: true});
                this._sdatos.setObs_ProPartes({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Combos({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_ProEspec({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_ProCompo({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Proveedores({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Bodegas({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Cubicaje({ accion: 'r_ini', esEdicion: true });
                this.eventsSubjectDocum.next({ accion: 'r_ini', esEdicion: true });
                resolve (true);
              } else {
                resolve (false);
              }
            });
          } else {
            resolve (true);
          }

        }
      } else {
        resolve (false);
      }
    });

    // Inicializa vectores
    if (!isCanceled)
      return;
    
    this.tvValorClase = e.itemData.CLASE;
    this.isTvClaseBoxOpened = false;
    this.DProductos.CLASE = this.tvValorClase;
    this._sdatos.PRODUCTO_CLASE = this.DProductos.CLASE;
    if(e.component.getSelectedNodeKeys().length > 0) {
      dropDownBoxComponent.close();
    }

    // Selección de Simple o Compuesto
    var isProductoFab = 'no grid';

    if (this.tvValorClase.match('Producto simple|Parte simple'))
      isProductoFab ='sin partes';
    if (this.tvValorClase.match('Juego|Producto compuesto|Parte compuesta'))
      isProductoFab ='partes';

    switch (isProductoFab) {
      case 'partes':
        this.seccionInfoPro[1] = 'none';
        this.seccionInfoPro[2] = '';
        this.seccionInfoProDos[0] = 'none';
        this.accordionExpand[1] = false; 
        this.accordionExpand[2] = true; 
        this.accordionExpand[3] = true; 
        // this.titProParte = 'Partes';
        break;
      case 'sin partes':
        this.seccionInfoPro[1] = 'none';
        this.seccionInfoPro[2] = 'none';
        this.seccionInfoProDos[0] = 'none';
        this.accordionExpand[1] = false; 
        this.accordionExpand[2] = false; 
        this.accordionExpand[3] = true; 
        // this.titProParte = 'Productos';
        break;
      case 'no grid':
        this.seccionInfoPro[1] = 'none';
        this.seccionInfoPro[2] = 'none';
        this.seccionInfoProDos[0] = 'block';
        this.accordionExpand[1] = false;
        this.accordionExpand[2] = false;
        this.accordionExpand[3] = true;
        // this.titProParte = 'Productos';
        break;
      default:
        break;
    }

    if (this.tvValorClase.match('Juego|Producto compuesto|Parte compuesta|Producto simple|Parte simple')) {
      // Maneja Etapa
      this.objReadOnly.ETAPA = false;
      this.DProductos.ETAPA = 'PRODUCCION';
    } else {
      // No maneja Etapa
      this.objReadOnly.ETAPA = true;
      this.DProductos.ETAPA = '';
    }
    this._sdatos.setObs_ProPartes({ operacion: this.tvValorClase });
    this._sdatos.setObs_ProAtributos({ accion: 'r_numreg' });
    // Detecta cambios
    this.cdf.detectChanges();
    this._sdatos.conCambios = this._sdatos.conCambios + 1;

  }

  // **** Control de CLASE  de producto ***********
  async claseProSelected(e:any, dropDownBoxComponent:any) {
    if (e.addedItems.length === 0) return;

    let cambioClase: any = false;
    dropDownBoxComponent.close();
    
    if (this.mnuAccion === 'update') {
      cambioClase = await new Promise((resolve, reject) => {
        const prm = {PRODUCTO: this._sdatos.PRODUCTO, CLASE_ANT: this.tvValorClase, CLASE_NEW: e.addedItems[0].CLASE};
        this._sdatos.consulta('cambios clase', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe(async (data: any) => {
          const res = validatorRes(data);
          if (res[0].ErrMensaje === '') {
            if ((res[0].FAC !== '') || (res[0].KAR !== '') || (res[0].MAT !== '') || (res[0].PED !== '') ) {
              await Swal.fire({
                title: '¡ADVERTENCIA!',
                text: 'El producto tiene movimientos no puede modificar su clase.',
                iconHtml: "<i class='icon-alert-ol'></i>",
                showCancelButton: false,
                confirmButtonColor: '#DF3E3E',
                confirmButtonText: 'OK'
              }).then((result) => {
                if (result.isConfirmed) {
                  resolve (true);
                }
                else {
                  resolve (true);
                }
              });
            } else {
              resolve (false);
            };
          } else {
            await this.showModal(res[0].ErrMensaje);
            resolve (true);
          }    
        });    
      });
    }

    if (cambioClase)
      return;

    // Valida si hubo cambio de clase
    if (this.tvValorClase === null) this.tvValorClase = '';
    const isCanceled = await new Promise((resolve, reject) => {
      let msgCambio: any = [];

      if (e.addedItems[0].CLASE !== this.tvValorClase) {
        if(e.addedItems[0].CLASE.match('Producto simple|Parte simple')) {
          this.DProductos.CLASE = e.addedItems[0].CLASE;
          this._sdatos.PRODUCTO_CLASE = this.DProductos.CLASE;
          if(!this.tvValorClase.match('Producto simple|Parte simple'))
            if ((this._sdatos.D_Atributos??[]).length !== 0) {msgCambio.push(' Atributos')};
          if ((this._sdatos.D_Bodegas??[]).length !== 0) {msgCambio.push(' Bodegas')};
          if ((this._sdatos.D_Combos??[]).length !== 0) {msgCambio.push(' Combos')};
          if ((this._sdatos.D_Compo??[]).length !== 0) {
            let con = 0;
            this._sdatos.D_Compo.forEach(ele => {
              if (ele.DETALLE !== '') con = con + 1;
            });
            if (con > 0) msgCambio.push(' Composición');
          };
          if ((this._sdatos.D_Cubicaje??[]).length !== 0) {msgCambio.push(' Cubicaje')};
          if ((this._sdatos.D_Espec??[]).length !== 0) {
            let con = 0;
            this._sdatos.D_Espec.forEach(ele => {
              if (ele.INFO !== '') con = con + 1;
            });
            if (con > 0) msgCambio.push(' Especificaciones')
          };
          if ((this._sdatos.D_Partes??[]).length !== 0) {msgCambio.push(' Partes')};
          if ((this._sdatos.D_Proveedores??[]).length !== 0) {msgCambio.push(' Proveedores')};


          if (msgCambio.length !== 0) {
            Swal.fire({
              title: '¡ADVERTENCIA!',
              iconHtml: "<i class='icon-alert-ol'></i>",
              html: "Hay datos en: <br>" + 
                    "<b>"+ msgCambio + "</b><br>" +
                    "Se perderan si cambia la clase.",
              showCancelButton: true,
              confirmButtonColor: '#DF3E3E',
              cancelButtonColor: '#438ef1',
              cancelButtonText: 'No',
              confirmButtonText: 'Si, Perder datos'
            }).then((result) => {
              if (result.isConfirmed) {
                if(!this.tvValorClase.match('Producto simple|Parte simple'))
                  this._sdatos.setObs_ProAtributos({ accion: 'r_ini', esEdicion: true});
                this._sdatos.setObs_ProPartes({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Combos({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_ProEspec({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_ProCompo({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Proveedores({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Bodegas({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Cubicaje({ accion: 'r_ini', esEdicion: true });
                this.eventsSubjectDocum.next({ accion: 'r_ini', esEdicion: true });
                resolve (true);
              } else {
                resolve (false);
              }
            });
          } else {
            resolve (true);
          }

        } else if(e.addedItems[0].CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
          this.DProductos.CLASE = e.addedItems[0].CLASE;
          this._sdatos.PRODUCTO_CLASE = this.DProductos.CLASE;
          if (!this.tvValorClase.match('Juego|Producto compuesto|Parte compuesta')) {
            if ((this._sdatos.D_Atributos??[]).length !== 0) {msgCambio.push(' Atributos')};
            if ((this._sdatos.D_Partes??[]).length !== 0) {msgCambio.push(' Partes')};
          }
          if ((this._sdatos.D_Bodegas??[]).length !== 0) {msgCambio.push(' Bodegas')};
          if ((this._sdatos.D_Combos??[]).length !== 0) {msgCambio.push(' Combos')};
          if ((this._sdatos.D_Compo??[]).length !== 0) {
            let con = 0;
            this._sdatos.D_Compo.forEach(ele => {
              if (ele.DETALLE !== '') con = con + 1;
            });
            if (con > 0) msgCambio.push(' Composición');
          };
          if ((this._sdatos.D_Cubicaje??[]).length !== 0) {msgCambio.push(' Cubicaje')};
          if ((this._sdatos.D_Espec??[]).length !== 0) {
            let con = 0;
            this._sdatos.D_Espec.forEach(ele => {
              if (ele.INFO !== '') con = con + 1;
            });
            if (con > 0) msgCambio.push(' Especificaciones')
          };
          if ((this._sdatos.D_Proveedores??[]).length !== 0) {msgCambio.push(' Proveedores')};

          if (msgCambio.length !== 0) {
            Swal.fire({
              title: '¡ADVERTENCIA!',
              iconHtml: "<i class='icon-alert-ol'></i>",
              html: "Hay datos en: <br>" + 
                    "<b>"+ msgCambio + "</b><br>" +
                    "Se perderan si cambia la clase.",
              showCancelButton: true,
              confirmButtonColor: '#DF3E3E',
              cancelButtonColor: '#438ef1',
              cancelButtonText: 'No',
              confirmButtonText: 'Si, Perder datos'
            }).then((result) => {
              if (result.isConfirmed) {
                if (!this.tvValorClase.match('Juego|Producto compuesto|Parte compuesta')) {
                  this._sdatos.setObs_ProAtributos({ accion: 'r_ini', esEdicion: true});
                  this._sdatos.setObs_ProPartes({ accion: 'r_ini', esEdicion: true });
                }
                this._sdatos.setObs_Combos({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_ProEspec({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_ProCompo({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Proveedores({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Bodegas({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Cubicaje({ accion: 'r_ini', esEdicion: true });
                this.eventsSubjectDocum.next({ accion: 'r_ini', esEdicion: true });
                resolve (true);
              } else {
                resolve (false);
              }
            });
          } else {
            resolve (true);
          }

        } else {
          
          this.DProductos.CLASE = e.addedItems[0].CLASE;
          this._sdatos.PRODUCTO_CLASE = this.DProductos.CLASE;
          if ((this._sdatos.D_Atributos??[]).length !== 0) {msgCambio.push(' Atributos')};
          if ((this._sdatos.D_Bodegas??[]).length !== 0) {msgCambio.push(' Bodegas')};
          if ((this._sdatos.D_Combos??[]).length !== 0) {msgCambio.push('Combos')};
          if ((this._sdatos.D_Compo??[]).length !== 0) {
            let con = 0;
            this._sdatos.D_Compo.forEach(ele => {
              if (ele.DETALLE !== '') con = con + 1;
            });
            if (con > 0) msgCambio.push(' Composición');
          };
          if ((this._sdatos.D_Cubicaje??[]).length !== 0) {msgCambio.push(' Cubicaje')};
          if ((this._sdatos.D_Espec??[]).length !== 0) {
            let con = 0;
            this._sdatos.D_Espec.forEach(ele => {
              if (ele.INFO !== '') con = con + 1;
            });
            if (con > 0) msgCambio.push(' Especificaciones')
          };
          if ((this._sdatos.D_Partes??[]).length !== 0) {msgCambio.push(' Partes')};
          if ((this._sdatos.D_Proveedores??[]).length !== 0) {msgCambio.push(' Proveedores')};

          if (msgCambio.length !== 0) {
            Swal.fire({
              title: '¡ADVERTENCIA!',
              iconHtml: "<i class='icon-alert-ol'></i>",
              html: "Hay datos en: <br>" + 
                    "<b>"+ msgCambio + "</b><br>" +
                    "Se perderan si cambia la clase.",
              showCancelButton: true,
              confirmButtonColor: '#DF3E3E',
              cancelButtonColor: '#438ef1',
              cancelButtonText: 'No',
              confirmButtonText: 'Si, Perder datos'
            }).then((result) => {
              if (result.isConfirmed) {
                this._sdatos.setObs_ProAtributos({ accion: 'r_ini', esEdicion: true});
                this._sdatos.setObs_ProPartes({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Combos({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_ProEspec({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_ProCompo({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Proveedores({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Bodegas({ accion: 'r_ini', esEdicion: true });
                this._sdatos.setObs_Cubicaje({ accion: 'r_ini', esEdicion: true });
                this.eventsSubjectDocum.next({ accion: 'r_ini', esEdicion: true });
                resolve (true);
              } else {
                resolve (false);
              }
            });
          } else {
            resolve (true);
          }

        }
      } else {
        resolve (false);
      }
    });

    // Inicializa vectores
    if (!isCanceled)
      return;
    
    this.tvValorClase = e.addedItems[0].CLASE;
    this.isTvClaseBoxOpened = false;
    this.DProductos.CLASE = this.tvValorClase;
    this._sdatos.PRODUCTO_CLASE = this.DProductos.CLASE;
    if(e.addedItems.length > 0) {
      dropDownBoxComponent.close();
    }

    // Selección de Simple o Compuesto
    var isProductoFab = 'no grid';

    if (this.tvValorClase.match('Producto simple|Parte simple'))
      isProductoFab ='sin partes';
    if (this.tvValorClase.match('Juego|Producto compuesto|Parte compuesta'))
      isProductoFab ='partes';

    switch (isProductoFab) {
      case 'partes':
        this.seccionInfoPro[1] = 'none';
        this.seccionInfoPro[2] = '';
        this.seccionInfoProDos[0] = 'none';
        this.accordionExpand[1] = false; 
        this.accordionExpand[2] = true; 
        this.accordionExpand[3] = true; 
        if (this.mnuAccion.match('new|update'))
          this._sdatos.setObs_ProPartes({ accion: 'r_nuevo' });
        // this.titProParte = 'Partes';
        break;
      case 'sin partes':
        this.seccionInfoPro[1] = 'none';
        this.seccionInfoPro[2] = 'none';
        this.seccionInfoProDos[0] = 'none';
        this.accordionExpand[1] = false; 
        this.accordionExpand[2] = false; 
        this.accordionExpand[3] = true; 
        // this.titProParte = 'Productos';
        break;
      case 'no grid':
        this.seccionInfoPro[1] = this.DProductos.CLASE == 'COMBO' ? 'block' : 'none';
        this.seccionInfoPro[2] = 'none';
        this.seccionInfoProDos[0] = 'block';
        this.accordionExpand[1] = false;
        this.accordionExpand[2] = false;
        this.accordionExpand[3] = true;
        // this.titProParte = 'Productos';
        break;
      default:
        break;
    }

    if (this.tvValorClase.match('Juego|Producto compuesto|Parte compuesta|Producto simple|Parte simple')) {
      // Maneja Etapa
      this.objReadOnly.ETAPA = false;
      this.DProductos.ETAPA = 'PROTOTIPO';
    } else {
      // No maneja Etapa
      this.objReadOnly.ETAPA = true;
      this.DProductos.ETAPA = '';
    }

    if (!this.mnuAccion.match('new|update')) {
      this._sdatos.setObs_ProPartes({ operacion: this.tvValorClase });
      if (this.DProductos.CLASE === 'COMBO')
        this._sdatos.setObs_ProAtributos({ accion: 'r_ini', esEdicion: false});
      else
        this._sdatos.setObs_ProAtributos({ accion: 'r_numreg', operacion: this.tvValorClase });
    }


    if(this.DProductos.CLASE.match('Parte simple|Producto simple')){
      this.DRutas = this.DRutas_prev.filter((d:any) => d.TIPO === 'Rutas Simples');
    } else if(this.DProductos.CLASE.match('Parte compuesta|Producto compuesto|Juego')){
      this.DRutas = this.DRutas_prev.filter((d:any) => d.TIPO === 'Rutas Compuestas');
    }

    // Detecta cambios
    this.cdf.detectChanges();
    this._sdatos.conCambios = this._sdatos.conCambios + 1;

  }

  onValueChangedNombreProducto(e:any) {
    if(e.value !== undefined && e.value !== null && e.value !== '') {
      if(e.value.length <= 45) {
        this.conCambios++;
        this.DProductos.NOMBRE = e.value;
        this._sdatos.NOMBRE_PRODUCTO = this.DProductos.NOMBRE;
      } else {
        showToast('El nombre es muy largo, debe tener min:5 y max:45 caracteres.', 'error');
      }
    }
  }

  saveListaPrecios(e:any){
    if(!e){
      this.visibleListaPrecios = false;
    }else{
      const prm = ({LISTA: e});
      this._sdatos.save('update', prm, 'VEN-002').subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'Error');
        }
        else {
          showToast('Listas actualizadas con exito', 'success');
          this.visibleListaPrecios = false;
        }
      });
    }
  }

  // Muestra/Oculta grid de bodegas
  switchBodega(e:any, condicion:any) {
    if (e.value) {
      this.seccionInfoPro[0] = 'none';
      this.accordionExpand[0] = false;
      this._sdatos.setObs_Bodegas({ accion: 'asignar', bodegas: 'sin bodega' });
    } else {
      // this._sdatos.setObs_Bodegas({ accion: 'asignar', bodegas: 'sin bodega' });
      this.seccionInfoPro[0] = 'block';
      this.accordionExpand[0] = true;
    }
    this._sdatos.conCambios = this._sdatos.conCambios + 1;
  }

  switchInventario(e:any) {
    if (e.value) {
      // this.DProductos.BODEGA = true;
      this.objReadOnly.Bod = false;
      this.seccionInfoPro[0] = '';
      this.accordionExpand[0] = true;
    } else {
      this.DProductos.BODEGA = false;
      this.objReadOnly.Bod = true;
      this.seccionInfoPro[0] = 'none';
      this.accordionExpand[0] = false;
      this.DProductos.MINIMO = 0;
      this.DProductos.MAXIMO = 0;
    }
  }

  onValueChangedMinMax(e:any, MinMax:string) {
    if(this.mnuAccion.match('new|update')) {
      if(MinMax === 'minimo') {
        if(e.value < this.DProductos.MAXIMO)
          this.DProductos.MINIMO = e.value;
        else {
          showToast('El Minimo no puede ser Mayor que el Maximo.', 'error');
          this.DProductos.MINIMO = e.previousValue;
        }
      }
      if(MinMax === 'maximo') {
        if(e.value > this.DProductos.MINIMO)
          this.DProductos.MAXIMO = e.value;
        else {
          showToast('El Maximo no puede ser menor que el Minimo.', 'error');
          this.DProductos.MAXIMO = e.previousValue;
        }
      }
      this._sdatos.conCambios = this._sdatos.conCambios + 1;
    }
  }

  onValueCONTROL_CAMBIOS(e:any) {
    if ((e.value !== null) && (e.value !== undefined) && (e.value !== '')) {
      this._sdatos.conCambios = this._sdatos.conCambios + 1;
    }
  }

  onTvClaseOptionChanged(e) {
    if (e.name === 'value') {
      this.isTvClaseBoxOpened = false;
      //this.ref.detectChanges();
    }
  }

  syncTvClaseSelectionTVANTERIOR(e:any) {
    if (!this.treeListaClases) return;
​
    if (!this.tvValorClase) {
      this.treeListaClases.instance.unselectAll();
    } else {
      this.treeListaClases.instance.selectItem(this.tvValorClase);
      if(this.mnuAccion === 'new')
        this.valoresObjetos('consecutivo');
    }
  }

  syncTvClaseSelection(e:any) {
    if(this.mnuAccion === 'new')
      this.valoresObjetos('consecutivo');
  }

  // Redimensionamiento de los combos
  onResizeEnd(compo: any) {
    compo.option("height",400);
  }

  cambiosItemForma(e:any, accion = 'activar') {
    // try {
    //   if (accion === 'activar') {
    //     if (!this.objReadOnly.iniEdicion && !this.objReadOnly.readOnly) {
    //       if (!e.dataField.match('__obj__')) {
    //         var dataField = e.dataField;  
    //         const elem = document.getElementsByName(dataField);
    //         if (elem) elem[0].classList.add('is-dirty');
    //       }
    //       else {
    //         var dataField = e.dataField.replace('__obj__','');  
    //         const elem = document.getElementById(dataField);
    //         if (elem) elem.classList.add('is-dirty');
    //       }
    //     }
    //   }
    //   else {
    //     if (!e.dataField.match('__obj__')) {
    //       var dataField = e.dataField;  
    //       document.getElementsByName(dataField)[0].classList.remove('is-dirty');
    //     }
    //     else {
    //       var dataField = e.dataField.replace('__obj__','');  
    //       if (document.getElementById(dataField))
    //         document.getElementById(dataField)?.classList.remove('is-dirty');
    //     }
    //   }
    // } catch (error) {
    //   this.showModal(error);
    // }
  }

  compressImage(src:any, newX:any, newY:any, src_w:any, src_h:any) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.src = src;
      img.onload = rs => {
        const elem = document.createElement('canvas');
        var ratio = Math.min(newX / src_w, newY / src_h);
        elem.width = src_w * ratio;  // newX
        elem.height = src_h * ratio;  // newY
        const ctx:any = elem.getContext('2d');
        ctx.drawImage(img, 0, 0, src_w * ratio, src_h * ratio);   //, newX, newY);
        const data = elem.toDataURL();
        res(data);
      }
      img.onerror = error => rej(error);
    })
  }
  
  zoomImg(img, tipo) {
    const pos = this.DImagenesPro.findIndex(i => i === img);
    if (pos === -1 && img === '/assets/no-image.jpg' || this.DImagenesThumb.length === 0) return '';
    if (tipo === 'img')
      return this.DImagenesThumb[pos].img;
    else
      return this.DImagenesThumb[pos].thumb;
  }

  getConsecutivo(e:any) {
    if(e.value === true) {
      this.newConsecutivo = true;
      this.visibleConsecutivo = true;
      this.valoresObjetos('consecutivo');
    } else {
      this.newConsecutivo = false;
      this.visibleConsecutivo = false;
      this.objReadOnly.readOnlyProducto = false;
      this.DProductos.PRODUCTO = '';
      this.DProductos.PRO_CONSECUTIVO = 0;
    }
  }

  // Imprimir reporte de aplicación
  imprimirReporte(operimp) {
    let filtroRep: any = '';
    if (operimp.registro === 'todos')
      filtroRep = { FILTRO: this.QFiltro };
    else
      filtroRep = { FILTRO: " PRODUCTOS.ID_DOCUMENTO = '"+this.DProductos.PRODUCTO+"'" };
      const prmLiq = {
        clid: localStorage.getItem('empresa'), 
        usuario: localStorage.getItem('usuario'), 
        idrpt: operimp.archivo,
        id_reporte: operimp.id_reporte,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
        tabla: this.prmUsrAplBarReg.tabla,
        filtro: filtroRep
      };
  
    // Si no existe, no está abierta entonces agrega Tab
    const listaTab = this.tabService.tabs.find(c => c.aplicacion === operimp.id_reporte);
    if (listaTab === undefined) 
      GlobalVariables.listaAplicaciones.unshift({ aplicacion: operimp.id_reporte, barra: undefined, statusEdicion: '' });

    // Abre pestaña con nuevo reporte
    this.tabService.addTab(
      new Tab(
        VisorrepComponent,  // visor
        operimp.data_rpt.text,  // título
        { parent: "PrincipalComponent", args: prmLiq },  // parámetro: reporte,filtro
        operimp.id_reporte,  // código del reporte
        '',
        'reporte',
        true
    ));

	}
  // Genera solo pdf
  generarPDF(operimp) {

    showToast('Se generará el reporte en formato PDF. Espere unos segundos...');

    let filtroRep: any = '';
    if (operimp.registro === 'todos')
      filtroRep = { FILTRO: this.QFiltro };
    else
      filtroRep = { FILTRO: " PRODUCTOS.PRODUCTO = '"+this.DProductos.PRODUCTO+"'" };
    const ext = this.ltool.makeRandom(30);
    const prmRpt = {
      clid: localStorage.getItem('empresa'), 
      usuario: localStorage.getItem('usuario'), 
      idrpt: operimp.archivo,
      id_reporte: operimp.id_reporte,
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      filtro: JSON.stringify(filtroRep),
      archivo: operimp.archivo + "_" + ext + ".pdf"
    };

    // Generar el PDF -- Llamar al generador de reportes para que genere archivo pdf
    this._sgenerales.ExportarPDF(prmRpt).subscribe((data: Blob) => {

      // Abrir reporte en pestaña browser
      var file = new Blob([data], { type: 'application/pdf' })
      var fileURL = URL.createObjectURL(file);
      window.open(fileURL); 
      
      /*var a         = document.createElement('a');
      a.href        = fileURL; 
      a.target      = '_blank';
      a.download    = 'bill.pdf';
      document.body.appendChild(a);
      a.click();*/

    });

  }
  
  // Pre-visualiza solo pdf
  enviarEmailPDF() {

    // Abre notificacion de envio de correo
    if (this.especUsuarioEmail === '') {
      this.showModal('Falta definir correo de envio del usuario','Faltan datos');
      return;
    }
    
    // Prepara y confirma envio de correo
    let asunto = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'ASUNTO EMAIL')?.VALOR_DEFECTO ?? '';
    let email_sale = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'EMAIL SALIENTE')?.VALOR_DEFECTO ?? '';
    asunto = asunto.replace('%PRODUCTO%',this.DProductos.PRODUCTO);
    const dataSource =  { ORIGEN: this.especUsuarioEmail,
                          ORIGEN_EMAIL: email_sale,
                          DESTINO: '',
                          DESTINO_EMAIL: '',
                          ASUNTO: asunto,
                          NOTA: ''
                        }
    this.eventsSubjectEnvioCorreo.next({ dataSource, visible: true });
                
  }
  
  // Respuesta accion del correo
  onRespuestaEnvioCorreo(e: any) {
    
    showToast('Enviando correo. Espere unos segundos...');

    let template = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'TEMPLATE')?.VALOR_DEFECTO ?? '';
    const ext = this.ltool.makeRandom(30);
    let filtroRep: any = '';
    if (this.rpt_registro === 'todos')
      filtroRep = { FILTRO: this.QFiltro };
    else
      filtroRep = { FILTRO: " PRODUCTOS.PRODUCTO = '"+this.DProductos.PRODUCTO+"'" };

    const prmRpt = {
      clid: localStorage.getItem('empresa'), 
      usuario: localStorage.getItem('usuario'), 
      idrpt: this.rpt_archivo,
      id_reporte: this.rpt_id_reporte,
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      filtro: JSON.stringify(filtroRep),
      archivo: this.rpt_archivo + "_" + ext + ".pdf",
      prm_email: e,
      template
    };

    // Generar el PDF -- Llamar al generador de reportes para que genere archivo pdf
    this._sgenerales.ExportarPDF(prmRpt).subscribe((data: Blob) => {

      // Abrir reporte en pestaña browser
      /*var file = new Blob([data], { type: 'application/pdf' })
      var fileURL = URL.createObjectURL(file);
      window.open(fileURL); */
      
      /*var a         = document.createElement('a');
      a.href        = fileURL; 
      a.target      = '_blank';
      a.download    = 'bill.pdf';
      document.body.appendChild(a);
      a.click();*/

      this._sgenerales.sendMail('send',{ datos: prmRpt },this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          console.log(data);
          showToast('Correo enviado a '+e.DESTINO_EMAIL);
      });

    });


  }


  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string){
    if (obj === 'consecutivo') {
      const prm = {ID_APLICACION: this.prmUsrAplBarReg.aplicacion, CLASE: this.DProductos.CLASE };
      this._sdatos.getConsecutivo('CONSECUTIVO',prm,this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if (res.ErrMensaje !== '') {
          this.showModal(res.ErrMensaje);
        } else {
          if(res.CONSECUTIVO !== 0) {
            this.objReadOnly.readOnlyProducto = true;
            this.DProductos.PRODUCTO = res.VAR_CONSECUTIVO;
            this.DProductos.PRO_CONSECUTIVO = res.CONSECUTIVO;
            this.DProductos.CODIGO_ASOCIADO = this.DProductos.PRODUCTO;
            this._sdatos.PRODUCTO = this.DProductos.PRODUCTO;
          } else {
            this.objReadOnly.readOnlyProducto = false;
            this.DProductos.PRODUCTO = '';
            this.DProductos.PRO_CONSECUTIVO = 0;
            this.DProductos.CODIGO_ASOCIADO = '';
          }
        }
      });
    }
    if (obj === 'clases' || obj === 'todos') {
      const prm = { };
      this._sdatos.consulta('CLASES PRODUCTOS',prm,this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else
          // this.DClasePro = res.map(({key, items}) => ({key, items: JSON.parse(items)}));
          this.DClasePro = res;
      });
    }
    if (obj === 'rutas' || obj === 'todos') {
      const prm = { };
      this._sdatos.consulta('RUTAS PRODUCTOS',prm,this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else {
          this.DRutas_prev = res;
          for (let i = 0; i < this.DRutas_prev.length; i++) {
            const element = this.DRutas_prev[i];
            this.DRutas_prev[i] = {...element, INFO: element.ID_RUTA+' | '+element.DESCRIPCION};           
          }
        }
      });
    }
    if (obj === 'grupos' || obj === 'todos') {
      const prm = { };
      this._sdatos.consulta('GRUPOS',prm,this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else {
          this.DGrupos = res;
        }
        // Refresca también el de partes
        this._sdatos.LGrupos = this.DGrupos;
      });
    }
    if (obj === 'perfiles_tributarios' || obj === 'todos') {
      const prm = { OBJETO: 'TASAS' };
      this._sdatos.consulta('PERFILES TRIBUTARIOS',prm,this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else
          this.DPerfilesTrib = res;
      });
    }
    if (obj === 'marcas' || obj === 'todos') {
      const prm = { };
      this._sdatos.consulta('MARCAS',prm,this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else
          this.DMarcas = res.sort((a:any,b:any) => a.MARCA.localeCompare(b.MARCA));
      });
    }
    if (obj === 'um' || obj === 'todos') {
      const prm = { ID_APLICACION: this.prmUsrAplBarReg.aplicacion };
      this._sdatos.consulta('UNIDADES MEDIDA',prm, 'generales').subscribe((data: any)=> {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else
          this.DUnidadesMedida = res;
      });
    }
    if (obj === 'prov' || obj === 'todos') {
      const prm = { };
      this._sdatos.consulta('PROVEEDORES', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else
          this.DProveedores = res;
      });
    }
    if (obj === 'gravamenes' || obj === 'todos') {
      const prm = { };
      this._sdatos.consulta('LISTA GRAVAMENES', prm, 'generales').subscribe((data: any)=> {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else
          this.DGravamenes = res;
      });
    }
    if (obj === 'controlcambios' || obj === 'todos') {
      const prm = { FILTRO: '' };
      this._sdatos.consulta('CONTROL CAMBIOS PRODUCTOS', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else
          this.controlCambiosPro = res.map(c => c.CONCEPTO);
      });
    }
    if (obj === 'lista precios') {
      const prm = ({PRODUCTO: this.DProductos.PRODUCTO});
      this._sdatos.consulta('LISTA PRECIOS PRODUCTO', prm,'VEN-002').subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'Error');
        }
        else {
          this.listaPreciosData = res;
          this.visibleListaPrecios = true;
        }
      });
    }
    if (obj === 'existencias' || obj === 'todos') {
      if( (this.DProductos.PRODUCTO !== undefined) && (this.DProductos.PRODUCTO !== null) && (this.DProductos.PRODUCTO !== '') ) {
        const prm = {PRODUCTO: this.DProductos.PRODUCTO};
        this._sdatos.getExitencias('EXISTENCIAS PRODUCTOS', prm,'PRO-022').subscribe((data) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== '') {
            this.showModal(res[0].ErrMensaje, 'Error');
          }
          else {
            this.existenciaProducto = res.reduce((acc:any, item:any) => {
              return acc += item.CANTIDAD_SALDO;
            }, 0);
            this.puntoMinimo = res[0].MINIMO;
            this.puntoMaximo = res[0].MAXIMO;
            this.DGExitencias = res;
            this.popUpExistenciasVisible = true;
          }
        });
      }
    }

    if (obj == 'especificaciones' || obj == 'todos' ) {
      this._sdatos.consulta('ESPECIFICACIONES', 
                            { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, USUARIO: this.prmUsrAplBarReg.usuario }, 
                            'ADM-011')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined)){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.especAplicacion = res;
          this.valoresDefecto();
    
        });
    }

  }
  
  // Recibe los datos de la grid
  onRespuestaDocum(e: any) {
    if (e.accion === 'aceptar') {
      this._sdatos.D_Documentacion = e.datos;
      this._sdatos.conCambios = this._sdatos.conCambios + 1;
    }
  }
  
  // Recibe los datos de la grid
  onRespuestaPres(e: any) {
    this._sdatos.D_Presentacion = e.datos;
    this._sdatos.conCambios = this._sdatos.conCambios + 1;
  }
  
  ngOnInit(): void {
    const user:any = localStorage.getItem("usuario");
    this.prmUsrAplBarReg = {
      tabla: "PRODUCTOS",
      aplicacion: "PRO-022",
      usuario: user,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: {}
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';
    this.objReadOnly.readOnlyClase = true;
    this.objReadOnly.readOnly = true;
    this.objReadOnly.readOnlyProducto = true;
    this.objReadOnly.ETAPA = true;
    this._sdatos.accion = 'r_ini';
    this.DImagenesThumb = [];
    this.activaMenuFloat = false;
    this._sdatos.conCambios = 0;
    this.DProductos = {
      PRODUCTO: '',
	    PRO_CONSECUTIVO: 0,
	    NOMBRE: '',
	    CLASE: '',
	    ETAPA: '',
	    ID_GRUPO: '',
	    TIPO_MARCA: '',
	    MARCA: '',
	    MODELO: '',
	    NUMERO_PARTE: '',
	    PERFIL_TRIBUTARIO: '',
	    INVENTARIO: false,
	    BODEGA: false,
	    COMENTARIOS: '',
	    ESTADO: '',
	    CONTROL_SERIAL: false,
	    CAMBIAR_NOMBRE: false,
	    VALOR_NEGATIVO: false,
	    MARGEN_RENTABILIDAD: 0,
	    DOCUMENTO: '',
	    ID_UDM: '',
	    ID_UDM_PROV: '',
	    CAN_UDM: 0,
	    MAXIMO: 0,
	    MINIMO: 0,
	    ID_PROVEEDOR: '',
      ID_RUTA: '',
	    NOMBRE_PROVEEDOR: '',
	    PRO_ATRIBUTOS: '',
	    PRO_KITS: '',
	    NUM_PARTES: 0,
	    CONTROL_CAMBIOS: '',
	    CODIGO_ASOCIADO: '',
	    COD_ASOCIADO: '',
    }
    // Ini
    this.valoresObjetos('todos');
    this.opBlanquearForma();
    window.addEventListener('scroll', this.onScroll, true);
    this.seccionInfoPro = ['','none','none','','',''];
    this.seccionInfoProDos = ['',''];
    this.accordionExpand = [false,false,false,false,false,false,false,false];
    this._sfiltro.enConsulta = false;
  }
  ngAfterViewInit(): void { }

  // Administra presentación de tool tips
  toggleToolTip(btnmenu:any) {
    this.toolTipVisible = !this.toolTipVisible;
  }

  ngOnDestroy() {
    this.opBlanquearForma();
    this.subscription.unsubscribe();
    this.subscriptionPro.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
    this._sfiltro.enConsulta = false;
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
    this.eventsSubject.next();
  }
  // Mostrar el menu float de apoyo, con Control+click-derecho
  @HostListener("document:contextmenu", ["$event"])
  clickout(e: any) {
    console.log(e);
    if (!e.ctrlKey) return;
    if (e.srcElement.id !== undefined && e.srcElement.id !== '') {
      this.targetMenuFloat = '#'+e.srcElement.id;
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
}

