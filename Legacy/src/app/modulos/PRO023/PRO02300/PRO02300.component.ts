import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxCheckBoxModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxLoadPanelModule, DxNumberBoxModule, DxPopupModule, DxScrollViewModule, DxTextBoxModule, DxToolbarModule, DxTooltipComponent, DxTooltipModule } from 'devextreme-angular';
import { lastValueFrom, Observable, Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { PRO023Service } from 'src/app/services/PRO023/PRO023.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import Swal from 'sweetalert2';
import { on } from "devextreme/events";
import { DatePipe } from '@angular/common';
import notify from 'devextreme/ui/notify';
import { validatorRes } from 'src/app/shared/validator/validator';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { showToast } from '../../../shared/toast/toastComponent';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-PRO02300',
  templateUrl: './PRO02300.component.html',
  styleUrls: ['./PRO02300.component.css'],
  standalone: true,
  imports: [CommonModule, DxDateBoxModule, DxButtonModule, DxDataGridModule, DxNumberBoxModule, DxTooltipModule, DxPopupModule,
          DxLoadPanelModule, DxToolbarModule, DxCheckBoxModule, DxScrollViewModule, DxTextBoxModule, DxNumberBoxModule
  ]
})

export class PRO02300Component {
  
  @ViewChild("gridPMP", { static: false }) gridPMP: DxDataGridComponent;
  @ViewChild("gridProductosPMP", { static: false }) gridProductosPMP: DxDataGridComponent;
  @ViewChild("gridProductos", { static: false }) gridProductos: DxDataGridComponent;
  @ViewChild(DxTooltipComponent) tooltip: DxTooltipComponent;

  @Input() events: Observable<any>;
  @Output() onRespuestaComponent: EventEmitter<any> = new EventEmitter<any>();

  
  eventsDatos: Subject<any> = new Subject<any>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();

  public _unsubscribeAll: Subject<any>;
  private eventsSubscription: Subscription;
  
  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  colCountByScreen: object;
  prmUsrAplBarReg: clsBarraRegistro;

  DGPMP: any = [];
  DGproductos: any = [];
  DGproductos_prev: any = [];
  DGproductosPMP_prev: any = [];

  NOW: any = new Date();
  FECHA_INICIO: any = null;
  FECHA_FIN: any = null;
  FECHA_DIA: any = null;

  
  DGDetallesproductos: any = [];
  selectPedido: any = [];
  EstadosPMP: any = [];
  opcionesValue: any = [];
  columnVisibles: any = [];
  fechaDesde: any = '';
  fechaHasta: any = '';
  mesajeToas: any = [];
  idSecc: any;
  codSecc: any = [];
  codTer: any = '';
  USUARIO_LOCAL:any = '';
  esVisibleSelecc: string = 'none';

  templateGroup: any = ['FECHA_PROGRAMADA'];
  
  QFiltro: any;
  mnuAccion: string = '';
  VDatosReg: any[] = [];
  
  conCambios: number = 0;
  TOTAL_PROGRAMADO: number = 0;
  readOnly: boolean;
  masterDetails: boolean = false;
  visibleToasInfo: boolean = false;
  loadingVisible: boolean = false;
  visiblePopupDetalles: boolean = false;
  visiblePopupSimulador: boolean = false;
  actBtn: boolean = false;

  // Operaciones de grid
  rowEdit: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  rowApplyChanges2: boolean = false;
  filaSelecc:any = [];

  // Cola y procesamiento de mensajes de advertencia para duplicados
  mensajeQueue: string[] = [];
  isProcessingQueue = false;

