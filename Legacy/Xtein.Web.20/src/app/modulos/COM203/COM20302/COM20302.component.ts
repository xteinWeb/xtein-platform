import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxDateBoxComponent, DxDateBoxModule, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxTextBoxModule, DxTooltipModule } from 'devextreme-angular';
import { XcSelectboxComponent } from 'src/app/shared/xc-selectbox/xc-selectbox.component';
import { clsMovimientos, clsMovimientosItems } from '../clsCOM203.class';
import { Observable, Subject, Subscription } from 'rxjs';
import { COM203Service } from 'src/app/services/COM203/COM203.service';
import { showToast } from '../../../shared/toast/toastComponent.js';
import Swal from 'sweetalert2';
import { libtools } from 'src/app/shared/common/libtools';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { TabService } from 'src/app/containers/tabs/tab.service';

@Component({
  selector: 'app-COM20302',
  templateUrl: './COM20302.component.html',
  styleUrls: ['./COM20302.component.css'],
  standalone: true,
  imports: [ CommonModule, DxFormModule, XcSelectboxComponent, DxDateBoxModule,
             DxTextBoxModule, DxLoadPanelModule, DxTooltipModule, DxNumberBoxModule
           ]
})
export class COM20302Component {
  @ViewChild("xs_FECHA_ENTREGA", { static: false }) fechaEntrega: DxDateBoxComponent;

  //Variables de datos
  // DEntrada: clsMovimientos;
  DEntradaItems: clsMovimientosItems[] = [];
  DProveedores: any;
  DBodegas: any;
  DMonedas: any;
  DCondiciones: any;
  DPlazos: any;
  DDocumentos: any;
  QFiltro: any;
  sbDocumento: string;
  readOnly: boolean;

  // Objetos
  customValueSbox: boolean = false;
  eventsSubjectSboxProv: Subject<any> = new Subject<any>();
  eventsSubjectSboxBodega: Subject<any> = new Subject<any>();
  eventsSubjectSboxCond: Subject<any> = new Subject<any>();
  eventsSubjectSboxPlazo: Subject<any> = new Subject<any>();
  eventsSubjectSboxMoneda: Subject<any> = new Subject<any>();
  eventsSubjectSboxDoc: Subject<any> = new Subject<any>();
  especMonedaFormato: string = "#,##0.00";
  especAplicacion: any;

  //Notificaciones
  toaVisible: boolean;
  toaMessage: string = 'Registro actualizado!';
  toaTipo: string = 'success';
  loadingVisible: boolean = false;

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
  usuario: string;

  private eventsSubscription: Subscription;
  eventsSubjectSbox: Subject<any> = new Subject<any>();
  popupVisible: boolean = false;
  popUpGrid: any;
  componentSbox: any;

  @Input() events: Observable<any>;

  @Input() visible: boolean;

  @Output() onRespuestaEntrada = new EventEmitter<any>;

  @Input() DMovimientos: clsMovimientos;
  @Output() DMovimientosChange: EventEmitter<clsMovimientos> = new EventEmitter<clsMovimientos>();
  @Output() validarDatos = new EventEmitter<string>();

  constructor(
    private _sdatos: COM203Service,
    private datepipe: DatePipe,
    private _sbarreg: SbarraService,
    private tabService: TabService

  )
    {

      this.ltool = new libtools(this._sbarreg, this.tabService);
      this.onScroll = this.onScroll.bind(this);
      this.valoresDefecto = this.valoresDefecto.bind(this);
      this.disableDates = this.disableDates.bind(this);
      this.onChangeFecha = this.onChangeFecha.bind(this);

    }

  // Si está desplegado objetos, cerrar
  onScroll(e: Event): void {
    const elem = e.target as HTMLElement;
    if (elem.className !== "dx-scrollable-container") {
    }
  }

  fieldDataChanged (e) {
    let updatedField = e.dataField;
    let newValue = e.value;
    // Event handling commands go here
  }

