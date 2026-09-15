import { Component, NgModule, OnInit, TRANSLATIONS, ViewChild } from '@angular/core';
import { lastValueFrom, Subject, Subscription } from 'rxjs';
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
import { clsPedidoGravAux, clsPedidos, clsPedidosGrav, clsPedidosItems, clsPedidosPagos } from './clsVEN229.class';
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
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-VEN229',
  templateUrl: './VEN229.component.html',
  styleUrls: ['./VEN229.component.scss'],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxSelectBoxModule, CdkAccordionModule, DxDropDownBoxModule,
    DxDataGridModule, DxDateBoxModule, DxTextBoxModule, DxNumberBoxModule, DxLoadPanelModule,
    DxButtonModule, VistarapidaComponent, XcSelectboxComponent, COM20001Component,
    XcComboGridComponent, DxCheckBoxModule, DocelecComponent, GeninformesComponent
  ]
})

export class VEN229Component implements OnInit {
  @ViewChild('formPedidoBasico', { static: false }) formPedido: DxFormComponent;
  @ViewChild('formPedidoAdicional', { static: false }) formPedidoAdicional: DxFormComponent;
  @ViewChild("gridPedidoItems", { static: false }) gridPedidoItems: DxDataGridComponent;
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
  isValidacionActivada: boolean = false;
  ID_APLICACION: any = 'VEN-229';
  stylingMode = 'filled';
  dropDownOptions = { width: 700, height: 400, hideOnParentScroll: true, container: '#router-container' };
  dropDownOptionsListBox = { hideOnParentScroll: true, container: '#router-container' };
  dSBEstados = ["REGISTRADO", "ANULADO", "COMPLETADO", "EN PROCESO", "PROGRAMADO"];
  items = ['Datos del Cliente', 'Datos de la Transacción', 'Datos de la Venta'];
  accordionExpand: any;

  //Notificaciones
  toaVisible: boolean;
  toaMessage: string = 'Registro actualizado!';
  toaTipo: string = 'success';
  loadingVisible: boolean = false;

  //Variables de datos
  DPedido: clsPedidos;
  DPedidoPagos: clsPedidosPagos[] = [];
  DPedidoItems: clsPedidosItems[] = [];
  DPedidoGrav: clsPedidosGrav[] = [];
  DPedidoGravAux: clsPedidoGravAux[] = [];
  DItemsAux: any = [];
  DPedido_prev: any;
  DPedidoItems_prev: any;
  DPedidoGrav_prev: any;
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
  DplanesProd: any = [];

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

  maxValueVencimiento: Date = new Date();

