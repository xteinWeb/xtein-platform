import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { showToast } from '../../shared/toast/toastComponent.js';
import { clsCotizacion, clsCotizacionGrav, clsCotizacionItems } from './clsVEN208.class';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { VEN208Service } from 'src/app/services/VEN208/VEN208.service';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import Swal from 'sweetalert2';
import { Subject, Subscription } from 'rxjs';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, 
        DxDropDownBoxModule, DxFormComponent, DxFormModule, DxLoadPanelModule, 
        DxNumberBoxModule, DxSelectBoxModule, DxTextBoxModule 
      } from 'devextreme-angular';
import { COM20001Component } from '../COM200/COM20001/COM20001.component';

@Component({
  selector: 'app-VEN208',
  templateUrl: './VEN208.component.html',
  styleUrls: ['./VEN208.component.css'],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxSelectBoxModule, CdkAccordionModule, DxDropDownBoxModule,
            DxDataGridModule, DxDateBoxModule, DxTextBoxModule, DxNumberBoxModule, DxLoadPanelModule,
            DxButtonModule, VistarapidaComponent, COM20001Component
          ]
})
export class VEN208Component {

  @ViewChild('formCotizacion', { static: false }) formCotizacion: DxFormComponent;
  @ViewChild("gridCotizacionItems", { static: false }) gridCotizacionItems: DxDataGridComponent;

  
  //Variables fijas de la Aplicación
  subscription: Subscription;
  subscriptionCotizacion: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  eventsSubjectIvas: Subject<any> = new Subject<any>();
  subs_filtro: Subscription;
  subs_visor: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  VDatosReg: any;
  QFiltro: any;
  readOnly: boolean;
  readOnlyUdp: boolean;
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
  visibleIvas: boolean = false;
  esEdicion: boolean = false;
  esCreacion: boolean = false;
  iniEdicion: boolean = false;
  esVisibleCartera: boolean = true;
  conCambios: number = 0;
  TOT_GRAV: number;
  focusedRowIndex: number;
  focusedRowKey: string;
  type: string;
  UN_DEF: string;
  MONEDA_DEF: string;
  TIPO_CONDLISTA: string;
  CANTIDAD_FORMATO: string;
  ID_APLICACION: any = 'VEN-155';
  stylingMode = 'filled';
  dropDownOptions = { width: 700, height: 400, hideOnParentScroll: true, container: '#router-container'};
  dropDownOptionsListBox = { hideOnParentScroll: true, container: '#router-container' };
  dSBEstados = ["REGISTRADO","ANULADO","COMPLETADO","EN PROCESO"];
  items = ['Datos del Cliente','Datos de la Transacción','Datos de la Venta'];
  accordionExpand: any;
  noDataTextProducto: any = '';

  //Notificaciones
  toaVisible: boolean;
  toaMessage: string = 'Registro actualizado!';
  toaTipo: string = 'success';
  loadingVisible: boolean = false;

  //Variables de datos
  DCotizacion: clsCotizacion;
  DCotizacionItems: clsCotizacionItems[] = [];
  DCotizacionGrav: clsCotizacionGrav[] = [];
  DCotizacionGravAux: clsCotizacionGrav[] = [];
  DItemsAux:any = [];
  DCotizacion_prev: any;
  DCotizacionItems_prev: any;
  DCotizacionGrav_prev: any;
  DProductos: any;
  DClientes: any;
  DDocumentos: any;
  DUnidadMedida: any;
  DTiposCotizacion: any;
  DListasPrecios: any;
  DADC: any;
  DAtributos: any;
  DDirecciones: any;
  DUnidadesNegocios: any;
  DMonedas: any;
  DCondicionLista: any;
  DPlazos: any;
  DMonedaDef: any;
  especAplicacion: any;
  keyFila: any;
  keyIva: number = 0;
  
  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esVisibleSelecc: string = 'none';
  USUARIO_LOCAL: any = '';
  // Especirficaciones y valores defecto
  especMonedaFormato: string = "#,##0.00";
  especCantidadFormato: string = "#,##0.00";
  especModificarPrecio: boolean = true;
  especModificarGrav: boolean = true;
  especRepetirItem: boolean = true; 
  especOrigenPrecio: string = ''; 
  especEmailCompras: string = ''; 
  especUsuarioEmail: string = ''; 
  especModoEnvioEmail: string = ''; 
  especModificarOrden: boolean = false; 

