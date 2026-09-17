import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DxButtonModule, DxCheckBoxModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxLoadPanelModule, DxNumberBoxModule, DxPopupModule, DxScrollViewModule, DxTabsModule, DxToolbarModule, DxTooltipComponent, DxTooltipModule } from 'devextreme-angular';
import dxCheckBox from 'devextreme/ui/check_box';
import { lastValueFrom, Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { PRO023Service } from 'src/app/services/PRO023/PRO023.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import Swal from 'sweetalert2';
import { on } from "devextreme/events";
import { DatePipe } from '@angular/common';
import notify from 'devextreme/ui/notify';
import { validatorRes } from 'src/app/shared/validator/validator';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { showToast } from '../../shared/toast/toastComponent';
import { PRO02300Component } from './PRO02300/PRO02300.component';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-PRO023',
  templateUrl: './PRO023.component.html',
  styleUrls: ['./PRO023.component.css'],
	standalone: true,
	imports: [CommonModule, DxTabsModule, DxDateBoxModule, DxButtonModule, DxDataGridModule, DxNumberBoxModule, DxTooltipModule, DxPopupModule,
					DxLoadPanelModule, VistarapidaComponent, GeninformesComponent, DxToolbarModule, DxCheckBoxModule, PRO02300Component, DxScrollViewModule,
          DxDropDownBoxModule, MatDividerModule
	]
})
export class PRO023Component implements OnInit {

  @ViewChild("gridProductosPMP", { static: false }) gridProductosPMP: DxDataGridComponent;
  @ViewChild("gridProductos", { static: false }) gridProductos: DxDataGridComponent;
  @ViewChild(DxTooltipComponent) tooltip: DxTooltipComponent;
  events: Subject<any> = new Subject<any>();
  eventsDatos: Subject<any> = new Subject<any>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();

	public _unsubscribeAll: Subject<any>;
  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  colCountByScreen: object;
  prmUsrAplBarReg: clsBarraRegistro;

  DGPMP: any = [];
  DGPMP_prev: any = [];
  DGproductos: any = [];
  DGproductos_prev: any = [];
  DGDetallesproductos: any = [];
  selectPedido: any = [];
  EstadosPMP: any = [];
	opcionesValue: any = [];
  fechaDesde: any = '';
  fechaHasta: any = '';
	mesajeToas: any = [];
	idSecc: any;
	codSecc: any = [];
	codTer: any = '';
	USUARIO_LOCAL:any = '';
  esVisibleSelecc: string = 'none';
	
  QFiltro: any;
	mnuAccion: string;
	VDatosReg: any[] = [];
  
  conCambios: number = 0;
  readOnly: boolean;
	masterDetails: boolean = false;
	visibleToasInfo: boolean = false;
	loadingVisible: boolean = false;
	visiblePopupDetalles: boolean = false;
	visiblePopupSimulador: boolean = false;
  
  // Operaciones de grid
  rowEdit: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  rowApplyChanges2: boolean = false;
  // actBtn: boolean = false;
  filaSelecc:any = [];
  
  NOW: any = this.formatFecha(new Date());
  FECHA_INICIO: any = null;
  FECHA_FIN: any = null;
  FECHA_DIA: any = null;
  TOTAL_PROGRAMADO: number = 0;
  TOTAL_PENDIENTE: number = 0;
  
	DGplanes: any[] = [];
  ATRIBUTOS_PMP: any[] = [];
	selectPlanes: any[] = [];
	openPlanes: boolean = false;

  toolTipVisible: boolean = false;
  targetIdTooltip: string;
  tooltipTitulo: string;
  tooltipInfo: string;
  wrapperAttr = { class: "cls-tooltip-reg" };

  // Cola y procesamiento de mensajes de advertencia para duplicados
  mensajeQueue: string[] = [];
  isProcessingQueue = false;

  summaryGroupItems: any[] = [
    {
      column: 'TOTAL',
      summaryType: 'sum',
      valueFormat: '#,##0',
      displayFormat: '{0}',
      alignByColumn: true,
      showInGroupFooter: false
    }
  ];
  totalSummaryItems: any[] = [
    {
      column: 'TOTAL',
      summaryType: 'sum',
      valueFormat: '#,##0',
      displayFormat: '{0}',
      alignByColumn: true
    }
  ];

  // Variables Popup reprogramar
  popupVisible: boolean = false;
  popupTitulo: string = '';
  popupContenido: string = '';
  popupAccion: string = '';
  popupAccionGrid: string = '';
  popupData: any = null;
  selectPlanPopup:any = [];
  openPlanPopup: boolean = false;
  FECHA_INICIO_POPUP: any = null;
  FECHA_FIN_POPUP: any = null;
  FECHA_DIA_POPUP: any = null;

