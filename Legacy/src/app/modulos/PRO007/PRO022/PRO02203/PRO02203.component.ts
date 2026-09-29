import { Component, OnInit, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxNumberBoxModule, DxSelectBoxModule, DxTextAreaModule, DxTextBoxModule, DxValidatorComponent, DxValidatorModule } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { PRO007Service } from 'src/app/services/PRO007/PRO007.service';
import Swal from 'sweetalert2';
import { ILista } from '../clsPRO022.class';
import notify from 'devextreme/ui/notify';
import { CommonModule } from '@angular/common';
import { showToast } from '../../../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-PRO02203',
  templateUrl: './PRO02203.component.html',
  styleUrls: ['./PRO02203.component.scss'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxNumberBoxModule, DxDropDownBoxModule, DxValidatorModule, DxTextBoxModule,
            DxTextAreaModule, DxSelectBoxModule, DxButtonModule]
})
export class PRO02203Component implements OnInit {
  @ViewChild("ddValidatorDrop", { static: false }) validDrop: DxValidatorComponent;
  @ViewChild("ddValidatorNum", { static: false }) validNum: DxValidatorComponent;
  @ViewChild("ddValidatorText", { static: false }) validText: DxValidatorComponent;
  @ViewChild("ddValidatorList", { static: false }) validList: DxValidatorComponent;
  @ViewChild("GEspecPro", { static: false }) gridEspec: DxDataGridComponent;

  // Variables fijas de la aplicación
  subscription: Subscription;
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = false;
  esEdicion: boolean = false;
  asignado: boolean = false;
  esEdicionFila: boolean = true;
  rowKey: number = 0;

  // Variables de datos
  DEspecPro: any;
  DGrupos: any;
  DProductos: any;
  filaDatosEspec: any;
  prev_datos: any;
  verBarraOper: boolean = true;

  treeBoxGrupo: any[] = [];
  gridBoxAso: any[] = [];
  isGridBoxOpenedAso: boolean;
  focusedRowIndex: number;
  focusedRowKey: string;
  dropDownOptions = { width: 700, height: 400 };
  dropDownOptionsListBox = { hideOnParentScroll: true,
                             container: '#GEspecPro' };
  lblItem: string;

  IListas: ILista[] = [];

  // notificaciones
  toaVisible: boolean;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';

  constructor(private _sdatos: PRO007Service) 
  { 
    // Recibe de productos
    this.subscription = this._sdatos
      .getObs_ProEspec()
      .subscribe((datprm) => {
        // Ejecuta de acuerdo al parámetro de producto
        this.operCompo(datprm);
      })
    
    this.validarNumero = this.validarNumero.bind(this);
    this.cancelEditData = this.cancelEditData.bind(this);
    
  }

  // Llama a Acciones de registro
  operCompo(operMenu: any): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.opBlanquearForma();
        if (operMenu.esEdicion !== '' || operMenu.esEdicion !== null || operMenu.esEdicion !== undefined ) this.esEdicion = operMenu.esEdicion;
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.readOnly = true;
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.mnuAccion = "update";
        this.readOnly = true;
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
        this.esEdicion = false;
        this.opIrARegistro(operMenu.accion);
        break;

      case "r_cancelar":
        this.esEdicion = false;
        // this.opBlanquearForma();
        break;

      case "r_refrescar":
        this.DGrupos = operMenu.grupos;
        this.valoresObjetos('especificaciones');
        break;

        break;