  constructor(
    private sData: PRO023Service,
    // private _sbarreg: SbarraService,
    // private tabService: TabService,
    private datePipe: DatePipe,
    // private _sfiltro: SfiltroService,
    // private SVisor: SvisorService
  ) {
    
    // this.subscription = this._sbarreg
    // .getObsRegApl()
    // .pipe(takeUntil(this.unSubscribe))
    // .subscribe((datreg) => {
    //   // Valida si la petición es para esta aplicacion
    //   if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
    //     this.opMenuRegistro(datreg);
    // });

    // // Respuesta del filtro
    // this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe(resp => {
    //   // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
    //   const dfiltro = JSON.parse(resp);
    //   if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
    //     this.opPrepararBuscar(resp);
    // });

    // // Respuesta del visor de datos
    // this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
    //   // Ubica el registro
    //   if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
    //   if (resp.accion === 'abrir') return;
    //   const nx = this.VDatosReg.findIndex((d:any) => d.ITEM === resp.ITEM);
    //   if (nx !== 0) {
    //     this.prmUsrAplBarReg.r_numReg = nx+1;
    //     this.opIrARegistro('r_numreg');
    //   }
    // })

    this.colCountByScreen = {
      xs: 1,
      sm: 2,
      md: 2,
      lg: 2,
    };

    this.onSelectionChangedPedidos = this.onSelectionChangedPedidos.bind(this);
    this.addColumn = this.addColumn.bind(this);
    this.operGrid = this.operGrid.bind(this);
    this.onRowDblClick = this.onRowDblClick.bind(this);
    this.getTimeProdution = this.getTimeProdution.bind(this);
    this.onValueChangedCP = this.onValueChangedCP.bind(this);
  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase();
    // this.prmUsrAplBarReg = {
    //   tabla: 'PMP',
    //   aplicacion: 'PRO-023',
    //   usuario: this.USUARIO_LOCAL,
    //   accion: 'r_ini',
    //   error: '',
    //   r_numReg: 0,
    //   r_totReg: 0,
    //   operacion: { r_modificar: true }
    // };
    // this.readOnly = true;
    // this.esVisibleSelecc = 'none';
    // this.mnuAccion = 'update';
    // this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    // this.valoresObjetos('todos');

    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.accion) {
        case 'init':
          // this.loadDataInit(datos.config);
          break;

        case 'load data':
          this.readOnly = datos.config.readOnly;
          this.loadDataInit(datos.config);
          break;

        case 'new':
          this.opPrepararNuevo();
          this.readOnly = datos.config.readOnly;
          break;
          

        default:
          break;
      }
    });



  }
  ngOnDestroy() {
    // this.subscription.unsubscribe();
    // this.subs_filtro.unsubscribe();
    // this.subs_visor.unsubscribe();
    this.eventsSubscription.unsubscribe();
  }

  onContentReady(e:any) {
    e.component.columnOption("command:edit", "visible", false);  
  }

  loadDataInit(data: any) {
    switch (data.accion) {
      case 'load data':
        this.DGPMP = data.datos;
        break;

      default:
        break;
    }
  }

  onValueChangedFecha(e:any, tipo:any) {
    // if (this.FECHA_INICIO === null) this.FECHA_INICIO = this.datePipe.transform(this.NOW, 'yyyy-MM-dd');
    // if (this.FECHA_FIN === null) this.FECHA_FIN = this.datePipe.transform(this.NOW, 'yyyy-MM-dd');
    switch (tipo) {
      case 'DIA':
        this.FECHA_DIA = this.datePipe.transform(e.value, 'yyyy-MM-dd');
        // if (this.FECHA_DIA < this.FECHA_INICIO) {
        //   this.FECHA_INICIO = this.datePipe.transform(this.FECHA_DIA, 'yyyy-MM-dd');
        // }
        // if (this.FECHA_DIA > this.FECHA_FIN) {
        //   this.FECHA_FIN = this.datePipe.transform(this.FECHA_DIA, 'yyyy-MM-dd');
        // }
        this.esVisibleSelecc = 'always';
        break;

      default:
        break;
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

  subirProductos(datos:any, grid:string) {
    var newArray: any = datos;

    if (grid === 'DGPMP') {
      newArray.forEach((ele:any) => {
        ele.FECHA_PROGRAMADA = this.FECHA_DIA;
        ele.CANTIDAD_PROGRAMADA = ele.CANTIDAD;
        ele.CANTIDAD_PENDIENTE = 0;
      });
    }

    const prm = {PRODUCTOS: newArray};
    this.sData.consulta('PROGRAMACION', prm, 'PRO-023')
    .subscribe((data: any) => {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ) {
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
        }
        for (let i = 0; i < res.length; i++) {
          res[i].ITEM = i;
          res[i].FECHA_PROGRAMADA = this.datePipe.transform(new Date(res[i].FECHA_PROGRAMADA), 'dd/MM/yyyy');
        }
        this.addColumn(res);
        this.conCambios++;
      }
    });

  }

  
  templateHtml(columna:any, element:any): any {
    let res: any = '';
    let fechaProgramada: string | null = null;

    if (columna.row.data.items !== null) {
      fechaProgramada = columna.row.data.items[0].FECHA_PROGRAMADA;
    } else if (columna.row.data.collapsedItems !== undefined) {
      fechaProgramada = columna.row.data.collapsedItems[0].FECHA_PROGRAMADA;
    }

    if (fechaProgramada) {
      switch (element) {
        case 'FECHA_PROGRAMADA':
          res = fechaProgramada;
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
    return res;
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
          operacion: {r_refrescar: false}
        };
        // this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
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
          this.opPrepararGuardar(this.mnuAccion, 'Manual');
        break;

      case "r_buscar":
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        // if (this._sfiltro.enConsulta === false) {
        //   this.opPrepararBuscar('filtro');
        // } else {
        //   showToast('Consulta en proceso, por favor espere.', 'warning');
        // }
        break;

      case "r_buscar_ejec":
        this.opBlanquearForma();
        // if (this._sfiltro.enConsulta === false) {
        //   this.opPrepararBuscar('');
        // } else {
        //   showToast('Consulta en proceso, por favor espere.', 'warning');
        // }
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
            // this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
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
        // this.valoresObjetos('todos');
        break;

      case "r_imprimir":
        this.imprimirReporte(operMenu);
        break;

      default:
        break;
    }
  }

  opPrepararNuevo(): void {
    this.opBlanquearForma();
    // this.esVisibleSelecc = 'always';
    this.mnuAccion = "new";
  }

  opPrepararModificar(): void {
    this.mnuAccion = "update";
    this.DGproductosPMP_prev = JSON.parse(JSON.stringify(this.DGPMP));
    this.DGproductos_prev = JSON.parse(JSON.stringify(this.DGproductos));
    this.readOnly = false;
    this.esVisibleSelecc = 'always';
  }

  opBlanquearForma(): void {
    this.DGproductosPMP_prev = JSON.parse(JSON.stringify(this.DGPMP));
    this.DGproductos_prev = JSON.parse(JSON.stringify(this.DGproductos));
    this.gridProductosPMP.instance.clearSelection();
    this.DGproductos = [];
    this.FECHA_INICIO = null;
    this.FECHA_FIN = null;
    this.FECHA_DIA = null;
    this.TOTAL_PROGRAMADO = 0;
  }

  opPrepararBuscar(accion: any): void {
    if (accion === "filtro") {
      // this._sfiltro.PrmFiltro = {
      //   Titulo: "Datos de filtro para PMP",
      //   accion: "PREPARAR FILTRO",
      //   Filtro: "",
      //   TablaBase: 'PMP',
      //   aplicacion: this.prmUsrAplBarReg.aplicacion
      // };
      // this._sfiltro.getObsFiltro.emit(true);
    } else {
      // this._sfiltro.enConsulta = true;
      // // Extrae la estructura del filtro
      // let prmDatosBuscar = JSON.parse(accion);
      // let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      // const prm = { PMP: arrFiltro };
      // this.loadingVisible = true;

      // // Ejecuta búsqueda API
      // this.sData
      //   .consulta('consulta', prm,this.prmUsrAplBarReg.aplicacion)
      //   .subscribe((data: any) => {
      //     this._sfiltro.enConsulta = false;
      //     const res = JSON.parse(data.data);
      //     if ( (data.token != undefined) ){
      //       const refreshToken = data.token;
      //       localStorage.setItem("token", refreshToken);
      //     }
      //     const datares = res;
      //     if (datares[0].ErrMensaje !== '') {
      //       this.VDatosReg = [];
      //       this.opBlanquearForma();
      //       //notificació
      //       showToast(datares[0].ErrMensaje, 'error');
      //       return;
      //     } else {
      //       this.VDatosReg = datares;
      //       this.QFiltro = datares[0].QFILTRO;
            
      //       // Prepara la barra para navegación
      //       this.prmUsrAplBarReg = {...this.prmUsrAplBarReg,
      //         r_totReg: datares.length,
      //         r_numReg: 1,
      //         accion: 'r_navegar',
      //         operacion: {}
      //       }
      //       this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      //       // Trae los items en los componentes asociados
      //       this.opIrARegistro('r_primero');
      //     }
      //     this.loadingVisible = false;
      //     this._sfiltro.enConsulta = false;
      //   });
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
          // this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.readOnly = true;
          showToast("No se encontraron datos", 'error');
        }
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        // this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
        this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
          ? this.VDatosReg.length
          : this.prmUsrAplBarReg.r_numReg + 1;
        // this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        // this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_numreg":
        if (this.prmUsrAplBarReg.r_numReg !== 0) {
          // Valida si hubo cambio de ordenamiento en el visor
          // if (this.SVisor.ColSort.Columna !== "") {
          //   if (this.SVisor.ColSort.Clase === "asc") {
          //     this.VDatosReg = this.VDatosReg.sort((a: any, b: any) =>
          //       a[this.SVisor.ColSort.Columna].toUpperCase() <
          //       b[this.SVisor.ColSort.Columna].toUpperCase()
          //         ? -1
          //         : 1
          //     );
          //   } else {
          //     this.VDatosReg = this.VDatosReg.sort((a: any, b: any) =>
          //       a[this.SVisor.ColSort.Columna].toUpperCase() >
          //       b[this.SVisor.ColSort.Columna].toUpperCase()
          //         ? -1
          //         : 1
          //     );
          //   }
          // }
          // newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1]));
          // this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

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
            // this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
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
    // this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    // this.SVisor.PrmVisor = {
    //   aplicacion: this.prmUsrAplBarReg.aplicacion,
    //   Titulo: "Capacidad de producción",
    //   accion: '',
    //   opciones: '|',
    //   Grupo: [],
    //   cols: ['FECHA_INICIO|Fecha Inicio','FECHA_FIN|Fecha Fin','CAPACIDAD|Capacidad','HORARIOS|Horarios','PLANTAS|Plantas'],
    //   Filtro: '',
    //   keyGrid: ['ITEM']
    // };
    // this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  addColumn(data:any) {
    // this.DGproductos = [];
    let columns: any = [];
    var newArray: any = [];
    if (this.columnVisibles.length === 0)
      this.columnVisibles = this.gridProductos.instance.getVisibleColumns();
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
        Plantas.forEach(key => {
          const exis = columns.indexOf(key);
          if (exis === -1) {
            const indexColumn: any = this.columnVisibles.findIndex((d: any) => d.caption === 'Plantas');
            columns.push({ dataField: key, caption: key, ownerBand: this.columnVisibles[indexColumn].index, alignment: 'left', format: '#,##0' });
          }
        });
      }
      if (npos === -1) 
        newArray.push(element);
    }
    this.DGproductos = [...this.DGproductos, ...newArray];
    columns.forEach((col: any) => {
      const columnVisibles: any[] = this.gridProductos.instance.getVisibleColumns();
      const indexColumn: any = columnVisibles.findIndex((d: any) => d.dataField === col.dataField);
      if (indexColumn === -1)
        this.gridProductos.instance.addColumn(col);
    });
    this.getFechas();
    
    this.TOTAL_PROGRAMADO = this.DGproductos.reduce((acc: number, item: any) => acc + (item.TOTAL || 0), 0);
    const fechas = this.DGproductos.map((d:any) => new Date(d.FECHA_PROGRAMADA));
    const fechaInicio = new Date(Math.min(...fechas));
    const fechaFinal  = new Date(Math.max(...fechas));
    this.FECHA_INICIO = fechaInicio;
    this.FECHA_FIN  = fechaFinal;
    this.actBtn = true;
    // this.loadingVisible = false;
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

  operGrid(e:any, operacion:any, grid:string) {
    if (this.readOnly) return;
    if (this.mnuAccion !== 'update' && this.mnuAccion !== 'new') return;
    if (this.FECHA_DIA === null || this.FECHA_DIA === undefined) {
      showToast('Seleccione una FECHA DE PROGRAMACIÓN', 'error');
      return;
    }
    switch (operacion) {
      case 'edit':
        if (grid === 'DGProductos') {
          const pos:any = this.gridProductos.instance.getRowIndexByKey(e.key);
          this.gridProductos.instance.editRow(pos);
          this.rowApplyChanges = true;
          // this.rowEdit = false;
        } else if (grid === 'DGPMP') {
          const pos:any = this.gridProductosPMP.instance.getRowIndexByKey(e.key);
          this.gridProductosPMP.instance.editRow(pos);
          this.rowApplyChanges2 = true;
          // this.rowEdit = false;
        }
        break;
      case 'save':
        if (grid === 'DGProductos') {
          this.gridProductos.instance.saveEditData();
          this.gridProductos.instance.clearSelection();
          this.rowApplyChanges = false;
          // this.rowEdit = false;
        }  else if (grid === 'DGPMP') {
          this.gridProductosPMP.instance.saveEditData();
          this.gridProductosPMP.instance.clearSelection();
          this.rowApplyChanges2 = false;
          // this.rowEdit = false;
        }
        break;
      case 'cancel':
        if (grid === 'DGProductos') {
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

  onRowUpdated(e:any, grid:string) {
    this.actBtn = false;
    if (grid === 'DGProductos') {
      this.rowApplyChanges = false;
      if (e.data.CANTIDAD_PENDIENTE > 0) {
        this.actBtn = false;
        const npos: any = this.DGPMP.findIndex((d: any) => d.ITEM === e.data.ITEM);
        if (npos === -1) {
          // Calcular el nuevo ITEM como el máximo ITEM actual + 1
          let maxItem = 0;
          if (this.DGPMP.length > 0) {
            maxItem = Math.max(...this.DGPMP.map((d: any) => Number(d.ITEM) || 0));
          }
          const nuevo = { ...e.data, ITEM: maxItem + 1 };
          this.DGPMP.push(nuevo);
          this.gridProductosPMP.instance.refresh();
        }
      } else {
        this.actBtn = true;
      }

      this.TOTAL_PROGRAMADO = this.DGproductos.reduce((acc: number, item: any) => acc + (item.TOTAL || 0), 0);

      const fechas = this.DGproductos.map((d:any) => new Date(d.FECHA_PROGRAMADA));
      const fechaInicio = new Date(Math.min(...fechas));
      const fechaFinal  = new Date(Math.max(...fechas));
      this.FECHA_INICIO = fechaInicio.toISOString().split("T")[0];
      this.FECHA_FIN  = fechaFinal.toISOString().split("T")[0];

    } else if (grid === 'DGPMP') {
      this.rowApplyChanges2 = false;
      if (e.data.CANTIDAD_PROGRAMADA > 0) {
        this.actBtn = false;
        e.data.FECHA_PROGRAMADA = this.FECHA_DIA;
        const npos: any = this.DGproductos.findIndex((d: any) => 
          d.DOCUMENTO_PEDIDO === e.data.DOCUMENTO_PEDIDO && 
          d.PRODUCTO === e.data.PRODUCTO && 
          d.FECHA_PROGRAMADA === e.data.FECHA_PROGRAMADA
        );
        if (npos === -1) {
          // Calcular el nuevo ITEM como el máximo ITEM actual + 1
          let maxItem = 0;
          if (this.DGproductos.length > 0) {
            maxItem = Math.max(...this.DGproductos.map((d: any) => Number(d.ITEM) || 0));
          }
          const nuevo = { ...e.data, ITEM: maxItem + 1 };
          this.subirProductos(nuevo, 'DGproductos');

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
          this.subirProductos(nuevo, 'DGproductos');
          
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
        this.actBtn = true;
      }
    }

    this.conCambios++;
  }

  calcularFechas(e:any) {
    if (this.mnuAccion.match('new|update')) {
      //se consulta el calculo de tiempo de producción, se optiene una fecha
      this.getTimeProdution();
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

  onSelectionChangedPedidos(e:any) {
    if (this.mnuAccion.match('new|update') && this.FECHA_DIA !== null && this.FECHA_DIA !== undefined) {
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

  onValueChangedCP(e:any, cellInfo:any, grid:string) {
    if (this.mnuAccion.match('new|update')) {
      if (e.value < cellInfo.data.CANTIDAD) 
        cellInfo.data.CANTIDAD_PENDIENTE = cellInfo.data.CANTIDAD_PENDIENTE > 0 ? cellInfo.data.CANTIDAD_PENDIENTE - e.value : cellInfo.data.CANTIDAD - e.value;
      else
        cellInfo.data.CANTIDAD_PENDIENTE = 0;

      if (grid === 'DGProductos'){
        const pos:any = this.gridProductos.instance.getRowIndexByKey(cellInfo.key);
        this.gridProductos.instance.cellValue(pos, 'CANTIDAD_PROGRAMADA', e.value);
        this.gridProductos.instance.cellValue(pos, 'CANTIDAD_PENDIENTE', cellInfo.data.CANTIDAD_PENDIENTE);
      } else if (grid === 'DGPMP'){
        const pos:any = this.gridProductosPMP.instance.getRowIndexByKey(cellInfo.key);
        this.gridProductosPMP.instance.cellValue(pos, 'CANTIDAD_PROGRAMADA', e.value);
        this.gridProductosPMP.instance.cellValue(pos, 'CANTIDAD_PENDIENTE', cellInfo.data.CANTIDAD_PENDIENTE);
      }
      this.conCambios++;
    }
  }

  
  opPrepararGuardar(accion: string, tipo:string): void {
    if ( this.conCambios != 0 ) {
      const prm = {PRODUCTOS: this.DGproductos, USUARIO: this.USUARIO_LOCAL, TIPO: tipo};
      this.onRespuestaComponent.emit({
        accion: 'guardar datos',
        data: prm,
      });

      // this.loadingVisible = true;
      // this.sData.save(accion, prm).subscribe((data) => {
      //   this.loadingVisible = false;
      //   const res = JSON.parse(data.data);
      //   if ( (data.token != undefined) ){
      //     const refreshToken = data.token;
      //     localStorage.setItem("token", refreshToken);
      //   }
      //   if (res[0].ErrMensaje !== '') {
      //     this.prmUsrAplBarReg.error = 'Error';
      //     this.prmUsrAplBarReg.accion = 'r_guardar';
      //     this.esVisibleSelecc = 'none';
      //     this.showModal(res[0].ErrMensaje, 'Error');
      //   } else {
      //     // Operaciones de barra
      //     if(this.VDatosReg.length > 0) {
      //       // this.QFiltro = "CAPACIDAD_PRODUCCION='"+this.FCapacidad.ITEM+"'";
      //       const npos:any = this.VDatosReg.findIndex((d:any) => d.ITEM === '');
      //       if (npos > -1) {
      //         this.VDatosReg[npos] = {PRODUCTOS: this.DGproductos};
      //       } else {
      //         this.VDatosReg.push({PRODUCTOS: this.DGproductos});
      //       }
      //       if(this.mnuAccion === 'new') {
      //         this.prmUsrAplBarReg = {
      //           ...this.prmUsrAplBarReg,
      //           error: "",
      //           accion: "r_navegar",
      //           r_numReg: this.prmUsrAplBarReg.r_numReg + 1,
      //           r_totReg: this.prmUsrAplBarReg.r_totReg + 1,
      //           operacion: {}
      //         };
      //       } else {
      //         this.prmUsrAplBarReg = {
      //           ...this.prmUsrAplBarReg,
      //           error: "",
      //           accion: "r_navegar",
      //           r_numReg: this.prmUsrAplBarReg.r_numReg,
      //           r_totReg: this.prmUsrAplBarReg.r_totReg,
      //           operacion: {}
      //         };
      //       }
      //     } else {
      //       // this.QFiltro = "CAPACIDAD_PRODUCCION='"+this.FCapacidad.ITEM+"'";
      //       this.prmUsrAplBarReg = {
      //         ...this.prmUsrAplBarReg,
      //         error: "",
      //         accion: "r_navegar",
      //         r_numReg: 1,
      //         r_totReg: 1,
      //         operacion: {}
      //       };
      //       this.VDatosReg = [{PRODUCTOS: this.DGproductos}];
      //     }
      //     this.readOnly = true;
      //     this.conCambios = 0;
      //     this.esVisibleSelecc = 'none';
      //     // this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      //     // this.valoresObjetos('pedidos pmp');
      //     showToast('Registro actualizado', 'success');
      //   }
      // });
      this.opBlanquearForma();
    } else {
      showToast('No hay cambios por guardar', 'error');
      this.readOnly = true;
      this.prmUsrAplBarReg = {
        ...this.prmUsrAplBarReg,
        accion: "r_ini",
        error: "",
        r_numReg: 0,
        r_totReg: 0,
        operacion: {r_refrescar: true}
      };
      // this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    }
  }

  // valoresObjetos(obj: string){
  //   if (obj == 'estados pmp' || obj == 'todos'){
  //     const prm = {ID_DOMINIO: 'ESTADOS', ID_GRUPO_DOMINIO: 'ESTADOS PMP'};
  //     this.sData.consultaEstado('ITM_DOMINIOS', prm)
  //     .subscribe((data: any) => {
  //       const res = JSON.parse(data.data);
  //       if ( (data.token != undefined) ){
  //         const refreshToken = data.token;
  //         localStorage.setItem("token", refreshToken);
  //       }
  //       if (res[0].ErrMensaje !== '') {
  //         this.showModal(res[0].ErrMensaje, '');
  //       } else {
  //         this.EstadosPMP = res;
  //       }
  //     });
  //   };
    
  //   if (obj === 'pedidos pmp' || obj === 'todos') {
  //     const prm = { };
  //     // API guardado de datos
  //     // setTimeout(() => {
  //       this.loadingVisible = true;
  //     // }, 500);
  //     this.sData.consulta('PEDIDOS PMP', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data) => {
  //       const res = JSON.parse(data.data);
  //       if ( (data.token != undefined) ){
  //         const refreshToken = data.token;
  //         localStorage.setItem("token", refreshToken);
  //       }
  //       if (res[0].ErrMensaje !== '') {
  //         this.showModal(res[0].ErrMensaje, '');
  //       }
  //       else {
  //         for (let i = 0; i < res.length; i++) {
  //           res[i].ITEM = i;            
  //         }
  //         // this.DGPMP = res;
  //         // this.gridPMP.instance.refresh()
  //         this.loadingVisible = false;
  //         this.addColumn(res);
  //       }
  //     });
  //   };

  // }

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
