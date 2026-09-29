import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxFormModule, DxNumberBoxModule, DxSelectBoxComponent, DxSelectBoxModule } from 'devextreme-angular';
import { Observable, Subject, Subscription } from 'rxjs';
import { CXP200Service } from 'src/app/services/CXP200/s_CXP200.service';
import { clsAdicProveedores, clsCondicionesProv } from '../clsCXP200.class';
import Swal from 'sweetalert2';
import { showToast } from '../../../shared/toast/toastComponent.js';
import notify from 'devextreme/ui/notify';
import DataSource from 'devextreme/data/data_source';
import { CXP20002Component } from '../CXP20002/CXP20002.component';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { BancoscuentasComponent } from 'src/app/shared/bancoscuentas/bancoscuentas.component';

@Component({
  selector: 'CXP20001',
  templateUrl: './CXP20001.component.html',
  styleUrls: ['./CXP20001.component.css'],
  standalone: true,
  imports: [ DxDataGridModule, CommonModule, DxFormModule, DxSelectBoxModule, DxButtonModule,
             DxNumberBoxModule, CXP20002Component, CdkAccordionModule, BancoscuentasComponent
           ]
})

export class CXP20001Component {

  @ViewChild("gridCondProv", { static: false }) gridCondProv: DxDataGridComponent;
  @ViewChild("xs_ID_CONDICION", { static: false }) sboxCondiciones: DxSelectBoxComponent;

  DCondiciones: clsCondicionesProv[] = [];
  FAdicAcreedor: clsAdicProveedores;
  DListaCond: any;
  DListaCondBase: any[] = [];
  esEdicion: boolean = false;
  esInicioDatos: boolean = false;
  esCreacion: boolean = false;
  esInicioObj: any;
  iniEdicion: boolean = false;
  readOnly: boolean = false;
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
  ltool: any;
  itemsAco = ['Cupo','Evaluación','Bancos','Condiciones'];
  accordionExpand: any;
  
  private eventsSubscription: Subscription;
  eventsSubject: Subject<any> = new Subject<any>();
  eventsSubjectProvPro: Subject<any> = new Subject<any>();
  eventsSubjectBancos: Subject<any> = new Subject<any>();

  @Input() events: Observable<any>;

  @Input() dataCondiciones: any;
  @Input() dataProveedoresPro: any;
  @Input() dataBancos: any;

  @Output() dataCondicionesChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() dataProveedoresProChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() dataBancosChange: EventEmitter<any> = new EventEmitter<any>();

  constructor( private _sdatos: CXP200Service ) 
  {

    this.accordionExpand = [true,false,false];
    this.initNewRow = this.initNewRow.bind(this);

  }

  initNewRow(e){
    e.data.ITEM = 0;
    e.data.ID_CONDICION = '';
    e.data.NOMBRE_CONDICION = '';
    this.gridBoxValue = [];
    if (this.DCondiciones.length > 0) {
      const item = this.DCondiciones.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    e.data.isEdit = false;
  }

  insertedRow(e){
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
    this.rowNew = true;
    this.dataCondicionesChange.emit({ CONDICIONES: this.DCondiciones, ADICIONALES: this.FAdicAcreedor });
    // e.component.navigateToRow(e.key);
    // e.component.addRow();
  }

  insertingRow(e) {
    e.data.isEdit = true;
    // Valida datos
    if (e.data.PRODUCTO === ''){
      showToast('Faltan completar datos de la condición', 'warning');
      e.cancel = true;
    }
  }

  updatedRow(e){
    this.rowApplyChanges = false;
    this.rowNew = true;
    this.esVisibleSelecc = 'always';
    this.dataCondicionesChange.emit({ CONDICIONES: this.DCondiciones, ADICIONALES: this.FAdicAcreedor });
  }

  updatingRow(e) {
    if (e.oldData === undefined)
      return;
    e.oldData.isEdit = true;
  }
  onEditingStart(e) {
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
    this.dataCondicionesChange.emit({ CONDICIONES: this.DCondiciones, ADICIONALES: this.FAdicAcreedor });
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
  onRowValidating(e: any) {
    // Valida completitud
    var errMsg = '';
    if (e.newData.ID_CONDICION !== undefined && e.newData.ID_CONDICION == '') 
      errMsg = 'Falta seleccionar el tipo de dirección';
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
  onCellClick(e) {
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
  onSeleccRowCond(e:any, cellInfo:any) {
    if (e.value){
      const cond = this.DListaCondBase.find(c => c.ID_CONDICION === e.value);
      if (cond) {
        cellInfo.data.NOMBRE_CONDICION = cond.DESCRIPCION;
      }
    }
  }

  refreshClick(tipo) {
    this.valoresObjetos('condiciones', { TIPO: 'PROVEEDOR' });
    this.sboxCondiciones.instance._refresh();
    this.sboxCondiciones.instance.close();
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
  onValueChanged(e, campo) {
    switch (campo) {
      case "cupo":
        this.FAdicAcreedor.CUPO_CREDITO = e.value;
        break;
      case "tiempo":
        this.FAdicAcreedor.TIEMPO_ENTREGA = e.value;
        break;
    
      default:
        break;
    }
    this.dataCondicionesChange.emit({ CONDICIONES: this.DCondiciones, ADICIONALES: this.FAdicAcreedor });
  }

  // Recibe los datos del componente de condiciones proveedor
  onRespuestaProvPro(e: any) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;

    if (e !== 'refrescar') {
      this.dataProveedoresProChange.emit(e);
    }
  }

  // Bancos y sus cuentas
  onRespuestaBancos(e: any) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;

    if (e !== 'refrescar') {
      this.dataBancosChange.emit(e);
    }
  }

  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        this.gridCondProv.instance.addRow();
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
        this.gridCondProv.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        break;
      case 'cancel':
        this.gridCondProv.instance.cancelEditData();
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
              const index = this.DCondiciones.findIndex(a => a.ITEM === key);
              this.DCondiciones.splice(index, 1);
            });
            this.gridCondProv.instance.refresh();
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

    if (obj == 'condiciones' || obj == 'todos') {
      opcion = opcion == undefined ? { TIPO: 'PROVEEDOR' } : opcion;
      const prm = opcion;
      this._sdatos
        .consulta('CONDICIONES', prm, "VEN-003")
        .subscribe((data: any) => {
          var res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== "")
            res = [];
            this.DListaCondBase = JSON.parse(JSON.stringify(res));
            this.DListaCond = new DataSource({
              store: JSON.parse(JSON.stringify(res)),  
              paginate: true,
              pageSize: 20
            });
          
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

    if (!accion.match('nuevo|consulta')) {
      this.eventsSubjectProvPro.next({ operacion: accion });
      this.eventsSubjectBancos.next({ operacion: accion });
    }

  }

  ngOnInit(): void { 
    this.FAdicAcreedor = new clsAdicProveedores();
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.operacion) {
        case 'nuevo':
          this.DCondiciones = [];
          this.FAdicAcreedor = new clsAdicProveedores();
          this.eventsSubjectProvPro.next({ operacion: 'nuevo' });
          this.eventsSubjectBancos.next({ operacion: 'nuevo' });
          break;
      
        case 'consulta':
          this.DCondiciones = datos.dataSource.CONDICIONES;
          this.FAdicAcreedor = datos.dataSource.ADICIONALES;
          this.eventsSubjectProvPro.next({ operacion: 'consulta', 
                                           dataSource: datos.dataSource.PROVEEDORES_PRO
                                          });
          this.eventsSubjectBancos.next({ operacion: 'consulta', 
                                           dataSource: datos.dataSource.BANCOS
                                          });
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
