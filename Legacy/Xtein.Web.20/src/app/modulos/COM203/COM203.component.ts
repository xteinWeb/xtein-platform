import { CommonModule, DatePipe, formatNumber } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridModule, DxDateBoxModule, DxFormComponent, DxFormModule, DxLoadPanelModule, DxPopupModule, DxSelectBoxModule, DxNumberBoxModule, DxTextBoxModule, DxCheckBoxModule, DxDropDownBoxModule, DxDataGridComponent, DxDropDownBoxComponent } from 'devextreme-angular';
import { Subject, Subscription, lastValueFrom } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { clsMovimientos, clsMovimientosItems, RespuestaConfig } from './clsCOM203.class';
import { COM203Service } from 'src/app/services/COM203/COM203.service';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { showToast } from '../../shared/toast/toastComponent.js';
import { libtools } from 'src/app/shared/common/libtools';
import Swal from 'sweetalert2';
import { validatorRes } from 'src/app/shared/validator/validator';
import DataSource from 'devextreme/data/data_source';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { COM20301Component } from './COM20301/COM20301.component';
import { COM20302Component } from './COM20302/COM20302.component';
import { COM20305Component } from './COM20305/COM20305.component';
import { FiltrobusqComponent } from 'src/app/shared/filtrobusq/filtrobusq.component';
import { COM20304Component } from './COM20304/COM20304.component';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';
import { SocketService } from 'src/app/services/socket/socket.service';
import { GeneralesService } from 'src/app/services/generales/generales.service';

// Clase para manejar la respuesta de configuración


@Component({
  selector: 'app-COM203',
  templateUrl: './COM203.component.html',
  styleUrls: ['./COM203.component.css'],
  standalone: true,
  imports: [DxFormModule, CommonModule, DxSelectBoxModule, DxDateBoxModule, DxButtonModule,
    COM20301Component, COM20302Component, COM20305Component, FiltrobusqComponent,
    COM20304Component, DxLoadPanelModule, GeninformesComponent, DxPopupModule, DxDataGridModule, DxNumberBoxModule, DxTextBoxModule, DxCheckBoxModule, DxDropDownBoxModule]
})
export class COM203Component {
  @ViewChild("formMovimientos", { static: false }) formMovimientos: DxFormComponent;
  @ViewChild("gridProLista", { static: false }) gridProLista: DxDataGridComponent;
  @ViewChild("ddProductos", { static: false }) ddProductos: DxDropDownBoxComponent;
  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  colCountByScreen: object;

  prmUsrAplBarReg: clsBarraRegistro;
  conCambios: number = 0;
  mnuAccion: string;
  VDatosReg: any;
  keyFila: any;

  tabsInfoAcreedores: string[] = ['Identificación', 'Ubicaciones', 'Financieros', 'Histórico'];

  // El MOVIMIENTO define la aplicacion
  aplicacionBase: string = "";

  // Datos del MOVIMIENTO
  FMovimientos: clsMovimientos;
  DSalidas: clsMovimientos;
  DItemsMovimientos: clsMovimientosItems[] = [];
  FMovimientos_prev: any;
  DMovimientos: clsMovimientos;
  DItemsAux: any = [];
  DMovimientos_prev: any;
  DMovimientosGrav: any;
  DMovimientosGravItems: any;
  DMovimientosItems_prev: any;
  DMovimientosGrav_prev: any;
  DProductos: any;
  DProductosLista: any;
  DProveedores: any;
  DClientes: any;
  DClientesFac: any;
  DClientesFacBase: any[] = [];
  DDocumentos: any;
  DListaMovimientos: any;
  DListaTiposMov: any;
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
  especUsuarioEmail: string = '';
  especModoEnvioEmail: string = '';
  especVisibleTotales: any;
  DTotales: any;
  readOnly: boolean;
  readOnlyForm: boolean;
  esEdicion: boolean = false;
  esInicioDatos: boolean = false;
  esCreacion: boolean = false;
  esInicioObj: any;

  // Datos reporte
  rpt_id_reporte: string;
  rpt_archivo: string;
  rpt_datosrpt: any;
  rpt_registro: string;
  listaReportes: any[] = [];

  // Alternativas
  DEstados: any[] = ['ACTIVO', 'INACTIVO'];
  selectActividad: any[] = [];
  USUARIOS_NOTIFICAR: any[] = [];
  treeBoxGrupo: any[] = [];
  perfilButton: any;
  isTreeBoxOpened: boolean;
  focusedRowKey: string;

  dropDownOptionsDoc = {
    width: 600,
    height: 200,
    hideOnParentScroll: true,
    container: '#router-container'
  };
  dropDownOptions = {
    width: 600,
    height: 400,
    hideOnParentScroll: true,
    container: '#router-container'
  };
  dropDownOptionsCliente: any = {
    width: 600,
    height: 400,
    hideOnParentScroll: true,
    container: '#router-container',
    toolbarItems: [{
      location: 'before',
      toolbar: 'top',
      template: 'tempEncab',
    }]
  };
  tabVisible: any[] = ["block", "none", "none", "none"];

  QFiltro: any;
  filterIdLegal: any = '';

  eventsSubjectInformes: Subject<any> = new Subject<any>();
  eventsSubjectFiltro: Subject<any> = new Subject<any>();
  eventsSubjectItems: Subject<any> = new Subject<any>();
  eventsSubjectEntrada: Subject<any> = new Subject<any>();
  eventsSubjectTraslado: Subject<any> = new Subject<any>();
  eventsSubjectSalida: Subject<any> = new Subject<any>();
  eventsSubjectCliente: Subject<any> = new Subject<any>();
  eventsSubjectTotales: Subject<any> = new Subject<any>();
  customValueSboxTipo: boolean = false;

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
  // Bandera para prevenir múltiples clics en el guardado
  isGuardandoMovimiento: boolean = false;

  // notificaciones
  type = 'info'
  toaVisible: boolean;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';
  loadingVisible: boolean = false;
  positionOf: string;
  USUARIO_LOCAL: any = '';
  EMPRESA: any = '';
  NOMBRE_USUARIO_LOCAL: any = '';

  callbacks = [];
  borderStyle: string = "none";
  dropDownOptionsArr: any;


  visiblePopupEtiquetas: boolean = false;
  DGProudctosMovEtiquetas: any = [];
  DataInformeEtiquetas: any;

  // Variables para la modal de recepción
  visiblePupupRecepcion: boolean = false;
  proveedorSeleccionado: string = '';
  bodegaSeleccionada: string = '';
  IdDocumento: string = '';
  ordenCompraSeleccionada: string = '';
  DOrdenesCompra: any[] = [];
  DProveedoresProductos: any[] = [];

  // Variables para operaciones en lote
  filasSeleccionadas: any[] = [];
  productoAsociadoLote: string = '';
  cantidadLote: number = 0;