  onSelectionProveedor(e) {
    if (this.readOnly) return;
    if (e !== 'refrescar') {
      const dnomprov = this.DProveedores.find(p => p.ID_PROVEEDOR == e.value);
      if (dnomprov) {
        this.DMovimientos.ID_PROVEEDOR = e.value;
        const cond = dnomprov.ID_CONDICION;
        if (cond.length !== 0) {
          this.DMovimientos.ID_CONDICION = cond[0].ID_CONDICION;
          this.DCondiciones = cond;
          this.DPlazos = cond[0].PLAZO;
          this.DMovimientos.PLAZO = cond[0].PLAZO[0];

          // Cálculo de la fecha de vencimiento -- dias segun la condicion
          // 30 dias por defecto
          let fechav = new Date(this.DMovimientos.FECHA);
          const fconv = fechav.setDate(fechav.getDate()+cond[0].DIASV);
          this.DMovimientos.FECHA_VENCIMIENTO = this.datepipe.transform(fconv, 'MM/dd/yyyy');

          // Activa datos de condiciones
          this.eventsSubjectSboxCond.next({ dataSource: this.DCondiciones,
                                            valueExpr: "ID_CONDICION",
                                            displayExpr: "ID_CONDICION",
                                            columnData: ["ID_CONDICION", "NOMBRE"],
                                            valueData: this.DMovimientos.ID_CONDICION });
          this.eventsSubjectSboxPlazo.next({ dataSource: this.DPlazos,
                                             columnData: [],
                                             style: { width: 200 },
                                             valueData: this.DMovimientos.PLAZO });
          this.enableProductosItems();

        }
        this.DMovimientos.PROVEEDOR = this.DMovimientos.ID_PROVEEDOR+ '; ' + dnomprov.NOMBRE_COMPLETO;
        // this.DMovimientos = { ...this.DMovimientos, ...this.DMovimientos };
        this.DMovimientosChange.emit(this.DMovimientos);
        this.onRespuestaEntrada.emit({ datos: this.DMovimientos });
        // if(this.DMovimientos.ID_CONDICION !== '' && this.DMovimientos.ID_PROVEEDOR !== '' && this.DMovimientos.ID_UN_DESTINO !== '')
        //   this.valoresObjetos('productos');
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

    var ANT_COND = this.DMovimientos.ID_CONDICION;
    if (e.value){
      if(this.DMovimientos.ID_CONDICION != e.value && this.DEntradaItems.length > 0){
        Swal.fire({
          title: '',
          text: 'Está cambiando la Condición '+this.DMovimientos.ID_CONDICION+' por '+e.value+', esto borrará los Productos asociados, ¿Desea Continuar?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, Borrar',
        }).then((result) => {
          if (result.isConfirmed){
            this.DEntradaItems = [];
            this.DMovimientos.ID_CONDICION = e.value;
            // this.DMovimientos = { ...this.DMovimientos, ...this.DMovimientos };
            this.DMovimientosChange.emit(this.DMovimientos);
          }else{
            // this.gridBoxCondicion = [(this.DMovimientos.ID_CONDICION != ANT_COND ? ANT_COND : this.DMovimientos.ID_CONDICION)];
            this.DMovimientos.ID_CONDICION = ANT_COND;
            return;
          }
        });
      }

      // Asigna condicion y plazos asociados
      this.DMovimientos.ID_CONDICION = e.value;
      const dplazos = this.DCondiciones.find(p => p.ID_CONDICION == e.value).PLAZO;
      if (dplazos) {
        this.DPlazos = dplazos;
        if (dplazos.length !== 0) {
          this.DMovimientos.PLAZO = dplazos[0];
          // this.DMovimientos = { ...this.DMovimientos, ...this.DMovimientos };
          this.DMovimientosChange.emit(this.DMovimientos);
        }
        this.eventsSubjectSboxPlazo.next({ dataSource: this.DPlazos,
                                           columnData: [],
                                           style: { width: 200 },
                                           valueData: this.DMovimientos.PLAZO });
      }
      this.enableProductosItems();
    }
  }

  // Recibe los datos del selectbox moneda
  onSelectionMoneda(e: any) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;

    if (e !== 'refrescar') {
      this.DMovimientos.ID_MONEDA = e.value;
      // this.DMovimientos = { ...this.DMovimientos, ...this.DMovimientos };
      this.DMovimientosChange.emit(this.DMovimientos);
      this.enableProductosItems();
    }
    else {
      this.valoresObjetos('monedas');
    }
  }

  onSeleccPlazo(e: any){
    this.DMovimientos.PLAZO = e.value;
    // this.DMovimientos = { ...this.DMovimientos, ...this.DMovimientos };
    this.DMovimientosChange.emit(this.DMovimientos);
    if(this.DMovimientos.PLAZO > 0){
    }
    this.enableProductosItems();
  }

  onValueChangedDes(e: any){
    this.DMovimientos.DETALLE = e.value;
    // this.DMovimientos = { ...this.DMovimientos, ...this.DMovimientos };
    this.DMovimientosChange.emit(this.DMovimientos);
  }

  onValueChangedIdSop(e: any){
    this.DMovimientos.ID_SOPORTE = e.value;
    // this.DMovimientos = { ...this.DMovimientos, ...this.DMovimientos };
    this.DMovimientosChange.emit(this.DMovimientos);
  }

  onValueChangedNumSopRequired(e: any){
    this.DMovimientos.NC_SOPORTE = e.value;
    this.DMovimientosChange.emit(this.DMovimientos);
    // Solo emitir validación si es entrada y orden de compra
    if (this.DMovimientos?.MOVIMIENTO === 'entrada' && this.DMovimientos?.TIPO === 'orden de compra') {
      this.validarDatos.emit('requerido');
    }
  }
  onChangeFecha(e) {
    this.DMovimientos.FECHA_VENCIMIENTO = e.value;
    // this.fechaEntrega.instance._refresh();
    // this.DMovimientos = { ...this.DMovimientos, ...this.DMovimientos };
    this.DMovimientosChange.emit(this.DMovimientos);
  }
  disableDates(args: any) {
    const today = new Date();
    const fhoy = this.datepipe.transform(today, 'MM/dd/yyyy');
    const fcal = this.datepipe.transform(args.date, 'MM/dd/yyyy');
    const ford = this.datepipe.transform(this.DMovimientos.FECHA, 'MM/dd/yyyy');
    const dfhoy = new Date(fhoy!);
    const dfcal = new Date(fcal!);
    const dford = new Date(ford!);
    return dfcal < (dford == undefined ? dfhoy : dford) ;
  }

  onSelectionUN(e) {
    if (e.value) {
      this.DMovimientos.ID_UN_DESTINO = e.value;
      // this.DMovimientos = { ...this.DMovimientos, ...this.DMovimientos };
      this.DMovimientosChange.emit(this.DMovimientos);
      this.onRespuestaEntrada.emit({ datos: this.DMovimientos });
      // this.valoresObjetos('productos');
    }
  }

  enableProductosItems(){
    if( this.DMovimientos.DOCUMENTO == '' ||
        this.DMovimientos.ID_PROVEEDOR == '' ||
        this.DMovimientos.FECHA == '' ||
        this.DMovimientos.ID_UN_DESTINO == '' ||
        this.DMovimientos.TIPO_INVENTARIO == '' ||
        this.DMovimientos.ID_CONDICION == '') {
      this.rowNew = false;
    }else{
      this.rowNew = true;
      if(this.DMovimientos.ID_CONDICION !== '' && this.DMovimientos.ID_PROVEEDOR !== '' && this.DMovimientos.ID_UN_DESTINO !== '')
        this.valoresObjetos('productos');
    }

  }

   // Valores de cargue inicial
   valoresDefecto() {
    if(this.especAplicacion) {
      this.DMovimientos.ID_MONEDA = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'ID_MONEDA_DEF' && e.ID_APLICACION == this.DMovimientos.ID_APLICACION)?.VALOR_DEFECTO ?? '';
      this.especMonedaFormato = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'FORMATO MONEDA' && e.ID_APLICACION == this.DMovimientos.ID_APLICACION)?.FORMATO ?? '#,##0.00';
      this.DMovimientos.TASA_CAMBIO = 1;

    }
  }

  // Cerrar opción de valor libre en los sbox
  activarCustomValueSbox(accion: boolean) {
    this.eventsSubjectSboxMoneda.next({customValue: accion});
    this.eventsSubjectSboxDoc.next({customValue: accion});
    this.eventsSubjectSboxProv.next({customValue: accion});
    this.eventsSubjectSboxBodega.next({customValue: accion});
    this.eventsSubjectSboxCond.next({customValue: accion});
    this.eventsSubjectSboxPlazo.next({customValue: accion});
    this.activarCustomValueSbox(false);
  }


  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined){

    if (obj == 'proveedores' || obj == 'todos') {
      this._sdatos.consulta('proveedores',{ESTADO: 'ACTIVO', CONSULTA: 'compras'},'CXP-200').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DProveedores = res;
        this.eventsSubjectSboxProv.next({ dataSource: this.DProveedores.map(({ID_PROVEEDOR, NOMBRE_COMPLETO, PROVEEDOR}) => ({ID_PROVEEDOR, NOMBRE_COMPLETO, PROVEEDOR})),
                                          valueExpr: "ID_PROVEEDOR",
                                          displayExpr: "PROVEEDOR",
                                          columnData: ["ID_PROVEEDOR","NOMBRE_COMPLETO"],
                                          valueData: this.DMovimientos.ID_PROVEEDOR });
      });
    }

    if (obj == 'un' || obj == 'todos' ) {
      const prm = { MOVIMIENTOS: this.DMovimientos };
      this._sdatos.consulta('UN MOVIMIENTOS', prm, 'COM-203').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DBodegas = res;
        this.eventsSubjectSboxBodega.next({ dataSource: this.DBodegas,
                                            valueExpr: "ID_UN_DESTINO",
                                            displayExpr: "DESTINO",
                                            style: { width: 700, colWidth: [33,33,33] },
                                            columnData: ["ID_UN_DESTINO","DESCRIPCION","NOMBRE_UN"],
                                            valueData: this.DMovimientos.ID_UN_DESTINO });

      });
    }

    if (obj == 'monedas' || obj == 'todos' ) {
      this._sdatos.consulta('MONEDAS',{ESTADO: 'ACTIVO'},'ADM-004').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DMonedas = res;
        this.eventsSubjectSboxMoneda.next({ dataSource: this.DMonedas,
                                            valueExpr: "ID_MONEDA",
                                            displayExpr: "ID_MONEDA",
                                            columnData: ["ID_MONEDA", "DESCRIPCION"],
                                            valueData: this.DMovimientos.ID_MONEDA });

      });
    }

    if (obj == 'condicion' || obj == 'ref') {
      this._sdatos.consulta('CONDICIONES PROVEEDOR',{ID_PROVEEDOR: this.DMovimientos.ID_PROVEEDOR},"COM-204").subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DCondiciones = res;
        this.DPlazos = this.DCondiciones.find(e => e.ID_CONDICION === this.DMovimientos.ID_CONDICION).PLAZO;
        this.eventsSubjectSboxCond.next({ dataSource: this.DCondiciones,
                                          valueExpr: "ID_CONDICION",
                                          displayExpr: "ID_CONDICION",
                                          columnData: ["ID_CONDICION", "NOMBRE"],
                                          valueData: this.DMovimientos.ID_CONDICION });
        this.eventsSubjectSboxPlazo.next({  dataSource: this.DPlazos,
                                            columnData: [],
                                            style: { width: 200 },
                                            valueData: this.DMovimientos.PLAZO });

      });
    }

    if (obj == 'especificaciones' || obj == 'todos' ) {
      this._sdatos.consulta('ESPECIFICACIONES',
                            { ID_APLICACION: "COM-204", USUARIO: this.usuario },
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

  }

  // Activa campos de la forma para edición
  // dependiendo de la acción a realizar
  activarEdicion(accion) {
    switch (accion) {
      case 'consulta':
      case 'inactivo':
        this.esVisibleSelecc = 'none';
        this.readOnly = true;
        break;
      case 'activo':
      case 'nuevo':
        this.esVisibleSelecc = 'always';
        this.readOnly = false;
        break;

      default:
        break;
    }
  }


  ngOnInit(): void {
    // this.DMovimientos = new clsMovimientos();
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.operacion) {
        case 'nuevo':
          this.readOnly = false;
          // this.DMovimientos = { ...this.DMovimientos, ...this.DMovimientos };
          // this.DMovimientos.MOVIMIENTO = datos.MOVIMIENTO;
          // this.DMovimientos.TIPO = datos.TIPO;
          this.especAplicacion = datos.espec;
          this.valoresDefecto();
          break;

        case 'ini':
          this.readOnly = true;
          // this.DMovimientos = new clsMovimientos();
          // this.DMovimientos.MOVIMIENTO = datos.MOVIMIENTO;
          // this.DMovimientos.TIPO = datos.TIPO;
          break;

        case 'consulta':
          // this.valoresObjetos('consulta', datos.documento);
          this.DMovimientos = datos.dataSource;
          this.customValueSbox = true;
          break;

        case 'cargar_datos_recepcion':
          // Procesar datos de recepción para llenar campos de entrada
          if (datos.datos) {
            this.procesarDatosRecepcion(datos.datos, datos.movimiento);
          }
          break;

        default:
          break;
      }
      this.activarEdicion(datos.operacion);

      // Inicializa datos
      this.valoresObjetos('todos');

    });

  }

  ngOnDestroy(){
    if (this.eventsSubscription) this.eventsSubscription.unsubscribe();
  }

  // Procesa los datos de recepción y actualiza los campos del formulario
  procesarDatosRecepcion(datosEntrada: any, movimiento: any) {
    try {
      console.log('Procesando datos de entrada en COM20302:', datosEntrada);

      // Actualizar los campos del movimiento con los datos recibidos
      if (datosEntrada.ID_PROVEEDOR) {
        this.DMovimientos.ID_PROVEEDOR = datosEntrada.ID_PROVEEDOR;
      }

      if (datosEntrada.ID_UN_DESTINO) {
        this.DMovimientos.ID_UN_DESTINO = datosEntrada.ID_UN_DESTINO;
      }

      if (datosEntrada.ID_SOPORTE) {
        this.DMovimientos.ID_SOPORTE = datosEntrada.ID_SOPORTE;
      }

      if (datosEntrada.NC_SOPORTE !== undefined && datosEntrada.NC_SOPORTE !== null) {
        this.DMovimientos.NC_SOPORTE = datosEntrada.NC_SOPORTE;
      }

      if (datosEntrada.ID_CONDICION) {
        this.DMovimientos.ID_CONDICION = datosEntrada.ID_CONDICION;
      }

      if (datosEntrada.DETALLE) {
        this.DMovimientos.DETALLE = datosEntrada.DETALLE;
      }

      // Emitir cambios al componente padre
      this.DMovimientosChange.emit(this.DMovimientos);
      this.onRespuestaEntrada.emit({ datos: this.DMovimientos });

      // Actualizar los selectbox con los valores
      this.actualizarSelectboxes();

      showToast('Datos de entrada actualizados desde recepción', 'success');

    } catch (error) {
      console.error('Error al procesar datos de entrada:', error);
      this.showModal('Error al procesar los datos de entrada', 'Error');
    }
  }

  // Actualiza los selectbox con los valores cargados
  private actualizarSelectboxes() {
    // Refrescar los selectbox para mostrar los valores actualizados
    setTimeout(() => {
      if (this.DMovimientos.ID_PROVEEDOR && this.DProveedores) {
        this.eventsSubjectSboxProv.next({
          valueData: this.DMovimientos.ID_PROVEEDOR
        });
      }

      if (this.DMovimientos.ID_UN_DESTINO && this.DBodegas) {
        this.eventsSubjectSboxBodega.next({
          valueData: this.DMovimientos.ID_UN_DESTINO
        });
      }

      if (this.DMovimientos.ID_CONDICION && this.DCondiciones) {
        this.eventsSubjectSboxCond.next({
          valueData: this.DMovimientos.ID_CONDICION
        });
      }
    }, 500);
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


}
