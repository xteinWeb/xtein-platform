import { Component, OnInit, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule } from 'devextreme-angular';
import { formatNumber } from 'devextreme/localization';
import { Subscription } from 'rxjs';
import { PRO007Service } from 'src/app/services/PRO007/PRO007.service';
import Swal from 'sweetalert2';
import { clsCubicaje } from '../clsPRO022.class';
import notify from 'devextreme/ui/notify';
import { CommonModule } from '@angular/common';
import { showToast } from '../../../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-PRO02208',
  templateUrl: './PRO02208.component.html',
  styleUrls: ['./PRO02208.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxButtonModule]
})
export class PRO02208Component implements OnInit {
  @ViewChild("gridCubicaje", { static: false }) gridCubicaje: DxDataGridComponent;

  // Variables fijas de la aplicación
  subscription: Subscription;
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = false;
  esEdicion: boolean = false;
  editorProducto: any;

  // Variables de datos
  DCubicaje: clsCubicaje[];
  
  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esVisibleSelecc: string = 'none';
  visibleProducto: boolean = false;

  // notificaciones
  toaVisible: boolean;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';

  constructor(private _sdatos: PRO007Service) {

    // Recibe de productos
    this.subscription = this._sdatos
    .getObs_Cubicaje()
    .subscribe((datprm) => {
      // Ejecuta de acuerdo al parámetro de producto
      this.operCompo(datprm);
    })
    this.editorProducto = {
      itemTemplate: "lookupCodAtr",
      fieldTemplate: "lookupCodAtrField"
    };

    this.onRowValidating = this.onRowValidating.bind(this);
    
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
        this.rowNew = true;
        if (operMenu.verPro !== undefined) // Columna de producto
          this.visibleProducto = operMenu.verPro;
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.mnuAccion = "update";
        this.esEdicion = true;
        this.esVisibleSelecc = 'always';
        if (operMenu.verPro !== undefined) // Columna de producto
          this.visibleProducto = operMenu.verPro;
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
        if (operMenu.datos !== undefined) // Si es solo referescar, no recarga datos
          this.valoresObjetos('cubicaje partes', operMenu.datos);
        else
          this.opIrARegistro(operMenu.accion);
          this.esVisibleSelecc = 'none';

        // this._sdatos.M_esEdicionCubicaje = false;
        // this.esEdicion = false;
        if (operMenu.verPro !== undefined) // Columna de producto
          this.visibleProducto = operMenu.verPro;
          
        this.esEdicion = false;
        break;

      case "r_cancelar":
        this.esEdicion = false;
        // this.opBlanquearForma();
        break;

      case "r_refrescar":
        break;

      default:
        break;
    }
  }

  opPrepararNuevo() {
    this.esEdicion = true;
    this.opBlanquearForma();
  }
  opPrepararModificar() {}
  opPrepararGuardar(accion) {}
  opBlanquearForma() {
    this.DCubicaje = [];
    this._sdatos.D_Cubicaje = [];
    // this.gridCubicaje.instance.refresh();
  }
  opPrepararBuscar(oper) {}
  opEliminar() {}

  opIrARegistro(acc) {
    this.valoresObjetos('cubicajepeso', null)
  }
  opVista() {}

  onInitNewRow(e) {
    if (this.DCubicaje.length > 0) {
      const item = this.DCubicaje.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    e.data.ID_PARTE = '';
    e.data.NOMBRE_PARTE = '';
    e.data.CONCEPTO = '';
    e.data.CANTIDAD = 1;
    e.data.DE_ALTO = 0;
    e.data.DE_LARGO = 0;
    e.data.DE_ANCHO = 0;
    e.data.DE_VOLUMEN = 0;
    e.data.EM_ALTO = 0;
    e.data.EM_LARGO = 0;
    e.data.EM_ANCHO = 0;
    e.data.EM_VOLUMEN = 0;
    e.data.CUBICAJE_NETO = 0;
    e.data.PESO = 0;
    e.data.PESO_TOTAL = 0;
    e.data.isEdit = false;
  }
  insertedRow(e) {
    // Copia al servicio
    this._sdatos.D_Cubicaje = this.DCubicaje;
    this._sdatos.M_esEdicionCubicaje = false;
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
  }
  insertingRow(e) {
    e.data.isEdit = true;
    if (e.data.CANTIDAD !== 0 && e.data.DE_ALTO + e.data.DE_ANCHO + e.data.DE_LARGO !== 0 && e.data.DE_ALTO * e.data.DE_ANCHO * e.data.DE_LARGO === 0) {
      showToast("Hay dimensiones de empaque deben ser diferentes de cero!", 'error');
      e.cancel = true;
    }
    if (e.data.CANTIDAD !== 0 && e.data.EM_ALTO * e.data.EM_ANCHO * e.data.EM_LARGO === 0 && e.data.EM_ALTO + e.data.EM_ANCHO + e.data.EM_LARGO !== 0) {
      showToast("Hay dimensiones de espacio muerto que deben ser diferentes de cero!", 'error');
      e.cancel = true;
    }
  }
  updatedRow(e) {
    // Copia al servicio
    this._sdatos.D_Cubicaje = this.DCubicaje;
    this._sdatos.M_esEdicionCubicaje = false;
    this.rowApplyChanges = false;
  }
  updatingRow(e) {
    e.oldData.isEdit = true;
    let errmsg = '';
    if (e.newData.CANTIDAD !== undefined && e.newData.CANTIDAD === 0) errmsg = 'Cantidad no puede ser cero!';
    if (errmsg === '' && e.newData.DE_ALTO !== undefined && e.newData.DE_ALTO === 0) errmsg = 'Cantidad de Alto del empaque no puede ser cero!';
    if (errmsg === '' && e.newData.DE_ANCHO !== undefined && e.newData.DE_ANCHO === 0) errmsg = 'Cantidad de Ancho del empaque no puede ser cero!';
    if (errmsg === '' && e.newData.DE_LARGO !== undefined && e.newData.DE_LARGO === 0) errmsg = 'Cantidad de Largo del empaque no puede ser cero!';
    if (errmsg !== '') {
      showToast(errmsg, 'error');
      e.cancel = true;
    }
  }
  onRowPrepared(e) {
    if (e.rowType === "data") {
      if (e.data.isEdit)
        // e.rowElement.style.backgroundColor = 'lightyellow';
				// e.rowElement.className = 'row-modified-focused';
        {}
    }
  }
  removedRow(e) {
    // Copia al servicio
    this._sdatos.D_Cubicaje = this.DCubicaje;
  }
  onRowValidating(e: any) {
    // Valida completitud
    if (e.newData.CONCEPTO === '') {
      e.isValid = false;
      showToast('Faltan completar datos del concepto de cubicaje', 'warning');
      return;
    }
  }
  onEditingStart(e) {
    this.rowApplyChanges = true;
  }
  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }
  onCellPrepared(e) {
    if(e.rowType === "header") {
      e.cellElement.style.textAlign = 'center';
      e.cellElement.style.whiteSpace = 'break-spaces';
      e.cellElement.style.wordWrap = 'break-word';
      e.cellElement.style.verticalAlign = 'middle';
    }    
  }

  onToolbarPreparingGrid(e: any) {
    let toolbarItems = e.toolbarOptions.items;
  
    /*e.toolbarOptions.items.unshift(
      {
          location: 'before',
          template: 'titGrid'
      }
    );*/
  }
  customTotCub(e)  {
    return ( 'Unidades de Empaque/Bultos: '+e.value );
  }
  customTotales(e) {
    return ( formatNumber(e.value, "#,##0.00") );
  }
  setCambio_cantidad(rowData: any, value: any, currentRowData: any) {
    rowData.CANTIDAD = value;
    rowData.DE_VOLUMEN = (value * currentRowData.DE_ALTO * currentRowData.DE_LARGO * currentRowData.DE_ANCHO) / 1000000;
    rowData.EM_VOLUMEN = (value * currentRowData.EM_ALTO * currentRowData.EM_LARGO * currentRowData.EM_ANCHO) / 1000000;
    rowData.CUBICAJE_NETO = rowData.DE_VOLUMEN - rowData.EM_VOLUMEN;
    rowData.PESO_TOTAL = value * currentRowData.PESO;
  }
  setCambio_de_alto(rowData: any, value: any, currentRowData: any) {
    rowData.DE_ALTO = value;
    rowData.DE_VOLUMEN = (value * currentRowData.CANTIDAD * currentRowData.DE_LARGO * currentRowData.DE_ANCHO) / 1000000;
    rowData.CUBICAJE_NETO = rowData.DE_VOLUMEN - currentRowData.EM_VOLUMEN;
  }
  setCambio_de_largo(rowData: any, value: any, currentRowData: any) {
    rowData.DE_LARGO = value;
    rowData.DE_VOLUMEN = (value * currentRowData.CANTIDAD * currentRowData.DE_ALTO * currentRowData.DE_ANCHO) / 1000000;
    rowData.CUBICAJE_NETO = rowData.DE_VOLUMEN - currentRowData.EM_VOLUMEN;
  }
  setCambio_de_ancho(rowData: any, value: any, currentRowData: any) {
    rowData.DE_ANCHO = value;
    rowData.DE_VOLUMEN = (value * currentRowData.CANTIDAD * currentRowData.DE_ALTO * currentRowData.DE_LARGO) / 1000000;
    rowData.CUBICAJE_NETO = rowData.DE_VOLUMEN - currentRowData.EM_VOLUMEN;
  }
  setCambio_em_alto(rowData: any, value: any, currentRowData: any) {
    rowData.EM_ALTO = value;
    rowData.EM_VOLUMEN = (value * currentRowData.CANTIDAD * currentRowData.EM_LARGO * currentRowData.EM_ANCHO) / 1000000;
    rowData.CUBICAJE_NETO = currentRowData.DE_VOLUMEN - rowData.EM_VOLUMEN;
  }
  setCambio_em_largo(rowData: any, value: any, currentRowData: any) {
    rowData.EM_LARGO = value;
    rowData.EM_VOLUMEN = (value * currentRowData.CANTIDAD * currentRowData.EM_ALTO * currentRowData.EM_ANCHO) / 1000000;
    rowData.CUBICAJE_NETO = currentRowData.DE_VOLUMEN - rowData.EM_VOLUMEN;
  }
  setCambio_em_ancho(rowData: any, value: any, currentRowData: any) {
    rowData.EM_ANCHO = value;
    rowData.EM_VOLUMEN = (value * currentRowData.CANTIDAD * currentRowData.EM_ALTO * currentRowData.EM_LARGO) / 1000000;
    rowData.CUBICAJE_NETO = currentRowData.DE_VOLUMEN - rowData.EM_VOLUMEN;
  }
  setCambio_peso(rowData: any, value: any, currentRowData: any) {
    rowData.PESO = value;
    rowData.PESO_TOTAL = currentRowData.CANTIDAD * value;
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
        this.gridCubicaje.instance.addRow();
        this.rowApplyChanges = true;
        this._sdatos.M_esEdicionCubicaje = true;
        this.rowDelete = false;
        this.gridCubicaje.instance.deselectAll();
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this.rowDelete = false;
        this.gridCubicaje.instance.deselectAll();
        break;
      case 'save':
        this.gridCubicaje.instance.saveEditData();
        this.rowNew = true;
        this.rowApplyChanges = false;
        this.rowDelete = false;
        this._sdatos.conCambios = this._sdatos.conCambios + 1;
        break;
      case 'cancel':
        this.gridCubicaje.instance.cancelEditData();
        this._sdatos.M_esEdicionCubicaje = false;
        this.rowApplyChanges = false;
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
              const index = this.DCubicaje.findIndex(a => a.ITEM === key);
              this.DCubicaje.splice(index, 1);
            });
            this.gridCubicaje.instance.refresh();
            this._sdatos.conCambios = this._sdatos.conCambios + 1;
          }
        });
        break;

      default:
        break;
    }
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, filtro: any){
    if (obj == 'cubicajepeso' || obj == 'todos') {
      this.DCubicaje = [];
      const prm = { PRODUCTO: this._sdatos.PRODUCTO };
      this._sdatos.consulta('consulta cubicaje',prm,'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DCubicaje = res;
      });
    }

    if (obj == 'cubicaje partes') {
      this.DCubicaje = [];
      const prm = filtro;
      this._sdatos.consulta('cubicaje partes',prm,'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        // Si no hay datos, no es agrupado por partes
        if (this.DCubicaje.length === 0) {
          this.DCubicaje = [...res];
          this.visibleProducto = false;
        } else {
          this.DCubicaje.forEach((ele:any) => {
            const npos = this.DCubicaje.findIndex((d:any) => d.ITEM === ele.ITEM && d.CONCEPTO === ele.CONCEPTO);
            if(npos === -1)
              this.DCubicaje.push(ele);
          });
        }
        this._sdatos.D_Cubicaje = this.DCubicaje;

      });
    }
  }

  ngOnInit(): void {
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
