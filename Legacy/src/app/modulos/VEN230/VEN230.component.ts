import { Component, NgModule, OnInit, TRANSLATIONS, ViewChild } from '@angular/core';
import { lastValueFrom, Subject, Subscription} from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import Swal from 'sweetalert2';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { DxButtonModule, DxCheckBoxModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxDropDownBoxComponent, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxSelectBoxComponent, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { VEN155Service } from 'src/app/services/VEN155/VEN155.service';
import notify from 'devextreme/ui/notify';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule } from '@angular/common';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { showToast } from '../../shared/toast/toastComponent.js'
import { libtools } from 'src/app/shared/common/libtools';
import { XcSelectboxComponent } from 'src/app/shared/xc-selectbox/xc-selectbox.component';
import { COM20001Component } from '../COM200/COM20001/COM20001.component';
import { XcComboGridComponent } from 'src/app/shared/xc-combo-grid/xc-combo-grid.component';
import { DocelecComponent } from 'src/app/shared/docelec/docelec.component';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';
import { clsPrefacturaGravAux, clsPrefacturas, clsPrefacturasGrav, clsPrefacturasItems, clsPrefacturasPagos } from './clsVEN230.class.js';

@Component({
  selector: 'app-VEN230',
  templateUrl: './VEN230.component.html',
  styleUrls: ['./VEN230.component.scss'],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxSelectBoxModule, CdkAccordionModule, DxDropDownBoxModule,
            DxDataGridModule, DxDateBoxModule, DxTextBoxModule, DxNumberBoxModule, DxLoadPanelModule,
            DxButtonModule, VistarapidaComponent, XcSelectboxComponent, COM20001Component,
            XcComboGridComponent, DxCheckBoxModule, DocelecComponent, GeninformesComponent
          ]

})
export class VEN230Component implements OnInit {
  @ViewChild('formPrefacturaBasico', { static: false }) formPrefactura: DxFormComponent;
  @ViewChild('formPrefacturaAdicional', { static: false }) formPrefacturaAdicional: DxFormComponent;
  @ViewChild("gridPrefacturaItems", { static: false }) gridPrefacturaItems: DxDataGridComponent;
  @ViewChild("xs_PRODUCTOS", { static: false }) sboxProductos: DxSelectBoxComponent;
  @ViewChild("gridProLista", { static: false }) gridProLista: DxDataGridComponent;
  @ViewChild("ddProductos", { static: false }) ddProductos: DxDropDownBoxComponent;
  @ViewChild("ddCondicion", { static: false }) ddCondicion: DxDropDownBoxComponent;
  @ViewChild("ddTipoVenta", { static: false }) ddTipoVenta: DxSelectBoxComponent;
  @ViewChild("xs__PLAZO", { static: false }) xs__PLAZO: DxSelectBoxComponent;


  //Variables fijas de la Aplicación
  empresa: string;
  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  subs_filtro: Subscription;
  subs_visor: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  VDatosReg: any;
  QFiltro: any;
  readOnly: boolean = true;
  readOnlyUdp: boolean = true;
  readOnlyCond: boolean = true;  
  conExistencias: boolean = false;
  mnuAccion: string;
  GridSubTotales: any = [];
  gridBoxAtributo: string[] = [];
  gridBoxCliente: string[] = [];
  gridBoxDocumento: string[] = [];
  gridBoxProducto: string[] = [];
  gridBoxUN: string[] = [];
  gridBoxMoneda: string[] = [];
  gridBoxCondicion: string[] = [];
  gridBoxADC: string[] = [];
  isGridBoxAtrOpened: boolean;
  isGridBoxCliOpened: boolean;
  isGridBoxProdOpened: boolean;
  isGridBoxUbiOpened: boolean;
  isGridBoxUNOpened: boolean;
  isGridBoxMonedaOpened: boolean;
  isGridBoxCondicionOpened: boolean;
  isGridBoxADCOpened: boolean;
  sbDocumento: string;
  sbIdDireccion: string;
  sbPlazo: number;
  sbTipoVenta: string;
  esEdicion: boolean = false;
  esCreacion: boolean = false;
  iniEdicion: boolean = false;
  esVisibleCartera: boolean = true;
  conCambios: number = 0;
  TOT_GRAV: number;
  TOT_ANTICIPOS: number;
  focusedRowIndex: number;
  focusedRowKey: string;
  type: string;
  UN_DEF: string;
  MONEDA_DEF: string;
  TIPO_CONDLISTA: string;
  MONEDA_FORMATO: string;
  CANTIDAD_FORMATO: string;
  ID_APLICACION: any = 'VEN-230';
  stylingMode = 'filled';
  dropDownOptions = { width: 700, height: 400, hideOnParentScroll: true, container: '#router-container'};
  dropDownOptionsListBox = { hideOnParentScroll: true, container: '#router-container' };
  dSBEstados = ["REGISTRADO","ANULADO","COMPLETADO","EN PROCESO","PROGRAMADO"];
  items = ['Datos del Cliente','Datos de la Transacción','Datos de la Venta'];
  accordionExpand: any;

  //Notificaciones
  toaVisible: boolean;
  toaMessage: string = 'Registro actualizado!';
  toaTipo: string = 'success';
  loadingVisible: boolean = false;

  //Variables de datos
  DPrefactura: clsPrefacturas;
  DPrefacturaPagos: clsPrefacturasPagos[] = [];
  DPrefacturaItems: clsPrefacturasItems[] = [];
  DPrefacturaGrav: clsPrefacturasGrav[] = [];
  DPrefacturaGravAux: clsPrefacturaGravAux[] = [];
  DItemsAux:any = [];
  DPrefactura_prev: any;
  DPrefacturaItems_prev: any;
  DPrefacturaGrav_prev: any;
  DProductos: any;
  DProductosLista: any;
  DClientes: any;
  DDocumentos: any;
  DUnidadMedida: any;
  DListaUMVenta: any;
  DTiposVenta: any;
  DBodegas: any;
  DListasPrecios: any;
  DADC: any;
  DAtributos: any;
  DDirecciones: any;
  DUnidadesNegocios: any;
  DMonedas: any;
  DCondicionLista: any;
  DPlazos: any;
  DMonedaDef: any;
  ltool: any;
  visibleIvas: boolean = false;
  keyFila: any;
  visibleColSoporte: boolean = false;
  
  // Planes de produccion - fecha de entrega
  NOW: Date = new Date();
  FECHA_MIN: any = null;
  FECHA_MAX: any = null;
  DplanesProd:any = [];  

  // Especificaciones y valores defecto
  especAplicacion: any;
  especMonedaFormato: string = "#,##0.00";
  especCantidadFormato: string = "#,##0.00";
  especModificarPrecio: boolean = true;
  especModificarGrav: boolean = true;
  especRepetirItem: boolean = true;
  especOrigenPrecio: string = '';
  especEstiloEstado: any = {};
  
  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esVisibleSelecc: string = 'none';
  eventsSubjectSboxBodega: Subject<any> = new Subject<any>();
  eventsSubjectIvas: Subject<any> = new Subject<any>();
  eventsSubjectSettings: Subject<any> = new Subject<any>();
  eventsSubjectDocElec: Subject<any> = new Subject<any>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();

