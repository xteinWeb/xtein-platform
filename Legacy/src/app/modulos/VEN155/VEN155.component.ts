import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
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
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { VEN155Service } from 'src/app/services/VEN155/VEN155.service';
import { clsPedidos, clsPedidosGrav, clsPedidosItems } from './clsVEN155.class';
import notify from 'devextreme/ui/notify';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule } from '@angular/common';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { showToast } from '../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-VEN155',
  templateUrl: './VEN155.component.html',
  styleUrls: ['./VEN155.component.scss'],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxSelectBoxModule, CdkAccordionModule, DxDropDownBoxModule,
            DxDataGridModule, DxDateBoxModule, DxTextBoxModule, DxNumberBoxModule, DxLoadPanelModule,
            DxButtonModule, VistarapidaComponent
          ]
})

export class VEN155Component implements OnInit {
  @ViewChild('formPedidos', { static: false }) formPedidos: DxFormComponent;
  @ViewChild("gridPedidoItems", { static: false }) gridPedidoItems: DxDataGridComponent;

  //Variables fijas de la Aplicación
  subscription: Subscription;
  subscriptionPedidos: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
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
  sbIdDireccion: number;
  sbPlazo: number;
  sbTipoVenta: string;
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
  MONEDA_FORMATO: string;
  CANTIDAD_FORMATO: string;
  ID_APLICACION: any = 'VEN-155';
  stylingMode = 'filled';
  dropDownOptions = { width: 700, height: 400, hideOnParentScroll: true, container: '#router-container'};
  dropDownOptionsListBox = { hideOnParentScroll: true, container: '#router-container' };
  dSBEstados = ["REGISTRADO","ANULADO","COMPLETADO","EN PROCESO"];
  items = ['Datos del Cliente','Datos de la Transacción','Datos de la Venta'];
  accordionExpand: any;

  //Notificaciones
  toaVisible: boolean;
  toaMessage: string = 'Registro actualizado!';
  toaTipo: string = 'success';
  loadingVisible: boolean = false;

  //Variables de datos
  DPedidos: clsPedidos;
  DPedidosItems: clsPedidosItems[] = [];
  DPedidosGrav: clsPedidosGrav[] = [];
  DPedidosGravAux: clsPedidosGrav[] = [];
  DItemsAux:any = [];
  DPedidos_prev: any;
  DPedidosItems_prev: any;
  DPedidosGrav_prev: any;
  DProductos: any;
  DClientes: any;
  DDocumentos: any;
  DUnidadMedida: any;
  DTiposVenta: any;
  DListasPrecios: any;
  DADC: any;
  DAtributos: any;
  DDirecciones: any;
  DUnidadesNegocios: any;
  DMonedas: any;
  DCondicionLista: any;
  DPlazos: any;
  DMonedaDef: any;
  
  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esVisibleSelecc: string = 'none';

  NOW: Date = new Date();
  FECHA_MIN: any = null;
  FECHA_MAX: any = null;
  DplanesProd:any = [];

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

