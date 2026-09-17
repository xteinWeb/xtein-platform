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
  DxButtonModule, DxCheckBoxComponent, DxCheckBoxModule, DxDataGridComponent, DxDataGridModule, DxDateBoxComponent, DxDateBoxModule, DxDropDownBoxModule,
  DxFormComponent, DxFormModule, DxListModule, DxLoadPanelModule, DxNumberBoxModule, DxSelectBoxComponent, DxSelectBoxModule,
  DxTextBoxModule,
  DxTooltipComponent,
  DxTooltipModule
} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule, DatePipe, formatNumber } from '@angular/common';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { showToast } from '../../shared/toast/toastComponent.js';
import { XcSelectboxComponent } from 'src/app/shared/xc-selectbox/xc-selectbox.component';
import DataSource from 'devextreme/data/data_source';
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
import { clsOrdenProduccion, clsOrdenProduccionItems } from './clsPRO025.class.js';
registerLocaleData(localeEs, 'es');

@Component({
  selector: 'app-PRO025',
  templateUrl: './PRO025.component.html',
  styleUrls: ['./PRO025.component.scss'],
  providers: [{ provide: LOCALE_ID, useValue: 'es' }],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxSelectBoxModule, CdkAccordionModule, DxDropDownBoxModule,
    DxDataGridModule, DxDateBoxModule, DxTextBoxModule, DxNumberBoxModule, DxLoadPanelModule,
    DxButtonModule, VistarapidaComponent, DxTooltipModule, DxListModule,
    DxCheckBoxModule, FemailComponent
  ]
})

export class PRO025Component implements OnInit {
  @ViewChild('formOrdenProd', { static: false }) formOrdenProd: DxFormComponent;
  @ViewChild("gridOPItems", { static: false }) griDOrdenProduccionItems: DxDataGridComponent;
  @ViewChild("xs_FECHA_ENTREGA", { static: false }) fechaEntrega: DxDateBoxComponent;
  @ViewChild("checkProSoloPrecio", { static: false }) checkProSoloPrecio: DxCheckBoxComponent;
  @ViewChild("checkProProveedor", { static: false }) checkProProveedor: DxCheckBoxComponent;
  @ViewChild("xs_PRODUCTOS", { static: false }) sboxProductos: DxSelectBoxComponent;
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
  conCambios: number = 0;
  UN_DEF: string;
  MONEDA_DEF: string;
  TIPO_CONDLISTA: string;
  ID_APLICACION: any = 'PRO-025';
  stylingMode = 'filled';
  dropDownOptions: any = {
    width: 700,
    height: 400,
    hideOnParentScroll: true,
    container: '#router-container',
    toolbarItems: [{
      location: 'before',
      toolbar: 'top',
      template: 'tempEncab',
    }]
  };
  dropDownOptionsListBox = { hideOnParentScroll: true, container: '#router-container' };
  dSBEstados = ["REGISTRADO", "ANULADO", "COMPLETADO", "EN PROCESO"];
  accordionExpand: any;
  eventsSubjectSboxMoneda: Subject<any> = new Subject<any>();
  eventsSubjectSboxDoc: Subject<any> = new Subject<any>();
  eventsSubjectSboxUN: Subject<any> = new Subject<any>();
  eventsSubjectSboxProducto: Subject<any> = new Subject<any>();
  eventsSubjectEnvioCorreo: Subject<any> = new Subject<any>();
  eventsSubjectFiltro: Subject<any> = new Subject<any>();
  visibleIvas: boolean = false;
  keyFila: any;
  setValueHandler: any;
  infoIva: any;
  customValueSbox: boolean = false;

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
  DOrdenProduccion: clsOrdenProduccion;
  DOrdenProduccionItems: clsOrdenProduccionItems[] = [];
  DItemsAux: any = [];
  DPidos: any = [];
  DPidos_prev: any = [];
  DOrdenProduccion_prev: any;
  DOrdenProduccionItems_prev: any;
  DOrdenProduccionGrav_prev: any;
  DProductos: any;
  DProductosLista: any;
  DProveedores: any;
  DDocumentos: any;
  DUnidadMedida: any;
  DTiposVenta: any;
  DListasPrecios: any;
  DGravamenes: any;
  DADC: any;
  DAtributos: any;
  DDirecciones: any;
  DUNItem: any;
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
  opendDrop: any = {
    PEDIDO: false,
    PRODUCTOS: false,
    CLIENTE: false
  };

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
    private route: ActivatedRoute
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
    // this.onChangeFecha = this.onChangeFecha.bind(this);
    this.onSeleccRowProducto = this.onSeleccRowProducto.bind(this);
    this.onChangeProducto = this.onChangeProducto.bind(this);
    this.onCellPrepared = this.onCellPrepared.bind(this);

  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes
    this._sdatos.accion = operMenu.accion;
    switch (operMenu.accion) {
      case 'r_ini':
        const user: any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'ORDENES_PRODUCCION',
          aplicacion: 'PRO-025',
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
        this.esVisibleSelecc = 'always';
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.readOnly = false;
        this.esVisibleSelecc = 'always';
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case 'r_buscar':
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        if (this._sfiltro.enConsulta === false) {
          this.DPidos = this.DPidos_prev;
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_buscar_ejec':
        this.opBlanquearForma();
        if (operMenu.operacion.filtro_arg) {
          this.opPrepararBuscar(operMenu.operacion.filtro_arg)
        } else {
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
        if (this.DOrdenProduccion.ESTADO === 'REGISTRADO')
          this.opEliminar();
        else {
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
              this.esVisibleSelecc = 'none';
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
              if (this.VDatosReg.length > 0)
                this.DPidos = this.DPidos_prev;

              this.DOrdenProduccion = JSON.parse(JSON.stringify(this.DOrdenProduccion_prev));
              this.DOrdenProduccionItems = JSON.parse(JSON.stringify(this.DOrdenProduccionItems_prev));
              // this.DOrdenProduccionGravItems = this.DOrdenProduccionGrav.filter(e => e.APLICACION === 1);
              this.opIrARegistro('r_numreg');

              // Restituye los valores
              this.mnuAccion = '';
              clearInterval(this.intervalHora);
            }
          });
        }

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
            this.esVisibleSelecc = 'none';
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            if (this.VDatosReg.length > 0)
              this.DPidos = this.DPidos_prev;