  constructor(
    private _sdatos: VEN155Service,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private tabService: TabService
  ) 
    {
      // Servicio de barra de registro
      this.subscription = this._sbarreg.getObsRegApl().subscribe((datreg) => {
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
    });

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex(d => d.ID_DOCUMENTO === resp.ID_DOCUMENTO && d.CONSECUTIVO === resp.CONSECUTIVO);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx+1;
        this.opIrARegistro('r_numreg');
      }
    })

    this.ltool = new libtools(this._sbarreg, this.tabService);
    this.customizeColumnsSearch = this.customizeColumnsSearch.bind(this);
    this.onSeleccRowProducto = this.onSeleccRowProducto.bind(this);
    this.onRespuestaSettings = this.onRespuestaSettings.bind(this);
    this.onChangeCantidad = this.onChangeCantidad.bind(this);
    this.operacionesSettings = this.operacionesSettings.bind(this);

  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes
    this._sdatos.accion = operMenu.accion;
    switch (operMenu.accion){
      case 'r_ini':
        const user:any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'PREFACTURA',
          aplicacion: 'VEN-230',
          usuario: user,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: {},
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_nuevo':
        this.mnuAccion = 'new';
        this.readOnly = false;
        this.readOnlyUdp = false;
        this.esVisibleSelecc = 'always';
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.readOnly = false;
        this.readOnlyUdp = true;
        this.esVisibleSelecc = 'always';
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        this.opPrepararGuardar(this.mnuAccion);
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
        this.opBlanquearForma();
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_eliminar':
        this.opEliminar();
        break;

      case 'r_primero':
      case 'r_anterior':
      case 'r_siguiente':
      case 'r_ultimo':
      case 'r_numreg':
        this.opIrARegistro(operMenu.accion);
        break;

      case 'r_cancelar':
        Swal.fire({
          title: '',
          text: 'Desea cancelar la operación?',
          iconHtml: "<i class='icon-alert-outline'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar',
        }).then((result) => {
          if (result.isConfirmed){
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this.readOnly = true;
            this.readOnlyUdp = true;
            this.esEdicion = false;
            this.esCreacion = false;
            this.esVisibleSelecc = 'none';
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.DPrefactura = JSON.parse(JSON.stringify(this.DPrefactura_prev));
            this.DPrefacturaItems = JSON.parse(JSON.stringify(this.DPrefacturaItems_prev));
            this.DPrefacturaGrav = JSON.parse(JSON.stringify(this.DPrefacturaGrav_prev));
            // this.DPrefacturaGravAux = this.DPrefacturaGrav.filter(e => e.APLICACION === 1);
            this.opIrARegistro('r_numreg');

            // Restituye los valores
            this.mnuAccion = '';
          }
        });

        break;

      case 'r_vista':
        this.opVista();
        break;

      case 'r_refrescar':
        this.valoresObjetos('ref');
        break;

      case 'r_imprimir':
        var prmRep = { ...operMenu.operacion, 
                         accion: 'previsualizar',
                         aplicacion: this.prmUsrAplBarReg.aplicacion, 
                         tabla: this.prmUsrAplBarReg.tabla,
                         usuario: this.prmUsrAplBarReg.usuario,
                         QFiltro: (operMenu.operacion.registro === 'todos') 
                                   ? this.QFiltro 
                                   : " PREFACTURA.ID_DOCUMENTO = '"+this.DPrefactura.ID_DOCUMENTO+"' AND PREFACTURA.CONSECUTIVO = "+this.DPrefactura.CONSECUTIVO, 
                        };
        if (operMenu.operacion.modo === 'previsualizar')
          this.eventsSubjectInformes.next(prmRep);
        if (operMenu.operacion.modo === 'pdf') {
          prmRep = { ...prmRep, accion: 'pdf' };
          this.eventsSubjectInformes.next(prmRep);
        }
        if (operMenu.operacion.modo === 'email') {
          let template = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'TEMPLATE')?.VALOR_DEFECTO ?? '';
          let asunto = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'ASUNTO EMAIL')?.VALOR_DEFECTO ?? '';
          let email_sale = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'EMAIL USUARIO')?.VALOR_DEFECTO ?? '';
          let nom_usr = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'EMAIL USUARIO')?.TITULO ?? '';
          var prmRep = { ...operMenu.operacion, 
                        accion: 'email',
                        asunto,
                        email_sale,
                        especUsuarioEmail: nom_usr,
                        nombre: this.DPrefactura.NOMBRE_CLIENTE,
                        email: this.DClientes.find(e => e.ID_CLIENTE === this.DPrefactura.ID_CLIENTE)?.EMAIL ?? '' ,
                        template,
                        replacements: '',
                        dataSource: this.DPrefactura
                      };
          this.eventsSubjectInformes.next(prmRep);
        }
        break;

      case 'r_configurar':
        this.operacionesSettings(operMenu.operacion.data_config);
        break;


      default:
        break;
    }
  }

  opPrepararNuevo(): void {
    this.readOnly = false;
    this.readOnlyUdp = false;
    this.readOnlyCond = true;
    this.esEdicion = true;
    this.esCreacion = false;
    this.iniEdicion = true;
    
    var now = new Date();
    this.DPrefactura = {
      ID_UN: '',
      ID_UN_ITEM: '',
      ID_DOCUMENTO: '',
      NOMBRE_DOCUMENTO: '',
      PREFIJO: '',
      CONSECUTIVO: 0,
      SUFIJO: '',
      DOCUMENTO: '',
      DOCUMENTO_FAC: '',
      FECHA_REGISTRO: now,
      FECHA: now,
      HORA: now,
      ID_CLIENTE: '',
      NOMBRE_CLIENTE: '',
      ID_ADC: '',
      ID_CONDICION: '',
      DESCRIPCION: '',
      ID_MONEDA: '',
      TASA_CAMBIO: 1,
      VIGENCIA: now,
      ID_DOC_SOPORTE: '',
      NC_DOC_SOPORTE: 0,
      FECHA_AUTORIZACION: '',
      CUOTA_INICIAL: 0,
      PLAZO: 0,
      CONDICIONES_GENERALES: '',
      SUB_TOTAL: 0,
      VALOR_DESCUENTO: 0,
      GRAVAMENES: '',
      VALOR_COSTOS: 0,
      TOTAL: 0,
      VALOR_CUOTA: 0,
      VALOR_PRIMER_CUOTA: 0,
      FECHA_PRIMER_VENC: '',
      DIAS_CUOTA: 0,
      UM_DIAS_CUOTA: '',
      TIPO_VENTA: '',
      USUARIO: this.prmUsrAplBarReg.usuario,
      ESTADO: 'REGISTRADO',
      VALOR_FIN_COSTOS: 0,
      FECHA_OC: '',
      ID_UBICACION: '',
      DIRECCION: '',
      CUFE: '',
      ID_UN_BODEGA: '',
      VALOR_BASE: 0
    };
    this.DPrefacturaItems = [];
    this.DPrefacturaGravAux = [];
    this.DPrefacturaPagos = [];
    this.DPrefacturaGrav = [];
    this.GridSubTotales = [{key: 'Subtotal', value: 0},{key: 'Descuentos', value: 0},{key: 'Anticipos', value: 0}];
    this.gridBoxCliente = [];
    if (this.UN_DEF != null)
      this.gridBoxUN = [this.UN_DEF];
      this.DPrefactura.ID_UN_ITEM = this.UN_DEF;
    if(this.MONEDA_DEF != null)
      this.gridBoxMoneda = [this.MONEDA_DEF];
      this.DPrefactura.ID_MONEDA = this.MONEDA_DEF;
    this.gridBoxCondicion = [];
    this.gridBoxADC = [];
    this.sbDocumento = '';
    this.sbTipoVenta = '';
    this.sbIdDireccion = '';
    this.sbPlazo = 0;
    this._sdatos.ID_DOCUMENTO = '';
    this._sdatos.CONSECUTIVO = '';
    this._sdatos.ID_DOCUMENTO_prev = '';
    this._sdatos.CONSECUTIVO_prev = '';
    this.DPrefactura_prev = JSON.parse(JSON.stringify(this.DPrefactura));
    this.DPrefacturaItems_prev = JSON.parse(JSON.stringify(this.DPrefacturaItems));
    this.DPrefacturaGrav_prev = JSON.parse(JSON.stringify(this.DPrefacturaGrav));
    this.TOT_GRAV = 0;
    this.TOT_ANTICIPOS = 0; 
    this.esVisibleCartera = false;
      this.visibleColSoporte = false; 

    this.formPrefacturaAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("disabled",true);
    this.formPrefacturaAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("value",this.DPrefactura.FECHA);
    this.formPrefacturaAdicional.instance.getEditor("PLAZO")?.option("disabled",true);
    this.formPrefacturaAdicional.instance.getEditor("PLAZO")?.option("value",0);
    
    this.valoresObjetos('documento');
  }

  async opPrepararModificar(){
    this.readOnly = false;
    this.readOnlyUdp = true;
    this.esEdicion = true;
    this.esCreacion = false;
    this.iniEdicion = true;
  }

  opPrepararGuardar(accion: string): void {
    // Acción validación de datos
    if (!this.ValidaDatos('requerido')){
      return;
    }

    const prmDatosGuardar = JSON.parse(
      (JSON.stringify({ PREFACTURAS: this.DPrefactura, 
                        ITM_PREFACTURAS: this.DPrefacturaItems, 
                        PREFACTURA_GRAV: this.DPrefacturaGrav,
                        PREFACTURA_GRAV_AUX: this.DPrefacturaGravAux,
                        PREFACTURA_PAGOS: this.DPrefacturaPagos,
                        ID_APLICACION: this.prmUsrAplBarReg.aplicacion,
                        USUARIO: this.prmUsrAplBarReg.usuario
                      })).replace(/}{/g,",")
    );

    // API guardado de datos
    var exito = false;
    this._sdatos
    .save(accion, prmDatosGuardar, this.prmUsrAplBarReg.aplicacion)
    .subscribe((resp) => {
      const res = JSON.parse(resp.data);
      if (res[0].ErrMensaje !== ""){
        this.showModal('','',res[0].ErrMensaje);
        
      } else {
        this.readOnly = true;
        this.readOnlyUdp = true;
        this.readOnlyCond = true;
        this.esEdicion = false;
        this.esCreacion = false;
        this.esVisibleSelecc = 'none';
        
        // Operaciones de barra
        if (this.mnuAccion === 'new'){
          this.QFiltro = " Prefactura.ID_DOCUMENTO = '" + this.DPrefactura.ID_DOCUMENTO + "' AND " +
            " Prefactura.CONSECUTIVO = " + this.DPrefactura.CONSECUTIVO
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: "",
            accion: "r_navegar",
            r_numReg: 1,
            r_totReg: 1,
            operacion: {}
          };
        }
        else
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: "",
            accion: "r_navegar",
            operacion: {}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DPrefactura.DOCUMENTO = res[0].DOCUMENTO;
        this.DPrefactura.DOCUMENTO_FAC = res[0].DOCUMENTO;
        this.VDatosReg = [this.DPrefactura];
        this.sbDocumento = res[0].DOCUMENTO;
        this.VDatosReg[0]["Prefactura_GRAV"] = this.DPrefacturaGrav;
        this.VDatosReg[0]["Prefactura_PAGOS"] = this.DPrefacturaPagos;
        showToast('Registro actualizado', 'success');
        this.mnuAccion = '';

        // Inactiva cambios
      }
    });
  }

  opPrepararBuscar(accion): void {
    if (accion === 'filtro'){
      this._sfiltro.PrmFiltro = {
        Titulo: 'Datos de filtro para Prefacturas',
        accion: 'PREPARAR FILTRO',
        Filtro: '',
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;

      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { PREFACTURA: arrFiltro };

      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this._sdatos
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined){
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje === ''){
            this.VDatosReg = datares;
            this.DPrefactura = datares[0];
            this.DPrefacturaGrav = datares[0].Prefactura_GRAV;
            this.DPrefacturaPagos = datares[0].Prefactura_PAGOS;
            this.QFiltro = datares[0].QFILTRO;

            // Prepara la barra para navegación
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              r_totReg: datares.length,
              r_numReg: 1,
              accion: 'r_navegar',
              operacion: {},
            };
            this.opIrARegistro('r_primero');

          } 
          else {
            this.VDatosReg = [];
            showToast(datares[0].ErrMensaje, 'warning');
            this.opBlanquearForma();
            // Prepara la barra para navegación
            const user:any = localStorage.getItem('usuario');
            this.prmUsrAplBarReg = {
              tabla: 'PREFACTURA',
              aplicacion: 'VEN-230',
              usuario: user,
              accion: 'r_ini',
              error: '',
              r_numReg: 0,
              r_totReg: 0,
              operacion: { r_modificar: true }
            };
        
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.mnuAccion = '';
            this.readOnly = true;
            this.readOnlyUdp = true;
            this._sdatos.accion = 'r_ini';
          }
          
          // Trae los items en los componentes asociados
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this.loadingVisible = false;
          this._sfiltro.enConsulta = false;
        });
    }

    this.readOnly = true;
    this.readOnlyUdp = true;
    this.resetValidaciones();
  }

  opEliminar(): void {
    Swal.fire({
      title: '',
      text: '',
      html:
        'Desea anular la Prefactura <i>' +
        this.DPrefactura.ID_DOCUMENTO +
        '-' +
        this.DPrefactura.CONSECUTIVO +
        '</i> ?',
      iconHtml: "<i class='icon-alert-outline'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, anular',
    }).then((result) => {
      // Procesa eliminación. Llama a la API para validar referenciación y eliminación en tabla
      if (result.isConfirmed){
        this.AccionEliminar();
      }
    });
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = 'r_numreg';
    switch (accion){
      case 'r_primero':
        this.DPrefactura = JSON.parse(JSON.stringify(this.VDatosReg[0]));
        this.DPrefacturaGrav = this.VDatosReg[0].PREFACTURA_GRAV;
        this.DPrefacturaPagos = this.VDatosReg[0].PREFACTURA_PAGOS;
        this.prmUsrAplBarReg.r_numReg = 1;
        if(this.VDatosReg.length != 0){
          this.DPrefactura = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }else{
          showToast('No se encontraron Datos', 'error');
          this.readOnly = true;
          this.readOnlyUdp = true;
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.DPrefactura = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DPrefacturaGrav = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PREFACTURA_GRAV;
        this.DPrefacturaPagos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PREFACTURA_PAGOS;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length ? this.VDatosReg.length : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DPrefactura = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1]));
        this.DPrefacturaGrav = this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1].PREFACTURA_GRAV;
        this.DPrefacturaPagos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1].PREFACTURA_PAGOS;
        break;
      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DPrefactura = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DPrefacturaGrav = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PREFACTURA_GRAV;
        this.DPrefacturaPagos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PREFACTURA_PAGOS;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_numreg':
        if (this.prmUsrAplBarReg.r_numReg !== 0){
          // Valida si hubo cambio de ordenamiento en el visor
          if (this.SVisor.ColSort.Columna !== ''){
            if (this.SVisor.ColSort.Clase === 'asc'){
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
          this.DPrefactura = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this.DPrefacturaGrav = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].Prefactura_GRAV;
          this.DPrefacturaPagos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].Prefactura_PAGOS;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearForma();
          this.resetValidaciones();
          setTimeout(() => {
            this.formPrefactura.instance.resetValues();
          }, 100);
          return;
        }
        this.readOnly = true;
        this.readOnlyUdp = true;
        break;
      case 'Eliminado':
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg){
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0){
          this.DPrefactura = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        } else {
          this.opBlanquearForma();
        }
        break;
      default:
        break;
    }

    // Datos adicionales
    try {
      // Carga los datos del registro a objetos
      this.DPrefactura.DOCUMENTO = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].DOCUMENTO_FAC;
      this.DPrefactura.DOCUMENTO_FAC = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].DOCUMENTO_FAC;
      this.sbDocumento = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].DOCUMENTO_FAC;
      this.loadDataToVariables();
      this._sdatos.accion = 'r_numreg';
      this.readOnly = true;

      // Totales OC
      // this.activarCustomValueSbox(true);
      this.valoresDefecto();

      // Por esoecificacion defecto, no se permite modificar
      if (this.DPrefactura.ESTADO === 'ANULADO')
        this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: false, r_eliminar: false } };
      else
        this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: true, r_eliminar: true } };
      this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

      // Consulta los otros datos: items, gravamenes, adicionales
      const prm = { ID_DOCUMENTO: this.DPrefactura.ID_DOCUMENTO, CONSECUTIVO: this.DPrefactura.CONSECUTIVO };
      this._sdatos
        .consulta('consulta adicionales', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== '') {
            this.showModal(res[0].ErrMensaje, 'error');
            return;
          }
          this.DPrefacturaItems = res[0].ITM_PREFACTURA;
          this.DPrefacturaGravAux = res[0].PREFACTURA_GRAV_AUX;
          this.TOT_GRAV = this.DPrefacturaGrav.reduce((sum: any, item: any) => sum + item.VALOR, 0);
          this.calcularValores();
          this.visibleColSoporte = this.DPrefacturaItems[0]?.SOPORTE != "" ? true : false;
          this.readOnlyCond = true;

        });

    } catch (error) {
      this.showModal(error);
    }
    
  }

  opVista(): void {
    const VDatosRegAux = this.VDatosReg.map(({ID_DOCUMENTO,PREFIJO,CONSECUTIVO,SUFIJO,FECHA,ID_CLIENTE,TIPO_VENTA,ID_DOC_SOPORTE,ID_ADC,DESCRIPCION,USUARIO,ESTADO}) => ({ID_DOCUMENTO,PREFIJO,CONSECUTIVO,SUFIJO,FECHA,ID_CLIENTE,TIPO_VENTA,ID_DOC_SOPORTE,ID_ADC,DESCRIPCION,USUARIO,ESTADO}));
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(VDatosRegAux));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'PrefacturaS',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: '',
      Filtro: '',
      keyGrid: ['ID_DOCUMENTO','PREFIJO','CONSECUTIVO','SUFIJO'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opBlanquearForma(): void {
    var now = new Date();
    this.DPrefactura = {
      ID_UN: '',
      ID_UN_ITEM: '',
      ID_DOCUMENTO: '',
      NOMBRE_DOCUMENTO: '',
      PREFIJO: '',
      CONSECUTIVO: 0,
      SUFIJO: '',
      DOCUMENTO: '',
      DOCUMENTO_FAC: '',
      FECHA_REGISTRO: '',
      FECHA: '',
      HORA: '',
      ID_CLIENTE: '',
      NOMBRE_CLIENTE: '',
      ID_ADC: '',
      ID_CONDICION: '',
      DESCRIPCION: '',
      ID_MONEDA: '',
      TASA_CAMBIO: 1,
      VIGENCIA: '',
      ID_DOC_SOPORTE: '',
      NC_DOC_SOPORTE: 0,
      FECHA_AUTORIZACION: '',
      CUOTA_INICIAL: 0,
      PLAZO: 0,
      CONDICIONES_GENERALES: '',
      SUB_TOTAL: 0,
      VALOR_DESCUENTO: 0,
      GRAVAMENES: '',
      VALOR_COSTOS: 0,
      TOTAL: 0,
      VALOR_CUOTA: 0,
      VALOR_PRIMER_CUOTA: 0,
      FECHA_PRIMER_VENC: '',
      DIAS_CUOTA: 0,
      UM_DIAS_CUOTA: '',
      TIPO_VENTA: '',
      USUARIO: this.prmUsrAplBarReg.usuario,
      ESTADO: '',
      VALOR_FIN_COSTOS: 0,
      FECHA_OC: '',
      ID_UBICACION: '',
      DIRECCION: '',
      CUFE: '',
      ID_UN_BODEGA: '',
      VALOR_BASE: 0
    };
    this.DPrefacturaItems = [];
    this.DPrefacturaGravAux = [];
    this.DPrefacturaGrav = [];
    this.DPrefacturaPagos = [];
    this.GridSubTotales = [{key: 'Subtotal', value: 0},{key: 'Descuentos', value: 0},{key: 'Anticipos', value: 0}];
    this.gridBoxCliente = [];
    if (this.UN_DEF !== null && this.UN_DEF !== undefined && this.UN_DEF !== '') {
      this.gridBoxUN = [];
      this.DPrefactura.ID_UN_ITEM = '';
    }
    if(this.MONEDA_DEF !== null && this.MONEDA_DEF !== undefined && this.MONEDA_DEF !== '') {
      this.gridBoxMoneda = [];
    }
    this.DPrefactura.ID_MONEDA = '';
    this.gridBoxCondicion = [];
    this.gridBoxADC = [];
    this.sbDocumento = '';
    this.sbTipoVenta = '';
    this.sbIdDireccion = '';
    this.sbPlazo = 0;
    this.TOT_GRAV = 0;
    this.esVisibleCartera = false;
    this._sdatos.ID_DOCUMENTO = '';
    this._sdatos.CONSECUTIVO = '';
    this._sdatos.ID_DOCUMENTO_prev = '';
    this._sdatos.CONSECUTIVO_prev = '';
    this.DPrefactura_prev = JSON.parse(JSON.stringify(this.DPrefactura));
    this.DPrefacturaItems_prev = JSON.parse(JSON.stringify(this.DPrefacturaItems));
    this.DPrefacturaGrav_prev = JSON.parse(JSON.stringify(this.DPrefacturaGrav));
  }

  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        this.gridBoxProducto = [];
        this.gridPrefacturaItems.instance.addRow();
        this.rowApplyChanges = true;
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        break;
      case 'save':
        this.gridPrefacturaItems.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        break;
      case 'cancel':
        this.gridPrefacturaItems.instance.cancelEditData();
        this.rowApplyChanges = false;
        break;
      case 'delete':
        // Elimina filas seleccionadas
        Swal.fire({
          title: '',
          text: 'Desea eliminar los items seleccionados?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.filasSelecc.forEach((key) => {
              const index = this.DPrefacturaItems.findIndex(a => a.ITEM === key);
              this.DPrefacturaItems.splice(index, 1);
            });
            this.gridPrefacturaItems.instance.refresh();
            this.conCambios++;
            this.setItemValues();
          }
        });
        break;

      default:
        break;
    }
  }

  async onChangeCantidad(rowData: any, value: any, currentRowData: any){

    // Valida cantidad dependiendo del soporte
    let prmItems = { ...currentRowData, 
                     CANTIDAD: value, 
                     CANTIDAD_PREV: currentRowData.CANTIDAD
                   };
    prmItems = { ...prmItems, ...rowData };
    const prm = { PREFACTURA: this.DPrefactura, 
                  ITEMS: prmItems,
                  ID_APLICACION: this.prmUsrAplBarReg.aplicacion,
                  USUARIO: this.prmUsrAplBarReg.usuario 
                };
    const apiRest = this._sdatos.consulta('actualizar cantidad', prm, "VEN-230");
    const res = await lastValueFrom(apiRest, {defaultValue: true});
    const datRes = JSON.parse(res.data);
    const ix = this.DPrefacturaItems.findIndex(o => o.ITEM == currentRowData.ITEM);

    var rowIndex = this.gridPrefacturaItems.instance.getRowIndexByKey(this.keyFila);  
    if (datRes[0].ErrMensaje !== "") {
      this.showModal(datRes[0].ErrMensaje, 'error');

      // Restablece cantidad
      // var rowIndex = this.gridMovimientosItems.instance.getRowIndexByKey(this.keyFila);  
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD", 0);
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD_REAL", 0);
      rowData.CANTIDAD = 0;
      if (ix !== -1) {
        this.DPrefacturaItems[ix].CANTIDAD = 0;
      }

    } 
    else {
      rowData.CANTIDAD = value;
      rowData.SUB_TOTAL = rowData.CANTIDAD * currentRowData.VALOR_UNITARIO;
      const porIva = currentRowData.GRAVAMENES.PORCENTAJE !== undefined ? currentRowData.GRAVAMENES.PORCENTAJE : 0;
      rowData.VALOR_IVA = rowData.SUB_TOTAL * porIva / 100;
      rowData.TOTAL = rowData.SUB_TOTAL + rowData.VALOR_IVA;
 
      // Asigna valores al item
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD", rowData.CANTIDAD);
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD_REAL", rowData.CANTIDAD_REAL);
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "SUB_TOTAL", rowData.SUB_TOTAL);
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "VALOR_IVA", rowData.VALOR_IVA);
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "TOTAL", rowData.TOTAL);

      // Recalcular el movimiento
      this.valoresObjetos('gravamenes', 'items');
    }
    
  }

  onEditingStart(e) {
    this.gridBoxProducto = [e.data.PRODUCTO];
  }

  onEditorEnterKey(e){
    e.event.preventDefault();
    var itemsgru:any = this.formPrefactura.instance.option('items');
    itemsgru.forEach((g) => {
      var items = g['items'];
      var index = items.findIndex((item) => item.dataField === e.dataField);
      if (index !== -1){
        var fNextEditor = this.formPrefactura.instance.getEditor(
          items[++index < items.length ? index : 0].dataField
        );
        if (fNextEditor) fNextEditor.focus();
        return;
      }
    });
  }

  onFocusedRowChanged(e){
    const rowData = e.row && e.row.data;
    if (rowData) {
      this.gridBoxProducto = [rowData.PRODUCTO]
      this.valoresObjetos('atributos');
    }
  }

  onFocusOutAtributos(e, cellInfo) {
    if (cellInfo.data){
      cellInfo.data.ATRIBUTO = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onFocusOutClientes(e, cellInfo) {
    if (cellInfo.data){
      cellInfo.data.ID_CLIENTE = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onFocusOutProductos(e, cellInfo) {
    if (cellInfo.data){
      cellInfo.data.PRODUCTO = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onRowPrepared(e) {
    if (e.rowType === "data") {
      if (e.data.isEdit) {
                // e.rowElement.style.backgroundColor = 'lightyellow';
                const className:string = e.rowElement.className;
                e.rowElement.className = className +' row-modified-focused';
            }
    }
    if (e.rowType === "header" && e.rowIndex === 2 && !this.esEdicion) {
      e.rowElement.style.display = "none";
    }
  }

  onRowValidating(e: any) {
    // Valida completitud
    if ((e.newData.PRODUCTO === '' || e.oldData.PRODUCTO === '') || (e.newData.CANTIDAD === 0)) {
      e.isValid = false;
      showToast('Faltan completar datos del Producto', 'warning');
      return;
    }
  }

  onSeleccDocumento(e: any): void {
    this.sbDocumento = e.value;
    this.DPrefactura.DOCUMENTO = e.value;
    this.DPrefactura.DOCUMENTO_FAC = e.value;
    this.enableProductosItems();
    if(this._sdatos.accion == 'r_nuevo'){
      this.DPrefactura.ID_DOCUMENTO =  this.DDocumentos.find(p => p.DOCUMENTO === e.value).ID_DOCUMENTO;
      this.DPrefactura.CONSECUTIVO = this.DDocumentos.find(p => p.DOCUMENTO === e.value).CONSECUTIVO;
    }
  }

  onSelectionBodega(e: any){
    this.DPrefactura.ID_UN_BODEGA = e.value;
    this.enableProductosItems();
  }

  onSelectionAtributos(e) {
    if (e.name === 'value') {
      this.isGridBoxAtrOpened = false;
    }
  }

  onSelectionCliente(e) {
    if (e.name === 'value') {
      this.isGridBoxCliOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0){
      this.DPrefactura.ID_CLIENTE = e.selectedRowsData[0].ID_CLIENTE;
      this.DPrefactura.NOMBRE_CLIENTE = e.selectedRowsData[0].NOMBRE_COMPLETO;
      this.DPrefactura.ID_UBICACION = e.selectedRowsData[0].ID_UBICACION;
      this.DPrefactura.DIRECCION = e.selectedRowsData[0].DIRECCION;
      
      if(this._sdatos.accion != 'r_nuevo')
        this.loadDatos();

      this.isGridBoxCliOpened = false;
      this.valoresObjetos('direcciones');
      this.enableProductosItems();
    }
  }

  onSelectionCondicion(e) {
    var ANT_COND = this.DPrefactura.ID_CONDICION;
    if (e.name === 'value') {
      this.isGridBoxCondicionOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0){
      if(this.DPrefactura.ID_CONDICION != e.selectedRowsData[0].CODIGO && this.DPrefacturaItems.length > 0){
        Swal.fire({
          title: '',
          text: 'Está cambiando la Condición '+this.DPrefactura.ID_CONDICION+' por '+e.selectedRowsData[0].CODIGO+', esto borrará los Productos asociados, ¿Desea Continuar?',
          iconHtml: "<i class='icon-alert-outline'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, Borrar',
        }).then((result) => {
          if (result.isConfirmed){
            this.DPrefacturaItems = [];
            this.DPrefactura.ID_CONDICION = e.selectedRowsData[0].CODIGO;
          }else{
            // this.gridBoxCondicion = [(this.DPrefactura.ID_CONDICION != ANT_COND ? ANT_COND : this.DPrefactura.ID_CONDICION)];
            this.ddCondicion.instance.option("value", ANT_COND)
            this.DPrefactura.ID_CONDICION = ANT_COND;
            return;
          }
        });
      }
      this.DPrefactura.ID_CONDICION = e.selectedRowsData[0].CODIGO;
      this.TIPO_CONDLISTA = e.selectedRowsData[0].TIPO;
      if(this.DPrefactura.TIPO_VENTA == 'CREDITO'){
        const dcond = this.DCondicionLista.find(p => p.CODIGO === this.DPrefactura.ID_CONDICION);

        // Lista de plazos
        if (dcond.PLAZOS)
          this.DPlazos = JSON.parse(dcond.PLAZOS);
        else 
          this.DPlazos = []
        
        if (this.DPlazos != null && this.DPlazos.length == 1){
          this.DPrefactura.PLAZO = this.DPlazos[0].PLAZO;
          this.sbPlazo = this.DPlazos[0].PLAZO;
        }

        // Asignacion de fecha de vencimiento
        if (dcond.DIAS_VENC) {
          const fechaTmp = new Date(this.DPrefactura.FECHA);
          fechaTmp.setDate(fechaTmp.getDate() + dcond.DIAS_VENC);
          this.DPrefactura.FECHA_PRIMER_VENC = fechaTmp;
        }
        else 
          this.DPrefactura.FECHA_PRIMER_VENC = this.DPrefactura.FECHA;
        this.formPrefacturaAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("value",this.DPrefactura.FECHA);
        
      }
      else {
        this.formPrefacturaAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("disabled",true);
      }
      this.valoresObjetos('productos');
      this.isGridBoxCondicionOpened = false;
      this.enableProductosItems();
      this.DPrefactura.ID_CONDICION = e.selectedRowsData[0].CODIGO;
    }
  }

  onSelectionMoneda(e) {
    if (e.name === 'value') {
      this.isGridBoxMonedaOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0){
      this.DPrefactura.ID_MONEDA = e.selectedRowsData[0].ID_MONEDA;
      this.isGridBoxMonedaOpened = false;
    }
  }

  onSelectionADC(e) {
    if (e.name === 'value') {
      this.isGridBoxADCOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0){
      this.DPrefactura.ID_ADC = e.selectedRowsData[0].ID_ADC;
      this.valoresObjetos('condicion');
      this.isGridBoxADCOpened = false;
      this.enableProductosItems();
      if (this.DPrefactura.TIPO_VENTA != '')
        this.readOnlyCond = false;
      else
        this.readOnlyCond = true;
    }
  }

  onSelectionProductos(e) {
    if (e.name === 'value') {
      this.isGridBoxProdOpened = false;
    }
  }

  // Activa auto-busqueda multiple (por palabras)
  customizeColumnsSearch(columns: Array<any>) {
    columns.forEach((column: any) => {
      column.calculateFilterExpression = this.ltool.customCalculateFilterExpression.bind(column);
      column.cellTemplate = this.ltool.customCellTemplate.bind(this);
    })
  }  
  // Asigna string de palabras de búsqueda
  onSearchChanged(e: any): void {
    if (e.fullName === 'searchPanel.text') {
      const grid = e.component;
      const searcWords = e.value?.trim().toLowerCase();
      this.ltool.searchText = searcWords;
    }
  }

  onDropdownOpenedPro(e) {
    setTimeout(() => {
      if (this.gridProLista?.instance) {
          const gridElement = this.gridProLista.instance.element();
          
          // Use querySelector instead of find()
          const searchInput = gridElement.querySelector('.dx-datagrid-search-panel input') ||
                            gridElement.querySelector('.dx-texteditor-input');
          
          if (searchInput) {
            (searchInput as HTMLInputElement).focus();
          }
        }
    }, 100);  
  }
  onKeyDownListaPro(e, cellInfo:any) {
    this.ddProductos.instance.open();
  }
  onInputListaPro(e, cellInfo:any) {
    setTimeout(() => {
      this.gridProLista.instance.searchByText(e.event.target.value);
    }, 100);
  }

  refreshClick(objeto) {
    // this.checkProSoloPrecio.instance.option("value", false);
    // this.checkProProveedor.instance.option("value", false);
    this.valoresObjetos('productos');
    this.sboxProductos.instance._refresh();
    this.sboxProductos.instance.close();
  }
  onSoloConExistencias(e) {
    if (e.value) {
      this.valoresObjetos('productos', 'SI');
      this.conExistencias = true;
    }
    else {
      this.valoresObjetos('productos');
      this.conExistencias = false;
    }
  }

  onSelectionUN(e) {
    if (e.name === 'value') {
      this.isGridBoxUNOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0){
      this.DPrefactura.ID_UN_ITEM = e.selectedRowsData[0].ID_UN;
      this.isGridBoxUNOpened = false;
      this.valoresObjetos('bodegas');
      this.enableProductosItems();
    }
  }

  onSeleccDireccion(e: any){
    this.DPrefactura.DIRECCION = e.value;
  }

  onSeleccPlazo(e: any){
    this.DPrefactura.PLAZO = e.value;
    if(this.DPrefactura.PLAZO > 0){
      this.esVisibleCartera = true;
    }
    this.setValoresCartera();
  }

  onSeleccRowAtributo(e, cellInfo, datacompo) {
    if (e.data){
      cellInfo.data.ATRIBUTO = e.data.VALOR;
      this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "ATRIBUTO", cellInfo.data.ATRIBUTO);
      datacompo.close();
      this.isGridBoxAtrOpened = false;
    }
  }

  onSeleccRowCliente(e, cellInfo, datacompo) {
    if (e.data){
      cellInfo.data.ID_CLIENTE = e.data.ID_CLIENTE;
      this.DPrefactura.NOMBRE_CLIENTE = this.DClientes.find(p => p.ID_CLIENTE === cellInfo.data.ID_CLIENTE).NOMBRE_COMPLETO;
      this.isGridBoxCliOpened = false;
    }
  }

  async onSeleccRowProducto(e, cellInfo, datacompo) {
    // if (e.data){
    //   cellInfo.data.PRODUCTO = e.data.PRODUCTO;
    //   this.gridBoxProducto = [e.data.PRODUCTO];
    //   cellInfo.data.NOMBRE = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO).NOMBRE;
    //   this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "NOMBRE_PRODUCTO", cellInfo.data.NOMBRE);
    //   cellInfo.data.PERFIL_TRIBUTARIO = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO).PERFIL_TRIBUTARIO;
    //   this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "GRAVAMENES", cellInfo.data.PERFIL_TRIBUTARIO);
    //   cellInfo.data.VALOR_UNITARIO = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO).PRECIO;
    //   this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", cellInfo.data.VALOR_UNITARIO);
    //   cellInfo.data.PORC_IVA = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO).PORC_IVA;
    //   this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "PORC_IVA", cellInfo.data.PORC_IVA);
    //   datacompo.close();
    //   this.isGridBoxProdOpened = false;
    //   this.valoresObjetos('atributos');
    // }

    if (e.selectedRowKeys[0]){
      if ( !this.especRepetirItem && 
            this.DPrefacturaItems.findIndex((d:any) => d.PRODUCTO === e.selectedRowKeys[0]) != -1 ) {
          showToast("Ya está registrado este producto!", 'wanning');
          return;
        }
        
      // Producto seleccionado
      const proSelecc = e.selectedRowKeys[0];

      //Valida si el producto esta asignado a la bodega de Destino y tiene existencias.
      const UN_DES:any = this.DPrefactura.ID_UN_ITEM;
      const prm:any = { PRODUCTO: proSelecc, 
                        PRESENTACION: 'SI', 
                        MOVIMIENTO: "Prefactura",
                        TIPO: "Prefactura" ,
                        TIPO_CONDICION: this.TIPO_CONDLISTA,
                        ID_CONDICION: this.DPrefactura.ID_CONDICION,
                        PLAZO: this.DPrefactura.PLAZO,
                        ID_CLIENTE: this.DPrefactura.ID_CLIENTE,
                        ID_UN_BODEGA: this.DPrefactura.ID_UN_BODEGA
      };
      const apiRest = this._sdatos.consulta('EXISTENCIAS PRODUCTO', prm, this.prmUsrAplBarReg.aplicacion);
      let res = await lastValueFrom(apiRest, {defaultValue: true});
      res = JSON.parse(res.data);
      if (res[0].ErrMensaje !== ''){
        cellInfo.data.PRODUCTO = '';
        showToast(res[0].ErrMensaje, 'error');
        return;
      }

      cellInfo.data.PRODUCTO = proSelecc;
      const dnompro = res[0];
      this.DProductosLista = res;
      if (dnompro) {
        cellInfo.data.NOMBRE_PRODUCTO = dnompro.NOMBRE;
        cellInfo.data.REFERENCIA = dnompro.REFERENCIA;
        this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "NOMBRE_PRODUCTO", cellInfo.data.NOMBRE);
        // cellInfo.data.PERFIL_TRIBUTARIO = dnompro.PERFIL_TRIBUTARIO;
        // this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "GRAVAMENES", cellInfo.data.PERFIL_TRIBUTARIO);
        cellInfo.data.PORC_IVA = dnompro.PORC_IVA;

        // Presentación
        if (dnompro.PRESENTACION) {
          const dpres = dnompro.PRESENTACION;
          this.DListaUMVenta = dpres;

          if (dpres.length >= 1) {

            const dcanreal = dpres[0].CANTIDAD_PRES * dpres[0].CANTIDAD_EQUIV;
            cellInfo.data.VALOR_UNITARIO = dnompro.PRECIO;
            cellInfo.data.VALOR_BASE = dnompro.VALOR_BASE;
            cellInfo.data.CANTIDAD_PRES = dpres[0].CANTIDAD_PRES;
            cellInfo.data.CANTIDAD_EQUIV = dpres[0].CANTIDAD_EQUIV;
            this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "UDM_VENTA", dpres[0].UDM_VENTA);
            // this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", dpres[0].CANTIDAD_PRES);
            this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", dpres[0].UDM_EQUIV);
            // this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", dpres[0].CANTIDAD_EQUIV);
            // this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", cellInfo.data.VALOR_UNITARIO);
            this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", dcanreal);
          } else {
            cellInfo.data.VALOR_UNITARIO = 0;
            this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "UDM_VENTA", "");
            // this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", "");
            this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", "");
            // this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", "");
            // this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", 0);
            this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", 0);
          }
        }
        this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "PORC_IVA", cellInfo.data.PORC_IVA);
        // this.valoresObjetos('atributos');
        setTimeout(() => {
          var rowIndex = cellInfo.component.getRowIndexByKey(cellInfo.key);
          // cellInfo.component.editCell(rowIndex, 'PRODUCTO');
          // e.component.focus();
          cellInfo.component.focus(this.gridPrefacturaItems.instance.getCellElement(rowIndex, "PRODUCTO"));
        }, 300);

        // Análisis de varios Ivas
        this.keyFila = cellInfo.key;
        if (dnompro.IVAS.length > 1) {
          this.eventsSubjectIvas.next({
            dataSource: dnompro.IVAS,
            visible: true,
            iva: ''
          });

        } else {
          this.onSeleccIvas({ addedItems: dnompro.IVAS });
        }
      }
    }

  }

  onValueChangedUMVenta(e, cellInfo) {
    cellInfo.setValue(e.value);
    const dum = this.DListaUMVenta.find((u: any) => u.UDM_COMPRA == e.value);
    if (this.DPrefacturaItems.findIndex((d: any) => d.PRODUCTO === cellInfo.data.PRODUCTO && d.UDM_COMPRA === e.value) === -1) {
      if (dum) {
        cellInfo.data.UDM_COMPRA = dum.UDM_COMPRA;
        cellInfo.data.UDM_EQUIV = dum.UDM_EQUIV;
        cellInfo.data.CANTIDAD_EQUIV = dum.CANTIDAD_EQUIV;
        cellInfo.data.CANTIDAD_PRES = dum.CANTIDAD_PRES;
        cellInfo.data.VALOR_UNITARIO = dum.PRECIO;
        const dcanreal = dum.CANTIDAD_PRES * dum.CANTIDAD_EQUIV * cellInfo.data.CANTIDAD;
        cellInfo.data.CANTIDAD_REAL = dcanreal;
        this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "UDM_COMPRA", cellInfo.data.UDM_COMPRA);
        this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", cellInfo.data.UDM_EQUIV);
        this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", cellInfo.data.CANTIDAD_EQUIV);
        this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", cellInfo.data.CANTIDAD_PRES);
        this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", cellInfo.data.VALOR_UNITARIO);
        this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", cellInfo.data.CANTIDAD_REAL);
      }
    } else {
      cellInfo.data.UDM_COMPRA = '';
      cellInfo.data.UDM_EQUIV = '';
      cellInfo.data.CANTIDAD_EQUIV = '';
      cellInfo.data.CANTIDAD_PRES = '';
      cellInfo.data.VALOR_UNITARIO = 0;
      cellInfo.data.CANTIDAD_REAL = 0;
      this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "UDM_COMPRA", "");
      this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", "");
      this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", "");
      this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", "");
      this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", 0);
      this.gridPrefacturaItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", 0);
      showToast('La Unidad de venta está repetida.', 'error');
    }
  }

  onSeleccTipoVenta(e){
    this.DPrefactura.TIPO_VENTA = e.value;
    this.DPlazos = this.DPrefactura.TIPO_VENTA != 'CREDITO' ? [{PLAZO: 0}] : this.DPlazos;
    if (this.DPrefactura.TIPO_VENTA == 'CREDITO')
      this.formPrefacturaAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("disabled",false);
    else {
      this.formPrefacturaAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("disabled",true);
      this.formPrefacturaAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("value",this.DPrefactura.FECHA);
      this.formPrefacturaAdicional.instance.getEditor("PLAZO")?.option("disabled",true);
      this.xs__PLAZO.instance.option("value", 0)
      this.DPrefactura.PLAZO = 0;
    }
    
    // Activa/Desactiva edición de condición
    this.valoresObjetos('condicion');
    if (this.DPrefactura.ID_ADC != '')
      this.readOnlyCond = false;
    else
      this.readOnlyCond = true;

  }

  onValueChangedFechaEntrega(e:any, cellInfo:any){
    cellInfo.setValue(e.value);
  }

  onToolbarPreparingGrid(e: any) {
    let toolbarItems = e.toolbarOptions.items;
    e.toolbarOptions.items.unshift(
      {
        location: 'before'
      }
    );
  }

  onValueChangedAtributos(e, cellInfo) {
    cellInfo.setValue(e.value);
  }

  onValueChangedCliente(e, cellInfo) {
    cellInfo.setValue(e.value);
  }

  onValueChangedProducto(e, cellInfo) {
    cellInfo.setValue(e.value);
  }

  AccionEliminar(): void {
    // API eliminación de datos
    const prm = { PrefacturaS: {ID_DOCUMENTO: this.DPrefactura.ID_DOCUMENTO, PREFIJO: this.DPrefactura.PREFIJO, CONSECUTIVO: this.DPrefactura.CONSECUTIVO, SUFIJO: this.DPrefactura.SUFIJO} };
    this._sdatos
      .delete('delete', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== ''){
          this.showModal(res[0].ErrMensaje);
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        this.opIrARegistro('Eliminado');
        showToast('Prefactura eliminado', 'success');
        this.readOnly = true;
        this.readOnlyUdp = true;

        // Operaciones de barra
        this.prmUsrAplBarReg.r_totReg--;
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          error: '',
          accion: 'r_navegar',
          operacion: {},
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      });
  }

  calcularValores(){
    this.DPrefactura.SUB_TOTAL = this.DPrefacturaItems.reduce((n, {SUB_TOTAL}) => n + SUB_TOTAL, 0);
    // this.TOT_GRAV = this.DPrefacturaGravAux.reduce((n, {VALOR}) => n + VALOR, 0);
    this.DPrefactura.TOTAL = this.DPrefactura.SUB_TOTAL - this.TOT_ANTICIPOS + this.TOT_GRAV;
    //Aqui se construye la grid de Subtotales
    this.GridSubTotales = [{key: 'Subtotal', value: this.DPrefactura.SUB_TOTAL},{key: 'Descuentos', value: this.DPrefactura.VALOR_DESCUENTO},{key: 'Anticipos', value: this.TOT_ANTICIPOS}];
    this.setValoresCartera();
  }

  cambiosItemForma(e, accion = 'activar'){
    if (accion === 'activar'){
      if (!this.iniEdicion && !this.readOnly){
        if (!e.dataField.match('__obj__')){
          var dataField = e.dataField;
          document.getElementsByName(dataField)[0].classList.add('is-dirty');
        } else {
          var dataField = e.dataField.replace('__obj__', '');
          document.getElementById(dataField)?.classList.add('is-dirty');
        }
      }
    } else {
      if (!e.dataField.match('__obj__')){
        var dataField = e.dataField;
        document.getElementsByName(dataField)[0].classList.remove('is-dirty');
      } else {
        var dataField = e.dataField.replace('__obj__', '');
        if (document.getElementById(dataField))
          document.getElementById(dataField)?.classList.remove('is-dirty');
      }
    }
  }

  disableDates(args: any) {
    const today = new Date();
    return args.date < (this.DPrefactura == null || this.DPrefactura.FECHA == null ? today : this.DPrefactura.FECHA) ;
  }
  disableDates2(args: any) {
    // const today = new Date();
    // const fhoy = this.datepipe.transform(today, 'MM/dd/yyyy');
    // const fcal = this.datepipe.transform(args.date, 'MM/dd/yyyy');
    // const ford = this.datepipe.transform(this.DOrdenCompra.FECHA_SOLICITUD, 'MM/dd/yyyy');
    // const dfhoy = new Date(fhoy!);
    // const dfcal = new Date(fcal!);
    // const dford = new Date(ford!);
    // return dfcal < (dford == undefined ? dfhoy : dford);
  }
  onValueChangedFechaVenc(e: any) {
    this.DPrefactura.FECHA_PRIMER_VENC = e.value;
  }

  // Activa items de la grid
  enableProductosItems(){
    if(this.DPrefactura.DOCUMENTO == '' || 
      this.DPrefactura.ID_CLIENTE == '' || 
      this.DPrefactura.FECHA == '' || 
      this.DPrefactura.ID_UN_ITEM == '' || 
      this.DPrefactura.ID_ADC == '' || 
      this.DPrefactura.ID_CONDICION == '' ||
      this.DPrefactura.ID_UN_BODEGA == '' ||
      this.DPrefactura.PLAZO == null
    ){
      this.rowNew = false;
    }else{
      this.rowNew = true;
    }

  }

  imprimirReporte(id_reporte, archivo, datosrpt) {
    let filtroRep = {FILTRO: ''};
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
    this.tabService.addTab(
      new Tab(
        VisorrepComponent,  // visor
        datosrpt.text,  // título
        { parent: "PrincipalComponent", args: prmLiq },  // parámetro: reporte,filtro
        id_reporte,  // código del reporte
        '',
        'reporte',
        true
    ));
  }

  initNewRow(e){
      e.data.ID_UN = '';
      e.data.ID_UN = '';
      e.data.ID_UN_ITEM = '';
      e.data.ID_DOCUMENTO = '';
      e.data.PREFIJO = '';
      e.data.CONSECUTIVO = 0;
      e.data.SUFIJO = '';
      e.data.ITEM = 0;
      e.data.PRODUCTO = '';
      e.data.ATRIBUTO = 'SIN';
      e.data.ID_SOPORTE = '';
      e.data.NC_PREFIJO = '';
      e.data.NC_CONSECUTIVO = 0;
      e.data.NC_SUFIJO = '';
      e.data.CANTIDAD = 0;
      e.data.CANTIDAD_AUTORIZADA = 0;
      e.data.CANTIDAD_PENDIENTE = 0;
      e.data.VALOR_BASE = 0;
      e.data.VALOR_UNITARIO = 0;
      e.data.VALOR_BASE = 0;
      e.data.SUB_TOTAL = 0;
      e.data.VALOR_DESCUENTO = 0;
      e.data.VALOR_COSTOS = 0;
      e.data.VALOR_IVA = 0;
      e.data.PORC_IVA = 0;
      e.data.GRAVAMENES = '';
      e.data.TOTAL = 0;
      e.data.UDM_VENTA = "";
      if (this.DPrefacturaItems.length > 0) {
        const item = this.DPrefacturaItems.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
        e.data.ITEM = item.ITEM + 1;
      }
      else {
        e.data.ITEM = 1;
      }
      e.data.isEdit = false;
  }

  insertedRow(e){
    this.setItemValues();
    this.rowApplyChanges = false;
  }

  insertingRow(e) {
    this.conCambios++;
    e.data.isEdit = true;
    // Valida datos
    if (e.data.PRODUCTO === ''){
      showToast('Faltan completar datos del Producto', 'warning');
      e.cancel = true;
    }
  }

  loadDatos(){
    this.loadDataToVariables();
    this.esVisibleCartera = (this.DPrefactura.PLAZO > 0 ? true:false);
  }

  loadDataToVariables(){
    this.gridBoxCliente = [this.DPrefactura.ID_CLIENTE];
    this.gridBoxUN = [this.DPrefactura.ID_UN_ITEM];
    this.gridBoxMoneda = [this.DPrefactura.ID_MONEDA];
    this.gridBoxCondicion = [this.DPrefactura.ID_CONDICION];
    this.gridBoxADC = [this.DPrefactura.ID_ADC];
    this.sbDocumento = this.DPrefactura.DOCUMENTO;
    this.sbTipoVenta = this.DPrefactura.TIPO_VENTA;
    this.sbIdDireccion = this.DPrefactura.DIRECCION;
    this.sbPlazo = this.DPrefactura.PLAZO;
  }

  loadManualDatatables(){
    this.valoresObjetos('direcciones');
    this.valoresObjetos('condicion');
    this.setDocumentoToDatatable();
  }

  removedRow(e) {
    this.setItemValues();
    this.rowApplyChanges = false;
  }

  resetValidaciones(){
    //this.formPrefactura.instance.resetValues();
  }

  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  setValoresCartera(){
    this.DPrefactura.VALOR_CUOTA = (this.DPrefactura.TOTAL - this.DPrefactura.CUOTA_INICIAL) / this.DPrefactura.PLAZO
  }

  setDocumentoToDatatable(){
    this.DDocumentos = [];
    this.DDocumentos.push({ID_DOCUMENTO: this.DPrefactura.ID_DOCUMENTO, CONSECUTIVO: this.DPrefactura.CONSECUTIVO, DOCUMENTO: this.DPrefactura.ID_DOCUMENTO+'-'+this.DPrefactura.CONSECUTIVO});
  }

  setDItemsAux(){
    this.DItemsAux = this.DPrefacturaItems;
    for(const item of this.DItemsAux){
      item.APLICACION = 2
    }
  }

  setDPrefacturaItemsValues(data){
    for(const item of data){
      for(const DItem of this.DPrefacturaItems){
        if(item.ITEM === DItem.ITEM){
          DItem.GRAVAMENES = item.GRAV;
          DItem.VALOR_IVA = item.VALOR_IVA;
          DItem.TOTAL = item.TOTAL;
        }
      }
    }
  }

  onGridContReadyGrav (e){
    const grid = e.component;
    const data = grid.getDataSource().items();

    if (data.length === 0) {
        // Si no hay datos → alto 0
        grid.option("height", 0);
    } else {
        // Si hay datos → autoajustar al contenido
        grid.option("height", "auto");
    }    
  }

  setItemValues(){
    this.setDItemsAux();
    this.valoresObjetos('gravamenes', 'items');
    this.calcularValores();
  }

  showModal(mensaje, titulo = '', html = '') {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
      title: '¡Error!',
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
      html,
      stopKeydownPropagation: false,
    });
  }

  updatedRow(e){
    this.setItemValues();
    this.rowApplyChanges = false;
  }

  updatingRow(e) {
    this.conCambios++;
    if (e.oldData === undefined)
      return;
    e.oldData.isEdit = true;
    this.setItemValues();
  }

  // Valores de cargue inicial
  valoresDefecto() {
    if (this.especAplicacion) {
      this.DPrefactura.ID_MONEDA = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'ID_MONEDA_DEF')?.VALOR_DEFECTO ?? '';
      this.especMonedaFormato = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'FORMATO MONEDA')?.FORMATO ?? '#,##0.00';
      this.especCantidadFormato = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'FORMATO CANTIDAD')?.FORMATO ?? '#,##0.00';
      this.especModificarPrecio = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'MODIFICAR PRECIO')?.ACTIVADO ?? false;
      this.especModificarGrav = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'MODIFICAR GRAVAMENES')?.ACTIVADO ?? false;
      this.especRepetirItem = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'REPETIR ITEM')?.ACTIVADO ?? false;
      this.especOrigenPrecio = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'MODIFICAR PRECIO')?.VALOR_DEFECTO ?? '';

      // Estilos de estado
      const sestado = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'ESTILOS ESTADO')?.VALOR_DEFECTO ?? '';
      this.especEstiloEstado = sestado !== '' ? JSON.parse(sestado) : [{ ESTADO: '', color: 'inherit', background: 'inherit' }];
    }
  }

  onSeleccIvas(e) {
    if (e.addedItems === undefined) return;
    if (e.addedItems.length === 0) return;
    var rowIndex = this.gridPrefacturaItems.instance.getRowIndexByKey(this.keyFila);
    const canPro = this.gridPrefacturaItems.instance.cellValue(rowIndex, "CANTIDAD");
    const valUnit = this.gridPrefacturaItems.instance.cellValue(rowIndex, "VALOR_UNITARIO");
    const valIva = e.addedItems[0].PORCENTAJE / 100 * canPro * valUnit;
    this.gridPrefacturaItems.instance.cellValue(rowIndex, "VALOR_IVA", valIva);
    this.gridPrefacturaItems.instance.cellValue(rowIndex, "PORC_IVA", e.addedItems[0].PORCENTAJE / 100);
    this.gridPrefacturaItems.instance.cellValue(rowIndex, "TOTAL", canPro * valUnit + valIva);
    this.gridPrefacturaItems.instance.cellValue(rowIndex, "GRAVAMENES", e.addedItems[0]);
    this.gridPrefacturaItems.instance.cellValue(rowIndex, "GRAV_ORG", e.addedItems[0]);

    // Actualiza el data source
    const nx = this.DPrefacturaItems.findIndex(it => it.ITEM == this.gridPrefacturaItems.instance.cellValue(rowIndex, "ITEM"));
    if (nx !== -1) {
      this.DPrefacturaItems[nx].VALOR_IVA = valIva;
      this.DPrefacturaItems[nx].TOTAL = canPro * valUnit + valIva;
      this.DPrefacturaItems[nx].GRAVAMENES = e.addedItems[0];
      this.DPrefacturaItems[nx].GRAV_ORG = e.addedItems[0];
    }

    this.valoresObjetos('gravamenes');
  }

  // Ejecuta acciones de settings
  async operacionesSettings(datos) {

    // Opcion seleccionada
    const opcion = datos.data.VALOR;
    const config = datos.data.CONFIG != "" ? JSON.parse(datos.data.CONFIG) : { MODO: 'edicion'};
    const modoOper = config.MODO;

    // Solo en modo edición
    if (this.mnuAccion != "update" && this.mnuAccion != "new" && modoOper != 'consulta') {
      this.showModal('Esta operación no está permitida en modo consulta.');
      return;
    }

    // Trae la configuación de la opción seleccionada
    const prm:any = { ACCION: opcion, 
                      ID_APLICACION: this.prmUsrAplBarReg.aplicacion, 
                      USUARIO: this.prmUsrAplBarReg.usuario,
                      PREFACTURA: this.DPrefactura,
                      ITM_PREFACTURA: this.DPrefacturaItems,
                      PREFACTURA_PAGOS: this.DPrefacturaPagos,
                    };
    const apiRest = this._sdatos.consulta('acciones settings', prm, this.prmUsrAplBarReg.aplicacion);
    let res = await lastValueFrom(apiRest, {defaultValue: true});
    res = JSON.parse(res.data);
    if (res[0].ErrMensaje !== ''){
      showToast(res[0].ErrMensaje, 'error');
      return;
    }

    // Ejecuta acción
    switch (res[0].tipoAccion) {

      case "popup":
        const itemsSelecc = this.DPrefacturaPagos.map(({ ITEM }) => ({ ITEM }));
        this.eventsSubjectSettings.next({ 
          dataSource: res[0].dataSource, 
          rowsSelected: itemsSelecc,
          keyExpr: ["ITEM"],
          titGrid: res[0].titulo, 
          modoSelection: res[0].modoSeleccion,
          colsConfig: JSON.parse(res[0].colsConfig), 
          container: res[0].container,
          style: { height: (res[0].height ? res[0].height : 400), width: (res[0].width ? res[0].width : 600) }
        });
        break;
    
      case "componente":
        const datPrefactura = {
          DOCUMENTO: this.DPrefactura.DOCUMENTO,
          ID_DOCUMENTO: this.DPrefactura.ID_DOCUMENTO,
          NC_DOCUMENTO: this.DPrefactura.CONSECUTIVO.toString(),
          FECHA: this.DPrefactura.FECHA,
          CLIENTE: this.DPrefactura.ID_CLIENTE +' '+ this.DPrefactura.NOMBRE_CLIENTE,
          EMAIL: res[0].EMAIL?? "",
          ID_EMPRESA: this.empresa,
          NIT_EMPRESA: res[0].NIT_EMPRESA.toString()?? "",
          CUFE: res[0].dataElecStatus.length != 0 ? res[0].dataElecStatus[0].CUFE?? "" : "",
          QR: res[0].dataElecStatus.length != 0 ? res[0].dataElecStatus[0].QR?? "" : "",
          tipoDocElectronico: 'Prefactura'
        }
        this.eventsSubjectDocElec.next({ 
          dataSource: datPrefactura,
          dataElecStatus: res[0].dataElecStatus,
          visible: true,
          titulo: "Prefactura electrónica"
        });
        break;

      default:
        break;
    }

  }

  // Recibe los datos seleccionados en settings
  async onRespuestaSettings(e: any) {
    // Solo se procesa si es en modo edición
    if (this.mnuAccion != "new" && this.mnuAccion != "update") return;

    if (e.titulo == 'Anticipos a aplicar') {
      // Total seleccionado
      const total = e.rowsSelected.reduce((acc, item) => acc + item.VALOR, 0);
      if (total > this.DPrefactura.SUB_TOTAL + this.TOT_GRAV) {
        this.showModal('El valor total de los anticipos no puede ser mayor al valor total de la Prefactura.');
        return;
      } 
      this.TOT_ANTICIPOS = total;
      this.DPrefacturaPagos = e.rowsSelected;
      this.calcularValores();
    }

    if (e.titulo == 'Cargar Prefactura') {
      // Total seleccionado
      const prm:any = { ACCION: e.titulo, 
                        ID_APLICACION: this.prmUsrAplBarReg.aplicacion, 
                        USUARIO: this.prmUsrAplBarReg.usuario,
                        PREFACTURA: this.DPrefactura,
                        ITM_PREFACTURA: this.DPrefacturaItems,
                        Prefactura_PAGOS: this.DPrefacturaPagos,
                        DATOS: e.rowsSelected
                      };
      const apiRest = this._sdatos.consulta('cargar datos', prm, this.prmUsrAplBarReg.aplicacion);
      let res = await lastValueFrom(apiRest, {defaultValue: true});
      res = JSON.parse(res.data);
      if (res[0].ErrMensaje !== ''){
        showToast(res[0].ErrMensaje, 'error');
        return;
      }

      // Asocia datos a los items
      this.DPrefacturaItems = res[0].ITM_Prefactura;
      // Gravamenes asociados 
      this.DPrefacturaGrav = res[0].DATA_GRAV[0].ENCAB ? res[0].DATA_GRAV[0].ENCAB : [];
      this.DPrefacturaGravAux = res[0].DATA_GRAV[0].ITEMS ? res[0].DATA_GRAV[0].ITEMS : [];
      this.TOT_GRAV = this.DPrefacturaGrav.reduce((sum: any, item: any) => sum + item.VALOR, 0);
      this.calcularValores();
      this.visibleColSoporte = true;

      // Deshabilita edición de datos generales
      if (this.DPrefacturaItems.length > 0)
        this.readOnly = true;
      else
        this.readOnly = false;

    }

  }

  onRespuestaDocelec(e) {
  }

  // Color status del ESTADO del Prefactura
  setBackgroundStyle(estado: string): string {
    const styles = {
      'REGISTRADO': 'background-color: #e8f5e8;',
      'AUTORIZADO': 'background-color:rgb(132, 223, 170);',
      'PARCIAL': 'background-color:rgb(240, 152, 217);',
      'ANULADO': 'background-color:rgb(242, 161, 169);',
      'PROGRAMADO': 'background-color:rgba(172, 200, 255, 1);'
    };
    
    return styles[estado] || 'background-color:rgb(238, 232, 232);';
  }

  // Color status del ESTADO en produccion
  estiloEstado(estado, estilo) {
    const estiloEstado = this.especEstiloEstado.find((es: any) => es.ESTADO === estado);
    if (estiloEstado) {
      if (estilo === 'color') {
        return estiloEstado.color;
      } else if (estilo === 'background') {
        return estiloEstado.background;
      }
    } else {
      return 'inherit';
    } 
  }

  ValidaDatos(Accion: string): boolean {
    var msg = '';
    if (Accion === "requerido"){
      if (this.DPrefactura.DOCUMENTO == "" || this.DPrefactura.FECHA == null || this.DPrefactura.ID_CLIENTE == "" || this.DPrefactura.ID_UN_ITEM == '' || this.DPrefactura.ID_MONEDA == '' || this.DPrefactura.ID_ADC == "" || this.DPrefactura.TIPO_VENTA == "" || this.DPrefactura.ID_CONDICION == "" || this.DPrefactura.FECHA_PRIMER_VENC == null){
        if(this.DPrefactura.DOCUMENTO == '') msg += 'Documento ,';
        if(this.DPrefactura.FECHA == null) msg += 'Fecha ,';
        if(this.DPrefactura.ID_CLIENTE == '') msg += 'Cliente ,';
        if(this.DPrefactura.ID_UN_ITEM == '') msg += 'Unidad de Negocio ,';
        if(this.DPrefactura.ID_MONEDA == '') msg += 'Moneda ,';
        if(this.DPrefactura.ID_ADC == '') msg += 'Vendedor ,';
        if(this.DPrefactura.TIPO_VENTA == '') msg += 'Tipo de Venta ,';
        if(this.DPrefactura.ID_CONDICION == '') msg += 'Condición ,';
        if(this.DPrefactura.FECHA_PRIMER_VENC == null) msg += 'Fecha Vencimiento ,';
        this.showModal('Error al guardar',"Faltan datos","Hay datos incompletos del Prefactura. Revisar contenido de los items: "+msg.slice(0, -1));
        return false;
      }
      if(this.DPrefacturaItems === undefined || this.DPrefacturaItems.length == 0){
        this.showModal('Error al guardar',"Faltan datos","No se ha asociado ningún Producto al Prefactura");
        return false;
      }
      if(this.DPrefactura.FECHA_PRIMER_VENC < this.DPrefactura.FECHA && this.DPrefactura.FECHA_PRIMER_VENC != ''){
        this.showModal('Error al guardar',"Validación","La Fecha de Vencimiento no debe ser menor a la Fecha del Prefactura");
        return false;
      }
    }
    return true;
  }

  valoresObjetos(obj: string, opcion: any = undefined) {
    if (obj === 'documento' || obj === 'ref') {
      const prm = { ID_APLICACION : 'VEN-230', 
                    USUARIO: localStorage.getItem('usuario')};
      this._sdatos
        .consulta('DOCUMENTOS CONSECUTIVO', prm, 'ADM-007')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DDocumentos = res;
          if(this.DDocumentos != null && this.DDocumentos.length === 1){
            this.sbDocumento = this.DDocumentos[0].DOCUMENTO;
            this.DPrefactura.DOCUMENTO = this.DDocumentos[0].DOCUMENTO;
            this.DPrefactura.ID_DOCUMENTO = this.DDocumentos[0].ID_DOCUMENTO;
            this.DPrefactura.CONSECUTIVO = this.DDocumentos[0].CONSECUTIVO;
          }
        });
    }

    if (obj === 'productos' || obj === 'ref') {
      const prm = {ID_LISTA: this.DPrefactura.ID_CONDICION, 
                   TIPO: this.TIPO_CONDLISTA,
                   PLAZO: this.DPrefactura.PLAZO,
                   CON_EXIS: opcion,
                   ID_UN_BODEGA: this.DPrefactura.ID_UN_BODEGA
                  };
      const accion = 'PRODUCTOS LISTA PRECIOS';
      this._sdatos.consulta(accion, prm, 'PRO-022').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DProductos = res;
      });
    }

    if (obj === 'clientes' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('CLIENTES',{ESTADO: 'ACTIVO'},'VEN-001').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DClientes = res;
      });
    }

    if (obj === 'adc' || obj === 'todos' || obj === 'ref') {
      const prm = {ESTADO:'ACTIVO'}
      this._sdatos.consulta('ADC',prm,'VEN-006').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DADC = res;
      });
    }

    if (obj === 'tipo venta' || obj === 'todos' || obj === 'ref'){
      const prm = {ID_DOMINIO: 'FACTURA', ID_GRUPO_DOMINIO: 'TIPO VENTA'};
      this._sdatos
        .consulta('ITM_DOMINIOS', prm, 'ADM012')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DTiposVenta = res;
        });
    }

    if (obj === 'gravamenes' || obj === 'ref'){
      var prm = {};
      if (opcion !== 'original')
        prm = { PREFACTURA: this.DPrefactura, 
                ITEMS: this.DPrefacturaItems, APL_GRAV: opcion};
      else
        prm = { PREFACTURA: this.DPrefactura, 
                ITEMS: this.DPrefacturaItems, OPCION_GRAV: opcion};
      this._sdatos
        .consulta('GRAVAMENES', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          // this.DPrefacturaGrav = res.ITEMSGRAV;
          // if(this.DPrefacturaGrav !== undefined && this.DPrefacturaGrav.length > 0){
          //   this.DPrefacturaGravAux = this.DPrefacturaGrav.filter(e => e.APLICACION === 1);
          //   this.TOT_GRAV = this.DPrefacturaGravAux.reduce((n, {VALOR}) => n + VALOR, 0);
          // }else{
          //   this.DPrefacturaGravAux = [];
          // }
          this.DPrefacturaGrav = res[0].ENCAB ? res[0].ENCAB : [];
          this.DPrefacturaGravAux = res[0].ITEMS ? res[0].ITEMS : [];
          this.TOT_GRAV = this.DPrefacturaGrav.reduce((sum: any, item: any) => sum + item.VALOR, 0);
          this.calcularValores();
          // this.setDPrefacturaItemsValues(res.ITEMS);

          // Aplica a los items
          if (opcion !== undefined) {
            this.DPrefacturaItems.forEach(item => {
              const nx = this.DPrefacturaGravAux.findIndex(gi => gi.ITEM == item.ITEM);
              if (nx > -1) {
                item.VALOR_IVA = this.DPrefacturaGravAux[nx].VALOR_IVA;
                item.SUB_TOTAL = this.DPrefacturaGravAux[nx].SUB_TOTAL;
                item.TOTAL = this.DPrefacturaGravAux[nx].TOTAL;
                item.GRAVAMENES = this.DPrefacturaGravAux[nx].GRAV_TOTAL;
                item.GRAV_TOTAL = this.DPrefacturaGravAux[nx].GRAV_TOTAL;
              }
            });
          }

        });
    }

    if (obj === 'direcciones' || obj === 'ref') {
      this._sdatos.consulta('DIRECCIONES CLIENTE',{ID_CLIENTE: this.DPrefactura.ID_CLIENTE},'VEN-001').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DDirecciones = res;
        if (this.DDirecciones.length == 1 ){
          this.DPrefactura.DIRECCION = this.DDirecciones[0].DIRECCION;
          this.sbIdDireccion = this.DPrefactura.DIRECCION;
        }          
      });
    }

    if (obj === 'un' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('UNIDADES NEGOCIOS',
                            { ESTADO: 'ACTIVO', 
                              USUARIO: this.prmUsrAplBarReg.usuario,
                              ID_APLICACION: this.prmUsrAplBarReg.aplicacion
                            },'ADM-002').
                            subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DUnidadesNegocios = res;
      });
    }

    if (obj == 'bodegas') {
      this._sdatos.consulta('BODEGAS', 
                            { ESTADO: 'ACTIVO', 
                              MOVIMIENTO: 'Prefactura', 
                              ID_UN_ITEM: this.DPrefactura.ID_UN_ITEM,
                              USUARIO: this.prmUsrAplBarReg.usuario
                            }, 
                            'INV-002').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DBodegas = res;
        this.eventsSubjectSboxBodega.next({
          dataSource: this.DBodegas,
          valueExpr: "ID_UN_BODEGA",
          displayExpr: "ID_UN_BODEGA",
          style: { width: 700, colWidth: [33, 33, 33] },
          columnData: ["ID_UN_BODEGA", "DESCRIPCION", "NOMBRE_UN"],
          valueData: this.DPrefactura.ID_UN_BODEGA
        });

      });
    }

    if (obj === 'monedas' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('MONEDAS',{ESTADO: 'ACTIVO'},'ADM-004').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DMonedas = res;
      });
    }

    if (obj === 'condicion' || obj === 'ref') {
      this._sdatos.consulta('CONDICIONES LISTAS',
                             {ID_ADC: this.DPrefactura.ID_ADC, 
                              TIPO_VENTA: this.DPrefactura.TIPO_VENTA, 
                              ESTADO: 'ACTIVO'},
                             this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DCondicionLista = res;
        if(this.DCondicionLista[0].CODIGO === null){
          showToast('El Vendedor seleccionado no tiene Condiciones de Venta asociadas', 'warning');
        }
        if(this._sdatos.accion === 'r_buscar'){
          this.DPlazos = JSON.parse(this.DCondicionLista.find(e => e.CODIGO === this.DPrefactura.ID_CONDICION).PLAZOS);
        }
      });
    }

    if (obj === 'moneda def' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('ESPECIFICACIONES',{ID_ESPECIFICACION: 'OBJETOS', ID_APLICACION: 'GENERAL', NOMBRE_OBJETO: 'DEF_MONEDA'}, 'ADM-011').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DMonedaDef = res;
        if(this.DMonedaDef != null){
          this.MONEDA_DEF = this.DMonedaDef[0].VALOR_DEFECTO
          this.gridBoxMoneda = [this.MONEDA_DEF];
          this.DPrefactura.ID_MONEDA = this.MONEDA_DEF;
        }
      });
    }

    if (obj === 'un def' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('UN DEFECTO',{USUARIO: this.prmUsrAplBarReg.usuario}, 'ADM-015').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if(res != null && res.length > 0){
          this.UN_DEF = res[0].ID_UN;
          this.gridBoxUN = [this.UN_DEF];
          this.DPrefactura.ID_UN_ITEM = this.UN_DEF;
        }
      });
    }

    if (obj === 'formato moneda' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('ESPECIFICACIONES',{ID_ESPECIFICACION: 'OBJETOS', ID_APLICACION: 'GENERAL', NOMBRE_OBJETO: 'FORMATO MONEDA'}, 'ADM-011').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.MONEDA_FORMATO = res[0].FORMATO;
      });
    }

    if (obj === 'formato cantidad' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('ESPECIFICACIONES',{ID_ESPECIFICACION: 'OBJETOS', ID_APLICACION: 'GENERAL', NOMBRE_OBJETO: 'FORMATO CANTIDAD'}, 'ADM-011').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.CANTIDAD_FORMATO = res[0].FORMATO;
      });
    }

    if (obj == 'especificaciones' || obj == 'todos') {
      this._sdatos.consulta('ESPECIFICACIONES',
        {
          ID_APLICACION: this.prmUsrAplBarReg.aplicacion,
          USUARIO: this.prmUsrAplBarReg.usuario,
          ID_APLICACION_BASE: ''
        },
        'ADM-011')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.especAplicacion = res;
          this.valoresDefecto();

        });
    }

  }

  ngOnInit(): void {
    const user:any = localStorage.getItem('usuario');
    this.empresa = localStorage.getItem('empresa')??'';
    this.prmUsrAplBarReg = {
      tabla: 'PREFACTURA',
      aplicacion: 'VEN-230',
      usuario: user,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { }
    };

    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';
    this.readOnly = true;
    this.readOnlyUdp = true;
    this.rowNew = false;
    this._sdatos.accion = 'r_ini';
    
    // this.accordionExpand = [false,false,false];
    this.valoresObjetos('todos');
    this.opBlanquearForma();
  }

  ngOnDestroy(){
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

}