    // Servicio comunicacion entre pestañas
    this.subscriptionPedidos = this._sdatos
      .getObs_Pedidos()
      .subscribe((datreg) => {
        // Ejecuta de acuerdo al componente hijo
        switch (datreg.componente){
          case 'atributos':
            break;

          default:
            break;
        }
      });
  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes
    this._sdatos.accion = operMenu.accion;
    switch (operMenu.accion){
      case 'r_ini':
        const user:any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'PEDIDO',
          aplicacion: 'VEN-155',
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
        var mensaje = '¿Desea cancelar la operación?';
        if (this.conCambios > 0) mensaje = 'Desea cancelar sin guardar cambios?';
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
          if (result.isConfirmed){
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this.readOnly = true;
            this.readOnlyUdp = true;
            this.esEdicion = false;
            this.esCreacion = false;
            this.esVisibleSelecc = 'none';
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.DPedidos = JSON.parse(JSON.stringify(this.DPedidos_prev));
            this.DPedidosItems = JSON.parse(JSON.stringify(this.DPedidosItems_prev));
            this.DPedidosGrav = JSON.parse(JSON.stringify(this.DPedidosGrav_prev));
            this.DPedidosGravAux = this.DPedidosGrav.filter(e => e.APLICACION === 1);
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
        this.imprimirReporte(
          operMenu.operacion.id_reporte,
          operMenu.operacion.archivo,
          operMenu.operacion.data_rpt
        );
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
    this.DPedidos = {
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
      FECHA_ENTREGA: null,
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
      ID_DIRECCION: 0
    };
    this.DPedidosItems = [];
    this.DPedidosGravAux = [];
    this.GridSubTotales = [{key: 'Subtotal', value: 0},{key: 'Descuentos', value: 0},{key: 'Otros', value: 0}];
    this.gridBoxCliente = [];
    if (this.UN_DEF != null)
      this.gridBoxUN = [this.UN_DEF];
      this.DPedidos.ID_UN_ITEM = this.UN_DEF;
    if(this.MONEDA_DEF != null)
      this.gridBoxMoneda = [this.MONEDA_DEF];
      this.DPedidos.ID_MONEDA = this.MONEDA_DEF;
    this.gridBoxCondicion = [];
    this.gridBoxADC = [];
    this.sbDocumento = '';
    this.sbTipoVenta = '';
    this.sbIdDireccion = 0;
    this.sbPlazo = 0;
    this._sdatos.ID_DOCUMENTO = '';
    this._sdatos.CONSECUTIVO = '';
    this._sdatos.ID_DOCUMENTO_prev = '';
    this._sdatos.CONSECUTIVO_prev = '';
    this.DPedidos_prev = JSON.parse(JSON.stringify(this.DPedidos));
    this.DPedidosItems_prev = JSON.parse(JSON.stringify(this.DPedidosItems));
    this.DPedidosGrav_prev = JSON.parse(JSON.stringify(this.DPedidosGrav));
    this.TOT_GRAV = 0;
    this.esVisibleCartera = false;
    
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
      (JSON.stringify({ PEDIDOS: this.DPedidos, ITM_PEDIDOS: this.DPedidosItems, PEDIDO_GRAV: this.DPedidosGrav})).replace(/}{/g,",")
    );

    // API guardado de datos
    var exito = false;
    this._sdatos
    .save(accion, prmDatosGuardar, this.prmUsrAplBarReg.aplicacion)
    .subscribe((resp) => {
      const res = JSON.parse(resp.data);
      if (res[0].ErrMensaje !== ""){
        this.showModal(res[0].ErrMensaje);
        
      } else {
        this.readOnly = true;
        this.readOnlyUdp = true;
        this.esEdicion = false;
        this.esCreacion = false;
        this.esVisibleSelecc = 'none';
        // Operaciones de barra
        if (this.mnuAccion === 'new'){
          this.QFiltro = "PEDIDO='"+this.DPedidos.ID_DOCUMENTO+"'";
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
        Titulo: 'Datos de filtro para Pedidos',
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
      const prm = { PEDIDO: arrFiltro };
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
            this.DPedidos = datares[0];
            this.DPedidosItems = datares[0].ITM_PEDIDOS;
            this.DPedidosGrav = datares[0].PEDIDO_GRAV;
            if(this.DPedidosGrav != null)
              this.DPedidosGravAux = this.DPedidosGrav.filter(e => e.APLICACION === 1);
            this._sdatos.ID_DOCUMENTO = this.DPedidos.ID_DOCUMENTO;
            this._sdatos.CONSECUTIVO = this.DPedidos.CONSECUTIVO;
            this._sdatos.ID_DOCUMENTO_prev = this.DPedidos.ID_DOCUMENTO;
            this._sdatos.CONSECUTIVO_prev = this.DPedidos.CONSECUTIVO;
            this.QFiltro = datares[0].QFILTRO;
            this.loadManualDatatables();
            this.loadDatos();
            this.calcularValores();
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
              tabla: 'PEDIDO',
              aplicacion: 'VEN-155',
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
        'Desea eliminar el Pedido <i>' +
        this.DPedidos.ID_DOCUMENTO +
        '-' +
        this.DPedidos.CONSECUTIVO +
        '</i> ?',
      iconHtml: "<i class='icon-alert-outline'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar',
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
          this.DPedidos = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this.DPedidosItems = JSON.parse(JSON.stringify(this.VDatosReg[0].ITM_PEDIDOS));
          this.DPedidosGrav = JSON.parse(JSON.stringify(this.VDatosReg[0].PEDIDO_GRAV));
          this.DPedidosGravAux = this.DPedidosGrav != null ? this.DPedidosGrav.filter(e => e.APLICACION === 1) : [];
          this.loadManualDatatables();
          this.loadDatos();
          this.calcularValores();
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }else{
          showToast('No se encontraron Datos', 'error');
          this.readOnly = true;
          this.readOnlyUdp = true;
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.DPedidos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DPedidosItems = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_PEDIDOS));
        this.DPedidosGrav = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PEDIDO_GRAV));
        this.DPedidosGravAux = this.DPedidosGrav != null ? this.DPedidosGrav.filter(e => e.APLICACION === 1) : [];
        this.loadManualDatatables();
        this.loadDatos();
        this.calcularValores();
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length ? this.VDatosReg.length : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DPedidos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1]));
        this.DPedidosItems = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1].ITM_PEDIDOS));
        this.DPedidosGrav = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PEDIDO_GRAV));
        this.DPedidosGravAux = this.DPedidosGrav != null ? this.DPedidosGrav.filter(e => e.APLICACION === 1) : [];
        this.loadManualDatatables();
        this.loadDatos();
        this.calcularValores();
        break;
      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DPedidos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DPedidosItems = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_PEDIDOS));
        this.DPedidosGrav = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PEDIDO_GRAV));
        this.DPedidosGravAux = this.DPedidosGrav != null ? this.DPedidosGrav.filter(e => e.APLICACION === 1) : [];
        this.calcularValores();
        this.loadManualDatatables();
        this.loadDatos();
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
          this.DPedidos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this.DPedidosItems = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_PEDIDOS));
          this.DPedidosGrav = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PEDIDO_GRAV));
          this.DPedidosGravAux = this.DPedidosGrav != null ? this.DPedidosGrav.filter(e => e.APLICACION === 1) : [];
          this.loadManualDatatables();
          this.calcularValores();
          this.loadDatos();
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearForma();
          this.resetValidaciones();
          setTimeout(() => {
            if (this.formPedidos && this.formPedidos.instance)
              this.formPedidos.instance.resetValues();
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
          this.DPedidos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
          this.DPedidosItems = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_PEDIDOS;
          this.DPedidosGrav = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PEDIDO_GRAV;
          if(this.DPedidosGrav != null)
            this.DPedidosGravAux = this.DPedidosGrav.filter(e => e.APLICACION === 1);
          this.loadManualDatatables();
          this.loadDatos();
          this.calcularValores();
        } else {
          this.opBlanquearForma();
        }
        break;
      default:
        break;
    }
  }

  opVista(): void {
    const VDatosRegAux = this.VDatosReg.map(({ID_DOCUMENTO,PREFIJO,CONSECUTIVO,SUFIJO,FECHA,ID_CLIENTE,TIPO_VENTA,ID_DOC_SOPORTE,ID_ADC,DESCRIPCION,USUARIO,ESTADO}) => ({ID_DOCUMENTO,PREFIJO,CONSECUTIVO,SUFIJO,FECHA,ID_CLIENTE,TIPO_VENTA,ID_DOC_SOPORTE,ID_ADC,DESCRIPCION,USUARIO,ESTADO}));
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(VDatosRegAux));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'Pedidos',
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
    this.DPedidos = {
      ID_UN: '',
      ID_UN_ITEM: '',
      ID_DOCUMENTO: '',
      NOMBRE_DOCUMENTO: '',
      PREFIJO: '',
      CONSECUTIVO: 0,
      SUFIJO: '',
      DOCUMENTO: '',
      FECHA_REGISTRO: '',
      FECHA_ENTREGA: '',
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
      ID_DIRECCION: 0
    };
    this.DPedidosItems = [];
    this.DPedidosGravAux = [];
    this.GridSubTotales = [{key: 'Subtotal', value: 0},{key: 'Descuentos', value: 0},{key: 'Otros', value: 0}];
    this.gridBoxCliente = [];
    if (this.UN_DEF !== null && this.UN_DEF !== undefined && this.UN_DEF !== '') {
      this.gridBoxUN = [];
      this.DPedidos.ID_UN_ITEM = '';
    }
    if(this.MONEDA_DEF !== null && this.MONEDA_DEF !== undefined && this.MONEDA_DEF !== '') {
      this.gridBoxMoneda = [];
    }
    this.DPedidos.ID_MONEDA = '';
    this.gridBoxCondicion = [];
    this.gridBoxADC = [];
    this.sbDocumento = '';
    this.sbTipoVenta = '';
    this.sbIdDireccion = 0;
    this.sbPlazo = 0;
    this.TOT_GRAV = 0;
    this.esVisibleCartera = false;
    this._sdatos.ID_DOCUMENTO = '';
    this._sdatos.CONSECUTIVO = '';
    this._sdatos.ID_DOCUMENTO_prev = '';
    this._sdatos.CONSECUTIVO_prev = '';
    this.DPedidos_prev = JSON.parse(JSON.stringify(this.DPedidos));
    this.DPedidosItems_prev = JSON.parse(JSON.stringify(this.DPedidosItems));
    this.DPedidosGrav_prev = JSON.parse(JSON.stringify(this.DPedidosGrav));
  }

  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        this.gridBoxProducto = [];
        this.gridPedidoItems.instance.addRow();
        this.rowApplyChanges = true;
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        break;
      case 'save':
        this.gridPedidoItems.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        break;
      case 'cancel':
        this.gridPedidoItems.instance.cancelEditData();
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
              const index = this.DPedidosItems.findIndex(a => a.ITEM === key);
              this.DPedidosItems.splice(index, 1);
            });
            this.gridPedidoItems.instance.refresh();
            this.conCambios++;
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
    rowData.VAL_IVA = rowData.SUB_TOTAL * currentRowData.PORC_IVA
    rowData.TOTAL = rowData.SUB_TOTAL + rowData.VAL_IVA
  }

  onEditingStart(e) {
    this.gridBoxProducto = [e.data.PRODUCTO];
  }

  onEditorEnterKey(e){
    e.event.preventDefault();
    var itemsgru:any = this.formPedidos.instance.option('items');
    itemsgru.forEach((g) => {
      var items = g['items'];
      var index = items.findIndex((item) => item.dataField === e.dataField);
      if (index !== -1){
        var fNextEditor = this.formPedidos.instance.getEditor(
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
    this.DPedidos.DOCUMENTO = e.value;
    this.enableProductosItems();
    if(this._sdatos.accion == 'r_nuevo'){
      this.DPedidos.ID_DOCUMENTO =  this.DDocumentos.find(p => p.DOCUMENTO === e.value).ID_DOCUMENTO;
      this.DPedidos.CONSECUTIVO = this.DDocumentos.find(p => p.DOCUMENTO === e.value).CONSECUTIVO;
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
      this.DPedidos.ID_CLIENTE = e.selectedRowsData[0].ID_CLIENTE;
      this.DPedidos.NOMBRE_CLIENTE = e.selectedRowsData[0].NOMBRE_COMPLETO;
      this.DPedidos.ID_UBICACION = e.selectedRowsData[0].ID_UBICACION;
      this.DPedidos.ID_DIRECCION = e.selectedRowsData[0].ID_DIRECCION;
      
      if(this._sdatos.accion != 'r_nuevo')
        this.loadDatos();

      this.isGridBoxCliOpened = false;
      this.valoresObjetos('direcciones');
      this.enableProductosItems();
    }
  }

  onSelectionCondicion(e) {
    var ANT_COND = this.DPedidos.ID_CONDICION;
    if (e.name === 'value') {
      this.isGridBoxCondicionOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0){
      if(this.DPedidos.ID_CONDICION != e.selectedRowsData[0].CODIGO && this.DPedidosItems.length > 0){
        Swal.fire({
          title: '',
          text: 'Está cambiando la Condición '+this.DPedidos.ID_CONDICION+' por '+e.selectedRowsData[0].CODIGO+', esto borrará los Productos asociados, ¿Desea Continuar?',
          iconHtml: "<i class='icon-alert-outline'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, Borrar',
        }).then((result) => {
          if (result.isConfirmed){
            this.DPedidosItems = [];
            this.DPedidos.ID_CONDICION = e.selectedRowsData[0].CODIGO;
          }else{
            // this.gridBoxCondicion = [(this.DPedidos.ID_CONDICION != ANT_COND ? ANT_COND : this.DPedidos.ID_CONDICION)];
            this.DPedidos.ID_CONDICION = ANT_COND;
            return;
          }
        });
      }
      this.DPedidos.ID_CONDICION = e.selectedRowsData[0].CODIGO;
      this.TIPO_CONDLISTA = e.selectedRowsData[0].TIPO;
      if(this.DPedidos.TIPO_VENTA == 'CREDITO'){
        this.DPedidos.PLAZO = 0;
        if (e.selectedRowsData[0].PLAZOS)
          this.DPlazos = JSON.parse(e.selectedRowsData[0].PLAZOS);
        else 
          this.DPlazos = []
        
        if (this.DPlazos != null && this.DPlazos.length == 1){
          this.DPedidos.PLAZO = this.DPlazos[0].PLAZO;
          this.sbPlazo = this.DPlazos[0].PLAZO;
        }
      }
      this.valoresObjetos('productos');
      this.isGridBoxCondicionOpened = false;
      this.enableProductosItems();
      this.DPedidos.ID_CONDICION = e.selectedRowsData[0].CODIGO;
    }
  }

  onSelectionMoneda(e) {
    if (e.name === 'value') {
      this.isGridBoxMonedaOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0){
      this.DPedidos.ID_MONEDA = e.selectedRowsData[0].ID_MONEDA;
      this.isGridBoxMonedaOpened = false;
    }
  }

  onSelectionADC(e) {
    if (e.name === 'value') {
      this.isGridBoxADCOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0){
      this.DPedidos.ID_ADC = e.selectedRowsData[0].ID_ADC;
      this.valoresObjetos('condicion');
      this.isGridBoxADCOpened = false;
      this.enableProductosItems();
    }
  }

  onSelectionProductos(e) {
    if (e.name === 'value') {
      this.isGridBoxProdOpened = false;
    }
  }

  onSelectionUN(e) {
    if (e.name === 'value') {
      this.isGridBoxUNOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0){
      this.DPedidos.ID_UN_ITEM = e.selectedRowsData[0].ID_UN;
      this.isGridBoxUNOpened = false;
      this.enableProductosItems();
    }
  }

  onSeleccDireccion(e: any){
    this.DPedidos.ID_DIRECCION = e.value;
  }

  onSeleccPlazo(e: any){
    this.DPedidos.PLAZO = e.value;
    if(this.DPedidos.PLAZO > 0){
      this.esVisibleCartera = true;
    }
    this.setValoresCartera();
  }

  onSeleccRowAtributo(e, cellInfo, datacompo) {
    if (e.data){
      cellInfo.data.ATRIBUTO = e.data.VALOR;
      this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "ATRIBUTO", cellInfo.data.ATRIBUTO);
      datacompo.close();
      this.isGridBoxAtrOpened = false;
    }
  }

  onSeleccRowCliente(e, cellInfo, datacompo) {
    if (e.data){
      cellInfo.data.ID_CLIENTE = e.data.ID_CLIENTE;
      this.DPedidos.NOMBRE_CLIENTE = this.DClientes.find(p => p.ID_CLIENTE === cellInfo.data.ID_CLIENTE).NOMBRE_COMPLETO;
      this.isGridBoxCliOpened = false;
    }
  }

  onSeleccRowProducto(e, cellInfo, datacompo) {
    if (e.data){
      cellInfo.data.PRODUCTO = e.data.PRODUCTO;
      this.gridBoxProducto = [e.data.PRODUCTO];
      cellInfo.data.NOMBRE = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO).NOMBRE;
      this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "NOMBRE_PRODUCTO", cellInfo.data.NOMBRE);
      cellInfo.data.PERFIL_TRIBUTARIO = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO).PERFIL_TRIBUTARIO;
      this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "GRAVAMENES", cellInfo.data.PERFIL_TRIBUTARIO);
      cellInfo.data.VALOR_UNITARIO = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO).PRECIO;
      this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", cellInfo.data.VALOR_UNITARIO);
      cellInfo.data.PORC_IVA = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO).PORC_IVA;
      this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "PORC_IVA", cellInfo.data.PORC_IVA);
      datacompo.close();
      this.isGridBoxProdOpened = false;
      this.valoresObjetos('atributos');
    }
  }

  onSeleccTipoVenta(e){
    this.DPedidos.TIPO_VENTA = e.value;
    this.DPlazos = this.DPedidos.TIPO_VENTA != 'CREDITO' ? [{PLAZO: 0}] : this.DPlazos;
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
    const prm = { PEDIDOS: {ID_DOCUMENTO: this.DPedidos.ID_DOCUMENTO, PREFIJO: this.DPedidos.PREFIJO, CONSECUTIVO: this.DPedidos.CONSECUTIVO, SUFIJO: this.DPedidos.SUFIJO} };
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
    this.DPedidos.SUB_TOTAL = this.DPedidosItems.reduce((n, {SUB_TOTAL}) => n + SUB_TOTAL, 0);
    this.TOT_GRAV = this.DPedidosGravAux.reduce((n, {VALOR}) => n + VALOR, 0);
    this.DPedidos.TOTAL = this.DPedidos.SUB_TOTAL + this.TOT_GRAV;
    //Aqui se construye la grid de Subtotales
    this.GridSubTotales = [{key: 'Subtotal', value: this.DPedidos.SUB_TOTAL},{key: 'Descuentos', value: this.DPedidos.VALOR_DESCUENTO},{key: 'Otros', value: 0}];
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
    return args.date < (this.DPedidos == null || this.DPedidos.FECHA == null ? today : this.DPedidos.FECHA) ;
  }

  enableProductosItems(){
    if(this.DPedidos.DOCUMENTO == '' || this.DPedidos.ID_CLIENTE == '' || this.DPedidos.FECHA == '' || this.DPedidos.ID_UN_ITEM == '' || this.DPedidos.ID_ADC == '' || this.DPedidos.ID_CONDICION == ''){
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
      e.data.ATRIBUTO = '';
      e.data.ID_SOPORTE = '';
      e.data.NC_PREFIJO = '';
      e.data.NC_CONSECUTIVO = 0;
      e.data.NC_SUFIJO = '';
      e.data.CANTIDAD = 0;
      e.data.CANTIDAD_AUTORIZADA = 0;
      e.data.CANTIDAD_PENDIENTE = 0;
      e.data.VALOR_BASE = 0;
      e.data.VALOR_UNITARIO = 0;
      e.data.SUB_TOTAL = 0;
      e.data.VALOR_DESCUENTO = 0;
      e.data.VALOR_COSTOS = 0;
      e.data.GRAVAMENES = '';
      e.data.TOTAL = 0;
      if (this.DPedidosItems.length > 0) {
        const item = this.DPedidosItems.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
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
    this.esVisibleCartera = (this.DPedidos.PLAZO > 0 ? true:false);
  }

  loadDataToVariables(){
    this.gridBoxCliente = [this.DPedidos.ID_CLIENTE];
    this.gridBoxUN = [this.DPedidos.ID_UN_ITEM];
    this.gridBoxMoneda = [this.DPedidos.ID_MONEDA];
    this.gridBoxCondicion = [this.DPedidos.ID_CONDICION];
    this.gridBoxADC = [this.DPedidos.ID_ADC];
    this.sbDocumento = this.DPedidos.DOCUMENTO;
    this.sbTipoVenta = this.DPedidos.TIPO_VENTA;
    this.sbIdDireccion = this.DPedidos.ID_DIRECCION;
    this.sbPlazo = this.DPedidos.PLAZO;
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
    //this.formPedidos.instance.resetValues();
  }

  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  setValoresCartera(){
    this.DPedidos.VALOR_CUOTA = (this.DPedidos.TOTAL - this.DPedidos.CUOTA_INICIAL) / this.DPedidos.PLAZO
  }

  setDocumentoToDatatable(){
    this.DDocumentos = [];
    this.DDocumentos.push({ID_DOCUMENTO: this.DPedidos.ID_DOCUMENTO, CONSECUTIVO: this.DPedidos.CONSECUTIVO, DOCUMENTO: this.DPedidos.ID_DOCUMENTO+'-'+this.DPedidos.CONSECUTIVO});
  }

  setDItemsAux(){
    this.DItemsAux = this.DPedidosItems;
    for(const item of this.DItemsAux){
      item.APLICACION = 2
    }
  }

  setDPedidosItemsValues(data){
    for(const item of data){
      for(const DItem of this.DPedidosItems){
        if(item.ITEM === DItem.ITEM){
          DItem.GRAVAMENES = item.GRAV;
          DItem.VALOR_IVA = item.VAL_IVA;
          DItem.TOTAL = item.TOTAL;
        }
      }
    }
  }

  setItemValues(){
    this.setDItemsAux();
    this.valoresObjetos('gravamenes');
    this.calcularValores();
  }

  showModal(mensaje, titulo = '¡Error!', msg_html = ''){
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-circle'></i>",
      title: titulo,
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
      html: msg_html,
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

  onValueChangedFechaEntrega(e:any, cellInfo:any){
    cellInfo.setValue(e.value);
  }

  ValidaDatos(Accion: string): boolean {
    var msg = '';
    if (Accion === "requerido"){
      if (this.DPedidos.DOCUMENTO == "" || this.DPedidos.FECHA == null || this.DPedidos.ID_CLIENTE == "" || this.DPedidos.ID_UN_ITEM == '' || this.DPedidos.ID_MONEDA == '' || this.DPedidos.ID_ADC == "" || this.DPedidos.TIPO_VENTA == "" || this.DPedidos.ID_CONDICION == "" || this.DPedidos.FECHA_PRIMER_VENC == null){
        if(this.DPedidos.DOCUMENTO == '') msg += 'Documento ,';
        if(this.DPedidos.FECHA == null) msg += 'Fecha ,';
        if(this.DPedidos.ID_CLIENTE == '') msg += 'Cliente ,';
        if(this.DPedidos.ID_UN_ITEM == '') msg += 'Unidad de Negocio ,';
        if(this.DPedidos.ID_MONEDA == '') msg += 'Moneda ,';
        if(this.DPedidos.ID_ADC == '') msg += 'Vendedor ,';
        if(this.DPedidos.TIPO_VENTA == '') msg += 'Tipo de Venta ,';
        if(this.DPedidos.ID_CONDICION == '') msg += 'Condición ,';
        if(this.DPedidos.FECHA_PRIMER_VENC == null) msg += 'Fecha Vencimiento ,';
        this.showModal('Error al guardar',"Faltan datos","Hay datos incompletos del Pedido. Revisar contenido de los items: "+msg.slice(0, -1));
        return false;
      }
      if(this.DPedidosItems === undefined || this.DPedidosItems.length == 0){
        this.showModal('Error al guardar',"Faltan datos","No se ha asociado ningún Producto al Pedido");
        return false;
      }
      if(this.DPedidos.FECHA_PRIMER_VENC < this.DPedidos.FECHA && this.DPedidos.FECHA_PRIMER_VENC != ''){
        this.showModal('Error al guardar',"Validación","La Fecha de Vencimiento no debe ser menor a la Fecha del Pedido");
        return false;
      }
    }
    return true;
  }

  valoresObjetos(obj: string){
    if (obj === 'documento' || obj === 'ref') {
      const prm = { ID_APLICACION : 'VEN-155', USUARIO: localStorage.getItem('usuario')};
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
            this.DPedidos.DOCUMENTO = this.DDocumentos[0].DOCUMENTO;
            this.DPedidos.ID_DOCUMENTO = this.DDocumentos[0].ID_DOCUMENTO;
            this.DPedidos.CONSECUTIVO = this.DDocumentos[0].CONSECUTIVO;
          }
        });
    }

    if (obj === 'productos' || obj === 'ref') {
      const prm = {ID_LISTA: this.DPedidos.ID_CONDICION, TIPO: this.TIPO_CONDLISTA};
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

    // if (obj === 'listasprecios' || obj === 'todos' || obj === 'ref') {
    //   const prm = { FILTRO: 'factura' };
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
      const prm = {ID_DOCUMENTO: this.DPedidos.ID_DOCUMENTO, PREFIJO: this.DPedidos.PREFIJO, CONSECUTIVO: this.DPedidos.CONSECUTIVO, SUFIJO: this.DPedidos.SUFIJO, ID_TERCERO: this.DPedidos.ID_CLIENTE, ID_CONDICION: this.DPedidos.ID_CONDICION, FECHA: this.DPedidos.FECHA, ITEMS: this.DItemsAux};
      this._sdatos
        .consulta('GRAVAMENES', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DPedidosGrav = res.ITEMSGRAV;
          if(this.DPedidosGrav !== undefined && this.DPedidosGrav.length > 0){
            this.DPedidosGravAux = this.DPedidosGrav.filter(e => e.APLICACION === 1);
            this.TOT_GRAV = this.DPedidosGravAux.reduce((n, {VALOR}) => n + VALOR, 0);
          }else{
            this.DPedidosGravAux = [];
          }
          this.calcularValores();
          this.setDPedidosItemsValues(res.ITEMS);
        });
    }

    if (obj === 'direcciones' || obj === 'ref') {
      this._sdatos.consulta('DIRECCIONES CLIENTE',{ID_CLIENTE: this.DPedidos.ID_CLIENTE},'VEN-001').subscribe((data: any) => {
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
      this._sdatos.consulta('CONDICIONES LISTAS',{ID_ADC: this.DPedidos.ID_ADC},this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
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
          this.DPlazos = JSON.parse(this.DCondicionLista.find(e => e.CODIGO === this.DPedidos.ID_CONDICION).PLAZOS);
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
          this.DPedidos.ID_MONEDA = this.MONEDA_DEF;
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
          this.DPedidos.ID_UN_ITEM = this.UN_DEF;
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

    if (obj === 'planes produccion' || obj === 'todos') {
      this._sdatos.consulta('PLANES PROD', {}, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== ''){
          this.showModal(res[0].ErrMensaje);
          return;
        
        } else {
          this.DplanesProd = res;
          if (this.DplanesProd && this.DplanesProd.length > 0) {
            // Obtener la menor FECHA_INICIO
            this.FECHA_MIN = this.DplanesProd
              .map((p:any) => new Date(p.FECHA_INICIO))
              .reduce((min:any, curr:any) => curr < min ? curr : min, new Date(this.DplanesProd[0].FECHA_INICIO));

            // Obtener la mayor FECHA_FIN
            this.FECHA_MAX = this.DplanesProd
              .map((p:any) => new Date(p.FECHA_FINAL))
              .reduce((max:any, curr:any) => curr > max ? curr : max, new Date(this.DplanesProd[0].FECHA_FINAL));
          }
        }
      });
    }
  }

  ngOnInit(): void {
    const user:any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: 'PEDIDO',
      aplicacion: 'VEN-155',
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
    this.rowNew = false;
    this._sdatos.accion = 'r_ini';
    
    this.accordionExpand = [false,false,false];
    this.valoresObjetos('todos');
    this.opBlanquearForma();
  }

  ngOnDestroy(){
    this.subscription.unsubscribe();
    this.subscriptionPedidos.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }
}