  constructor(
    private sData: PRO023Service,
		private _sbarreg: SbarraService,
    private tabService: TabService,
		private datePipe: DatePipe,
    private _sfiltro: SfiltroService,
    private SVisor: SvisorService
  ) {
		
    this.subscription = this._sbarreg
    .getObsRegApl()
    .pipe(takeUntil(this.unSubscribe))
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
    });

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex((d:any) => d.ITEM === resp.ITEM);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx+1;
        this.opIrARegistro('r_numreg');
      }
    });

    this.colCountByScreen = {
      xs: 1,
      sm: 2,
      md: 2,
      lg: 2,
    };

    this.onSelectionChangedPedidos = this.onSelectionChangedPedidos.bind(this);
    this.addColumn = this.addColumn.bind(this);
    this.onRowUpdated = this.onRowUpdated.bind(this);
    this.onRowDblClick = this.onRowDblClick.bind(this);
    // this.orderHeaderFilter = this.orderHeaderFilter.bind(this);
    this.getTimeProdution = this.getTimeProdution.bind(this);
    this.onValueChangedCP = this.onValueChangedCP.bind(this);
  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase();
    this.prmUsrAplBarReg = {
			tabla: 'PMP',
			aplicacion: 'PRO-023',
			usuario: this.USUARIO_LOCAL,
			accion: 'r_ini',
			error: '',
			r_numReg: 0,
			r_totReg: 0,
			operacion: { r_buscar: false, r_refrescar:false }
		};
		this.readOnly = true;
    this.esVisibleSelecc = 'none';
    this.mnuAccion = 'update';
		this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.valoresObjetos('todos');
  }
	ngOnDestroy() {
    this.subscription.unsubscribe();
		this.subs_filtro.unsubscribe();
		this.subs_visor.unsubscribe();
  }

  onContentReady(e:any) {
		e.component.columnOption("command:edit", "visible", false);  
	}

  
  onValueChangedFecha(e:any, tipo:any) {
    switch (tipo) {
      case 'DIA':
        this.FECHA_DIA = this.datePipe.transform(e.value, 'yyyy-MM-dd');
        this.esVisibleSelecc = 'always';
        break;
      case 'POPUP':
        this.FECHA_DIA_POPUP = e.value; // Mantener como Date object
        break;

      default:
        break;
    }
  }

  formatFecha(date: any): string {
    if (!date || isNaN(new Date(date).getTime())) {
      console.error('Fecha inválida recibida en formatFecha:', date);
      return '';
    }
    
    try {
      const d = new Date(date); // acepta Date, string o timestamp
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      const fechaFormateada = `${year}-${month}-${day}T00:00:00`;
      
      console.log('Fecha original:', date);
      console.log('Fecha formateada:', fechaFormateada);
      
      return fechaFormateada;
    } catch (error) {
      console.error('Error en formatFecha:', error);
      return '';
    }
  }
  onSelectionChangedPlan(e:any, component:any) {
    if (component === 'GRID') {
      if (e.selectedRowKeys.length > 0) {
        console.log('=== PLAN SELECCIONADO ===');
        console.log('Plan datos:', e.selectedRowsData[0]);
        console.log('FECHA_INICIO original:', e.selectedRowsData[0].FECHA_INICIO);
        console.log('FECHA_FINAL original:', e.selectedRowsData[0].FECHA_FINAL);
        
        // Validar fechas antes de formatear
        const fechaInicio = new Date(e.selectedRowsData[0].FECHA_INICIO);
        const fechaFinal = new Date(e.selectedRowsData[0].FECHA_FINAL);
        
        if (isNaN(fechaInicio.getTime()) || isNaN(fechaFinal.getTime())) {
          showToast('El plan seleccionado tiene fechas inválidas', 'error');
          return;
        }
        
        console.log('Fechas parseadas:');
        console.log('- Inicio:', fechaInicio);
        console.log('- Final:', fechaFinal);
        console.log('- Diferencia en días:', Math.ceil((fechaFinal.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)));
        
        this.openPlanes = false;
        this.FECHA_INICIO = this.formatFecha(fechaInicio);
        this.FECHA_FIN = this.formatFecha(fechaFinal);
        
        console.log('Fechas formateadas:');
        console.log('- FECHA_INICIO:', this.FECHA_INICIO);
        console.log('- FECHA_FIN:', this.FECHA_FIN);
        
        this.FECHA_DIA = null;
        this.TOTAL_PROGRAMADO = 0;
        this.TOTAL_PENDIENTE = 0;
        this.DGproductos = [];
        this.valoresObjetos('pedidos pmp');
        this.opMenuRegistro({...this.prmUsrAplBarReg, accion:'r_modificar'});
        this.gridProductosPMP.instance.clearSelection();
      } else {
        this.openPlanes = false;
        this.opBlanquearForma();
      }
    }
    if (component === 'DROP' && (e.value === null || e.value === undefined || e.value === undefined)) {
      this.opBlanquearForma();
    }
    if (component === 'GRID_POPUP') {
      if (e.selectedRowKeys.length > 0) {
        console.log('=== PLAN POPUP SELECCIONADO ===');
        console.log('Plan popup:', e.selectedRowsData[0]);
        
        this.openPlanPopup = false;
        // Para popup, mantener como Date objects para mejor comparación
        this.FECHA_INICIO_POPUP = new Date(e.selectedRowsData[0].FECHA_INICIO);
        this.FECHA_FIN_POPUP = new Date(e.selectedRowsData[0].FECHA_FINAL);
        
        console.log('- FECHA_INICIO_POPUP:', this.FECHA_INICIO_POPUP);
        console.log('- FECHA_FIN_POPUP:', this.FECHA_FIN_POPUP);
        
        this.FECHA_DIA_POPUP = null;
      } else {
        this.openPlanPopup = false;
        this.FECHA_INICIO_POPUP = null;
        this.FECHA_FIN_POPUP = null;
        this.FECHA_DIA_POPUP = null;
      }
    }
    if (component === 'DROP_POPUP' && (e.value === null || e.value === undefined || e.value === undefined)) {
      this.openPlanPopup = false;
      this.FECHA_INICIO_POPUP = null;
      this.FECHA_FIN_POPUP = null;
      this.FECHA_DIA_POPUP = null;
    }

  }
	
  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.prmUsrAplBarReg = {
          tabla: "PMP",
          aplicacion: "PRO-023",
          usuario: this.USUARIO_LOCAL,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_modificar: true}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.readOnly = false;
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.opPrepararModificar();
        break;

      case "r_guardar":
        var msj:any = '';
        // if (this.FCapacidad.FECHA_INICIO === this.FCapacidad.FECHA_FIN)
        //   showToast('Las fechas no deben ser iguales, selecciones una FECHA FINAL MAYOR','error');
        // else if (this.DSecciones.length === 0)
        //   showToast('No se han cargado las Secciones y su Capacidad.','error');
        // else
          // this.opPrepararGuardar(this.mnuAccion, 'Manual');
        break;

      case "r_buscar":
				if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
				if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case "r_buscar_ejec":
        this.opBlanquearForma();
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
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
        this.esVisibleSelecc = 'none';
        break;

      case "r_cancelar":
        // this.rowEdit = false;
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
          if (result.isConfirmed) {
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} }
            // this.FCapacidad = JSON.parse(JSON.stringify(this.FCapacidad_prev));
            this.mnuAccion = "";
            this.esVisibleSelecc = 'none';
            this.readOnly = true;
            this.conCambios = 0;
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          }
        });
        break;

      case "r_copiar":
        // if (this.FCapacidad) {
        //   this.mnuAccion = 'new';
        //   this.readOnly = false;
        // } else {
        //   showToast('Seleccione sección a copiar', 'Error');
        // }
        break;

      case "r_vista":
        this.opVista();
        break;

      case 'r_refrescar':
				this.valoresObjetos('todos');
				break;

      case "r_imprimir":
				this.imprimirReporte(operMenu);
        break;

      default:
        break;
    }
  }

	opPrepararNuevo(): void {
    this.eventsDatos.next({
      accion: 'new',
      config: { 
        accion: 'new', 
        readOnly: this.readOnly
      }
    });
  }

  opPrepararModificar(): void {
    this.mnuAccion = "update";
    this.DGproductos_prev = JSON.parse(JSON.stringify(this.DGproductos));
    this.DGPMP_prev = JSON.parse(JSON.stringify(this.DGPMP));
    this.readOnly = false;
    this.esVisibleSelecc = 'none';
  }

  opBlanquearForma(): void {
    this.DGproductos_prev = JSON.parse(JSON.stringify(this.DGproductos));
    this.DGPMP_prev = JSON.parse(JSON.stringify(this.DGPMP));
    this.FECHA_INICIO = null;
    this.FECHA_FIN = null;
    this.FECHA_DIA = null;
    this.TOTAL_PROGRAMADO = 0;
    this.TOTAL_PENDIENTE = 0;
    this.DGPMP = [];
    this.DGproductos = [];
    this.mnuAccion = "";
    this.esVisibleSelecc = 'none';
    this.readOnly = true;

    this.limpiarColumnasDinamicas('DGPMP');
    this.gridProductos.instance.repaint();
    this.gridProductosPMP.instance.repaint();        
  }

  opPrepararBuscar(accion: any): void {
    if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para PMP",
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: 'PMP',
        aplicacion: this.prmUsrAplBarReg.aplicacion
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { PMP: arrFiltro };
      this.loadingVisible = true;

      // Ejecuta búsqueda API
      this.sData
        .consulta('consulta', prm,this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          this._sfiltro.enConsulta = false;
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje !== '') {
            this.VDatosReg = [];
            this.opBlanquearForma();
            //notificació
            showToast(datares[0].ErrMensaje, 'error');
            return;
          } else {
            this.VDatosReg = datares;
            this.QFiltro = datares[0].QFILTRO;
            
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
          }
          this.loadingVisible = false;
          this._sfiltro.enConsulta = false;
        });
    }
      this.readOnly = true;

    // this.readOnly = false;
  }

  opIrARegistro(accion: string): void {
    var newArray:any = {};
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        if ( this.VDatosReg.length != 0 ) {
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this.prmUsrAplBarReg.r_numReg = 1;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.readOnly = true;
          showToast("No se encontraron datos", 'error');
        }
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
        this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
          ? this.VDatosReg.length
          : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
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
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

        } else {
          this.opBlanquearForma();
        }
        this.readOnly = true;
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        this.prmUsrAplBarReg.r_totReg = this.VDatosReg.length;
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          newArray =
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        } else {
          this.opBlanquearForma();
        }
        break;

      default:
        break;
    }


  }

  opEliminar(): void {
    Swal.fire({
      title: '',
      text: '',
      html: '¿Eliminar el registro?<br/>'+
            '<b style="color: red;">¡ADVERTENCIA!</b> Se eliminarán los datos asociados!',
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
    const prm = { OPERACION: 'delete', DATOS: '' };
    this.sData
			.save('delete', prm)
      .pipe(takeUntil(this._unsubscribeAll))
			.subscribe({ 
        next: (data) => {
          try {
            const res = validatorRes(data);
            if (res[0].ErrMensaje !== '') {
              this.showModal(res[0].ErrMensaje, 'Error');
              return;
            }
  
            this.opIrARegistro("Eliminado");
            showToast('Turno eliminado', 'success');
            this.readOnly = true;
  
            // Operaciones de barra
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: this.prmUsrAplBarReg.r_totReg !== 0 ? 'r_navegar' : 'r_ini',
              operacion: {}
            };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          } catch (error) {
            this.showModal('Error respuesta eliminar');
          }
        },
        error: (err => {
          this.showModal('Error al eliminar');
        })
      });
  }

  // Vista/Zoom de los datos consultados
  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: "Capacidad de producción",
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: ['FECHA_INICIO|Fecha Inicio','FECHA_FIN|Fecha Fin','CAPACIDAD|Capacidad','HORARIOS|Horarios','PLANTAS|Plantas'],
      Filtro: '',
      keyGrid: ['ITEM']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

	addColumn(data:any, grid:string) {
    let columns: any = [];
    var newArray: any = [];
	  var columnVisibles: any = [];

    if (grid === 'DGproductos') {
      if (columnVisibles.length === 0)
        columnVisibles = this.gridProductos.instance.getVisibleColumns();
      for (let i = 0; i < data.length; i++) {
        var element = data[i];
        // Validar duplicados por DOCUMENTO_PEDIDO, PRODUCTO y FECHA_PROGRAMADA
        const npos: any = this.DGproductos.findIndex((d: any) =>
          d.DOCUMENTO_PEDIDO === element.DOCUMENTO_PEDIDO &&
          d.PRODUCTO === element.PRODUCTO &&
          d.FECHA_PROGRAMADA === element.FECHA_PROGRAMADA
        );
        if (npos !== -1) {
          this.DGproductos[npos].CANTIDAD_PROGRAMADA += element.CANTIDAD_PROGRAMADA;
          this.DGproductos[npos].CANTIDAD_PENDIENTE += element.CANTIDAD_PROGRAMADA - element.CANTIDAD;
          this.DGproductos[npos].TOTAL += element.TOTAL;

          this.enqueueWarning(`El producto ${element.PRODUCTO} con pedido ${element.DOCUMENTO_PEDIDO} y fecha ${element.FECHA_PROGRAMADA} ya existe. Se sumaron las cantidades.`);
        }

        const Plantas = Object.keys(element).filter(key => key.startsWith("PL"));
        if (Plantas.length > 0) {
          // Obtener columnas visibles actuales
          const visibles: any = this.gridProductos.instance.getVisibleColumns();
          const indexCantidad: any = visibles.findIndex((d: any) => d.dataField === 'CANTIDAD_PROGRAMADA');
          const indexTotal: any = visibles.findIndex((d: any) => d.dataField === 'TOTAL');
          let nextIndex = (indexCantidad !== -1) ? visibles[indexCantidad].visibleIndex + 1 : 1;
          const totalIndex = (indexTotal !== -1) ? visibles[indexTotal].visibleIndex : undefined;
          const usedIndexes = visibles.map((col: any) => col.visibleIndex).filter((idx: any) => idx !== undefined);

          Plantas.forEach((key) => {
            const existe = visibles.find((d: any) => d.dataField === key);
            if (!existe) {
              // Buscar el mayor visibleIndex de las columnas PL ya agregadas
              const plColumns = visibles.filter((col: any) => col.dataField && col.dataField.startsWith('PL'));
              let maxPLIndex = nextIndex - 1;
              if (plColumns.length > 0) {
                maxPLIndex = Math.max(...plColumns.map((col: any) => col.visibleIndex));
              }
              let insertIndex = maxPLIndex + 1;

              // Si insertIndex choca con TOTAL o alguna columna fija, ajústalo
              if (totalIndex !== undefined && insertIndex >= totalIndex) {
                insertIndex = totalIndex;
                // Mover TOTAL y las siguientes una posición adelante
                visibles.forEach((col: any) => {
                  if (col.visibleIndex >= totalIndex) {
                    this.gridProductos.instance.columnOption(col.dataField, 'visibleIndex', col.visibleIndex + 1);
                  }
                });
              }

              columns.push({
                dataField: key,
                caption: key,
                alignment: 'right',
                format: "#,##0",
                visibleIndex: insertIndex
              });
              usedIndexes.push(insertIndex);
              nextIndex = insertIndex + 1;

              // Agregar el resumen solo si no existe
              if (!this.summaryGroupItems.some((item: any) => item.column === key)) {
                this.summaryGroupItems.push({
                  column: key,
                  summaryType: 'sum',
                  valueFormat: '#,##0',
                  displayFormat: '{0}',
                  alignByColumn: true,
                  showInGroupFooter: false
                });
              }

              // Agregar el total en el footer solo si no existe
              if (!this.totalSummaryItems.some((item: any) => item.column === key)) {
                this.totalSummaryItems.push({
                  column: key,
                  summaryType: 'sum',
                  valueFormat: '#,##0',
                  displayFormat: '{0}',
                  alignByColumn: true,
                });
              }

              // Asegura que TOTAL siempre esté en el footer
              if (!this.totalSummaryItems.some((item: any) => item.column === 'TOTAL')) {
                this.totalSummaryItems.push({
                  column: 'TOTAL',
                  summaryType: 'sum',
                  valueFormat: '#,##0',
                  displayFormat: '{0}',
                  alignByColumn: true,
                });
              }


            }
          });
        }

        // Si es un nuevo registro, asignar ITEM único
        if (npos === -1) {
          // Buscar el máximo ITEM actual en DGproductos
          let maxItem = 0;
          if (this.DGproductos.length > 0) {
            maxItem = Math.max(...this.DGproductos.map((d: any) => Number(d.ITEM) || 0));
          } else if (newArray.length > 0) {
            maxItem = Math.max(...newArray.map((d: any) => Number(d.ITEM) || 0));
          }
          element.ITEM = maxItem + 1;
          newArray.push(element);
        }
      }
      this.DGproductos = [...this.DGproductos, ...newArray];
      columns.forEach((col: any) => {
        const columnVisible: any[] = this.gridProductos.instance.getVisibleColumns();
        const indexColumn: any = columnVisible.findIndex((d: any) => d.dataField === col.dataField);
        if (indexColumn === -1)
          this.gridProductos.instance.addColumn(col);
      });
      
      this.getFechas();
      this.TOTAL_PROGRAMADO = this.DGproductos.reduce((acc: number, item: any) => acc + (item.TOTAL || 0), 0);
      this.gridProductos.instance.refresh();

    }

    if (grid === 'DGPMP') {
      if (columnVisibles.length === 0)
        columnVisibles = this.gridProductosPMP.instance.getVisibleColumns();
      for (let i = 0; i < data.length; i++) {
        var element = data[i];
        // Validar duplicados por DOCUMENTO_PEDIDO, PRODUCTO y FECHA_PROGRAMADA
        const npos: any = this.DGPMP.findIndex((d: any) =>
          d.DOCUMENTO_PEDIDO === element.DOCUMENTO_PEDIDO &&
          d.PRODUCTO === element.PRODUCTO &&
          d.FECHA_PROGRAMADA === element.FECHA_PROGRAMADA
        );
        if (npos !== -1) {
          this.DGPMP[npos].CANTIDAD_PROGRAMADA += element.CANTIDAD_PROGRAMADA;
          this.DGPMP[npos].CANTIDAD_PENDIENTE += element.CANTIDAD_PROGRAMADA - element.CANTIDAD;
          this.DGPMP[npos].TOTAL += element.TOTAL;

          this.enqueueWarning(`El producto ${element.PRODUCTO} con pedido ${element.DOCUMENTO_PEDIDO} y fecha ${element.FECHA_PROGRAMADA} ya existe. Se sumaron las cantidades.`);
        }

        // Si es un nuevo registro, asignar ITEM único
        if (npos === -1) {
          // Buscar el máximo ITEM actual en DGPMP
          let maxItem = 0;
          if (this.DGPMP.length > 0) {
            maxItem = Math.max(...this.DGPMP.map((d:any) => Number(d.ITEM) || 0));
          } else if (newArray.length > 0) {
            maxItem = Math.max(...newArray.map((d:any) => Number(d.ITEM) || 0));
          }
          element.ITEM = maxItem + 1;
          newArray.push(element);
        }
      }
      
      this.DGPMP = [...this.DGPMP, ...newArray];
      columns.forEach((col: any) => {
        const columnVisible: any[] = this.gridProductosPMP.instance.getVisibleColumns();
        const indexColumn: any = columnVisible.findIndex((d: any) => d.dataField === col.dataField);
        if (indexColumn === -1)
          this.gridProductosPMP.instance.addColumn(col);
      });

      this.getFechas();
      this.TOTAL_PENDIENTE = this.DGPMP.reduce((acc: number, item: any) => acc + (item.TOTAL || 0), 0);
      this.gridProductosPMP.instance.refresh();
      
      // // Aplica el HeaderFilter dinámico
      // if (this.gridProductosPMP && this.gridProductosPMP.instance) {
      //   this.gridProductosPMP.instance.columnOption(
      //     "ATRIBUTOS",
      //     "headerFilter",
      //     this.atributosHeaderFilter
      //   );
      //   console.log('HeaderFilter aplicado dinámicamente a ATRIBUTOS');
      // }

    }

  }

  // orderHeaderFilter = ({ dataSource }) => {
  //   dataSource.postProcess = (results: unknown[]) => {
  //     results = [];
  //     this.ATRIBUTOS_PMP.forEach((ele: any) => {
  //       results.push({ text: ele.NOMBRE_ATRIBUTO, value: ele.VALOR });
  //     });
  //     return results;
  //   };
  // };
  get atributosHeaderFilter() {
    return {
      allowSearch: true,
      height: 400,
      width: 400,
      dataSource: null,
      contentTemplate: (container: any, options: any) => {
        // const element = document.createElement("div");
        // container.append(element);

        ($("#gridProductosPMP") as any).dxDataGrid({
          dataSource: this.ATRIBUTOS_PMP.map((ele: any) => ({
            CODIGO: ele.CODIGO,
            NOMBRE_ATRIBUTO: ele.NOMBRE_ATRIBUTO,
            VALOR: ele.VALOR,
          })),
          columns: [
            { dataField: "CODIGO", caption: "Código" },
            { dataField: "NOMBRE_ATRIBUTO", caption: "Atributo" },
            { dataField: "VALOR", caption: "Valor" },
          ],
          keyExpr: "VALOR",
          selection: { mode: "multiple" },
          showBorders: true,
          onSelectionChanged: (e: any) => {
            const selectedValues = e.selectedRowsData.map((x: any) => x.VALOR);
            options.component.filter(
              selectedValues.length ? ["ATRIBUTOS", "in", selectedValues] : null
            );
          },
        });
      },
    };
  }
  calculateFilterExpression(value:any, operation:any, target:any) {
    const column = this as any;
    if(value && target === "headerFilter") {
      return [column.dataField, operation, value];
    }
    return column.defaultCalculateFilterExpression.apply(column, arguments);
  }
  orderHeaderFilter = ({ dataSource }) => {
    // dataSource.postProcess = (results: unknown[]) => {
    //   results = [];
    //   this.ATRIBUTOS_PMP.forEach((ele: any) => {
    //     results.push({ id: ele.ATRIBUTO, text: ele.NOMBRE_ATRIBUTO, value: ele.VALOR });
    //   });
    //   return results;
    // };
    dataSource.postProcess = (results: unknown[]) => {
      // Agrupa por CODIGO
      results = [];
      const agrupado = {};
      this.ATRIBUTOS_PMP.forEach((ele: any) => {
        const codigo = ele.CODIGO;
        if (!agrupado[codigo]) {
          agrupado[codigo] = {
            key: codigo,
            text: ele.NOMBRE_ATRIBUTO, // Descripción del grupo
            items: []
          };
        }
        agrupado[codigo].items.push({
          key: ele.VALOR,
          text: ele.VALOR // Descripción del item
        });
        // if (!results[codigo]) {
        //   results.push(
        //     // {
        //     // key: agrupado[codigo].key,
        //     // text: agrupado[codigo].text,
        //     // items: agrupado[codigo].items
        //   // }
        //   agrupado
        // );
        // }
        // if (results.findIndex((r:any) => r.key === codigo) === -1) {
        //   results.push({
        //     key: agrupado[codigo].key,
        //     text: agrupado[codigo].text,
        //     items: agrupado[codigo].items
        //   });
        // }

      });

      // Devuelve el array ordenado por código
      return Object.values(agrupado).sort((a:any, b:any) => a.key.localeCompare(b.key));
      // return results;
    };
  };


  limpiarColumnasDinamicas(grid:string) {
    if (grid === 'DGPMP') {
      const columnasFijas = ['FECHA_PROGRAMADA', 'DOCUMENTO_PEDIDO', 'NOMBRE_CLIENTE', 'PRODUCTO', 'NOMBRE_PRODUCTO', 'ATRIBUTOS', 'CANTIDAD', 'CANTIDAD_PROGRAMADA', 'CANTIDAD_PENDIENTE', 'TOTAL', 'ESTADO'];
      const columnVisibles = this.gridProductosPMP.instance.getVisibleColumns();
      columnVisibles.forEach((col: any) => {
        if (col.dataField && !columnasFijas.includes(col.dataField)) {
          this.gridProductosPMP.instance.deleteColumn(col.dataField);
        }
      });
    }
  }

  enqueueWarning(msg: string) {
    this.mensajeQueue.push(msg);
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  processQueue() {
    if (this.mensajeQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }
    this.isProcessingQueue = true;
    const msg = this.mensajeQueue.shift();
    showToast(msg, 'warning');
    setTimeout(() => this.processQueue(), 4000);
  }

  getDataSourceFilter(col: any) {
    var res: any = [];
    var dataSource: any = [];
    switch (col.dataField) {
      case 'ATRIBUTOS':
        this.ATRIBUTOS_PMP.forEach((ele: any) => {
          dataSource.push({ text: ele.NOMBRE_ATRIBUTO, value: ele.VALOR });
        });
        res = dataSource;
        break;

      default:
        break;
    }
    return res;
  }

  onSelectionExpand(e:any) {
    if (e.key !== undefined){
      const datos:any [] = this.DGproductos.filter((d:any) => d.ITEM === e.key);
      setTimeout(() => {
        this.eventsDatos.next({
          accion: 'CONSULTA PARTES',
          dataSource: JSON.parse(JSON.stringify(datos[0]))
        });
      }, 100);
    }
  }

  getFechas() {
    let arr: any = [];
    let arrayFechas: any = [];
    // FECHA DE INICIO
    for (let i = 0; i < this.DGproductos.length; i++) {
      const element = this.DGproductos[i].FECHA_INICIO;
      if (element !== null && element !== undefined && element !== '')
        arr.push(element);
    }
    if (arr.length > 0) {
      arrayFechas = arr.map((fechaActual:any) => new Date(fechaActual) );
      var min = new Date(Math.min.apply(null,arrayFechas));
      this.fechaDesde = min;
    }
    // FECHA DE FINAL
    for (let i = 0; i < this.DGproductos.length; i++) {
      const element = this.DGproductos[i].FECHA_FINAL;
      if (element !== null && element !== undefined && element !== '')
        arr.push(element);
    }
    if (arr.length > 0) {
      arrayFechas = arr.map((fechaActual:any) => new Date(fechaActual) );
      var max = new Date(Math.max.apply(null,arrayFechas));
      this.fechaHasta = max;
    }
  }

  async onRowDblClick(e:any) {
    this.loadingVisible = true;
    const prm = {ID_PEDIDO: e.data.ID_DOCUMENTO, CONSECUTIVO: e.data.CONSECUTIVO, PRODUCTO: e.data.PRODUCTO, USUARIO: this.USUARIO_LOCAL};
    const apiRest = this.sData.consulta('DETALLE PROGRAMADO', prm, 'PRO023');
    const res = await lastValueFrom(apiRest, { defaultValue: true });
    const newRes = JSON.parse(res.data);
    if (newRes[0].ErrMensaje !== ''){
      this.loadingVisible = false;
      this.showModal(newRes[0].ErrMensaje);
    } else {
      this.DGDetallesproductos = newRes;
      this.visiblePopupDetalles = true;
      this.loadingVisible = false;
    }
  }

  onHiddenPopupDetalles(e:any) {
    this.DGDetallesproductos = [];
  }

  onHiddenPopupSimulador(e:any) {
    this.visiblePopupSimulador = false;
  }

  onRespuestaComponent(datos:any, component:any) {
    switch (datos.ACCION) {
      case 'guardar datos':
        this.opPrepararGuardar('GUARDAR AGENDA', 'Automatico', datos);
        break;
      case 'validar datos':
        // this.valoresObjetos(datos.ACCION, datos.PRM);
        break;
    
      default:
        break;
    }
  }

  operGrid(e:any, operacion:any, grid:string) {
    if (this.readOnly) return;
    if (this.mnuAccion !== 'update' && this.mnuAccion !== 'new') return;
    switch (operacion) {
      case 'edit':
        if (grid === 'DGproductos') {
          if (e.data.ORDEN_PRO !== null && e.data.ORDEN_PRO !== undefined && e.data.ORDEN_PRO !== '') {
            showToast('No se puede modificar un producto que ya tiene Orden de Producción.', 'warning');
            return;
          }
          const pos:any = this.gridProductos.instance.getRowIndexByKey(e.key);
          this.gridProductos.instance.editRow(pos);
          this.rowApplyChanges = true;
          // this.rowEdit = false;
        } else if (grid === 'DGPMP') {
          if (this.FECHA_DIA === null || this.FECHA_DIA === undefined) {
            showToast('Definir Fecha Día.', 'warning');
            return;
          }          
          const pos:any = this.gridProductosPMP.instance.getRowIndexByKey(e.key);
          this.gridProductosPMP.instance.editRow(pos);
          this.rowApplyChanges2 = true;
          // this.rowEdit = false;
        }
        break;
      case 'save':
        if (grid === 'DGproductos') {
          this.gridProductos.instance.saveEditData();
          this.gridProductos.instance.clearSelection();
          this.rowApplyChanges = false;
          // this.rowEdit = false;
        }  else if (grid === 'DGPMP') {
          if (this.FECHA_DIA === null || this.FECHA_DIA === undefined) {
            showToast('Definir Fecha Día.', 'warning');
            return;
          }
          this.gridProductosPMP.instance.saveEditData();
          this.gridProductosPMP.instance.clearSelection();
          this.rowApplyChanges2 = false;
          // this.rowEdit = false;
        }
        break;
      case 'cancel':
        if (grid === 'DGproductos') {
          this.gridProductos.instance.cancelEditData();
          this.gridProductos.instance.clearSelection();
          this.rowApplyChanges = false;
          // this.rowEdit = false;
        } else if (grid === 'DGPMP') {
          this.gridProductosPMP.instance.cancelEditData();
          this.gridProductosPMP.instance.clearSelection();
          this.rowApplyChanges2 = false;
          // this.rowEdit = false;
        }
        break;

      default:
        break;
    }
  }

  async onRowUpdated(e:any, grid:string) {
    // this.actBtn = false;
    this.conCambios++;
    if (grid === 'DGproductos') {
      this.rowApplyChanges = false;
      if (e.data.CANTIDAD_PENDIENTE > 0) {
        const npos: any = this.DGPMP.findIndex((d:any) => 
          d.ID_DOCUMENTO === e.data.ID_DOCUMENTO &&
          d.CONSECUTIVO === e.data.CONSECUTIVO &&
          d.PRODUCTO === e.data.PRODUCTO
        );
        if (npos === -1) {
          // Calcular el nuevo ITEM como el máximo ITEM actual + 1
          let maxItem = 0;
          if (this.DGPMP.length > 0) {
            maxItem = Math.max(...this.DGPMP.map((d: any) => Number(d.ITEM) || 0));
          }
          const nuevo = { ...e.data, CANTIDAD_PROGRAMADA: 0, ITEM: maxItem + 1, ID_PLAN: '' };
          this.DGPMP.push(nuevo);
          this.gridProductosPMP.instance.refresh();
        } else {
          var item:any = this.DGPMP[npos];
          item.CANTIDAD_PENDIENTE = e.data.CANTIDAD_PENDIENTE - e.data.CANTIDAD_PROGRAMADA;
          item.CANTIDAD_PROGRAMADA = 0;
          const pos:any = this.gridProductosPMP.instance.getRowIndexByKey(item.ITEM);
          this.gridProductosPMP.instance.cellValue(pos, 'CANTIDAD_PROGRAMADA', 0);
          this.gridProductosPMP.instance.cellValue(pos, 'CANTIDAD_PENDIENTE', item.CANTIDAD_PENDIENTE);
          this.gridProductosPMP.instance.refresh();
        }
      }
        
      if (e.data.CANTIDAD_PROGRAMADA > 0) {
        var dataRes:any = [];
        try {
          this.subirProductos(e.data, 'DGproductos', 'Consulta');
          dataRes = await this.opPrepararGuardar('UPDATE AGENDA', 'Manual', [e.data]);
        } catch (err) {
          dataRes = [{ESTADO: e.data.ESTADO}];
          showToast('Error al guardar los cambios', 'error');
        }
        
        const pos:any = this.gridProductos.instance.getRowIndexByKey(e.key);
        this.gridProductos.instance.cellValue(pos, 'ESTADO', dataRes[0].ESTADO);
        this.gridProductos.instance.refresh();

      } else if (e.data.CANTIDAD_PROGRAMADA === 0) {
        // Se elimina el producto de lo programado
        const npos: any = this.DGproductos.findIndex((d: any) => 
          d.ID_DOCUMENTO === e.data.ID_DOCUMENTO &&
          d.CONSECUTIVO === e.data.CONSECUTIVO &&
          d.PRODUCTO === e.data.PRODUCTO
        );
        this.DGproductos.splice(npos, 1);
        this.gridProductos.instance.refresh();
        try {
          // ELIMINAR DE AGENDA
          // this.opPrepararGuardar('DELETE AGENDA', 'Manual', [e.data]);
          dataRes = await this.opPrepararGuardar('DELETE AGENDA', 'Manual', [e.data]);
        } catch (err) {
          showToast('Error al guardar los cambios', 'error');
        }
      }
      this.TOTAL_PROGRAMADO = this.DGproductos.reduce((acc: number, item: any) => acc + (item.TOTAL || 0), 0);


    } else if (grid === 'DGPMP') {
      this.rowApplyChanges2 = false;
      if (e.data.CANTIDAD_PROGRAMADA > 0) {
        // this.actBtn = false;
        // e.data.FECHA_PROGRAMADA = this.FECHA_DIA;
        const npos: any = this.DGproductos.findIndex((d: any) => {
          const fechaA = d.FECHA_PROGRAMADA ? new Date(d.FECHA_PROGRAMADA) : null;
          const fechaB = e.data.FECHA_PROGRAMADA ? new Date(e.data.FECHA_PROGRAMADA) : null;
          return (
            d.ID_DOCUMENTO === e.data.ID_DOCUMENTO &&
            d.CONSECUTIVO === e.data.CONSECUTIVO &&
            d.PRODUCTO === e.data.PRODUCTO &&
            fechaA &&
            fechaB &&
            fechaA.getFullYear() === fechaB.getFullYear() &&
            fechaA.getMonth() === fechaB.getMonth() &&
            fechaA.getDate() === fechaB.getDate()
          );
        });
        if (npos === -1) {
          // Calcular el nuevo ITEM como el máximo ITEM actual + 1
          let maxItem = 0;
          if (this.DGproductos.length > 0) {
            maxItem = Math.max(...this.DGproductos.map((d: any) => Number(d.ITEM) || 0));
          }
          const nuevo = { ...e.data, ITEM: maxItem + 1 };
          this.subirProductos(nuevo, 'DGproductos', 'Guardar');

          if (nuevo.CANTIDAD_PENDIENTE === 0) {
            const pos:any = this.DGPMP.findIndex((d:any) => d.ITEM === e.data.ITEM);
            if (pos !== -1) {
              this.DGPMP.splice(pos, 1);
            }
          } else if (e.data.CANTIDAD_PENDIENTE > 0) {
            e.data.CANTIDAD_PROGRAMADA = 0;
            const pos:any = this.gridProductosPMP.instance.getRowIndexByKey(e.data.ITEM);
            this.gridProductosPMP.instance.cellValue(pos, 'CANTIDAD_PROGRAMADA', e.data.CANTIDAD_PROGRAMADA);
          }
          this.gridProductos.instance.refresh();
          
        } else {
          var item:any = this.DGproductos[npos];
          item.CANTIDAD_PROGRAMADA = e.data.CANTIDAD_PROGRAMADA;
          item.CANTIDAD_PENDIENTE = e.data.CANTIDAD_PENDIENTE - e.data.CANTIDAD_PROGRAMADA;
          const nuevo = item;
          this.subirProductos(nuevo, 'DGproductos', 'Update');
          
          if (item.CANTIDAD_PENDIENTE === 0) {
            const pos:any = this.DGPMP.findIndex((d:any) => d.ITEM === e.data.ITEM);
            if (pos !== -1) {
              this.DGPMP.splice(pos, 1);          
            }
          } else if (e.data.CANTIDAD_PENDIENTE > 0) {
            e.data.CANTIDAD_PROGRAMADA = 0;
            const pos:any = this.gridProductosPMP.instance.getRowIndexByKey(e.data.ITEM);
            this.gridProductosPMP.instance.cellValue(pos, 'CANTIDAD_PROGRAMADA', e.data.CANTIDAD_PROGRAMADA);
          }
          this.gridProductos.instance.refresh();
        }
        // this.actBtn = true;
      }
      
      this.TOTAL_PENDIENTE = this.DGPMP.reduce((acc: number, item: any) => acc + (item.TOTAL || 0), 0);
    }

    this.conCambios++;
  }

  calcularFechas(e:any) {
    if (this.mnuAccion.match('new|update')) {
      //se consulta el calculo de tiempo de producción, se optiene una fecha
      this.getTimeProdution();
    }
  }

  onContextMenuPreparing(e: any, grid: string) {
    if (e.row.rowType === "data") {
      let items: any = [];
      const selectedItems = [e.row.key];

      if (selectedItems.length === 0) {
        items = [
          {
            text: "No hay filas seleccionadas.",
            disabled: true
          }
        ];
      } else {
        items.push(
          {
            text: "Cancelar",
            desabled: (e.row.data.ESTADO === 'CANCELADO' || e.row.data.ESTADO === 'FINALIZADO'),
            onClick: () => {
              console.log('=== DATOS PARA CANCELAR SETUP ===');
              console.log('Datos completos del row:', e.row.data);
              console.log('ID_PLAN del row:', e.row.data.ID_PLAN);
              console.log('Grid:', grid);
              
              this.popupTitulo = 'Cancelar ' + e.row.data.PRODUCTO + ' - ' + e.row.data.NOMBRE_PRODUCTO;
              this.popupAccionGrid = grid;
              this.popupAccion = 'cancelar';
              this.popupData = {
                ...e.row.data, 
                FECHA_ANTERIOR: e.row.data.FECHA_PROGRAMADA,
                ID_PLAN: e.row.data.ID_PLAN
              };
              this.selectPlanPopup = [e.row.data.ID_PLAN];
              
              // Para cancelar, mantener las fechas del plan actual
              this.FECHA_INICIO_POPUP = new Date(this.FECHA_INICIO);
              this.FECHA_FIN_POPUP = new Date(this.FECHA_FIN);
              this.FECHA_DIA_POPUP = new Date(e.row.data.FECHA_PROGRAMADA);
              
              console.log('=== CONFIGURACIÓN POPUP CANCELAR ===');
              console.log('popupData:', this.popupData);
              console.log('selectPlanPopup:', this.selectPlanPopup);
              console.log('FECHA_DIA_POPUP:', this.FECHA_DIA_POPUP);
              
              this.popupVisible = true;
            }
          },
          {
            text: "Reprogramar",
            onClick: () => {
              console.log('=== DATOS PARA REPROGRAMAR SETUP ===');
              console.log('FECHA_PROGRAMADA original:', e.row.data.FECHA_PROGRAMADA);
              console.log('Tipo:', typeof e.row.data.FECHA_PROGRAMADA);
              console.log('Datos completos del row:', e.row.data);
              console.log('Grid:', grid);
              
              this.popupTitulo = e.row.data.PRODUCTO + ' - ' + e.row.data.NOMBRE_PRODUCTO;
              this.popupAccion = 'reprogramar';
              this.popupAccionGrid = grid;
              this.popupData = {
                ...e.row.data, 
                FECHA_ANTERIOR: e.row.data.FECHA_PROGRAMADA
              };
              this.selectPlanPopup = [e.row.data.ID_PLAN];
              this.FECHA_INICIO_POPUP = new Date(this.FECHA_INICIO);
              this.FECHA_FIN_POPUP = new Date(this.FECHA_FIN);
              // Convertir el string a Date para el DateBox
              this.FECHA_DIA_POPUP = new Date(e.row.data.FECHA_PROGRAMADA);
              
              console.log('=== CONFIGURACIÓN POPUP REPROGRAMAR ===');
              console.log('popupData:', this.popupData);
              console.log('selectPlanPopup:', this.selectPlanPopup);
              console.log('FECHA_DIA_POPUP después del formato:', this.FECHA_DIA_POPUP);
              
              this.popupVisible = true;
            }
          }
        );
      }
      e.items = items;
    }
  }

  // Agrega este método en la clase PRO023Component:
  async onConfirmarAccionPopup(accion:string, datos:any) {
    console.log('=== INICIO onConfirmarAccionPopup ===');
    console.log('Acción:', accion);
    console.log('Datos recibidos:', datos);
    console.log('Plan seleccionado popup:', this.selectPlanPopup);
    console.log('FECHA_DIA_POPUP:', this.FECHA_DIA_POPUP);
    console.log('FECHA_INICIO_POPUP:', this.FECHA_INICIO_POPUP);
    console.log('FECHA_FIN_POPUP:', this.FECHA_FIN_POPUP);

    if (accion === 'cancelar' || accion === 'reprogramar') {
      // Validar que el plan esté seleccionado
      if (!this.selectPlanPopup || this.selectPlanPopup.length === 0) {
        showToast('Debe seleccionar un plan válido', 'error');
        return;
      }

      this.conCambios++;
      try {
        let fechaProgramada;
        
        if (accion === 'cancelar') {
          // Para cancelar, usar la fecha original
          fechaProgramada = datos.FECHA_PROGRAMADA;
          console.log('Cancelar - usando fecha original:', fechaProgramada);
        } else {
          // Para reprogramar, validar y formatear nueva fecha
          if (!this.FECHA_DIA_POPUP) {
            showToast('Debe seleccionar una fecha para reprogramar', 'error');
            return;
          }

          if (this.FECHA_DIA_POPUP instanceof Date) {
            fechaProgramada = this.formatFecha(this.FECHA_DIA_POPUP);
          } else if (typeof this.FECHA_DIA_POPUP === 'string') {
            fechaProgramada = this.formatFecha(new Date(this.FECHA_DIA_POPUP));
          } else {
            throw new Error('Fecha de programación inválida');
          }

          console.log('Reprogramar - nueva fecha formateada:', fechaProgramada);

          // Validar que esté dentro del rango del plan (MEJORADA PARA CRUCE DE AÑO)
          const fechaValidar = new Date(fechaProgramada);
          const fechaInicio = new Date(this.FECHA_INICIO);
          const fechaFin = new Date(this.FECHA_FIN);

          console.log('=== VALIDACIÓN DE RANGO ===');
          console.log('Fecha a validar:', fechaValidar);
          console.log('Rango plan - Inicio:', fechaInicio);
          console.log('Rango plan - Fin:', fechaFin);
          console.log('¿Cruza año?', fechaInicio.getFullYear() !== fechaFin.getFullYear());

          // Validación mejorada para cruce de año
          let dentroDelRango = false;
          if (fechaInicio.getFullYear() === fechaFin.getFullYear()) {
            // Plan dentro del mismo año
            dentroDelRango = fechaValidar >= fechaInicio && fechaValidar <= fechaFin;
          } else {
            // Plan que cruza años
            dentroDelRango = (
              (fechaValidar.getFullYear() === fechaInicio.getFullYear() && fechaValidar >= fechaInicio) ||
              (fechaValidar.getFullYear() === fechaFin.getFullYear() && fechaValidar <= fechaFin) ||
              (fechaValidar.getFullYear() > fechaInicio.getFullYear() && fechaValidar.getFullYear() < fechaFin.getFullYear())
            );
          }

          console.log('¿Está dentro del rango?', dentroDelRango);

          if (!dentroDelRango) {
            showToast('La fecha debe estar dentro del rango del plan seleccionado', 'error');
            return;
          }
        }

        // Preparar datos completos
        const datosCompletos = {
          ...datos,
          FECHA_PROGRAMADA: fechaProgramada,
          ID_PLAN: datos.ID_PLAN || this.selectPlanPopup[0],
          USUARIO: this.USUARIO_LOCAL,
          FECHA_ANTERIOR: datos.FECHA_ANTERIOR || datos.FECHA_PROGRAMADA
        };

        console.log('=== DATOS COMPLETOS A ENVIAR ===');
        console.log('Datos completos:', datosCompletos);
        console.log('Acción:', accion === 'cancelar' ? 'CANCELAR' : 'REPROGRAMAR');
        console.log('Tipo:', this.popupAccionGrid === 'DGPMP' ? 'PEDIDOS' : 'AGENDA');

        const newData:any = await this.opPrepararGuardar(
          accion === 'cancelar' ? 'CANCELAR': 'REPROGRAMAR',
          (this.popupAccionGrid === 'DGPMP' ? 'PEDIDOS' : 'AGENDA'),
          [datosCompletos]
        );

        console.log('=== RESPUESTA DEL SERVIDOR ===');
        console.log('Respuesta:', newData);

        // Actualizar grids con validación mejorada para cruce de año
        if (this.popupAccionGrid === 'DGPMP') {
          this.actualizarGridDGPMP(newData[0], datos);
        }

        if (this.popupAccionGrid === 'DGproductos') {
          this.actualizarGridDGproductos(newData[0], datos);
        }

      } catch (err: any) {
        console.error('Error completo en onConfirmarAccionPopup:', err);
        showToast('Error al procesar la operación: ' + (err?.message || 'Error desconocido'), 'error');
      }
    }
    
    if (accion === 'salir') {
      this.conCambios = 0;
      this.popupAccionGrid = '';
      this.popupTitulo = '';
      this.popupAccion = '';
      this.popupData = null;
    }
    
    this.popupVisible = false;
  }


  async subirProductos(datos:any, grid:string, metodo:string) {
    var newArray: any = datos;
    if ((this.FECHA_DIA === null || this.FECHA_DIA === undefined) && datos[0].ESTADO === 'PEDIDO') {
      showToast('Definir Fecha Día.', 'warning');
      return;
    }
    if (grid === 'DGPMP') {
      newArray.forEach((ele:any) => {
        ele.FECHA_PROGRAMADA = new Date(this.FECHA_DIA);
        ele.CANTIDAD_PROGRAMADA = ele.CANTIDAD;
        ele.CANTIDAD_PENDIENTE = 0;
      });
    }

    const prm = {PRODUCTOS: newArray};
    try {
      const data: any = await new Promise((resolve, reject) => {
        this.sData.consulta('PROGRAMACION', prm, 'PRO-023')
          .subscribe({
            next: (data: any) => resolve(data),
            error: (err: any) => reject(err)
          });
      });
      const res = JSON.parse(data.data);
      if ((data.token != undefined)) {
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      if (res[0].ErrMensaje !== '') {
        this.showModal(res[0].ErrMensaje, '');
      } else {
        if (grid === 'DGPMP') {
          this.selectPedido.forEach((ele:any) => {
            const npos:any = this.DGPMP.findIndex((d:any) => d.ITEM === ele.ITEM);
            this.DGPMP.splice(npos, 1);          
          });
          this.gridProductosPMP.instance.clearSelection();
          this.gridProductosPMP.instance.refresh();
          this.TOTAL_PENDIENTE = this.DGPMP.reduce((acc: number, item: any) => acc + (item.TOTAL || 0), 0);
        }
        for (let i = 0; i < res.length; i++) {
          res[i].ITEM = i;
          res[i].ID_PLAN = this.selectPlanes[0];
          // res[i].FECHA_PROGRAMADA = this.datePipe.transform(new Date(res[i].FECHA_PROGRAMADA), 'dd/MM/yyyy');
          if ((res[i].ESTADO === 'PEDIDO' || res[i].ESTADO === 'REGISTRADO' || res[i].ESTADO === 'PENDIENTE') && 
              (res[i].ORDEN_PRO === null || res[i].ORDEN_PRO === undefined || res[i].ORDEN_PRO === '') &&
              metodo.match('Guardar|Update|Eliminar')
          ) {
            this.conCambios++;
            try {
              const dataRes: any = await this.opPrepararGuardar(
                (metodo === 'Guardar' ? 'GUARDAR AGENDA' : 
                  (metodo === 'Update' ? 'UPDATE AGENDA' :
                    (metodo === 'Eliminar' ? 'DELETE AGENDA' : 'INSERT AGENDA')
                  )
                ),
                'Manual',
                [res[i]]
              );
              res[i].ESTADO = dataRes[0].ESTADO === 'REGISTRADO' ? 'COMPROMETIDO' : dataRes[0].ESTADO;
            } catch (err) {
              res[i].ESTADO = 'ERROR';
            }
          }
        }
        this.addColumn(res, 'DGproductos');
      }
    } catch (err) {
      this.showModal('Error en la programación', 'Error');
    }
  }

  async getTimeProdution() {
    var newArray:any = [];
    this.loadingVisible = true;
    this.selectPedido.forEach((ele:any) => {
      newArray.push({ID_PEDIDO: ele.ID_DOCUMENTO, CONSECUTIVO: ele.CONSECUTIVO, PRODUCTO: ele.PRODUCTO, CANTIDAD: ele.CANTIDAD, USUARIO: this.USUARIO_LOCAL});
    });

    const prm = {PRODUCTOS: newArray };
    const apiRest = this.sData.consulta_fechas('CALCULO AGENDA', prm, 'PRO023');
    const res = await lastValueFrom(apiRest, { defaultValue: true });
    const newRes = JSON.parse(res.data);
    if (newRes[0].ErrMensaje !== ''){
      this.loadingVisible = false;
      this.showModal(newRes[0].ErrMensaje, 'Alerta');
    } else {
      this.fechaDesde = newRes[0].FECHA_INICIO;
      this.fechaHasta = newRes[0].FECHA_FINAL;
      this.loadingVisible = false;
      this.visiblePopupSimulador = true;
      // this.DGproductos = newArray;
      setTimeout(() => {
        this.eventsDatos.next({
          accion: 'Load Data',
          dataSource: JSON.parse(JSON.stringify(newArray)),
          fechas: newRes
        });
      }, 2000);
      this.conCambios++;
    }
  }

  templateHtml(data:any, element:any, component:string): any {
    if (data !== undefined && data !== null && data !== '') {
      let res: any = '';
      if (component === 'SPAN') {
        switch (element) {
          case 'FECHA_INICIO':
          case 'FECHA_FIN':
          case 'POPUP_FECHA_PROGRAMADA':
          case 'FECHA_INICIO_POPUP':
          case 'FECHA_FIN_POPUP':
            res = data ? this.datePipe.transform(new Date(data), 'dd/MM/yyyy') : null;
            break;
          case 'TOTAL_PROGRAMADO':
            res = this.TOTAL_PROGRAMADO;
            break;
          case 'TOTAL_PENDIENTE':
            res = this.TOTAL_PENDIENTE;
            break;
          default:
            break;
        }
      }
  
      if (component === 'GRID') {
        let fechaProgramada: string | null = null;
  
        if (data.row.data.items !== null) {
          fechaProgramada = data.row.data.items[0].FECHA_PROGRAMADA;
        } else if (data.row.data.collapsedItems !== undefined) {
          fechaProgramada = data.row.data.collapsedItems[0].FECHA_PROGRAMADA;
        }
  
        if (fechaProgramada) {
          switch (element) {
            case 'FECHA_PROGRAMADA':
            res = data ? this.datePipe.transform(new Date(fechaProgramada), 'dd/MM/yyyy') : null;
              break;
            case 'TOTAL_DIA':
              // Sumar todos los TOTAL_DIA de DGproductos con la misma FECHA_PROGRAMADA
              res = this.DGproductos
                .filter((item: any) => item.FECHA_PROGRAMADA === fechaProgramada)
                .reduce((acc: number, item: any) => acc + (item.TOTAL || 0), 0);
              break;
            default:
              break;
          }
        }
      }
  
      return res;
    }
  }

	onCellPrepared(e: any): void {
    // Solo deja seleccionables las que aun no tengan Orden de Producción
    if (
      e.rowType == "data" &&
      e.cellElement.querySelector(".dx-select-checkbox")
    ) {
      const check = e.cellElement.querySelectorAll(".dx-select-checkbox");
      check.forEach((ele: any, ixfila: any) => {
        const inst = dxCheckBox.getInstance(ele);
        if (e.data.MATRIZ){
              inst.option("visible", true);
          e.cellElement.style.pointerEvents = '';
          e.cellElement.style.opacity = '';
        }else {
          inst.option("visible", false);
          e.cellElement.style.pointerEvents = 'none';
          e.cellElement.style.opacity = '0.5';
        }
          
      });
    };
  }

  onSelectionChangedPedidos(e:any) {
    if (this.mnuAccion.match('new|update')) {
      this.selectPedido = e.selectedRowsData;
      this.filaSelecc = e.selectedRowKeys;
    }
  }

  onReorder = (e:any) => {
    const visibleRows = e.component.getVisibleRows();
    const toIndex = this.DGproductos.findIndex((item:any) => item.ITEM === visibleRows[e.toIndex].data.ITEM);
    const fromIndex = this.DGproductos.findIndex((item:any) => item.ITEM === e.itemData.ITEM);

    this.DGproductos.splice(fromIndex, 1);
    this.DGproductos.splice(toIndex, 0, e.itemData);
  };

  toggleToolTip(cellInfo:any) {
    this.targetIdTooltip = '#iconToolTip' + cellInfo.data.ITEM;
    this.tooltipTitulo = 'Faltan datos criticos.';
    this.tooltipInfo = 'El producto ' + cellInfo.data.PRODUCTO + ' - ' + cellInfo.data.NOMBRE_PRODUCTO + ' tiene datos faltantes en Matriz.';
    this.toolTipVisible = true;
  }

  onValueChangedCP(e:any, cellInfo:any, grid:string) {
    if (this.mnuAccion.match('new|update')) {
      if (e.value > 0 && e.value <= cellInfo.data.CANTIDAD) 
        cellInfo.data.CANTIDAD_PENDIENTE = cellInfo.data.CANTIDAD_PENDIENTE > 0 ? cellInfo.data.CANTIDAD_PENDIENTE - e.value : cellInfo.data.CANTIDAD - e.value;
      else
        cellInfo.data.CANTIDAD_PENDIENTE = cellInfo.data.CANTIDAD;

      if (grid === 'DGproductos'){
        const pos:any = this.gridProductos.instance.getRowIndexByKey(cellInfo.key);
        this.gridProductos.instance.cellValue(pos, 'CANTIDAD_PROGRAMADA', e.value);
        this.gridProductos.instance.cellValue(pos, 'CANTIDAD_PENDIENTE', cellInfo.data.CANTIDAD_PENDIENTE);
        this.conCambios++;
      } else if (grid === 'DGPMP'){
        const pos:any = this.gridProductosPMP.instance.getRowIndexByKey(cellInfo.key);
        this.gridProductosPMP.instance.cellValue(pos, 'CANTIDAD_PROGRAMADA', e.value);
        this.gridProductosPMP.instance.cellValue(pos, 'CANTIDAD_PENDIENTE', cellInfo.data.CANTIDAD_PENDIENTE);
        this.conCambios++;
      } else if (grid === 'POPUP'){
        this.popupData.CANTIDAD_PROGRAMADA = e.value;
        this.popupData.CANTIDAD_PENDIENTE = cellInfo.data.CANTIDAD_PENDIENTE;
      }
    }
  }

  async opPrepararGuardar(accion: string, tipo: string, datos: any): Promise<any> {
    if (this.conCambios > 0) {
      const prm = { PRODUCTOS: datos, USUARIO: this.USUARIO_LOCAL, TIPO: tipo };
      this.loadingVisible = true;
      return new Promise((resolve, reject) => {
        this.sData.save(accion, prm).subscribe({
          next: (data) => {
            this.loadingVisible = false;
            const res = JSON.parse(data.data);
            if ((data.token !== undefined)) {
              const refreshToken = data.token;
              localStorage.setItem("token", refreshToken);
            }
            if (res[0].ErrMensaje !== '') {
              // this.prmUsrAplBarReg.error = 'Error';
              // this.prmUsrAplBarReg.accion = 'r_guardar';
              // this.esVisibleSelecc = 'none';
              this.showModal(res[0].ErrMensaje, 'Error');
              reject(res[0]);
            } else {
              // this.readOnly = true;
              this.conCambios = 0;
              // this.esVisibleSelecc = 'none';
              showToast('Registro actualizado', 'success');
              resolve(res);
            }
          },
          error: (err) => {
            this.loadingVisible = false;
            this.showModal('Error al guardar', 'Error');
            reject(err);
          }
        });
      });
    } else {
      showToast('No hay cambios para guardar', 'error');
      return Promise.resolve([]);
    }
  }

	valoresObjetos(obj: string){
		if (obj == 'estados pmp' || obj == 'todos') {
      const prm = {ID_DOMINIO: 'ESTADOS', ID_GRUPO_DOMINIO: 'ESTADOS PMP'};
      this.sData.consultaEstado('ITM_DOMINIOS', prm)
			.subscribe((data: any) => {
				const res = JSON.parse(data.data);
				if ( (data.token != undefined) ){
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				if (res[0].ErrMensaje !== '') {
					this.showModal(res[0].ErrMensaje, '');
				} else {
					this.EstadosPMP = res;
				}
			});
    };
    
    if (obj === 'pedidos pmp'|| (obj == 'todos' && this.selectPlanes.length > 0) ) {
			const prm = {ID_PLAN: this.selectPlanes[0], FECHA_INICIO: this.FECHA_INICIO, FECHA_FINAL: this.FECHA_FIN };
      this.loadingVisible = true;
			this.sData.consulta('PEDIDOS PMP', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data) => {
        this.loadingVisible = false;
				const res = JSON.parse(data.data);
				if ( (data.token != undefined) ){
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				if (res[0].ErrMensaje !== '') {
					this.showModal(res[0].ErrMensaje, '');
				}
				else {
          this.ATRIBUTOS_PMP = [];
          for (let i = 0; i < res.length; i++) {
            res[i].ITEM = i;
            if (typeof res[i].ATRIBUTOS === "string") {
              const parsed = JSON.parse(res[i].ATRIBUTOS);
              res[i].ATRIBUTOS = Array.isArray(parsed) ? parsed : [parsed];
            }
            res[i].ATRIBUTOS.forEach((attr: any) => {
              if (!this.ATRIBUTOS_PMP.some((a: any) => 
                a.CODIGO === attr.CODIGO && 
                a.NOMBRE_ATRIBUTO === attr.NOMBRE_ATRIBUTO &&
                a.VALOR === attr.VALOR
              )) {
                this.ATRIBUTOS_PMP.push(attr);
              }
            });
          }
          this.DGPMP = [];
          this.limpiarColumnasDinamicas('DGPMP');
					this.addColumn(res.filter((d:any) => 
            // (d.ESTADO === 'REGISTRADO' || d.ESTADO === 'PEDIDO' || d.ESTADO === null) ||
            // (d.CANTIDAD_PENDIENTE > 0)
            // d.ORDEN_PRO === null
            d.ESTADO === 'PEDIDO'
          ), 'DGPMP');
          // const newData:any = res.filter((d:any) => d.ESTADO !== 'CANCELADO' && d.ESTADO !== 'PEDIDO');
          const newData:any = res.filter((d:any) => (d.ORDEN_PRO !== null && d.ORDEN_PRO !== undefined) || d.ESTADO === 'PROGRAMADO');
          if (newData.length > 0)
            this.subirProductos(newData, 'DGproductos', 'Consulta');
				}
			});
		};

		if (obj === 'planes produccion' || obj === 'todos') {
      const prm = { };
      this.sData.consulta('PLANES PROD', prm, this.prmUsrAplBarReg.aplicacion)
			.subscribe((data: any) => {
				const res = JSON.parse(data.data);
				if ( (data.token != undefined) ){
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				if (res[0].ErrMensaje !== '') {
					this.showModal(res[0].ErrMensaje, '');
				} else {
					this.DGplanes = res;
				}
			});
    };

    // if (obj == 'detalles plan') {
    //   const prm = {ID_PLAN: this.selectPlanes[0], FECHA_INICIO: this.FECHA_INICIO, FECHA_FINAL: this.FECHA_FIN };
    //   this.sData.consulta('DETALLES PLAN', prm, this.prmUsrAplBarReg.aplicacion)
		// 	.subscribe((data: any) => {
		// 		const res = JSON.parse(data.data);
		// 		if ( (data.token != undefined) ){
		// 			const refreshToken = data.token;
		// 			localStorage.setItem("token", refreshToken);
		// 		}
		// 		if (res[0].ErrMensaje === '') {
		// 			this.addColumn(res, 'DGproductos');
		// 		}
		// 	});
    // };

	}

  // Imprimir reporte de aplicación
  imprimirReporte(operMenu:any) {
		var prmRep = {
      ...operMenu.operacion, 
      accion: 'previsualizar',
      aplicacion: this.prmUsrAplBarReg.aplicacion, 
      tabla: this.prmUsrAplBarReg.tabla,
      usuario: this.prmUsrAplBarReg.usuario,
      // QFiltro: (operMenu.operacion.registro === 'todos') ? this.QFiltro : " CAPACIDAD_PRODUCCION.ITEM = "+this.FCapacidad.ITEM
    };
    if (operMenu.operacion.modo === 'previsualizar')
      this.eventsSubjectInformes.next(prmRep);
    if (operMenu.operacion.modo === 'pdf') {
      prmRep = { ...prmRep, accion: 'pdf' };
      this.eventsSubjectInformes.next(prmRep);
    }
    if (operMenu.operacion.modo === 'email') {
      let template = '';
      let asunto = '';
      let email_sale = '';
      let nom_usr = '';
      var prmRep = { ...operMenu.operacion, 
          accion: 'email',
          asunto,
          email_sale,
          especUsuarioEmail: nom_usr,
          // nombre: this.FCapacidad.ITEM,
          email:  '',
          template,
          replacements: '',
          // dataSource: this.FCapacidad
        };
      this.eventsSubjectInformes.next(prmRep);
    }

	}

  // Métodos auxiliares para actualizar grids con validación de cruce de año
  actualizarGridDGPMP(newData: any, datosOriginales: any) {
    // Validar si está dentro del rango de fechas visible
    const fechaValidar = new Date(newData.FECHA_PROGRAMADA);
    const fechaInicio = new Date(this.FECHA_INICIO);
    const fechaFin = new Date(this.FECHA_FIN);
    
    let dentroDelRangoVisible = false;
    if (fechaInicio.getFullYear() === fechaFin.getFullYear()) {
      dentroDelRangoVisible = fechaValidar >= fechaInicio && fechaValidar <= fechaFin;
    } else {
      dentroDelRangoVisible = (
        (fechaValidar.getFullYear() === fechaInicio.getFullYear() && fechaValidar >= fechaInicio) ||
        (fechaValidar.getFullYear() === fechaFin.getFullYear() && fechaValidar <= fechaFin) ||
        (fechaValidar.getFullYear() > fechaInicio.getFullYear() && fechaValidar.getFullYear() < fechaFin.getFullYear())
      );
    }

    if (dentroDelRangoVisible) {
      // Actualizar o agregar al grid
      const pos = this.DGPMP.findIndex((d: any) => 
        d.ID_DOCUMENTO === newData.ID_DOCUMENTO &&
        d.CONSECUTIVO === newData.CONSECUTIVO &&
        d.PRODUCTO === newData.PRODUCTO &&
        this.compararFechas(d.FECHA_PROGRAMADA, newData.FECHA_PROGRAMADA)
      );

      if (pos !== -1) {
        this.DGPMP[pos] = { ...this.DGPMP[pos], ...newData };
      } else {
        this.DGPMP.push(newData);
      }
    } else {
      // Remover del grid si está fuera del rango visible
      const pos = this.DGPMP.findIndex((d: any) => 
        d.ID_DOCUMENTO === datosOriginales.ID_DOCUMENTO &&
        d.CONSECUTIVO === datosOriginales.CONSECUTIVO &&
        d.PRODUCTO === datosOriginales.PRODUCTO &&
        this.compararFechas(d.FECHA_PROGRAMADA, datosOriginales.FECHA_ANTERIOR)
      );
      
      if (pos !== -1) {
        this.DGPMP.splice(pos, 1);
      }
    }

    this.gridProductosPMP.instance.refresh();
    this.TOTAL_PENDIENTE = this.DGPMP.reduce((acc: number, item: any) => acc + (item.TOTAL || 0), 0);
  }

  actualizarGridDGproductos(newData: any, datosOriginales: any) {
    // Validar si está dentro del rango de fechas visible
    const fechaValidar = new Date(newData.FECHA_PROGRAMADA);
    const fechaInicio = new Date(this.FECHA_INICIO);
    const fechaFin = new Date(this.FECHA_FIN);
    
    let dentroDelRangoVisible = false;
    if (fechaInicio.getFullYear() === fechaFin.getFullYear()) {
      dentroDelRangoVisible = fechaValidar >= fechaInicio && fechaValidar <= fechaFin;
    } else {
      dentroDelRangoVisible = (
        (fechaValidar.getFullYear() === fechaInicio.getFullYear() && fechaValidar >= fechaInicio) ||
        (fechaValidar.getFullYear() === fechaFin.getFullYear() && fechaValidar <= fechaFin) ||
        (fechaValidar.getFullYear() > fechaInicio.getFullYear() && fechaValidar.getFullYear() < fechaFin.getFullYear())
      );
    }

    if (dentroDelRangoVisible) {
      const pos = this.DGproductos.findIndex((d: any) => 
        d.ID_DOCUMENTO === newData.ID_DOCUMENTO &&
        d.CONSECUTIVO === newData.CONSECUTIVO &&
        d.PRODUCTO === newData.PRODUCTO &&
        this.compararFechas(d.FECHA_PROGRAMADA, newData.FECHA_PROGRAMADA)
      );

      if (pos !== -1) {
        this.DGproductos[pos] = { ...this.DGproductos[pos], ...newData };
      } else {
        this.DGproductos.push(newData);
      }
    } else {
      const pos = this.DGproductos.findIndex((d: any) => 
        d.ID_DOCUMENTO === datosOriginales.ID_DOCUMENTO &&
        d.CONSECUTIVO === datosOriginales.CONSECUTIVO &&
        d.PRODUCTO === datosOriginales.PRODUCTO &&
        this.compararFechas(d.FECHA_PROGRAMADA, datosOriginales.FECHA_ANTERIOR)
      );
      
      if (pos !== -1) {
        this.DGproductos.splice(pos, 1);
      }
    }

    this.gridProductos.instance.refresh();
    this.TOTAL_PROGRAMADO = this.DGproductos.reduce((acc: number, item: any) => acc + (item.TOTAL || 0), 0);
  }

  // Método auxiliar para comparar fechas
  compararFechas(fecha1: any, fecha2: any): boolean {
    if (!fecha1 || !fecha2) return false;
    
    const f1 = new Date(fecha1);
    const f2 = new Date(fecha2);
    
    return f1.getFullYear() === f2.getFullYear() &&
           f1.getMonth() === f2.getMonth() &&
           f1.getDate() === f2.getDate();
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

}
