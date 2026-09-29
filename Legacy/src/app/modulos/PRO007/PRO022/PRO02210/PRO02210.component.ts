import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxSelectBoxModule } from 'devextreme-angular';
import { clsUnidadesMedida } from '../clsPRO022.class';
import { Observable, Subscription } from 'rxjs';
import { PRO007Service } from 'src/app/services/PRO007/PRO007.service';
import Swal from 'sweetalert2';
import { CommonModule, formatNumber } from '@angular/common';
import { showToast } from 'src/app/shared/toast/toastComponent';
import { validatorRes } from 'src/app/shared/validator/validator';
import DataSource from 'devextreme/data/data_source';

@Component({
  selector: 'app-PRO02210',
  templateUrl: './PRO02210.component.html',
  styleUrls: ['./PRO02210.component.css'],
  standalone: true,
  imports: [ DxDataGridModule, CommonModule, DxSelectBoxModule, DxButtonModule ]
})
export class PRO02210Component {
  @ViewChild("gridUnidadesMedida", { static: false }) gridUnidadesMedida: DxDataGridComponent;
  
  mnuAccion: string;
	VDatosReg: any;
  keyFila: any;

  DUnidadesMedida: clsUnidadesMedida[] = [];
  DListaUMBase: any[] = [];
  DListaUM: any;
  readOnly: boolean = false;
  readOnlyLlave: boolean = false;
  readOnlyForm: boolean = false;
  esEdicion: boolean = false;
  esInicioDatos: boolean = false;
  esCreacion: boolean = false;
  esInicioObj: any;
  iniEdicion: boolean = false;
  esFacturableDef: boolean = true;
  especAplicacion: any;
  especUsuarioEmail: string = ''; 
  especModoEnvioEmail: string = ''; 
00
  focusedRowIndex: number;
  focusedRowKeyGrupos: string;
  focusedRowKeyContactos: string;
  focusedRowKeyRepresentante: string;
  aceptarButtonOptions: any;
  closeButtonOptions: any;

  DEstados: any[] = ['ACTIVO','INACTIVO'];
  selectActividad: any[] = [];
  treeBoxGrupo: any[] = [];
  perfilButton: any;
  isTreeBoxOpened: boolean;
  focusedRowKey: string;
  dropDownOptions = { width: 600, 
    height: 400, 
    hideOnParentScroll: true,
    container: '#router-container' };

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

  // notificaciones
	type = 'info'
  toaVisible: boolean;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';
  loadingVisible: boolean = false;
  positionOf: string;

  borderStyle: string = "none";
  dropDownOptionsArr: any;
  
  private eventsSubscription: Subscription;

  @Input() events: Observable<any>;

  @Input() visible: boolean;

  @Output() onRespuestaPres = new EventEmitter<any>;

  constructor(
    private _sdatos: PRO007Service
  ) { 

    this.onChangeCBarras =this.onChangeCBarras.bind(this);

  }

  // Activa campos de la forma para edición 
  // dependiendo de la acción a realizar
  activarEdicion(accion) {
    switch (accion) {
      case 'consulta':
      case 'inactivo':
      case 'r_numreg':
      case 'r_cancelar':
        this.esVisibleSelecc = 'none';
        this.esEdicion = false;
        break;
      case 'activo':
      case 'r_nuevo':
      case 'r_modificar':
      case 'r_ini':
        this.esVisibleSelecc = 'always';
        this.esEdicion = true;
        this.rowNew = true;
        break;
    
      default:
        break;
    }
  }

  ngOnInit(): void {
    const user:any = localStorage.getItem("usuario");
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.accion) {
        case 'r_nuevo':
        case 'r_ini':
          this.DUnidadesMedida = [];
          break;
      
        case 'r_numreg':
          this.valoresObjetos('consulta', datos.PRODUCTO);
          break;
      
        case 'r_cancelar':
          this.DUnidadesMedida = JSON.parse(JSON.stringify(this._sdatos.D_Presentacion));
          break;

        default:
          break;
      }
      this.activarEdicion(datos.accion);

