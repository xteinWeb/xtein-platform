import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxSelectBoxComponent, 
         DxSelectBoxModule } from 'devextreme-angular';
import { clsDirecciones } from '../clsDirTeInfo.class';
import { DirtelinfoService } from '../dirtelinfo.service';
import { Observable, Subject, Subscription } from 'rxjs';
import { showToast } from '../../toast/toastComponent.js';
import { libtools } from 'src/app/shared/common/libtools';
import Swal from 'sweetalert2';
import DataSource from 'devextreme/data/data_source';

@Component({
  selector: 'app-direcciones',
  templateUrl: './direcciones.component.html',
  styleUrls: ['./direcciones.component.css'],
  standalone: true,
  imports: [ CommonModule, DxDataGridModule, DxSelectBoxModule, DxButtonModule,
             DxDropDownBoxModule
           ]
})
export class DireccionesComponent {

  @ViewChild("gridDirecciones", { static: false }) gridDirecciones: DxDataGridComponent;
  @ViewChild("xs_ID_UBICACION", { static: false }) sboxUbicaciones: DxSelectBoxComponent;

  DDirecciones: clsDirecciones[] = [];
  DTiposDir: any[] = [];
  DUbicacionesBase: any[] = [];
  DUbicaciones: any = [];
  DBarriosBase: any[] = [];
  DBarrios: any = [];
  DDependientesBase: any[] = [];
  DDependientes: any = [];
  DCodigosPostales: any = [];
  Ciudad: string;
  Barrio: string;
  Dependiente: string;
  esEdicion: boolean = false;
  esInicioDatos: boolean = false;
  esCreacion: boolean = false;
  esInicioObj: any;
  iniEdicion: boolean = false;
  focusedRowIndex: number;
  focusedRowKey: string;
  gridBoxValue: string[] = [];
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

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esNuevaFila: boolean = false;
  esVisibleSelecc: string = 'none';
  numeroFila: number;
  ltool: any;

  private eventsSubscription: Subscription;
  eventsSubject: Subject<any> = new Subject<any>();

  @Input() events: Observable<any>;

  @Output() onGuardarCambios: EventEmitter<any> = new EventEmitter<any>;

  constructor( private _sdatos: DirtelinfoService ) 
  {

    this.onSeleccRowUbic = this.onSeleccRowUbic.bind(this);
    this.initNewRow = this.initNewRow.bind(this);

  }

  initNewRow(e){
    e.data.ID_DIRECCION = 0;
    e.data.TIPO_DIRECCION = '';
    e.data.TIPO_NOMENCLATURA = '';
    e.data.NOMENCLATURA = "";
    e.data.NUMERO1 = "";
    e.data.NUMERO2 = "";
    e.data.DOMICILIO = "";
    e.data.BARRIO = "";
    e.data.DEPENDIENTE = "";
    e.data.REFERENCIA = "";
    e.data.ID_UBICACION = "";
    e.data.CODIGO_POSTAL = "";
    e.data.NOMBRE_UBICACION = "";
    this.gridBoxValue = [];
    if (this.DDirecciones.length > 0) {
      const item = this.DDirecciones.reduce((ant, act)=>{return (ant.ID_DIRECCION > act.ID_DIRECCION) ? ant : act}) 
      e.data.ID_DIRECCION = item.ID_DIRECCION + 1;
    }
    else {
      e.data.ID_DIRECCION = 1;
    }
    e.data.isEdit = true;
    this.numeroFila = e.data.ITEM;
  }

  insertedRow(e){
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
    this.rowNew = true;
    e.data.isEdit = false;
    this.onGuardarCambios.emit(this.DDirecciones);
    // e.component.navigateToRow(e.key);
    // e.component.addRow();
  }

  insertingRow(e) {
    e.data.isEdit = true;
    // Valida datos
    if (e.data.PRODUCTO === ''){
      showToast('Faltan completar datos del Producto', 'warning');
      e.cancel = true;
    }
  }

  updatedRow(e){
    this.rowApplyChanges = false;
    this.rowNew = true;
    this.esVisibleSelecc = 'always';
    e.data.isEdit = false;
    this.onGuardarCambios.emit(this.DDirecciones);
  }