            this.DOrdenProduccion = JSON.parse(JSON.stringify(this.DOrdenProduccion_prev));
            this.DOrdenProduccionItems = JSON.parse(JSON.stringify(this.DOrdenProduccionItems_prev));
            // this.DOrdenProduccionGravItems = this.DOrdenProduccionGrav.filter(e => e.APLICACION === 1);
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
    this.customValueSbox = false;
    this.DOrdenProduccion_prev = this.DOrdenProduccion;
    this.DOrdenProduccionItems_prev = this.DOrdenProduccionItems;
    this.DOrdenProduccion = {
      ID_UN: '',
      ID_DOCUMENTO: '',
      CONSECUTIVO: 0,
      DOCUMENTO: '',
      FECHA: new Date(),
      HORA: new Date(),
      PEDIDO: '',
      DESCRIPCION: '',
      USUARIO: this.prmUsrAplBarReg.usuario,
      ESTADO: 'REGISTRADO',
      PRODUCTO: ''
    };
    // if (!this.esInicioDatos)
    //   this.valoresObjetos('todos');
    // else
    this.valoresObjetos('documento');
    this.DPidos = this.DPidos_prev.filter((d: any) => d.ESTADO !== 'ANULADO' && d.ESTADO !== 'COMPLETADO' && d.ESTADO !== 'PROGRAMADO');
    // setTimeout(() => {
    //   // this.DOrdenProduccion.FECHA_ENTREGA = new Date();
    //   this.valoresDefecto();
    //   // this.activarCustomValueSbox(false);
    // }, 500);

