import { Component, LOCALE_ID, NgModule, OnInit, ViewChild } from '@angular/core';
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
import {
  DxButtonModule, DxCheckBoxComponent, DxCheckBoxModule, DxDataGridComponent, DxDataGridModule, DxDateBoxComponent, DxDateBoxModule, DxDropDownBoxComponent, DxDropDownBoxModule,
  DxFormComponent, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxSelectBoxComponent, DxSelectBoxModule,
  DxTextBoxModule,
  DxTooltipComponent,
  DxTooltipModule
} from 'devextreme-angular';
import { clsOrdenCompra, clsOrdenCompraGrav, clsOrdenCompraGravItems, clsOrdenCompraItems } from './clsCOM200.class';
import notify from 'devextreme/ui/notify';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule, DatePipe, formatNumber } from '@angular/common';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { showToast } from '../../shared/toast/toastComponent.js';
import { XcSelectboxComponent } from 'src/app/shared/xc-selectbox/xc-selectbox.component';
import DataSource from 'devextreme/data/data_source';
import { COM20001Component } from './COM20001/COM20001.component';
import { validatorRes } from 'src/app/shared/validator/validator';
import { on } from 'devextreme/events';
import { XcComboGridComponent } from 'src/app/shared/xc-combo-grid/xc-combo-grid.component';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { FemailComponent } from 'src/app/shared/femail/femail.component';
import { COM200Service } from 'src/app/services/COM200/COM200.service';
import { ActivatedRoute } from '@angular/router';
import { libtools } from 'src/app/shared/common/libtools';
import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';
import { FiltrobusqComponent } from 'src/app/shared/filtrobusq/filtrobusq.component';
import { SocketService } from 'src/app/services/socket/socket.service';
registerLocaleData(localeEs, 'es');

@Component({
  selector: 'app-COM200',
  templateUrl: './COM200.component.html',
  styleUrls: ['./COM200.component.scss'],
  providers: [{ provide: LOCALE_ID, useValue: 'es' }],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxSelectBoxModule, CdkAccordionModule, DxDropDownBoxModule,
    DxDataGridModule, DxDateBoxModule, DxTextBoxModule, DxNumberBoxModule, DxLoadPanelModule,
    DxButtonModule, VistarapidaComponent, XcSelectboxComponent, DxTooltipModule,
    COM20001Component, XcComboGridComponent, DxCheckBoxModule, FemailComponent,
    FiltrobusqComponent
  ]
})

export class COM200Component implements OnInit {
  @ViewChild('formOrdenCompra', { static: false }) formOrdenCompra: DxFormComponent;
  @ViewChild("gridOrdenCompraItems", { static: false }) gridOrdenCompraItems: DxDataGridComponent;
  @ViewChild("xs_FECHA_ENTREGA", { static: false }) fechaEntrega: DxDateBoxComponent;
  @ViewChild("checkProSoloPrecio", { static: false }) checkProSoloPrecio: DxCheckBoxComponent;
  @ViewChild("checkProProveedor", { static: false }) checkProProveedor: DxCheckBoxComponent;
  @ViewChild("xs_PRODUCTOS", { static: false }) sboxProductos: DxSelectBoxComponent;
  @ViewChild("gridProLista", { static: false }) gridProLista: DxDataGridComponent;
  @ViewChild("ddProductos", { static: false }) ddProductos: DxDropDownBoxComponent;
  @ViewChild(DxTooltipComponent) tooltip: DxTooltipComponent;

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
  readOnlyForm: boolean;
  readOnlyUdp: boolean;
  mnuAccion: string;
  DGridSubTotales: any = [];
  gridBoxAtributo: string[] = [];
  gridBoxProveedor: string[] = [];
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
  esInicioDatos: boolean = false;
  esCreacion: boolean = false;
  esInicioObj: any;
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
  ID_APLICACION: any = 'COM-200';
  stylingMode = 'filled';
  dropDownOptions: any = {
    width: 800, 
    height: 500, 
    hideOnParentScroll: true,
    container: '#router-container',
    // toolbarItems: [{
    //   location: 'before',
    //   toolbar: 'top',
    //   template: 'tempEncab',
    //   style: 'padding: 0 !important'
    // }]
  };
  dropDownOptionsListBox = { hideOnParentScroll: true, container: '#router-container' };
  dSBEstados = ["REGISTRADO", "ANULADO", "COMPLETADO", "EN PROCESO"];
  items = ['Datos del Proveedor', 'Datos de la Compra'];
  accordionExpand: any;
  eventsSubjectSboxMoneda: Subject<any> = new Subject<any>();
  eventsSubjectSboxDoc: Subject<any> = new Subject<any>();
  eventsSubjectSboxProv: Subject<any> = new Subject<any>();
  eventsSubjectSboxBodega: Subject<any> = new Subject<any>();
  eventsSubjectSboxCond: Subject<any> = new Subject<any>();
  eventsSubjectSboxPlazo: Subject<any> = new Subject<any>();
  eventsSubjectSboxTinv: Subject<any> = new Subject<any>();
  eventsSubjectSboxProducto: Subject<any> = new Subject<any>();
  eventsSubjectIvas: Subject<any> = new Subject<any>();
  eventsSubjectGridTasas: Subject<any> = new Subject<any>();
  eventsSubjectEnvioCorreo: Subject<any> = new Subject<any>();
  eventsSubjectFiltro: Subject<any> = new Subject<any>();
  visibleIvas: boolean = false;
  keyFila: any;
  setValueHandler: any;
  infoIva: any;
  customValueSbox: boolean = false;
  labelLocation: string = 'left';

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

  //Notificaciones
  toaVisible: boolean;
  toaMessage: string = 'Registro actualizado!';
  toaTipo: string = 'success';
  loadingVisible: boolean = false;

  //Variables de datos
  DOrdenCompra: clsOrdenCompra;
  DOrdenCompraItems: clsOrdenCompraItems[] = [];
  DOrdenCompraGrav: clsOrdenCompraGrav[] = [];
  DOrdenCompraGravItems: clsOrdenCompraGravItems[] = [];
  DItemsAux: any = [];
  DOrdenCompra_prev: any;
  DOrdenCompraItems_prev: any;
  DOrdenCompraGrav_prev: any;
  DProductos: any;
  DProductosLista: any;
  DProveedores: any;
  DDocumentos: any;
  DUnidadMedida: any;
  DTiposVenta: any;
  DListasPrecios: any;
  DGravamenes: any;
  DListaUMCompra: any;
  DADC: any;
  DAtributos: any;
  DDirecciones: any;
  DBodegas: any;
  DMonedas: any;
  DCondiciones: any;
  DPlazos: any;
  DTipoInv: any;
  DMonedaDef: any;
  especAplicacion: any;
  intervalHora: any;
  intervalLogNoEmail: any;
  logEmailNoEnviados: any;

  // Datos reporte
  rpt_id_reporte: string;
  rpt_archivo: string;
  rpt_datosrpt: any;
  rpt_registro: string;
  listaReportes: any[] = [];

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esNuevaFila: boolean = false;
  esVisibleSelecc: string = 'none';
  ltool: any;

  // tooltips
  TooltipTarget: any;
  ToolTipText: string;

  constructor(
    private _sdatos: COM200Service,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private _sgenerales: GeneralesService,
    private datepipe: DatePipe,
    private tabService: TabService,
    public socket: SocketService,
    private route: ActivatedRoute
  ) {
    // Servicio de barra de registro
    this.subscription = this._sbarreg.getObsRegApl().subscribe((datreg) => {
      // Valida si la petición es para esta aplicacion
      if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opMenuRegistro(datreg);
    });

    // Respuesta del filtro
    // this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe(resp => {
    //   // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
    //   const dfiltro = JSON.parse(resp);
    //   if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
    //     this.opPrepararBuscar(resp);
    // });

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

    // Servicio comunicacion entre pestañas
    this.subscriptionPedidos = this._sdatos
      .getObs_Ordenes()
      .subscribe((datreg) => {
        // Ejecuta de acuerdo al componente hijo
        switch (datreg.componente) {
          case 'atributos':
            break;

          default:
            break;
        }
      });

    this.ltool = new libtools(this._sbarreg, this.tabService);
    this.onScroll = this.onScroll.bind(this);
    this.valoresDefecto = this.valoresDefecto.bind(this);
    this.disableDates = this.disableDates.bind(this);
    this.onChangeFecha = this.onChangeFecha.bind(this);
    this.onSeleccRowProducto = this.onSeleccRowProducto.bind(this);
    this.onChangeProducto = this.onChangeProducto.bind(this);
    this.onCellPrepared = this.onCellPrepared.bind(this);
    this.onSoloProPrecio = this.onSoloProPrecio.bind(this);
    this.onSoloProProveedor = this.onSoloProProveedor.bind(this);
    this.getSizeQualifier = this.getSizeQualifier.bind(this);
    this.customizeColumnsSearch = this.customizeColumnsSearch.bind(this);

  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes
    this._sdatos.accion = operMenu.accion;
    switch (operMenu.accion) {
      case 'r_ini':
        const user: any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'ORDENES_COMPRA',
          aplicacion: 'COM-200',
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
        this.readOnlyForm = false;
        this.readOnlyUdp = false;
        this.esVisibleSelecc = 'always';
        this.gridOrdenCompraItems.instance.deselectAll();
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.readOnly = false;
        this.readOnlyForm = false;
        this.readOnlyUdp = true;
        this.esVisibleSelecc = 'always';
        this.gridOrdenCompraItems.instance.deselectAll();
        this.opPrepararModificar();
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
        if (this.VDatosReg.length > 0) {
          this.copiarOrden();
        } else {
          showToast('Consulte la orden a copiar', 'error');
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
          iconHtml: "<i class='icon-alert-ol'></i>",
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
            this.readOnlyForm = true;
            this.readOnlyUdp = true;
            this.esEdicion = false;
            this.esCreacion = false;
            this.esVisibleSelecc = 'none';
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.DOrdenCompra = JSON.parse(JSON.stringify(this.DOrdenCompra_prev));
            this.DOrdenCompraItems = JSON.parse(JSON.stringify(this.DOrdenCompraItems_prev));
            this.DOrdenCompraGrav = JSON.parse(JSON.stringify(this.DOrdenCompraGrav_prev));
            // this.DOrdenCompraGravItems = this.DOrdenCompraGrav.filter(e => e.APLICACION === 1);
            this.opIrARegistro('r_numreg');

            // Restituye los valores
            this.mnuAccion = '';
            clearInterval(this.intervalHora);
          }
        });

