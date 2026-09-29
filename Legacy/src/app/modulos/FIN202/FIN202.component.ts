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
import { clsRecaudoGravAux, clsRecaudos, clsRecaudosGrav, clsRecaudosPagos, clsAbonos } from './clsFIN202.class';
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
import { FIN20201Component } from './FIN20201/FIN20201.component';
import { FIN20202Component } from './FIN20202/FIN20202.component';

@Component({
  selector: 'app-FIN202',
  templateUrl: './FIN202.component.html',
  styleUrls: ['./FIN202.component.scss'],
    standalone: true,
    imports: [CommonModule, DxFormModule, DxSelectBoxModule, CdkAccordionModule, DxDropDownBoxModule,
              DxDataGridModule, DxDateBoxModule, DxTextBoxModule, DxNumberBoxModule, DxLoadPanelModule,
              DxButtonModule, VistarapidaComponent, VisorrepComponent, 
              XcComboGridComponent, DxCheckBoxModule, DocelecComponent, GeninformesComponent,
              FIN20201Component, FIN20202Component
            ]
})
export class FIN202Component {
  @ViewChild('formRecaudoBasico', { static: false }) formRecaudo: DxFormComponent;
  @ViewChild('formRecaudoAdicional', { static: false }) formRecaudoAdicional: DxFormComponent;
  @ViewChild("griDRecaudoAbonos", { static: false }) griDRecaudoAbonos: DxDataGridComponent;
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
  readOnlyADC: boolean = true;
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
  sbTipoPago: string;
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
  ID_APLICACION: any = 'FIN-202';
  stylingMode = 'filled';
  dropDownOptions = { width: 700, height: 400, hideOnParentScroll: true, container: '#router-container'};
  dropDownOptionsListBox = { hideOnParentScroll: true, container: '#router-container' };
  dSBEstados = ["REGISTRADO","ANULADO","COMPLETADO","EN PROCESO"];
  items = ['Datos del Cliente','Datos de la Transacción','Datos de la Venta'];
  accordionExpand: any;
  popupVisibleCuotas: boolean = false;

  //Notificaciones
  toaVisible: boolean;
  toaMessage: string = 'Registro actualizado!';
  toaTipo: string = 'success';
  loadingVisible: boolean = false;

