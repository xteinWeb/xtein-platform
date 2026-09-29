import { Component, OnInit, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule } from 'devextreme-angular';
import { Subject, Subscription } from 'rxjs';
import { PRO007Service } from 'src/app/services/PRO007/PRO007.service';
import Swal from 'sweetalert2';
import { clsProProveedores } from '../clsPRO022.class';
import notify from 'devextreme/ui/notify';
import { CommonModule } from '@angular/common';
import { showToast } from '../../../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-PRO02205',
  templateUrl: './PRO02205.component.html',
  styleUrls: ['./PRO02205.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxDropDownBoxModule, DxDateBoxModule, DxButtonModule]
})
export class PRO02205Component implements OnInit {
  @ViewChild("gridProveedores", { static: false }) gridProveedores: DxDataGridComponent;

  // Variables fijas de la aplicación
  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = false;
  esEdicion: boolean = false;
  

  // Variables de datos
  DProveedores: clsProProveedores[] = [];
  DListaProv: any;
  DTiempo: any;
  DMonedas: any;
  filterProveedor: any = '';
  gridBoxProveedor: any[] = [];
  isGridBoxOpenedProv: boolean;
  focusedRowIndex: number;
  focusedRowKey: string;
  dropDownOptions = { width: 600, height: 350,
                      hideOnParentScroll: true,
                      container: '#gridProveedores' };

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

  constructor(private _sdatos: PRO007Service) 
  { 
    // Recibe de productos
    this.subscription = this._sdatos
    .getObs_Proveedores()
    .subscribe((datprm) => {
      // Ejecuta de acuerdo al parámetro de producto
      this.operCompo(datprm);
    })

    this.opPrepararNuevo = this.opPrepararNuevo.bind(this);

  }