      // Inicializa datos
      if (datos.accion.match('r_ini|r_refrescar|r_nuevo|r_modificar'))
        this.valoresObjetos('todos');
    });

  }

  ngAfterViewInit(): void {
    
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  
  onInitNewRow(e) {
    e.data.ITEM = 0;
    e.data.UDM_COMPRA = "";
    e.data.DESC_COMPRA = "";
    e.data.CAN_PRESENTACION = 1;
    e.data.UDM_EQUIV = "";
    e.data.DESC_EQUIV = "";
    e.data.CAN_EQUIV = 1;
    e.data.ESTADO = "ACTIVO";
    e.data.DETALLE = "";
    e.data.CODIGO_ASOCIADO = "";
    e.data.CODIGO_BARRAS = "";
    e.data.CONSEC_BARRAS = 0;
    if (this.DUnidadesMedida.length > 0) {
      const item = this.DUnidadesMedida.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    e.data.isEdit = false;
    this.esNuevaFila = true;

  }

  insertedRow(e){
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
    this.esFacturableDef = true;
    this.esNuevaFila = false;
    this.rowNew = true;
    this.onRespuestaPres.emit({ operacion: 'datos', datos: this.DUnidadesMedida });
  }

  insertingRow(e) {
    e.data.isEdit = true;
    // Valida datos
    if (e.data.UDM_COMPRA === "" || e.data.UDM_EQUIV === '' || 
        e.data.CAN_PRESENTACION === 0 || e.data.CAN_EQUIV === '' 
       ){
      showToast('Faltan datos de Unidades de medida!', 'warning');
      e.cancel = true;
    }
  }

  removedRow(e) {
    this.rowApplyChanges = false;
    this.onRespuestaPres.emit({ operacion: 'datos', datos: this.DUnidadesMedida });
  }
  updatingRow(e) {
    if (e.oldData === undefined)
      return;
    e.oldData.isEdit = true;
  }
  updatedRow(e){
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
    this.esNuevaFila = false;
    this.rowNew = true;
    this.onRespuestaPres.emit({ operacion: 'datos', datos: this.DUnidadesMedida });
  }
  onEditingStart(e) {
    e.data.isEdit = true;
    this.esVisibleSelecc = 'none';
    this.rowApplyChanges = true;
    this.rowNew = false;
    this.rowDelete = false;
  }
  onEditorPreparing(e) {
  }
  onCellPrepared(e) {
  }
  onCellClick(e) {
    this.keyFila = e.key;
  }
  onToolbarPreparingGrid(e: any) {
    let toolbarItems = e.toolbarOptions.items;
    e.toolbarOptions.items.unshift(
      {
        location: 'before'
      }
    );
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
          this.rowNew = true;
          this.rowApplyChanges = false;
        }
      }
    if (e.rowType === "header" && e.rowIndex === 2 && !this.esEdicion) {
      e.rowElement.style.display = "none";
    }
  }

  onRowValidating(e: any) {

    e.promise = new Promise((resolve, reject) => {
      // Valida completitud
      var errMsg = '';
      if (e.newData.UDM_COMPRA === "") 
        errMsg += 'Falta asignar unidad de medida de compra; ';
      if (e.newData.CAN_PRESENTACION === 0) 
        errMsg += 'Falta asignar cantidad de presentación; ';
      if (e.newData.UDM_EQUIV === "") 
        errMsg += 'Falta asignar unidad de medida equivalente; ';
      if (e.newData.CAN_EQUIV === 0) 
        errMsg += 'Falta asignar cantidad equivalente; ';
        if (e.newData.UDM_COMPRA === "") 
        errMsg += 'Falta asignar unidad de medida de compra; ';
      if (e.newData.CODIGO_ASOCIADO === "") 
        errMsg += 'Falta asignar codigo asociado del proveedor; ';
      if (errMsg !== '') {
        this.rowApplyChanges = true;
        e.isValid = false;
        e.errorText = errMsg;
        resolve(false);
        return;
      }

      // Valida si hay repetidos
      const nx = this.DUnidadesMedida.findIndex(p => p.UDM_COMPRA === e.newData.UDM_COMPRA);
      if (nx !== -1) {
        this.rowApplyChanges = true;
        e.isValid = false;
        resolve(false);
        e.errorText = 'Ya existe esta unidad de medida!';
        return;
      }
      else {
        this.rowApplyChanges = false;
        this.rowNew = true;
        e.isValid = true;
        resolve(true);
        return;
      }
    }).then((result) => { 
      if (!result)
        showToast('Error al registrar unidad de medida!','Eror en UM', 'error');
    })  

  }

  onFocusedRowChanged(e){
    const rowData = e.row && e.row.data;
  }
  onEditCanceled(e) {
    e.data.isEdit = true;
    this.esVisibleSelecc = 'none';
    this.rowApplyChanges = true;
    this.rowNew = false;
  }

  setCellValor(rowData: any, value: any, currentRowData: any){
    rowData.VALOR_BASE = value;
  }
  setCellPor(rowData: any, value: any, currentRowData: any){
    rowData.PORCENTAJE = value;
  }
  setNomUM(rowData: any, value: any, currentRowData: any){
    rowData.DESC_COMPRA = value;
  }
  setEstado(rowData: any, value: any, currentRowData: any){
    rowData.PORCENTAJE = value;
  }

  onValueChangedUMCompra(e, cellInfo) {
    cellInfo.data.DESC_COMPRA = "";
    const dum = this.DListaUMBase.find(a => a.ID_UDM == e.value);
    if (dum) {
      // cellInfo.data.DESC_COMPRA = dum.NOMBRE;
      this.gridUnidadesMedida.instance.cellValue(cellInfo.rowIndex, "DESC_COMPRA", dum.NOMBRE);
    }
  }

  onValueChangedUMEquiv(e, cellInfo) {
    cellInfo.data.DESC_EQUIV = "";
    const dum = this.DListaUMBase.find(a => a.ID_UDM == e.value);
    if (dum) {
      // cellInfo.data.DESC_EQUIV = dum.NOMBRE;
      this.gridUnidadesMedida.instance.cellValue(cellInfo.rowIndex, "DESC_EQUIV", dum.NOMBRE);
    }
  }

  // Valida que no exista el codigo de barras
  onChangeCBarras(rowData: any, value: any, currentRowData: any) {

    // Que no esté en los items
    const nx = this.DUnidadesMedida.findIndex(p => p.CODIGO_BARRAS === value);
    if (nx !== -1) {
      showToast('Código de barras repetido!');
      rowData.CODIGO_BARRAS = '';
    }
    else {
      rowData.CODIGO_BARRAS = value;

      // Valida si ya hay otro producto con dicho codigo de barras
      const prm = { CODIGO_BARRAS: value };
      this._sdatos
      .consulta('existe codigo barras', prm, "PRO-022")
      .subscribe((resp) => {
        const res = JSON.parse(resp.data);
        if (res[0].ErrMensaje !== ""){
          showToast(res[0].ErrMensaje);
          rowData.CODIGO_BARRAS = '';
          return;
        } 
      });

  }

  }


  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        this.gridUnidadesMedida.instance.addRow();
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
        this.gridUnidadesMedida.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        this.onRespuestaPres.emit({ operacion: 'datos', datos: this.DUnidadesMedida });
        break;
      case 'cancel':
        this.gridUnidadesMedida.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.esVisibleSelecc = 'always';
        this.rowNew = true;
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
              const index = this.DUnidadesMedida.findIndex(a => a.ITEM === key);
              this.DUnidadesMedida.splice(index, 1);
            });
            this.gridUnidadesMedida.instance.refresh();
            this.onRespuestaPres.emit({ operacion: 'datos', datos: this.DUnidadesMedida });
          }
        });
        break;

      default:
        break;
    }
  }

  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined){

    if (obj === 'um' || obj === 'todos') {
      const prm = { ID_APLICACION: "PRO-022" };
      this._sdatos.consulta('UNIDADES MEDIDA',prm, 'generales').subscribe((data: any)=> {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } 
        else {
          this.DListaUMBase = res;
          this.DListaUM = new DataSource({
            store: res,  
            paginate: true,
            pageSize: 20
          });
        }
      });
    }

    if (obj === 'consulta') {
      const prm = { PRODUCTO: opcion };
      this._sdatos.consulta('PRESENTACION',prm, 'PRO-022').subscribe((data: any)=> {
        const res = validatorRes(data.data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } 
        else {
          if (res[0].UDM_COMPRA) {
            this.DUnidadesMedida = res;
            this._sdatos.D_Presentacion = JSON.parse(JSON.stringify(res));
          }
          else {
            this.DUnidadesMedida = [];
            this._sdatos.D_Presentacion = [];
          }
        }
      });
    }

  }

  showModal(mensaje, titulo = '', html = '') {
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
			title: '¡Error!',
			text: mensaje,
			allowOutsideClick: true,
			allowEscapeKey: false,
			allowEnterKey: false,
			backdrop: true,
			position: 'center',
      html,
			stopKeydownPropagation: false,
		});
	}

}