  //Variables de datos
  DRecaudo: clsRecaudos;
  DRecaudoPagos: clsRecaudosPagos[] = [];
  DRecaudoAbonos: clsAbonos[] = [];
  DRecaudoGrav: clsRecaudosGrav[] = [];
  DRecaudoGravAux: clsRecaudoGravAux[] = [];
  DAbonos: clsAbonos[] = [];
  DItemsAux:any = [];
  DTiposPago: any;
  DRecaudo_prev: any;
  DRecaudoAbonos_prev: any;
  DRecaudoGrav_prev: any;
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
  
  
  // Especificaciones y valores defecto
  especAplicacion: any;
  especMonedaFormato: string = "#,##0.00";
  especCantidadFormato: string = "#,##0.00";
  especModificarPrecio: boolean = true;
  especModificarGrav: boolean = true;
  especRepetirItem: boolean = true;
  especOrigenPrecio: string = '';
  
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
  eventsSubjectAbonos: Subject<any> = new Subject<any>();
  eventsSubjectPagos: Subject<any> = new Subject<any>();

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
    this.onRespuestaAbonos = this.onRespuestaAbonos.bind(this);
    this.onRespuestaPagos = this.onRespuestaPagos.bind(this);

  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes
    this._sdatos.accion = operMenu.accion;
    switch (operMenu.accion){
      case 'r_ini':
        const user:any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'RECAUDOS',
          aplicacion: 'FIN-202',
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
            this.DRecaudo = JSON.parse(JSON.stringify(this.DRecaudo_prev));
            this.DRecaudoAbonos = JSON.parse(JSON.stringify(this.DRecaudoAbonos_prev));
            this.DRecaudoGrav = JSON.parse(JSON.stringify(this.DRecaudoGrav_prev));
            // this.DRecaudoGravAux = this.DRecaudoGrav.filter(e => e.APLICACION === 1);
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
                                   : " RECAUDOS.ID_DOCUMENTO = '"+this.DRecaudo.ID_DOCUMENTO+"' AND RECAUDOS.CONSECUTIVO = "+this.DRecaudo.CONSECUTIVO, 
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
                        nombre: this.DRecaudo.NOMBRE_CLIENTE,
                        email: this.DClientes.find(e => e.ID_CLIENTE === this.DRecaudo.ID_CLIENTE)?.EMAIL ?? '' ,
                        template,
                        replacements: '',
                        dataSource: this.DRecaudo
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
    this.readOnlyADC = false;
    this.esEdicion = true;
    this.esCreacion = false;
    this.iniEdicion = true;
    
    var now = new Date();
    this.DRecaudo = {
      ID_UN: '',
      ID_UN_RECAUDO: '',
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
      ID_ADC: localStorage.getItem('usuario') ?? '',
      DESCRIPCION: '',
      ID_DOC_SOPORTE: '',
      NC_DOC_SOPORTE: 0,
      FECHA_AUTORIZACION: '',
      USUARIO: this.prmUsrAplBarReg.usuario,
      ESTADO: 'REGISTRADO',
      FECHA_OC: '',
      ID_UBICACION: '',
      DIRECCION: '',
      TOTAL: 0,
      SALDO: 0,
      TIPO_PAGO: ''
    };
    this.DRecaudoAbonos = [];
    this.DRecaudoGravAux = [];
    this.DRecaudoPagos = [];
    this.DRecaudoGrav = [];
    this.GridSubTotales = [{key: 'Subtotal', value: 0},{key: 'Descuentos', value: 0},{key: 'Anticipos', value: 0}];
    this.gridBoxCliente = [];
    if (this.UN_DEF != null)
      this.gridBoxUN = [this.UN_DEF];
      this.DRecaudo.ID_UN_RECAUDO = this.UN_DEF;
    this.gridBoxCondicion = [];
    this.gridBoxADC = [];
    this.sbDocumento = '';
    this.sbTipoPago   = '';
    this.sbPlazo = 0;
    this._sdatos.ID_DOCUMENTO = '';
    this._sdatos.CONSECUTIVO = '';
    this._sdatos.ID_DOCUMENTO_prev = '';
    this._sdatos.CONSECUTIVO_prev = '';
    this.DRecaudo_prev = JSON.parse(JSON.stringify(this.DRecaudo));
    this.DRecaudoAbonos_prev = JSON.parse(JSON.stringify(this.DRecaudoAbonos));
    this.DRecaudoGrav_prev = JSON.parse(JSON.stringify(this.DRecaudoGrav));
    this.TOT_GRAV = 0;
    this.TOT_ANTICIPOS = 0; 
    this.esVisibleCartera = false;
    this.visibleColSoporte = false; 

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
      (JSON.stringify({ RECAUDOS: this.DRecaudo, 
                        ABONOS: this.DRecaudoAbonos, 
                        RECAUDO_GRAV: this.DRecaudoGrav,
                        RECAUDO_GRAV_AUX: this.DRecaudoGravAux,
                        RECAUDOS_PAGOS: this.DRecaudoPagos,
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
        this.readOnlyADC = true;
        this.esEdicion = false;
        this.esCreacion = false;
        this.esVisibleSelecc = 'none';
        
        // Operaciones de barra
        if (this.mnuAccion === 'new'){
          this.QFiltro = " RECAUDOS.ID_DOCUMENTO = '" + this.DRecaudo.ID_DOCUMENTO + "' AND " +
            " RECAUDOS.CONSECUTIVO = " + this.DRecaudo.CONSECUTIVO
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
        this.DRecaudo.DOCUMENTO = res[0].DOCUMENTO;
        this.DRecaudo.DOCUMENTO_FAC = res[0].DOCUMENTO;
        this.VDatosReg = [this.DRecaudo];
        this.sbDocumento = res[0].DOCUMENTO;
        // this.VDatosReg[0]["RECAUDO_GRAV"] = this.DRecaudoGrav;
        this.VDatosReg[0]["RECAUDOS_PAGOS"] = this.DRecaudoPagos;
        this.TOT_ANTICIPOS = this.DRecaudoPagos.reduce((sum: any, item: any) => sum + item.TOTAL, 0);
        // this.opIrARegistro('r_primero');
        showToast('Registro actualizado', 'success');
        this.mnuAccion = '';

        // Inactiva cambios
      }
    });
  }

  opPrepararBuscar(accion): void {
    if (accion === 'filtro'){
      this._sfiltro.PrmFiltro = {
        Titulo: 'Datos de filtro para RECAUDOS',
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
      const prm = { RECAUDOS: arrFiltro };

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
            this.DRecaudo = datares[0];
            this.DRecaudoAbonos = datares[0].ABONOS;
            this.DRecaudoPagos = datares[0].RECAUDOS_PAGOS;
            this.QFiltro = datares[0].QFILTRO;
            // this.TOT_ANTICIPOS = this.DRecaudoPagos.reduce((sum: any, item: any) => sum + item.TOTAL, 0);

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
              tabla: 'RECAUDOS',
              aplicacion: 'FIN-202',
              usuario: user,
              accion: 'r_ini',
              error: '',
              r_numReg: 0,
              r_totReg: 0,
              operacion: { r_modificar: false }
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
        'Desea anular el Recaudo <i>' +
        this.DRecaudo.ID_DOCUMENTO +
        '-' +
        this.DRecaudo.CONSECUTIVO +
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
        this.DRecaudo = JSON.parse(JSON.stringify(this.VDatosReg[0]));
        this.DRecaudoAbonos = this.VDatosReg[0].ABONOS;
        this.DRecaudoPagos = this.VDatosReg[0].RECAUDOS_PAGOS;
        this.prmUsrAplBarReg.r_numReg = 1;
        if(this.VDatosReg.length != 0){
          this.DRecaudo = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }else{
          showToast('No se encontraron Datos', 'error');
          this.readOnly = true;
          this.readOnlyUdp = true;
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.DRecaudo = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DRecaudoAbonos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ABONOS;
        this.DRecaudoPagos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].RECAUDOS_PAGOS;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length ? this.VDatosReg.length : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DRecaudo = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1]));
        this.DRecaudoAbonos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1].ABONOS;
        this.DRecaudoPagos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1].RECAUDOS_PAGOS;
        break;
      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DRecaudo = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DRecaudoAbonos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ABONOS;
        this.DRecaudoPagos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].RECAUDOS_PAGOS;
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
          this.DRecaudo = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this.DRecaudoAbonos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ABONOS;
          this.DRecaudoPagos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].RECAUDOS_PAGOS;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearForma();
          this.resetValidaciones();
          setTimeout(() => {
            this.formRecaudo.instance.resetValues();
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
        if (this.VDatosReg.length > 0){
          this.DRecaudo = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
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
      this.DRecaudo.DOCUMENTO = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].DOCUMENTO_REC;
      this.DRecaudo.DOCUMENTO_FAC = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].DOCUMENTO_REC;
      this.sbDocumento = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].DOCUMENTO_REC;
      this.loadDataToVariables();
      this._sdatos.accion = 'r_numreg';
      this.readOnly = true;

      // Totales OC
      // this.activarCustomValueSbox(true);
      this.valoresDefecto();

      // Por esoecificacion defecto, no se permite modificar
      if (this.DRecaudo.ESTADO === 'ANULADO')
        this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: false, r_eliminar: false } };
      else
        this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: false, r_eliminar: true } };
      this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

      // Consulta los otros datos: items, gravamenes, adicionales
      // const prm = { ID_DOCUMENTO: this.DRecaudo.ID_DOCUMENTO, CONSECUTIVO: this.DRecaudo.CONSECUTIVO };
      // this._sdatos
      //   .consulta('consulta adicionales', prm, this.prmUsrAplBarReg.aplicacion)
      //   .subscribe((data: any) => {
      //     const res = JSON.parse(data.data);
      //     if ((data.token != undefined)) {
      //       const refreshToken = data.token;
      //       localStorage.setItem("token", refreshToken);
      //     }
      //     if (res[0].ErrMensaje !== '') {
      //       this.showModal(res[0].ErrMensaje, 'error');
      //       return;
      //     }
      //     this.DRecaudoAbonos = res[0].ITM_RECAUDO;
      //     this.DRecaudoGravAux = res[0].RECAUDO_GRAV_AUX;
      //     this.TOT_GRAV = this.DRecaudoGrav.reduce((sum: any, item: any) => sum + item.VALOR, 0);
      //     this.calcularValores();
      //     this.visibleColSoporte = this.DRecaudoAbonos[0]?.FACTURA != "" ? true : false;
      //     this.readOnlyCond = true;
      //     this.readOnlyADC = true;

      //   });

    } catch (error) {
      this.showModal(error);
    }
    
  }

  opVista(): void {
    const VDatosRegAux = this.VDatosReg.map(({ID_DOCUMENTO,PREFIJO,CONSECUTIVO,SUFIJO,FECHA,ID_CLIENTE,TIPO_PAGO,ID_DOC_SOPORTE,ID_ADC,DESCRIPCION,USUARIO,ESTADO}) => ({ID_DOCUMENTO,PREFIJO,CONSECUTIVO,SUFIJO,FECHA,ID_CLIENTE,TIPO_PAGO,ID_DOC_SOPORTE,ID_ADC,DESCRIPCION,USUARIO,ESTADO}));
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(VDatosRegAux));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'RECAUDOS',
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
    this.DRecaudo = {
      ID_UN: '',
      ID_UN_RECAUDO: '',
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
      DESCRIPCION: '',
      ID_DOC_SOPORTE: '',
      NC_DOC_SOPORTE: 0,
      FECHA_AUTORIZACION: '',
      USUARIO: '',
      ESTADO: '',
      FECHA_OC: '',
      ID_UBICACION: '',
      DIRECCION: '',
      TOTAL: 0,
      SALDO: 0,
      TIPO_PAGO: ''
    };
    this.DRecaudoAbonos = [];
    this.DRecaudoGravAux = [];
    this.DRecaudoGrav = [];
    this.DRecaudoPagos = [];
    this.GridSubTotales = [{key: 'Subtotal', value: 0},{key: 'Descuentos', value: 0},{key: 'Anticipos', value: 0}];
    this.gridBoxCliente = [];
    if (this.UN_DEF !== null && this.UN_DEF !== undefined && this.UN_DEF !== '') {
      this.gridBoxUN = [];
      this.DRecaudo.ID_UN_RECAUDO = '';
    }
    this.gridBoxADC = [];
    this.sbDocumento = '';
    this.sbTipoPago = '';
    this.sbIdDireccion = '';
    this.sbPlazo = 0;
    this.TOT_GRAV = 0;
    this.esVisibleCartera = false;
    this._sdatos.ID_DOCUMENTO = '';
    this._sdatos.CONSECUTIVO = '';
    this._sdatos.ID_DOCUMENTO_prev = '';
    this._sdatos.CONSECUTIVO_prev = '';
    this.DRecaudo_prev = JSON.parse(JSON.stringify(this.DRecaudo));
    this.DRecaudoAbonos_prev = JSON.parse(JSON.stringify(this.DRecaudoAbonos));
    this.DRecaudoGrav_prev = JSON.parse(JSON.stringify(this.DRecaudoGrav));
  }

  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        this.gridBoxProducto = [];
        this.griDRecaudoAbonos.instance.addRow();
        this.rowApplyChanges = true;
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        break;
      case 'save':
        this.griDRecaudoAbonos.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        break;
      case 'cancel':
        this.griDRecaudoAbonos.instance.cancelEditData();
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
              const index = this.DRecaudoAbonos.findIndex(a => a.ITEM === key);
              this.DRecaudoAbonos.splice(index, 1);
            });
            this.griDRecaudoAbonos.instance.refresh();
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
    const prm = { RECAUDO: this.DRecaudo, 
                  ITEMS: prmItems,
                  ID_APLICACION: this.prmUsrAplBarReg.aplicacion,
                  USUARIO: this.prmUsrAplBarReg.usuario 
                };
    const apiRest = this._sdatos.consulta('actualizar cantidad', prm, "FIN-202");
    const res = await lastValueFrom(apiRest, {defaultValue: true});
    const datRes = JSON.parse(res.data);
    const ix = this.DRecaudoAbonos.findIndex(o => o.ITEM == currentRowData.ITEM);

    var rowIndex = this.griDRecaudoAbonos.instance.getRowIndexByKey(this.keyFila);  
    if (datRes[0].ErrMensaje !== "") {
      this.showModal(datRes[0].ErrMensaje, 'error');

      // Restablece cantidad
      // var rowIndex = this.gridMovimientosItems.instance.getRowIndexByKey(this.keyFila);  
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD", 0);
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD_REAL", 0);
      rowData.CANTIDAD = 0;
      if (ix !== -1) {
        this.DRecaudoAbonos[ix].VALOR_PAGADO = 0;
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
    var itemsgru:any = this.formRecaudo.instance.option('items');
    itemsgru.forEach((g) => {
      var items = g['items'];
      var index = items.findIndex((item) => item.dataField === e.dataField);
      if (index !== -1){
        var fNextEditor = this.formRecaudo.instance.getEditor(
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
    this.DRecaudo.DOCUMENTO = e.value;
    this.DRecaudo.DOCUMENTO_FAC = e.value;
    this.enableProductosItems();
    if(this._sdatos.accion == 'r_nuevo'){
      this.DRecaudo.ID_DOCUMENTO =  this.DDocumentos.find(p => p.DOCUMENTO === e.value).ID_DOCUMENTO;
      this.DRecaudo.CONSECUTIVO = this.DDocumentos.find(p => p.DOCUMENTO === e.value).CONSECUTIVO;
    }
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
      this.DRecaudo.ID_CLIENTE = e.selectedRowsData[0].ID_CLIENTE;
      this.DRecaudo.NOMBRE_CLIENTE = e.selectedRowsData[0].NOMBRE_COMPLETO;
      this.DRecaudo.ID_UBICACION = e.selectedRowsData[0].ID_UBICACION;
      this.DRecaudo.DIRECCION = e.selectedRowsData[0].DIRECCION;
      
      if(this._sdatos.accion != 'r_nuevo')
        this.loadDatos();

      this.isGridBoxCliOpened = false;
      this.valoresObjetos('direcciones');
      this.enableProductosItems();
    }
  }

  onSelectionADC(e) {
    if (e.name === 'value') {
      this.isGridBoxADCOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0){
      this.DRecaudo.ID_ADC = e.selectedRowsData[0].ID_ADC;
      this.valoresObjetos('condicion');
      this.isGridBoxADCOpened = false;
      this.enableProductosItems();
      if (this.DRecaudo.TIPO_PAGO != '')
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
      this.DRecaudo.ID_UN_RECAUDO = e.selectedRowsData[0].ID_UN;
      this.isGridBoxUNOpened = false;
      this.valoresObjetos('bodegas');
      this.enableProductosItems();
    }
  }

  onSeleccTipoPago(e: any){
    this.DRecaudo.TIPO_PAGO = e.value;
  }

  onSeleccDireccion(e: any){
    this.DRecaudo.DIRECCION = e.value;
  }

  onSeleccRowAtributo(e, cellInfo, datacompo) {
    if (e.data){
      cellInfo.data.ATRIBUTO = e.data.VALOR;
      this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "ATRIBUTO", cellInfo.data.ATRIBUTO);
      datacompo.close();
      this.isGridBoxAtrOpened = false;
    }
  }

  onSeleccRowCliente(e, cellInfo, datacompo) {
    if (e.data){
      cellInfo.data.ID_CLIENTE = e.data.ID_CLIENTE;
      this.DRecaudo.NOMBRE_CLIENTE = this.DClientes.find(p => p.ID_CLIENTE === cellInfo.data.ID_CLIENTE).NOMBRE_COMPLETO;
      this.isGridBoxCliOpened = false;
    }
  }

  async onSeleccRowProducto(e, cellInfo, datacompo) {
    // if (e.data){
    //   cellInfo.data.PRODUCTO = e.data.PRODUCTO;
    //   this.gridBoxProducto = [e.data.PRODUCTO];
    //   cellInfo.data.NOMBRE = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO).NOMBRE;
    //   this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "NOMBRE_PRODUCTO", cellInfo.data.NOMBRE);
    //   cellInfo.data.PERFIL_TRIBUTARIO = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO).PERFIL_TRIBUTARIO;
    //   this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "GRAVAMENES", cellInfo.data.PERFIL_TRIBUTARIO);
    //   cellInfo.data.VALOR_UNITARIO = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO).PRECIO;
    //   this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", cellInfo.data.VALOR_UNITARIO);
    //   cellInfo.data.PORC_IVA = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO).PORC_IVA;
    //   this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "PORC_IVA", cellInfo.data.PORC_IVA);
    //   datacompo.close();
    //   this.isGridBoxProdOpened = false;
    //   this.valoresObjetos('atributos');
    // }

    if (e.selectedRowKeys[0]){
      if ( !this.especRepetirItem && 
            this.DRecaudoAbonos.findIndex((d:any) => d.PRODUCTO === e.selectedRowKeys[0]) != -1 ) {
          showToast("Ya está registrado este producto!", 'wanning');
          return;
        }
        
      // Producto seleccionado
      const proSelecc = e.selectedRowKeys[0];

      //Valida si el producto esta asignado a la bodega de Destino y tiene existencias.
      const UN_DES:any = this.DRecaudo.ID_UN_RECAUDO;
      const prm:any = { PRODUCTO: proSelecc, 
                        PRESENTACION: 'SI', 
                        MOVIMIENTO: "RECAUDO",
                        TIPO: "RECAUDO" ,
                        TIPO_CONDICION: this.TIPO_CONDLISTA,
                        ID_CLIENTE: this.DRecaudo.ID_CLIENTE
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
        this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "NOMBRE_PRODUCTO", cellInfo.data.NOMBRE);
        // cellInfo.data.PERFIL_TRIBUTARIO = dnompro.PERFIL_TRIBUTARIO;
        // this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "GRAVAMENES", cellInfo.data.PERFIL_TRIBUTARIO);
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
            this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "UDM_VENTA", dpres[0].UDM_VENTA);
            // this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", dpres[0].CANTIDAD_PRES);
            this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", dpres[0].UDM_EQUIV);
            // this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", dpres[0].CANTIDAD_EQUIV);
            // this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", cellInfo.data.VALOR_UNITARIO);
            this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", dcanreal);
          } else {
            cellInfo.data.VALOR_UNITARIO = 0;
            this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "UDM_VENTA", "");
            // this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", "");
            this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", "");
            // this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", "");
            // this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", 0);
            this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", 0);
          }
        }
        this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "PORC_IVA", cellInfo.data.PORC_IVA);
        // this.valoresObjetos('atributos');
        setTimeout(() => {
          var rowIndex = cellInfo.component.getRowIndexByKey(cellInfo.key);
          // cellInfo.component.editCell(rowIndex, 'PRODUCTO');
          // e.component.focus();
          cellInfo.component.focus(this.griDRecaudoAbonos.instance.getCellElement(rowIndex, "PRODUCTO"));
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
        }
      }
    }

  }

  onValueChangedUMVenta(e, cellInfo) {
    cellInfo.setValue(e.value);
    const dum = this.DListaUMVenta.find((u: any) => u.UDM_COMPRA == e.value);
    if (this.DRecaudoAbonos.findIndex((d: any) => d.PRODUCTO === cellInfo.data.PRODUCTO && d.UDM_COMPRA === e.value) === -1) {
      if (dum) {
        cellInfo.data.UDM_COMPRA = dum.UDM_COMPRA;
        cellInfo.data.UDM_EQUIV = dum.UDM_EQUIV;
        cellInfo.data.CANTIDAD_EQUIV = dum.CANTIDAD_EQUIV;
        cellInfo.data.CANTIDAD_PRES = dum.CANTIDAD_PRES;
        cellInfo.data.VALOR_UNITARIO = dum.PRECIO;
        const dcanreal = dum.CANTIDAD_PRES * dum.CANTIDAD_EQUIV * cellInfo.data.CANTIDAD;
        cellInfo.data.CANTIDAD_REAL = dcanreal;
        this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "UDM_COMPRA", cellInfo.data.UDM_COMPRA);
        this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", cellInfo.data.UDM_EQUIV);
        this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", cellInfo.data.CANTIDAD_EQUIV);
        this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", cellInfo.data.CANTIDAD_PRES);
        this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", cellInfo.data.VALOR_UNITARIO);
        this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", cellInfo.data.CANTIDAD_REAL);
      }
    } else {
      cellInfo.data.UDM_COMPRA = '';
      cellInfo.data.UDM_EQUIV = '';
      cellInfo.data.CANTIDAD_EQUIV = '';
      cellInfo.data.CANTIDAD_PRES = '';
      cellInfo.data.VALOR_UNITARIO = 0;
      cellInfo.data.CANTIDAD_REAL = 0;
      this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "UDM_COMPRA", "");
      this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", "");
      this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", "");
      this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", "");
      this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", 0);
      this.griDRecaudoAbonos.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", 0);
      showToast('La Unidad de venta está repetida.', 'error');
    }
  }

  onSeleccTipoVenta(e){
    this.DRecaudo.TIPO_PAGO = e.value;
    this.DPlazos = this.DRecaudo.TIPO_PAGO != 'CREDITO' ? [{PLAZO: 0}] : this.DPlazos;
    if (this.DRecaudo.TIPO_PAGO == 'CREDITO')
      this.formRecaudoAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("disabled",false);
    else {
      this.formRecaudoAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("disabled",true);
      this.formRecaudoAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("value",this.DRecaudo.FECHA);
      this.formRecaudoAdicional.instance.getEditor("PLAZO")?.option("disabled",true);
      this.xs__PLAZO.instance.option("value", 0)
    }
    
    // Activa/Desactiva edición de condición
    this.valoresObjetos('condicion');
    if (this.DRecaudo.ID_ADC != '')
      this.readOnlyCond = false;
    else
      this.readOnlyCond = true;

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
    const prm = { RECAUDOS: {ID_DOCUMENTO: this.DRecaudo.ID_DOCUMENTO, PREFIJO: this.DRecaudo.PREFIJO, CONSECUTIVO: this.DRecaudo.CONSECUTIVO, SUFIJO: this.DRecaudo.SUFIJO} };
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
        showToast('Pedido eliminado', 'success');
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
    this.DRecaudo.TOTAL = this.DRecaudoAbonos.reduce((n, {VALOR_TOTAL}) => n + VALOR_TOTAL, 0);
    // this.TOT_GRAV = this.DRecaudoGravAux.reduce((n, {VALOR}) => n + VALOR, 0);
    this.DRecaudo.TOTAL = this.DRecaudo.TOTAL - this.TOT_ANTICIPOS + this.TOT_GRAV;
    //Aqui se construye la grid de Subtotales
    const totAbonos = this.DRecaudoAbonos.reduce((n, {VALOR_PAGADO}) => n + VALOR_PAGADO, 0);
    const totIntMora = this.DRecaudoAbonos.reduce((n, {VALOR_INTERESES}) => n + VALOR_INTERESES, 0);  
    const totDescuentos = this.DRecaudoAbonos.reduce((n, {VALOR_DESCUENTO}) => n + VALOR_DESCUENTO, 0);
    const totCapital = this.DRecaudoAbonos.reduce((n, {CAPITAL}) => n + CAPITAL, 0);
    const totIntereses = this.DRecaudoAbonos.reduce((n, {INTERESES}) => n + INTERESES, 0);
    const totPagado = this.DRecaudoPagos.reduce((n, {VALOR_PAGO}) => n + VALOR_PAGO, 0);
    this.GridSubTotales = [{key: 'Abonos', value: totAbonos},
                           {key: 'Int x Mora', value: totIntMora},
                           {key: 'Descuentos', value: totDescuentos},
                           {key: 'Capital', value: totCapital},
                           {key: 'Intereses', value: totIntereses},
                           {key: 'Pagado', value: -totPagado}];
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
    return args.date < (this.DRecaudo == null || this.DRecaudo.FECHA == null ? today : this.DRecaudo.FECHA) ;
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

  // Activa items de la grid
  enableProductosItems(){
    if(this.DRecaudo.DOCUMENTO == '' || 
      this.DRecaudo.ID_CLIENTE == '' || 
      this.DRecaudo.FECHA == '' || 
      this.DRecaudo.ID_UN_RECAUDO == '' || 
      this.DRecaudo.ID_ADC == ''
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
      e.data.ID_UN_RECAUDO = '';
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
      if (this.DRecaudoAbonos.length > 0) {
        const item = this.DRecaudoAbonos.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
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
  }

  loadDataToVariables(){
    this.gridBoxCliente = [this.DRecaudo.ID_CLIENTE];
    this.gridBoxUN = [this.DRecaudo.ID_UN_RECAUDO];
    this.gridBoxADC = [this.DRecaudo.ID_ADC];
    this.sbDocumento = this.DRecaudo.DOCUMENTO;
    this.sbTipoPago = this.DRecaudo.TIPO_PAGO;
    this.sbIdDireccion = this.DRecaudo.DIRECCION;
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
    //this.formRecaudo.instance.resetValues();
  }

  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  setValoresCartera(){
    // this.DRecaudo.VALOR_CUOTA = (this.DRecaudo.TOTAL - this.DRecaudo.CUOTA_INICIAL) / this.DRecaudo.PLAZO
  }

  setDocumentoToDatatable(){
    this.DDocumentos = [];
    this.DDocumentos.push({ID_DOCUMENTO: this.DRecaudo.ID_DOCUMENTO, CONSECUTIVO: this.DRecaudo.CONSECUTIVO, DOCUMENTO: this.DRecaudo.ID_DOCUMENTO+'-'+this.DRecaudo.CONSECUTIVO});
  }

  setDItemsAux(){
    this.DItemsAux = this.DRecaudoAbonos;
    for(const item of this.DItemsAux){
      item.APLICACION = 2
    }
  }

  setDRecaudoAbonosValues(data){
    for(const item of data){
      for(const DItem of this.DRecaudoAbonos){
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
      this.especMonedaFormato = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'FORMATO MONEDA')?.FORMATO ?? '#,##0.00';
      this.especCantidadFormato = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'FORMATO CANTIDAD')?.FORMATO ?? '#,##0.00';
      this.especModificarPrecio = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'MODIFICAR PRECIO')?.ACTIVADO ?? false;
      this.especModificarGrav = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'MODIFICAR GRAVAMENES')?.ACTIVADO ?? false;
      this.especRepetirItem = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'REPETIR ITEM')?.ACTIVADO ?? false;
      this.especOrigenPrecio = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'MODIFICAR PRECIO')?.VALOR_DEFECTO ?? '';
    }
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
                      RECAUDO: this.DRecaudo,
                      ITM_RECAUDO: this.DRecaudoAbonos,
                      RECAUDO_PAGOS: this.DRecaudoPagos,
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
        const itemsSelecc = this.DRecaudoPagos.map(({ ITEM }) => ({ ITEM }));
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
        const datRecaudo = {
          DOCUMENTO: this.DRecaudo.DOCUMENTO,
          ID_DOCUMENTO: this.DRecaudo.ID_DOCUMENTO,
          NC_DOCUMENTO: this.DRecaudo.CONSECUTIVO.toString(),
          FECHA: this.DRecaudo.FECHA,
          CLIENTE: this.DRecaudo.ID_CLIENTE +' '+ this.DRecaudo.NOMBRE_CLIENTE,
          ID_CLIENTE: this.DRecaudo.ID_CLIENTE,
          TIPO_PAGO: this.DRecaudo.TIPO_PAGO,
          TOTAL: this.DRecaudo.TOTAL
        }

        switch (res[0].titulo) {
          case "Obligaciones a pagar":
            this.eventsSubjectAbonos.next({ 
              dataRecaudo: datRecaudo,
              dataSource: res[0].dataSource,
              dataSelecc: this.DRecaudoAbonos
            });
            break;

          case "Medios de pago":
            this.eventsSubjectPagos.next({ 
              dataRecaudo: datRecaudo,
              dataSource: res[0].dataSource,
              dataSelecc: this.DRecaudoPagos
            });
            break;

          default:
            break;
        }
        break;
    }

  }

  // Recibe los datos seleccionados en settings
  async onRespuestaSettings(e: any) {
    // Solo se procesa si es en modo edición
    if (this.mnuAccion != "new" && this.mnuAccion != "update") return;

    if (e.titulo == 'Obligaciones a abonar') {
      // Total seleccionado
      const total = e.rowsSelected.reduce((acc, item) => acc + item.VALOR, 0);
      if (total > this.DRecaudo.TOTAL + this.TOT_GRAV) {
        this.showModal('El valor total de las obligaciones a abonar no puede ser mayor al valor total de la recaudos.');
        return;
      } 
      this.TOT_ANTICIPOS = total;
      this.DRecaudoPagos = e.rowsSelected;
      this.calcularValores();
    }

    if (e.titulo == 'Obligaciones a pagar' || e.titulo == 'Cargar Solicitud') {
      // Total seleccionado
      const prm:any = { ACCION: e.titulo, 
                        ID_APLICACION: this.prmUsrAplBarReg.aplicacion, 
                        USUARIO: this.prmUsrAplBarReg.usuario,
                        RECAUDO: this.DRecaudo,
                        ITM_RECAUDO: this.DRecaudoAbonos,
                        RECAUDO_PAGOS: this.DRecaudoPagos,
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
      this.DRecaudoAbonos = res[0].ITM_RECAUDO;
      // Gravamenes asociados 
      // this.DRecaudoGrav = res[0].DATA_GRAV[0].ENCAB ? res[0].DATA_GRAV[0].ENCAB : [];
      // this.DRecaudoGravAux = res[0].DATA_GRAV[0].ITEMS ? res[0].DATA_GRAV[0].ITEMS : [];
      // this.TOT_GRAV = this.DRecaudoGrav.reduce((sum: any, item: any) => sum + item.VALOR, 0);
      this.calcularValores();
      this.visibleColSoporte = true;

      // Valida si hay grid de subtotales
      if (res[0].GRID_TOTALES) {
        this.GridSubTotales = res[0].GRID_TOTALES;
      }
      // Valida si hay encabezado
      if (res[0].RECAUDO) {
        this.DRecaudo.TIPO_PAGO = res[0].RECAUDO.TIPO_PAGO;
        // this.DRecaudo.ID_ADC = res[0].RECAUDO.ID_ADC;
        // this.DRecaudo.ID_UN_RECAUDO = res[0].RECAUDO.ID_UN_RECAUDO;
        this.DRecaudo.TOTAL = res[0].RECAUDO.TOTAL;
        this.gridBoxADC = [this.DRecaudo.ID_ADC];
        this.readOnlyCond = true;
        // this.readOnlyADC = true;
      }

      // Deshabilita edición de datos generales
      if (this.DRecaudoAbonos.length > 0)
        this.readOnly = true;
      else
        this.readOnly = false;

    }

  }

  onRespuestaDocelec(e) {
  }

  // Recibe los datos seleccionados en el componente de abonos
  onRespuestaAbonos(e) {
    if (e.length > 0) {
      this.DRecaudoAbonos = e;
      this.DRecaudoAbonos.forEach((item: any) => {
        item.VALOR_TOTAL = item.VALOR_PAGADO + item.VALOR_INTERESES - item.VALOR_DESCUENTO;
      });
      this.calcularValores();
    }
  }

  // Recibe los datos seleccionados en el componente de pagos
  onRespuestaPagos(e) {
    if (e.length > 0) {
      this.DRecaudoPagos = e;
      this.calcularValores();
    }
  }

  ValidaDatos(Accion: string): boolean {
    var msg = '';
    if (Accion === "requerido"){
      if (this.DRecaudo.DOCUMENTO == "" || 
          this.DRecaudo.FECHA == null || 
          this.DRecaudo.ID_CLIENTE == "" || 
          this.DRecaudo.ID_UN_RECAUDO == '' || 
          this.DRecaudo.ID_ADC == "" || this.DRecaudo.TIPO_PAGO == ""){
        if(this.DRecaudo.DOCUMENTO == '') msg += 'Documento ,';
        if(this.DRecaudo.FECHA == null) msg += 'Fecha ,';
        if(this.DRecaudo.ID_CLIENTE == '') msg += 'Cliente ,';
        if(this.DRecaudo.ID_UN_RECAUDO == '') msg += 'Unidad de Negocio ,';
        if(this.DRecaudo.ID_ADC == '') msg += 'Vendedor ,';
        if(this.DRecaudo.TIPO_PAGO == '') msg += 'Tipo de Venta ,';
        this.showModal('Error al guardar',"Faltan datos","Hay datos incompletos del Recaudo. Revisar contenido de los items: "+msg.slice(0, -1));
        return false;
      }
      if(this.DRecaudoAbonos === undefined || this.DRecaudoAbonos.length == 0){
        this.showModal('Error al guardar',"Faltan datos","No se ha asociado ningún Producto al Recaudo");
        return false;
      }
    }
    return true;
  }

  valoresObjetos(obj: string, opcion: any = undefined) {
    if (obj === 'documento' || obj === 'ref') {
      const prm = { ID_APLICACION : 'FIN-202', 
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
            this.DRecaudo.DOCUMENTO = this.DDocumentos[0].DOCUMENTO;
            this.DRecaudo.ID_DOCUMENTO = this.DDocumentos[0].ID_DOCUMENTO;
            this.DRecaudo.CONSECUTIVO = this.DDocumentos[0].CONSECUTIVO;
          }
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

    // if (obj === 'listasprecios' || obj === 'todos' || obj === 'ref') {
    //   const prm = { FILTRO: 'recaudos' };
    //   this._sdatos.consulta('LISTAS PRECIOS',prm,'VEN-002').subscribe((data: any) => {
    //     const res = JSON.parse(data.data);
    //     if ( (data.token != undefined) ){
    //       const refreshToken = data.token;
    //       localStorage.setItem("token", refreshToken);
    //     }
    //     this.DListasPrecios = res;
    //   });
    // }

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

    if (obj === 'gravamenes' || obj === 'ref'){
      var prm = {};
      if (opcion !== 'original')
        prm = { RECAUDO: this.DRecaudo, 
                ITEMS: this.DRecaudoAbonos, APL_GRAV: opcion};
      else
        prm = { RECAUDO: this.DRecaudo, 
                ITEMS: this.DRecaudoAbonos, OPCION_GRAV: opcion};
      this._sdatos
        .consulta('GRAVAMENES', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          // this.DRecaudoGrav = res.ITEMSGRAV;
          // if(this.DRecaudoGrav !== undefined && this.DRecaudoGrav.length > 0){
          //   this.DRecaudoGravAux = this.DRecaudoGrav.filter(e => e.APLICACION === 1);
          //   this.TOT_GRAV = this.DRecaudoGravAux.reduce((n, {VALOR}) => n + VALOR, 0);
          // }else{
          //   this.DRecaudoGravAux = [];
          // }
          this.DRecaudoGrav = res[0].ENCAB ? res[0].ENCAB : [];
          this.DRecaudoGravAux = res[0].ITEMS ? res[0].ITEMS : [];
          this.TOT_GRAV = this.DRecaudoGrav.reduce((sum: any, item: any) => sum + item.VALOR, 0);
          this.calcularValores();
          // this.setDRecaudoAbonosValues(res.ITEMS);

          // Aplica a los items
          if (opcion !== undefined) {
            this.DRecaudoAbonos.forEach(item => {
              const nx = this.DRecaudoGravAux.findIndex(gi => gi.ITEM == item.ITEM);
              if (nx > -1) {
                // item.VALOR_IVA = this.DRecaudoGravAux[nx].VALOR_IVA;
                // item.SUB_TOTAL = this.DRecaudoGravAux[nx].SUB_TOTAL;
                // item.TOTAL = this.DRecaudoGravAux[nx].TOTAL;
                // item.GRAVAMENES = this.DRecaudoGravAux[nx].GRAV_TOTAL;
                // item.GRAV_TOTAL = this.DRecaudoGravAux[nx].GRAV_TOTAL;
              }
            });
          }

        });
    }

    if (obj === 'direcciones' || obj === 'ref') {
      this._sdatos.consulta('DIRECCIONES CLIENTE',{ID_CLIENTE: this.DRecaudo.ID_CLIENTE},'VEN-001').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DDirecciones = res;
        if (this.DDirecciones.length == 1 ){
          this.DRecaudo.DIRECCION = this.DDirecciones[0].DIRECCION;
          this.sbIdDireccion = this.DRecaudo.DIRECCION;
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

    if (obj === 'tipo pago' || obj === 'todos' || obj === 'ref'){
      const prm = {ID_DOMINIO: 'RECAUDOS', ID_GRUPO_DOMINIO: 'CONCEPTOS DE RECAUDOS'};
      this._sdatos
        .consulta('ITM_DOMINIOS', prm, 'ADM012')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DTiposPago = res;
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

    if (obj === 'condicion' || obj === 'ref') {
      this._sdatos.consulta('CONDICIONES LISTAS',
                             {ID_ADC: this.DRecaudo.ID_ADC, 
                              TIPO_PAGO: this.DRecaudo.TIPO_PAGO, 
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
          this.DRecaudo.ID_UN_RECAUDO = this.UN_DEF;
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
  }

  ngOnInit(): void {
    const user:any = localStorage.getItem('usuario');
    this.empresa = localStorage.getItem('empresa')??'';
    this.prmUsrAplBarReg = {
      tabla: 'RECAUDOS',
      aplicacion: 'FIN-202',
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