        break;

      case 'r_vista':
        this.opVista();
        break;

      case 'r_refrescar':
        this.valoresObjetos('todos');
        break;

      case 'r_imprimir':
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
          case 'Log de eventos':
            break;

          case 'Ordenes sin email enviado':
            this.valoresObjetos('log email');
            break;

          default:
            break;
        }
        break;

      default:
        break;
    }
  }

  opPrepararNuevo(): void {
    this.readOnly = false;
    this.readOnlyForm = false;
    this.readOnlyUdp = false;
    this.esEdicion = true;
    this.esCreacion = true;
    this.esInicioObj = { sboxIniProducto: true };
    this.iniEdicion = true;
    this.customValueSbox = false;
    this.opBlanquearForma();
    if (!this.esInicioDatos)
      this.valoresObjetos('todos');
    else
      this.valoresObjetos('documento');

    setTimeout(() => {
      // this.DOrdenCompra.FECHA_ENTREGA = new Date();
      this.DOrdenCompra.FECHA_ENTREGA = '';
      this.DOrdenCompra.TIPO_INVENTARIO = 'NUEVO';
      this.esInicioDatos = true;
      this.valoresDefecto();
      // this.activarCustomValueSbox(false);
    }, 500);

    this.intervalHora = setInterval(() => {
      this.DOrdenCompra.HORA = new Date();
    }, 1000);

  }

  copiarOrden(): void {
    this.mnuAccion = 'new';
    this.esVisibleSelecc = 'always';
    this.gridOrdenCompraItems.instance.deselectAll();
    this.readOnly = false;
    this.readOnlyForm = false;
    this.readOnlyUdp = false;
    this.esEdicion = true;
    this.esCreacion = true;
    this.esInicioObj = { sboxIniProducto: true };
    this.iniEdicion = true;
    this.customValueSbox = false;
    if (!this.esInicioDatos)
      this.valoresObjetos('todos');
    else
      this.valoresObjetos('documento');

    setTimeout(() => {
      this.DOrdenCompra.FECHA_REGISTRO = new Date();
      this.DOrdenCompra.FECHA_SOLICITUD = new Date();
      this.DOrdenCompra.FECHA_ENTREGA = '';
      this.DOrdenCompra.TIPO_INVENTARIO = 'NUEVO';
      this.DOrdenCompra.ESTADO = 'REGISTRADO';
      this.onSelectionProveedor({ value: this.DOrdenCompra.ID_PROVEEDOR });
      this.esInicioDatos = true;
    }, 500);
    this.intervalHora = setInterval(() => {
      this.DOrdenCompra.HORA = new Date();
    }, 1000);
  }

  // Valores de cargue inicial
  valoresDefecto() {
    if (this.especAplicacion) {
      this.DOrdenCompra.ID_MONEDA = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'ID_MONEDA_DEF')?.VALOR_DEFECTO ?? '';
      this.especMonedaFormato = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'FORMATO MONEDA')?.FORMATO ?? '#,##0.00';
      this.especCantidadFormato = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'FORMATO CANTIDAD')?.FORMATO ?? '#,##0.00';
      this.especModificarPrecio = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'MODIFICAR PRECIO')?.ACTIVADO ?? false;
      this.especModificarGrav = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'MODIFICAR GRAVAMENES')?.ACTIVADO ?? false;
      this.especRepetirItem = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'REPETIR ITEM')?.ACTIVADO ?? false;
      this.especOrigenPrecio = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'MODIFICAR PRECIO')?.VALOR_DEFECTO ?? '';

      // Cuentas de email usuario
      this.especEmailCompras = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'EMAIL COMPRAS')?.VALOR_DEFECTO ?? '';
      this.especUsuarioEmail = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'EMAIL COMPRAS')?.TITULO ?? '';
      this.especModificarOrden = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'MODIFICAR ORDEN')?.ACTIVADO ?? false;
      this.especModoEnvioEmail = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'MODO ENVIO EMAIL')?.VALOR_DEFECTO ?? '';

    }
  }

  // Cerrar opción de valor libre en los sbox
  activarCustomValueSbox(accion: boolean) {
    this.eventsSubjectSboxMoneda.next({ customValue: accion });
    this.eventsSubjectSboxDoc.next({ customValue: accion });
    this.eventsSubjectSboxProv.next({ customValue: accion });
    this.eventsSubjectSboxBodega.next({ customValue: accion });
    this.eventsSubjectSboxCond.next({ customValue: accion });
    this.eventsSubjectSboxPlazo.next({ customValue: accion });
    this.eventsSubjectSboxTinv.next({ customValue: accion });
    this.eventsSubjectSboxProducto.next({ customValue: accion });
    this.activarCustomValueSbox(false);
  }

  async opPrepararModificar() {
    this.readOnly = false;
    this.readOnlyForm = false;
    this.readOnlyUdp = true;
    this.esEdicion = true;
    this.esCreacion = false;
    this.esInicioObj = { sboxIniProducto: true };
    this.iniEdicion = true;
    clearInterval(this.intervalHora);
  }

  opPrepararGuardar(accion: string): void {
    // Acción validación de datos
    if (!this.ValidaDatos('requerido')) {
      return;
    }

    const prmDatosGuardar = {
      ORDEN_COMPRA: this.DOrdenCompra,
      ITM_ORDEN_COMPRA: this.DOrdenCompraItems,
      ORDEN_GRAV: this.DOrdenCompraGrav
    }

    // API guardado de datos
    var exito = false;
    this.loadingVisible = true;
    this._sdatos
      .save(accion, prmDatosGuardar, this.prmUsrAplBarReg.aplicacion)
      .subscribe((resp) => {
        this.loadingVisible = false;
        const res = JSON.parse(resp.data);
        if (res[0].ErrMensaje !== "") {
          this.showModal(res[0].ErrMensaje, 'error');
        }
        else {
          this.readOnly = true;
          this.readOnlyForm = true;
          this.readOnlyUdp = true;
          this.esEdicion = false;
          this.esCreacion = false;
          this.esVisibleSelecc = 'none';
          clearInterval(this.intervalHora);

          // Operaciones de barra
          if (this.mnuAccion === 'new') {
            this.QFiltro = " ORDENES_COMPRA.ID_DOCUMENTO = '" + this.DOrdenCompra.ID_DOCUMENTO + "' " +
              " AND ORDENES_COMPRA.CONSECUTIVO = '" + this.DOrdenCompra.CONSECUTIVO + "'"
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
          const objControl = ['__obj__ddAutorizaciones', '__obj__ddPermisosEspeciales', '__obj__ddUnidadNegocio', '__obj__ddConexiones'];
          objControl.forEach(c => {
            this.cambiosItemForma({ dataField: c }, 'inactivar');
          })

          // Permite enviar email
          if (this.especModoEnvioEmail === 'AL GUARDAR') {
            const rep = this.listaReportes.find(r => r.especificacion.defectoEmail);
            if (rep !== undefined) {
              this.rpt_id_reporte = rep.id_reporte,
                this.rpt_archivo = rep.archivo,
                this.rpt_datosrpt = rep;
              this.enviarEmailPDF();
            }
          }

        }
      });
  }

  opPrepararBuscar(accion): void {

    // Sin hora
    clearInterval(this.intervalHora);

    if (accion === 'filtro') {

      // this._sfiltro.PrmFiltro = {
      //   Titulo: 'Datos de filtro para Orden de Compra',
      //   accion: 'PREPARAR FILTRO',
      //   Filtro: '',
      //   TablaBase: this.prmUsrAplBarReg.tabla,
      //   aplicacion: this.prmUsrAplBarReg.aplicacion,
      // };
      // this._sfiltro.getObsFiltro.emit(true);

      const prmFiltro = {
        Titulo: "Datos de filtro para Ordenes de compra",
        accion: "activar",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
        objRegistro: this._sbarreg,
        objTab: this.tabService,
        usuario: this.prmUsrAplBarReg.usuario,
        title: 'Ordenes de compra'
      };
      this.eventsSubjectFiltro.next(prmFiltro);


    }
    else {
      this._sfiltro.enConsulta = true;

      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { ORDENES_COMPRA: arrFiltro };

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

          // Datos
          const datares = res;

          if (datares[0].ErrMensaje === '') {
            this.VDatosReg = datares;
            this.DOrdenCompra = datares[0];
            this.DOrdenCompraItems = datares[0].ITM_ORDENES_COMPRA;
            this.DOrdenCompraGrav = datares[0].ORDEN_GRAV;
            this.QFiltro = datares[0].QFILTRO;

            // Prepara la barra para navegación
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              r_totReg: datares.length,
              r_numReg: 1,
              accion: 'r_navegar',
              operacion: { r_modificar: false },
            };
          }
          else {
            this.VDatosReg = [];
            showToast(datares[0].ErrMensaje, 'warning');
            this.opBlanquearForma();

            // Prepara la barra para navegación
            const user: any = localStorage.getItem('usuario');
            this.prmUsrAplBarReg = {
              tabla: 'ORDENES_COMPRA',
              aplicacion: 'COM-200',
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
            this.readOnlyForm = true;
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
    this.readOnlyForm = true;
    this.readOnlyUdp = true;
    this.resetValidaciones();
  }

  opEliminar(): void {
    Swal.fire({
      title: '',
      text: '',
      html:
        'Desea eliminar la Orden de compra <i>' +
        this.DOrdenCompra.ID_DOCUMENTO +
        '-' +
        this.DOrdenCompra.CONSECUTIVO +
        '</i> ?',
      iconHtml: "<i class='icon-alert-ol'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar',
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
        this.prmUsrAplBarReg.r_numReg = 1;
        if (this.VDatosReg.length != 0) {
          this.DOrdenCompra = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          // this.DOrdenCompraItems = JSON.parse(JSON.stringify(this.VDatosReg[0].ITM_ORDENES_COMPRA));
          // this.DOrdenCompraGrav = JSON.parse(JSON.stringify(this.VDatosReg[0].ORDEN_GRAV));
          // this.calcularValores();
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          showToast('No se encontraron Datos', 'error');
          this.readOnly = true;
          this.readOnlyForm = true;
          this.readOnlyUdp = true;
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.DOrdenCompra = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        // this.DOrdenCompraItems = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_ORDENES_COMPRA));
        // this.DOrdenCompraGrav = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ORDEN_GRAV));
        // this.DOrdenCompraGravItems = this.DOrdenCompraGrav != null ? this.DOrdenCompraGrav.filter(e => e.APLICACION === 1) : [];
        // this.loadManualDatatables();
        // this.loadDatos();
        // this.calcularValores();
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length ? this.VDatosReg.length : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DOrdenCompra = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        // this.DOrdenCompraItems = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1].ITM_ORDENES_COMPRA));
        // this.DOrdenCompraGrav = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ORDEN_GRAV));
        // this.DOrdenCompraGravItems = this.DOrdenCompraGrav != null ? this.DOrdenCompraGrav.filter(e => e.APLICACION === 1) : [];
        // this.loadManualDatatables();
        // this.loadDatos();
        // this.calcularValores();
        break;
      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DOrdenCompra = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        // this.DOrdenCompraItems = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_ORDENES_COMPRA));
        // this.DOrdenCompraGrav = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ORDEN_GRAV));
        // this.DOrdenCompraGravItems = this.DOrdenCompraGrav != null ? this.DOrdenCompraGrav.filter(e => e.APLICACION === 1) : [];
        // this.calcularValores();
        // this.loadManualDatatables();
        // this.loadDatos();
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
          this.DOrdenCompra = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          // this.DOrdenCompraItems = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_ORDENES_COMPRA));
          // this.DOrdenCompraGrav = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ORDEN_GRAV));
          // this.DOrdenCompraGravItems = this.DOrdenCompraGrav != null ? this.DOrdenCompraGrav.filter(e => e.APLICACION === 1) : [];
          // this.loadManualDatatables();
          // this.calcularValores();
          // this.loadDatos();
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearForma();
          this.resetValidaciones();
        }
        this.readOnly = true;
        this.readOnlyForm = true;
        this.readOnlyUdp = true;
        break;
      case 'Eliminado':
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          this.DOrdenCompra = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
          // this.DOrdenCompraItems = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_ORDENES_COMPRA;
          // this.DOrdenCompraGrav = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ORDEN_GRAV;
          // if(this.DOrdenCompraGrav != null)
          // this.DOrdenCompraGravItems = this.DOrdenCompraGrav.filter(e => e.APLICACION === 1);
          // this.loadManualDatatables();
          // this.loadDatos();
          // this.calcularValores();
        } else {
          this.opBlanquearForma();
        }
        break;
      default:
        break;
    }

    // Inicializar lista de datos y así poder Asignar datos a sbox
    if (!this.esInicioDatos) {
      this.valoresObjetos('todos');
      this.valoresObjetos('condicion');
      this.esInicioDatos = true;
    }

    // Totales OC
    // this.activarCustomValueSbox(true);
    this.customValueSbox = true;

    // Por esoecificacion defecto, no se permite modificar
    if (this.DOrdenCompra.ESTADO === 'ANULADO')
      this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: this.especModificarOrden, r_eliminar: false } };
    else
      this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: this.especModificarOrden, r_eliminar: true } };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

    // Consulta los otros datos: items, gravamenes, adicionales
    const prm = { ID_DOCUMENTO: this.DOrdenCompra.ID_DOCUMENTO, CONSECUTIVO: this.DOrdenCompra.CONSECUTIVO };
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
        this.DOrdenCompraItems = res[0].ITM_ORDENES_COMPRA;
        this.DOrdenCompraGrav = res[0].ORDEN_GRAV;
        this.DOrdenCompra.NOMBRE_PROVEEDOR = res[0].NOMBRE_PROVEEDOR;
        this.DOrdenCompra.ID_DIRECCION = res[0].ID_DIRECCION;
        this.calcularValores();
      });
  }

  opVista(): void {
    const VDatosRegAux = this.VDatosReg.map(({ ID_DOCUMENTO, PREFIJO, CONSECUTIVO, SUFIJO, FECHA, ID_PROVEEDOR, TIPO_VENTA, TIPO_INVENTARIO, ID_ADC, DESCRIPCION, USUARIO, ESTADO }) => ({ ID_DOCUMENTO, PREFIJO, CONSECUTIVO, SUFIJO, FECHA, ID_PROVEEDOR, TIPO_VENTA, TIPO_INVENTARIO, ID_ADC, DESCRIPCION, USUARIO, ESTADO }));
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(VDatosRegAux));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'Ordenes de compra',
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
    this.DOrdenCompra = {
      ID_UN: '',
      ID_UN_DESTINO: '',
      ID_DOCUMENTO: '',
      NOMBRE_DOCUMENTO: '',
      PREFIJO: '',
      CONSECUTIVO: 0,
      SUFIJO: '',
      DOCUMENTO: '',
      FECHA_REGISTRO: now,
      FECHA_SOLICITUD: now,
      HORA: now,
      ID_PROVEEDOR: '',
      NOMBRE_PROVEEDOR: '',
      ID_ADC: '',
      ID_CONDICION: '',
      DESCRIPCION: '',
      ID_MONEDA: '',
      TASA_CAMBIO: 1,
      VIGENCIA: now,
      TIPO_INVENTARIO: '',
      NC_DOC_SOPORTE: 0,
      FECHA_ENTREGA: '',
      CUOTA_INICIAL: 0,
      PLAZO: 0,
      CONDICIONES_GENERALES: '',
      SUB_TOTAL: 0,
      VALOR_DESCUENTO: 0,
      GRAVAMENES: '',
      VALOR_COSTOS: 0,
      TOTAL: 0,
      FECHA_PRIMER_VENC: '',
      DIAS_CUOTA: 0,
      UM_DIAS_CUOTA: '',
      USUARIO: this.prmUsrAplBarReg.usuario,
      ESTADO: 'REGISTRADO',
      FECHA_OC: '',
      ID_UBICACION: '',
      ID_DIRECCION: '',
      EMAIL: ''
    };
    this.DOrdenCompraItems = [];
    this.DOrdenCompraGravItems = [];
    this.DOrdenCompraGrav = [];
    this.DGridSubTotales = [{ key: 'Subtotal', value: 0 }, { key: 'Descuentos', value: 0 }, { key: 'Otros', value: 0 }];
    this.gridBoxProveedor = [];
    if (this.UN_DEF != null)
      this.gridBoxUN = [this.UN_DEF];
    this.DOrdenCompra.ID_UN_DESTINO = this.UN_DEF;
    if (this.MONEDA_DEF != null)
      this.gridBoxMoneda = [this.MONEDA_DEF];
    this.DOrdenCompra.ID_MONEDA = this.MONEDA_DEF;
    this.gridBoxCondicion = [];
    this.gridBoxADC = [];
    this.sbDocumento = '';
    this.sbTipoVenta = '';
    this.sbIdDireccion = "";
    this.sbPlazo = 0;
    this._sdatos.ID_DOCUMENTO = '';
    this._sdatos.CONSECUTIVO = '';
    this._sdatos.ID_DOCUMENTO_prev = '';
    this._sdatos.CONSECUTIVO_prev = '';
    this.DOrdenCompra_prev = JSON.parse(JSON.stringify(this.DOrdenCompra));
    this.DOrdenCompraItems_prev = JSON.parse(JSON.stringify(this.DOrdenCompraItems));
    this.DOrdenCompraGrav_prev = JSON.parse(JSON.stringify(this.DOrdenCompraGrav));
    this.TOT_GRAV = 0;
    this.esVisibleCartera = false;
  }

  operGrid(e, operacion) {

    if (operacion !== 'delete') {
      this.gridOrdenCompraItems.instance.deselectAll();
    }

    switch (operacion) {
      case 'new':
        this.gridBoxProducto = [];
        this.gridOrdenCompraItems.instance.addRow();
        this.rowApplyChanges = true;
        this.esVisibleSelecc = 'none';
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this.esVisibleSelecc = 'none';
        break;
      case 'save':
        this.gridOrdenCompraItems.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        break;
      case 'cancel':
        this.gridOrdenCompraItems.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.esVisibleSelecc = 'always';
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
              const index = this.DOrdenCompraItems.findIndex(a => a.ITEM === key);
              this.DOrdenCompraItems.splice(index, 1);
            });
            this.gridOrdenCompraItems.instance.refresh();
            this.conCambios++;
            this.setItemValues();
            this.readOnlyForm = this.DOrdenCompraItems.length > 0 ? true : false;
          }
        });
        break;

      default:
        break;
    }
  }

  onChangeCantidad(rowData: any, value: any, currentRowData: any) {
    rowData.CANTIDAD = value;
    rowData.CANTIDAD_REAL = value * currentRowData.CANTIDAD_EQUIV * currentRowData.CANTIDAD_PRES;
    rowData.SUB_TOTAL = rowData.CANTIDAD * currentRowData.VALOR_UNITARIO;
    const porIva = currentRowData.GRAVAMENES.PORCENTAJE !== undefined ? currentRowData.GRAVAMENES.PORCENTAJE : 0;
    rowData.VALOR_IVA = rowData.SUB_TOTAL * porIva / 100;
    rowData.TOTAL = rowData.SUB_TOTAL + rowData.VALOR_IVA;
  }

  onChangeValorUnitario(rowData: any, value: any, currentRowData: any) {
    rowData.VALOR_UNITARIO = value;
    rowData.SUB_TOTAL = currentRowData.CANTIDAD * rowData.VALOR_UNITARIO;
    const porIva = currentRowData.GRAVAMENES.PORCENTAJE !== undefined ? currentRowData.GRAVAMENES.PORCENTAJE : 0;
    rowData.VALOR_IVA = rowData.SUB_TOTAL * porIva / 100;
    rowData.TOTAL = rowData.SUB_TOTAL + rowData.VALOR_IVA;
  }

  onChangeProducto(rowData: any, value: any, currentRowData: any) {
    rowData.PRODUCTO = value;
  }

  onEditingStart(e) {
    this.gridBoxProducto = [e.data.PRODUCTO];
    this.esVisibleSelecc = 'none';
    this.rowApplyChanges = true;
    e.data.isEdit = true;
  }
  onEditorPreparing(e) {
  }
  onCellPrepared(e) {
    if (e.rowType === "data" && e.column.dataField === "VALOR_IVA") {
      on(e.cellElement, "mouseover", arg => {
        this.infoIva = e.data.GRAVAMENES;
        this.tooltip.instance.show(arg.target);
      });

      on(e.cellElement, "mouseout", arg => {
        this.tooltip.instance.hide();
      });
    }
  }

  onEditorEnterKey(e) {
    // e.event.preventDefault();
    // var itemsgru:any = this.formOrdenCompra.instance.option('items');
    // itemsgru.forEach((g) => {
    //   var items = g['items'];
    //   var index = items.findIndex((item) => item.dataField === e.dataField);
    //   if (index !== -1){
    //     var fNextEditor = this.formOrdenCompra.instance.getEditor(
    //       items[++index < items.length ? index : 0].dataField
    //     );
    //     if (fNextEditor) fNextEditor.focus();
    //     return;
    //   }
    // });
  }

  onFocusedRowChanged(e: any) {
    const rowData = e.row && e.row.data;
    if (rowData) {
      this.gridBoxProducto = [rowData.PRODUCTO]
      this.valoresObjetos('atributos');
    }
  }

  onEditCanceled(e: any) {
    this.esVisibleSelecc = 'always';
    this.gridOrdenCompraItems.instance.deselectAll();
    this.rowNew = true;
    this.rowApplyChanges = false;
  }
  onCellHoverChanged(e: any) {
    if (e.rowType === "data" && e.column.dataField.match("PRODUCTO|NOMBRE_PRODUCTO")) {
      if (e.eventType === "mouseover") {
        this.TooltipTarget = e.cellElement;
        this.ToolTipText = e.data.NOMBRE_PRODUCTO;
        // this.toolTip.instance.show(this.TooltipTarget);
      } else {
        // this.toolTip.instance.hide();
      }
    }
  }

  onCellClick(e) {
    if (e.row === undefined) return;
    if (e.row.cells[e.columnIndex].column.dataField === 'VALOR_IVA') {

      // Extrae ivas del producto
      const dnompro = this.DProductosLista.find(p => p.PRODUCTO == e.data.PRODUCTO);
      if (dnompro) {
        if (dnompro.IVAS.length > 1) {
          // Iva asociado al item
          var ivaAso = '';
          if (e.data.GRAVAMENES) {
            if (e.data.GRAVAMENES.ID_TASA)
              ivaAso = e.data.GRAVAMENES.ID_TASA;
          }
          this.keyFila = e.key;
          this.eventsSubjectIvas.next({
            dataSource: dnompro.IVAS,
            visible: true,
            iva: ivaAso
          });
        }
      }
    }
    // if (e.columnIndex === 1)
    //   this.eventsSubjectSboxProducto.next({ dataSource: this.DProductos, 
    //                                         valueExpr: "PRODUCTO",
    //                                         displayExpr: "PRODUCTO",
    //                                         columnData: ["PRODUCTO","NOMBRE"],
    //                                         columnCaption: ["Producto","Nombre"],
    //                                         valueData: "", });
  }

  onFocusOutAtributos(e, cellInfo) {
    if (cellInfo.data) {
      cellInfo.data.ATRIBUTO = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onFocusOutClientes(e, cellInfo) {
    if (cellInfo.data) {
      cellInfo.data.ID_PROVEEDOR = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
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
      if (!e.isEditing && e.data.isEdit) {
        this.esVisibleSelecc = 'always';
        e.data.isEdit = false;
      }
    }
    if (e.rowType === "header" && e.rowIndex === 2 && !this.esEdicion) {
      e.rowElement.style.display = "none";
    }
  }

  onRowValidating(e: any) {
    // Valida completitud
    var errMsg = '';
    if (e.newData.PRODUCTO !== undefined && e.newData.PRODUCTO === '')
      errMsg = 'Falta seleccionar producto';
    if (e.newData.VALOR_UNITARIO !== undefined && e.newData.VALOR_UNITARIO <= 0)
      errMsg = 'Valor unitario no puede ser cero';
    if (e.newData.CANTIDAD !== undefined && e.newData.CANTIDAD <= 0)
      errMsg = 'Cantidad no puede ser cero';
    for (let i = 0; i < this.DOrdenCompraItems.length; i++) {
      const ele = this.DOrdenCompraItems[i];
      if ((e.newData.PRODUCTO === ele.PRODUCTO) && (e.newData.UDM_COMPRA === ele.UDM_COMPRA))
        errMsg = 'Producto con Unidad de Compra repetido.';
      // return;
    };
    if (errMsg !== '') {
      e.isValid = false;
      this.rowNew = false;
      this.rowEdit = false;
      this.rowDelete = false;
      this.rowApplyChanges = true;
      showToast(errMsg, 'warning');
      return;
    }
  }

  onSeleccDocumento(e: any): void {
    if (this.readOnly) return;
    if (e === undefined) return;
    if (e.value === "") return;

    this.sbDocumento = e.value;
    this.DOrdenCompra.DOCUMENTO = e.value;
    this.enableProductosItems();
    if (this._sdatos.accion == 'r_nuevo') {
      this.DOrdenCompra.ID_DOCUMENTO = this.DDocumentos.find(p => p.DOCUMENTO === e.value).ID_DOCUMENTO;
      this.DOrdenCompra.CONSECUTIVO = this.DDocumentos.find(p => p.DOCUMENTO === e.value).CONSECUTIVO;
    }
  }

  onSelectionAtributos(e) {
    if (e.name === 'value') {
      this.isGridBoxAtrOpened = false;
    }
  }

  onSelectionProveedor(e) {
    if (this.readOnly) return;
    if (e !== 'refrescar') {
      const dnomprov = this.DProveedores.find(p => p.ID_PROVEEDOR == e.value);
      if (dnomprov) {
        this.DOrdenCompra.ID_PROVEEDOR = e.value;
        this.DOrdenCompra.ID_DIRECCION = dnomprov.ID_DIRECCION ?? "";
        const cond = dnomprov.ID_CONDICION;
        if (cond.length !== 0) {
          this.DOrdenCompra.ID_CONDICION = cond[0].ID_CONDICION;
          this.DCondiciones = cond;
          this.DPlazos = cond[0].PLAZO;
          this.DOrdenCompra.PLAZO = cond[0].PLAZO[0];
          this.eventsSubjectSboxCond.next({
            dataSource: this.DCondiciones,
            valueExpr: "ID_CONDICION",
            displayExpr: "ID_CONDICION",
            columnData: ["ID_CONDICION", "NOMBRE"],
            valueData: this.DOrdenCompra.ID_CONDICION
          });
          this.eventsSubjectSboxPlazo.next({
            dataSource: this.DPlazos,
            columnData: [],
            style: { width: 200 },
            valueData: this.DOrdenCompra.PLAZO
          });
          this.enableProductosItems();

        }
        this.DOrdenCompra.NOMBRE_PROVEEDOR = dnomprov.NOMBRE_COMPLETO;
        if (dnomprov.EMAIL == null || dnomprov.EMAIL == '')
          showToast('Proveedor no tiene correo electrónico!', 'error');
        this.DOrdenCompra.EMAIL = dnomprov.EMAIL;
        if (this.DOrdenCompra.ID_CONDICION !== '' && this.DOrdenCompra.ID_PROVEEDOR !== '' && this.DOrdenCompra.ID_UN_DESTINO !== '')
          this.valoresObjetos('productos');

      }
    }
    else {
      this.valoresObjetos('proveedores');
    }
  }

  onSelectionCondicion(e) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;

    if (e === 'refrescar') {
      this.valoresObjetos('condicion');
      return;
    }

    var ANT_COND = this.DOrdenCompra.ID_CONDICION;
    if (e.value) {
      if (this.DOrdenCompra.ID_CONDICION != e.value && this.DOrdenCompraItems.length > 0) {
        Swal.fire({
          title: '',
          text: 'Está cambiando la Condición ' + this.DOrdenCompra.ID_CONDICION + ' por ' + e.value + ', esto borrará los Productos asociados, ¿Desea Continuar?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, Borrar',
        }).then((result) => {
          if (result.isConfirmed) {
            this.DOrdenCompraItems = [];
            this.DOrdenCompra.ID_CONDICION = e.value;
          } else {
            // this.gridBoxCondicion = [(this.DOrdenCompra.ID_CONDICION != ANT_COND ? ANT_COND : this.DOrdenCompra.ID_CONDICION)];
            this.DOrdenCompra.ID_CONDICION = ANT_COND;
            return;
          }
        });
      }

      // Asigna condicion y plazos asociados
      this.DOrdenCompra.ID_CONDICION = e.value;
      const dplazos = this.DCondiciones.find(p => p.ID_CONDICION == e.value).PLAZO;
      if (dplazos) {
        this.DPlazos = dplazos;
        if (dplazos.length !== 0) {
          this.DOrdenCompra.PLAZO = dplazos[0];
        }
        this.eventsSubjectSboxPlazo.next({
          dataSource: this.DPlazos,
          columnData: [],
          style: { width: 200 },
          valueData: this.DOrdenCompra.PLAZO
        });
      }
      this.enableProductosItems();
    }
  }

  onSelectionMonedaOld(e) {
    if (e.name === 'value') {
      this.isGridBoxMonedaOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0) {
      this.DOrdenCompra.ID_MONEDA = e.selectedRowsData[0].ID_MONEDA;
      this.isGridBoxMonedaOpened = false;
    }
  }

  // Recibe los datos del selectbox moneda
  onSelectionMoneda(e: any) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;

    if (e !== 'refrescar') {
      this.DOrdenCompra.ID_MONEDA = e.value;
      this.conCambios++;
      this.enableProductosItems();
    }
    else {
      this.valoresObjetos('monedas');
    }
  }

  onSelectionADC(e) {
    if (e.name === 'value') {
      this.isGridBoxADCOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0) {
      this.DOrdenCompra.ID_ADC = e.selectedRowsData[0].ID_ADC;
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
    if (e.value) {
      this.DOrdenCompra.ID_UN_DESTINO = e.value;
      this.valoresObjetos('productos');
    }
  }

  onValueChangedFechaEntrega(e: any) {
    this.DOrdenCompra.FECHA_ENTREGA = e.value;
  }

  onSeleccDireccion(e: any) {
    this.DOrdenCompra.ID_DIRECCION = e.value;
  }

  onSeleccPlazo(e: any) {
    this.DOrdenCompra.PLAZO = e.value;
    if (this.DOrdenCompra.PLAZO > 0) {
      this.esVisibleCartera = true;
    }
    this.enableProductosItems();
  }

  onValueChangedDes(e: any) {
    this.DOrdenCompra.DESCRIPCION = e.value;
  }

  onSeleccRowAtributo(e, cellInfo, datacompo) {
    if (e.data) {
      cellInfo.data.ATRIBUTO = e.data.VALOR;
      this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "ATRIBUTO", cellInfo.data.ATRIBUTO);
      datacompo.close();
      this.isGridBoxAtrOpened = false;
    }
  }

  onSeleccRowCliente(e, cellInfo, datacompo) {
    if (e.data) {
      cellInfo.data.ID_PROVEEDOR = e.data.ID_PROVEEDOR;
      this.DOrdenCompra.NOMBRE_PROVEEDOR = this.DProveedores.find(p => p.ID_PROVEEDOR === cellInfo.data.ID_PROVEEDOR).NOMBRE_COMPLETO;
      this.isGridBoxCliOpened = false;
    }
  }

  async onSeleccRowProducto(e: any, cellInfo: any) {
    if (e.selectedRowKeys[0]){
      if ( this.DOrdenCompraItems.findIndex((d:any) => d.PRODUCTO === e.selectedRowKeys[0]) === -1 ) {
        
        // Producto seleccionado
        const proSelecc = e.selectedRowKeys[0];

        //Valida si el producto esta asignado a la bodega de Destino y tiene existencias.
        const UN_DES:any = this.DOrdenCompra.ID_UN_DESTINO;
        const prm:any = { PRODUCTO: proSelecc, 
                          PRESENTACION: 'SI', 
                          MOVIMIENTO: "ORDEN DE COMPRA",
                          TIPO: "ORDEN DE COMPRA" ,
                          ID_CONDICION: this.DOrdenCompra.ID_CONDICION,
                          ID_UN_ORIGEN: this.DOrdenCompra.ID_PROVEEDOR,
                          ID_UN_DESTINO: this.DOrdenCompra.ID_UN_DESTINO
        };
        const apiRest = this._sdatos.consulta('EXISTENCIAS PRODUCTO', prm, "COM-200");
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
          this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "NOMBRE_PRODUCTO", cellInfo.data.NOMBRE);
          // cellInfo.data.PERFIL_TRIBUTARIO = dnompro.PERFIL_TRIBUTARIO;
          // this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "GRAVAMENES", cellInfo.data.PERFIL_TRIBUTARIO);
          cellInfo.data.PORC_IVA = dnompro.PORC_IVA;

          // Presentación
          if (dnompro.PRESENTACION) {
            const dpres = dnompro.PRESENTACION;
            this.DListaUMCompra = dpres;
            if (dpres.length === 1) {
              //valida que no se repida el producto con la misma unidad de compra:
              for (let i = 0; i < this.DOrdenCompraItems.length; i++) {
                const ele = this.DOrdenCompraItems[i];
                if ((cellInfo.data.PRODUCTO === ele.PRODUCTO) && (dpres[0].UDM_COMPRA === ele.UDM_COMPRA)) {
                  showToast('Producto con Unidad de Compra repetido.', 'warning');
                  return;
                }
              };

              const dcanreal = dpres[0].CANTIDAD_PRES * dpres[0].CANTIDAD_EQUIV;
              cellInfo.data.VALOR_UNITARIO = dnompro.PRECIO;
              cellInfo.data.CANTIDAD_PRES = dpres[0].CANTIDAD_PRES;
              cellInfo.data.CANTIDAD_EQUIV = dpres[0].CANTIDAD_EQUIV;
              this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "UDM_COMPRA", dpres[0].UDM_COMPRA);
              this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", dpres[0].CANTIDAD_PRES);
              this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", dpres[0].UDM_EQUIV);
              this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", dpres[0].CANTIDAD_EQUIV);
              this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", cellInfo.data.VALOR_UNITARIO);
              this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", dcanreal);
            } else {
              cellInfo.data.VALOR_UNITARIO = 0;
              this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "UDM_COMPRA", "");
              this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", "");
              this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", "");
              this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", "");
              this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", 0);
              this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", 0);
            }
          }
          this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "PORC_IVA", cellInfo.data.PORC_IVA);
          // this.valoresObjetos('atributos');
          setTimeout(() => {
            var rowIndex = cellInfo.component.getRowIndexByKey(cellInfo.key);
            // cellInfo.component.editCell(rowIndex, 'PRODUCTO');
            // e.component.focus();
            cellInfo.component.focus(this.gridOrdenCompraItems.instance.getCellElement(rowIndex, "PRODUCTO"));
          }, 300);

          // Análisis de varios Ivas
          this.keyFila = cellInfo.key;
          if (dnompro.IVAS.length > 1) {
            this.setValueHandler = cellInfo;
            this.eventsSubjectIvas.next({
              dataSource: dnompro.IVAS,
              visible: true,
              iva: ''
            });

          } else {
            this.onSeleccIvas({ addedItems: dnompro.IVAS });
          }
        }

        // } else {
        //   cellInfo.data.PRODUCTO = '';
        //   showToast('El producto ya fue seleccionado.', 'error');
        // }
      }
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
  onSoloProPrecio(e) {
    const chkprov = this.checkProProveedor.instance.option("value");
    var datPro: any = [];
    if (e.value) {
      // datPro = !chkprov ?
      //   this.DProductosLista.filter(p => p.PRECIO != 0) :
      //   this.DProductosLista.filter(p => p.PRECIO != 0 && p.PROVEEDOR.match(this.DOrdenCompra.ID_PROVEEDOR));
      if (!chkprov) 
        this.gridProLista.instance.filter((p) => { return p.PRECIO != 0; }) 
      else
        this.gridProLista.instance.filter((p) => { return p.PRECIO != 0 && p.PROVEEDOR.match(this.DOrdenCompra.ID_PROVEEDOR) } )
    }
    else {
      // datPro = !chkprov ?
      //   this.DProductosLista :
      //   this.DProductosLista.filter(p => p.PROVEEDOR.match(this.DOrdenCompra.ID_PROVEEDOR));
      if (!chkprov) 
        this.gridProLista.instance.filter(null) 
      else
        this.gridProLista.instance.filter((p) => { return p.PROVEEDOR.match(this.DOrdenCompra.ID_PROVEEDOR) } )
    }
    // this.DProductos = new DataSource({
    //   store: datPro,
    //   paginate: true,
    //   pageSize: 20
    // });
    // setTimeout(() => {
    //   this.DProductos.reload();
    // }, 300);
  }

  onSoloProProveedor(e) {
    const chkprecio = this.checkProSoloPrecio.instance.option("value");
    var datPro: any = [];
    if (e.value) {
      datPro = !chkprecio ?
        this.DProductosLista.filter(p => p.PROVEEDOR.match(this.DOrdenCompra.ID_PROVEEDOR)) :
        this.DProductosLista.filter(p => p.PROVEEDOR.match(this.DOrdenCompra.ID_PROVEEDOR) && p.PRECIO !== 0);
    }
    else {
      datPro = !chkprecio ?
        this.DProductosLista :
        this.DProductosLista.filter(p => p.PRECIO !== 0);
    }
    this.DProductos = new DataSource({
      store: datPro,
      paginate: true,
      pageSize: 20
    });
    setTimeout(() => {
      this.DProductos.reload();
    }, 300);
  }

  onSeleccIvas(e) {
    if (e.addedItems === undefined) return;
    if (e.addedItems.length === 0) return;
    var rowIndex = this.gridOrdenCompraItems.instance.getRowIndexByKey(this.keyFila);
    const canPro = this.gridOrdenCompraItems.instance.cellValue(rowIndex, "CANTIDAD");
    const valUnit = this.gridOrdenCompraItems.instance.cellValue(rowIndex, "VALOR_UNITARIO");
    const valIva = e.addedItems[0].PORCENTAJE / 100 * canPro * valUnit;
    this.gridOrdenCompraItems.instance.cellValue(rowIndex, "VALOR_IVA", valIva);
    this.gridOrdenCompraItems.instance.cellValue(rowIndex, "TOTAL", canPro * valUnit + valIva);
    this.gridOrdenCompraItems.instance.cellValue(rowIndex, "GRAVAMENES", e.addedItems[0]);
    this.gridOrdenCompraItems.instance.cellValue(rowIndex, "GRAV_ORG", e.addedItems[0]);

    // Actualiza el data source
    const nx = this.DOrdenCompraItems.findIndex(it => it.ITEM == this.gridOrdenCompraItems.instance.cellValue(rowIndex, "ITEM"));
    if (nx !== -1) {
      this.DOrdenCompraItems[nx].VALOR_IVA = valIva;
      this.DOrdenCompraItems[nx].TOTAL = canPro * valUnit + valIva;
      this.DOrdenCompraItems[nx].GRAVAMENES = e.addedItems[0];
      this.DOrdenCompraItems[nx].GRAV_ORG = e.addedItems[0];
    }

    this.valoresObjetos('gravamenes');
  }

  // Recibe los datos de la grid de tasas
  onRespuestaSelecc(e: any) {
    if (e.accion === 'aceptar') {
      this.valoresObjetos('gravamenes', e.rowsSelected);
    }
  }
  onRespuestaFiltro(e: any) {
  }

  onSeleccTipoInv(e) {
    this.DOrdenCompra.TIPO_INVENTARIO = e.value;
    this.enableProductosItems();
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

  onValueChangedUMCompra(e, cellInfo) {
    cellInfo.setValue(e.value);
    const dum = this.DListaUMCompra.find((u: any) => u.UDM_COMPRA == e.value);
    if (this.DOrdenCompraItems.findIndex((d: any) => d.PRODUCTO === cellInfo.data.PRODUCTO && d.UDM_COMPRA === e.value) === -1) {
      if (dum) {
        cellInfo.data.UDM_COMPRA = dum.UDM_COMPRA;
        cellInfo.data.UDM_EQUIV = dum.UDM_EQUIV;
        cellInfo.data.CANTIDAD_EQUIV = dum.CANTIDAD_EQUIV;
        cellInfo.data.CANTIDAD_PRES = dum.CANTIDAD_PRES;
        cellInfo.data.VALOR_UNITARIO = dum.PRECIO;
        const dcanreal = dum.CANTIDAD_PRES * dum.CANTIDAD_EQUIV * cellInfo.data.CANTIDAD;
        cellInfo.data.CANTIDAD_REAL = dcanreal;
        this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "UDM_COMPRA", cellInfo.data.UDM_COMPRA);
        this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", cellInfo.data.UDM_EQUIV);
        this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", cellInfo.data.CANTIDAD_EQUIV);
        this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", cellInfo.data.CANTIDAD_PRES);
        this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", cellInfo.data.VALOR_UNITARIO);
        this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", cellInfo.data.CANTIDAD_REAL);
      }
    } else {
      cellInfo.data.UDM_COMPRA = '';
      cellInfo.data.UDM_EQUIV = '';
      cellInfo.data.CANTIDAD_EQUIV = '';
      cellInfo.data.CANTIDAD_PRES = '';
      cellInfo.data.VALOR_UNITARIO = 0;
      cellInfo.data.CANTIDAD_REAL = 0;
      this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "UDM_COMPRA", "");
      this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", "");
      this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", "");
      this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", "");
      this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", 0);
      this.gridOrdenCompraItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", 0);
      showToast('La Unidad de Compra esta repetida.', 'error');
    }
  }

  clickGravamenes(e, accion: string) {
    if (accion === 'apl grav') {
      // Muestra grid de asignacion de gravamenes forzados a aplicar
      Swal.fire({
        title: '',
        text: 'Se asignarán los gravamenes a la transacción que se seleccionen. ' +
          'No se tendrán en cuenta los gravámenes asociados a los productos ni al proveedor. ' +
          'Desea proceder?',
        iconHtml: "<i class='icon-alert-ol'></i>",
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#438ef1',
        cancelButtonText: 'No',
        confirmButtonText: 'Sí, aceptar',
      }).then((result) => {
        if (result.isConfirmed) {
          this.valoresObjetos('tasas legales');
          const dataConfig = [{ dataField: "ID_TASA", caption: "Id Tasa", width: "200" },
          { dataField: "DESCRIPCION", caption: "Nombre" },
          { dataField: "PORCENTAJE", caption: "%", alignment: "right" },
          { dataField: "VALOR_BASE", caption: "Base", alignment: "right" },
          {
            dataField: "CLASE", caption: "Clase", groupIndex: "0",
            templateGroup: ["CLASE"]
          },
          ];
          this.eventsSubjectGridTasas.next({
            dataSource: this.DGravamenes,
            rowsSelected: this.DOrdenCompraGrav.map(({ ID_TASA }) => ({ ID_TASA })),
            keyExpr: ["ID_TASA"],
            titGrid: "Asociación de Tasas",
            colsConfig: dataConfig,
            modoSelection: 'multiple',
            container: 'popup'
          });
        }
      });

    }
    else {
      Swal.fire({
        title: '',
        text: 'Se asignarán los gravámenes asociados a los productos y del proveedor. ' +
          'Desea proceder?',
        iconHtml: "<i class='icon-alert-ol'></i>",
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#438ef1',
        cancelButtonText: 'No',
        confirmButtonText: 'Sí, aceptar',
      }).then((result) => {
        if (result.isConfirmed) {
          this.valoresObjetos('gravamenes', 'original');
        }
      });
    }

  }

  AccionEliminar(): void {
    // API eliminación de datos
    const prm = { ORDEN_COMPRA: { ID_DOCUMENTO: this.DOrdenCompra.ID_DOCUMENTO, PREFIJO: this.DOrdenCompra.PREFIJO, CONSECUTIVO: this.DOrdenCompra.CONSECUTIVO, SUFIJO: this.DOrdenCompra.SUFIJO } };
    this._sdatos
      .delete('delete', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'error');
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        showToast('Orden de compra anulada', 'success');
        this.readOnly = true;
        this.readOnlyForm = true;
        this.readOnlyUdp = true;
        this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ESTADO = "ANULADO";
        this.DOrdenCompra = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));

        // Operaciones de barra
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
    this.DOrdenCompra.SUB_TOTAL = this.DOrdenCompraItems.reduce((n, { SUB_TOTAL }) => n + SUB_TOTAL, 0);
    if (this.DOrdenCompraGrav !== undefined)
      this.TOT_GRAV = this.DOrdenCompraGrav.reduce((n, { VALOR }) => n + VALOR, 0);
    this.DOrdenCompra.TOTAL = this.DOrdenCompra.SUB_TOTAL + this.TOT_GRAV;
    //Aqui se construye la grid de Subtotales
    this.DGridSubTotales = [{ key: 'Subtotal', value: this.DOrdenCompra.SUB_TOTAL },
    { key: 'Descuentos', value: this.DOrdenCompra.VALOR_DESCUENTO },
    { key: 'Otros', value: 0 }];
    this.setValoresCartera();
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

  onChangeFecha(e) {
    this.DOrdenCompra.FECHA_SOLICITUD = e.value;
    this.fechaEntrega.instance._refresh();
  }
  disableDates(args: any) {
    const today = new Date();
    const fhoy = this.datepipe.transform(today, 'MM/dd/yyyy');
    const fcal = this.datepipe.transform(args.date, 'MM/dd/yyyy');
    const ford = this.datepipe.transform(this.DOrdenCompra.FECHA_SOLICITUD, 'MM/dd/yyyy');
    const dfhoy = new Date(fhoy!);
    const dfcal = new Date(fcal!);
    const dford = new Date(ford!);
    return dfcal < (dford == undefined ? dfhoy : dford);
  }

  enableProductosItems() {
    if (this.DOrdenCompra.DOCUMENTO == '' ||
      this.DOrdenCompra.ID_PROVEEDOR == '' ||
      this.DOrdenCompra.FECHA_SOLICITUD == '' ||
      this.DOrdenCompra.ID_UN_DESTINO == '' ||
      this.DOrdenCompra.TIPO_INVENTARIO == '' ||
      this.DOrdenCompra.ID_CONDICION == '') {
      this.rowNew = false;
    } else {
      this.rowNew = true;
      if (this.DOrdenCompra.ID_CONDICION !== '' && this.DOrdenCompra.ID_PROVEEDOR !== '' && this.DOrdenCompra.ID_UN_DESTINO !== '')
        this.valoresObjetos('productos');
    }

  }

  // previsualizar el reporte
  imprimirReporte(operimp) {
    let filtroRep: any = '';
    if (operimp.registro === 'todos')
      filtroRep = { FILTRO: this.QFiltro };
    else
      filtroRep = {
        FILTRO: " ORDENES_COMPRA.ID_DOCUMENTO = '" + this.DOrdenCompra.ID_DOCUMENTO + "' " +
          " AND ORDENES_COMPRA.CONSECUTIVO = '" + this.DOrdenCompra.CONSECUTIVO + "'"
      };
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
      filtroRep = {
        FILTRO: " ORDENES_COMPRA.ID_DOCUMENTO = '" + this.DOrdenCompra.ID_DOCUMENTO + "' " +
          " AND ORDENES_COMPRA.CONSECUTIVO = '" + this.DOrdenCompra.CONSECUTIVO + "'"
      };
    const ext = this.ltool.makeRandom(30);
    const prmRpt = {
      clid: localStorage.getItem('empresa'),
      usuario: localStorage.getItem('usuario'),
      idrpt: operimp.archivo,
      id_reporte: operimp.id_reporte,
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      filtro: JSON.stringify(filtroRep),
      archivo: operimp.archivo + "_" + ext + ".pdf",

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
    var msg = '';
    const dprov = this.DProveedores.find(p => p.ID_PROVEEDOR === this.DOrdenCompra.ID_PROVEEDOR);
    if (dprov == undefined || dprov == null) {
      msg = 'No hay datos del proveedor<br>';
    }
    if (dprov.EMAIL === '') {
      msg += 'Falta definir correo de recepción del proveedor<br>';
    }
    if (this.especUsuarioEmail === '') {
      msg += 'Falta definir correo de envio del usuario<br>';
    }
    if (msg !== "")
      showToast(msg);

    // Prepara y confirma envio de correo
    let asunto = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'ASUNTO EMAIL')?.VALOR_DEFECTO ?? '';
    let email_sale = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'EMAIL SALIENTE')?.VALOR_DEFECTO ?? '';
    asunto = asunto.replace('%NUMERO_ORDEN%', this.DOrdenCompra.DOCUMENTO);
    const dataSource = {
      ORIGEN: this.especUsuarioEmail,
      ORIGEN_EMAIL: email_sale,
      DESTINO: dprov.NOMBRE_COMPLETO,
      DESTINO_EMAIL: dprov.EMAIL,
      ASUNTO: asunto,
      NOTA: ''
    }
    this.eventsSubjectEnvioCorreo.next({ dataSource, visible: true });

  }

  // Respuesta accion del correo
  onRespuestaEnvioCorreo(e: any) {

    showToast('Enviando correo. Espere unos segundos...');

    let template = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'TEMPLATE')?.VALOR_DEFECTO ?? '';
    const ext = this.ltool.makeRandom(30);
    let filtroRep: any = '';
    if (this.rpt_registro === 'todos')
      filtroRep = { FILTRO: this.QFiltro };
    else
      filtroRep = {
        FILTRO: " ORDENES_COMPRA.ID_DOCUMENTO = '" + this.DOrdenCompra.ID_DOCUMENTO + "' " +
          " AND ORDENES_COMPRA.CONSECUTIVO = '" + this.DOrdenCompra.CONSECUTIVO + "'"
      };

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
      template,
      replacements: {
        NUMERO_ORDEN: this.DOrdenCompra.DOCUMENTO,
        DIA_ENTREGA: this.datepipe.transform(this.DOrdenCompra.FECHA_ENTREGA, 'MMMM d, y', undefined, 'es'),
        NOTA: e.NOTA
      }
    };

    console.log("antes de exportar.")
    // Generar el PDF -- Llamar al generador de reportes para que genere archivo pdf
    this._sgenerales.ExportarPDF(prmRpt).subscribe((data: Blob) => {

      console.log("Paso por acá..................")
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

      // Guarda en el log el evento de preparación para envio (antes de enviar)
      // En caso de que NO se logre enviar, éste registro será
      // la evidencia NO fue enviado
      const prm = {
        ID_APLICACION: 'COM-200',
        ORIGEN: 'documento',
        DATOS: this.DOrdenCompra,
        EVENTO: 'PREPARACION ENVIO EMAIL',
        DETALLE: e.DESTINO_EMAIL + ' Status:por enviar',
        USUARIO: this.prmUsrAplBarReg.usuario
      };
      this._sgenerales
        .log('evento log', prm, "ADM-401")
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (res[0].ErrMensaje !== '')
            showToast(res[0].ErrMensaje);
        });
      let datos = {
        data: {
          datos:
            prmRpt
        },
        USUARIO: this.prmUsrAplBarReg.usuario
      }
      console.log(datos);
      this.socket.sendSocket('email', 'get_data_email', datos);
      showToast('Correo enviado.', 'success');
    });


  }

  initNewRow(e) {
    e.data.ID_UN = '';
    e.data.ITEM = 0;
    e.data.PRODUCTO = '';
    e.data.ATRIBUTO = '';
    e.data.CANTIDAD = 0;
    e.data.CANTIDAD_AUTORIZADA = 0;
    e.data.CANTIDAD_PENDIENTE = 0;
    e.data.VALOR_BASE = 0;
    e.data.VALOR_UNITARIO = 0;
    e.data.SUB_TOTAL = 0;
    e.data.VALOR_DESCUENTO = 0;
    e.data.VALOR_COSTOS = 0;
    e.data.GRAVAMENES = [];
    e.data.GRAV_ORG = [];
    e.data.GRAV_TOTAL = [];
    e.data.TOTAL = 0;
    e.data.PORC_IVA = 0;
    e.data.VALOR_IVA = 0;
    e.data.REFERENCIA = "";
    e.data.DETALLE = "";
    e.data.UDM_COMPRA = '';
    e.data.CANTIDAD_PRES = 0;
    e.data.UDM_EQUIV = '';
    e.data.CANTIDAD_EQUIV = 0;
    e.data.CANTIDAD_REAL = 0;
    if (this.DOrdenCompraItems.length > 0) {
      const item = this.DOrdenCompraItems.reduce((ant, act) => { return (ant.ITEM > act.ITEM) ? ant : act })
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
    this.esVisibleSelecc = 'always';
    this.gridOrdenCompraItems.instance.deselectAll();
    e.component.navigateToRow(e.key);
    e.component.addRow();
    this.readOnlyForm = this.DOrdenCompraItems.length > 0 ? true : false;
  }

  insertingRow(e) {
    this.conCambios++;
    e.data.isEdit = true;
    // Valida datos
    if (e.data.PRODUCTO === '') {
      showToast('Faltan completar datos del Producto', 'warning');
      e.cancel = true;
    }
    this.readOnlyForm = this.DOrdenCompraItems.length > 0 ? true : false;
    
  }

  loadDatos() {
    this.loadDataToVariables();
    this.esVisibleCartera = (this.DOrdenCompra.PLAZO > 0 ? true : false);
  }

  loadDataToVariables() {
    this.gridBoxProveedor = [this.DOrdenCompra.ID_PROVEEDOR];
    this.gridBoxUN = [this.DOrdenCompra.ID_UN_DESTINO];
    this.gridBoxMoneda = [this.DOrdenCompra.ID_MONEDA];
    this.gridBoxCondicion = [this.DOrdenCompra.ID_CONDICION];
    this.gridBoxADC = [this.DOrdenCompra.ID_ADC];
    this.sbDocumento = this.DOrdenCompra.DOCUMENTO;
    this.sbTipoVenta = this.DOrdenCompra.TIPO_INVENTARIO;
    this.sbIdDireccion = this.DOrdenCompra.ID_DIRECCION;
    this.sbPlazo = this.DOrdenCompra.PLAZO;
  }

  loadManualDatatables() {
    this.valoresObjetos('direcciones');
    this.valoresObjetos('condicion');
    this.setDocumentoToDatatable();
  }

  removedRow(e) {
    this.setItemValues();
    this.rowApplyChanges = false;
    this.readOnlyForm = this.DOrdenCompraItems.length > 0 ? true : false;
  }

  resetValidaciones() {
    //this.formOrdenCompra.instance.resetValues();
  }

  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (!this.rowApplyChanges) {
      if (this.filasSelecc.length != 0)
        this.rowDelete = true;
      else
        this.rowDelete = false;
    }
  }

  setValoresCartera() {

  }

  setDocumentoToDatatable() {
    this.DDocumentos = [];
    this.DDocumentos.push({ ID_DOCUMENTO: this.DOrdenCompra.ID_DOCUMENTO, CONSECUTIVO: this.DOrdenCompra.CONSECUTIVO, DOCUMENTO: this.DOrdenCompra.ID_DOCUMENTO + '-' + this.DOrdenCompra.CONSECUTIVO });
  }

  setDItemsAux() {
    this.DItemsAux = this.DOrdenCompraItems;
    for (const item of this.DItemsAux) {
      item.APLICACION = 2
    }
  }

  setDOrdenCompraItemsValues(data) {
    // for(const item of data){
    //   for(const DItem of this.DOrdenCompraItems){
    //     if(item.ITEM === DItem.ITEM){
    //       DItem.GRAVAMENES = item.GRAV;
    //       DItem.VALOR_IVA = item.VAL_IVA;
    //       DItem.TOTAL = item.TOTAL;
    //     }
    //   }
    // }
  }

  setItemValues() {
    this.setDItemsAux();
    this.valoresObjetos('gravamenes', 'recalcular');
    this.calcularValores();
  }

  showModal(mensaje: any, titulo = '¡Error!', msg_html = '') {
    const tipo = titulo;
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo === 'Error' ? 'DF3E3E' : '#0F4C81 !important',
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

  updatedRow(e) {
    this.setItemValues();
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
    this.gridOrdenCompraItems.instance.deselectAll();
    this.readOnlyForm = this.DOrdenCompraItems.length > 0 ? true : false;
  }

  updatingRow(e) {
    this.conCambios++;
    if (e.oldData === undefined)
      return;
    e.oldData.isEdit = true;
    this.setItemValues();
    this.readOnlyForm = this.DOrdenCompraItems.length > 0 ? true : false;
  }

  ValidaDatos(Accion: string): boolean {
    var msg = '';
    if (Accion === "requerido") {
      if (this.DOrdenCompra.DOCUMENTO === '') msg += 'Documento ,';
      if (this.DOrdenCompra.FECHA_SOLICITUD == null) msg += 'Fecha de solicitud,';
      if (this.DOrdenCompra.FECHA_ENTREGA === null || this.DOrdenCompra.FECHA_ENTREGA === '') msg += 'Fecha de entrega,';
      if (this.DOrdenCompra.ID_PROVEEDOR === '') msg += 'Proveedor ,';
      if (this.DOrdenCompra.ID_UN_DESTINO === '') msg += 'Bodega ,';
      if (this.DOrdenCompra.ID_MONEDA === '') msg += 'Moneda ,';
      if (this.DOrdenCompra.TIPO_INVENTARIO === '') msg += 'Tipo Inventario ,';
      if (this.DOrdenCompra.ID_CONDICION === '') msg += 'Condición ,';
      if (this.DOrdenCompraItems === undefined || this.DOrdenCompraItems.length === 0) msg += 'Productos: No se ha asociado ningún Producto a la Orden de compra.';
      if (msg !== '') {
        this.showModal("Hay datos incompletos de la Orden de compra. Revisar contenido de los items: " + msg, "Faltan datos", '');
        return false;
      }
    }
    return true;
  }

  // Si está desplegado objetos, cerrar
  onScroll(e: Event): void {
    const elem = e.target as HTMLElement;
    if (elem.className !== "dx-scrollable-container") {
      this.eventsSubjectSboxMoneda.next('cerrar');
      this.eventsSubjectSboxDoc.next('cerrar');
      this.eventsSubjectSboxProv.next('cerrar');
      this.eventsSubjectSboxBodega.next('cerrar');
      this.eventsSubjectSboxCond.next('cerrar');
      this.eventsSubjectSboxPlazo.next('cerrar');
      this.eventsSubjectSboxTinv.next('cerrar');
      this.eventsSubjectSboxProducto.next('cerrar');
    }
  }

  // Para tamaños de pantalla
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

  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined) {
    if (obj == 'documento' || obj == 'todos') {
      const prm = { ID_APLICACION: 'COM-200', USUARIO: localStorage.getItem('usuario') };
      this._sdatos
        .consulta('DOCUMENTOS CONSECUTIVO', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DDocumentos = res;
          this.eventsSubjectSboxDoc.next({
            dataSource: this.DDocumentos,
            valueExpr: "DOCUMENTO",
            displayExpr: "DOCUMENTO",
            columnData: ["DOCUMENTO"],
            valueData: this.DOrdenCompra.DOCUMENTO
          });
          if (this.DDocumentos != null && this.DDocumentos.length == 1 && !this.readOnly) {
            this.sbDocumento = this.DDocumentos[0].DOCUMENTO;
            this.DOrdenCompra.DOCUMENTO = this.DDocumentos[0].DOCUMENTO;
            this.DOrdenCompra.ID_DOCUMENTO = this.DDocumentos[0].ID_DOCUMENTO;
            this.DOrdenCompra.CONSECUTIVO = this.DDocumentos[0].CONSECUTIVO;
          }
        });
    }

    if (obj == 'productos' || obj == 'todos') {
      if ((this.DOrdenCompra.ID_CONDICION && this.DOrdenCompra.ID_CONDICION !== '') &&
          (this.DOrdenCompra.ID_PROVEEDOR && this.DOrdenCompra.ID_PROVEEDOR !== '') &&
          (this.DOrdenCompra.ID_UN_DESTINO && this.DOrdenCompra.ID_UN_DESTINO !== '')
      ) {
        const prm = {
          MOVIMIENTO: 'ORDEN DE COMPRA',
          ID_CONDICION: this.DOrdenCompra.ID_CONDICION,
          ID_PROVEEDOR: this.DOrdenCompra.ID_PROVEEDOR,
          ID_BODEGA: this.DOrdenCompra.ID_UN_DESTINO
        };
        const accion = 'PRODUCTOS COMPRAS';
        this._sdatos.consulta(accion, prm, 'PRO-022').subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          // this.DProductos = res;
          // this.DProductosLista = JSON.parse(JSON.stringify(res));
          // this.DProductos = new DataSource({
          //   store: res,
          //   paginate: true,
          //   pageSize: 20
          // });
          this.DProductos = JSON.parse(JSON.stringify(res));
          /*this.eventsSubjectSboxProducto.next({ dataSource: this.DProductos, 
                                                valueExpr: "PRODUCTO",
                                                displayExpr: "PRODUCTO",
                                                columnData: ["PRODUCTO","NOMBRE"],
                                                valueData: "" });
            */
        });
      }
    }

    if (obj == 'proveedores' || obj == 'todos') {
      this._sdatos.consulta('proveedores', { ESTADO: 'ACTIVO', CONSULTA: 'compras' }, 'CXP-200').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DProveedores = res;
        this.eventsSubjectSboxProv.next({
          dataSource: this.DProveedores.map(({ ID_PROVEEDOR, NOMBRE_COMPLETO }) => ({ ID_PROVEEDOR, NOMBRE_COMPLETO })),
          valueExpr: "ID_PROVEEDOR",
          displayExpr: "ID_PROVEEDOR",
          columnData: ["ID_PROVEEDOR", "NOMBRE_COMPLETO"],
          valueData: this.DOrdenCompra.ID_PROVEEDOR
        });
      });
    }

    if (obj == 'gravamenes' || obj == 'ref') {
      var prm = {};
      if (opcion !== 'original')
        prm = {
          ORDEN_COMPRA: this.DOrdenCompra,
          ITEMS: this.DOrdenCompraItems, APL_GRAV: opcion
        };
      else
        prm = {
          ORDEN_COMPRA: this.DOrdenCompra,
          ITEMS: this.DOrdenCompraItems, OPCION_GRAV: opcion
        };
      this._sdatos
        .consulta('GRAVAMENES', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== '') {
            this.showModal(res[0].ErrMensaje, 'Error cálculo gravamenes');
          }
          else {
            this.DOrdenCompraGrav = res[0].ENCAB;
            this.DOrdenCompraGravItems = res[0].ITEMS;
            this.calcularValores();
            // Aplica a los items
            if (opcion !== undefined) {
              this.DOrdenCompraItems.forEach(item => {
                const nx = this.DOrdenCompraGravItems.findIndex(gi => gi.ITEM == item.ITEM);
                item.VALOR_IVA = this.DOrdenCompraGravItems[nx].VALOR_IVA;
                item.SUB_TOTAL = this.DOrdenCompraGravItems[nx].SUB_TOTAL;
                item.TOTAL = this.DOrdenCompraGravItems[nx].TOTAL;
                item.GRAVAMENES = this.DOrdenCompraGravItems[nx].GRAVAMENES;
                item.GRAV_TOTAL = this.DOrdenCompraGravItems[nx].GRAV_TOTAL;
              });
            }
          }
        });
    }

    if (obj === 'tasas legales' || obj === 'todos') {
      const prm = {};
      this._sdatos.consulta('LISTA GRAVAMENES', prm, 'generales').subscribe((data: any) => {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else
          this.DGravamenes = res;
        this.DGravamenes.forEach(eleg => {
          eleg.PORCENTAJE = (eleg.PORCENTAJE < 0 ? "(" : "") +
            formatNumber((eleg.PORCENTAJE < 0 ? -1 : 1) * eleg.PORCENTAJE * 100, 'en-US', '1.2-2') +
            (eleg.PORCENTAJE < 0 ? ")" : "");
          eleg.VALOR_BASE = formatNumber(eleg.VALOR_BASE, 'en-US', '1.2-2');
        });
      });
    }

    if (obj == 'un' || obj == 'todos') {
      this._sdatos.consulta('BODEGAS', { ESTADO: 'ACTIVO' }, 'INV-002').subscribe((data: any) => {
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
          valueData: this.DOrdenCompra.ID_UN_DESTINO
        });

      });
    }

    if (obj == 'monedas' || obj == 'todos') {
      this._sdatos.consulta('MONEDAS', { ESTADO: 'ACTIVO' }, 'ADM-004').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DMonedas = res;
        this.eventsSubjectSboxMoneda.next({
          dataSource: this.DMonedas,
          valueExpr: "ID_MONEDA",
          displayExpr: "ID_MONEDA",
          columnData: ["ID_MONEDA", "DESCRIPCION"],
          valueData: this.DOrdenCompra.ID_MONEDA
        });

      });
    }

    if (obj == 'tipo inventario' || obj == 'todos') {
      this._sdatos.consulta('TIPO INVENTARIO', { ESTADO: 'ACTIVO' }, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DTipoInv = res;
        this.eventsSubjectSboxTinv.next({
          dataSource: this.DTipoInv,
          columnData: [],
          style: { width: 200 },
          valueData: this.DOrdenCompra.TIPO_INVENTARIO
        });

      });
    }

    if (obj == 'condicion' || obj == 'ref') {
      this._sdatos.consulta('CONDICIONES PROVEEDOR', { ID_PROVEEDOR: this.DOrdenCompra.ID_PROVEEDOR }, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DCondiciones = res;
        this.DPlazos = this.DCondiciones.find(e => e.ID_CONDICION === this.DOrdenCompra.ID_CONDICION).PLAZO;
        this.eventsSubjectSboxCond.next({
          dataSource: this.DCondiciones,
          valueExpr: "ID_CONDICION",
          displayExpr: "ID_CONDICION",
          columnData: ["ID_CONDICION", "NOMBRE"],
          valueData: this.DOrdenCompra.ID_CONDICION
        });
        this.eventsSubjectSboxPlazo.next({
          dataSource: this.DPlazos,
          columnData: [],
          style: { width: 200 },
          valueData: this.DOrdenCompra.PLAZO
        });

      });
    }

    if (obj == 'especificaciones' || obj == 'todos') {
      this._sdatos.consulta('ESPECIFICACIONES',
        { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, USUARIO: this.prmUsrAplBarReg.usuario },
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

    // Lista de reportes de la aplicación
    if (obj == 'reportes' || obj == 'todos') {
      const prm = { ID_APLICACION: this.prmUsrAplBarReg.aplicacion }
      this._sbarreg.listaInformes(prm).subscribe((data) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.listaReportes = [];
        let k = 0;
        res.forEach((rep: any) => {
          this.listaReportes.push({
            text: rep.NOMBRE,
            id_reporte: rep.ID_REPORTE,
            archivo: rep.ARCHIVO,
            item: k,
            especificacion: rep.ESPECIFICACION !== '' ? JSON.parse(rep.ESPECIFICACION) : {}
          })
          k++;
        });
      });
    }

    // Verificador de envio de correos, lista de los que no se han enviado
    if (obj == 'log email') {
      this._sdatos.consulta('log email',
        { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, USUARIO: this.prmUsrAplBarReg.usuario },
        this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.logEmailNoEnviados = res;
          if (this.logEmailNoEnviados.length !== 0) {
            var htmmsg = this.logEmailNoEnviados.map(e => e.HTML);
            htmmsg = '<head>' +
              '</head><table style="text-align: left; width: 100%;">' +
              htmmsg + '</table>';
            this.showModal('', 'No se han enviado email para algunas Ordenes de compra:', htmmsg);
          }

        });
    }

  }

  ngOnInit(): void {
    const user: any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: 'ORDENES_COMPRA',
      aplicacion: 'COM-200',
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
    this.readOnlyForm = true;
    this.readOnlyUdp = true;
    this.rowNew = false;
    this._sdatos.accion = 'r_ini';

    window.addEventListener('scroll', this.onScroll, true);
    this.accordionExpand = [false, false, false];
    // this.valoresObjetos('todos');
    this.valoresObjetos('especificaciones');
    this.valoresObjetos('log email');
    this.opBlanquearForma();

    // Llamado externo
    this.route.params.subscribe(parameter => {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      const codePrm = urlParams.get('prm_rpt');
      if (codePrm) {

      }
    });

    // this.intervalLogNoEmail = setInterval(() => {
    //   this.valoresObjetos('log email');
    // }, 10000);

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subscriptionPedidos.unsubscribe();
    this.subs_visor.unsubscribe();
  }
}