  constructor(
    private _sdatos: VEN208Service,
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

    // Servicio comunicacion entre pestañas
    this.subscriptionCotizacion = this._sdatos
    .getObs_Cotizacion()
    .subscribe((datreg) => {
      // Ejecuta de acuerdo al componente hijo
      switch (datreg.componente){
        case 'atributos':
          break;

        default:
          break;
      }
    });

    this.onSeleccRowProducto = this.onSeleccRowProducto.bind(this);
    this.onChangeCantidad = this.onChangeCantidad.bind(this);
    this.calcularValores = this.calcularValores.bind(this);
    this.onSeleccIvas = this.onSeleccIvas.bind(this);
  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'COTIZACION',
      aplicacion: 'VEN-208',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_modificar: true }
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.DCotizacion = {
      ID_UN: '',
      ID_UN_ITEM: '',
      ID_DOCUMENTO: '',
      NOMBRE_DOCUMENTO: '',
      PREFIJO: '',
      CONSECUTIVO: 0,
      SUFIJO: '',
      DOCUMENTO: '',
      FECHA_REGISTRO: '',
      FECHA: '',
      HORA: '',
      ID_CLIENTE: '',
      NOMBRE_CLIENTE: '',
      ID_ADC: '',
      ID_CONDICION: '',
      DESCRIPCION: '',
      ID_MONEDA: '',
      TASA_CAMBIO: 0,
      VIGENCIA: '',
      ID_DOC_SOPORTE: '',
      NC_DOC_SOPORTE: 0,
      CUOTA_INICIAL: 0,
      PLAZO: 0,
      CONDICIONES_GENERALES: '',
      SUB_TOTAL: 0,
      VALOR_DESCUENTO: 0,
      GRAVAMENES: '',
      VALOR_COSTOS: 0,
      TOTAL: 0,
      TIPO_COTIZACION: '',
      VALOR_CUOTA: 0,
      VALOR_PRIMER_CUOTA: 0,
      DIAS_CUOTA: 0,
      UM_DIAS_CUOTA: '',
      USUARIO: '',
      ESTADO: '',
      VALOR_FIN_COSTOS: 0,
      ID_UBICACION: '',
      DIRECCION: ''
    }
    this.mnuAccion = '';
    this.readOnly = true;
    this.readOnlyUdp = true;
    this.rowNew = false;
    this._sdatos.accion = 'r_ini';
    this.accordionExpand = [false,false,false];
    this.valoresObjetos('todos', '');
    this.opBlanquearForma();
  }

  ngOnDestroy(){
    this.subscription.unsubscribe();
    this.subscriptionCotizacion.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes
    this._sdatos.accion = operMenu.accion;
    switch (operMenu.accion){
      case 'r_ini':
        const user:any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'COTIZACION',
          aplicacion: 'VEN-208',
          usuario: this.USUARIO_LOCAL,
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
        if(this.DCotizacion.ESTADO === 'REGISTRADO') {
          this.mnuAccion = 'update';
          this.readOnly = false;
          this.readOnlyUdp = true;
          this.esVisibleSelecc = 'always';
          this.opPrepararModificar();
        } else {
          this.showModal('No puede modificar esta Cotización por su Estado: '+this.DCotizacion.ESTADO, 'Alerta');
        }
        break;

      case 'r_guardar':
        this.esVisibleSelecc = 'none';
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
				var mensaje = '¿Desea cancelar la operación?'; 
        const tipo = 'Error';
				if (this.conCambios != 0) mensaje = 'Desea cancelar sin guardar cambios?';
				Swal.fire({
					title: '',
					text: mensaje,
					iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: tipo==='Error' ? '#DF3E3E !important':'#0F4C81 !important',
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
            this.DCotizacion = JSON.parse(JSON.stringify(this.DCotizacion_prev));
            this.DCotizacionItems = JSON.parse(JSON.stringify(this.DCotizacionItems_prev));
            this.DCotizacionGrav = JSON.parse(JSON.stringify(this.DCotizacionGrav_prev));
            this.DCotizacionGravAux = this.DCotizacionGrav.filter(e => e.APLICACION === 1);
            this.opIrARegistro('r_numreg');

            // Restituye los valores
            this.mnuAccion = '';
          }
        });

        break;

      case 'r_vista':
        this.opVista();
        break;

      case 'r_copiar':
        Swal.fire({
          title: '',
          text: 'Se asignara un nuevo Documento.',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: false,
					confirmButtonColor: '#DF3E3E',
          confirmButtonText: 'Aceptar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.mnuAccion = "new";
            this.readOnly = false;
            this.DCotizacion.DOCUMENTO = '';
            this.opPrepararModificar();
            this.prmUsrAplBarReg.accion = 'r_nuevo';
            this.prmUsrAplBarReg.operacion = { r_configurar: true };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          }
        });
        break;

      case 'r_refrescar':
        this.valoresObjetos('ref', '');
        break;

      case 'r_imprimir':
        this.imprimirReporte(
          operMenu.operacion.id_reporte,
          operMenu.operacion.archivo,
          operMenu.operacion.data_rpt
        );
        break;

      case 'r_configurar':
        // this.operacionesSettings(operMenu.operacion.data_config.data.VALOR);
        break;

      default:
        break;
    }
  }

  opPrepararNuevo(): void {
    this.readOnly = false;
    this.readOnlyUdp = false;
    this.esEdicion = true;
    this.esCreacion = false;
    this.iniEdicion = true;
    
    var now = new Date();
    this.DCotizacion = {
      ID_UN: '',
      ID_UN_ITEM: '',
      ID_DOCUMENTO: '',
      NOMBRE_DOCUMENTO: '',
      PREFIJO: '',
      CONSECUTIVO: 0,
      SUFIJO: '',
      DOCUMENTO: '',
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
      DIAS_CUOTA: 0,
      UM_DIAS_CUOTA: '',
      TIPO_COTIZACION: '',
      USUARIO: this.prmUsrAplBarReg.usuario,
      ESTADO: 'REGISTRADO',
      VALOR_FIN_COSTOS: 0,
      ID_UBICACION: '',
      DIRECCION: ''
    };
    this.DCotizacionItems = [];
    this.DCotizacionGravAux = [];
    this.GridSubTotales = [{key: 'Subtotal', value: 0},{key: 'Descuentos', value: 0},{key: 'Otros', value: 0}];
    this.gridBoxCliente = [];
    if (this.UN_DEF !== null){
      this.gridBoxUN = [this.UN_DEF];
      this.DCotizacion.ID_UN_ITEM = this.UN_DEF;
    }
    if(this.MONEDA_DEF !== null) {
      this.gridBoxMoneda = [this.MONEDA_DEF];
      this.DCotizacion.ID_MONEDA = this.MONEDA_DEF;
    }
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
    this.DCotizacion_prev = JSON.parse(JSON.stringify(this.DCotizacion));
    this.DCotizacionItems_prev = JSON.parse(JSON.stringify(this.DCotizacionItems));
    this.DCotizacionGrav_prev = JSON.parse(JSON.stringify(this.DCotizacionGrav));
    this.TOT_GRAV = 0;
    this.esVisibleCartera = false;
    
    this.valoresObjetos('documento', '');
  }

  async opPrepararModificar(){
    this.readOnly = false;
    this.readOnlyUdp = true;
    this.esEdicion = true;
    this.esCreacion = false;
    this.iniEdicion = true;
    this.valoresObjetos('ref', '');
  }

  opPrepararGuardar(accion: string): void {
    // Acción validación de datos
    if (!this.ValidaDatos('requerido')){
      return;
    }

    const prmDatosGuardar = JSON.parse(
      (JSON.stringify({ 
        COTIZACION: this.DCotizacion, 
        ITM_COTIZACION: this.DCotizacionItems, 
        COTIZACION_GRAV: this.DCotizacionGrav
      })).replace(/}{/g,",")
    );

    // API guardado de datos
    var exito = false;
    this._sdatos
    .save(accion, prmDatosGuardar, this.prmUsrAplBarReg.aplicacion)
    .subscribe((resp) => {
      const res = JSON.parse(resp.data);
      if (res[0].ErrMensaje !== ""){
        this.showModal(res[0].ErrMensaje, 'error');
      } else {
        this.readOnly = true;
        this.readOnlyUdp = true;
        this.esEdicion = false;
        this.esCreacion = false;
        this.esVisibleSelecc = 'none';
        // Operaciones de barra
        if (this.mnuAccion === 'new'){
          this.QFiltro = "COTIZACION='"+this.DCotizacion.ID_DOCUMENTO+"'";
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

        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        showToast('Registro actualizado', 'success');

        // Inactiva cambios
        const objControl = ['__obj__ddAutorizaciones','__obj__ddPermisosEspeciales','__obj__ddUnidadNegocio','__obj__ddConexiones'];
        objControl.forEach(c => {
          this.cambiosItemForma({ dataField: c }, 'inactivar');
        })
      }
    });
  }

  opPrepararBuscar(accion): void {
    if (accion === 'filtro'){
      this._sfiltro.PrmFiltro = {
        Titulo: 'Datos de filtro para Cotizacion',
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
      const prm = { COTIZACION: arrFiltro };
      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this._sdatos
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          this.loadingVisible = false;
          this._sfiltro.enConsulta = false;
          const res = JSON.parse(data.data);
          if (data.token != undefined){
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje === ''){
            this.accordionExpand = [true,true,true];
            this.VDatosReg = datares;
            this.DCotizacion = datares[0];
            this.DCotizacionItems = datares[0].ITM_COTIZACION;
            this.DCotizacionGrav = datares[0].COTIZACION_GRAV;
            if(this.DCotizacionGrav != null)
              this.DCotizacionGravAux = this.DCotizacionGrav.filter(e => e.APLICACION === 1);
            this._sdatos.ID_DOCUMENTO = this.DCotizacion.ID_DOCUMENTO;
            this._sdatos.CONSECUTIVO = this.DCotizacion.CONSECUTIVO;
            this._sdatos.ID_DOCUMENTO_prev = this.DCotizacion.ID_DOCUMENTO;
            this._sdatos.CONSECUTIVO_prev = this.DCotizacion.CONSECUTIVO;
            this.QFiltro = datares[0].QFILTRO;
            this.loadManualDatatables();
            this.loadDatos();
            this.calcularValores();
            this.valoresObjetos('direcciones', '');
            this.valoresObjetos('ITM_DOMINIOS', '');
            // Prepara la barra para navegación
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              r_totReg: datares.length,
              r_numReg: 1,
              accion: 'r_navegar',
              operacion: {},
            };

          } else {
            this.VDatosReg = [];
            showToast(datares[0].ErrMensaje, 'warning');
            this.opBlanquearForma();
            // Prepara la barra para navegación
            const user:any = localStorage.getItem('usuario');
            this.prmUsrAplBarReg = {
              tabla: 'COTIZACION',
              aplicacion: 'VEN-208',
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
          
          
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

          // Trae los items en los componentes asociados
          this.opIrARegistro('r_primero');
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
        "Desea <b class='fw-bold'>Anular la Cortización</b> <i>" +
        "<b class='fw-bold'>"+this.DCotizacion.ID_DOCUMENTO +
        "-" +
        this.DCotizacion.CONSECUTIVO +
        "</b></i> ?",
      iconHtml: "<i class='icon-alert-ol'></i>",
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
        this.prmUsrAplBarReg.r_numReg = 1;
        if(this.VDatosReg.length != 0){
          this.DCotizacion = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this.DCotizacionItems = JSON.parse(JSON.stringify(this.VDatosReg[0].ITM_COTIZACION));
          this.DCotizacionGrav = JSON.parse(JSON.stringify(this.VDatosReg[0].COTIZACION_GRAV));
          this.DCotizacionGravAux = this.DCotizacionGrav != null ? this.DCotizacionGrav.filter(e => e.APLICACION === 1) : [];
          this.loadManualDatatables();
          this.loadDatos();
          this.calcularValores();
          this.valoresObjetos('direcciones', '');
          this.valoresObjetos('ITM_DOMINIOS', '');
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }else{
          showToast('No se encontraron Datos', 'error');
          this.readOnly = true;
          this.readOnlyUdp = true;
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.DCotizacion = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DCotizacionItems = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_COTIZACION));
        this.DCotizacionGrav = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].COTIZACION_GRAV));
        this.DCotizacionGravAux = this.DCotizacionGrav != null ? this.DCotizacionGrav.filter(e => e.APLICACION === 1) : [];
        this.loadManualDatatables();
        this.loadDatos();
        this.calcularValores();
        this.valoresObjetos('direcciones', '');
        this.valoresObjetos('ITM_DOMINIOS', '');
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length ? this.VDatosReg.length : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DCotizacion = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1]));
        this.DCotizacionItems = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1].ITM_COTIZACION));
        this.DCotizacionGrav = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].COTIZACION_GRAV));
        this.DCotizacionGravAux = this.DCotizacionGrav != null ? this.DCotizacionGrav.filter(e => e.APLICACION === 1) : [];
        this.loadManualDatatables();
        this.loadDatos();
        this.calcularValores();
        this.valoresObjetos('direcciones', '');
        this.valoresObjetos('ITM_DOMINIOS', '');
        break;
      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DCotizacion = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DCotizacionItems = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_COTIZACION));
        this.DCotizacionGrav = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].COTIZACION_GRAV));
        this.DCotizacionGravAux = this.DCotizacionGrav != null ? this.DCotizacionGrav.filter(e => e.APLICACION === 1) : [];
        this.calcularValores();
        this.loadManualDatatables();
        this.loadDatos();
        this.valoresObjetos('direcciones', '');
        this.valoresObjetos('ITM_DOMINIOS', '');
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
          this.DCotizacion = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this.DCotizacionItems = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_COTIZACION));
          this.DCotizacionGrav = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].COTIZACION_GRAV));
          this.DCotizacionGravAux = this.DCotizacionGrav != null ? this.DCotizacionGrav.filter(e => e.APLICACION === 1) : [];
          this.loadManualDatatables();
          this.calcularValores();
          this.loadDatos();
          this.valoresObjetos('direcciones', '');
          this.valoresObjetos('ITM_DOMINIOS', '');
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearForma();
          this.resetValidaciones();
          setTimeout(() => {
            this.formCotizacion.instance.resetValues();
          }, 100);
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
          this.DCotizacion = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
          this.DCotizacionItems = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_COTIZACION;
          this.DCotizacionGrav = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].COTIZACION_GRAV;
          if(this.DCotizacionGrav != null)
            this.DCotizacionGravAux = this.DCotizacionGrav.filter(e => e.APLICACION === 1);
          this.loadManualDatatables();
          this.loadDatos();
          this.calcularValores();
          this.valoresObjetos('direcciones', '');
          this.valoresObjetos('ITM_DOMINIOS', '');
        } else {
          this.opBlanquearForma();
        }
        break;
      default:
        break;
    }
  }

  opVista(): void {
    const VDatosRegAux = this.VDatosReg.map(({ID_DOCUMENTO,PREFIJO,CONSECUTIVO,SUFIJO,FECHA,ID_CLIENTE,TIPO_COTIZACION,ID_DOC_SOPORTE,ID_ADC,DESCRIPCION,USUARIO,ESTADO}) => ({ID_DOCUMENTO,PREFIJO,CONSECUTIVO,SUFIJO,FECHA,ID_CLIENTE,TIPO_COTIZACION,ID_DOC_SOPORTE,ID_ADC,DESCRIPCION,USUARIO,ESTADO}));
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(VDatosRegAux));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'Cotizacion',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: '',
      Filtro: '',
      keyGrid: ['ID_DOCUMENTO','CONSECUTIVO','PREFIJO','SUFIJO','CLIENTE','ADV/VENDEDOR','FECHA','ESTADO'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opBlanquearForma(): void {
    var now = new Date();
    this.DCotizacion = {
      ID_UN: '',
      ID_UN_ITEM: '',
      ID_DOCUMENTO: '',
      NOMBRE_DOCUMENTO: '',
      PREFIJO: '',
      CONSECUTIVO: 0,
      SUFIJO: '',
      DOCUMENTO: '',
      FECHA_REGISTRO: null,
      FECHA: null,
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
      DIAS_CUOTA: 0,
      UM_DIAS_CUOTA: '',
      TIPO_COTIZACION: '',
      USUARIO: this.prmUsrAplBarReg.usuario,
      ESTADO: '',
      VALOR_FIN_COSTOS: 0,
      ID_UBICACION: '',
      DIRECCION: ''
    };
    this.DCotizacionItems = [];
    this.DCotizacionGravAux = [];
    this.GridSubTotales = [{key: 'Subtotal', value: 0},{key: 'Descuentos', value: 0},{key: 'Otros', value: 0}];
    this.gridBoxCliente = [];
    if (this.UN_DEF !== null && this.UN_DEF !== undefined && this.UN_DEF !== '') {
      this.gridBoxUN = [];
      this.DCotizacion.ID_UN_ITEM = '';
    }
    if(this.MONEDA_DEF !== null && this.MONEDA_DEF !== undefined && this.MONEDA_DEF !== '') {
      this.gridBoxMoneda = [];
    }
    this.DCotizacion.ID_MONEDA = '';
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
    this.DCotizacion_prev = JSON.parse(JSON.stringify(this.DCotizacion));
    this.DCotizacionItems_prev = JSON.parse(JSON.stringify(this.DCotizacionItems));
    this.DCotizacionGrav_prev = JSON.parse(JSON.stringify(this.DCotizacionGrav));
  }

  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        this.gridBoxProducto = [];
        this.gridCotizacionItems.instance.addRow();
        this.rowApplyChanges = true;
        this.keyIva = 0;
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this.keyIva = 0;
        break;
      case 'save':
        this.gridCotizacionItems.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        break;
      case 'cancel':
        this.gridCotizacionItems.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.keyIva = 0;
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
              const index = this.DCotizacionItems.findIndex(a => a.ITEM === key);
              this.DCotizacionItems.splice(index, 1);
            });
            this.gridCotizacionItems.instance.refresh();
            this.conCambios++;
            this.keyIva = 0;
            this.setItemValues();
          }
        });
        break;

      default:
        break;
    }
  }

  onChangeCantidad(rowData: any, value: any, currentRowData: any){
    rowData.CANTIDAD = value;
    rowData.SUB_TOTAL = rowData.CANTIDAD * currentRowData.VALOR_UNITARIO;
    if ( this.keyIva === 0 && (currentRowData.PORC_IVA === 0 || currentRowData.PORC_IVA === undefined || currentRowData.PORC_IVA === null)) {
      rowData.PORC_IVA = this.DProductos.find((p:any) => p.PRODUCTO === rowData.PRODUCTO).PORC_IVA;
    } else {
      if (currentRowData.PORC_IVA !== 0 && currentRowData.PORC_IVA !== undefined && currentRowData.PORC_IVA !== null) {
        rowData.PORC_IVA = currentRowData.PORC_IVA;
      } else {
        rowData.PORC_IVA = this.keyIva;
      }
    }
    rowData.VAL_IVA = rowData.SUB_TOTAL * rowData.PORC_IVA
    rowData.TOTAL = rowData.SUB_TOTAL + rowData.VAL_IVA
  }

  onEditingStart(e:any) {
    this.gridBoxProducto = [e.data.PRODUCTO];
  }

  onValueChangedFechaEntrega(e:any) {
    this.DCotizacion.VIGENCIA = e.value;
  }

  onEditorEnterKey(e:any){
    e.event.preventDefault();
    var itemsgru:any = this.formCotizacion.instance.option('items');
    itemsgru.forEach((g) => {
      var items = g['items'];
      var index = items.findIndex((item) => item.dataField === e.dataField);
      if (index !== -1){
        var fNextEditor = this.formCotizacion.instance.getEditor(
          items[++index < items.length ? index : 0].dataField
        );
        if (fNextEditor) fNextEditor.focus();
        return;
      }
    });
  }

  onFocusedRowChanged(e:any){
    const rowData = e.row && e.row.data;
    if (rowData) {
      this.gridBoxProducto = [rowData.PRODUCTO]
      this.valoresObjetos('atributos', '');
    }
  }

  onFocusOutAtributos(e:any, cellInfo:any) {
    if (cellInfo.data){
      cellInfo.data.ATRIBUTO = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onFocusOutClientes(e:any, cellInfo:any) {
    if (cellInfo.data){
      cellInfo.data.ID_CLIENTE = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onFocusInProductos(e:any, cellInfo:any) {
    this.isGridBoxProdOpened = true;
  }

  onFocusOutProductos(e:any, cellInfo:any) {
    if (cellInfo.data){
      cellInfo.data.PRODUCTO = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onRowPrepared(e:any) {
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

  onRowValidating(e:any) {
    // Valida completitud
    if ((e.newData.PRODUCTO === '' || e.oldData.PRODUCTO === '') || (e.newData.CANTIDAD === 0)) {
      e.isValid = false;
      showToast('Faltan completar datos del Producto', 'warning');
      return;
    } else {
      e.isValid = true;
      this.keyIva = 0;
      return;
    }
  }

  onSeleccDocumento(e:any): void {
    this.sbDocumento = e.value;
    this.DCotizacion.DOCUMENTO = e.value;
    this.enableProductosItems();
    if(this._sdatos.accion == 'r_nuevo'){
      this.DCotizacion.ID_DOCUMENTO =  this.DDocumentos.find((p:any) => p.DOCUMENTO === e.value).ID_DOCUMENTO;
      this.DCotizacion.CONSECUTIVO = this.DDocumentos.find((p:any) => p.DOCUMENTO === e.value).CONSECUTIVO;
    }
  }

  onSelectionAtributos(e:any) {
    if (e.name === 'value') {
      this.isGridBoxAtrOpened = false;
    }
  }

  onSelectionCliente(e:any) {
    if (e.name === 'value') {
      this.isGridBoxCliOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0){
      this.DCotizacion.ID_CLIENTE = e.selectedRowsData[0].ID_CLIENTE;
      this.DCotizacion.NOMBRE_CLIENTE = e.selectedRowsData[0].NOMBRE_COMPLETO;
      this.DCotizacion.ID_UBICACION = e.selectedRowsData[0].ID_UBICACION;
      this.DCotizacion.DIRECCION = e.selectedRowsData[0].ID_DIRECCION;
      
      if(this._sdatos.accion != 'r_nuevo')
        this.loadDatos();

      this.isGridBoxCliOpened = false;
      this.valoresObjetos('direcciones', '');
      this.enableProductosItems();
    }
  }

  onSelectionCondicion(e:any) {
    var ANT_COND = this.DCotizacion.ID_CONDICION;
    if (e.name === 'value') {
      this.isGridBoxCondicionOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0){
      if(this.DCotizacion.ID_CONDICION != e.selectedRowsData[0].CODIGO && this.DCotizacionItems.length > 0){
        Swal.fire({
          title: '',
          text: 'Está cambiando la Condición '+this.DCotizacion.ID_CONDICION+' por '+e.selectedRowsData[0].CODIGO+', esto borrará los Productos asociados, ¿Desea Continuar?',
          iconHtml: "<i class='icon-alert-outline'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, Borrar',
        }).then((result) => {
          if (result.isConfirmed){
            this.DCotizacionItems = [];
            this.DCotizacion.ID_CONDICION = e.selectedRowsData[0].CODIGO;
          }else{
            // this.gridBoxCondicion = [(this.DCotizacion.ID_CONDICION != ANT_COND ? ANT_COND : this.DCotizacion.ID_CONDICION)];
            this.DCotizacion.ID_CONDICION = ANT_COND;
            return;
          }
        });
      }
      this.DCotizacion.ID_CONDICION = e.selectedRowsData[0].CODIGO;
      this.TIPO_CONDLISTA = e.selectedRowsData[0].TIPO;
      if(this.DCotizacion.TIPO_COTIZACION == 'CREDITO'){
        this.DCotizacion.PLAZO = 0;
        this.DPlazos = JSON.parse(e.selectedRowsData[0].PLAZOS);
        if (this.DPlazos != null && this.DPlazos.length == 1){
          this.DCotizacion.PLAZO = this.DPlazos[0].PLAZO;
          this.sbPlazo = this.DPlazos[0].PLAZO;
        }
      }
      this.valoresObjetos('productos', '');
      this.isGridBoxCondicionOpened = false;
      this.enableProductosItems();
      this.DCotizacion.ID_CONDICION = e.selectedRowsData[0].CODIGO;
    }
  }

  onSelectionMoneda(e:any) {
    if (e.name === 'value') {
      this.isGridBoxMonedaOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0){
      this.DCotizacion.ID_MONEDA = e.selectedRowsData[0].ID_MONEDA;
      this.isGridBoxMonedaOpened = false;
    }
  }

  onSelectionADC(e:any) {
    if (e.name === 'value') {
      this.isGridBoxADCOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0){
      this.DCotizacion.ID_ADC = e.selectedRowsData[0].ID_ADC;
      this.valoresObjetos('condicion', '');
      this.isGridBoxADCOpened = false;
      this.enableProductosItems();
    }
  }

  onSelectionProductos(e:any) {
    if (e.name === 'value') {
      this.isGridBoxProdOpened = false;
    }
  }

  onSelectionUN(e:any) {
    if (e.name === 'value') {
      this.isGridBoxUNOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0){
      this.DCotizacion.ID_UN_ITEM = e.selectedRowsData[0].ID_UN;
      this.isGridBoxUNOpened = false;
      this.enableProductosItems();
    }
  }

  onSeleccDireccion(e: any){
    this.DCotizacion.DIRECCION = e.value;
  }

  onSeleccPlazo(e: any){
    this.DCotizacion.PLAZO = e.value;
    if(this.DCotizacion.PLAZO > 0){
      this.esVisibleCartera = true;
    }
    this.setValoresCartera();
  }

  onSeleccRowAtributo(e, cellInfo, datacompo) {
    if (e.data){
      cellInfo.data.ATRIBUTO = e.data.VALOR;
      this.gridCotizacionItems.instance.cellValue(cellInfo.rowIndex, "ATRIBUTO", cellInfo.data.ATRIBUTO);
      datacompo.close();
      this.isGridBoxAtrOpened = false;
    }
  }

  onSeleccRowCliente(e, cellInfo, datacompo) {
    if (e.data){
      cellInfo.data.ID_CLIENTE = e.data.ID_CLIENTE;
      this.DCotizacion.NOMBRE_CLIENTE = this.DClientes.find(p => p.ID_CLIENTE === cellInfo.data.ID_CLIENTE).NOMBRE_COMPLETO;
      this.isGridBoxCliOpened = false;
    }
  }

  onSeleccRowProducto(e:any, cellInfo:any, datacompo:any) {
    if (e.data){
      cellInfo.data.PRODUCTO = e.data.PRODUCTO;
      this.gridBoxProducto = [e.data.PRODUCTO];
      cellInfo.data.NOMBRE = e.data.NOMBRE;
      cellInfo.data.PERFIL_TRIBUTARIO = e.data.PERFIL_TRIBUTARIO;
      cellInfo.data.VALOR_UNITARIO = e.data.PRECIO;
      
      this.gridCotizacionItems.instance.cellValue(cellInfo.rowIndex, "NOMBRE_PRODUCTO", cellInfo.data.NOMBRE);
      this.gridCotizacionItems.instance.cellValue(cellInfo.rowIndex, "GRAVAMENES", cellInfo.data.PERFIL_TRIBUTARIO);
      this.gridCotizacionItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", cellInfo.data.VALOR_UNITARIO);

      if (e.data.IVAS.length === 0) {
        showToast('El producto no tiene IVA asignado.', 'error');
        cellInfo.data.PORC_IVA = 0;
        this.keyIva = 0;
        this.gridCotizacionItems.instance.cellValue(cellInfo.rowIndex, "PORC_IVA", cellInfo.data.PORC_IVA);
      } else if (e.data.IVAS.length === 1) {
        this.keyIva = e.data.IVAS[0].PORCENTAJE;
        cellInfo.data.PORC_IVA = e.data.IVAS[0].PORCENTAJE;
        cellInfo.data.VAL_IVA = cellInfo.data.PORC_IVA * cellInfo.data.VALOR_UNITARIO;
        this.gridCotizacionItems.instance.cellValue(cellInfo.rowIndex, "PORC_IVA", cellInfo.data.PORC_IVA);
        this.gridCotizacionItems.instance.cellValue(cellInfo.rowIndex, "VAL_IVA", cellInfo.data.VAL_IVA);
      } else if (e.data.IVAS.length > 1) {
        this.keyFila = cellInfo.rowIndex;
        // Análisis de varios Ivas
        this.eventsSubjectIvas.next({ 
          dataSource: e.data.IVAS, 
          visible: true,
          iva: ''
        });
      }
      datacompo.close();
      this.isGridBoxProdOpened = false;
      this.valoresObjetos('atributos', '');
    }
  }

  onSeleccIvas(e:any){
    if (e.addedItems === undefined) return;
    if (e.addedItems.length === 0) return;
    var rowIndex = this.keyFila;

    // const canPro = this.gridCotizacionItems.instance.cellValue(rowIndex, "CANTIDAD");
    const valUnit = this.gridCotizacionItems.instance.cellValue(rowIndex, "VALOR_UNITARIO");
    const valIva = e.addedItems[0].PORCENTAJE * valUnit;
    this.keyIva = e.addedItems[0].PORCENTAJE;
    this.gridCotizacionItems.instance.cellValue(rowIndex, "PORC_IVA", this.keyIva);
    // this.gridCotizacionItems.instance.cellValue(rowIndex, "VAL_IVA", valIva);
    // this.gridCotizacionItems.instance.cellValue(rowIndex, "TOTAL", valUnit + valIva);
    // this.gridCotizacionItems.instance.cellValue(rowIndex, "GRAVAMENES", e.addedItems[0]);
    // this.gridCotizacionItems.instance.refresh();
    // Actualiza el data source
    // const nx = this.DCotizacionItems.findIndex((it:any) => it.ITEM == this.gridCotizacionItems.instance.cellValue(rowIndex, "ITEM") );
    // if (nx !== -1) {
    //   this.DCotizacionItems[nx].VAL_IVA = valIva;
      // this.DCotizacionItems[nx].TOTAL = valUnit + valIva;
      // this.DCotizacionItems[nx].GRAVAMENES = e.addedItems[0];
    // }

    // this.valoresObjetos('gravamenes', '');
  }

  onSeleccTipoCotizacion(e:any){
    this.DCotizacion.TIPO_COTIZACION = e.value;
    this.DPlazos = this.DCotizacion.TIPO_COTIZACION != 'CREDITO' ? [{PLAZO: 0}] : this.DPlazos;
  }

  onToolbarPreparingGrid(e:any) {
    let toolbarItems = e.toolbarOptions.items;
    e.toolbarOptions.items.unshift(
      {
        location: 'before'
      }
    );
  }

  onValueChangedAtributos(e:any, cellInfo:any) {
    cellInfo.setValue(e.value);
  }

  onValueChangedCliente(e:any, cellInfo:any) {
    cellInfo.setValue(e.value);
  }

  onValueChangedProducto(e:any, cellInfo:any) {
    cellInfo.setValue(e.value);
  }

  AccionEliminar(): void {
    // API eliminación de datos
    const prm = { 
      ID_DOCUMENTO: this.DCotizacion.ID_DOCUMENTO, 
      CONSECUTIVO: this.DCotizacion.CONSECUTIVO, 
      PREFIJO: this.DCotizacion.PREFIJO, 
      SUFIJO: this.DCotizacion.SUFIJO
    };
    this._sdatos
      .delete('delete', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== ''){
          this.showModal(res[0].ErrMensaje, 'error');
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        this.opIrARegistro('Eliminado');
        showToast('Cotización Anulada.', 'success');
        this.readOnly = true;
        this.readOnlyUdp = true;

        // Operaciones de barra
        // this.prmUsrAplBarReg.r_totReg--;
        // this.prmUsrAplBarReg = {
        //   ...this.prmUsrAplBarReg,
        //   error: '',
        //   accion: 'r_navegar',
        //   operacion: {},
        // };
        // this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      });
  }

  calcularValores(){
    this.DCotizacion.SUB_TOTAL = this.DCotizacionItems.reduce((n, {SUB_TOTAL}) => n + SUB_TOTAL, 0);
    this.TOT_GRAV = this.DCotizacionGravAux.reduce((n, {VALOR_BASE}) => n + VALOR_BASE, 0);
    this.DCotizacion.TOTAL = this.DCotizacion.SUB_TOTAL + this.TOT_GRAV;
    //Aqui se construye la grid de Subtotales
    this.GridSubTotales = [{key: 'Subtotal', value: this.DCotizacion.SUB_TOTAL},{key: 'Descuentos', value: this.DCotizacion.VALOR_DESCUENTO},{key: 'Otros', value: 0}];
    this.setValoresCartera();
  }

  cambiosItemForma(e:any, accion = 'activar'){
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

  disableDates(args:any) {
    const today = new Date();
    return args.date < (this.DCotizacion == null || this.DCotizacion.FECHA == null ? today : this.DCotizacion.FECHA) ;
  }

  enableProductosItems(){
    if(this.DCotizacion.DOCUMENTO == '' || this.DCotizacion.ID_CLIENTE == '' || this.DCotizacion.FECHA == '' || this.DCotizacion.ID_UN_ITEM == '' || this.DCotizacion.ID_ADC == '' || this.DCotizacion.ID_CONDICION == ''){
      this.rowNew = false;
    }else{
      this.rowNew = true;
    }

  }

  imprimirReporte(id_reporte:any, archivo:any, datosrpt:any) {
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

  initNewRow(e:any){
    e.data.ID_UN = '';
    e.data.ID_UN_ITEM = '';
    e.data.ID_DOCUMENTO = '';
    e.data.PREFIJO = '';
    e.data.CONSECUTIVO = 0;
    e.data.SUFIJO = '';
    e.data.ITEM = 0;
    e.data.PRODUCTO = '';
    e.data.ATRIBUTO = '';
    e.data.ID_SOPORTE = '';
    e.data.NC_PREFIJO = '';
    e.data.NC_CONSECUTIVO = 0;
    e.data.NC_SUFIJO = '';
    e.data.CANTIDAD = 0;
    e.data.CANTIDAD_DEVUELTA = 0;
    e.data.VALOR_BASE = 0;
    e.data.VALOR_UNITARIO = 0;
    e.data.SUB_TOTAL = 0;
    e.data.VALOR_DESCUENTO = 0;
    e.data.VALOR_COSTOS = 0;
    e.data.VAL_IVA = 0;
    e.data.GRAVAMENES = '';
    e.data.TOTAL = 0;
    if (this.DCotizacionItems.length > 0) {
      const item = this.DCotizacionItems.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    e.data.isEdit = false;
  }

  insertedRow(e:any){
    this.setItemValues();
    this.rowApplyChanges = false;
  }

  insertingRow(e:any) {
    this.conCambios++;
    e.data.isEdit = true;
    // Valida datos
    if (e.data.PRODUCTO === ''){
      showToast('Faltan completar datos del Producto', 'warning');
      e.cancel = true;
    }
    if (e.data.CANTIDAD === 0){
      showToast('Faltan completar la cantidad del Producto', 'warning');
      e.cancel = true;
    }
  }

  loadDatos(){
    this.loadDataToVariables();
    this.esVisibleCartera = (this.DCotizacion.PLAZO > 0 ? true:false);
  }

  loadDataToVariables(){
    this.gridBoxCliente = [this.DCotizacion.ID_CLIENTE];
    this.gridBoxUN = [this.DCotizacion.ID_UN_ITEM];
    this.gridBoxMoneda = [this.DCotizacion.ID_MONEDA];
    this.gridBoxCondicion = [this.DCotizacion.ID_CONDICION];
    this.gridBoxADC = [this.DCotizacion.ID_ADC];
    this.sbDocumento = this.DCotizacion.DOCUMENTO;
    this.sbTipoVenta = this.DCotizacion.TIPO_COTIZACION;
    this.sbIdDireccion = this.DCotizacion.DIRECCION;
    this.sbPlazo = this.DCotizacion.PLAZO;
  }

  loadManualDatatables(){
    this.valoresObjetos('direcciones', '');
    this.valoresObjetos('condicion', '');
    this.setDocumentoToDatatable();
  }

  removedRow(e:any) {
    this.setItemValues();
    this.rowApplyChanges = false;
  }

  resetValidaciones(){
    //this.formCotizacion.instance.resetValues();
  }

  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  setValoresCartera(){
    this.DCotizacion.VALOR_CUOTA = (this.DCotizacion.TOTAL - this.DCotizacion.CUOTA_INICIAL) / this.DCotizacion.PLAZO
  }

  setDocumentoToDatatable(){
    this.DDocumentos = [];
    this.DDocumentos.push({ID_DOCUMENTO: this.DCotizacion.ID_DOCUMENTO, CONSECUTIVO: this.DCotizacion.CONSECUTIVO, DOCUMENTO: this.DCotizacion.ID_DOCUMENTO+'-'+this.DCotizacion.CONSECUTIVO});
  }

  setDItemsAux(){
    this.DItemsAux = this.DCotizacionItems;
    for(const item of this.DItemsAux){
      item.APLICACION = 2
    }
  }

  setDCotizacionItemsValues(data:any){
    for(const item of data){
      for(const DItem of this.DCotizacionItems){
        if(item.ITEM === DItem.ITEM){
          // DItem.GRAVAMENES = item.GRAVAMENES;
          // DItem.VALOR_IVA = item.VALOR_IVA;
          DItem.VAL_IVA = item.VAL_IVA;
          DItem.TOTAL = item.TOTAL;
        }
      }
    }
  }

  setItemValues(){
    if(this.DCotizacionItems.length > 0) {
      this.setDItemsAux();
      this.valoresObjetos('gravamenes', '');
      this.calcularValores();
    } else {
      this.DCotizacion.SUB_TOTAL = 0;
      this.TOT_GRAV = 0;
      this.DCotizacion.TOTAL = this.DCotizacion.SUB_TOTAL + this.TOT_GRAV;
      this.GridSubTotales = [{key: 'Subtotal', value: 0},{key: 'Descuentos', value: 0},{key: 'Otros', value: 0}];
    }
  }

  updatedRow(e:any){
    this.setItemValues();
    this.rowApplyChanges = false;
  }

  updatingRow(e:any) {
    this.conCambios++;
    if (e.oldData === undefined)
      return;
    e.oldData.isEdit = true;
    this.setItemValues();
  }

  clickGravamenes(e, accion: string) {
    if (accion === 'apl grav') {
      // Muestra grid de asignacion de gravamenes forzados a aplicar
      Swal.fire({
        title: '',
        text: 'Se asignarán los gravamenes a la transacción que se seleccionen. '+
              'No se tendrán en cuenta los gravámenes asociados a los productos ni al cliente. '+
              'Desea proceder?',
        iconHtml: "<i class='icon-alert-ol'></i>",
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#438ef1',
        cancelButtonText: 'No',
        confirmButtonText: 'Sí, aceptar',
      }).then((result) => {
        if (result.isConfirmed){
          this.valoresObjetos('tasas legales', '');
          const dataConfig = [{ dataField : "ID_TASA", caption: "Id Tasa", width: "200" },
                              { dataField : "DESCRIPCION", caption: "Nombre" },
                              { dataField : "PORCENTAJE", caption: "%", alignment: "right" },
                              { dataField : "VALOR_BASE", caption: "Base", alignment: "right" },
                              { dataField : "CLASE", caption: "Clase", groupIndex: "0", 
                                templateGroup: ["CLASE"] },
                              ];
          // this.eventsSubjectGridTasas.next({ dataSource: this.DGravamenes, 
          //                   rowsSelected: this.DOrdenCompraGrav.map(({ID_TASA}) => ({ ID_TASA })),
          //                   keyExpr: ["ID_TASA"],
          //                   titGrid: "Asociación de Tasas", 
          //                   colsConfig: dataConfig, 
          //                   modoSelection: 'multiple',
          //                   container: 'popup' });
        }
      });

    } else {
      Swal.fire({
        title: '',
        text: 'Se asignarán los gravámenes asociados a los productos y el cliente. '+
              'Desea proceder?',
        iconHtml: "<i class='icon-alert-ol'></i>",
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#438ef1',
        cancelButtonText: 'No',
        confirmButtonText: 'Sí, aceptar',
      }).then((result) => {
        if (result.isConfirmed){
          this.valoresObjetos('gravamenes', 'original');
        }
      });
    }
  }

  // Valores de cargue inicial
  valoresDefecto() {
    if(this.especAplicacion) {
      this.DCotizacion.ID_MONEDA = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'ID_MONEDA_DEF')?.VALOR_DEFECTO ?? '';
      this.especMonedaFormato = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'FORMATO MONEDA')?.FORMATO ?? '#,##0.00';
      this.especCantidadFormato = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'FORMATO CANTIDAD')?.FORMATO ?? '#,##0.00';
      this.especModificarPrecio = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'MODIFICAR PRECIO')?.ACTIVADO ?? false;
      this.especModificarGrav = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'MODIFICAR GRAVAMENES')?.ACTIVADO ?? false;
      this.especRepetirItem = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'REPETIR ITEM')?.ACTIVADO ?? false;
      this.especOrigenPrecio = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'MODIFICAR PRECIO')?.VALOR_DEFECTO ?? '';

      // Cuentas de email usuario
      this.especEmailCompras = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'EMAIL COMPRAS')?.VALOR_DEFECTO ?? '';
      this.especUsuarioEmail = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'EMAIL COMPRAS')?.TITULO ?? '';
      this.especModificarOrden = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'MODIFICAR ORDEN')?.ACTIVADO ?? false;
      this.especModoEnvioEmail = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'MODO ENVIO EMAIL')?.VALOR_DEFECTO ?? '';
    }
  }

  ValidaDatos(Accion: string): boolean {
    var msg = '';
    if (Accion === "requerido"){
      if (this.DCotizacion.DOCUMENTO === "" || this.DCotizacion.FECHA === null || 
          this.DCotizacion.ID_CLIENTE === "" || this.DCotizacion.ID_UN_ITEM === '' ||
          this.DCotizacion.ID_MONEDA === '' || this.DCotizacion.ID_ADC === "" || 
          this.DCotizacion.TIPO_COTIZACION === "" || this.DCotizacion.ID_CONDICION === ""
      ){
        if(this.DCotizacion.DOCUMENTO === '') msg += 'Documento ,';
        if(this.DCotizacion.FECHA === null) msg += 'Fecha ,';
        if(this.DCotizacion.ID_CLIENTE === '') msg += 'Cliente ,';
        if(this.DCotizacion.ID_UN_ITEM === '') msg += 'Unidad de Negocio ,';
        if(this.DCotizacion.ID_MONEDA === '') msg += 'Moneda ,';
        if(this.DCotizacion.ID_ADC === '') msg += 'Vendedor ,';
        if(this.DCotizacion.TIPO_COTIZACION === '') msg += 'Tipo de Venta ,';
        if(this.DCotizacion.ID_CONDICION === '') msg += 'Condición ,';
        this.showModal('Hay datos incompletos de la Cotización. Revisar contenido de los items: '+msg.slice(0, -1), 'error');
        return false;
      }
      if(this.DCotizacionItems === undefined || this.DCotizacionItems.length === 0){
        this.showModal('No se ha asociado ningún Producto','error');
        return false;
      }
    }
    return true;
  }

  valoresObjetos(obj: string, opcion:any){
    if (obj === 'documento' || obj === 'ref') {
      const prm = { ID_APLICACION : 'VEN-208', USUARIO: this.USUARIO_LOCAL};
      this._sdatos
      .consulta('DOCUMENTOS CONSECUTIVO', prm, 'VEN-208')
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DDocumentos = res;
        if(this.DDocumentos != null && this.DDocumentos.length === 1){
          this.sbDocumento = this.DDocumentos[0].DOCUMENTO;
          this.DCotizacion.DOCUMENTO = this.DDocumentos[0].DOCUMENTO;
          this.DCotizacion.ID_DOCUMENTO = this.DDocumentos[0].ID_DOCUMENTO;
          this.DCotizacion.CONSECUTIVO = this.DDocumentos[0].CONSECUTIVO;
        }
      });
    }

    if (obj === 'productos' || obj === 'todos'  || obj === 'ref') {
      const prm = {ID_LISTA: this.DCotizacion.ID_CONDICION, TIPO: this.TIPO_CONDLISTA};
      const accion = 'PRODUCTOS LISTA PRECIOS';
      this._sdatos.consulta(accion, prm, 'PRO-022').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== undefined && mensaje !== null && mensaje !== '')
          this.noDataTextProducto = mensaje;
        else
          this.DProductos = newArray;
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
          this.DTiposCotizacion = res;
        });
    }

    if (obj === 'gravamenes' || obj === 'ref'){
      // const prm = {ID_DOCUMENTO: this.DCotizacion.ID_DOCUMENTO, PREFIJO: this.DCotizacion.PREFIJO, 
      //             CONSECUTIVO: this.DCotizacion.CONSECUTIVO, SUFIJO: this.DCotizacion.SUFIJO, 
      //             ID_TERCERO: this.DCotizacion.ID_CLIENTE, ID_CONDICION: this.DCotizacion.ID_CONDICION,
      //             FECHA: this.DCotizacion.FECHA, ITEMS: this.DItemsAux
      // };
      var prm = {};
      if (opcion !== 'original')
        prm = { ENCABEZADO: this.DCotizacion, 
          ITEMS: this.DItemsAux, APL_GRAV: opcion, ORIGEN: 'CLIENTE'};
      else
        prm = { ENCABEZADO: this.DCotizacion, 
          ITEMS: this.DItemsAux, OPCION_GRAV: opcion, ORIGEN: 'CLIENTE'};
      this._sdatos
      .getGravamenes('GRAVAMENES', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DCotizacionGrav = [res[0].ITEMS[0].GRAVAMENES];
        if (this.DCotizacionGrav !== undefined && this.DCotizacionGrav.length > 0){
          for (let i = 0; i < this.DCotizacionGrav.length; i++) {
            this.DCotizacionGrav[i].ITEM = i++;
          }
          this.DCotizacionGravAux = this.DCotizacionGrav.filter(e => e.APLICACION === 1);
          this.TOT_GRAV = this.DCotizacionGravAux.reduce((n:any, {VALOR_BASE}) => n + VALOR_BASE, 0);
        } else {
          this.DCotizacionGravAux = [];
        }
        this.calcularValores();
        // this.setDCotizacionItemsValues(res[0].ITEMS);
      });
    }

    if (obj === 'direcciones' || obj === 'ref') {
      this._sdatos.consulta('DIRECCIONES CLIENTE',{ID_CLIENTE: this.DCotizacion.ID_CLIENTE},'VEN-001').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DDirecciones = res;
      });
    }

    if (obj === 'un' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('UNIDADES NEGOCIOS',{ESTADO: 'ACTIVO'},'ADM-002').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DUnidadesNegocios = res;
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
      this._sdatos.consulta('CONDICIONES LISTAS',{ID_ADC: this.DCotizacion.ID_ADC},this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
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
          this.DPlazos = JSON.parse(this.DCondicionLista.find(e => e.CODIGO === this.DCotizacion.ID_CONDICION).PLAZOS);
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
          this.DCotizacion.ID_MONEDA = this.MONEDA_DEF;
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
        if(res !== null && res.length > 0){
          this.UN_DEF = res[0].ID_UN;
          this.gridBoxUN = [this.UN_DEF];
          this.DCotizacion.ID_UN_ITEM = this.UN_DEF;
        }
      });
    }

    // if (obj === 'formato moneda' || obj === 'todos' || obj === 'ref') {
    //   this._sdatos.consulta('ESPECIFICACIONES',{ID_ESPECIFICACION: 'OBJETOS', ID_APLICACION: 'GENERAL', NOMBRE_OBJETO: 'FORMATO MONEDA'}, 'ADM-011').subscribe((data: any) => {
    //     const res = JSON.parse(data.data);
    //     if ( (data.token != undefined)){
    //       const refreshToken = data.token;
    //       localStorage.setItem("token", refreshToken);
    //     }
    //     this.especMonedaFormato = res[0].FORMATO;
    //   });
    // }

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

    if (obj == 'especificaciones' || obj == 'todos' ) {
      this._sdatos.consulta('ESPECIFICACIONES', { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, USUARIO: this.prmUsrAplBarReg.usuario },'ADM-011')
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

}
