import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxSelectBoxComponent, DxSelectBoxModule } from 'devextreme-angular';
import { Observable, Subject, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import notify from 'devextreme/ui/notify';
import { CommonModule } from '@angular/common';
import { showToast } from '../../../shared/toast/toastComponent';
import { clsProProveedores } from '../clsCXP200.class';
import { CXP200Service } from 'src/app/services/CXP200/s_CXP200.service';
import DataSource from 'devextreme/data/data_source';

@Component({
  selector: 'CXP20002',
  templateUrl: './CXP20002.component.html',
  styleUrls: ['./CXP20002.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxDropDownBoxModule, DxDateBoxModule, 
            DxButtonModule, DxSelectBoxModule ]
})
export class CXP20002Component implements OnInit {

  @ViewChild("gridProveedores", { static: false }) gridProveedores: DxDataGridComponent;
  @ViewChild("xs_PRODUCTOS", { static: false }) sboxProductos: DxSelectBoxComponent;

  // Variables fijas de la aplicación
  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = false;
  esEdicion: boolean = false;
  

  // Variables de datos
  DProveedores: clsProProveedores[] = [];
  DProductosLista: any;
  DProductos: any;
  DListaProv: any;
  DTiempo: any;
  DMonedas: any;
  filterProveedor: any = '';
  gridBoxProveedor: any[] = [];
  isGridBoxOpenedProv: boolean;
  focusedRowIndex: number;
  focusedRowKey: string;
  dropDownOptions = { width: 600, height: 350,
                      hideOnParentScroll: true };

  // Operaciones de grid  
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esVisibleSelecc: string = 'none';

  // notificaciones
  toaVisible: boolean;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';

  private eventsSubscription: Subscription;

  @Input() events: Observable<any>;

  @Input() dataProveedoresPro: any;

  @Output() onGuardarCambios: EventEmitter<any> = new EventEmitter<any>;

  constructor(private _sdatos: CXP200Service) 
  { 
  }

  onFocusOutProv(e, cellInfo) {
    if (cellInfo.data){
      cellInfo.data.ID_PROVEEDOR = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onInitNewRow(e) {
    e.data.PRODUCTO = '';
    e.data.NOMBRE = '';
    e.data.REFERENCIA = '';
    e.data.PRECIO = 0;
    e.data.FECHA_NEGOCIADO = new Date();
    e.data.TIEMPO_ENTREGA = 0;
    e.data.PERIODO_ENTREGA = 'Ds';
    e.data.ID_MONEDA = 'COP';
    e.data.ULTIMA_ENTRADA = '';
    if (this.DProveedores.length > 0) {
      const item = this.DProveedores.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.PRODUCTO = '<TODOS>'
      e.data.NOMBRE = 'Todos los productos';
      e.data.ITEM = 1;
    }
    e.data.isEdit = false;
  }
  insertedRow(e) {
    // Copia al servicio
    this.onGuardarCambios.emit(this.DProveedores);
  }
  insertingRow(e) {
    e.data.isEdit = true;
  }
  updatedRow(e) {
    // Copia al servicio
    this.onGuardarCambios.emit(this.DProveedores);
  }
  updatingRow(e) {
    e.data.isEdit = true;
  }
  removedRow(e) {
    // Copia al servicio
    this.onGuardarCambios.emit(this.DProveedores);
  }
  onRowValidating(e: any) {
    // Valida completitud
    if ((e.newData.PRODUCTO === '') || (e.newData.NOMBRE === '')) {
      e.isValid = false;
      this.rowApplyChanges = true;
      showToast('Faltan completar datos del producto', 'warning');
      return;
    }
    this.rowApplyChanges = false;
    this.rowNew = true;
  }
  onEditingStart(e) {
  }
  onRowPrepared(e) {
    if (e.rowType === "data") {
      if (e.data.isEdit) {
				// e.rowElement.style.backgroundColor = 'lightyellow';
				const className:string = e.rowElement.className;
				e.rowElement.className = className +' row-modified-focused';
			}
    }
  }
  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  onToolbarPreparingGrid(e: any) {
    let toolbarItems = e.toolbarOptions.items;
  }

  onUltEntrega(e:any, cellInfo:any) {
    if((e.value === null) || (e.value === '')){
      cellInfo.setValue('');
      return;
    }
    cellInfo.setValue(e.value);
  }
  
  onSeleccRowProducto(e:any, cellInfo:any) {
    if (e.value){
      if ( this.DProveedores.findIndex((d:any) => d.PRODUCTO === e.value) === -1 ) {
        cellInfo.data.PRODUCTO = e.value;
        const dnompro = this.DProductosLista.find((p:any) => p.PRODUCTO === e.value);
        if (dnompro) {
          cellInfo.data.NOMBRE = dnompro.NOMBRE;
          cellInfo.data.REFERENCIA = dnompro.REFERENCIA;
          this.gridProveedores.instance.cellValue(cellInfo.rowIndex, "NOMBRE", cellInfo.data.NOMBRE);
          }
        }

      } else {
        cellInfo.data.PRODUCTO = '';
        showToast('El producto ya fue seleccionado.', 'error');
      }
  }
  refreshClick(objeto) {
    this.valoresObjetos('productos');
    this.sboxProductos.instance._refresh();
    this.sboxProductos.instance.close();
  }

  // Operaciones de grid
  operGrid(e, operacion) {
    // Valida que haya informacion de producto principal
    switch (operacion) {
      case 'new':
        this.gridBoxProveedor = [];
        this.gridProveedores.instance.addRow();
        this.rowApplyChanges = true;
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        break;
      case 'save':
        this.gridProveedores.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        break;
      case 'cancel':
        this.gridProveedores.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        break;
      case 'delete':
        // Elimina filas seleccionadas
        Swal.fire({
          title: '',
          text: '¿Desea eliminar los items seleccionados?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
					confirmButtonColor: '#DF3E3E',
					cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.filasSelecc.forEach((key) => {
              const index = this.DProveedores.findIndex(a => a.ITEM === key);
              this.DProveedores.splice(index, 1);
            });
            this.gridProveedores.instance.refresh();
            this.rowApplyChanges = false;
          }
        });
        break;

      default:
        break;
    }
  }
  
  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string){  

    if (obj == 'productos' || obj == 'todos') {
      const prm = { MODO: 'BASICO' };
      this._sdatos.consulta('PRODUCTOS', prm, 'PRO-022').subscribe((data: any) => {
        var res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        // this.DProductos = res;
        res.push({ PRODUCTO: '<TODOS>', NOMBRE: 'Todos los productos', ID_GRUPO: '', CLASE: ''});
        this.DProductosLista = JSON.parse(JSON.stringify(res));  
        this.DProductos = new DataSource({
          store: res,  
          paginate: true,
          pageSize: 20
        });
      });
    }

    if (obj == 'um tiempo' || obj == 'todos') {
      const prm = { TIPO: 'TIEMPO' };
      this._sdatos.consulta('UNIDADES MEDIDA',prm,'generales').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DTiempo = res;
      });
    }

    if (obj == 'monedas' || obj == 'todos') {
      const prm = { TIPO: '' };
      this._sdatos.consulta('MONEDAS',prm,'generales').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DMonedas = res;
      });
    }
  }
  
  // Activa campos de la forma para edición 
  // dependiendo de la acción a realizar
  activarEdicion(accion) {
    switch (accion) {
      case 'consulta':
        this.readOnly = true;
        this.esEdicion = false;
        break;
      case 'inactivo':
        this.readOnly = true;
        this.esEdicion = false;
        break;
      case 'activo':
      case 'nuevo':
        this.readOnly = false;
        this.esEdicion = true;
        break;
    
      default:
        break;
    }
  }

  ngOnInit(): void {
    this.esEdicion = false;
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.operacion) {
        case 'nuevo':
          this.DProveedores = [];
          break;
      
        case 'consulta':
          this.DProveedores = datos.dataSource;
          break;
          
        default:
          break;
      }
      this.activarEdicion(datos.operacion);
    });
    this.valoresObjetos('todos');

  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.eventsSubscription.unsubscribe();
  }

  showModal(mensaje, titulo = '¡Error!', msg_html= '') {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
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