      default:
        break;
    }
  }

  opPrepararNuevo() {
    this.esEdicion = true;
    this.opBlanquearForma();
  }
  opPrepararModificar() {
    this.esEdicion = true;
  }
  opPrepararGuardar(accion) {}

  opBlanquearForma() {
    if (this.DEspecPro !== undefined) {
      this.DEspecPro.forEach(ele => {
        ele.INFO = '';
      });
      this._sdatos.D_Espec = this.DEspecPro;
    } else {
      this._sdatos.D_Espec = [];
    }
    // this.valoresObjetos('especificaciones');
  }

  opPrepararBuscar(oper) {}
  opEliminar() {}
  opIrARegistro(acc) 
  {
    this.valoresObjetos('especificaciones');
  }
  opVista() {}
  
  onEditingStart(e) { 
    if (e.data.OBJETO === 'Numero') {
      const valor = e.data.INFO;
      e.data.VALOR_INFO = e.data.INFO !== '' ? e.data.INFO.split('|')[0] : '';
      this.gridBoxAso = e.data.INFO !== '' ? e.data.INFO.split('|')[1] : '';
    }
    if (e.data.OBJETO === 'Memo') 
      this.verBarraOper = false;
    else
      this.verBarraOper = true;
    this.filaDatosEspec = e.data;
    this.prev_datos = JSON.parse(JSON.stringify(e.data));
  }
  onRowPrepared(e: any) {
    if(e.rowType === "data") {
      if (e.data.ID_ESPECIFICACION.match('Condiciones de uso y Garantía|Recomendaciones') ) {
        e.rowElement.deleteCell(3);
        e.rowElement.cells[2].colSpan = 2;
      }
    };
  }
  onKeyDownText(e) {
    if(e.event.keyCode == 13) {  
      e.event.stopPropagation();  
    }  
  }
  
  getDatosObj(data) {
    // Busca la data asociada
    const ldatos = this.DEspecPro.filter(f => f.ID === data);
    if (ldatos !== undefined) {
      let datres:any = [];
      if(ldatos[0].DATA)
        datres = [...datres, JSON.parse(ldatos[0].DATA) ];
      return datres;
    }
    else {
      return [];
    }

  }
  onSelectionChangedUM(e, instance) {}
  onSelectionAso(e) {
    if (e.name === 'value') {
      this.isGridBoxOpenedAso = false;
    }
  }

  insertedRow(e) {
    this.esEdicionFila = true;
  }
  updatedRow(e) { }
  removedRow(e) { }
  onRowValidating(e: any) {
    // Valida completitud
    if (this.validDrop) this.validDrop.instance.validate();
    if (this.validList) this.validList.instance.validate();
    if (this.validNum) this.validNum.instance.validate();
    if (this.validText) this.validText.instance.validate();
    const rowval = e.oldData.INFO;
    if (e.oldData.ASOCIADO === '1') {
      if (rowval !== '|' && (rowval.split('|')[0] === '' || rowval.split('|')[1] === '')) {
        e.isValid = false;
        this.toaMessage = 'Faltan completar datos de la unidad de medida!';
        this.toaVisible = true;
        this.toaTipo = 'danger';
        showToast('Faltan completar datos de la unidad de medida', 'error');
        return;
      }
      else {
        // Si hay validación, evalúela
        if (e.oldData.EXP_VALIDACION !== '' && rowval !== '|') {
          if ( !this.validarNumero({ value: rowval.split('|')[0] }))  {
            showToast('Error de validación en el valor', 'error');
          }
          else
            e.isValid = true;
        }
        else
          e.isValid = true;
      }
    }
    else {
      if (rowval === '')
        e.isValid = true;
      else {
        // Si hay validación, evalúela
        if (e.oldData.EXP_VALIDACION !== '') {
          if ( !eval(e.oldData.EXP_VALIDACION) ) {
            showToast('Error de validación en el valor', 'error');
          }
          else
            e.isValid = true;
        }
        else
          e.isValid = true;
      }
    }

    // Copia al servicio
    this._sdatos.D_Espec = this.DEspecPro;
	}

  validarNumero(e) {
    const rowval = this.filaDatosEspec.INFO;
    if (this.filaDatosEspec.EXP_VALIDACION !== '') {
      if ( !eval(this.filaDatosEspec.EXP_VALIDACION) ) 
        return false;
      else
        return true;
    }
    else
      return true;

  }