    this.intervalHora = setInterval(() => {
      this.DOrdenProduccion.HORA = new Date();
    }, 1000);

  }

  copiarOrden(): void {
    this.mnuAccion = 'new';
    this.esVisibleSelecc = 'always';
    this.readOnly = false;
    this.valoresObjetos('documento');
    this.DOrdenProduccion.ESTADO = 'REGISTRADO';
    this.intervalHora = setInterval(() => {
      this.DOrdenProduccion.HORA = new Date();
    }, 1000);
  }

  // Valores de cargue inicial
  valoresDefecto() {
    if (this.especAplicacion) {
      this.especMonedaFormato = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'FORMATO MONEDA')?.FORMATO ?? '#,##0.00';
      this.especCantidadFormato = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'FORMATO CANTIDAD')?.FORMATO ?? '#,##0.00';

      // Cuentas de email usuario
      this.especUsuarioEmail = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'EMAIL COMPRAS')?.TITULO ?? '';

    }
  }

  // Cerrar opción de valor libre en los sbox
  activarCustomValueSbox(accion: boolean) {
    this.eventsSubjectSboxDoc.next({ customValue: accion });
    this.eventsSubjectSboxProducto.next({ customValue: accion });
    this.activarCustomValueSbox(false);
  }

  async opPrepararModificar() {
    this.readOnly = false;
    this.DOrdenProduccion_prev = this.DOrdenProduccion;
    this.DOrdenProduccionItems_prev = this.DOrdenProduccionItems;
    this.DPidos = this.DPidos_prev.filter((d: any) => d.ESTADO !== 'ANULADO' && d.ESTADO !== 'COMPLETADO' && d.ESTADO !== 'PROGRAMADO');
    clearInterval(this.intervalHora);
  }

  opPrepararGuardar(accion: string): void {
    // Acción validación de datos
    if (!this.ValidaDatos('requerido')) {
      return;
    }

    const prmDatosGuardar = { ORDEN_PRODUCCION: this.DOrdenProduccion, ITM_ORDEN_PRODUCCION: this.DOrdenProduccionItems };

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
        } else {
          this.readOnly = true;
          this.esVisibleSelecc = 'none';
          clearInterval(this.intervalHora);

          // Operaciones de barra
          if (this.mnuAccion === 'new') {
            this.QFiltro = " ORDENES_PRODUCCION.ID_DOCUMENTO = '" + this.DOrdenProduccion.ID_DOCUMENTO + "' " +
              " AND ORDENES_PRODUCCION.CONSECUTIVO = '" + this.DOrdenProduccion.CONSECUTIVO + "'"
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
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Ordenes de producción",
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: "ORDENES_PRODUCCION",
        aplicacion: this.prmUsrAplBarReg.aplicacion
      };
      this._sfiltro.getObsFiltro.emit(true);

    } else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { ORDENES_PRODUCCION: arrFiltro };
      this.loadingVisible = true;

      // Ejecuta búsqueda API
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
            // this.DOrdenProduccion = datares[0];
            // this.DOrdenProduccionItems = datares[0].ITM;
            this.QFiltro = datares[0].QFILTRO;

            // Prepara la barra para navegación
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              r_totReg: datares.length,
              r_numReg: 1,
              accion: 'r_navegar',
              operacion: { r_modificar: false },
            };
          } else {
            this.VDatosReg = [];
            showToast(datares[0].ErrMensaje, 'warning');
            this.opBlanquearForma();

            // Prepara la barra para navegación
            const user: any = localStorage.getItem('usuario');
            this.prmUsrAplBarReg = {
              tabla: 'ORDENES_PRODUCCION',
              aplicacion: 'PRO-025',
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
    this.resetValidaciones();
  }

  opEliminar(): void {
    Swal.fire({
      title: '',
      text: '',
      html:
        'Desea Anular la Orden de producción <i>' +
        this.DOrdenProduccion.ID_DOCUMENTO +
        '-' +
        this.DOrdenProduccion.CONSECUTIVO +
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
    var newArray: any = [];
    this.prmUsrAplBarReg.accion = 'r_numreg';
    switch (accion) {
      case 'r_primero':
        this.prmUsrAplBarReg.r_numReg = 1;
        if (this.VDatosReg.length != 0) {
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          showToast('No se encontraron Datos', 'error');
          this.readOnly = true;
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length ? this.VDatosReg.length : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;
      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
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
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearForma();
          this.resetValidaciones();
        }
        this.readOnly = true;
        break;
      case 'Eliminado':
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          newArray = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        } else {
          this.opBlanquearForma();
        }
        break;
      default:
        break;
    }

    // Inicializar lista de datos y así poder Asignar datos a sbox
    // if (!this.esInicioDatos) {
    //   this.valoresObjetos('todos');
    //   this.valoresObjetos('condicion');
    //   this.esInicioDatos = true;
    // }

    // Totales OC
    // this.customValueSbox = true;
    this.DOrdenProduccion = newArray;
    this.DOrdenProduccionItems = newArray.ITM;
    this.DOrdenProduccion.PEDIDO = JSON.parse(this.DOrdenProduccion.PEDIDO);

    // Por esoecificacion defecto, no se permite modificar
    if (this.DOrdenProduccion.ESTADO === 'ANULADO')
      this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: this.especModificarOrden, r_eliminar: false } };
    else
      this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: this.especModificarOrden, r_eliminar: true } };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

    // // Consulta los otros datos: items, gravamenes, adicionales
    // const prm = { ID_DOCUMENTO: this.DOrdenProduccion.ID_DOCUMENTO, CONSECUTIVO: this.DOrdenProduccion.CONSECUTIVO};
    // this._sdatos
    //   .consulta('consulta adicionales', prm, this.prmUsrAplBarReg.aplicacion)
    //   .subscribe((data: any) => {
    //     const res = JSON.parse(data.data);
    //     if ( (data.token != undefined) ){
    //       const refreshToken = data.token;
    //       localStorage.setItem("token", refreshToken);
    //     }
    //     if (res[0].ErrMensaje !== ''){
    //       this.showModal(res[0].ErrMensaje, 'error');
    //       return;
    //     }
    //     this.DOrdenProduccionItems = res[0].ITM_ORDENES_PRODUCCION;
    //   });
  }

  opVista(): void {
    const VDatosRegAux = this.VDatosReg.map(({ ID_DOCUMENTO, CONSECUTIVO, FECHA, HORA, FECHA_ENTREGA, DESCRIPCION, USUARIO, ESTADO }) => ({ ID_DOCUMENTO, CONSECUTIVO, FECHA, HORA, FECHA_ENTREGA, DESCRIPCION, USUARIO, ESTADO }));
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(VDatosRegAux));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'Ordenes de produccion',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: '',
      Filtro: '',
      keyGrid: ['ID_DOCUMENTO', 'CONSECUTIVO'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opBlanquearForma(): void {
    var now = new Date();
    this.DOrdenProduccion = {
      ID_UN: '',
      ID_DOCUMENTO: '',
      CONSECUTIVO: 0,
      DOCUMENTO: '',
      FECHA: now,
      HORA: now,
      PEDIDO: '',
      DESCRIPCION: '',
      USUARIO: this.prmUsrAplBarReg.usuario,
      ESTADO: 'REGISTRADO',
      PRODUCTO: ''
    };
    this.DOrdenProduccionItems = [];
    this._sdatos.ID_DOCUMENTO = '';
    this._sdatos.CONSECUTIVO = '';
    this._sdatos.ID_DOCUMENTO_prev = '';
    this._sdatos.CONSECUTIVO_prev = '';
    this.DOrdenProduccion_prev = JSON.parse(JSON.stringify(this.DOrdenProduccion));
    this.DOrdenProduccionItems_prev = JSON.parse(JSON.stringify(this.DOrdenProduccionItems));
  }

  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        this.gridBoxProducto = [];
        this.griDOrdenProduccionItems.instance.addRow();
        this.rowApplyChanges = true;
        this.esVisibleSelecc = 'none';
        break;
      case 'edit':
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this.esVisibleSelecc = 'none';
        break;
      case 'save':
        this.griDOrdenProduccionItems.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        break;
      case 'cancel':
        this.griDOrdenProduccionItems.instance.cancelEditData();
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
              const index = this.DOrdenProduccionItems.findIndex(a => a.ITEM === key);
              this.DOrdenProduccionItems.splice(index, 1);
            });
            this.griDOrdenProduccionItems.instance.refresh();
            this.conCambios++;
            this.setItemValues();
          }
        });
        break;

      default:
        break;
    }
  }

  onChangeCantidad(rowData: any, value: any, currentRowData: any) {
    rowData.CANTIDAD = value;
    rowData.SUB_TOTAL = rowData.CANTIDAD * currentRowData.VALOR_UNITARIO;
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


  onFocusedRowChanged(e) {
    const rowData = e.row && e.row.data;
    if (rowData) {
      this.gridBoxProducto = [rowData.PRODUCTO]
      this.valoresObjetos('atributos');
    }
  }

  onEditCanceled(e) {
    this.esVisibleSelecc = 'always';
  }
  onCellHoverChanged(e) {
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
    if (e.rowType === "header" && e.rowIndex === 2) {
      e.rowElement.style.display = "none";
    }
  }

  onRowValidating(e: any) {
    // Valida completitud
    var errMsg = '';
    if (e.newData.PRODUCTO !== undefined && e.newData.PRODUCTO == '')
      errMsg = 'Falta seleccionar producto';
    if (e.newData.CANTIDAD !== undefined && e.newData.CANTIDAD <= 0)
      errMsg = 'Cantidad no puede ser cero';
    if (errMsg !== '') {
      e.isValid = false;
      showToast(errMsg, 'warning');
      return;
    }
  }

  onSeleccDocumento(e: any): void {
    if (this.readOnly) return;
    if (e === undefined) return;
    if (e.value === "") return;

    // this.sbDocumento = e.value;
    this.DOrdenProduccion.DOCUMENTO = e.value;
    this.enableProductosItems();
    if (this._sdatos.accion == 'r_nuevo') {
      this.DOrdenProduccion.ID_DOCUMENTO = this.DDocumentos.find(p => p.DOCUMENTO === e.value).ID_DOCUMENTO;
      this.DOrdenProduccion.CONSECUTIVO = this.DDocumentos.find(p => p.DOCUMENTO === e.value).CONSECUTIVO;
    }
  }

  // onSelectionAtributos(e) {
  //   if (e.name === 'value') {
  //     this.isGridBoxAtrOpened = false;
  //   }
  // }

  onSelectionProveedor(e) {
    if (this.readOnly) return;
    if (e !== 'refrescar') {
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

  }

  // onSelectionUN(e) {
  //   if (e.value) {
  //     this.DOrdenProduccion.ID_UN_ITEM = e.value;
  //     this.valoresObjetos('productos');
  //   }
  // }

  // onValueChangedFechaEntrega(e:any) {
  //   this.DOrdenProduccion.FECHA_ENTREGA = e.value;
  // }

  onValueChangedDes(e: any) {
    this.DOrdenProduccion.DESCRIPCION = e.value;
  }

  onSeleccRowAtributo(e, cellInfo, datacompo) {
    if (e.data) {
      cellInfo.data.ATRIBUTO = e.data.VALOR;
      this.griDOrdenProduccionItems.instance.cellValue(cellInfo.rowIndex, "ATRIBUTO", cellInfo.data.ATRIBUTO);
      datacompo.close();
    }
  }

  // onSeleccRowCliente(e, cellInfo, datacompo) {
  //   if (e.data){
  //     this.isGridBoxCliOpened = false;
  //   }
  // }

  onSeleccRowProducto(e: any, cellInfo: any) {
    if (e.value) {
      if (this.DOrdenProduccionItems.findIndex((d: any) => d.PRODUCTO === e.value) === -1) {
        cellInfo.data.PRODUCTO = e.value;
        const dnompro = this.DProductosLista.find((p: any) => p.PRODUCTO === e.value);
        if (dnompro) {
          cellInfo.data.NOMBRE_PRODUCTO = dnompro.NOMBRE;
          cellInfo.data.REFERENCIA = dnompro.REFERENCIA;
          this.griDOrdenProduccionItems.instance.cellValue(cellInfo.rowIndex, "NOMBRE_PRODUCTO", cellInfo.data.NOMBRE);
          setTimeout(() => {
            var rowIndex = cellInfo.component.getRowIndexByKey(cellInfo.key);
            cellInfo.component.focus(this.griDOrdenProduccionItems.instance.getCellElement(rowIndex, "PRODUCTO"));
          }, 300);

        }

      } else {
        cellInfo.data.PRODUCTO = '';
        showToast('El producto ya fue seleccionado.', 'error');
      }
    }
  }

  onOpenedProducto(e) {
    // if (this.esInicioObj.sboxIniProducto) {
    //   this.checkProSoloPrecio.instance.option("value", false);
    //   this.checkProProveedor.instance.option("value", false);
    //   this.esInicioObj.sboxIniProducto = false;
    // }
  }

  refreshClick(objeto) {
    this.valoresObjetos('productos');
    this.sboxProductos.instance._refresh();
    this.sboxProductos.instance.close();
  }

  // Genera agenda con base en los pedidos
  generarAgenda(objeto) {

    this.loadingVisible = true;
    const prm = { ID_APLICACION: 'PRO-025', USUARIO: localStorage.getItem('usuario') };
    this._sdatos
      .consulta('generar agenda op', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DOrdenProduccionItems = res;
        this.loadingVisible = false;
      });

  }

  // Genera agenda con base en los pedidos
  recalcAgenda(objeto) {

    this.loadingVisible = true;
    const prm = { ID_APLICACION: 'PRO-025', USUARIO: localStorage.getItem('usuario'), PEDIDOS: this.DOrdenProduccionItems };
    this._sdatos
      .consulta('recalcular agenda op', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DOrdenProduccionItems = res;
        this.loadingVisible = false;
      });

  }

  // Recibe los datos de la grid de tasas
  onRespuestaSelecc(e: any) {
    if (e.accion === 'aceptar') {
      this.valoresObjetos('gravamenes', e.rowsSelected);
    }
  }
  onRespuestaFiltro(e: any) {
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
    const prm = { ORDEN_PRODUCCION: { ID_DOCUMENTO: this.DOrdenProduccion.ID_DOCUMENTO, CONSECUTIVO: this.DOrdenProduccion.CONSECUTIVO } };
    this._sdatos
      .delete('delete', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'error');
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        showToast('Orden de produccion anulada', 'success');
        this.readOnly = true;
        this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ESTADO = "ANULADO";
        this.DOrdenProduccion = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));

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
    this.setValoresCartera();
  }

  cambiosItemForma(e, accion = 'activar') {
  }

  // onChangeFecha(e) {
  //   this.DOrdenProduccion.FECHA = e.value;
  //   this.fechaEntrega.instance._refresh();
  // }
  disableDates(args: any) {
    const today = new Date();
    const fhoy = this.datepipe.transform(today, 'MM/dd/yyyy');
    const fcal = this.datepipe.transform(args.date, 'MM/dd/yyyy');
    const ford = this.datepipe.transform(this.DOrdenProduccion.FECHA, 'MM/dd/yyyy');
    const dfhoy = new Date(fhoy!);
    const dfcal = new Date(fcal!);
    const dford = new Date(ford!);
    return dfcal < (dford == undefined ? dfhoy : dford);
  }

  enableProductosItems() {
    if (this.DOrdenProduccion.DOCUMENTO == '')
      this.rowNew = false;
    else {
      this.rowNew = true;
    }

  }

  onValueChangedPedido(e: any) {
    if (e.value === null || e.value === undefined || e.value.length === 0) {
      this.DOrdenProduccionItems = [];
      this.griDOrdenProduccionItems.instance.refresh();
    }
  }

  aceptarBottom(e: any) {
    this.opendDrop.PEDIDO = false;
    var newArray: any = [];
    if (this.DOrdenProduccion.PEDIDO.length > 0) {
      this.DOrdenProduccion.PEDIDO.forEach((ele: any) => {
        const Dpro: any = this.DPidos.filter((d: any) => d.DOCUMENTO_PEDIDO === ele);
        newArray.push(...Dpro[0].PRODUCTOS);
      });
      for (let i = 0; i < newArray.length; i++) {
        newArray[i].ITEM = i;
      }
      this.DOrdenProduccionItems = newArray;
      this.esVisibleSelecc = 'always';
    } else {
      this.DOrdenProduccionItems = [];
      this.esVisibleSelecc = 'none';
    }
  }

  // previsualizar el reporte
  imprimirReporte(operimp) {
    let filtroRep: any = '';
    if (operimp.registro === 'todos')
      filtroRep = { FILTRO: this.QFiltro };
    else
      filtroRep = {
        FILTRO: " ORDENES_PRODUCCION.ID_DOCUMENTO = '" + this.DOrdenProduccion.ID_DOCUMENTO + "' " +
          " AND ORDENES_PRODUCCION.CONSECUTIVO = '" + this.DOrdenProduccion.CONSECUTIVO + "'"
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
        FILTRO: " ORDENES_PRODUCCION.ID_DOCUMENTO = '" + this.DOrdenProduccion.ID_DOCUMENTO + "' " +
          " AND ORDENES_PRODUCCION.CONSECUTIVO = '" + this.DOrdenProduccion.CONSECUTIVO + "'"
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
    var msg = '';
    if (this.especUsuarioEmail === '') {
      msg += 'Falta definir correo de envio del usuario<br>';
    }
    if (msg !== "")
      showToast(msg);

    // Prepara y confirma envio de correo
    let asunto = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'ASUNTO EMAIL')?.VALOR_DEFECTO ?? '';
    let email_sale = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'EMAIL SALIENTE')?.VALOR_DEFECTO ?? '';
    asunto = asunto.replace('%NUMERO_ORDEN%', this.DOrdenProduccion.DOCUMENTO);
    const dataSource = {
      ORIGEN: this.especUsuarioEmail,
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
      filtroRep = {
        FILTRO: " ORDENES_PRODUCCION.ID_DOCUMENTO = '" + this.DOrdenProduccion.ID_DOCUMENTO + "' " +
          " AND ORDENES_PRODUCCION.CONSECUTIVO = '" + this.DOrdenProduccion.CONSECUTIVO + "'"
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
        NUMERO_ORDEN: this.DOrdenProduccion.DOCUMENTO,
        // DIA_ENTREGA: this.datepipe.transform(this.DOrdenProduccion.FECHA_ENTREGA,'MMMM d, y',undefined,'es'),
        NOTA: e.NOTA
      }
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

      this._sgenerales.sendMail('send', { datos: prmRpt }, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          showToast('Correo enviado a ' + e.DESTINO_EMAIL);

          // Guarda en el log de envios de correos de la OC
          const prm = {
            ID_APLICACION: 'PRO-025',
            ORIGEN: 'documento',
            DATOS: this.DOrdenProduccion,
            EVENTO: 'ENVIO EMAIL',
            DETALLE: e.DESTINO_EMAIL + ' Status:enviado',
            USUARIO: this.prmUsrAplBarReg.usuario
          };
          this._sgenerales
            .log('evento log', prm, "ADM-401")
            .subscribe((data: any) => {
              const res = JSON.parse(data.data);
              if (res[0].ErrMensaje !== '')
                showToast(res[0].ErrMensaje);
            });

        });

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
    e.data.TOTAL = 0;
    e.data.PORC_IVA = 0;
    e.data.VALOR_IVA = 0;
    e.data.REFERENCIA = "";
    e.data.DETALLE = "";
    if (this.DOrdenProduccionItems.length > 0) {
      const item = this.DOrdenProduccionItems.reduce((ant, act) => { return (ant.ITEM > act.ITEM) ? ant : act })
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
    e.component.navigateToRow(e.key);
    e.component.addRow();
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

  // loadDatos() {
  //   this.loadDataToVariables();
  // }

  // loadDataToVariables() {
  //   this.gridBoxUN = [this.DOrdenProduccion.ID_UN_ITEM];
  //   // this.sbDocumento = this.DOrdenProduccion.DOCUMENTO;
  // }

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
    //this.formOrdenProd.instance.resetValues();
  }
  onContentReady(e: any) {
    e.component.columnOption("command:edit", "visible", false);
  }
  selectionGrid(e: any) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length > 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  setValoresCartera() {

  }

  setDocumentoToDatatable() {
    this.DDocumentos = [];
    this.DDocumentos.push({ ID_DOCUMENTO: this.DOrdenProduccion.ID_DOCUMENTO, CONSECUTIVO: this.DOrdenProduccion.CONSECUTIVO, DOCUMENTO: this.DOrdenProduccion.ID_DOCUMENTO + '-' + this.DOrdenProduccion.CONSECUTIVO });
  }

  setDItemsAux() {
    this.DItemsAux = this.DOrdenProduccionItems;
    for (const item of this.DItemsAux) {
      item.APLICACION = 2
    }
  }

  setDOrdenProduccionItemsValues(data) {
    // for(const item of data){
    //   for(const DItem of this.DOrdenProduccionItems){
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
    this.valoresObjetos('gravamenes');
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
  }

  updatingRow(e) {
    this.conCambios++;
    if (e.oldData === undefined)
      return;
    e.oldData.isEdit = true;
    this.setItemValues();
  }

  ValidaDatos(Accion: string): boolean {
    var msg = '';
    if (Accion === "requerido") {
      if (this.DOrdenProduccion.DOCUMENTO === '') msg += 'Documento ,';
      // if (this.DOrdenProduccion.ID_UN_ITEM === '') msg += 'Unidad de negocios ,';
      if (this.DOrdenProduccion.PEDIDO.length <= 0) msg += 'Pedidos ,';
      if (this.DOrdenProduccionItems === undefined || this.DOrdenProduccionItems.length === 0) msg += 'Productos: No se ha asociado ningún Producto a la Orden de produccion.';
      if (msg !== '') {
        this.showModal("Hay datos incompletos. Revisar contenido de los items: " + msg, "Faltan datos", '');
        return false;
      }
    }
    return true;
  }

  // Si está desplegado objetos, cerrar
  onScroll(e: Event): void {
    const elem = e.target as HTMLElement;
    if (elem.className !== "dx-scrollable-container") {
      this.eventsSubjectSboxDoc.next('cerrar');
      this.eventsSubjectSboxUN.next('cerrar');
      this.eventsSubjectSboxProducto.next('cerrar');
    }
  }

  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined) {
    if (obj === 'pedidos' || obj === 'todos') {
      const prm = {};
      this._sdatos.consulta('PEDIDOS', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        } else {
          this.DPidos_prev = res;
          // this.DPidos = res;
        }
      });
    };
    if (obj == 'documento') {
      const prm = { ID_APLICACION: 'PRO-025', USUARIO: localStorage.getItem('usuario') };
      this._sdatos
        .consulta('DOCUMENTOS CONSECUTIVO', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          // this.DDocumentos = res;
          // this.eventsSubjectSboxDoc.next({ dataSource: this.DDocumentos, 
          //                                   valueExpr: "DOCUMENTO",
          //                                   displayExpr: "DOCUMENTO",
          //                                   columnData: ["DOCUMENTO"],
          //                                   valueData: this.DOrdenProduccion.DOCUMENTO });
          // if(this.DDocumentos != null && this.DDocumentos.length == 1 && !this.readOnly){
          // this.sbDocumento = this.DDocumentos[0].DOCUMENTO;
          this.DOrdenProduccion.ID_DOCUMENTO = res[0].ID_DOCUMENTO;
          this.DOrdenProduccion.CONSECUTIVO = res[0].CONSECUTIVO;
          this.DOrdenProduccion.DOCUMENTO = res[0].DOCUMENTO;
          // }
        });
    }

    if (obj == 'productos') {
      // const prm = { ID_BODEGA: this.DOrdenProduccion.ID_UN_ITEM };
      const prm = { };
      const accion = 'PRODUCTOS COMPRAS';
      this._sdatos.consulta(accion, prm, 'PRO-022').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        // this.DProductos = res;
        this.DProductosLista = JSON.parse(JSON.stringify(res));
        this.DProductos = new DataSource({
          store: res,
          paginate: true,
          pageSize: 20
        });
      });
    }
    if (obj == 'un' || obj == 'todos') {
      const prm: any = { USUARIO: this.prmUsrAplBarReg.usuario };
      this._sdatos.consulta('UN ITEM', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DUNItem = res;
        // this.eventsSubjectSboxUN.next({ dataSource: this.DUNItem, 
        //                                     valueExpr: "ID_UN",
        //                                     displayExpr: "ID_UN",
        //                                     style: { width: 700, colWidth: [33,33,33] },
        //                                     columnData: ["ID_UN","NOMBRE"],
        //                                     valueData: this.DOrdenProduccion.ID_UN_ITEM });

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
    if (obj == 'reportes') {
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
    // if (obj == 'log email' ) {
    //   this._sdatos.consulta('log email', 
    //                         { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, USUARIO: this.prmUsrAplBarReg.usuario }, 
    //                         this.prmUsrAplBarReg.aplicacion)
    //     .subscribe((data: any) => {
    //       const res = JSON.parse(data.data);
    //       if ( (data.token != undefined)){
    //         const refreshToken = data.token;
    //         localStorage.setItem("token", refreshToken);
    //       }
    //       this.logEmailNoEnviados = res;
    //       if (this.logEmailNoEnviados.length !== 0) {
    //         var htmmsg = this.logEmailNoEnviados.map(e => e.HTML);
    //         htmmsg = '<head>'+
    //                  '</head><table style="text-align: left; width: 100%;">' +  
    //                  htmmsg + '</table>';
    //         this.showModal('','No se han enviado email para algunas Ordenes de compra:',htmmsg);
    //       }

    //     });
    // }

  }

  ngOnInit(): void {
    const user: any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: 'ORDENES_PRODUCCION',
      aplicacion: 'PRO-025',
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
    this.rowNew = false;
    this._sdatos.accion = 'r_ini';

    window.addEventListener('scroll', this.onScroll, true);
    // this.accordionExpand = [true];
    this.valoresObjetos('todos');
    // this.valoresObjetos('especificaciones');
    // this.valoresObjetos('log email');
    var now = new Date();
    this.DOrdenProduccion = {
      ID_UN: '',
      ID_DOCUMENTO: '',
      CONSECUTIVO: 0,
      DOCUMENTO: '',
      FECHA: now,
      HORA: now,
      PEDIDO: '',
      DESCRIPCION: '',
      USUARIO: '',
      ESTADO: '',
      PRODUCTO: ''
    };

    // Llamado externo
    // this.route.params.subscribe(parameter => {
    //   const queryString = window.location.search;
    //   const urlParams = new URLSearchParams(queryString);
    //   const codePrm = urlParams.get('prm_rpt');
    //   if (codePrm) {

    //   }
    // });

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subscriptionPedidos.unsubscribe();
    // this.subs_filtro.unsubscribe();
    // this.subs_visor.unsubscribe();
  }
}