  updatingRow(e) {
    if (e.oldData === undefined)
      return;
    e.oldData.isEdit = true;
  }
  onEditingStart(e) {
    // if (this.numeroFila === e.data.ITEM) {
    //   this.esVisibleSelecc = 'none';
    //   this.rowApplyChanges = true;
    //   this.rowNew = false;
    //   e.data.isEdit = true;
    // }
  }
  onCellClick(e) {
    this.numeroFila = e.data.ITEM;
    this.esVisibleSelecc = 'none';
    this.rowApplyChanges = true;
    this.rowNew = false;
    e.data.isEdit = true;
  }
  onEditorPreparing(e) {
  }
  onCellPrepared(e) {
  }
  onToolbarPreparingGrid(e: any) {
    let toolbarItems = e.toolbarOptions.items;
    e.toolbarOptions.items.unshift(
      {
        location: 'before'
      }
    );
  }
  removedRow(e) {
    this.rowApplyChanges = false;
    this.onGuardarCambios.emit(this.DDirecciones);
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
          // this.esVisibleSelecc = 'always';
          // e.data.isEdit = false;
        }
      }
    if (e.rowType === "header" && e.rowIndex === 2 && !this.esEdicion) {
      e.rowElement.style.display = "none";
    }
  }
  onRowValidating(e: any) {
    // Valida completitud
    var errMsg = '';
    if (e.newData.TIPO_DIRECCION !== undefined && e.newData.TIPO_DIRECCION == '') 
      errMsg = 'Falta seleccionar el tipo de dirección';
    if (e.newData.DOMICILIO !== undefined && e.newData.DOMICILIO == "") 
      errMsg = 'Falta asignar una dirección o domicilio';
    if (e.newData.ID_UBICACION !== undefined && e.newData.ID_UBICACION == "") 
      errMsg = 'Falta asignar Ciudad o municipio ';
    if (errMsg !== '') {
      e.isValid = false;
      showToast(errMsg, 'warning');
      this.rowApplyChanges = true;
      this.rowNew = false;
      this.esVisibleSelecc = 'none';
      return;
    }
  }
  onFocusedRowChanged(e){
    this.valoresObjetos('ubicaciones',{TIPO_UBICACION: 'Barrio', CIUDAD: e.row.data.ID_UBICACION });
    this.valoresObjetos('codigos postales', e.row.data.ID_UBICACION );
  }

  onEditCanceled(e) {
    this.esVisibleSelecc = 'always';
    this.rowApplyChanges = false;
    this.rowNew = true;
  }
  onCellHoverChanged(e) {
  }
  onContentReady(e) {  
    e.component.columnOption("command:edit", "visible", false);  
  }

  onSeleccTipoDir(e:any, cellInfo:any) {
    if (e.value){
      cellInfo.data.TIPO_DIRECCION = e.value;
    }
  }
  onOpenedUbic(e) {
  }
  onSeleccRowUbic(e:any, cellInfo:any, tipo: any) {
    if (e.value){
      switch (tipo) {
        case 'ciudad':
          cellInfo.data.ID_UBICACION = e.value;
          cellInfo.data.NOMBRE_UBICACION = "";
          this.Ciudad = e.value;
          this.valoresObjetos('ubicaciones',{TIPO_UBICACION: 'Barrio', CIUDAD: e.value });
          this.valoresObjetos('codigos postales', e.value );
          const dnomciu = this.DUbicacionesBase.find(p => p.ID_UBICACION == e.value);
          if (dnomciu) {
            cellInfo.data.NOMBRE_UBICACION = dnomciu.NOMBRE;
          }
          break;
      
        case 'barrio':
          cellInfo.data.BARRIO = e.value;
          this.Barrio = e.value;
          this.valoresObjetos('ubicaciones',{TIPO_UBICACION: 'Dependiente', CIUDAD: this.Ciudad, BARRIO: e.value });
          break;
      
        case 'dependiente':
          cellInfo.data.DEPENDIENTE = e.value;
          this.Dependiente = e.value;
          break;
      
        case 'dependiente':
          cellInfo.data.DEPENDIENTE = e.value;
          this.Dependiente = e.value;
          break;
      
        case 'codigo_postal':
          cellInfo.data.CODIGO_POSTAL = e.value;
          break;
      
        default:
          break;
      }
    }
  }

  refreshClickUbic(tipo) {
    this.valoresObjetos('ubicaciones', {TIPO_UBICACION: tipo, CIUDAD: this.Ciudad, BARRIO: this.Barrio });
    this.sboxUbicaciones.instance._refresh();
    this.sboxUbicaciones.instance.close();
  }

  // Cambios en tipo dir
  onValueTipoDir(e:any) {
    if ((e.value !== null) && (e.value !== undefined) && (e.value !== '')) {
      
    }
  }
  onSelectionTipoDir(e, cellInfo) {
    if (e.selectedRowKeys.length === 0) return;
    cellInfo.setValue(e.selectedRowKeys.map(t => t.TIPO));
  }
  setCellValueDir(rowData: any, value: any, currentRowData: any){
    rowData.TIPO_DIRECCION = value;
  }

  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        this.gridDirecciones.instance.addRow();
        this.rowApplyChanges = true;
        this.rowNew = false;
        this.esVisibleSelecc = 'none';
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this.esVisibleSelecc = 'none';
        break;
      case 'save':
        this.gridDirecciones.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        break;
      case 'cancel':
        this.gridDirecciones.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
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
              const index = this.DDirecciones.findIndex(a => a.ID_DIRECCION === key);
              this.DDirecciones.splice(index, 1);
            });
            this.gridDirecciones.instance.refresh();
            this.rowApplyChanges = false;
            this.rowNew = true;
            this.esVisibleSelecc = 'always';
          }
        });
        break;

      default:
        break;
    }
  }

  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined) {

    if (obj == 'ubicaciones' || obj == 'todos') {
      opcion = opcion == undefined ? {TIPO_UBICACION: 'Ciudad' } : opcion;
      const prm = opcion;
      this._sdatos
        .consulta('ubicaciones', prm, "ADM-006")
        .subscribe((data: any) => {
          var res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== "")
            res = [];

          switch (opcion.TIPO_UBICACION) {
            case "Ciudad":
              this.DUbicacionesBase = JSON.parse(JSON.stringify(res));
              this.DUbicaciones = new DataSource({
                store: JSON.parse(JSON.stringify(res)),  
                paginate: true,
                pageSize: 20
              });
              break;
            case "Barrio":
              this.DBarriosBase = JSON.parse(JSON.stringify(res));
              this.DBarrios = new DataSource({
                store: JSON.parse(JSON.stringify(res)),  
                paginate: true,
                pageSize: 20
              });
              break;
            case "Dependiente":
              this.DDependientesBase = JSON.parse(JSON.stringify(res));;
              this.DDependientes = new DataSource({
                store: JSON.parse(JSON.stringify(res)),  
                paginate: true,
                pageSize: 20
              });
              break;
            default:
              break;
          }
            
        });
    }

    if (obj == 'tipos direccion' || obj == 'todos') {
      const prm = { };
      this._sdatos
        .consulta('tipos direccion', prm, "ADM-006")
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DTiposDir = res;
        });
    }

    if (obj == 'codigos postales' || obj == 'todos') {
      const prm = { ID_UBICACION : opcion };
      this._sdatos
        .consulta('codigos postales', prm, "ADM-006")
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DCodigosPostales = res;
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
        this.esEdicion = false;
        break;
      case 'activo':
      case 'nuevo':
        this.esVisibleSelecc = 'always';
        this.esEdicion = true;
        break;
    
      default:
        break;
    }
  }

  ngOnInit(): void { 
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.operacion) {
        case 'nuevo':
          this.DDirecciones = [];
          break;
      
        case 'consulta':
          this.DDirecciones = datos.dataSource;
          break;

        default:
          break;
      }
      this.activarEdicion(datos.operacion);
    });

    this.valoresObjetos('todos');

  }
  ngAfterViewInit(): void {   

  }
  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
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
			stopKeydownPropagation: false,
		});
	}


}