// Valida datos completos
  updatingRow(e: any) {
    // Copia al servicio
    // this._sdatos.D_Espec = this.DEspecPro;
	}

  onValueChangedUM(e, cellInfo) {
    cellInfo.data.INFO = cellInfo.data.INFO !== '' ? cellInfo.data.INFO.split('|')[0]+'|'+(e.value===null?'':e.value) : '|'+(e.value===null?'':e.value);
    cellInfo.setValue(e.value); 
    this.isGridBoxOpenedAso = false;
  }

  onValueChangedNum(e, cellInfo) {
    cellInfo.data.INFO = cellInfo.data.INFO !== '' ? (e.value===null?'':e.value)+'|'+cellInfo.data.INFO.split('|')[1] : (e.value===null?'':e.value)+'|';
    cellInfo.setValue(e.value);
    // this.gridEspec.instance.cellValue(cellInfo.rowIndex, "VALOR", cellInfo.data.INFO);
  }
  onValueChangedTexto(e, cellInfo) {
    cellInfo.data.INFO = e.value;
    cellInfo.data.VALOR = e.value;
  }
  onValueChangedMemo(e, cellInfo) {
    cellInfo.data.INFO = e.value;
    cellInfo.data.VALOR = e.value;
    cellInfo.setValue(e.value);
  }

  setDatosRow(datos) {
    if (datos)
      return datos !== '' && datos !== '|' ? datos.replace('|',' - ') : '';
    else
      return '';
  }
  
  onSeleccValorLista(e: any, cellInfo: any): void {
    cellInfo.data.INFO = e.value;
    cellInfo.data.VALOR = e.value;
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string){  
    if (obj == 'especificaciones' || obj == 'todos') {
      const prm = { PRODUCTO: this._sdatos.PRODUCTO };
      this._sdatos.consulta('ESPECIFICACIONES BASE',prm, 'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DEspecPro = res;
        this.DEspecPro.forEach(ele => {
          if (ele.DATA) ele.DATA = JSON.parse(ele.DATA);
        });
        if (this._sdatos.accion !== 'r_ini')
          this._sdatos.D_Espec = this.DEspecPro;
      });
    }
  }

  ordenGrupo(rowData) {
    return rowData.ORDEN;
  }
  onCellPrepared(e) {
    if (e.rowType == "data" && e.isEditing) {
      let cellElement = e.cellElement;
      this.gridEspec.instance.editRow(e.rowIndex); 
    }
  }
  cancelEditData(datos) {
    this.gridEspec.instance.cancelEditData();
    this.esEdicionFila = false;
    // Restituye valores anteriores
    datos.data.INFO = this.prev_datos.INFO;
    this._sdatos.conCambios = this._sdatos.conCambios - 1;
  }
  saveEditData(datos) {
    this.gridEspec.instance.saveEditData();
    this.esEdicionFila = false;
    this._sdatos.D_Espec = this.DEspecPro;
    this._sdatos.conCambios = this._sdatos.conCambios + 1;
  }
  cleanEditData(datos) {
    datos.data.INFO = '';
    this.esEdicionFila = false;
    this.gridEspec.instance.saveEditData();
  }
  onContentReady(e) {  
    e.component.columnOption("command:edit", "visible", false);  
  }
  templateHtml(columna): string {
    let cad = "";
    if (columna.row.data.items !== null) {
      cad = cad + (cad !== "" ? " " : "") + columna.row.data.items[0]['CATEGORIA'];
    }
    if (columna.row.data.collapsedItems !== undefined) {
      cad = cad + (cad !== "" ? " " : "") + columna.row.data.collapsedItems[0]['CATEGORIA'];
    }
    return cad;
  }
  startEdit(e) {
    if (this.esEdicion === true) {
      // Valida que haya informacion de producto principal
      if (this._sdatos.PRODUCTO === '') {
        this.showModal('No se ha introducido ningún código de producto principal!');
        return;
      }
      if(e.rowType === "data") {
        e.component.editRow(e.rowIndex);
        this.rowKey = e.key;
        this.esEdicionFila = true;
      }
    }
  }

  ngOnInit(): void {
    // Ini
    this.valoresObjetos('todos');
    this.operCompo({ accion: this._sdatos.accion });
    // this._sdatos.D_Espec = this.DEspecPro;
    this.readOnly = false;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  showModal(mensaje, titulo = 'Error!', msg_html= '') {
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