  onFocusOutProv(e, cellInfo) {
    if (cellInfo.data){
      cellInfo.data.ID_PROVEEDOR = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }
  onSeleccRowProv(e:any, cellInfo:any, datacompo:any) {
    if (e.selectedRowKeys.length > 0){
      cellInfo.data.ID_PROVEEDOR = e.selectedRowKeys[0];
      cellInfo.data.NOMBRE = this.DListaProv.find((p:any) => p.ID_PROVEEDOR === cellInfo.data.ID_PROVEEDOR).NOMBRE;
      this.gridProveedores.instance.cellValue(cellInfo.rowIndex, "ID_PROVEEDOR", cellInfo.data.ID_PROVEEDOR);
      this.gridProveedores.instance.cellValue(cellInfo.rowIndex, "NOMBRE", cellInfo.data.NOMBRE);
      datacompo.close();
      this.isGridBoxOpenedProv = false;
      this._sdatos.conCambios = this._sdatos.conCambios + 1;
    } else {
      // this.gridProveedores.instance.cellValue(cellInfo.rowIndex, "ID_PROVEEDOR", '');
      // this.gridProveedores.instance.cellValue(cellInfo.rowIndex, "NOMBRE", '');
      // datacompo.close();
      // this.isGridBoxOpenedProv = false;
    }
  }
  onValueChangedProv(e:any, cellInfo:any) {
    if((e.value !== null) && (e.value !== undefined) && (e.value !== '')) {
      this.filterProveedor = e.value;
      const npos = this.DListaProv.findIndex((p:any) => (p.ID_PROVEEDOR === e.value.toUpperCase()) || (p.NOMBRE === e.value.toUpperCase()));
      if(npos !== -1) {
        cellInfo.data.ID_PROVEEDOR = this.DListaProv[npos].ID_PROVEEDOR;
        cellInfo.data.NOMBRE = this.DListaProv[npos].NOMBRE;
        this.gridProveedores.instance.cellValue(cellInfo.rowIndex, "ID_PROVEEDOR", cellInfo.data.ID_PROVEEDOR);
        this.gridProveedores.instance.cellValue(cellInfo.rowIndex, "NOMBRE", cellInfo.data.NOMBRE);
        this._sdatos.conCambios = this._sdatos.conCambios + 1;
        this.filterProveedor = cellInfo.data.ID_PROVEEDOR;
      } 
    } else {
      this.filterProveedor = '';
      cellInfo.setValue('');
      this.isGridBoxOpenedProv = false;
    }
  }

  // Llama a Acciones del componente
  operCompo(operMenu: any): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.opBlanquearForma();
        if (operMenu.esEdicion !== '' || operMenu.esEdicion !== null || operMenu.esEdicion !== undefined ) this.esEdicion = operMenu.esEdicion;
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.esEdicion = true;
        this.esVisibleSelecc = 'always';
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.mnuAccion = "update";
        this.esEdicion = true;
        this.esVisibleSelecc = 'always';
        this.opPrepararModificar();
        break;

      case "r_guardar":
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case "r_buscar":
        this.opPrepararBuscar('');
        break;

      case "r_buscar_ejec":
        this.opBlanquearForma();
        this.opPrepararBuscar('');
        break;

      case "r_eliminar":
        this.opEliminar();
        break;

      case "r_primero":
      case "r_anterior":
      case "r_siguiente":
      case "r_ultimo":
      case "r_numreg":
        if (operMenu.datos) // Si es solo referescar, no recarga datos
          this.DProveedores = operMenu.datos;
        this.esVisibleSelecc = 'none';
        this.esEdicion = false;
        this.opIrARegistro(operMenu.accion);
        break;

      case "r_cancelar":
        this.esEdicion = false;
        // this.opBlanquearForma();
        break;

      case "r_refrescar":
        this.valoresObjetos('proveedores');
        this.valoresObjetos('um tiempo');
        this.valoresObjetos('monedas');
        break;

      default:
        break;
    }
  }

  opPrepararNuevo() {
    this.esEdicion = true;
    this.gridBoxProveedor = []
    this.opBlanquearForma();
  }
  opPrepararModificar() {
    this.esEdicion = true;
  }
  opPrepararGuardar(accion) {}
  opBlanquearForma() {
    this.DProveedores = [];
    this._sdatos.D_Proveedores = [];
    // this.gridProveedores.instance.refresh();
  }
  opPrepararBuscar(oper) {}
  opEliminar() {}
  opIrARegistro(acc) {
    this.valoresObjetos('productos prov');
  }
  opVista() {}

  onInitNewRow(e) {
    e.data.ID_PROVEEDOR = '';
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
      e.data.ITEM = 1;
    }
    e.data.isEdit = false;
  }
  insertedRow(e) {
    // Copia al servicio
    this._sdatos.D_Proveedores = this.DProveedores;
    this._sdatos.M_esEdicionProv = false;
  }
  insertingRow(e) {
    e.data.isEdit = true;
  }
  updatedRow(e) {
    // Copia al servicio
    this._sdatos.D_Proveedores = this.DProveedores;
    this._sdatos.M_esEdicionProv = false;
  }
  updatingRow(e) {
    e.data.isEdit = true;
  }
  removedRow(e) {
    // Copia al servicio
    this._sdatos.D_Proveedores = this.DProveedores;
  }
  onRowValidating(e: any) {
    // Valida completitud
    if ((e.newData.ID_PROVEEDOR === '') || (e.newData.NOMBRE === '') || (Number(e.newData.PRECIO) === 0)) {
      e.isValid = false;
      this.rowApplyChanges = true;
      showToast('Faltan completar datos del proveedor', 'warning');
      return;
    }
    this.rowApplyChanges = false;
    this.rowNew = true;
  }
  onEditingStart(e) {
    this.gridBoxProveedor = [e.data.ID_PROVEEDOR];
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
    this._sdatos.conCambios = this._sdatos.conCambios + 1;
  }
  

  // Operaciones de grid
  operGrid(e, operacion) {
    // Valida que haya informacion de producto principal
    if (this._sdatos.PRODUCTO === '') {
      this.showModal('No se ha introducido ningún código de producto principal!');
      return;
    }
    switch (operacion) {
      case 'new':
        this.gridBoxProveedor = [];
        this.gridProveedores.instance.addRow();
        this.rowApplyChanges = true;
        this._sdatos.M_esEdicionProv = true;
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this._sdatos.M_esEdicionProv = true;
        break;
      case 'save':
        this.gridProveedores.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        this._sdatos.conCambios = this._sdatos.conCambios + 1;
        break;
      case 'cancel':
        this.gridProveedores.instance.cancelEditData();
        this.rowApplyChanges = false;
        this._sdatos.M_esEdicionProv = false;
        this.rowNew = true;
        this._sdatos.conCambios = this._sdatos.conCambios - 1;
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
            this._sdatos.conCambios = this._sdatos.conCambios + 1;
          }
        });
        break;

      default:
        break;
    }
  }
  
  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string){  
    if (obj == 'proveedores' || obj == 'todos') {
      const prm = { };
      this._sdatos.consulta('PROVEEDORES',prm,'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DListaProv = res;
      });
    }
    if (obj == 'productos prov') {
      const prm = { PRODUCTO: this._sdatos.PRODUCTO };
      this._sdatos.consulta('PRODUCTOS PROVEEDORES',prm,'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje === '')
          this.DProveedores = res;
        else
          this.DProveedores.splice(0,this.DProveedores.length);
        
        // Fecha por defecto
        this.DProveedores.forEach((d:any) => {
          const f = new Date(d.ULTIMA_ENTRADA);
          if (f.getFullYear() === 1900)
            d.ULTIMA_ENTRADA = undefined;
        })
        this._sdatos.D_Proveedores = this.DProveedores;
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
  
  ngOnInit(): void {
    this.esEdicion = false;
    this.valoresObjetos('todos');
    this.operCompo({ accion: this._sdatos.accion });
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
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
