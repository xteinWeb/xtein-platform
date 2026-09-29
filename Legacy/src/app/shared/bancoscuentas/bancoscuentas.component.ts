import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxSelectBoxComponent, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { Observable, Subject, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import notify from 'devextreme/ui/notify';
import { CommonModule } from '@angular/common';
import { showToast } from '../toast/toastComponent';
import { CXP200Service } from 'src/app/services/CXP200/s_CXP200.service';
import DataSource from 'devextreme/data/data_source';
import { clsBancos } from './clsBancos.class';
import dxTextBox from 'devextreme/ui/text_box';

@Component({
  selector: 'app-bancoscuentas',
  templateUrl: './bancoscuentas.component.html',
  styleUrls: ['./bancoscuentas.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxDropDownBoxModule, DxDateBoxModule, 
            DxButtonModule, DxSelectBoxModule, DxTextBoxModule ]
})
export class BancoscuentasComponent implements OnInit {

  @ViewChild("gridBancos", { static: false }) gridBancos: DxDataGridComponent;
  @ViewChild("xs_PRODUCTOS", { static: false }) sboxProductos: DxSelectBoxComponent;
  @ViewChild("xs_ID_UBICACION", { static: false }) sboxUbicaciones: DxSelectBoxComponent;

  // Variables fijas de la aplicación
  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = false;
  esEdicion: boolean = false;
  

  // Variables de datos
  DBancos: clsBancos[] = [];
  DListaBancos: any;
  DListaBancosBase: any;
  DEtiquetaBancos: any;
  DUbicaciones: any;
  DUbicacionesBase: any;
  filterBanco: any = '';
  gridBoxBanco: any[] = [];
  isGridBoxOpenedBanco: boolean;
  focusedRowIndex: number;
  focusedRowKey: string;
  dropDownOptions: any =  { width: 600, 
                            height: 350,
                            hideOnParentScroll: true,
                            toolbarItems: [{
                              location: 'before', 
                              toolbar: 'top',
                              template: 'tempEncab'
                            }]
                          };

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

  @Output() onRespuestaSelecc: EventEmitter<any> = new EventEmitter<any>;

  constructor(private _sdatos: CXP200Service) 
  { 
  }

  onFocusOutProv(e, cellInfo) {
    if (cellInfo.data){
      cellInfo.data.ID_PROVEEDOR = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onInitNewRow(e) {
    e.data.ID_BANCO = '';
    e.data.CUENTA_BANCARIA = '';
    e.data.TIPO_CUENTA = '';
    e.data.SALDO = 0;
    e.data.FECHA_CREACION = new Date();
    e.data.TIPO_ASIGNACION = 'Principal';
    e.data.ID_UBICACION = '';
    e.data.NOMBRE_UBICACION = '';
    e.data.ESTADO = 'ACTIVO';
    if (this.DBancos.length > 0) {
      const item = this.DBancos.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    e.data.isEdit = false;
  }
  insertedRow(e) {
    // Copia al servicio
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
    this.rowNew = true;
    e.data.isEdit = false;
    this.onRespuestaSelecc.emit(this.DBancos);
  }
  insertingRow(e) {
    e.data.isEdit = true;
  }
  updatedRow(e) {
    // Copia al servicio
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
    this.rowNew = true;
    e.data.isEdit = false;
    this.onRespuestaSelecc.emit(this.DBancos);
  }
  updatingRow(e) {
    // e.data.isEdit = true;
  }
  removedRow(e) {
    // Copia al servicio
    this.onRespuestaSelecc.emit(this.DBancos);
  }
  onRowValidating(e: any) {
    // Valida completitud
    var errMsg = '';
    if ((e.newData.ID_BANCO === '') || (e.newData.CUENTA_BANCARIA === '')) 
      errMsg = 'Faltan completar datos del banco/cuenta ';
    if (e.newData.TIPO_CUENTA === '') 
      errMsg += 'Faltan definir tipo de cuenta ';
    if (e.newData.TIPO_ASIGNACION === '') 
      errMsg += 'Faltan tipo de asignación';
    if (errMsg !== '') {
      e.isValid = false;
      showToast(errMsg, 'warning');
      this.rowApplyChanges = true;
      this.rowNew = false;
      this.esVisibleSelecc = 'none';
      return;
    }
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

  onFechaCreacion(e:any, cellInfo:any) {
    if((e.value === null) || (e.value === '')){
      cellInfo.setValue('');
      return;
    }
    cellInfo.setValue(e.value);
  }

  onValueChangedCuenta(e, cellInfo) {
    // let input = document.getElementById('inputId') as HTMLInputElement;
    // input.selectionStart = input.selectionStart??0 + 1;
    // input.selectionEnd = input.selectionEnd??0 + 1;
    cellInfo.data.CUENTA_BANCARIA = e.value;
  }
  
  onSeleccRowBanco(e:any, cellInfo:any) {
    if (e.value){
      if ( this.DListaBancosBase.findIndex((d:any) => d.ID_BANCO === e.value) !== -1 ) {
        cellInfo.data.ID_BANCO = e.value;
        const dnom = this.DListaBancosBase.find((p:any) => p.ID_BANCO === e.value);
        if (dnom) {
          cellInfo.data.NOMBRE = dnom.NOMBRE;
          this.gridBancos.instance.cellValue(cellInfo.rowIndex, "NOMBRE", cellInfo.data.NOMBRE);
          }
        }

      } else {
        cellInfo.data.ID_BANCO = '';
        showToast('El producto ya fue seleccionado.', 'error');
      }
  }
  refreshClick(objeto) {
    this.valoresObjetos('bancos');
    this.sboxProductos.instance._refresh();
    this.sboxProductos.instance.close();
  }

  onSeleccRowUbic(e:any, cellInfo:any) {
    if (e.value){
      cellInfo.data.ID_UBICACION = e.value;
      cellInfo.data.NOMBRE_UBICACION = "";
      const dnomciu = this.DUbicacionesBase.find(p => p.ID_UBICACION == e.value);
      if (dnomciu) {
        cellInfo.data.NOMBRE_UBICACION = dnomciu.NOMBRE;
      }
    }
  }

  refreshClickUbic(tipo) {
    this.valoresObjetos('ubicaciones', {TIPO_UBICACION: 'Ciudad' });
    this.sboxUbicaciones.instance._refresh();
    this.sboxUbicaciones.instance.close();
  }

  // Operaciones de grid
  operGrid(e, operacion) {
    // Valida que haya informacion de producto principal
    switch (operacion) {
      case 'new':
        this.gridBoxBanco = [];
        this.gridBancos.instance.addRow();
        this.rowApplyChanges = true;
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        break;
      case 'save':
        this.gridBancos.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        break;
      case 'cancel':
        this.gridBancos.instance.cancelEditData();
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
              const index = this.DBancos.findIndex(a => a.ITEM === key);
              this.DBancos.splice(index, 1);
            });
            this.gridBancos.instance.refresh();
            this.rowApplyChanges = false;
          }
        });
        break;

      default:
        break;
    }
  }
  
  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, opcion: any = undefined){  

    if (obj == 'bancos' || obj == 'todos') {
    
      const prm = { ID_APLICACION : 'FIN-204', USUARIO: localStorage.getItem('usuario'), OPCION: 'lista general'};
      this._sdatos
        .consulta('BANCOS', prm, 'CXP-201')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DListaBancosBase = JSON.parse(JSON.stringify(res));
          this.DListaBancos = new DataSource({
            store: res,  
            paginate: true,
            pageSize: 20
          });
  
        });
    }

    if (obj == 'etiquetas bancos' || obj == 'todos') {
    
      const prm = { ID_DOMINIO : 'BANCOS', 
                    ID_GRUPO_DOMINIO : 'ETIQUETAS', 
                    USUARIO: localStorage.getItem('usuario')};
      this._sdatos
        .consulta('DOMINIOS', prm, 'generales')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DEtiquetaBancos = res.map(b => ({ ID_BANCO: b.VALOR1 }) );
  
        });
    }

    if (obj == 'ubicaciones' || obj == 'todos') {
      const prm = {TIPO_UBICACION: 'Ciudad' };
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

          this.DUbicacionesBase = JSON.parse(JSON.stringify(res));
          this.DUbicaciones = new DataSource({
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
    this.esEdicion = false;
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.operacion) {
        case 'nuevo':
          this.DBancos = [];
          break;
      
        case 'consulta':
          this.DBancos = datos.dataSource;
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

