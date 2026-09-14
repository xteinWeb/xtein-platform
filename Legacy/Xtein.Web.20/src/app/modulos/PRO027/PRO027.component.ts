import { Component, LOCALE_ID, NgModule, OnInit, ViewChild } from '@angular/core';
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
import { DxButtonModule, DxCheckBoxComponent, DxCheckBoxModule, DxDataGridComponent, DxDataGridModule, DxDateBoxComponent, DxDateBoxModule, DxDropDownBoxModule, 
         DxFormComponent, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxSelectBoxComponent, DxSelectBoxModule, 
         DxTextBoxModule, 
         DxTooltipComponent, 
         DxTooltipModule} from 'devextreme-angular';
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
import { ActivatedRoute } from '@angular/router';
import { libtools } from 'src/app/shared/common/libtools';
import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';
import { FiltrobusqComponent } from 'src/app/shared/filtrobusq/filtrobusq.component';
import { clsTransaccProduccion, clsTransaccProduccionItems, clsTransaccProduccionOP } from './clsPRO027.class';
import { PRO025Service } from 'src/app/services/PRO025/PRO025.service';
import { PRO02701Component } from './PRO02701/PRO02701.component';
registerLocaleData(localeEs, 'es');

@Component({
  selector: 'app-PRO027',
  templateUrl: './PRO027.component.html',
  styleUrls: ['./PRO027.component.scss'],
  providers: [ { provide: LOCALE_ID, useValue: 'es' } ],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxSelectBoxModule, CdkAccordionModule, DxDropDownBoxModule,
            DxDataGridModule, DxDateBoxModule, DxTextBoxModule, DxNumberBoxModule, DxLoadPanelModule,
            DxButtonModule, VistarapidaComponent, XcSelectboxComponent, DxTooltipModule,
            XcComboGridComponent, DxCheckBoxModule, FemailComponent,
            FiltrobusqComponent, PRO02701Component
          ]
})