  constructor(
    private _sdatos: VEN155Service,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private tabService: TabService
  ) {
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
        this.prmUsrAplBarReg.r_numReg = nx + 1;
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
    switch (operMenu.accion) {
      case 'r_ini':
        const user: any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'Pedido',
          aplicacion: 'VEN-229',
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
        if (this.DPedido.ESTADO !== 'REGISTRADO') {
          this.showModal('Solo se pueden modificar pedidos en estado REGISTRADO');
          return;
        }
        this.mnuAccion = 'update';
        this.readOnly = true;
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
        if (this.DPedido.ESTADO !== 'REGISTRADO') {
          this.showModal('Solo se pueden anular pedidos en estado REGISTRADO');
          return;
        }
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
          if (result.isConfirmed) {
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this.readOnly = true;
            this.readOnlyUdp = true;
            this.esEdicion = false;
            this.esCreacion = false;
            this.esVisibleSelecc = 'none';
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.DPedido = JSON.parse(JSON.stringify(this.DPedido_prev));
            this.DPedidoItems = JSON.parse(JSON.stringify(this.DPedidoItems_prev));
            this.DPedidoGrav = JSON.parse(JSON.stringify(this.DPedidoGrav_prev));
            // this.DPedidoGravAux = this.DPedidoGrav.filter(e => e.APLICACION === 1);
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
        var prmRep = {
          ...operMenu.operacion,
          accion: 'previsualizar',
          aplicacion: this.prmUsrAplBarReg.aplicacion,
          tabla: this.prmUsrAplBarReg.tabla,
          usuario: this.prmUsrAplBarReg.usuario,
          QFiltro: (operMenu.operacion.registro === 'todos')
            ? this.QFiltro
            : " Pedido.ID_DOCUMENTO = '" + this.DPedido.ID_DOCUMENTO + "' AND Pedido.CONSECUTIVO = " + this.DPedido.CONSECUTIVO,
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
          var prmRep = {
            ...operMenu.operacion,
            accion: 'email',
            asunto,
            email_sale,
            especUsuarioEmail: nom_usr,
            nombre: this.DPedido.NOMBRE_CLIENTE,
            email: this.DClientes.find(e => e.ID_CLIENTE === this.DPedido.ID_CLIENTE)?.EMAIL ?? '',
            template,
            replacements: '',
            dataSource: this.DPedido
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
    this.isValidacionActivada = false;
    this.resetValidaciones();

    var now = new Date();
    this.DPedido = {
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
    this.DPedidoItems = [];
    this.DPedidoGravAux = [];
    this.DPedidoPagos = [];
    this.DPedidoGrav = [];
    this.GridSubTotales = [{ key: 'Subtotal', value: 0 }, { key: 'Descuentos', value: 0 }, { key: 'Anticipos', value: 0 }];
    this.gridBoxCliente = [];
    this.gridBoxUN = [];
    this.gridBoxAtributo = [];
    this.gridBoxProducto = [];
    this.gridBoxDocumento = [];
    this.eventsSubjectSboxBodega.next('reset');
    if (this.UN_DEF != null)
      // this.gridBoxUN = [this.UN_DEF];
      this.DPedido.ID_UN_ITEM = '';
    if (this.MONEDA_DEF != null)
      this.gridBoxMoneda = [this.MONEDA_DEF];
    this.DPedido.ID_MONEDA = this.MONEDA_DEF;
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
    this.DPedido_prev = JSON.parse(JSON.stringify(this.DPedido));
    this.DPedidoItems_prev = JSON.parse(JSON.stringify(this.DPedidoItems));
    this.DPedidoGrav_prev = JSON.parse(JSON.stringify(this.DPedidoGrav));
    this.TOT_GRAV = 0;
    this.TOT_ANTICIPOS = 0;
    this.esVisibleCartera = false;
    this.visibleColSoporte = false;

    this.formPedidoAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("disabled", true);
    this.formPedidoAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("value", this.DPedido.FECHA);
    this.formPedidoAdicional.instance.getEditor("PLAZO")?.option("disabled", true);
    this.formPedidoAdicional.instance.getEditor("PLAZO")?.option("value", 0);

    this.valoresObjetos('documento');
  }

  async opPrepararModificar() {
    if (this.DPedido.ESTADO !== 'REGISTRADO') {
      this.showModal('Solo se pueden modificar pedidos en estado REGISTRADO');
      return;
    }
    this.readOnly = true;
    this.readOnlyUdp = true;
    this.esEdicion = true;
    this.esCreacion = false;
    this.iniEdicion = true;

    // Habilita adición de productos y carga lista según condición del pedido
    const dcond = this.DCondicionLista.find(p => p.CODIGO === this.DPedido.ID_CONDICION);
    if (dcond) {
      this.TIPO_CONDLISTA = dcond.TIPO;
    }
    this.valoresObjetos('productos');
    this.enableProductosItems();
  }

  opPrepararGuardar(accion: string): void {
    // Acción validación de datos
    if (!this.ValidaDatos('requerido')) {
      return;
    }

    // Sincroniza formatos para el servidor
    const itemsParaGuardar = this.DPedidoItems.map(item => {
      let pIVA_rate = item.PORC_IVA;
      if (pIVA_rate > 1) pIVA_rate = pIVA_rate / 100;

      const itemRec = { ...item };
      // Sincroniza el objeto GRAVAMENES si existe
      if (itemRec.GRAVAMENES && typeof itemRec.GRAVAMENES === 'object') {
        (itemRec.GRAVAMENES as any).PORCENTAJE = pIVA_rate * 100;
      }

      return {
        ...itemRec,
        POR_IVA: pIVA_rate,        // 0.19
        PORC_IVA: pIVA_rate * 100, // 19
        PORCENTAJE: pIVA_rate * 100 // 19
      };
    });

    const prmDatosGuardar = JSON.parse(
      (JSON.stringify({
        PEDIDOS: this.DPedido,
        ITM_PEDIDOS: itemsParaGuardar,
        PEDIDO_GRAV: this.DPedidoGrav,
        PEDIDO_GRAV_AUX: this.DPedidoGravAux,
        PEDIDO_PAGOS: this.DPedidoPagos,
        ID_APLICACION: this.prmUsrAplBarReg.aplicacion,
        USUARIO: this.prmUsrAplBarReg.usuario
      })).replace(/}{/g, ",")
    );

    // API guardado de datos
    var exito = false;
    this._sdatos
      .save(accion, prmDatosGuardar, this.prmUsrAplBarReg.aplicacion)
      .subscribe((resp) => {
        const res = JSON.parse(resp.data);
        if (res[0].ErrMensaje !== "") {
          this.showModal('', '', res[0].ErrMensaje);

        } else {
          this.readOnly = true;
          this.readOnlyUdp = true;
          this.readOnlyCond = true;
          this.esEdicion = false;
          this.esCreacion = false;
          this.esVisibleSelecc = 'none';

          // Operaciones de barra
          if (this.mnuAccion === 'new') {
            this.QFiltro = " Pedido.ID_DOCUMENTO = '" + this.DPedido.ID_DOCUMENTO + "' AND " +
              " Pedido.CONSECUTIVO = " + this.DPedido.CONSECUTIVO
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
          this.DPedido.DOCUMENTO = res[0].DOCUMENTO;
          this.DPedido.DOCUMENTO_FAC = res[0].DOCUMENTO;
          this.VDatosReg = [this.DPedido];
          this.sbDocumento = res[0].DOCUMENTO;
          this.VDatosReg[0]["PEDIDO_GRAV"] = this.DPedidoGrav;
          this.VDatosReg[0]["PEDIDO_PAGOS"] = this.DPedidoPagos;
          this.TOT_ANTICIPOS = this.DPedidoPagos.reduce((sum: any, item: any) => sum + item.TOTAL, 0);
          // this.opIrARegistro('r_primero');
          showToast('Registro actualizado', 'success');
          this.mnuAccion = '';

          // Inactiva cambios
        }
      });
  }

  opPrepararBuscar(accion): void {
    if (accion === 'filtro') {
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
      const prm = { Pedido: arrFiltro };

      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this._sdatos
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje === '') {
            this.VDatosReg = datares;
            this.DPedido = datares[0];
            this.DPedidoGrav = datares[0].PEDIDO_GRAV;
            this.normalizeGravamenes();
            this.DPedidoPagos = datares[0].PEDIDO_PAGOS;
            this.QFiltro = datares[0].QFILTRO;
            this.TOT_ANTICIPOS = this.DPedidoPagos.reduce((sum: any, item: any) => sum + item.TOTAL, 0);

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
            const user: any = localStorage.getItem('usuario');
            this.prmUsrAplBarReg = {
              tabla: 'Pedido',
              aplicacion: 'VEN-229',
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
    if (this.DPedido.ESTADO !== 'REGISTRADO') {
      this.showModal('Solo se pueden anular pedidos en estado REGISTRADO');
      return;
    }
    Swal.fire({
      title: '',
      text: '',
      html:
        'Desea anular la Pedido <i>' +
        this.DPedido.ID_DOCUMENTO +
        '-' +
        this.DPedido.CONSECUTIVO +
        '</i> ?',
      iconHtml: "<i class='icon-alert-outline'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, anular',
    }).then((result) => {
      // Procesa eliminación. Llama a la API para validar referenciación y eliminación en tabla
      if (result.isConfirmed) {
        this.AccionEliminar();
      }
    });
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = 'r_numreg';
    switch (accion) {
      case 'r_primero':
        this.DPedido = JSON.parse(JSON.stringify(this.VDatosReg[0]));
        this.DPedidoGrav = this.VDatosReg[0].PEDIDO_GRAV;
        this.normalizeGravamenes();
        this.DPedidoPagos = this.VDatosReg[0].PEDIDO_PAGOS;
        this.prmUsrAplBarReg.r_numReg = 1;
        if (this.VDatosReg.length != 0) {
          this.DPedido = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          showToast('No se encontraron Datos', 'error');
          this.readOnly = true;
          this.readOnlyUdp = true;
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.DPedido = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DPedidoGrav = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PEDIDO_GRAV;
        this.normalizeGravamenes();
        this.DPedidoPagos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PEDIDO_PAGOS;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length ? this.VDatosReg.length : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DPedido = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DPedidoGrav = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PEDIDO_GRAV;
        this.normalizeGravamenes();
        this.DPedidoPagos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PEDIDO_PAGOS;
        break;
      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DPedido = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DPedidoGrav = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PEDIDO_GRAV;
        this.normalizeGravamenes();
        this.DPedidoPagos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PEDIDO_PAGOS;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_numreg':
        if (this.prmUsrAplBarReg.r_numReg !== 0) {
          // Valida si hubo cambio de ordenamiento en el visor
          if (this.SVisor.ColSort.Columna !== '') {
            if (this.SVisor.ColSort.Clase === 'asc') {
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
          this.DPedido = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this.DPedidoGrav = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PEDIDO_GRAV;
          this.normalizeGravamenes();
          this.DPedidoPagos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].PEDIDO_PAGOS;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearForma();
          this.resetValidaciones();
          setTimeout(() => {
            this.formPedido.instance.resetValues();
          }, 100);
          return;
        }
        this.readOnly = true;
        this.readOnlyUdp = true;
        break;
      case 'Eliminado':
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          this.DPedido = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
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
      this.DPedido.DOCUMENTO = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].DOCUMENTO_FAC;
      this.DPedido.DOCUMENTO_FAC = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].DOCUMENTO_FAC;
      this.sbDocumento = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].DOCUMENTO_FAC;
      this.loadDataToVariables();
      this._sdatos.accion = 'r_numreg';
      this.readOnly = true;

      // Totales OC
      // this.activarCustomValueSbox(true);
      this.valoresDefecto();

      // Por esoecificacion defecto, no se permite modificar
      if (this.DPedido.ESTADO === 'ANULADO')
        this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: false, r_eliminar: false } };
      else
        this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: true, r_eliminar: true } };
      this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

      // Consulta los otros datos: items, gravamenes, adicionales
      const prm = { ID_DOCUMENTO: this.DPedido.ID_DOCUMENTO, CONSECUTIVO: this.DPedido.CONSECUTIVO };
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
          this.DPedidoItems = res[0].ITM_PEDIDO;
          // Sincroniza porcentaje del servidor al formato de visualización (19 en vez de 0.19)
          this.DPedidoItems.forEach(item => {
            // Revisa ambos campos por si el servidor solo envía uno
            let piva_val = item.PORC_IVA;
            if (piva_val === undefined || piva_val === null) piva_val = item.POR_IVA;
            if (piva_val === undefined || piva_val === null) piva_val = (item as any).PORCENTAJE;

            if (piva_val !== undefined && piva_val !== null) {
              if (piva_val > 0 && piva_val < 1) { // Decimal (e.g., 0.19)
                item.PORC_IVA = piva_val * 100; // Store as integer (19)
                item.POR_IVA = piva_val;        // Store as decimal (0.19)
                (item as any).PORCENTAJE = piva_val * 100; // Store as integer (19)
              } else if (piva_val >= 1) { // Integer (e.g., 19)
                item.PORC_IVA = piva_val;       // Store as integer (19)
                item.POR_IVA = piva_val / 100;  // Store as decimal (0.19)
                (item as any).PORCENTAJE = piva_val; // Store as integer (19)
              } else { // 0 or negative
                item.PORC_IVA = 0;
                item.POR_IVA = 0;
                (item as any).PORCENTAJE = 0;
              }
              item.TOTAL = (item.SUB_TOTAL || 0) + (item.VALOR_IVA || 0); // Enforce sum on load
            } else {
              item.PORC_IVA = 0;
              item.POR_IVA = 0;
              (item as any).PORCENTAJE = 0;
            }
          });
          this.DPedidoGravAux = res[0].PEDIDO_GRAV_AUX;
          this.DPedidoGrav = res[0].PEDIDO_GRAV || [];
          console.log('DPedidoGrav (opIrARegistro):', this.DPedidoGrav);
          this.normalizeGravamenes();
          this.TOT_GRAV = this.DPedidoGrav.reduce((sum: any, item: any) => sum + (item.VALOR || 0), 0);
          this.calcularValores();
          this.visibleColSoporte = this.DPedidoItems[0]?.SOPORTE != "" ? true : false;
          this.readOnlyCond = true;

        });

    } catch (error) {
      this.showModal(error);
    }

  }

  opVista(): void {
    const VDatosRegAux = this.VDatosReg.map(({ ID_DOCUMENTO, PREFIJO, CONSECUTIVO, SUFIJO, FECHA, ID_CLIENTE, TIPO_VENTA, ID_DOC_SOPORTE, ID_ADC, DESCRIPCION, USUARIO, ESTADO }) => ({ ID_DOCUMENTO, PREFIJO, CONSECUTIVO, SUFIJO, FECHA, ID_CLIENTE, TIPO_VENTA, ID_DOC_SOPORTE, ID_ADC, DESCRIPCION, USUARIO, ESTADO }));
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(VDatosRegAux));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'PEDIDOS',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: '',
      Filtro: '',
      keyGrid: ['ID_DOCUMENTO', 'PREFIJO', 'CONSECUTIVO', 'SUFIJO'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opBlanquearForma(): void {
    var now = new Date();
    this.DPedido = {
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
    this.DPedidoItems = [];
    this.DPedidoGravAux = [];
    this.DPedidoGrav = [];
    this.DPedidoPagos = [];
    this.GridSubTotales = [{ key: 'Subtotal', value: 0 }, { key: 'Descuentos', value: 0 }, { key: 'Anticipos', value: 0 }];
    this.gridBoxCliente = [];
    if (this.UN_DEF !== null && this.UN_DEF !== undefined && this.UN_DEF !== '') {
      this.gridBoxUN = [];
      this.DPedido.ID_UN_ITEM = '';
    }
    if (this.MONEDA_DEF !== null && this.MONEDA_DEF !== undefined && this.MONEDA_DEF !== '') {
      this.gridBoxMoneda = [];
    }
    this.DPedido.ID_MONEDA = '';
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
    this.DPedido_prev = JSON.parse(JSON.stringify(this.DPedido));
    this.DPedidoItems_prev = JSON.parse(JSON.stringify(this.DPedidoItems));
    this.DPedidoGrav_prev = JSON.parse(JSON.stringify(this.DPedidoGrav));
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
              const index = this.DPedidoItems.findIndex(a => a.ITEM === key);
              this.DPedidoItems.splice(index, 1);
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

  async onChangeCantidad(rowData: any, value: any, currentRowData: any) {

    // Valida cantidad dependiendo del soporte
    let prmItems = {
      ...currentRowData,
      CANTIDAD: value,
      CANTIDAD_PREV: currentRowData.CANTIDAD,
      SUB_TOTAL: currentRowData.SUB_TOTAL,
      VALOR_IVA: currentRowData.VALOR_IVA,
      PORC_IVA: currentRowData.PORC_IVA,
      TOTAL: currentRowData.TOTAL
    };
    prmItems = { ...prmItems, ...rowData };
    const prm = {
      Pedido: this.DPedido,
      ITEMS: prmItems,
      ID_APLICACION: this.prmUsrAplBarReg.aplicacion,
      USUARIO: this.prmUsrAplBarReg.usuario
    };
    const apiRest = this._sdatos.consulta('actualizar cantidad', prm, "VEN-229");
    const res = await lastValueFrom(apiRest, { defaultValue: true });
    const datRes = JSON.parse(res.data);
    const ix = this.DPedidoItems.findIndex(o => o.ITEM == currentRowData.ITEM);

    var rowIndex = this.gridPedidoItems.instance.getRowIndexByKey(this.keyFila);
    if (datRes[0].ErrMensaje !== "") {
      this.showModal(datRes[0].ErrMensaje, 'error');

      // Restablece cantidad
      // var rowIndex = this.gridMovimientosItems.instance.getRowIndexByKey(this.keyFila);
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD", 0);
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD_REAL", 0);
      rowData.CANTIDAD = 0;
      if (ix !== -1) {
        this.DPedidoItems[ix].CANTIDAD = 0;
      }

    }
    else {
      rowData.CANTIDAD = value;
      const roundedUnitVal = Math.round(currentRowData.VALOR_UNITARIO);
      rowData.SUB_TOTAL = Math.round(rowData.CANTIDAD * roundedUnitVal);
      let porIvaInteger = (currentRowData.PORC_IVA !== undefined && currentRowData.PORC_IVA !== null) ? currentRowData.PORC_IVA : 0;
      let porIvaDecimal = porIvaInteger / 100; // Always use decimal for calculation

      rowData.PORC_IVA = porIvaInteger;
      rowData.POR_IVA = porIvaDecimal;
      rowData.VALOR_IVA = Math.round(rowData.SUB_TOTAL * porIvaDecimal); // Use decimal for calculation
      rowData.TOTAL = rowData.SUB_TOTAL + rowData.VALOR_IVA;

      // Asigna valores al item para sincronizar antes de llamar a valoresObjetos
      if (ix !== -1) {
        this.DPedidoItems[ix].CANTIDAD = rowData.CANTIDAD;
        this.DPedidoItems[ix].SUB_TOTAL = rowData.SUB_TOTAL;
        this.DPedidoItems[ix].VALOR_IVA = rowData.VALOR_IVA;
        this.DPedidoItems[ix].PORC_IVA = rowData.PORC_IVA;
        this.DPedidoItems[ix].POR_IVA = rowData.POR_IVA;
        this.DPedidoItems[ix].TOTAL = rowData.TOTAL;
      }

      // Recalcular el movimiento
      this.valoresObjetos('gravamenes', 'items');
    }

  }

  onEditingStart(e) {
    this.gridBoxProducto = [e.data.PRODUCTO];
  }

  onEditorEnterKey(e) {
    e.event.preventDefault();
    var itemsgru: any = this.formPedido.instance.option('items');
    itemsgru.forEach((g) => {
      var items = g['items'];
      var index = items.findIndex((item) => item.dataField === e.dataField);
      if (index !== -1) {
        var fNextEditor = this.formPedido.instance.getEditor(
          items[++index < items.length ? index : 0].dataField
        );
        if (fNextEditor) fNextEditor.focus();
        return;
      }
    });
  }

  onFocusedRowChanged(e) {
    const rowData = e.row && e.row.data;
    if (rowData) {
      this.gridBoxProducto = [rowData.PRODUCTO]
      this.valoresObjetos('atributos');
    }
  }

  onFocusOutAtributos(e, cellInfo) {
    if (cellInfo.data) {
      cellInfo.data.ATRIBUTO = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onFocusOutClientes(e, cellInfo) {
    if (cellInfo.data) {
      cellInfo.data.ID_CLIENTE = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onFocusOutProductos(e, cellInfo) {
    if (cellInfo.data) {
      cellInfo.data.PRODUCTO = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onRowPrepared(e) {
    if (e.rowType === "data") {
      if (e.data.isEdit) {
        // e.rowElement.style.backgroundColor = 'lightyellow';
        const className: string = e.rowElement.className;
        e.rowElement.className = className + ' row-modified-focused';
      }
    }
    if (e.rowType === "header" && e.rowIndex === 2 && !this.esEdicion) {
      e.rowElement.style.display = "none";
    }
  }

  onRowValidating(e: any) {
    const data = { ...e.oldData, ...e.newData };
    // Valida completitud
    if (!data.PRODUCTO || data.CANTIDAD === 0) {
      e.isValid = false;
      showToast('Faltan completar datos del Producto', 'warning');
      return;
    }

    // Validar duplicado por Producto + Fecha
    const duplicado = this.DPedidoItems.some(item =>
      item.ITEM !== data.ITEM &&
      item.PRODUCTO === data.PRODUCTO &&
      this.fechasIguales(item.FECHA_ENTREGA, data.FECHA_ENTREGA)
    );

    if (duplicado) {
      e.isValid = false;
      e.errorText = `El producto ${data.PRODUCTO} ya existe con la misma fecha de entrega.`;
    }
  }

  onSeleccDocumento(e: any): void {
    this.sbDocumento = e.value;
    this.DPedido.DOCUMENTO = e.value;
    this.DPedido.DOCUMENTO_FAC = e.value;
    this.enableProductosItems();
    if (this._sdatos.accion == 'r_nuevo') {
      this.DPedido.ID_DOCUMENTO = this.DDocumentos.find(p => p.DOCUMENTO === e.value).ID_DOCUMENTO;
      this.DPedido.CONSECUTIVO = this.DDocumentos.find(p => p.DOCUMENTO === e.value).CONSECUTIVO;
    }
  }

  onSelectionBodega(e: any) {
    var ANT_BODEGA = this.DPedido.ID_UN_BODEGA;

    // Verificar si hay productos en el grid y se está cambiando la bodega
    if (this.DPedido.ID_UN_BODEGA != e.value && this.DPedidoItems.length > 0) {
      Swal.fire({
        title: '',
        text: 'Está cambiando la Bodega ' + this.DPedido.ID_UN_BODEGA + ' por ' + e.value + ', esto borrará los Productos asociados, ¿Desea Continuar?',
        iconHtml: "<i class='icon-alert-outline'></i>",
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#438ef1',
        cancelButtonText: 'No',
        confirmButtonText: 'Sí, Borrar',
      }).then((result) => {
        if (result.isConfirmed) {
          this.DPedidoItems = [];
          this.DPedido.ID_UN_BODEGA = e.value;
          this.enableProductosItems();
          // Actualiza lista de productos/precios para la nueva bodega si hay condición seleccionada
          if (this.DPedido.ID_CONDICION !== '') {
            this.valoresObjetos('productos', this.conExistencias ? 'SI' : undefined);
          }
        } else {
          // Revertir la selección si el usuario cancela
          // Necesitamos encontrar la referencia del componente de bodega para revertir
          // Como es un componente personalizado, intentamos revertir el valor
          setTimeout(() => {
            this.DPedido.ID_UN_BODEGA = ANT_BODEGA;
          }, 100);
          return;
        }
      });
    } else {
      // Si no hay productos o no hay cambio, actualizar normalmente
      this.DPedido.ID_UN_BODEGA = e.value;
      this.enableProductosItems();

      // Si hay una condición seleccionada, refrescar precios para la nueva bodega
      if (this.DPedido.ID_CONDICION !== '') {
        this.valoresObjetos('productos', this.conExistencias ? 'SI' : undefined);
      }
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
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0) {
      this.DPedido.ID_CLIENTE = e.selectedRowsData[0].ID_CLIENTE;
      this.DPedido.NOMBRE_CLIENTE = e.selectedRowsData[0].NOMBRE_COMPLETO;
      this.DPedido.ID_UBICACION = e.selectedRowsData[0].ID_UBICACION;
      this.DPedido.DIRECCION = e.selectedRowsData[0].DIRECCION;

      if (this._sdatos.accion != 'r_nuevo')
        this.loadDatos();

      this.isGridBoxCliOpened = false;
      this.valoresObjetos('direcciones');
      this.enableProductosItems();
    }
  }

  onSelectionCondicion(e) {
    var ANT_COND = this.DPedido.ID_CONDICION;
    if (e.name === 'value') {
      this.isGridBoxCondicionOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0) {
      if (this.DPedido.ID_CONDICION != e.selectedRowsData[0].CODIGO && this.DPedidoItems.length > 0) {
        Swal.fire({
          title: '',
          text: 'Está cambiando la Condición ' + this.DPedido.ID_CONDICION + ' por ' + e.selectedRowsData[0].CODIGO + ', esto borrará los Productos asociados, ¿Desea Continuar?',
          iconHtml: "<i class='icon-alert-outline'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, Borrar',
        }).then((result) => {
          if (result.isConfirmed) {
            this.DPedidoItems = [];
            this.DPedido.ID_CONDICION = e.selectedRowsData[0].CODIGO;
          } else {
            // this.gridBoxCondicion = [(this.DPedido.ID_CONDICION != ANT_COND ? ANT_COND : this.DPedido.ID_CONDICION)];
            this.ddCondicion.instance.option("value", ANT_COND)
            this.DPedido.ID_CONDICION = ANT_COND;
            return;
          }
        });
      }
      this.DPedido.ID_CONDICION = e.selectedRowsData[0].CODIGO;
      this.TIPO_CONDLISTA = e.selectedRowsData[0].TIPO;

      const dcond = this.DCondicionLista.find(p => p.CODIGO === this.DPedido.ID_CONDICION);

      // Lista de plazos - actualizar siempre
      if (dcond && dcond.PLAZOS) {
        this.DPlazos = JSON.parse(dcond.PLAZOS);
      } else {
        this.DPlazos = [{ "PLAZO": 1 }];
      }

      // Actualizar el valor del plazo seleccionado
      if (this.DPlazos != null && this.DPlazos.length == 1) {
        this.DPedido.PLAZO = this.DPlazos[0].PLAZO;
        this.sbPlazo = this.DPlazos[0].PLAZO;
        // Forzar actualización del select de plazo
        setTimeout(() => {
          this.xs__PLAZO?.instance.option("value", this.DPlazos[0].PLAZO);
        }, 100);
      } else {
        // Si hay múltiples plazos, limpiar la selección
        // this.DPedido.PLAZO = null;
        // this.sbPlazo = null;
        // setTimeout(() => {
        //   this.xs__PLAZO?.instance.option("value", null);
        // }, 100);
      }

      // Manejo de fecha de vencimiento
      if (this.DPedido.TIPO_VENTA == ' ') {
        // Asignacion de fecha de vencimiento
        if (dcond && dcond.DIAS_VENC) {
          const fechaTmp = new Date(this.DPedido.FECHA);
          fechaTmp.setDate(fechaTmp.getDate() + dcond.DIAS_VENC);
          this.DPedido.FECHA_PRIMER_VENC = fechaTmp;
        }
        else
          this.DPedido.FECHA_PRIMER_VENC = this.DPedido.FECHA;
        this.formPedidoAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("value", this.DPedido.FECHA_PRIMER_VENC);

      }
      else {
        this.formPedidoAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("disabled", true);
      }

      this.valoresObjetos('productos');
      this.isGridBoxCondicionOpened = false;
      this.enableProductosItems();
      this.DPedido.ID_CONDICION = e.selectedRowsData[0].CODIGO;
      const maxValue = this.DCondicionLista.find(p => p.CODIGO === this.DPedido.ID_CONDICION)?.DIAS_VENC;
      const fechaLimiteVencimiento = this.DPedido.FECHA ? new Date(this.DPedido.FECHA) : new Date();

      this.maxValueVencimiento.setDate(fechaLimiteVencimiento.getDate() + maxValue);
    }
  }

  onSelectionMoneda(e) {
    if (e.name === 'value') {
      this.isGridBoxMonedaOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0) {
      this.DPedido.ID_MONEDA = e.selectedRowsData[0].ID_MONEDA;
      this.isGridBoxMonedaOpened = false;
    }
  }

  onSelectionADC(e) {
    if (e.name === 'value') {
      this.isGridBoxADCOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0) {
      this.DPedido.ID_ADC = e.selectedRowsData[0].ID_ADC;
      this.valoresObjetos('condicion');
      this.isGridBoxADCOpened = false;
      this.enableProductosItems();
      if (this.DPedido.TIPO_VENTA != '')
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
  onKeyDownListaPro(e, cellInfo: any) {
    this.ddProductos.instance.open();
  }
  onInputListaPro(e, cellInfo: any) {
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
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0) {
      this.DPedido.ID_UN_ITEM = e.selectedRowsData[0].ID_UN;
      this.isGridBoxUNOpened = false;
      this.valoresObjetos('bodegas');
      this.enableProductosItems();
    }
  }

  onSeleccDireccion(e: any) {
    this.DPedido.DIRECCION = e.value;
  }

  onSeleccPlazo(e: any) {
    this.DPedido.PLAZO = e.value;
    if (this.DPedido.PLAZO > 0) {
      this.esVisibleCartera = true;
    }
    this.setValoresCartera();
  }

  onSeleccRowAtributo(e, cellInfo, datacompo) {
    if (e.data) {
      cellInfo.data.ATRIBUTO = e.data.VALOR;
      this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "ATRIBUTO", cellInfo.data.ATRIBUTO);
      datacompo.close();
      this.isGridBoxAtrOpened = false;
    }
  }

  onSeleccRowCliente(e, cellInfo, datacompo) {
    if (e.data) {
      cellInfo.data.ID_CLIENTE = e.data.ID_CLIENTE;
      this.DPedido.NOMBRE_CLIENTE = this.DClientes.find(p => p.ID_CLIENTE === cellInfo.data.ID_CLIENTE).NOMBRE_COMPLETO;
      this.isGridBoxCliOpened = false;
    }
  }

  async onSeleccRowProducto(e, cellInfo, datacompo) {
    // if (e.data){
    //   cellInfo.data.PRODUCTO = e.data.PRODUCTO;
    //   this.gridBoxProducto = [e.data.PRODUCTO];
    //   cellInfo.data.NOMBRE = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO).NOMBRE;
    //   this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "NOMBRE_PRODUCTO", cellInfo.data.NOMBRE);
    //   cellInfo.data.PERFIL_TRIBUTARIO = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO).PERFIL_TRIBUTARIO;
    //   this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "GRAVAMENES", cellInfo.data.PERFIL_TRIBUTARIO);
    //   cellInfo.data.VALOR_UNITARIO = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO).PRECIO;
    //   this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", cellInfo.data.VALOR_UNITARIO);
    //   cellInfo.data.PORC_IVA = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO).PORC_IVA;
    //   this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "PORC_IVA", cellInfo.data.PORC_IVA);
    //   datacompo.close();
    //   this.isGridBoxProdOpened = false;
    //   this.valoresObjetos('atributos');
    // }

    if (e.selectedRowKeys && e.selectedRowKeys.length > 0) {
      // Producto seleccionado
      const proSelecc = e.selectedRowKeys[0];

      console.log("Productos", e)
      console.log("Cell Info", cellInfo)
      //Valida si el producto esta asignado a la bodega de Destino y tiene existencias.
      const UN_DES: any = this.DPedido.ID_UN_ITEM;
      const prm: any = {
        PRODUCTO: proSelecc,
        PRESENTACION: 'SI',
        MOVIMIENTO: "PEDIDO",
        TIPO: "PEDIDO",
        TIPO_CONDICION: this.TIPO_CONDLISTA,
        ID_CONDICION: this.DPedido.ID_CONDICION,
        PLAZO: this.DPedido.PLAZO,
        ID_CLIENTE: this.DPedido.ID_CLIENTE,
        ID_UN_BODEGA: this.DPedido.ID_UN_BODEGA
      };
      const apiRest = this._sdatos.consulta('EXISTENCIAS PRODUCTO', prm, this.prmUsrAplBarReg.aplicacion);
      let res = await lastValueFrom(apiRest, { defaultValue: true });
      res = JSON.parse(res.data);
      if (res[0].ErrMensaje !== '') {
        cellInfo.data.PRODUCTO = '';
        showToast(res[0].ErrMensaje, 'error');
        return;
      }

      console.log(res);

      cellInfo.data.PRODUCTO = proSelecc;
      const dnompro = res[0];
      this.DProductosLista = res;
      if (dnompro) {
        cellInfo.data.VALOR_UNITARIO = dnompro.VALOR_BASE;
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "NOMBRE_PRODUCTO", dnompro.NOMBRE);
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", dnompro.VALOR_BASE);
        const tasaIvaGen = dnompro.IVAS.find(iva => iva.ID_TASA === 'IV-GEN');
        let porcentajeIVA_from_server = tasaIvaGen ? tasaIvaGen.PORCENTAJE : 0;
        let porcentajeIVA_integer = 0; // For PORC_IVA (e.g., 19)
        let porcentajeIVA_decimal = 0; // For POR_IVA (e.g., 0.19)

        if (porcentajeIVA_from_server > 0 && porcentajeIVA_from_server < 1) {
          porcentajeIVA_integer = porcentajeIVA_from_server * 100;
          porcentajeIVA_decimal = porcentajeIVA_from_server;
        } else if (porcentajeIVA_from_server >= 1) {
          porcentajeIVA_integer = porcentajeIVA_from_server;
          porcentajeIVA_decimal = porcentajeIVA_from_server / 100;
        }

        cellInfo.data.PORC_IVA = porcentajeIVA_integer;
        cellInfo.data.POR_IVA = porcentajeIVA_decimal;
        cellInfo.data.GRAVAMENES = tasaIvaGen;
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "PORC_IVA", porcentajeIVA_integer);
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "POR_IVA", porcentajeIVA_decimal);
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "GRAVAMENES", tasaIvaGen);
        // Calcula IVA inicial localmente para evitar el parpadeo a 0
        const roundedPriceBase = Math.round(dnompro.VALOR_BASE);
        const subtotalLocal = Math.round(roundedPriceBase * (cellInfo.data.CANTIDAD || 0));
        const ivaLocal = Math.round(subtotalLocal * porcentajeIVA_decimal); // Use decimal for calculation
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "SUB_TOTAL", subtotalLocal);
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "VALOR_IVA", ivaLocal);
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "TOTAL", subtotalLocal + ivaLocal);


        // Presentación
        if (dnompro.PRESENTACION) {
          const dpres = dnompro.PRESENTACION;
          this.DListaUMVenta = dpres;

          if (dpres.length >= 1) {

            const dcanreal = dpres[0].CANTIDAD_PRES * dpres[0].CANTIDAD_EQUIV;
            cellInfo.data.VALOR_UNITARIO = dnompro.VALOR_BASE;
            cellInfo.data.VALOR_BASE = dnompro.VALOR_BASE;
            cellInfo.data.CANTIDAD_PRES = dpres[0].CANTIDAD_PRES;
            cellInfo.data.CANTIDAD_EQUIV = dpres[0].CANTIDAD_EQUIV;
            this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "UDM_VENTA", dpres[0].UDM_VENTA);
            // this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", dpres[0].CANTIDAD_PRES);
            this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", dpres[0].UDM_EQUIV);
            // this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", dpres[0].CANTIDAD_EQUIV);
            // this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", cellInfo.data.VALOR_UNITARIO);
            this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", dcanreal);
          } else {
            cellInfo.data.VALOR_UNITARIO = 0;
            this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "UDM_VENTA", "");
            // this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", "");
            this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", "");
            // this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", "");
            // this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", 0);
            this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", 0);
          }
        }
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "PORC_IVA", cellInfo.data.PORC_IVA);
        // this.valoresObjetos('atributos');
        setTimeout(() => {
          var rowIndex = cellInfo.component.getRowIndexByKey(cellInfo.key);
          // cellInfo.component.editCell(rowIndex, 'PRODUCTO');
          // e.component.focus();
          cellInfo.component.focus(this.gridPedidoItems.instance.getCellElement(rowIndex, "PRODUCTO"));
        }, 300);

        console.log("Todos comlpeto", cellInfo.data)

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
    const dum = this.DListaUMVenta.find((u: any) => u.UDM_VENTA == e.value);
    if (this.DPedidoItems.findIndex((d: any) => d.PRODUCTO === cellInfo.data.PRODUCTO && d.UDM_VENTA === e.value) === -1) {
      if (dum) {
        cellInfo.data.UDM_COMPRA = dum.UDM_COMPRA;
        cellInfo.data.UDM_EQUIV = dum.UDM_EQUIV;
        cellInfo.data.CANTIDAD_EQUIV = dum.CANTIDAD_EQUIV;
        cellInfo.data.CANTIDAD_PRES = dum.CANTIDAD_PRES;
        cellInfo.data.VALOR_UNITARIO = dum.PRECIO;
        const dcanreal = dum.CANTIDAD_PRES * dum.CANTIDAD_EQUIV * cellInfo.data.CANTIDAD;
        cellInfo.data.CANTIDAD_REAL = dcanreal;

        // Recalcular valores después de actualizar el precio
        const roundedPriceUM = Math.round(cellInfo.data.VALOR_UNITARIO);
        cellInfo.data.SUB_TOTAL = Math.round(cellInfo.data.CANTIDAD * roundedPriceUM);
        const porIvaInteger = cellInfo.data.PORC_IVA !== undefined ? cellInfo.data.PORC_IVA : 0;
        const porIvaDecimal = porIvaInteger / 100; // Use decimal for calculation
        cellInfo.data.VALOR_IVA = Math.round(cellInfo.data.SUB_TOTAL * porIvaDecimal);
        cellInfo.data.TOTAL = cellInfo.data.SUB_TOTAL + cellInfo.data.VALOR_IVA;

        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "UDM_COMPRA", cellInfo.data.UDM_COMPRA);
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", cellInfo.data.UDM_EQUIV);
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", cellInfo.data.CANTIDAD_EQUIV);
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", cellInfo.data.CANTIDAD_PRES);
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", cellInfo.data.VALOR_UNITARIO);
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", cellInfo.data.CANTIDAD_REAL);
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "SUB_TOTAL", cellInfo.data.SUB_TOTAL);
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "VALOR_IVA", cellInfo.data.VALOR_IVA);
        this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "TOTAL", cellInfo.data.TOTAL);

        // Recalcular totales del documento
        this.calcularValores();
      }
    } else {
      cellInfo.data.UDM_COMPRA = '';
      cellInfo.data.UDM_EQUIV = '';
      cellInfo.data.CANTIDAD_EQUIV = '';
      cellInfo.data.CANTIDAD_PRES = '';
      cellInfo.data.VALOR_UNITARIO = 0;
      cellInfo.data.CANTIDAD_REAL = 0;
      this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "UDM_COMPRA", "");
      this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", "");
      this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", "");
      this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", "");
      this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", 0);
      this.gridPedidoItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", 0);
      showToast('La Unidad de venta está repetida.', 'error');
    }
  }

  onSeleccTipoVenta(e) {
    this.DPedido.TIPO_VENTA = e.value;
    console.log("Tipo venta - plazos", this.DPlazos);
    this.DPlazos = this.DPedido.TIPO_VENTA != 'CREDITO' ? [{ PLAZO: 0 }] : this.DPlazos;
    if (this.DPedido.TIPO_VENTA == 'CREDITO') {
      this.formPedidoAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("disabled", false);
    }

    else {
      console.log(this.DPedido.FECHA)
      this.formPedidoAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("disabled", true);
      this.formPedidoAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("value", this.DPedido.FECHA);
      this.DPedido.FECHA_PRIMER_VENC = this.DPedido.FECHA;
      this.formPedidoAdicional.instance.getEditor("PLAZO")?.option("disabled", true);
      this.xs__PLAZO.instance.option("value", 0)
      this.DPedido.PLAZO = 0;
    }

    // Activa/Desactiva edición de condición
    this.valoresObjetos('condicion');
    if (this.DPedido.ID_ADC != '')
      this.readOnlyCond = false;
    else
      this.readOnlyCond = true;

  }

  onValueChangedFechaEntrega(e: any, cellInfo: any) {
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
    const prm = { PEDIDOS: { ID_DOCUMENTO: this.DPedido.ID_DOCUMENTO, PREFIJO: this.DPedido.PREFIJO, CONSECUTIVO: this.DPedido.CONSECUTIVO, SUFIJO: this.DPedido.SUFIJO } };
    this._sdatos
      .delete('delete', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== '') {
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

  calcularValores() {
    this.DPedido.SUB_TOTAL = this.DPedidoItems.reduce((n, { SUB_TOTAL }) => n + (SUB_TOTAL || 0), 0);
    // this.TOT_GRAV = this.DPedidoGravAux.reduce((n, {VALOR}) => n + VALOR, 0);
    this.TOT_GRAV = this.DPedidoGrav ? this.DPedidoGrav.reduce((sum: any, item: any) => sum + (item.VALOR || 0), 0) : 0;
    this.DPedido.TOTAL = this.DPedido.SUB_TOTAL - this.TOT_ANTICIPOS + this.TOT_GRAV;
    //Aqui se construye la grid de Subtotales
    this.GridSubTotales = [{ key: 'Subtotal', value: this.DPedido.SUB_TOTAL }, { key: 'Descuentos', value: this.DPedido.VALOR_DESCUENTO }, { key: 'Anticipos', value: this.TOT_ANTICIPOS }];
    this.setValoresCartera();
  }

  normalizeGravamenes() {
    console.log('normalizeGravamenes - Antes:', this.DPedidoGrav);
    if (this.DPedidoGrav) {
      this.DPedidoGrav.forEach(grav => {
        let t = parseFloat(grav.POR_TASA?.toString() || '0');
        // 1. Normaliza escala decimal a porcentaje (0.19 -> 19)
        if (t > 0 && t < 1) {
          grav.POR_TASA = t * 100;
        } else if (t === 0) {
          // 2. Fallback: Si el servidor devuelve 0 pero los items tienen IVA, forzamos 19% para visualización
          const itConIva = this.DPedidoItems.find(it => (it.PORC_IVA || 0) > 0);
          if (itConIva && (grav.ID_TASA?.includes('IVA') || grav.CLASE?.includes('IVA'))) {
            grav.POR_TASA = itConIva.PORC_IVA;
          }
        }

        // 3. Fallback Cálculos: Si el valor es 0 pero tenemos base y tasa, calculamos localmente
        if (grav.VALOR === 0 && (grav.POR_TASA || 0) > 0 && (grav.BASE || 0) > 0) {
          grav.VALOR = Math.round(grav.BASE * (grav.POR_TASA / 100));
        }
      });
    }
    console.log('normalizeGravamenes - Despues:', this.DPedidoGrav);
  }

  cambiosItemForma(e, accion = 'activar') {
    if (accion === 'activar') {
      if (!this.iniEdicion && !this.readOnly) {
        if (!e.dataField.match('__obj__')) {
          var dataField = e.dataField;
          document.getElementsByName(dataField)[0].classList.add('is-dirty');
        } else {
          var dataField = e.dataField.replace('__obj__', '');
          document.getElementById(dataField)?.classList.add('is-dirty');
        }
      }
    } else {
      if (!e.dataField.match('__obj__')) {
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
    return args.date < (this.DPedido == null || this.DPedido.FECHA == null ? today : this.DPedido.FECHA);
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
    this.DPedido.FECHA_PRIMER_VENC = e.value;
  }


  // onValueChangedFechaOC(e: any) {
  //   this.DPedido.FECHA_OC = e.value;
  //   // Si el tipo de venta es CONTADO, actualizar también la fecha de vencimiento
  //   if (this.DPedido.TIPO_VENTA == 'CONTADO') {
  //     this.DPedido.FECHA_PRIMER_VENC = e.value;
  //     this.formPedidoAdicional.instance.getEditor("FECHA_PRIMER_VENC")?.option("value", e.value);
  //   }
  // }

  // Activa items de la grid
  enableProductosItems() {
    if (this.DPedido.DOCUMENTO == '' ||
      this.DPedido.ID_CLIENTE == '' ||
      this.DPedido.FECHA == '' ||
      this.DPedido.ID_UN_ITEM == '' ||
      this.DPedido.ID_ADC == '' ||
      this.DPedido.ID_CONDICION == '' ||
      this.DPedido.PLAZO == null
    ) {
      this.rowNew = false;
    } else {
      this.rowNew = true;
    }

  }

  imprimirReporte(id_reporte, archivo, datosrpt) {
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

  initNewRow(e) {
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
    e.data.FECHA_ENTREGA = this.DPedido.FECHA;
    if (this.DPedidoItems.length > 0) {
      const item = this.DPedidoItems.reduce((ant, act) => { return (ant.ITEM > act.ITEM) ? ant : act })
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    e.data.isEdit = false;
  }

  insertedRow(e) {
    this.setItemValues();
    this.rowApplyChanges = false;
  }

  insertingRow(e) {
    this.conCambios++;
    e.data.isEdit = true;
    // Valida datos
    if (e.data.PRODUCTO === '') {
      showToast('Faltan completar datos del Producto', 'warning');
      e.cancel = true;
    }
  }

  loadDatos() {
    this.loadDataToVariables();
    this.esVisibleCartera = (this.DPedido.PLAZO > 0 ? true : false);
  }

  loadDataToVariables() {
    this.gridBoxCliente = [this.DPedido.ID_CLIENTE];
    this.gridBoxUN = [this.DPedido.ID_UN_ITEM];
    this.gridBoxMoneda = [this.DPedido.ID_MONEDA];
    this.gridBoxCondicion = [this.DPedido.ID_CONDICION];
    this.gridBoxADC = [this.DPedido.ID_ADC];
    this.sbDocumento = this.DPedido.DOCUMENTO;
    this.sbTipoVenta = this.DPedido.TIPO_VENTA;
    this.sbIdDireccion = this.DPedido.DIRECCION;
    this.sbPlazo = this.DPedido.PLAZO;
  }

  loadManualDatatables() {
    this.valoresObjetos('direcciones');
    this.valoresObjetos('condicion');
    this.setDocumentoToDatatable();
  }

  removedRow(e) {
    this.setItemValues();
    this.rowApplyChanges = false;
  }

  resetValidaciones() {
    this.formPedido?.instance?.resetValues();
    this.formPedidoAdicional?.instance?.resetValues();
  }

  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  setValoresCartera() {
    this.DPedido.VALOR_CUOTA = Math.round((this.DPedido.TOTAL - this.DPedido.CUOTA_INICIAL) / this.DPedido.PLAZO);
  }

  setDocumentoToDatatable() {
    this.DDocumentos = [];
    this.DDocumentos.push({ ID_DOCUMENTO: this.DPedido.ID_DOCUMENTO, CONSECUTIVO: this.DPedido.CONSECUTIVO, DOCUMENTO: this.DPedido.ID_DOCUMENTO + '-' + this.DPedido.CONSECUTIVO });
  }

  setDItemsAux() {
    this.DItemsAux = this.DPedidoItems;
    for (const item of this.DItemsAux) {
      item.APLICACION = 2
    }
  }

  setDPedidoItemsValues(data) {
    for (const item of data) {
      for (const DItem of this.DPedidoItems) {
        if (item.ITEM === DItem.ITEM) {
          DItem.GRAVAMENES = item.GRAV;
          DItem.VALOR_IVA = item.VALOR_IVA;
          DItem.TOTAL = item.TOTAL;
        }
      }
    }
  }

  onGridContReadyGrav(e) {
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

  setItemValues() {
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

  updatedRow(e) {
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
      this.DPedido.ID_MONEDA = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'ID_MONEDA_DEF')?.VALOR_DEFECTO ?? '';
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
    var rowIndex = this.gridPedidoItems.instance.getRowIndexByKey(this.keyFila);
    const canPro = this.gridPedidoItems.instance.cellValue(rowIndex, "CANTIDAD");
    const valUnit = this.gridPedidoItems.instance.cellValue(rowIndex, "VALOR_UNITARIO");
    let porIva_from_selection = e.addedItems[0].PORCENTAJE;
    let porIvaInteger = 0; // For PORC_IVA (e.g., 19)
    let porIvaDecimal = 0; // For POR_IVA (e.g., 0.19)

    if (porIva_from_selection > 0 && porIva_from_selection < 1) {
      porIvaInteger = porIva_from_selection * 100;
      porIvaDecimal = porIva_from_selection;
    } else if (porIva_from_selection >= 1) {
      porIvaInteger = porIva_from_selection;
      porIvaDecimal = porIva_from_selection / 100;
    }

    const roundedValUnit = Math.round(valUnit);
    const subtotalVal = Math.round(canPro * roundedValUnit);
    const valIva = Math.round(porIvaDecimal * subtotalVal);
    this.gridPedidoItems.instance.cellValue(rowIndex, "SUB_TOTAL", subtotalVal);
    this.gridPedidoItems.instance.cellValue(rowIndex, "VALOR_IVA", valIva);
    this.gridPedidoItems.instance.cellValue(rowIndex, "PORC_IVA", porIvaInteger);
    this.gridPedidoItems.instance.cellValue(rowIndex, "POR_IVA", porIvaDecimal);
    this.gridPedidoItems.instance.cellValue(rowIndex, "TOTAL", subtotalVal + valIva);
    this.gridPedidoItems.instance.cellValue(rowIndex, "GRAVAMENES", e.addedItems[0]);
    this.gridPedidoItems.instance.cellValue(rowIndex, "GRAV_ORG", e.addedItems[0]);

    // Actualiza el data source
    const nx = this.DPedidoItems.findIndex(it => it.ITEM == this.gridPedidoItems.instance.cellValue(rowIndex, "ITEM"));
    if (nx !== -1) {
      this.DPedidoItems[nx].VALOR_IVA = valIva;
      this.DPedidoItems[nx].PORC_IVA = porIvaInteger;
      this.DPedidoItems[nx].POR_IVA = porIvaDecimal;
      this.DPedidoItems[nx].SUB_TOTAL = subtotalVal;
      this.DPedidoItems[nx].TOTAL = subtotalVal + valIva;
      this.DPedidoItems[nx].GRAVAMENES = e.addedItems[0];
      this.DPedidoItems[nx].GRAV_ORG = e.addedItems[0];
    }

    this.valoresObjetos('gravamenes');
  }

  // Ejecuta acciones de settings
  async operacionesSettings(datos) {

    // Opcion seleccionada
    const opcion = datos.data.VALOR;
    const config = datos.data.CONFIG != "" ? JSON.parse(datos.data.CONFIG) : { MODO: 'edicion' };
    const modoOper = config.MODO;

    // Solo en modo edición
    if (this.mnuAccion != "update" && this.mnuAccion != "new" && modoOper != 'consulta') {
      this.showModal('Esta operación no está permitida en modo consulta.');
      return;
    }

    // Trae la configuación de la opción seleccionada
    const prm: any = {
      ACCION: opcion,
      ID_APLICACION: this.prmUsrAplBarReg.aplicacion,
      USUARIO: this.prmUsrAplBarReg.usuario,
      Pedido: this.DPedido,
      ITM_Pedido: this.DPedidoItems,
      PEDIDO_PAGOS: this.DPedidoPagos,
    };
    const apiRest = this._sdatos.consulta('acciones settings', prm, this.prmUsrAplBarReg.aplicacion);
    let res = await lastValueFrom(apiRest, { defaultValue: true });
    res = JSON.parse(res.data);
    if (res[0].ErrMensaje !== '') {
      showToast(res[0].ErrMensaje, 'error');
      return;
    }

    // Ejecuta acción
    switch (res[0].tipoAccion) {

      case "popup":
        const itemsSelecc = this.DPedidoPagos.map(({ ITEM }) => ({ ITEM }));
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
        const datPedido = {
          DOCUMENTO: this.DPedido.DOCUMENTO,
          ID_DOCUMENTO: this.DPedido.ID_DOCUMENTO,
          NC_DOCUMENTO: this.DPedido.CONSECUTIVO.toString(),
          FECHA: this.DPedido.FECHA,
          CLIENTE: this.DPedido.ID_CLIENTE + ' ' + this.DPedido.NOMBRE_CLIENTE,
          EMAIL: res[0].EMAIL ?? "",
          ID_EMPRESA: this.empresa,
          NIT_EMPRESA: res[0].NIT_EMPRESA.toString() ?? "",
          CUFE: res[0].dataElecStatus.length != 0 ? res[0].dataElecStatus[0].CUFE ?? "" : "",
          QR: res[0].dataElecStatus.length != 0 ? res[0].dataElecStatus[0].QR ?? "" : "",
          tipoDocElectronico: 'Pedido'
        }
        this.eventsSubjectDocElec.next({
          dataSource: datPedido,
          dataElecStatus: res[0].dataElecStatus,
          visible: true,
          titulo: "Pedido electrónica"
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
      if (total > this.DPedido.SUB_TOTAL + this.TOT_GRAV) {
        this.showModal('El valor total de los anticipos no puede ser mayor al valor total de la Pedido.');
        return;
      }
      this.TOT_ANTICIPOS = total;
      this.DPedidoPagos = e.rowsSelected;
      this.calcularValores();
    }

    if (e.titulo == 'Cargar Pedido') {
      // Total seleccionado
      const prm: any = {
        ACCION: e.titulo,
        ID_APLICACION: this.prmUsrAplBarReg.aplicacion,
        USUARIO: this.prmUsrAplBarReg.usuario,
        Pedido: this.DPedido,
        ITM_Pedido: this.DPedidoItems,
        PEDIDO_PAGOS: this.DPedidoPagos,
        DATOS: e.rowsSelected
      };
      const apiRest = this._sdatos.consulta('cargar datos', prm, this.prmUsrAplBarReg.aplicacion);
      let res = await lastValueFrom(apiRest, { defaultValue: true });
      res = JSON.parse(res.data);
      if (res[0].ErrMensaje !== '') {
        showToast(res[0].ErrMensaje, 'error');
        return;
      }

      // Asocia datos a los items
      this.DPedidoItems = res[0].ITM_Pedido.map(item => {
        return { ...item, TOTAL: (item.SUB_TOTAL || 0) + (item.VALOR_IVA || 0) };
      });
      // Gravamenes asociados
      this.DPedidoGrav = res[0].DATA_GRAV[0].ENCAB ? res[0].DATA_GRAV[0].ENCAB : [];
      this.normalizeGravamenes();
      this.DPedidoGravAux = res[0].DATA_GRAV[0].ITEMS ? res[0].DATA_GRAV[0].ITEMS : [];
      this.TOT_GRAV = this.DPedidoGrav.reduce((sum: any, item: any) => sum + (item.VALOR || 0), 0);
      this.calcularValores();
      this.visibleColSoporte = true;

      // Deshabilita edición de datos generales
      if (this.DPedidoItems.length > 0)
        this.readOnly = true;
      else
        this.readOnly = false;

    }

  }

  onRespuestaDocelec(e) {
  }

  // Color status del ESTADO del pedido
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
    if (Accion === "requerido") {
      this.isValidacionActivada = true;

      // Sincroniza campos desde los combos (UI) al modelo (DPedido) antes de validar
      // Esto previene que campos que parecen llenos fallen la validación interna
      if (this.gridBoxMoneda.length > 0) this.DPedido.ID_MONEDA = this.gridBoxMoneda[0];
      if (this.gridBoxUN.length > 0) this.DPedido.ID_UN_ITEM = this.gridBoxUN[0];
      if (this.gridBoxCondicion.length > 0) this.DPedido.ID_CONDICION = this.gridBoxCondicion[0];
      if (this.gridBoxADC.length > 0) this.DPedido.ID_ADC = this.gridBoxADC[0];
      if (this.gridBoxCliente.length > 0) this.DPedido.ID_CLIENTE = this.gridBoxCliente[0];

      const vBasico = this.formPedido.instance.validate();
      const vAdicional = this.formPedidoAdicional.instance.validate();

      if (this.DPedido.DOCUMENTO == "" || this.DPedido.FECHA == null || this.DPedido.ID_CLIENTE == "" || this.DPedido.ID_UN_ITEM == '' || this.DPedido.ID_MONEDA == '' || this.DPedido.ID_ADC == "" || this.DPedido.TIPO_VENTA == "" || this.DPedido.ID_CONDICION == "" || this.DPedido.FECHA_PRIMER_VENC == null) {
        if (this.DPedido.DOCUMENTO == '') msg += 'Documento ,';
        if (this.DPedido.FECHA == null) msg += 'Fecha ,';
        if (this.DPedido.ID_CLIENTE == '') msg += 'Cliente ,';
        if (this.DPedido.ID_UN_ITEM == '') msg += 'Unidad de Negocio ,';
        if (this.DPedido.ID_MONEDA == '') msg += 'Moneda ,';
        if (this.DPedido.ID_ADC == '') msg += 'Vendedor ,';
        if (this.DPedido.TIPO_VENTA == '') msg += 'Tipo de Venta ,';
        if (this.DPedido.ID_CONDICION == '') msg += 'Condición ,';
        if (this.DPedido.FECHA_PRIMER_VENC == null) msg += 'Fecha Vencimiento ,';
        this.showModal('Error al guardar', "Faltan datos", "Hay datos incompletos del Pedido. Revisar contenido de los items: " + msg.slice(0, -1));
        return false;
      }
      if (this.DPedidoItems === undefined || this.DPedidoItems.length == 0) {
        this.showModal('Error al guardar', "Faltan datos", "No se ha asociado ningún Producto al Pedido");
        return false;
      }
      if (this.DPedido.FECHA_PRIMER_VENC < this.DPedido.FECHA && this.DPedido.FECHA_PRIMER_VENC != '') {
        this.showModal('Error al guardar', "Validación", "La Fecha de Vencimiento no debe ser menor a la Fecha del Pedido");
        return false;
      }
    }
    return true;
  }

  valoresObjetos(obj: string, opcion: any = undefined) {
    if (obj === 'documento' || obj === 'ref') {
      const prm = {
        ID_APLICACION: 'VEN-229',
        USUARIO: localStorage.getItem('usuario')
      };
      this._sdatos
        .consulta('DOCUMENTOS CONSECUTIVO', prm, 'ADM-007')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DDocumentos = res;
          if (this.DDocumentos != null && this.DDocumentos.length === 1) {
            this.sbDocumento = this.DDocumentos[0].DOCUMENTO;
            this.DPedido.DOCUMENTO = this.DDocumentos[0].DOCUMENTO;
            this.DPedido.ID_DOCUMENTO = this.DDocumentos[0].ID_DOCUMENTO;
            this.DPedido.CONSECUTIVO = this.DDocumentos[0].CONSECUTIVO;
          }
        });
    }

    if (obj === 'productos' || obj === 'ref') {
      const prm = {
        ID_LISTA: this.DPedido.ID_CONDICION,
        TIPO: this.TIPO_CONDLISTA,
        PLAZO: this.DPedido.PLAZO,
        CON_EXIS: opcion,
        ID_UN_BODEGA: this.DPedido.ID_UN_BODEGA
      };
      const accion = 'PRODUCTOS LISTA PRECIOS';
      this._sdatos.consulta(accion, prm, 'PRO-022').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);

        }
        this.DProductos = res;
        this.DPlazos = res.length > 0 ? res[0].PLAZOS : [];

      });
    }

    if (obj === 'clientes' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('CLIENTES', { ESTADO: 'ACTIVO' }, 'VEN-001').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DClientes = res;
        if (this.DPedido && this.DPedido.ID_CLIENTE) {
          this.gridBoxCliente = [this.DPedido.ID_CLIENTE];
        }
      });
    }

    if (obj === 'adc' || obj === 'todos' || obj === 'ref') {
      const prm = { ESTADO: 'ACTIVO' }
      this._sdatos.consulta('ADC', prm, 'VEN-006').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DADC = res;
        if (this.DPedido && this.DPedido.ID_ADC) {
          this.gridBoxADC = [this.DPedido.ID_ADC];
        }
      });
    }

    if (obj === 'tipo venta' || obj === 'todos' || obj === 'ref') {
      const prm = { ID_DOMINIO: 'FACTURA', ID_GRUPO_DOMINIO: 'TIPO VENTA' };
      this._sdatos
        .consulta('ITM_DOMINIOS', prm, 'ADM012')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DTiposVenta = res;
        });
    }

    if (obj === 'gravamenes' || obj === 'ref') {
      var prm = {};
      // Sincroniza formatos para el servidor
      const itemsParaServidor = this.DPedidoItems.map(item => {
        let pIVA_rate = item.PORC_IVA;
        if (pIVA_rate > 1) pIVA_rate = pIVA_rate / 100;

        const itemRec = { ...item };
        // Sincroniza el objeto GRAVAMENES si existe
        if (itemRec.GRAVAMENES && typeof itemRec.GRAVAMENES === 'object') {
          (itemRec.GRAVAMENES as any).PORCENTAJE = pIVA_rate * 100;
        }

        return {
          ...itemRec,
          POR_IVA: pIVA_rate,        // 0.19
          PORC_IVA: pIVA_rate * 100, // 19
          PORCENTAJE: pIVA_rate * 100 // 19
        };
      });

      if (opcion !== 'original')
        prm = {
          PEDIDO: this.DPedido,
          ITEMS: itemsParaServidor, APL_GRAV: opcion
        };
      else
        prm = {
          PEDIDO: this.DPedido,
          ITEMS: itemsParaServidor, OPCION_GRAV: opcion
        };
      this._sdatos
        .consulta('GRAVAMENES', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          // this.DPedidoGrav = res.ITEMSGRAV;
          // if(this.DPedidoGrav !== undefined && this.DPedidoGrav.length > 0){
          //   this.DPedidoGravAux = this.DPedidoGrav.filter(e => e.APLICACION === 1);
          //   this.TOT_GRAV = this.DPedidoGravAux.reduce((n, {VALOR}) => n + VALOR, 0);
          // }else{
          //   this.DPedidoGravAux = [];
          // }
          this.DPedidoGrav = res[0].ENCAB ? res[0].ENCAB : [];
          this.normalizeGravamenes();
          console.log('Datos Gravamenes Resumen Normalizados:', this.DPedidoGrav);
          this.DPedidoGravAux = res[0].ITEMS ? res[0].ITEMS : [];
          this.TOT_GRAV = this.DPedidoGrav.reduce((sum: any, item: any) => sum + item.VALOR, 0);
          this.calcularValores();
          // this.setDPedidoItemsValues(res.ITEMS);

          // Aplica a los items
          if (opcion !== undefined) {
            this.DPedidoItems.forEach(item => {
              const nx = this.DPedidoGravAux.findIndex(gi => gi.ITEM == item.ITEM);
              if (nx > -1) {
                // Solo sobrescribe con valores del servidor si estos son positivos (> 0)
                // Esto protege los cálculos locales si el servidor devuelve ceros durante la sincronización asíncrona
                item.VALOR_IVA = (this.DPedidoGravAux[nx].VALOR_IVA > 0) ? this.DPedidoGravAux[nx].VALOR_IVA : (item.VALOR_IVA || 0);
                item.SUB_TOTAL = (this.DPedidoGravAux[nx].SUB_TOTAL > 0) ? this.DPedidoGravAux[nx].SUB_TOTAL : (item.SUB_TOTAL || 0);
                item.TOTAL = item.SUB_TOTAL + item.VALOR_IVA; // Force sum as per user requirement

                // Sincroniza porcentaje del servidor al formato de visualización (19 en vez de 0.19)
                let pivaRes = (this.DPedidoGravAux[nx] as any).PORC_IVA;
                if (pivaRes === undefined || pivaRes === null || pivaRes === 0) pivaRes = (this.DPedidoGravAux[nx] as any).POR_IVA;
                if (pivaRes === undefined || pivaRes === null || pivaRes === 0) pivaRes = (this.DPedidoGravAux[nx] as any).PORCENTAJE;

                if (pivaRes !== undefined && pivaRes !== null) {
                  if (pivaRes > 0 && pivaRes < 1) { // Decimal (e.g., 0.19)
                    item.PORC_IVA = pivaRes * 100; // Store as integer (19)
                    item.POR_IVA = pivaRes;        // Store as decimal (0.19)
                  } else if (pivaRes >= 1) { // Integer (e.g., 19)
                    item.PORC_IVA = pivaRes;       // Store as integer (19)
                    item.POR_IVA = pivaRes / 100;  // Store as decimal (0.19)
                  }
                }

                item.GRAVAMENES = this.DPedidoGravAux[nx].GRAVAMENES || item.GRAVAMENES;
                item.GRAV_TOTAL = this.DPedidoGravAux[nx].GRAV_TOTAL || item.GRAV_TOTAL;

                // Refresca la fila en el grid para asegurar visibilidad de los cambios
                const rowIndex = this.gridPedidoItems.instance.getRowIndexByKey(item.ITEM);
                if (rowIndex > -1) {
                  this.gridPedidoItems.instance.repaintRows([rowIndex]);
                }
              }
            });
          }

        });
    }

    if (obj === 'direcciones' || obj === 'ref') {
      this._sdatos.consulta('DIRECCIONES CLIENTE', { ID_CLIENTE: this.DPedido.ID_CLIENTE }, 'VEN-001').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DDirecciones = res;
        if (this.DDirecciones.length == 1) {
          this.DPedido.DIRECCION = this.DDirecciones[0].DIRECCION;
          this.sbIdDireccion = this.DPedido.DIRECCION;
        }
      });
    }

    if (obj === 'un' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('UNIDADES NEGOCIOS',
        {
          ESTADO: 'ACTIVO',
          USUARIO: this.prmUsrAplBarReg.usuario,
          ID_APLICACION: this.prmUsrAplBarReg.aplicacion
        }, 'ADM-002').
        subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DUnidadesNegocios = res;
          if (this.DPedido && this.DPedido.ID_UN_ITEM) {
            this.gridBoxUN = [this.DPedido.ID_UN_ITEM];
          }
        });
    }

    if (obj == 'bodegas') {
      this._sdatos.consulta('BODEGAS',
        {
          ESTADO: 'ACTIVO',
          MOVIMIENTO: 'PEDIDO',
          ID_UN_ITEM: this.DPedido.ID_UN_ITEM,
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
            displayExpr: (item) => item ? `${item.ID_UN_BODEGA} - ${item.DESCRIPCION}` : "",
            style: { width: 700, colWidth: [33, 33, 33] },
            columnData: ["ID_UN_BODEGA", "DESCRIPCION", "NOMBRE_UN"],
            valueData: this.DPedido.ID_UN_BODEGA
          });

        });
    }

    if (obj === 'monedas' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('MONEDAS', { ESTADO: 'ACTIVO' }, 'ADM-004').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DMonedas = res;
        if (this.DPedido && this.DPedido.ID_MONEDA) {
          this.gridBoxMoneda = [this.DPedido.ID_MONEDA];
        }
      });
    }

    if (obj === 'condicion' || obj === 'ref') {
      this._sdatos.consulta('CONDICIONES LISTAS',
        {
          ID_ADC: this.DPedido.ID_ADC,
          TIPO_VENTA: this.DPedido.TIPO_VENTA,
          ESTADO: 'ACTIVO'
        },
        this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DCondicionLista = res;
          if (this.DPedido && this.DPedido.ID_CONDICION) {
            this.gridBoxCondicion = [this.DPedido.ID_CONDICION];
          }
          if (this.DCondicionLista[0].CODIGO === null) {
            showToast('El Vendedor seleccionado no tiene Condiciones de Venta asociadas', 'warning');
          }
          if (this._sdatos.accion === 'r_buscar') {
            this.DPlazos = JSON.parse(this.DCondicionLista.find(e => e.CODIGO === this.DPedido.ID_CONDICION).PLAZOS);
          }
        });
    }

    if (obj === 'moneda def' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('ESPECIFICACIONES', { ID_ESPECIFICACION: 'OBJETOS', ID_APLICACION: 'GENERAL', NOMBRE_OBJETO: 'DEF_MONEDA' }, 'ADM-011').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DMonedaDef = res;
        if (this.DMonedaDef != null) {
          this.MONEDA_DEF = this.DMonedaDef[0].VALOR_DEFECTO
          this.gridBoxMoneda = [this.MONEDA_DEF];
          this.DPedido.ID_MONEDA = this.MONEDA_DEF;
        }
      });
    }

    if (obj === 'un def' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('UN DEFECTO', { USUARIO: this.prmUsrAplBarReg.usuario }, 'ADM-015').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res != null && res.length > 0) {
          this.UN_DEF = res[0].ID_UN;
          if (obj !== 'ref' || !this.DPedido.ID_UN_ITEM) {
            this.gridBoxUN = [];
            this.DPedido.ID_UN_ITEM = '';
          }
        }
      });
    }

    if (obj === 'formato moneda' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('ESPECIFICACIONES', { ID_ESPECIFICACION: 'OBJETOS', ID_APLICACION: 'GENERAL', NOMBRE_OBJETO: 'FORMATO MONEDA' }, 'ADM-011').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.MONEDA_FORMATO = res[0].FORMATO;
      });
    }

    if (obj === 'formato cantidad' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('ESPECIFICACIONES', { ID_ESPECIFICACION: 'OBJETOS', ID_APLICACION: 'GENERAL', NOMBRE_OBJETO: 'FORMATO CANTIDAD' }, 'ADM-011').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
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

    // if (obj === 'planes produccion' || obj === 'todos') {
    //   this._sdatos.consulta('PLANES PROD', {}, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
    //     const res = JSON.parse(data.data);
    //     if ( (data.token != undefined)){
    //       const refreshToken = data.token;
    //       localStorage.setItem("token", refreshToken);
    //     }
    //     if (res[0].ErrMensaje !== ''){
    //       this.showModal(res[0].ErrMensaje);
    //       return;

    //     } else {
    //       this.DplanesProd = res;
    //       if (this.DplanesProd && this.DplanesProd.length > 0) {
    //         // Obtener la menor FECHA_INICIO
    //         this.FECHA_MIN = this.DplanesProd
    //           .map((p:any) => new Date(p.FECHA_INICIO))
    //           .reduce((min:any, curr:any) => curr < min ? curr : min, new Date(this.DplanesProd[0].FECHA_INICIO));

    //         // Obtener la mayor FECHA_FIN
    //         this.FECHA_MAX = this.DplanesProd
    //           .map((p:any) => new Date(p.FECHA_FINAL))
    //           .reduce((max:any, curr:any) => curr > max ? curr : max, new Date(this.DplanesProd[0].FECHA_FINAL));
    //       }
    //     }
    //   });
    // }

  }

  ngOnInit(): void {
    const user: any = localStorage.getItem('usuario');
    this.empresa = localStorage.getItem('empresa') ?? '';
    this.prmUsrAplBarReg = {
      tabla: 'Pedido',
      aplicacion: 'VEN-229',
      usuario: user,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: {}
    };

    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';
    this.readOnly = true;
    this.readOnlyUdp = true;
    this.rowNew = false;
    this._sdatos.accion = 'r_ini';

    this.accordionExpand = [true, true, true];
    this.valoresObjetos('todos');
    this.opBlanquearForma();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  cargarExcelProductos() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls, .csv, .txt';

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files?.length) return;

      const file: File = target.files[0];
      const reader = new FileReader();

      reader.onload = (event: ProgressEvent<FileReader>) => {
        const data = event.target?.result;
        if (data) {
          this.procesarArchivoUniversal(data, file.name);
        }
      };

      // Leemos como ArrayBuffer para manejar correctamente formatos binarios de Excel
      reader.readAsArrayBuffer(file);
    };

    input.click();
  }

  parsearFecha(fechaStr: any): any {
    if (!fechaStr || typeof fechaStr !== 'string') return fechaStr;
    const parts = fechaStr.split('/');
    if (parts.length === 3) {
      // Consideramos formato dd/mm/yyyy
      const fecha = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      return isNaN(fecha.getTime()) ? fechaStr : fecha;
    }
    return fechaStr;
  }

  fechasIguales(f1: any, f2: any): boolean {
    if (!f1 || !f2) return false;
    const d1 = f1 instanceof Date ? f1 : new Date(f1);
    const d2 = f2 instanceof Date ? f2 : new Date(f2);
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }

  procesarArchivoUniversal(data: any, fileName: string) {
    try {
      this.loadingVisible = true;
      const workbook = XLSX.read(data, { type: 'buffer', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convertimos la hoja a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'dd/mm/yyyy' });

      if (!jsonData || jsonData.length === 0) {
        showToast('El archivo está vacío o no contiene datos válidos.', 'warning');
        this.loadingVisible = false;
        return;
      }

      // Función interna para procesar la carga una vez confirmada
      const ejecutarCarga = () => {
        const prm = {
          ARCHIVO: jsonData,
          NOMBRE_ARCHIVO: fileName,
          Pedido: this.DPedido
        };

        console.log("prm", prm)

        this._sdatos.consulta('EXISTENCIAS PRODUCTOS MASIVO', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
          this.loadingVisible = false;
          const res = JSON.parse(data.data);

          if (!Array.isArray(res)) {
            showToast('La respuesta del servidor no tiene el formato esperado.', 'error');
            return;
          }

          // El servidor puede devolver un error general en el primer elemento
          if (res.length > 0 && res[0].ErrMensaje && res[0].ErrMensaje != '') {
            this.showModal(res[0].ErrMensaje, 'Error al procesar archivo');
            return;
          }

          let erroresPorMensaje: { [key: string]: string[] } = {};
          let nuevosItems: clsPedidosItems[] = [];

          // Comportamiento reemplazativo: se vacía la lista actual y se reinicia el contador de items
          let lastItemNum = 0;

          res.forEach((item: any) => {
            if (item.ErrMensaje && item.ErrMensaje !== '') {
              const msg = item.ErrMensaje.trim();
              if (!erroresPorMensaje[msg]) {
                erroresPorMensaje[msg] = [];
              }
              if (item.PRODUCTO && !erroresPorMensaje[msg].includes(item.PRODUCTO)) {
                erroresPorMensaje[msg].push(item.PRODUCTO);
              }
            } else {
              const fEntrega = this.parsearFecha(item.FECHA_ENTREGA);
              // Validar duplicados en el mismo archivo (Producto + Fecha)
              if (nuevosItems.some(ni => ni.PRODUCTO === item.PRODUCTO && this.fechasIguales(ni.FECHA_ENTREGA, fEntrega))) {
                const msg = `El producto ${item.PRODUCTO} está repetido en el archivo con la misma fecha de entrega.`;
                if (!erroresPorMensaje[msg]) erroresPorMensaje[msg] = [];
                if (!erroresPorMensaje[msg].includes(item.PRODUCTO)) {
                  erroresPorMensaje[msg].push(item.PRODUCTO);
                }
                return; // Salta este item duplicado
              }
              // Lógica de selección de IVA (Prioridad IV-GEN)
              let ivaSeleccionado: any = null;
              if (item.IVAS && item.IVAS.length > 0) {
                ivaSeleccionado = item.IVAS.find((v: any) => v.ID_TASA === 'IV-GEN');
                if (!ivaSeleccionado) ivaSeleccionado = item.IVAS[0];
              }

              const cantidad = item.CANTIDAD_SOLICITADA || 0;
              const precio = item.PRECIO || 0;
              const subtotal = Math.round(cantidad * precio);

              let porcIva = 0;
              let valIva = 0;
              if (ivaSeleccionado) {
                porcIva = ivaSeleccionado.PORCENTAJE || 0;
                valIva = Math.round(subtotal * (porcIva / 100));
              }

              lastItemNum++;

              const nuevoProducto: any = {
                ITEM: lastItemNum,
                PRODUCTO: item.PRODUCTO,
                NOMBRE_PRODUCTO: item.NOMBRE, // Se mantiene para visualización en grid
                CANTIDAD: cantidad,
                VALOR_UNITARIO: precio,
                VALOR_BASE: precio,
                SUB_TOTAL: subtotal,
                VALOR_IVA: valIva,
                PORC_IVA: porcIva,
                POR_IVA: porcIva / 100,
                TOTAL: subtotal + valIva,
                UDM_VENTA: item.UDM_EQUIV,
                FECHA_ENTREGA: fEntrega,
                GRAVAMENES: ivaSeleccionado,
                GRAV_ORG: ivaSeleccionado,
                // Campos requeridos por el modelo
                ID_UN: this.DPedido.ID_UN,
                ID_UN_ITEM: this.DPedido.ID_UN_ITEM,
                CONSECUTIVO: this.DPedido.CONSECUTIVO,
                ID_DOCUMENTO: this.DPedido.ID_DOCUMENTO,
                PREFIJO: this.DPedido.PREFIJO,
                ID_MONEDA: this.DPedido.ID_MONEDA,
                VALOR_DESCUENTO: 0,
                VALOR_COSTOS: 0,
                ESTADO: 'REGISTRADO'
              };

              nuevosItems.push(nuevoProducto);
            }
          });

          if (nuevosItems.length > 0) {
            // Asignación directa para limpiar y llenar
            this.DPedidoItems = nuevosItems;
            this.calcularValores();
            showToast(`Se cargaron ${nuevosItems.length} productos correctamente`, 'success');
          }

          const listaErrores = Object.keys(erroresPorMensaje).map(msg => {
            const productos = erroresPorMensaje[msg];
            return productos.length > 0 ? `<b>${msg}:</b> ${productos.join(', ')}` : msg;
          });

          if (listaErrores.length > 0) {
            const contenidoHtml = `<div style="text-align: left; max-height: 300px; overflow-y: auto;">- ${listaErrores.join('<br>- ')}</div>`;
            this.showModal('Algunos productos no pudieron cargarse', 'Resumen de Errores', contenidoHtml);
          }

        }, (err) => {
          this.loadingVisible = false;
          this.showModal('Error de conexión con el servidor.', 'Error');
        });
      };

      // Si hay productos en la grid, pedimos confirmación antes de borrar
      if (this.DPedidoItems.length > 0) {
        Swal.fire({
          title: '¿Sobrescribir productos?',
          text: 'Se borrarán los productos actuales de la rejilla para cargar los del archivo. ¿Desea continuar?',
          iconHtml: "<i class='icon-alert-outline'></i>",
          showCancelButton: true,
          confirmButtonColor: '#438ef1',
          cancelButtonColor: '#DF3E3E',
          confirmButtonText: 'Sí, borrar y cargar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            ejecutarCarga();
          } else {
            this.loadingVisible = false;
          }
        });
      } else {
        ejecutarCarga();
      }

    } catch (error) {
      this.loadingVisible = false;
      this.showModal('Error al leer el archivo Excel. Asegúrate de que sea un formato válido.', 'Error');
      console.error(error);
    }
  }
}