  constructor(
    private _sdatos: COM203Service,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private datepipe: DatePipe,
    private SVisor: SvisorService,
    private tabService: TabService,
    public generalesService: GeneralesService,
    // public wsocket: SocketService,
    public socket: SocketService,
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
    })

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex(d => d.ID_DOCUMENTO === resp.ID_DOCUMENTO);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    })

    this.colCountByScreen = {
      xs: 1,
      sm: 2,
      md: 2,
      lg: 2,
    };

    this.ValideExistencia = this.ValideExistencia.bind(this);
    this.operacionesSettings = this.operacionesSettings.bind(this);
  }

  // Valores de cargue inicial
  valoresDefecto() {
    if (this.especAplicacion) {
      // Cuentas de email usuario
      this.especUsuarioEmail = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'EMAIL USUARIO' && e.ID_APLICACION == (this.DMovimientos?.ID_APLICACION ?? ''))?.TITULO ?? '';
      this.especModoEnvioEmail = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'MODO ENVIO EMAIL' && e.ID_APLICACION == (this.DMovimientos?.ID_APLICACION ?? ''))?.VALOR_DEFECTO ?? '';
      this.especVisibleTotales = this.especAplicacion.find(e => e.NOMBRE_OBJETO === this.FMovimientos.TIPO + ' VISIBLE TOTALES' && e.ID_APLICACION == (this.DMovimientos?.ID_APLICACION ?? ''))?.ACTIVADO ?? true;

    }
  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase();
    this.EMPRESA = localStorage.getItem('empresa')?.toUpperCase();
    this.NOMBRE_USUARIO_LOCAL = localStorage.getItem("user_name");
    this.prmUsrAplBarReg = {
      tabla: "MOVIMIENTOS",
      aplicacion: "COM-203",
      aplicacionBase: '',
      usuario: this.USUARIO_LOCAL,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: {r_modificar: false, r_copiar: false}
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';
    this._sdatos.accion = 'r_ini';
    this.FMovimientos = new clsMovimientos;
    this.FMovimientos = {
      ID_DOCUMENTO: '',
      CONSECUTIVO: 0,
      DOCUMENTO: '',
      DETALLE: '',
      ESTADO: '',
      FECHA: this.datepipe.transform(new Date, 'MM/dd/yyyy'),
      FECHA_REGISTRO: this.datepipe.transform(new Date, 'MM/dd/yyyy'),
      FECHA_VENCIMIENTO: this.datepipe.transform(new Date, 'MM/dd/yyyy'),
      HORA: this.datepipe.transform(new Date, 'HH:mm:ss'),
      USUARIO: '',
      TIPO: '',
      ID_CLIENTE: '',
      NOMBRE_CLIENTE: '',
      FACTURA: '',
      TIPO_COMPRA: '',
      TOTALES: '',
      GRAVAMENES: '',
      ID_ADC: '',
      ID_CONDICION: '',
      ID_MONEDA: '',
      ID_PROVEEDOR: '',
      ID_UN: '',
      ID_UN_DESTINO: '',
      ID_UN_ORIGEN: '',
      MOVIMIENTO: '',
      NC_DOC_SOPORTE: 0,
      DESTINO: '',
      NOMBRE_DOCUMENTO: '',
      ORIGEN: '',
      PROVEEDOR: '',
      PREFIJO: '',
      SUB_TOTAL: 0,
      SUFIJO: '',
      TASA_CAMBIO: 0,
      TIPO_INVENTARIO: '',
      TOTAL: 0,
      VALOR_DESCUENTO: 0,
      VIGENCIA: '',
      PLAZO: 0,
      ID_SOPORTE: '',
      NC_SOPORTE: 0,
      ID_APLICACION: ''
    };

    // Inicializa datos
    this.valoresObjetos('todos');

    // Inicializa totales
    this.DTotales = [{ ITEM: 1, CONCEPTO: 'Sub total', FRM_VALOR: '0', VALOR: 0 },
    { ITEM: 2, CONCEPTO: 'Iva', FRM_VALOR: '0', VALOR: 0 }
    ];

  }

  ngAfterViewInit(): void {
    this.activarEdicion('ini');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  onCellPrepared(e) {
    if (e.rowType === 'totalFooter') {
      if (e.summaryItems.length > 0 && e.summaryItems[0].value > 0) {
        e.cellElement.querySelector(".dx-datagrid-summary-item").style.fontSize = '16px';
        e.cellElement.querySelector(".dx-datagrid-summary-item").style.fontWeight = 'bold';
        e.cellElement.querySelector(".dx-datagrid-summary-item").style.color = 'green';
      }
    }
    if (e.rowType === 'data') {
      if (e.data.CONCEPTO == 'Sub total') {
        e.cellElement.style.fontSize = '16px';
        e.cellElement.style.fontWeight = 'bold';
      }
      if (e.data.CONCEPTO == 'Sub total') {
        e.cellElement.style.fontSize = '16px';
        e.cellElement.style.fontWeight = 'bold';
      }
    }


  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes

    switch (operMenu.accion) {
      case "r_ini":
        this.prmUsrAplBarReg = {
          tabla: 'MOVIMIENTOS',
          aplicacion: 'COM-203',
          aplicacionBase: '',
          usuario: this.USUARIO_LOCAL,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_modificar: false, r_copiar: false },
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_nuevo':
        this.mnuAccion = "new";
        // console.log('idAplicacion: ', this.prmUsrAplBarReg.aplicacion);
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = "update";
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case 'r_buscar':
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        this.forzarBloqueoEdicionBarra();
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_buscar_ejec':
        this.forzarBloqueoEdicionBarra();
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

      case 'r_eliminar':
        this.opEliminar();
        break;

      case "r_primero":
      case "r_anterior":
      case "r_siguiente":
      case "r_ultimo":
      case "r_numreg":
        this.forzarBloqueoEdicionBarra();
        this.opIrARegistro(operMenu.accion);
        break;

      case 'r_cancelar':
        var mensaje = '¿Desea cancelar la operación?';
        if (this.conCambios != 0) mensaje = '¿Desea cancelar sin guardar cambios?';
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
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              operacion: { r_modificar: false, r_copiar: false },
            };
            // Restituye los valores
            this.readOnly = true;
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.mnuAccion = "";
            this.opIrARegistro('r_numreg');
          }
        });
        break;

      case 'r_vista':
        this.opVista();
        break;

      case 'r_imprimir':
        if (operMenu.operacion.id_reporte === "COM-204-002") {
          // Consulta los otros datos: items, gravamenes, adicionales
          const prm = { ID_DOCUMENTO: this.FMovimientos.ID_DOCUMENTO, CONSECUTIVO: this.FMovimientos.CONSECUTIVO };
          this._sdatos.consulta('consulta adicionales', prm, this.prmUsrAplBarReg.aplicacion)
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
            this.DGProudctosMovEtiquetas = res[0].ITM_MOVIMIENTOS;
            this.visiblePopupEtiquetas = true;

            var prmRep = {
              ...operMenu.operacion,
              accion: 'previsualizar',
              aplicacion: this.prmUsrAplBarReg.aplicacion,
              tabla: this.prmUsrAplBarReg.tabla,
            usuario: this.prmUsrAplBarReg.usuario,
            QFiltro: (operMenu.operacion.registro === 'todos')
              ? this.QFiltro
              : " MOVIMIENTOS.ID_DOCUMENTO = '" + this.FMovimientos.ID_DOCUMENTO + "' AND MOVIMIENTOS.CONSECUTIVO = " + this.FMovimientos.CONSECUTIVO
            };
            this.DataInformeEtiquetas = prmRep;
          });

        } else {

          var prmRep = {
            ...operMenu.operacion,
            accion: 'previsualizar',
            aplicacion: this.prmUsrAplBarReg.aplicacion,
            tabla: this.prmUsrAplBarReg.tabla,
          usuario: this.prmUsrAplBarReg.usuario,
          QFiltro: (operMenu.operacion.registro === 'todos')
            ? this.QFiltro
            : " MOVIMIENTOS.ID_DOCUMENTO = '" + this.FMovimientos.ID_DOCUMENTO + "' AND MOVIMIENTOS.CONSECUTIVO = " + this.FMovimientos.CONSECUTIVO
          };
          if (operMenu.operacion.modo === 'previsualizar')
            this.eventsSubjectInformes.next(prmRep);

          if (operMenu.operacion.modo === 'pdf') {
            prmRep = { ...prmRep, accion: 'pdf' };
            this.eventsSubjectInformes.next(prmRep);
          }
          if (operMenu.operacion.modo === 'email') {
            let template = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'TEMPLATE')?.VALOR_DEFECTO ?? '';
            let asunto = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'ASUNTO EMAIL')?.VALOR_DEFECTO ?? '';
            let email_sale = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'EMAIL USUARIO')?.VALOR_DEFECTO ?? '';
            let nom_usr = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'EMAIL USUARIO')?.TITULO ?? '';
            var prmRep = {
              ...operMenu.operacion,
              accion: 'email',
              asunto,
              email_sale,
              especUsuarioEmail: nom_usr,
              nombre: this.FMovimientos.ID_DOCUMENTO,
              email: '',
              template,
              replacements: '',
              dataSource: this.FMovimientos
            };
            this.eventsSubjectInformes.next(prmRep);
          }

        }
        break;

      case 'r_refrescar':
        this.valoresObjetos('todos');
        this.eventsSubjectEntrada.next({ operacion: 'r_refrescar' });
        break;

      case 'r_configurar':
        // this.visiblePupupRecepcion = true;
        this.operacionesSettings(operMenu.operacion.data_config);
        break;
      default:
        break;
    }
  }

  opPrepararNuevo(): void {
    // Resetear bandera de guardado para permitir nuevos guardados
    this.isGuardandoMovimiento = false;
    // Activa componentes
    this.opBlanquearForma();
    this.treeBoxGrupo = [];
    this.customValueSboxTipo = true;
    this.activarEdicion('activo');
    this.FMovimientos.ESTADO = 'REGISTRADO';
    this.FMovimientos.USUARIO = this.prmUsrAplBarReg.usuario;
    this.FMovimientos.TIPO_COMPRA = 'CONTADO';
  }

  async opPrepararModificar() {
    // Revertir el estado visual de la barra - volver a modo navegación
    this.prmUsrAplBarReg = {
      ...this.prmUsrAplBarReg,
      accion: "r_numreg",
      operacion: { r_modificar: false, r_copiar: false }
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

    // Resetear acción para que no quede en modo update
    this.mnuAccion = "";

    // Bloquear edición: mostrar mensaje y no ejecutar ninguna funcionalidad de edición
    const numeroRegistro = this.FMovimientos.DOCUMENTO ||
                          (this.FMovimientos.CONSECUTIVO ? `#${this.FMovimientos.CONSECUTIVO}` : '');
    const mensajeRegistro = numeroRegistro ? ` (Registro: ${numeroRegistro})` : '';

    this.showModal(
      `Este registro${mensajeRegistro} no se puede editar.`,
      'Edición Bloqueada',
      ''
    );

    // No ejecutar ninguna funcionalidad de edición
    return;
  }

  ValidaDatos(Accion: string): boolean {
    let msg = '';
    if (Accion === "requerido") {
      if (this.FMovimientos.ID_DOCUMENTO === '') msg += 'Documento ,';
      if (this.FMovimientos.TIPO === '') msg += 'Tipo de movimiento ,';
      // Validar NC_SOPORTE solo si es ENTRADA y ORDEN DE COMPRA
      if (
        this.FMovimientos.MOVIMIENTO &&
        this.FMovimientos.TIPO &&
        this.FMovimientos.MOVIMIENTO.toUpperCase() === 'ENTRADA' &&
        this.FMovimientos.TIPO.toUpperCase() === 'ORDEN DE COMPRA' &&
        (!this.FMovimientos.NC_SOPORTE || this.FMovimientos.NC_SOPORTE === 0)
      ) msg += '#Soporte/Fac ,';
      if (msg !== '') {
        this.showModal("Hay datos incompletos en los datos de " + this.FMovimientos.MOVIMIENTO + ' ' + msg, "Faltan datos", '');
        return false;
      }
    }
    return true;
  }

  opPrepararGuardar(accion: string): void {
    // Prevenir múltiples clics: si ya está guardando, ignorar la llamada
    if (this.isGuardandoMovimiento) {
      return;
    }

    // Acción validación de datos
    if (!this.ValidaDatos('requerido')) {
      return;
    }

    const prmMov = { ...this.FMovimientos, ...this.DMovimientos };
    const prmDatosGuardar = {
      MOVIMIENTOS: this.FMovimientos,
      ITM_MOVIMIENTOS: this.DItemsMovimientos,
      MOVIMIENTOS_GRAV: this.DMovimientosGrav,
      ID_APLICACION: this.aplicacionBase,
      USUARIO: this.prmUsrAplBarReg.usuario
    };

    // Establecer bandera para prevenir múltiples guardados
    this.isGuardandoMovimiento = true;
    // API guardado de datos
    var exito = false;
    this.loadingVisible = true;
    this._sdatos
      .save(accion, prmDatosGuardar, this.prmUsrAplBarReg.aplicacion)
      .subscribe(

        {
          next: (resp) => {

            this.loadingVisible = false;
            try {

              const res = JSON.parse(resp.data);
              if (res[0].ErrMensaje !== "") {
                this.showModal('', 'error', res[0].ErrMensaje);
                // Permitir reintentos si hay error en la respuesta
                this.isGuardandoMovimiento = false;
              }
              else {
                this.readOnly = true;
                this.readOnlyForm = true;
                this.esEdicion = false;
                this.esCreacion = false;
                this.esVisibleSelecc = 'none';

                // Operaciones de barra
                if (this.mnuAccion === 'new') {
                  this.QFiltro = " MOVIMIENTOS.ID_DOCUMENTO = '" + this.FMovimientos.ID_DOCUMENTO + "' AND " +
                    " MOVIMIENTOS.CONSECUTIVO = " + this.FMovimientos.CONSECUTIVO
                  this.prmUsrAplBarReg = {
                    ...this.prmUsrAplBarReg,
                    error: "",
                    accion: "r_numreg",
                    r_numReg: 1,
                    r_totReg: 1,
                    operacion: {"r_modificar": false, "r_copiar": false}
                  };
                }
                else
                  this.prmUsrAplBarReg = {
                    ...this.prmUsrAplBarReg,
                    error: "",
                    accion: "r_numreg",
                    operacion: {"r_modificar": false, "r_copiar": false}
                  };
                this.VDatosReg = [this.FMovimientos];
                this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

                this.FMovimientos.DOCUMENTO = res[0].DOCUMENTO;
                // Ajuste especial para ENTRADA y ORDEN DE COMPRA
                if (
                  this.FMovimientos.MOVIMIENTO === 'ENTRADA' &&
                  this.FMovimientos.TIPO === 'ORDEN DE COMPRA'
                ) {
                  if (this.VDatosReg && this.VDatosReg.length > 0) {
                    this.VDatosReg[0].DOCUMENTO = res[0].DOCUMENTO;
                  }
                }
                this.opIrARegistro('r_primero');

                const movimientoActual = (this.FMovimientos.MOVIMIENTO || '').toUpperCase().trim();
                const aplicaNotificacionAlmacenista =
                  this.mnuAccion === 'new' &&
                  (movimientoActual === 'SALIDA' || movimientoActual === 'TRASLADO');

                // console.log('DEBUG NOTIFICACION - mnuAccion:', this.mnuAccion);
                // console.log('DEBUG NOTIFICACION - movimientoActual:', movimientoActual);
                // console.log('DEBUG NOTIFICACION - aplicaNotificacionAlmacenista:', aplicaNotificacionAlmacenista);
                // console.log('DEBUG NOTIFICACION - Es SALIDA?', movimientoActual === 'SALIDA');
                // console.log('DEBUG NOTIFICACION - Es TRASLADO?', movimientoActual === 'TRASLADO');

                if (aplicaNotificacionAlmacenista) {
                  // console.log('✓ ENTRANDO A notificarAlmacenistasSolicitudMaterial');
                  this.notificarAlmacenistasSolicitudMaterial(res[0], this.FMovimientos.ID_APLICACION);
                }

                showToast('Registro actualizado', 'success');

                // Permitir nuevos guardados
                this.isGuardandoMovimiento = false;

                // Mensaje de accion a seguir con la transacción
                // if (res[0].MsgAccion !== "") {
                if  (res[0].MsgAccion !== "") {
                  this.showModal('', 'Acción!', res[0].MsgAccion, 'warning');
                }
                  //Envio de notificación:::
                  // let msj: any = 'El usuario: ' + this.NOMBRE_USUARIO_LOCAL + ', solicitó Autorización para: '
                  //   + this.FMovimientos.MOVIMIENTO + ' Tipo: ' + this.FMovimientos.TIPO +
                  //   ' para el Documento: ' + this.FMovimientos.DOCUMENTO;
                  // const dataNotificacion: any = {
                  //   APLICACION: this.prmUsrAplBarReg.aplicacionBase,
                  //   ID_APLICACION: this.prmUsrAplBarReg.aplicacionBase,
                  //   NOMBRE_APLICACION: this.FMovimientos.MOVIMIENTO?.toLocaleLowerCase(),
                  //   FECHA: this.datepipe.transform(
                  //     new Date(),
                  //     'MM/dd/yyyy HH:mm:ss'
                  //   ),
                  //   USUARIO_ENV: { ID_RESPONSABLE: this.USUARIO_LOCAL, NOMBRE: this.NOMBRE_USUARIO_LOCAL },
                  //   USUARIO_REC: res[0].USUARIOS_AUT,
                  //   TIPO: 'AUTOMATICA',
                  //   FECHA_UPDATE: this.datepipe.transform(
                  //     new Date(),
                  //     'MM/dd/yyyy HH:mm:ss'
                  //   ),
                  //   ESTADO: 'Enviado',
                  //   SEND_EMAIL: false,
                  //   EMPRESA: this.EMPRESA,
                  //   ESPEC: 'NOTIFICACION',
                  //   TITULO: 'Autorización de Movimiento',
                  //   DESCRIPCION: msj,
                  //   DATOS: this.FMovimientos
                  // }
                  // const data1: any = {
                  //   TIPO: 'NOTIFICACION',
                  //   DATOS: dataNotificacion
                  // }
                  // // API guardado de datos
                  // this.wsocket.saveInfo('SAVE NOTIFICACION', data1).subscribe((data) => {
                  //   const res = JSON.parse(data.data);
                  //   if (res[0].ErrMensaje !== '') {
                  //     this.showModal(res[0].ErrMensaje, 'Error al enviar notificación.');
                  //   } else {
                  //     let datos = {
                  //       data: dataNotificacion,
                  //       USUARIO: dataNotificacion.USUARIO_ENV
                  //     }
                  //     this.wsocket.sendSocket('notificaciones', 'get_data_notificaciones', datos);
                  //   }
                  // });


                  //Envia el responsable
                  // const posApl: any = this.generalesService.APLICACIONES.findIndex((d: any) => d.ID_APLICACION === this.prmUsrAplBarReg.aplicacion);
                  // let dataNotificacion: any = {
                  //   SEND_EMAIL: false,
                  //   EMPRESA: this.EMPRESA,
                  //   NOMBRE_APLICACION: posApl > -1 ? this.generalesService.APLICACIONES[posApl].NOMBRE : null,
                  //   ESPEC: 'NOTIFICACION',
                  //   ACCION: 'REGISTRO',
                  //   APLICACION: this.prmUsrAplBarReg.aplicacion,
                  //   FECHA: new Date(),
                  //   USUARIO_ENV: { ID_RESPONSABLE: this.USUARIO_LOCAL, NOMBRE: this.NOMBRE_USUARIO_LOCAL },
                  //   USUARIO_REC: res[0].USUARIOS_AUT,
                  //   DESCRIPCION: msj,
                  //   TIPO: 'AUTOMATICA',
                  //   FECHA_UPDATE: new Date(),
                  //   ESTADO: 'Enviado'
                  // }
                  // API guardado de datos
                  // const data1: any = {
                  //   TIPO: 'NOTIFICACION',
                  //   DATOS: dataNotificacion
                  // }

                  // this.socket.saveInfo('SAVE NOTIFICACION', data1).subscribe((data) => {
                  //   const res = JSON.parse(data.data);
                  //   if (res[0].ErrMensaje !== '') {
                  //     this.showModal(res[0].ErrMensaje, 'Error al enviar notificación.');
                  //   } else {
                  //     //this.socket.sendNotifications(dataNotificacion);
                  //   }
                  // });

                // }

              }
            }
            catch (error) {
              this.showModal('El movimiento se guardó pero necesita revisión: ' + error);
            }

          },
          error: (e) => {
            this.loadingVisible = false;
            this.showModal('Error al guardar Movimiento: ' + e.error.message);
            // Permitir reintentos si hay error
            this.isGuardandoMovimiento = false;
          }
        });

  }

  /**
   * Envía notificaciones a los usuarios receptores definidos por el backend.
   * Actualmente, el backend retorna USUARIOS_AUT, que puede contener tanto autorizadores como almacenistas
   * según la lógica del SP. Si en el futuro el backend distingue entre USUARIOS_AUT y USUARIOS_ALM,
   * este método debe ajustarse para usar el campo adecuado.
   */
  private notificarAlmacenistasSolicitudMaterial(responseSave: any, Id_Apl_Mov: string): void {
    // Usar USUARIOS_AUT como fuente de usuarios receptores (autorizadores o almacenistas según backend)
    const usuariosReceptoresBase = Array.isArray(responseSave?.USUARIOS_AUT)
      ? responseSave.USUARIOS_AUT
      : responseSave?.USUARIOS_AUT
      ? [responseSave.USUARIOS_AUT]
      : [];
    const usuariosNotificar = Array.isArray(this.USUARIOS_NOTIFICAR)
      ? this.USUARIOS_NOTIFICAR
      : this.USUARIOS_NOTIFICAR
      ? [this.USUARIOS_NOTIFICAR]
      : [];
    const usuariosReceptores = [
      ...new Set(
        [...usuariosReceptoresBase, ...usuariosNotificar]
          .map((usuario: any) => {
            const userId =
              typeof usuario === 'string'
                ? usuario
                : usuario?.USUARIO || usuario?.ID_RESPONSABLE || '';
            return String(userId).trim().toUpperCase();
          })
          .filter((usuario: string) => usuario !== '')
      )
    ];
    console.log('DEBUG - responseSave.USUARIOS_AUT raw:', responseSave?.USUARIOS_AUT);
    console.log('DEBUG - usuariosReceptoresBase:', usuariosReceptoresBase);
    console.log('DEBUG - usuariosReceptores final:', usuariosReceptores);
    // console.log('DEBUG - usuariosReceptores.length:', usuariosReceptores.length);

    if (!usuariosReceptores || usuariosReceptores.length === 0) {
      // console.log('⚠ SALIDA TEMPRANA: No hay usuarios receptores para notificar');
      return;
    }

    const posApl: any = this.generalesService.APLICACIONES.findIndex(
      (d: any) => d.ID_APLICACION === this.prmUsrAplBarReg.aplicacion
    );

    const idDocumento = responseSave?.ID_DOCUMENTO ?? this.FMovimientos.ID_DOCUMENTO;
    const consecutivo = responseSave?.CONSECUTIVO ?? this.FMovimientos.CONSECUTIVO;
    const documento = responseSave?.DOCUMENTO ?? this.FMovimientos.DOCUMENTO;
    const movimiento = responseSave?.MOVIMIENTO ?? this.FMovimientos.MOVIMIENTO;
    const tipo = responseSave?.TIPO ?? this.FMovimientos.TIPO;
    const idUnOrigen = responseSave?.ID_UN_ORIGEN ?? this.FMovimientos.ID_UN_ORIGEN;
    const idUnDestino = responseSave?.ID_UN_DESTINO ?? this.FMovimientos.ID_UN_DESTINO;

    const dataNotificacion: any = {
      SEND_EMAIL: false,
      EMPRESA: this.EMPRESA,
      NOMBRE_APLICACION: posApl > -1 ? this.generalesService.APLICACIONES[posApl].NOMBRE : null,
      ESPEC: 'NOTIFICACION',
      ACCION: 'REGISTRO',
      ID_APLICACION: Id_Apl_Mov,
      APLICACION: this.prmUsrAplBarReg.aplicacion,
      FECHA: new Date(),
      USUARIO_ENV: { ID_RESPONSABLE: this.USUARIO_LOCAL, NOMBRE: this.NOMBRE_USUARIO_LOCAL },
      USUARIO_REC: usuariosReceptores,
      ID_DOCUMENTO: idDocumento,
      CONSECUTIVO: consecutivo,
      DOCUMENTO: documento,
      DESCRIPCION:
        'Nueva solicitud de material: ' +
        movimiento +
        ' ' +
        tipo +
        ' - Documento ' +
        documento,
      TIPO: 'AUTOMATICA',
      FECHA_UPDATE: new Date(),
      ESTADO: 'Enviado',
      ACTIVIDAD: JSON.stringify({
        EMPRESA: this.EMPRESA,
        ESPEC: 'NOTIFICACION',
        ACCION: 'abrir_movimiento',
        CLASE: (() => {
          const mov = (movimiento || '').toUpperCase();
          const tip = (tipo || '').toUpperCase();
          if (mov === 'ENTRADA' && tip === 'TRASLADO') return 'Solicitud Entrada/Traslado Material';
          if (mov === 'SALIDA' && tip === 'TRASLADO') return 'Solicitud Salida/Traslado Material';
          if (mov === 'TRASLADO') return 'Solicitud Traslado Material';
          if (mov === 'ENTRADA') return 'Solicitud Entrada Material';
          if (mov === 'SALIDA') return 'Solicitud Salida Material';
          return 'Solicitud de material';
        })(),
        ACTIVIDAD_DATA: {
          ID_DOCUMENTO: idDocumento,
          CONSECUTIVO: consecutivo,
          DOCUMENTO: documento,
          MOVIMIENTO: movimiento,
          TIPO: tipo,
          ID_UN_ORIGEN: idUnOrigen,
          ID_UN_DESTINO: idUnDestino
        }
      }),
      DATOS: {
        ID_DOCUMENTO: idDocumento,
        DOCUMENTO: documento,
        CONSECUTIVO: consecutivo,
        MOVIMIENTO: movimiento,
        TIPO: tipo,
        ID_UN_ORIGEN: idUnOrigen,
        ID_UN_DESTINO: idUnDestino
      }
    };

    const dataSave: any = {
      TIPO: 'NOTIFICACION',
      DATOS: dataNotificacion
    };

    // DEBUG: mostrar todo lo que se envía al SP
    // console.log('=== NOTIFICACION A ENVIAR AL BACKEND ===');
    // console.log('USUARIO_REC (destinatarios):', dataNotificacion.USUARIO_REC);
    // console.log('USUARIO_ENV (emisor):', dataNotificacion.USUARIO_ENV);
    // console.log('APLICACION:', dataNotificacion.APLICACION);
    // console.log('FECHA:', dataNotificacion.FECHA);
    // console.log('DESCRIPCION:', dataNotificacion.DESCRIPCION);
    // console.log('FECHA_UPDATE:', dataNotificacion.FECHA_UPDATE);
    // console.log('ESTADO:', dataNotificacion.ESTADO);
    // console.log('ACTIVIDAD:', dataNotificacion.ACTIVIDAD);
    // console.log('TIPO:', dataNotificacion.TIPO);
    // console.log('ESPEC:', dataNotificacion.ESPEC);
    // console.log('Objeto completo dataSave:', dataSave);
    // console.log('=====================================');

    this.socket.saveInfo('SAVE NOTIFICACION', dataSave).subscribe((data) => {
      const res = JSON.parse(data.data);
      if (res[0].ErrMensaje !== '') {
        this.showModal(res[0].ErrMensaje, 'Error al enviar notificación.');
      } else {
        const datos = {
          data: dataNotificacion,
          USUARIO: dataNotificacion.USUARIO_ENV
        };
        this.socket.sendSocket('notificaciones', 'get_data_notificaciones', datos);
      }
    });
  }

  opPrepararBuscar(accion): void {
    if (accion === "filtro") {

      // this._sfiltro.PrmFiltro = {
      //   Titulo: "Datos de filtro para Acreedores",
      //   accion: "PREPARAR FILTRO",
      //   Filtro: "",
      //   TablaBase: this.prmUsrAplBarReg.tabla,
      //   aplicacion: this.prmUsrAplBarReg.aplicacion
      // };
      // this._sfiltro.getObsFiltro.emit(true);

      const prmFiltro = {
        Titulo: "Datos de filtro para " + this.tabService.tabs.find(c => c.aplicacion === this.prmUsrAplBarReg.aplicacion)?.title,
        accion: "activar",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
        objRegistro: this._sbarreg,
        objTab: this.tabService,
        usuario: this.prmUsrAplBarReg.usuario,
        title: this.tabService.tabs.find(c => c.aplicacion === this.prmUsrAplBarReg.aplicacion)?.title
      };
      this.eventsSubjectFiltro.next(prmFiltro);

    }
    else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { MOVIMIENTOS: arrFiltro };

      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this._sdatos
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje === '') {
            // Asocia datos
            if (datares ?? '' != '') {
              this.VDatosReg = datares;
              this.FMovimientos = datares[0];
              this.DMovimientos = this.FMovimientos;
              this.QFiltro = datares[0].QFILTRO;

            }

          } else {
            this.VDatosReg = [];
            this.loadingVisible = false;
            //notificació
            showToast(datares[0].ErrMensaje, 'warning');
            //this.opBlanquearForma();
          }
          // Prepara la barra para navegación
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            r_totReg: datares.length,
            r_numReg: 1,
            accion: 'r_numreg',
            operacion: {r_modificar: false, r_copiar: false}
          }

          // Trae los items en los componentes asociados
          this.opIrARegistro('r_primero');
          setTimeout(() => {
            this.forzarBloqueoEdicionBarra();
          }, 0);
          setTimeout(() => {
            this.forzarBloqueoEdicionBarra();
          }, 200);
          this.loadingVisible = false;
          this._sfiltro.enConsulta = false;
        });
    }
  }

  opEliminar(): void {
    Swal.fire({
      title: '',
      text: '',
      html:
        'Desea eliminar el movimiento <i>' +
        this.FMovimientos.MOVIMIENTO + ' Documento: ' +
        this.FMovimientos.ID_DOCUMENTO + ' ' + this.FMovimientos.CONSECUTIVO.toString() +
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
  AccionEliminar(): void {
    // API eliminación de datos
    const prm = {
      MOVIMIENTOS: this.FMovimientos,
      ITM_MOVIMIENTOS: this.DItemsMovimientos,
      MOVIMIENTOS_GRAV: this.DMovimientosGrav,
      ID_APLICACION: this.aplicacionBase,
      USUARIO: this.prmUsrAplBarReg.usuario
    };
    this._sdatos
      .delete('delete', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== '') {
          this.showModal('', 'Error anulación ' + this.FMovimientos.MOVIMIENTO, res[0].ErrMensaje);
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        showToast(this.FMovimientos.MOVIMIENTO + ' anulado!', 'success');
        this.DMovimientos.ESTADO = "ANULADO";
        this.readOnly = true;

        // Operaciones de barra
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          error: '',
          accion: 'r_numreg',
          operacion: { r_modificar: false, r_copiar: false },
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.opIrARegistro("Eliminado");
      });
  }


  // Navegación de registro
  opIrARegistro(accion: string): void {
    this.borderStyle = "none";
    this.prmUsrAplBarReg = {
      ...this.prmUsrAplBarReg,
      accion: "r_numreg",
      aplicacionBase: this.aplicacionBase,
      operacion: {
        ...this.prmUsrAplBarReg?.operacion,
        r_modificar: false,
        r_copiar: false
      }
    };
    switch (accion) {
      case "r_primero":
        this.prmUsrAplBarReg.r_numReg = 1;
        if (this.VDatosReg.length != 0) {
          this.FMovimientos = JSON.parse(JSON.stringify(this.VDatosReg[0]));
        }
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.FMovimientos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this.FMovimientos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.FMovimientos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
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
        }
        else {
          this.opBlanquearForma();
          setTimeout(() => {
            this.formMovimientos.instance.resetValues();
          }, 100);
        }
        break;

      case "Eliminado":
        // this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        // if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
        //   this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        // }
        // if (this.VDatosReg.length >= 0) {
        //   this.FMovimientos =
        //     this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        // }
        break;

      default:
        break;
    }

    // activa/inactiva propiedades
    try {
      this._sdatos.accion = 'r_numreg';
      this.readOnly = true;
      this.aplicacionBase = this.FMovimientos.ID_APLICACION;

      // Inicializar lista de datos y así poder Asignar datos a sbox
      if (!this.esInicioDatos) {
        this.valoresObjetos('todos');
        this.valoresObjetos('condicion');
        this.esInicioDatos = true;
      }

      // Totales OC
      // this.activarCustomValueSbox(true);
      this.customValueSboxTipo = true;
      this.valoresDefecto();

      // Por esoecificacion defecto, no se permite modificar
      if (this.FMovimientos.ESTADO === 'ANULADO')
        this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: false, r_copiar: false, r_eliminar: false } };
      else
        this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: false, r_copiar: false, r_eliminar: true } };

      this.forzarBloqueoEdicionBarra();

      // Consulta los otros datos: items, gravamenes, adicionales
      const prm = { ID_DOCUMENTO: this.FMovimientos.ID_DOCUMENTO, CONSECUTIVO: this.FMovimientos.CONSECUTIVO };
      this._sdatos.consulta('consulta adicionales', prm, this.prmUsrAplBarReg.aplicacion)
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
        this.DItemsMovimientos = res[0].ITM_MOVIMIENTOS;
        this.DMovimientosGrav = res[0].MOVIMIENTOS_GRAV;

        this.eventsSubjectEntrada.next({ operacion: 'consulta', dataSource: this.FMovimientos, espec: this.especAplicacion });
        this.eventsSubjectTraslado.next({ operacion: 'consulta', dataSource: this.FMovimientos, espec: this.especAplicacion });
        this.eventsSubjectItems.next({ operacion: 'consulta', dataSource: this.DItemsMovimientos, espec: this.especAplicacion });
        this.eventsSubjectTotales.next({ operacion: 'ver', prmDatos: res[0].TOTALES, espec: this.especAplicacion });

      });

    } catch (error) {
      this.showModal(error);
    }

  }

  private forzarBloqueoEdicionBarra(): void {
    this.prmUsrAplBarReg = {
      ...this.prmUsrAplBarReg,
      accion: 'r_numreg',
      operacion: {
        ...this.prmUsrAplBarReg?.operacion,
        r_modificar: false,
        r_copiar: false,
      },
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
  }

  opBlanquearForma(): void {
    this.FMovimientos = {
      ID_DOCUMENTO: '',
      CONSECUTIVO: 0,
      DOCUMENTO: '',
      DETALLE: '',
      ESTADO: '',
      FECHA: this.datepipe.transform(new Date, 'MM/dd/yyyy'),
      FECHA_REGISTRO: this.datepipe.transform(new Date, 'MM/dd/yyyy'),
      FECHA_VENCIMIENTO: this.datepipe.transform(new Date, 'MM/dd/yyyy'),
      HORA: this.datepipe.transform(new Date, 'HH:mm:ss'),
      USUARIO: '',
      TIPO: '',
      ID_CLIENTE: '',
      NOMBRE_CLIENTE: '',
      FACTURA: '',
      TIPO_COMPRA: '',
      TOTALES: '',
      GRAVAMENES: '',
      ID_ADC: '',
      ID_CONDICION: '',
      ID_MONEDA: '',
      ID_PROVEEDOR: '',
      ID_UN: '',
      ID_UN_DESTINO: '',
      ID_UN_ORIGEN: '',
      MOVIMIENTO: '',
      NC_DOC_SOPORTE: 0,
      DESTINO: '',
      NOMBRE_DOCUMENTO: '',
      ORIGEN: '',
      PROVEEDOR: '',
      PREFIJO: '',
      SUB_TOTAL: 0,
      SUFIJO: '',
      TASA_CAMBIO: 0,
      TIPO_INVENTARIO: '',
      TOTAL: 0,
      VALOR_DESCUENTO: 0,
      VIGENCIA: '',
      PLAZO: 0,
      ID_SOPORTE: '',
      NC_SOPORTE: 0,
      ID_APLICACION: ''
    };

    this.DMovimientos = this.FMovimientos;
    this.DListaTiposMov = [];
    this.DItemsMovimientos = [];
    this.FMovimientos_prev = JSON.parse(JSON.stringify(this.FMovimientos));
    this.borderStyle = "none";

    // Inicializa adicionales
    this.eventsSubjectItems.next({ operacion: 'nuevo' });
    this.eventsSubjectTotales.next({ operacion: 'ini' });

  }

  onCambioCantidadQR(cellInfo:any, e:any) {
    cellInfo.data.CANTIDAD_QR = e.value;
  }

  aceptarBottom(event: any, action: string) {
    switch (action) {
      case 'aceptar':
        for (let i = 0; i < this.DGProudctosMovEtiquetas.length; i++) {
          const element = this.DGProudctosMovEtiquetas[i];
          if (element.CANTIDAD_QR <= 0 || element.CANTIDAD_QR === null || element.CANTIDAD_QR === undefined) {
            this.showModal('La cantidad de etiquetas a imprimir debe ser mayor a cero para el producto: ' + element.PRODUCTO, 'Warning');
            return;
          }
        }
        // this.eventsSubjectInformes.next({...this.DataInformeEtiquetas, parametros: this.DGProudctosMovEtiquetas });
        const parametros = (this.DGProudctosMovEtiquetas || []).map((p: any) => ({
          PRODUCTO: p.PRODUCTO,
          CANTIDAD_QR: p.CANTIDAD_QR ?? 0
        }));
        const payload = { ...this.DataInformeEtiquetas, parametros: JSON.stringify(parametros) };
        this.eventsSubjectInformes.next(payload);
        this.visiblePopupEtiquetas = false;
        break;
      case 'cancelar':
        this.visiblePopupEtiquetas = false;
        break;
      default:
        this.visiblePopupEtiquetas = false;
        break;
    }
  }

  opVista(): void {
    /*this.prmUsrAplBarReg.error = '';
    this.prmUsrAplBarReg.accion = 'pos_Visor';
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      Titulo: 'Productos',
      Columnas: [
        { Nombre: 'PRODUCTO', Titulo: 'Producto' },
        { Nombre: 'NOMBRE', Titulo: 'Descripción' },
        { Nombre: 'ESTADO', Titulo: 'Estado' },
        { Nombre: 'ID_GRUPO', Titulo: 'Grupo' },
        { Nombre: 'INVENTARIO', Titulo: 'Inventario' },
      ],
      PrmApl: this.prmUsrAplBarReg,
    };
    this.SVisor.setObsVisor.emit();*/
  }

  // Valide CLIENTEes
  async ValideExistencia(e: any) {
    if (this.readOnlyForm || !this.mnuAccion.match('new|update')) {
      return (true);
    }
    if (this.mnuAccion === 'update' && this.FMovimientos_prev.ID_DOCUMENTO === e.value) {
      return (true);
    }

    // Valida la existencia
    const prm = { ID_CLIENTE: e.value, accion: this.mnuAccion };
    const apiRest = this._sdatos.consulta('EXISTE TARIFA', prm, this.prmUsrAplBarReg.aplicacion);
    let res = await lastValueFrom(apiRest, { defaultValue: true });
    res = JSON.parse(res.data);
    if (res[0].ErrMensaje === '') {
      this.activarEdicion('activo');
      return (true);
    }
    else {
      showToast(res[0].ErrMensaje, 'error');
      var fNextEditor: any = this.formMovimientos.instance.getEditor('ID_TASA');
      fNextEditor.focus();
      this.activarEdicion('inactivo');
      return (false);
    }

  }

  onChangeFecha(e) {
    this.FMovimientos.FECHA = this.datepipe.transform(e.value, 'MM/dd/yyyy');
  }
  onChangeFechaReg(e) {
    this.FMovimientos.FECHA_REGISTRO = this.datepipe.transform(e.value, 'MM/dd/yyyy');
  }

  // Genera las facturas correspondientes por cada inmueble activo
  clickGenerarFac(e) {

    const prm = this.FMovimientos;
    this._sdatos.consulta('GENERACION', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
      const res = validatorRes(data);
      if ((data.token != undefined)) {
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      this.eventsSubjectItems.next({ operacion: 'generacion', dataSource: res });
      this.DItemsMovimientos = res;
    });

  }

  // Lista de posibles tarifas para generación
  verTarifa(item) {
    if (item)
      return (item.ID_TARIFA ? item.ID_TARIFA + '; ' + formatNumber(item.VALOR, 'en-US', '1.2-2') : item);
    else
      return "";
  }


  // Activa campos de la forma para edición
  // dependiendo de la acción a realizar
  activarEdicion(accion) {
    switch (accion) {
      case 'llave':
        this.esEdicion = false;
        this.readOnly = true;
        this.readOnlyForm = false;
        this.eventsSubjectItems.next({ operacion: 'inactivo' });
        break;
      case 'activo':
        this.esEdicion = true;
        this.readOnly = false;
        this.readOnlyForm = false;
        this.eventsSubjectItems.next({ operacion: 'activo' });
        break;
      case 'consulta':
      case 'ini':
        this.esEdicion = false;
        this.readOnly = true;
        this.readOnlyForm = true;
        this.eventsSubjectItems.next({ operacion: 'inactivo' });
        break;

      default:
        break;
    }
  }

  onTabChanged(e: any) {
    switch (e.itemIndex) {
      case 0:
        this.tabVisible = ["block", "none", "none", "none"];
        break;
      case 1:
        this.tabVisible = ["none", "block", "none", "none"];
        break;
      case 2:
        this.tabVisible = ["none", "none", "block", "none"];
        break;
      case 3:
        this.tabVisible = ["none", "none", "none", "block"];
        break;
      default:
        break;
    }
  }

  // Retorna respuesta de la Entrada
  onRespuestaEntrada(e: any) {
    this.DMovimientos = e.datos;
    this.eventsSubjectItems.next({ operacion: 'productos' });
  }

  // Retorna respuesta de un Traslado o tipo traslado
  onRespuestaTraslado(e: any) {
    this.DMovimientos = e.datos;
    this.eventsSubjectItems.next({ operacion: 'productos' });
  }

  // Respuesta de los items
  onRespuestaItems(e: any) {
    this.DItemsMovimientos = e.data;
    this.DTotales = e.totales;
    this.eventsSubjectTotales.next({
      operacion: 'ver',
      prmDatos: this.DTotales
    });
  }
  onRespuestaFiltro(e: any) {
    console.log("ddsadsdas")
  }
  onRespuestaTotales(e: any) {
  }

  // Crea cliente, Refresca lista y agrega
  onRespuestaCrearCliente(e: any) {

    if (e.accion === 'aceptar') {
      // Agragar a la lista
      // const arrnuevo = { ID_CLIENTE: e.data.ID_CLIENTE,
      //                    NOMBRE_COMPLETO: e.data.NOMBRE+(' '+e.data.NOMBRE2).trimEnd()+' '+e.data.APELLIDO+(' '+e.data.APELLIDO2).trimEnd()};
      // // Adds the entry to the data source
      // this.DClientesFac.store().insert(arrnuevo);
      // // Reloads the data source
      // this.DClientesFac.reload();

      // // Selecciona cliente
      // this.FMovimientos.ID_CLIENTE = e.data.ID_CLIENTE;
      // this.FMovimientos.NOMBRE = e.data.NOMBRE+(' '+e.data.NOMBRE2).trimEnd()+' '+e.data.APELLIDO+(' '+e.data.APELLIDO2).trimEnd();

    }
  }

  // Color status del ESTADO
  setBackgroundStyle(estado: string): string {
    const styles = {
      'REGISTRADO': 'background-color: #e8f5e8;',
      'AUTORIZADO': 'background-color:rgb(132, 223, 170);',
      'PARCIAL': 'background-color:rgb(240, 152, 217);',
      'ANULADO': 'background-color:rgb(242, 161, 169);'
    };

    return styles[estado] || 'background-color:rgb(238, 232, 232);';
  }

  // Movimiento principal
  onSeleccMovimiento(e: any): void {
    if (this.readOnly) return;
    if (e.value == '') return;

    // Identificación del movimiento
    this.FMovimientos.MOVIMIENTO = e.value;
    const apl = this.DListaMovimientos.find(m => m.MOVIMIENTO === e.value);
    if (apl) {
      // console.log('ID_APLICACION seleccionado:', apl.ID_APLICACION);
      this.aplicacionBase = apl.ID_APLICACION;
      this.FMovimientos.ID_APLICACION = apl.ID_APLICACION;
    }
    else {
      this.showModal('No está asociada ninguna aplicación a este movimiento: ' + e.value);
      return;
    }

    // Activa componente respectivo del movimiento
    setTimeout(() => {
      switch (this.FMovimientos.MOVIMIENTO) {
        case "ENTRADA":
          this.eventsSubjectEntrada.next({ operacion: 'ini' });
          break;

        default:
          break;
      }
    }, 300);

    // Carga documento / consecutivo
    // Activa componente respectivo
    if (this.FMovimientos.MOVIMIENTO === 'TRASLADO')
      this.valoresObjetos('documento');

    // Activa tipos de transaccion para el movimiento
    this.valoresObjetos('tipos movimiento');
    this.valoresObjetos('especificaciones');

    // Caso solo TRASLADO
    setTimeout(() => {
      if (this.FMovimientos.MOVIMIENTO === 'TRASLADO') {
        // Activa y carga acciones para los items
        this.FMovimientos.TIPO = 'TRASLADO';
        setTimeout(() => {
          this.eventsSubjectTraslado.next({
            operacion: 'nuevo',
            MOVIMIENTO: this.FMovimientos.MOVIMIENTO,
            TIPO: this.FMovimientos.TIPO,
            espec: this.especAplicacion
          });

          this.eventsSubjectItems.next({
            operacion: 'nuevo',
            espec: this.especAplicacion,
            DMovimientos: this.FMovimientos
          });
        }, 300);

      }

      // Valida cambio de movimiento
      if (e.value !== e.previousValue) {
        if (this.DItemsMovimientos.length !== 0 ||
          this.FMovimientos.ID_UN_ORIGEN !== '' ||
          this.FMovimientos.ID_UN_DESTINO !== ''
        ) {
          showToast('Se reiniciarán los datos');
          this.opPrepararNuevo();
          this.FMovimientos.MOVIMIENTO = e.value;
        }
      }

    }, 300);

  }

  // Tipo operación según Movimiento
  onSeleccTipo(e: any): void {
    if (this.readOnly) return;

    this.FMovimientos.TIPO = e.value;
    this.DMovimientos = { ...this.DMovimientos, ...this.FMovimientos };

    // Activa objetos en la forma de acuerdo al tipo de facturación
    setTimeout(() => {
      if (this.FMovimientos.TIPO.match('ORDEN DE COMPRA')) {
        this.eventsSubjectEntrada.next({
          operacion: 'nuevo',
          MOVIMIENTO: this.FMovimientos.MOVIMIENTO,
          TIPO: this.FMovimientos.TIPO,
          espec: this.especAplicacion
        });
      } else {
        this.eventsSubjectTraslado.next({
          operacion: 'nuevo',
          MOVIMIENTO: this.FMovimientos.MOVIMIENTO,
          TIPO: this.FMovimientos.TIPO,
          espec: this.especAplicacion
        });
      }

      // Activa y carga acciones para los items
      this.eventsSubjectItems.next({
        operacion: 'nuevo',
        espec: this.especAplicacion,
        DMovimientos: this.FMovimientos
      });

    }, 300);

    this.FMovimientos.TIPO_COMPRA = 'CREDITO';
    this.valoresObjetos('documento');
    this.valoresObjetos('especificaciones');

  }

  onSeleccDocumento(e: any): void {
    if (this.DDocumentos == undefined) return;
    const ddoc = this.DDocumentos.find(doc => doc.DOCUMENTO === e.value);
    if (ddoc) {
      this.FMovimientos.ID_DOCUMENTO = ddoc.ID_DOCUMENTO;
      this.FMovimientos.CONSECUTIVO = ddoc.CONSECUTIVO;
    }
  }


  // Selección del cliente
  onSeleccCliente(e: any): void {
    const dcli = this.DClientesFacBase.find(ya => ya.ID_CLIENTE === e.value);
    if (dcli) {
      this.FMovimientos.NOMBRE_CLIENTE = dcli.NOMBRE_COMPLETO;

      // Trae facturas
      const prm = { ID_CLIENTE: e.value };
      this._sdatos
        .consulta('CONSULTA FACTURA CLIENTES', prm, "HOR-001")
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.FMovimientos.FACTURA = res[0].FACTURA;
        });

    }
  }

  // Abre popup para creación del cliente
  crearCliente(e, accion) {
    this.eventsSubjectCliente.next({ operacion: 'nuevo', titulo: 'Crear cliente' });
  }
  refreshClick(objeto) {
    // this.checkProSoloPrecio.instance.option("value", false);
    // this.checkProProveedor.instance.option("value", false);
    this.valoresObjetos('clientes');
  }

  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined) {

    if (obj == 'documento') {
      const prm = {
        ID_APLICACION: this.aplicacionBase,
        MOVIMIENTO: this.FMovimientos.MOVIMIENTO,
        TIPO: this.FMovimientos.TIPO,
        USUARIO: localStorage.getItem('usuario')
      };
      this._sdatos
        .consulta('DOCUMENTOS CONSECUTIVO', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DDocumentos = res;
          if (this.DDocumentos != null && this.DDocumentos.length == 1 && !this.readOnly) {
            this.FMovimientos.DOCUMENTO = this.DDocumentos[0].DOCUMENTO;
            this.FMovimientos.ID_DOCUMENTO = this.DDocumentos[0].ID_DOCUMENTO;
            this.FMovimientos.CONSECUTIVO = this.DDocumentos[0].CONSECUTIVO;
          }
        });
    }

    if (obj == 'movimientos' || obj == 'todos') {
      const prm = { USUARIO: localStorage.getItem('usuario') };
      this._sdatos
        .consulta('MOVIMIENTOS USUARIO', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DListaMovimientos = res;
        });
    }

    if (obj == 'tipos movimiento') {
      // Carga tipos autorizados
      const prmt = {
        MOVIMIENTO: this.FMovimientos.MOVIMIENTO,
        ID_APLICACION: this.aplicacionBase,
        USUARIO: this.prmUsrAplBarReg.usuario
      };
      this._sdatos
        .consulta('TIPO MOVIMIENTOS USUARIO', prmt, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const mensaje = res[0].ErrMensaje;
          if (mensaje !== '') {
            if (this.FMovimientos.MOVIMIENTO !== 'TRASLADO')
              showToast(mensaje, 'error');
          } else {
            this.DListaTiposMov = res;
            if (res.length === 1 && !this.readOnly) {
              this.FMovimientos.TIPO = res[0].TIPO;
              this.valoresObjetos('documento');
            }
          }
        });
    }

    if (obj == 'especificaciones' || obj == 'todos') {
      this._sdatos.consulta('ESPECIFICACIONES',
        {
          ID_APLICACION: this.aplicacionBase,
          USUARIO: this.prmUsrAplBarReg.usuario,
          ID_APLICACION_BASE: this.prmUsrAplBarReg.aplicacion
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

          // Establece especs para los totales e items
          this.eventsSubjectTotales.next({ operacion: 'ini', espec: this.especAplicacion });
          this.eventsSubjectItems.next({ operacion: 'ini', espec: this.especAplicacion });

        });
    }

    if (obj == 'clientes') {
      this._sdatos.consulta('CLIENTES',
        { CONSULTA: 'basica', USUARIO: this.prmUsrAplBarReg.usuario },
        'HOR-001')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DClientesFacBase = res;
          this.DClientesFac = new DataSource({
            store: res,
            paginate: true,
            pageSize: 20
          });

        });
    }


  }

  // Imprimir reporte de aplicación
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
    this.tabService.addTab(new Tab(VisorrepComponent,    // visor
      datosrpt.text,        // título
      { parent: "PrincipalComponent", args: prmLiq }, // parámetro: reporte,filtro
      id_reporte,           // código del reporte
      '',
      'reporte',
      true
    ));

  }

  showModal(mensaje, titulo = '', html = '', iconw = '') {
    Swal.fire({
      iconHtml: (iconw == '' ? "<i class='icon-cancelar-ol error-color'></i>" : "<i class='icon-alert-ol error-color'></i>"),
      confirmButtonColor: '#0F4C81',
      title: (titulo !== '' ? titulo : '¡Error!'),
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


  async operacionesSettings(datos: any) {
    let opcion = "componente";
    // Solo en modo edición
    if (this.mnuAccion != "update" && this.mnuAccion != "new") {
      this.showModal('Esta operación no está permitida en modo consulta.');
      return;
    }
  if(this.FMovimientos.MOVIMIENTO === 'ENTRADA' && this.FMovimientos.TIPO === 'ORDEN DE COMPRA' ){
      let prmDatos = {
        ACCION: "Recepcion facturas",
        ID_APLICACION: "COM-204",
        USUARIO: this.prmUsrAplBarReg.usuario,
        MOVIMIENTOS: {
          ID_UN_ORIGEN:this.FMovimientos.ID_PROVEEDOR
        }
      };
      console.log('Parámetros para consulta de órdenes de compra:', prmDatos);
      this._sdatos
        .consulta('acciones settings', prmDatos, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          try {
            const res = JSON.parse(data.data);
            console.log('Datos recibidos:', res);

            const config = new RespuestaConfig(res[0]);
            console.log('Configuración de respuesta:', config);
             switch (config.getTypeAccion()) {

              case "componente":
                if (config.LISTA_OC) {

                  this.DOrdenesCompra = config.LISTA_OC.map((item: any) => {
                    return {
                      CODIGO: item.CONSECUTIVO, // El ID numérico (9189, 9465, etc.)
                      DESCRIPCION: item.DOCUMENTO,
                      ID_DOCUMENTO: item.ID_DOCUMENTO,
                      BODEGA: item.ID_UN_BODEGA
                    };
                  });
                  console.log('Órdenes de compra procesadas:', this.DOrdenesCompra);

                  // Cargar los datos de recepción en la grilla
                  this.DProveedoresProductos = config.RECEPCION || [];
                  console.log('Datos de recepción cargados:', this.DProveedoresProductos);

                  const primerRegistro = res[0];
                  this.proveedorSeleccionado = this.DMovimientos.ID_PROVEEDOR || primerRegistro.ID_PROVEEDOR;
                  this.bodegaSeleccionada = this.DOrdenesCompra[0].BODEGA;

                  this.ordenCompraSeleccionada = `${primerRegistro.ID_DOCUMENTO} ${primerRegistro.CONSECUTIVO}`;

                } else {
                  this.DOrdenesCompra = [];
                  this.DProveedoresProductos = [];
                  console.warn('No se encontraron órdenes para este proveedor');
                }
                  this.visiblePupupRecepcion = true;
                // }

                break;

              default:
                if(this.FMovimientos.ID_PROVEEDOR == ""){
                  this.showModal('Primero debe asociar un proveedor', 'Error');
                }else{
                  this.showModal('No hay facturas asociadas a este proveedor', 'Error');
                }

                break;
            }

          } catch (error) {
            console.error('Error al procesar respuesta:', error);
            this.showModal('Error al procesar la respuesta del servidor', 'Error');
            this.DOrdenesCompra = [];
          }
        });
    }


  }

  closePopUpRecepcion(){
    this.visiblePupupRecepcion = false;
  }

  onOrdenCompraChange(e: any) {
    this.ordenCompraSeleccionada = e.value;

    // Buscar la orden de compra seleccionada en el array
    const ordenSeleccionada = this.DOrdenesCompra.find(orden => orden.CODIGO === e.value);
    console.log('Orden de compra seleccionada:', ordenSeleccionada);
    // Actualizar la bodega con la bodega asociada a la orden de compra seleccionada
    if (ordenSeleccionada) {
      this.bodegaSeleccionada = ordenSeleccionada.BODEGA;
      this.IdDocumento = ordenSeleccionada.ID_DOCUMENTO;
    }

    const accion = 'productos ordenes';
    const prm = {
      ORDEN_COMPRA: `${ordenSeleccionada.ID_DOCUMENTO}${ordenSeleccionada.CODIGO}`,
    }

    this._sdatos.consulta(accion, prm, 'COM-203').subscribe((data: any) => {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      this.DProductos = JSON.parse(JSON.stringify(res));
      // Preparar la propiedad displayText para el dropdown
      this.DProductos = this.DProductos.map(producto => ({
        ...producto,
        displayText: `${producto.PRODUCTO} - ${producto.NOMBRE}`
      }));
    });

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
    setTimeout(() => {
      // this.gridProLista.instance.searchByText(cellInfo.data.PRODUCTO);
    }, 100);
  }

    onInputListaPro(e, cellInfo:any) {
    setTimeout(() => {
      this.gridProLista.instance.searchByText(e.event.target.value);
    }, 100);
  }

  onSearchChanged(e: any): void {
    if (e.fullName === 'searchPanel.text') {
      const grid = e.component;
      const searcWords = e.value?.trim().toLowerCase();
      this.ltool.searchText = searcWords;
    }
  }

  customizeColumnsSearch(columns: Array<any>) {
    columns.forEach((column: any) => {
      column.calculateFilterExpression = this.ltool.customCalculateFilterExpression.bind(column);
      column.cellTemplate = this.ltool.customCellTemplate.bind(this);
    })
  }

  // Métodos para el dropdown de productos en el popup de recepción
  onSelectProduct(e: any, cellInfo: any) {
    const selectedProduct = e.data;
    cellInfo.setValue(selectedProduct.PRODUCTO);
    // Cerrar el dropdown automáticamente
    setTimeout(() => {
      const dropdownBox = cellInfo.component;
      if (dropdownBox && dropdownBox.close) {
        dropdownBox.close();
      }
    }, 100);
  }

  onProductoAsociadoChange(e: any, cellInfo: any) {
    if (cellInfo && cellInfo.setValue) {
      cellInfo.setValue(e.value);
    }
  }

  // Métodos para operaciones en lote
  onSelectionChanged(e: any) {
    this.filasSeleccionadas = e.selectedRowsData;
  }

  // Prepara datos para el componente COM20302 (entrada)
  prepararDatosEntrada(datosRecepcion: any[]) {
    // Tomar el primer item para extraer información común
    const primerItem = datosRecepcion[0];

    return {
      ID_PROVEEDOR: this.proveedorSeleccionado,
      ID_UN_DESTINO: this.bodegaSeleccionada,
      ID_SOPORTE: primerItem.ID_FACTURA || '',
      NC_SOPORTE: primerItem.NC_FACTURA || 0,
      ID_CONDICION: this.FMovimientos.ID_CONDICION || 'CP01',
      DETALLE: `Recepción de ${datosRecepcion.length} productos - Orden: ${this.ordenCompraSeleccionada}`
    };
  }

  // Método para guardar la recepción
  guardarRecepcion() {
    // Validar que haya al menos un producto seleccionado o modificado
    const productosParaGuardar = this.DProveedoresProductos.filter(producto =>
      producto.PRODUCTO_ASOCIADO || producto.CANTIDAD_MODIFICADA
    );

    if (productosParaGuardar.length === 0) {
      this.showModal('Debe asociar al menos un producto o modificar cantidades antes de guardar', 'Advertencia');
      return;
    }

    // Preparar el JSON con los datos
    const datosRecepcion = {
      PROVEEDOR: this.proveedorSeleccionado,
      ORDEN_COMPRA: `${this.IdDocumento} ${this.ordenCompraSeleccionada}`,
      BODEGA: this.bodegaSeleccionada,
      FECHA_RECEPCION: new  Date().toISOString(),
      USUARIO: this.USUARIO_LOCAL,
      PRODUCTOS: productosParaGuardar.map(producto => ({
        FACTURA: producto.FACTURA,
        PRODUCTO: producto.PRODUCTO,
        NOMBRE_PRODUCTO: producto.NOMBRE_PRODUCTO,
        PRODUCTO_ASOCIADO: producto.PRODUCTO_ASOCIADO || '',
        CANTIDAD: producto.CANTIDAD,
        VALOR_UNITARIO: producto.VALOR_UNITARIO,
        ITM_TOTAL: producto.ITM_TOTAL
      })),

    };

    this.FMovimientos.ID_UN_ORIGEN = this.proveedorSeleccionado;
    this.FMovimientos.ID_CONDICION = "CP01";

    const prm = {
      ACCION: 'Cargar recepcion',
      ID_APLICACION: this.aplicacionBase,
      USUARIO: this.USUARIO_LOCAL,
      MOVIMIENTOS: this.FMovimientos,
      RECEPCION: datosRecepcion
    }

    console.log('Datos de recepción a enviar:', datosRecepcion);

    // Mostrar loading
    // this.loadingVisible = true;

    // Llamar a la API
    this._sdatos.consulta('cargar datos', prm, 'COM-203')
      .subscribe({
        next: (response: any) => {
          this.loadingVisible = false;
          try {
            const res = JSON.parse(response.data);
            console.log('Respuesta parseada:', res);

            // Actualizar token si es necesario
            if (response.token != undefined) {
              const refreshToken = response.token;
              localStorage.setItem("token", refreshToken);
            }

            // Verificar si hay errores en la respuesta
            const tieneErrores = res.some(item => item.ErrMensaje && item.ErrMensaje !== '');

            if (tieneErrores) {
              const primerError = res.find(item => item.ErrMensaje && item.ErrMensaje !== '');
              this.showModal(primerError.ErrMensaje, 'Error');
            } else {

              showToast('Recepción guardada exitosamente', 'success');
              this.closePopUpRecepcion();

              // Enviar datos de respuesta al componente COM20301 para llenar la grid
              // Los datos están directamente en el array res
              if (res && res.length > 0) {
                console.log('Enviando datos al componente COM20301:', res);
                this.eventsSubjectItems.next({
                  operacion: 'cargar_datos_recepcion',
                  datos: res,
                  movimiento: this.FMovimientos
                });

                // Enviar datos también al componente COM20302
                const datosEntrada = this.prepararDatosEntrada(res);
                console.log('Enviando datos al componente COM20302:', datosEntrada);
                this.eventsSubjectEntrada.next({
                  operacion: 'cargar_datos_recepcion',
                  datos: datosEntrada,
                  movimiento: this.FMovimientos
                });
              }

              // Opcional: refrescar datos o realizar otras acciones post-guardado
              // this.valoresObjetos('todos');
            }
          } catch (error) {
            console.error('Error al procesar respuesta:', error);
            this.showModal('Error al procesar la respuesta del servidor', 'Error');
          }
        },
        error: (error) => {
          this.loadingVisible = false;
          console.error('Error en la llamada a la API:', error);
          this.showModal('Error al conectar con el servidor: ' + error.message, 'Error');
        }
      });
  }

}