export class PRO027Component implements OnInit {
  @ViewChild('formOrdenProd', { static: false }) formOrdenProd: DxFormComponent;
  @ViewChild("gridOPItems", { static: false }) gridOPItems: DxDataGridComponent;
  @ViewChild("gridTranItems", { static: false }) gridTranItems: DxDataGridComponent;
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
  readOnlyUdp: boolean;
  mnuAccion: string;
  gridBoxAtributo: string[] = [];
  gridBoxDocumento: string[] = [];
  gridBoxProducto: string[] = [];
  gridBoxUN: string[] = [];
  gridBoxBod: string[] = [];
  isGridBoxAtrOpened: boolean;
  isGridBoxCliOpened: boolean;
  isGridBoxProdOpened: boolean;
  isGridBoxUbiOpened: boolean;
  isGridBoxUNOpened: boolean;
  isGridBoxMonedaOpened: boolean;
  isGridBoxCondicionOpened: boolean;
  isGridBoxADCOpened: boolean;
  sbDocumento: string;
  esEdicion: boolean = false;
  esInicioDatos: boolean = false;
  esCreacion: boolean = false;
  esInicioObj: any;
  iniEdicion: boolean = false;
  conCambios: number = 0;
  focusedRowIndex: number;
  focusedRowKey: string;
  type: string;
  UN_DEF: string;
  MONEDA_DEF: string;
  TIPO_CONDLISTA: string;
  ID_APLICACION: any = 'PRO-027';
  stylingMode = 'filled';
  dropDownOptions: any =  { width: 700, 
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
  dSBEstados = ["REGISTRADO","ANULADO","COMPLETADO","EN PROCESO"];
  items = ['Datos del Movimiento'];
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
  filaIndex: any;

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
  yaloadingVisible: boolean = false;

  //Variables de datos
  DTransaccProduccion: clsTransaccProduccion;
  DTransaccProduccionItems: clsTransaccProduccionItems[] = [];
  DTransaccProduccionOP: clsTransaccProduccionOP[] = [];
  DTransaccProduccionOPbak: clsTransaccProduccionOP[] = [];
  DTransaccProduccionOPdet: clsTransaccProduccionOP[] = [];
  DTransaccProduccion_prev: any;
  DTransaccProduccionItems_prev: any;
  DEstadosProduccion: any;
  DBodegas: any;
  DUNItem: any;
  DProductos: any;
  DComponentes: any;
  DComponentesLista: any;
  DProductosLista: any;
  DDocumentos: any;
  DUnidadMedida: any;
  DAtributos: any;
  DSecciones: any;
  DTipoInv: any;
  DOrdenesPro: any;
  especAplicacion: any;
  intervalHora: any;
  intervalLogNoEmail: any;
  logEmailNoEnviados: any;
  detallada: boolean = false;
  loadingVisible: boolean = false;
  bodegasCan: boolean = false;
  eventsSubjectBodCan: Subject<any> = new Subject<any>();
  
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
    private _sdatos: PRO025Service,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private _sgenerales: GeneralesService,
    private datepipe: DatePipe,
    private tabService: TabService,
    private route: ActivatedRoute
  ) 
    {
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
        this.prmUsrAplBarReg.r_numReg = nx+1;
        this.opIrARegistro('r_numreg');
      }
    })

    this.ltool = new libtools(this._sbarreg, this.tabService);
    this.onScroll = this.onScroll.bind(this);
    this.valoresDefecto = this.valoresDefecto.bind(this);
    this.disableDates = this.disableDates.bind(this);
    this.onChangeFecha = this.onChangeFecha.bind(this);
    this.onSeleccRowProductoMP = this.onSeleccRowProductoMP.bind(this);
    this.onChangeProducto = this.onChangeProducto.bind(this);
    this.onCellPrepared = this.onCellPrepared.bind(this);
    this.onSeleccRowProductoMP = this.onSeleccRowProductoMP.bind(this);
    this.onSetCellComponente = this.onSetCellComponente.bind(this);

  }

  // Recibe los datos del componente 
  onRespuestaBodCan(e: any) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;
    this.gridTranItems.instance.cellValue(this.filaIndex, "CANTIDAD_PRODUCCION", e);    
  }


  opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes
    this._sdatos.accion = operMenu.accion;
    switch (operMenu.accion){
      case 'r_ini':
        const user:any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'MOVIMIENTOS_PRO',
          aplicacion: 'PRO-027',
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
          if (result.isConfirmed){
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this.readOnly = true;
            this.readOnlyUdp = true;
            this.esEdicion = false;
            this.esCreacion = false;
            this.esVisibleSelecc = 'none';
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.DTransaccProduccion = JSON.parse(JSON.stringify(this.DTransaccProduccion_prev));
            this.DTransaccProduccionItems = JSON.parse(JSON.stringify(this.DTransaccProduccionItems_prev));
            // this.DTransaccProduccionGravItems = this.DTransaccProduccionGrav.filter(e => e.APLICACION === 1);
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
      this.esInicioDatos = true;
      this.valoresDefecto();
      // this.activarCustomValueSbox(false);
    }, 500);

    this.intervalHora = setInterval(() => {
      this.DTransaccProduccion.HORA = new Date();
    }, 1000);

  }

  copiarOrden():void {
    this.mnuAccion = 'new';
    this.esVisibleSelecc = 'always';
    this.readOnly = false;
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
      this.DTransaccProduccion.ESTADO = 'REGISTRADO';
      this.esInicioDatos = true;
    }, 500);
    this.intervalHora = setInterval(() => {
      this.DTransaccProduccion.HORA = new Date();
    }, 1000);
  }

  // Valores de cargue inicial
  valoresDefecto() {
    if(this.especAplicacion) {
      this.especMonedaFormato = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'FORMATO MONEDA')?.FORMATO ?? '#,##0.00';
      this.especCantidadFormato = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'FORMATO CANTIDAD')?.FORMATO ?? '#,##0.00';

      // Cuentas de email usuario
      this.especUsuarioEmail = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'EMAIL COMPRAS')?.TITULO ?? '';

    }
  }

  // Cerrar opción de valor libre en los sbox
  activarCustomValueSbox(accion: boolean) {
    this.eventsSubjectSboxDoc.next({customValue: accion});
    this.eventsSubjectSboxProducto.next({customValue: accion});
    this.activarCustomValueSbox(false);
  }

  async opPrepararModificar(){
    this.readOnly = false;
    this.readOnlyUdp = true;
    this.esEdicion = true;
    this.esCreacion = false;
    this.esInicioObj = { sboxIniProducto: true };
    this.iniEdicion = true;
    clearInterval(this.intervalHora);
  }

  opPrepararGuardar(accion: string): void {
    // Acción validación de datos
    if (!this.ValidaDatos('requerido')){
      return;
    }

    const prmDatosGuardar = { MOVIMIENTOS_PRO: this.DTransaccProduccion, 
                              ITM_MOVIMIENTOS_PRO: this.DTransaccProduccionItems,
                              ITM_MOVIMIENTOS_PRO_OP: this.DTransaccProduccionOPdet }

    // API guardado de datos
    var exito = false;
    this.loadingVisible = true;
    this._sdatos
    .save(accion, prmDatosGuardar, this.prmUsrAplBarReg.aplicacion)
    .subscribe(
      { 
        next: (resp) => {
          this.loadingVisible = false;
          const res = JSON.parse(resp.data);
          if (res[0].ErrMensaje !== ""){
            this.showModal(res[0].ErrMensaje, 'error');
          } 
          else
          {
            this.readOnly = true;
            this.readOnlyUdp = true;
            this.esEdicion = false;
            this.esCreacion = false;
            this.esVisibleSelecc = 'none';
            clearInterval(this.intervalHora);

            // Operaciones de barra
            if (this.mnuAccion === 'new'){
              this.QFiltro = " MOVIMIENTOS_PRO.ID_DOCUMENTO = '"+this.DTransaccProduccion.ID_DOCUMENTO+"' " +
                            " AND MOVIMIENTOS_PRO.CONSECUTIVO = '"+this.DTransaccProduccion.CONSECUTIVO+"'"
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
        },
        error: (e) => {
          this.loadingVisible = false;
          this.showModal('Error al guardar Movimiento: '+e.error.message);
          }
      });
  }

  opPrepararBuscar(accion): void {

    // Sin hora
    clearInterval(this.intervalHora);

    if (accion === 'filtro'){
      
      const prmFiltro = {
        Titulo: "Datos de filtro para Ordenes de producción",
        accion: "activar",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
        objRegistro: this._sbarreg, 
        objTab: this.tabService,
        usuario: this.prmUsrAplBarReg.usuario,
        title: 'Orden de producción'
      };
      this.eventsSubjectFiltro.next(prmFiltro);


    } 
    else {
      this._sfiltro.enConsulta = true;
    
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { MOVIMIENTOS_PRO: arrFiltro };
    
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
          
          // Datos
          const datares = res;

          if (datares[0].ErrMensaje === ''){
            this.VDatosReg = datares;
            this.DTransaccProduccion = datares[0];
            this.DTransaccProduccionItems = datares[0].ITM_MOVIMIENTOS_PRO;
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
            const user:any = localStorage.getItem('usuario');
            this.prmUsrAplBarReg = {
              tabla: 'MOVIMIENTOS_PRO',
              aplicacion: 'PRO-027',
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
        'Desea eliminar la Orden de producción <i>' +
        this.DTransaccProduccion.ID_DOCUMENTO +
        '-' +
        this.DTransaccProduccion.CONSECUTIVO +
        '</i> ?',
      iconHtml: "<i class='icon-alert-ol'></i>",
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
          this.DTransaccProduccion = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }else{
          showToast('No se encontraron Datos', 'error');
          this.readOnly = true;
          this.readOnlyUdp = true;
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.DTransaccProduccion = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length ? this.VDatosReg.length : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DTransaccProduccion = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1]));
        break;
      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DTransaccProduccion = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
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
          this.DTransaccProduccion = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearForma();
          this.resetValidaciones();
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
          this.DTransaccProduccion = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
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
    this.customValueSbox = true;

    // Por esoecificacion defecto, no se permite modificar
    if (this.DTransaccProduccion.ESTADO === 'ANULADO')
      this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: { r_modificar: this.especModificarOrden, r_eliminar: false } };
    else
      this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: { r_modificar: this.especModificarOrden, r_eliminar: true } };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

    // Consulta los otros datos: items, gravamenes, adicionales
    const prm = { ID_DOCUMENTO: this.DTransaccProduccion.ID_DOCUMENTO, CONSECUTIVO: this.DTransaccProduccion.CONSECUTIVO};
    this._sdatos
      .consulta('consulta adicionales', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== ''){
          this.showModal(res[0].ErrMensaje, 'error');
          return;
        }
        this.DTransaccProduccionItems = res[0].ITM_MOVIMIENTOS_PRO;
        this.DTransaccProduccionOP = res[0].ITM_MOVIMIENTOS_PRO_OP;
        this.DTransaccProduccionOPdet = res[0].ITM_MOVIMIENTOS_PRO_OP_DET;
      });
  }

  opVista(): void {
    const VDatosRegAux = this.VDatosReg.map(({ID_DOCUMENTO,CONSECUTIVO,FECHA,HORA,FECHA_ENTREGA,DESCRIPCION,USUARIO,ESTADO}) => ({ID_DOCUMENTO,CONSECUTIVO,FECHA,HORA,FECHA_ENTREGA,DESCRIPCION,USUARIO,ESTADO}));
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(VDatosRegAux));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'Ordenes de produccion',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: '',
      Filtro: '',
      keyGrid: ['ID_DOCUMENTO','CONSECUTIVO'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opBlanquearForma(): void {
    var now = new Date();
    this.DTransaccProduccion = {
      ID_UN: '',
      ID_DOCUMENTO: '',
      CONSECUTIVO: 0,
      DOCUMENTO: '',
      FECHA: now,
      HORA: now,
      DESCRIPCION: '',
      ID_SECCION_ORIGEN: '',
      ID_SECCION_DESTINO: '',
      ID_UN_ITEM: '',
      USUARIO: this.prmUsrAplBarReg.usuario,
      ESTADO: 'REGISTRADO',
      TIPO: '',
      ESTADO_PRODUCCION: '',
      BODEGAS: []
    };
    this.DTransaccProduccionItems = [];
    this.sbDocumento = '';
    this.DTransaccProduccion_prev = JSON.parse(JSON.stringify(this.DTransaccProduccion));
    this.DTransaccProduccionItems_prev = JSON.parse(JSON.stringify(this.DTransaccProduccionItems));
  }

  // Operaciones sobre los items de la Agenda - OP
  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        this.gridBoxProducto = [];
        this.gridOPItems.instance.addRow();
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
        this.gridTranItems.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        break;
      case 'cancel':
        this.gridTranItems.instance.cancelEditData();
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
              const index = this.DTransaccProduccionOP.findIndex(a => a.ITEM === key);
              const agpro = this.DTransaccProduccionOP.filter(a => a.ITEM === key);
              this.DTransaccProduccionOP.splice(index, 1);
              
              //Elimina de las detalladas
              if (!this.detallada) {
                const elimdet = this.DTransaccProduccionOPdet.filter(a => a.PRODUCTO === agpro[0].PRODUCTO && 
                                                                          a.ID_SECCION_ORIGEN === agpro[0].ID_SECCION_ORIGEN);
                elimdet.forEach((key) => {
                  const indexd = this.DTransaccProduccionOPdet.findIndex(a => a.ITEM === key.ITEM);
                  this.DTransaccProduccionOPdet.splice(indexd, 1);
                  });
                }
              });
              if (!this.detallada) 
                this.DTransaccProduccionOPbak = JSON.parse(JSON.stringify(this.DTransaccProduccionOP));
              else
                this.DTransaccProduccionOPdet = JSON.parse(JSON.stringify(this.DTransaccProduccionOP));

            // Recalcula necesidades de MP
            this.generarAgenda({ ACCION: 'eliminar', AGENDA: this.DTransaccProduccionOPdet });

            this.conCambios++;
            this.setItemValues();
          }
        });
        break;

      default:
        break;
    }
  }

  // Operaciones sobre los items de la MP
  operGridMP(e, operacion) {
    switch (operacion) {
      case 'new':
        this.gridBoxProducto = [];
        this.gridTranItems.instance.addRow();
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
        this.gridTranItems.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        break;
      case 'cancel':
        this.gridTranItems.instance.cancelEditData();
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
              const index = this.DTransaccProduccionOP.findIndex(a => a.ITEM === key);
              const agpro = this.DTransaccProduccionOP.filter(a => a.ITEM === key);
              this.DTransaccProduccionOP.splice(index, 1);
              
              //Elimina de las detalladas
              if (!this.detallada) {
                const elimdet = this.DTransaccProduccionOPdet.filter(a => a.PRODUCTO === agpro[0].PRODUCTO && 
                                                                          a.ID_SECCION_ORIGEN === agpro[0].ID_SECCION_ORIGEN);
                elimdet.forEach((key) => {
                  const indexd = this.DTransaccProduccionOPdet.findIndex(a => a.ITEM === key.ITEM);
                  this.DTransaccProduccionOPdet.splice(indexd, 1);
                  });
                }
              });
              if (!this.detallada) 
                this.DTransaccProduccionOPbak = JSON.parse(JSON.stringify(this.DTransaccProduccionOP));
              else
                this.DTransaccProduccionOPdet = JSON.parse(JSON.stringify(this.DTransaccProduccionOP));

            // Recalcula necesidades de MP
            this.generarAgenda({ ACCION: 'eliminar', AGENDA: this.DTransaccProduccionOPdet });

            this.conCambios++;
            this.setItemValues();
          }
        });
        break;

      default:
        break;
    }
  }

  onChangeCantidadAG(rowData: any, value: any, currentRowData: any){
    rowData.CANTIDAD = value;
  }
  onChangeCantidadMP(rowData: any, value: any, currentRowData: any){
    rowData.CANTIDAD_PRODUCCION = value;
  }

  onChangeProducto(rowData: any, value: any, currentRowData: any){
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

  onEditorEnterKey(e){
  }

  onFocusedRowChanged(e){
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
    if (cellInfo.data){
      cellInfo.data.ATRIBUTO = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onFocusOutClientes(e, cellInfo) {
    if (cellInfo.data){
      cellInfo.data.ID_PROVEEDOR = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
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
      if (!e.isEditing && e.data.isEdit) 
        {
          this.esVisibleSelecc = 'always';
          e.data.isEdit = false;
        }
      }
    if (e.rowType === "header" && e.rowIndex === 2 && !this.esEdicion) {
      e.rowElement.style.display = "none";
    }
  }

  onRowValidatingMP(e: any) {
    // Valida completitud
    var errMsg = '';
    if (e.newData.ID_COMPONENTE !== undefined && e.newData.ID_COMPONENTE == '') 
      errMsg = 'Falta seleccionar Materia Prima';
    if (e.newData.CANTIDAD_PRODUCCION !== undefined && e.newData.CANTIDAD_PRODUCCION <= 0) 
      errMsg = 'Cantidad no puede ser cero';
    if (errMsg !== '') {
      e.isValid = false;
      showToast(errMsg, 'warning');
      return;
    }
    // Valida inventario
    const prm = { PRODUCTO: e.oldData.ID_COMPONENTE, 
                  CANTIDAD: e.newData.CANTIDAD_PRODUCCION, 
                  BODEGAS: this.DTransaccProduccion.BODEGAS };
    e.promise = this._sdatos.pconsulta('existencias',prm, 'PRO-027')
      .then((result: any) => {
          const res = JSON.parse(result.data);
          e.errorText = res[0].ErrMensaje;
          if (res[0].ErrMensaje !== "") {
            showToast(res[0].ErrMensaje, 'error');
            e.isValid = false;
          }
          else
            e.isValid = true;
      });

  }

  onRowValidatingAG(e: any) {
  }

  onSeleccDocumento(e: any): void {
    if (this.readOnly) return;
    if (e === undefined) return;
    if (e.value === "") return;

    this.sbDocumento = e.value;
    this.DTransaccProduccion.DOCUMENTO = e.value;
    this.enableProductosItems();
    if(this._sdatos.accion == 'r_nuevo'){
      this.DTransaccProduccion.ID_DOCUMENTO =  this.DDocumentos.find(p => p.DOCUMENTO === e.value).ID_DOCUMENTO;
      this.DTransaccProduccion.CONSECUTIVO = this.DDocumentos.find(p => p.DOCUMENTO === e.value).CONSECUTIVO;
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

  onSelectionUN(e) {
    if (e.value) {
      this.DTransaccProduccion.ID_SECCION_ORIGEN = e.value;
      this.valoresObjetos('productos');
    }
  }
  onSeleccEstadoPro(e) {
    if (e.value) {
      this.DTransaccProduccion.ESTADO_PRODUCCION = e.value;
      // this.valoresObjetos('productos');
    }
  }
  onSeleccEstadoTipo(e) {
    if (e.value) {
      this.DTransaccProduccion.TIPO = e.value;
      // this.valoresObjetos('productos');
    }
  }

  onValueChangedFechaEntrega(e:any) {
  }

  onValueChangedDes(e: any){
    this.DTransaccProduccion.DESCRIPCION = e.value;
  }

  onSelectionBod(e, templateData: any) {
    var keys = e.selectedRowKeys;
    this.DTransaccProduccion.BODEGAS = keys.map(b => b.ID_UN_BODEGA);
    //templateData.option('value', keys);
  }

  onSeleccRowAtributo(e, cellInfo, datacompo) {
    if (e.data){
      cellInfo.data.ATRIBUTO = e.data.VALOR;
      this.gridTranItems.instance.cellValue(cellInfo.rowIndex, "ATRIBUTO", cellInfo.data.ATRIBUTO);
      datacompo.close();
      this.isGridBoxAtrOpened = false;
    }
  }

  onSeleccRowCliente(e, cellInfo, datacompo) {
    if (e.data){
      this.isGridBoxCliOpened = false;
    }
  }

  async onSetCellComponente (rowData: any, value: any, currentRowData: any) {
    // Valida inventario
    const prm = { BODEGAS: this.DTransaccProduccion.BODEGAS, PRODUCTO: value, ACCION: 'validar' };
    const apiRest = this._sdatos.consulta('existencias',prm,this.prmUsrAplBarReg.aplicacion);
    let res = await lastValueFrom(apiRest, {defaultValue: true});
    res = JSON.parse(res.data); 
    if (res[0].ErrMensaje !== '') {
      showToast(res[0].ErrMensaje, 'error');
      return;
    }

    // Si hay varias bodegas seleccionadas, escoge la bodega
    this.bodegasCan = false
    if (res.length > 1) {
      this.bodegasCan = true
      for (var k=0; k < res.length; k++) {
        res[k] = { ...res[k], CANTIDAD_PRODUCCION: currentRowData.CANTIDAD_PRODUCCION };
      };
      this.eventsSubjectBodCan.next(res); 
    }
    else {
      // Asigna cantidad de existencia
      const cancomp = currentRowData.CANTIDAD_PRODUCCION;
      const cpend = Number(cancomp??0) > Number(res[0].CANTIDAD_SALDO) 
                    ? Number(cancomp??0) - Number(res[0].CANTIDAD_SALDO)
                    : 0;
      currentRowData.CANTIDAD_EXIS = res[0].CANTIDAD_SALDO;    
      currentRowData.CANTIDAD_PENDIENTE = cpend;
    }

  }

  onSeleccRowProductoMP(e:any, cellInfo:any) {
    if (e.value){
      if ( this.DTransaccProduccionItems.findIndex((d:any) => d.ID_COMPONENTE === e.value) === -1 ) {
        cellInfo.data.ID_COMPONENTE = e.value;
        this.filaIndex = cellInfo.component.getRowIndexByKey(cellInfo.key);  
        const dnompro = this.DComponentesLista.find((p:any) => p.PRODUCTO === e.value);
        if (dnompro) {
          cellInfo.data.NOMBRE = dnompro.NOMBRE;
          cellInfo.data.UDM = dnompro.ID_UDM;
          this.gridTranItems.instance.cellValue(cellInfo.rowIndex, "NOMBRE", cellInfo.data.NOMBRE);
          this.gridTranItems.instance.cellValue(cellInfo.rowIndex, "ID_COMPONENTE", e.value);

          // setTimeout(() => {
          //   var rowIndex = cellInfo.component.getRowIndexByKey(cellInfo.key);  
          //   cellInfo.component.focus(this.gridTranItems.instance.getCellElement(rowIndex, "ID_COMPONENTE"));
          // }, 300);

          // Valida inventario
          // const prm = { BODEGAS: this.DTransaccProduccion.BODEGAS, PRODUCTO: e.value, ACCION: 'validar' };
          // const apiRest = this._sdatos.consulta('existencias',prm,this.prmUsrAplBarReg.aplicacion);
          // let res = await lastValueFrom(apiRest, {defaultValue: true});
          // res = JSON.parse(res.data); 
          // if (res[0].ErrMensaje !== '') {
          //   showToast(res[0].ErrMensaje, 'error');
          //   this.gridTranItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EXIS", 0);
          //   this.gridTranItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PENDIENTE", 0);
          //   return;
          // }

          // const prm = { BODEGAS: this.DTransaccProduccion.BODEGAS, PRODUCTO: e.value, ACCION: 'validar' };
          // this._sdatos.consulta('existencias',prm, 'PRO-027').subscribe((data: any)=> {
          //   const res = JSON.parse(data.data);
          //   e.errorText = res[0].ErrMensaje;
          //   if (res[0].ErrMensaje !== "") {
          //     showToast(res[0].ErrMensaje, 'error');
          //   }
          //   else {
          //     // Si hay varias bodegas seleccionadas, escoge la bodega
          //     this.bodegasCan = false
          //     if (res.length > 1) {
          //       this.bodegasCan = true
          //       this.eventsSubjectBodCan.next(res);
          //     }
          //     else {
          //       // Asigna cantidad de existencia
          //       var rowIndex = cellInfo.component.getRowIndexByKey(cellInfo.key);  
          //       const cancomp = this.gridTranItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRODUCCION");
          //       const cpend = Number(cancomp??0) > Number(res[0].CANTIDAD_SALDO) 
          //                     ? Number(cancomp??0) - Number(res[0].CANTIDAD_SALDO)
          //                     : 0;
          //       this.gridTranItems.instance.cellValue(rowIndex, "CANTIDAD_EXIS", res[0].CANTIDAD_SALDO);
          //       this.gridTranItems.instance.cellValue(rowIndex, "CANTIDAD_PENDIENTE", cpend);
          //     }

          //   }
              
          // });
          // e.event.stopPropagation();

        }

      } else {
        cellInfo.data.ID_COMPONENTE = '';
        showToast('La Materia prima ya fue seleccionada.', 'error');
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
    // this.sboxProductos.instance._refresh();
    // this.sboxProductos.instance.close();
  }

  onOpenedOrdenPro(e) {
    // if (this.esInicioObj.sboxIniProducto) {
    //   this.checkProSoloPrecio.instance.option("value", false);
    //   this.checkProProveedor.instance.option("value", false);
    //   this.esInicioObj.sboxIniProducto = false;
    // }
  }

  onSeleccRowOrdenPro(e:any, cellInfo:any) {
    if (e.value){
      if ( this.DOrdenesPro.findIndex((d:any) => d.ORDEN_PRO === e.value) === -1 ) {
        cellInfo.data.SOPORTE = e.value;
        cellInfo.data.ID_SOPORTE = e.value.split(' ')[0];
        cellInfo.data.NC_SOPORTE = e.value.split(' ')[1];
        // const dnompro = this.DProductosLista.find((p:any) => p.PRODUCTO === e.value);
        // if (dnompro) {
        //   cellInfo.data.NOMBRE_PRODUCTO = dnompro.NOMBRE;
        //   cellInfo.data.REFERENCIA = dnompro.REFERENCIA;
        //   this.gridOPItems.instance.cellValue(cellInfo.rowIndex, "NOMBRE_PRODUCTO", cellInfo.data.NOMBRE);
        //   setTimeout(() => {
        //     var rowIndex = cellInfo.component.getRowIndexByKey(cellInfo.key);  
        //     cellInfo.component.focus(this.gridOPItems.instance.getCellElement(rowIndex, "PRODUCTO"));
        //   }, 300);
  
        // }

      } else {
        // cellInfo.data.PRODUCTO = '';
        // showToast('El producto ya fue seleccionado.', 'error');
      }
    }
  }

  // Genera agenda con base en los pedidos
  generarAgenda(objeto) {

    this.detallada = false;
    this.loadingVisible = true;
    const prm = { ID_APLICACION : 'PRO-027', 
                  ESTADO_PRODUCCION: this.DTransaccProduccion.ESTADO_PRODUCCION,  
                  USUARIO: localStorage.getItem('usuario'),
                  DATOS: objeto
                };
    this._sdatos
      .consulta('cargar agenda consumo', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.loadingVisible = false;
        if (res[0].ErrMensaje !== ''){
          this.showModal(res[0].ErrMensaje, 'error');
          return;
        }
        this.DTransaccProduccionOP = res[0].AGENDA;
        this.DTransaccProduccionOPbak = res[0].AGENDA;
        this.DTransaccProduccionOPdet = res[0].AGENDA_DETALLADA;
        this.DTransaccProduccionItems = res[0].INSUMOS;
      });

  }

  onValueChangedAgDet(e) {
    this.detallada = e.value;
    if (e.value) 
      this.DTransaccProduccionOP = JSON.parse(JSON.stringify(this.DTransaccProduccionOPdet));
    else
      this.DTransaccProduccionOP = JSON.parse(JSON.stringify(this.DTransaccProduccionOPbak));
  }

  // Genera agenda con base en los pedidos
  recalcAgenda(objeto) {

    this.loadingVisible = true;
    const prm = { ID_APLICACION : 'PRO-027', USUARIO: localStorage.getItem('usuario'), PEDIDOS: this.DTransaccProduccionItems };
    this._sdatos
      .consulta('recalcular agenda op', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DTransaccProduccionItems = res;
        this.loadingVisible = false;
      });

  }

  // Recibe los datos de la grid de tasas
  onRespuestaSelecc(e: any) {
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
    const prm = { ORDEN_PRODUCCION: {ID_DOCUMENTO: this.DTransaccProduccion.ID_DOCUMENTO, CONSECUTIVO: this.DTransaccProduccion.CONSECUTIVO } };
    this._sdatos
      .delete('delete', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== ''){
          this.showModal(res[0].ErrMensaje, 'error');
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        showToast('Orden de produccion anulada', 'success');
        this.readOnly = true;
        this.readOnlyUdp = true;
        this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1].ESTADO = "ANULADO";
        this.DTransaccProduccion = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));

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

  calcularValores(){
    this.setValoresCartera();
  }

  cambiosItemForma(e, accion = 'activar'){
  }

  onChangeFecha(e) {
    this.DTransaccProduccion.FECHA = e.value;
  }
  disableDates(args: any) {
    const today = new Date();
    const fhoy = this.datepipe.transform(today, 'MM/dd/yyyy');
    const fcal = this.datepipe.transform(args.date, 'MM/dd/yyyy');
    const ford = this.datepipe.transform(this.DTransaccProduccion.FECHA, 'MM/dd/yyyy');
    const dfhoy = new Date(fhoy!);
    const dfcal = new Date(fcal!);
    const dford = new Date(ford!);
    return dfcal < (dford == undefined ? dfhoy : dford) ;
  }

  enableProductosItems(){
    if( this.DTransaccProduccion.DOCUMENTO == '' )
      this.rowNew = false;
    else {
      this.rowNew = true;
    }

  }

  // previsualizar el reporte
  imprimirReporte(operimp) {
    let filtroRep: any = '';
    if (operimp.registro === 'todos')
      filtroRep = { FILTRO: this.QFiltro };
    else
      filtroRep = { FILTRO: " MOVIMIENTOS_PRO.ID_DOCUMENTO = '"+this.DTransaccProduccion.ID_DOCUMENTO+"' " +
                            " AND MOVIMIENTOS_PRO.CONSECUTIVO = '"+this.DTransaccProduccion.CONSECUTIVO+"'" };
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
      filtroRep = { FILTRO: " MOVIMIENTOS_PRO.ID_DOCUMENTO = '"+this.DTransaccProduccion.ID_DOCUMENTO+"' " +
                            " AND MOVIMIENTOS_PRO.CONSECUTIVO = '"+this.DTransaccProduccion.CONSECUTIVO+"'" };
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
    asunto = asunto.replace('%NUMERO_ORDEN%',this.DTransaccProduccion.DOCUMENTO);
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
      filtroRep = { FILTRO: " MOVIMIENTOS_PRO.ID_DOCUMENTO = '"+this.DTransaccProduccion.ID_DOCUMENTO+"' " +
                            " AND MOVIMIENTOS_PRO.CONSECUTIVO = '"+this.DTransaccProduccion.CONSECUTIVO+"'" };

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
      replacements: { NUMERO_ORDEN: this.DTransaccProduccion.DOCUMENTO, 
                      DIA_ENTREGA: this.datepipe.transform(new Date(),'MMMM d, y',undefined,'es'),
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

      this._sgenerales.sendMail('send',{ datos: prmRpt },this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          showToast('Correo enviado a '+e.DESTINO_EMAIL);
        
        // Guarda en el log de envios de correos de la OC
        const prm = { ID_APLICACION : 'PRO-027', 
                      ORIGEN: 'documento', 
                      DATOS: this.DTransaccProduccion,
                      EVENTO: 'ENVIO EMAIL',
                      DETALLE: e.DESTINO_EMAIL +  ' Status:enviado',
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

  initNewRow(e){
    e.data.ID_UN = '';
    e.data.ITEM = 0;
    e.data.ID_COMPONENTE = '';
    e.data.SOPORTE = '';
    e.data.UDM = '';
    e.data.ID_SECCION = '';
    e.data.CANTIDAD = 0;
    e.data.CANTIDAD_PRODUCCION = 0;
    e.data.CANTIDAD_EXIS = 0;
    e.data.CANTIDAD_PENDIENTE = 0;
    e.data.VALOR_UNITARIO = 0;
    e.data.TOTAL = 0;
    if (this.DTransaccProduccionItems.length > 0) {
      const item = this.DTransaccProduccionItems.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
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
    this.esVisibleSelecc = 'always';
    // e.component.navigateToRow(e.key);
    // e.component.addRow();
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
    this.gridBoxUN = [this.DTransaccProduccion.ID_SECCION_ORIGEN];
    this.sbDocumento = this.DTransaccProduccion.DOCUMENTO;
  }

  loadManualDatatables(){
    this.setDocumentoToDatatable();
  }

  removedRow(e) {
    this.setItemValues();
    this.rowApplyChanges = false;

  }

  resetValidaciones(){
    //this.formOrdenProd.instance.resetValues();
  }

  selectionGridOP(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }
  selectionGridMP(e) {
    // this.filasSelecc = e.selectedRowKeys;
    // if (this.filasSelecc.length != 0)
    //   this.rowDelete = true;
    // else
    //   this.rowDelete = false;
  }

  setValoresCartera(){
    
  }

  setDocumentoToDatatable(){
    this.DDocumentos = [];
    this.DDocumentos.push({ID_DOCUMENTO: this.DTransaccProduccion.ID_DOCUMENTO, CONSECUTIVO: this.DTransaccProduccion.CONSECUTIVO, DOCUMENTO: this.DTransaccProduccion.ID_DOCUMENTO+'-'+this.DTransaccProduccion.CONSECUTIVO});
  }

  setDItemsAux(){
  }

  setDTransaccProduccionItemsValues(data){
    // for(const item of data){
    //   for(const DItem of this.DTransaccProduccionItems){
    //     if(item.ITEM === DItem.ITEM){
    //       DItem.GRAVAMENES = item.GRAV;
    //       DItem.VALOR_IVA = item.VAL_IVA;
    //       DItem.TOTAL = item.TOTAL;
    //     }
    //   }
    // }
  }

  setItemValues(){
    this.setDItemsAux();
    this.valoresObjetos('gravamenes');
    this.calcularValores();
  }

  showModal(mensaje: any, titulo = '¡Error!', msg_html= '') {
    const tipo = titulo;
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo==='Error' ? 'DF3E3E':'#0F4C81 !important',
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
    if (Accion === "requerido"){
      if(this.DTransaccProduccion.DOCUMENTO === '') msg += 'Documento ,';
      if(this.DTransaccProduccion.ID_SECCION_ORIGEN === '') msg += 'Sección ,';
      if(this.DTransaccProduccionItems === undefined || this.DTransaccProduccionItems.length === 0) msg += 'Insumos/MP: No se ha asociado ningún Insumo';
      if (msg !== '') {
        this.showModal("Hay datos incompletos de la Transacción de produccion. Revisar contenido de los items: "+msg,"Faltan datos",'');
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
  valoresObjetos(obj: string, opcion: any = undefined){
    if (obj == 'documento' || obj == 'todos') {
      const prm = { ID_APLICACION : 'PRO-027', USUARIO: localStorage.getItem('usuario')};
      this._sdatos
        .consulta('DOCUMENTOS CONSECUTIVO', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DDocumentos = res;
          this.eventsSubjectSboxDoc.next({ dataSource: this.DDocumentos, 
                                           valueExpr: "DOCUMENTO",
                                           displayExpr: "DOCUMENTO",
                                           columnData: ["DOCUMENTO"],
                                           valueData: this.DTransaccProduccion.DOCUMENTO });
          if(this.DDocumentos != null && this.DDocumentos.length == 1 && !this.readOnly){
            this.sbDocumento = this.DDocumentos[0].DOCUMENTO;
            this.DTransaccProduccion.DOCUMENTO = this.DDocumentos[0].DOCUMENTO;
            this.DTransaccProduccion.ID_DOCUMENTO = this.DDocumentos[0].ID_DOCUMENTO;
            this.DTransaccProduccion.CONSECUTIVO = this.DDocumentos[0].CONSECUTIVO;
          }
        });
    }

    if (obj == 'componentes' || obj == 'todos') {
      const prm = { FILTRO: 'materiales', MODO: 'UM', CLASE: 'MATERIALES' };
      this._sdatos.consulta('PRODUCTOS',prm,'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }

        // this.DProductos = res;
        this.DComponentesLista = JSON.parse(JSON.stringify(res));  
        this.DComponentes = new DataSource({
          store: res,  
          paginate: true,
          pageSize: 20
        });
      });
    }

    if (obj == 'un' || obj == 'todos' ) {
      this._sdatos.consulta('UN ITEM',{USUARIO: this.prmUsrAplBarReg.usuario},'generales').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DUNItem = res;
        this.eventsSubjectSboxUN.next({ dataSource: this.DSecciones, 
                                            valueExpr: "ID_UN",
                                            displayExpr: "ID_UN",
                                            style: { width: 700, colWidth: [33,33,33] },
                                            columnData: ["ID_UN","NOMBRE"],
                                            valueData: this.DTransaccProduccion.ID_SECCION_ORIGEN });

      });
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
 
    if (obj == 'estados produccion' || obj == 'todos' ) {
      this._sdatos.consulta('estados produccion', 
                            { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, 
                              USUARIO: this.prmUsrAplBarReg.usuario,
                              TIPO: this.DTransaccProduccion.TIPO??''
                            }, 
                            this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined)){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DEstadosProduccion = res;
    
        });
    }
 
    if (obj == 'secciones' || obj == 'todos' ) {
      this._sdatos.consulta('qsecciones', { FILTRO: '' }, 'PRO-008')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined)){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DSecciones = res;
          this.eventsSubjectSboxUN.next({ dataSource: this.DSecciones, 
                                              valueExpr: "ID_SECCION",
                                              displayExpr: "ID_SECCION",
                                              style: { width: 700, colWidth: [33,66] },
                                              columnData: ["ID_SECCION","DESCRIPCION"],
                                              valueData: this.DTransaccProduccion.ID_SECCION_ORIGEN });
      
        });
    }
 
     // Lista de reportes de la aplicación
    if (obj == 'reportes' || obj == 'todos' ) {
      const prm = { ID_APLICACION: this.prmUsrAplBarReg.aplicacion }
      this._sbarreg.listaInformes(prm).subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.listaReportes = [];
        let k = 0;
        res.forEach((rep:any) => {
          this.listaReportes.push({ text: rep.NOMBRE, 
                                    id_reporte: rep.ID_REPORTE, 
                                    archivo: rep.ARCHIVO,
                                    item: k,
                                    especificacion: rep.ESPECIFICACION !== '' ? JSON.parse(rep.ESPECIFICACION) : {} 
                                    })
          k++;
        });
      });
    }

    if (obj == 'bodegas' || obj == 'todos') {
      const prm = { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, 
                    USUARIO: this.prmUsrAplBarReg.usuario,
                    TIPO: this.DTransaccProduccion.TIPO??'',
                    ID_UN_ITEM: this.DTransaccProduccion.ID_UN_ITEM??''
                  };
      this._sdatos.consulta('BODEGAS',prm,this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        for (let i = 0; i < res.length; i++) {
          res[i].ITEM = i;
        }
        this.DBodegas = res;
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
    const user:any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: 'MOVIMIENTOS_PRO',
      aplicacion: 'PRO-027',
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
    
    window.addEventListener('scroll', this.onScroll, true);
    this.accordionExpand = [true];
    this.DTransaccProduccion = new clsTransaccProduccion;
    this.valoresObjetos('todos');
    this.opBlanquearForma();

    // Llamado externo
    this.route.params.subscribe(parameter => {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      const codePrm = urlParams.get('prm_rpt');
      if (codePrm) {
          
      }
    });

  }

  ngOnDestroy(){
    this.subscription.unsubscribe();
    this.subscriptionPedidos.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }
}