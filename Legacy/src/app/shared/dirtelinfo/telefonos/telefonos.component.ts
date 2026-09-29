import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule } from 'devextreme-angular';
import { clsTelefonos } from '../clsDirTeInfo.class';
import { Observable, Subject, Subscription } from 'rxjs';
import { DirtelinfoService } from '../dirtelinfo.service';
import Swal from 'sweetalert2';
import { showToast } from '../../toast/toastComponent.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-telefonos',
  templateUrl: './telefonos.component.html',
  styleUrls: ['./telefonos.component.css'],
  standalone: true,
  imports: [ DxDataGridModule, DxDropDownBoxModule, DxButtonModule, CommonModule ]
})
export class TelefonosComponent {

  @ViewChild("gridTelefonos", { static: false }) gridTelefonos: DxDataGridComponent;

  DTelefonos: clsTelefonos[] = [];
  DTiposTel: any[] = [];
  esEdicion: boolean = false;
  esVisibleSelecc: string = 'none';
  gridBoxValue: string[] = [];
  
  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esNuevaFila: boolean = false;
  numeroFila: number;

  @Input() events: Observable<any>;

  @Output() onGuardarCambios: EventEmitter<any> = new EventEmitter<any>;

  private eventsSubscription: Subscription;
  eventsSubject: Subject<any> = new Subject<any>();

  constructor( private _sdatos: DirtelinfoService ) {}

  initNewRow(e){
    e.data.ID_TELEFONO = 0;
    e.data.ID_TELEFONO = 0;
    e.data.TIPO_TELEFONO = '';
    e.data.TELEFONO = '';
    e.data.EXTENSION = "";
    if (this.DTelefonos.length > 0) {
      const item = this.DTelefonos.reduce((ant, act)=>{return (ant.ID_TELEFONO > act.ID_TELEFONO) ? ant : act}) 
      e.data.ID_TELEFONO = item.ID_TELEFONO + 1;
    }
    else {
      e.data.ID_TELEFONO = 1;
    }
    e.data.isEdit = false;
    this.numeroFila = e.data.ITEM;
  }

  insertedRow(e){
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
    this.rowNew = true;
    this.onGuardarCambios.emit(this.DTelefonos);
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
    this.esVisibleSelecc = 'always';
    this.rowNew = true;
    this.onGuardarCambios.emit(this.DTelefonos);
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
    this.onGuardarCambios.emit(this.DTelefonos);
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
    if (e.newData.TIPO_TELEFONO !== undefined && e.newData.TIPO_TELEFONO == '') 
      errMsg = 'Falta seleccionar el tipo de teléfono';
    if (e.newData.TELEFONO !== undefined && e.newData.TELEFONO == "") 
      errMsg = 'Falta asignar un número de teléfono';
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
  }

  onEditCanceled(e) {
    this.esVisibleSelecc = 'always';
    this.rowApplyChanges = false;
    this.rowNew = true;
}
  onCellHoverChanged(e) {
  }

  onSeleccTipoDir(e:any, cellInfo:any) {
    if (e.value){
      cellInfo.data.TIPO_DIRECCION = e.value;
    }
  }
  onOpenedUbic(e) {
  }
  onSeleccRowUbic(e:any, cellInfo:any) {
    if (e.value){
      cellInfo.data.ID_UBICACION = e.value;
    }
  }
  onSelectionTipoTel(e, cellInfo) {
    if (e.selectedRowKeys.length === 0) return;
    cellInfo.setValue(e.selectedRowKeys.map(t => t.TIPO));
  }

  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        this.gridTelefonos.instance.addRow();
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
        this.gridTelefonos.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        break;
      case 'cancel':
        this.gridTelefonos.instance.cancelEditData();
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
              const index = this.DTelefonos.findIndex(a => a.ID_TELEFONO === key);
              this.DTelefonos.splice(index, 1);
            });
            this.gridTelefonos.instance.refresh();
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

    if (obj == 'tipos telefono' || obj == 'todos') {
      const prm = { };
      this._sdatos
        .consulta('tipos direccion', prm, "ADM-006")
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DTiposTel = res;
        });
    }

  }

  // Activa campos de la forma para edición 
  // dependiendo de la acción a realizar
  activarEdicion(accion) {
    switch (accion) {
      case 'consulta':
      case 'inactivo':
        this.esEdicion = false;
        break;
      case 'activo':
      case 'nuevo':
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
          this.DTelefonos = [];
          break;
      
        case 'consulta':
          this.DTelefonos = datos.dataSource;
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
