import { Component, OnInit, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxNumberBoxModule, DxTextBoxModule, DxValidatorModule } from 'devextreme-angular';
import { Subject, Subscription } from 'rxjs';
import { PRO007Service } from 'src/app/services/PRO007/PRO007.service';
import Swal from 'sweetalert2';
import { clsBodegas } from '../clsPRO022.class';
import notify from 'devextreme/ui/notify';
import dxCheckBox from 'devextreme/ui/check_box';
import { CommonModule } from '@angular/common';
import { XcComboGridComponent } from 'src/app/shared/xc-combo-grid/xc-combo-grid.component';
import { showToast } from '../../../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-PRO02207',
  templateUrl: './PRO02207.component.html',
  styleUrls: ['./PRO02207.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxDropDownBoxModule, DxButtonModule, DxNumberBoxModule, XcComboGridComponent, DxTextBoxModule, DxValidatorModule]
})
export class PRO02207Component implements OnInit {

  @ViewChild("gridBodegas", { static: false }) gridBodegas: DxDataGridComponent;

  // Variables fijas de la aplicación
  subscription: Subscription;
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = false;
  esEdicion: boolean = false;
  editorProducto: any;
  
  eventsSubjectComboGrid: Subject<any> = new Subject<any>();

  // Variables de datos
  DBodegas: clsBodegas[] = [];
  DListaBodegas: any[] = [];
  data_prev: any [] = [];

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  filasSelectData: any[] = [];
  esVisibleSelecc: string = 'none';  
  visibleGrupoUN: boolean = true;

  gridBoxProKit: any[] = [];
  isGridBoxOpenedProKit: boolean;
  focusedRowIndex: number;
  focusedRowKey: string;
  dropDownOptions = { width: 700, height: 400 };
  lblItem: string;
  templateGroup: any = ['ID_UN_ASOCIADA'];

  // notificaciones
  toaVisible: boolean;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';

  constructor(private _sdatos: PRO007Service) {

    // Recibe de productos
    this.subscription = this._sdatos
    .getObs_Bodegas()
    .subscribe((datprm) => {
      // Ejecuta de acuerdo al parámetro de producto
      if(datprm.accion !== 'asignar')
        this.operCompo(datprm);
      if(datprm.accion === 'asignar')
        this.asignarBodegas(datprm.bodegas);
    })

    // Recibe de productos
    this.editorProducto = {
      itemTemplate: "lookupCodAtr",
      fieldTemplate: "lookupCodAtrField"
    };

    this.onContentReady = this.onContentReady.bind(this);
    this.onRowValidating = this.onRowValidating.bind(this);
    this.setNomProValue = this.setNomProValue.bind(this);
    
  }

  onContentReady(e:any) {
		e.component.columnOption("command:edit", "visible", false);  
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
          this.DBodegas = operMenu.datos;
        else
          this.opIrARegistro(operMenu.accion);
        this.esVisibleSelecc = 'none';
        this.esEdicion = false;
        // this.gridBodegas.instance.repaint();
        break;

      case "r_refrescar":
        this.valoresObjetos('bodegas');
        break;

      case "r_cancelar":
        this.esEdicion = false;
        this._sdatos.M_esEdicionBodegas = false;
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
    this.data_prev = this.DBodegas;
  }
  opPrepararGuardar(accion) {}
  opBlanquearForma() {
    this.DBodegas = [];
    this._sdatos.D_Bodegas = [];
    this._sdatos.M_esEdicionBodegas = false;
  }
  opPrepararBuscar(oper) {}
  opEliminar() {}

  opIrARegistro(acc) {
    this.valoresObjetos('consulta bodegas')
  }
  opVista() {}

  onInitNewRow(e) {
    e.data.ID_UN_BODEGA = '';
    e.data.DESCRIPCION = '';
    e.data.UBICACION = '';
    if (this.DBodegas.length > 0) {
      const item = this.DBodegas.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    this.gridBoxProKit = [];
    e.data.isEdit = false;
    this._sdatos.M_esEdicionBodegas = true;
  }
  insertedRow(e) {
    // Copia al servicio
    this._sdatos.D_Bodegas = this.DBodegas;
    this._sdatos.M_esEdicionBodegas = true;
    this.rowApplyChanges = false;
  }
  insertingRow(e) {
    e.data.isEdit = true;
  }
  updatedRow(e) {
    // Copia al servicio
    this._sdatos.D_Bodegas = this.DBodegas;
    this._sdatos.M_esEdicionBodegas = true;
    this.rowApplyChanges = false;
  }
  updatingRow(e:any) {
    // e.data.isEdit = true;
  }
  onRowPrepared(e:any) {
    if (e.rowType === "data") {
      if (e.data.isEdit) {
				// e.rowElement.style.backgroundColor = 'lightyellow';
				const className:string = e.rowElement.className;
				e.rowElement.className = className +' row-modified-focused';
			}
    }
  }
  onCellPrepared(e:any) {
    if (e.rowType == "data") {
      if (e.data.IR_BODEGA) {
        const checkBox = e.cellElement.querySelector(".dx-select-checkbox");
        if((checkBox !== null) && (checkBox !== undefined) && (checkBox !== '')) {
          checkBox.style.display = "none";
        }
      }
    }
  }
  removedRow(e:any) {
    // Copia al servicio
    this._sdatos.D_Combos = this.DBodegas;
  }
  onRowValidating(e: any) {
    // Valida completitud
    if(this.mnuAccion === 'new') {
      if (e.newData.ID_UN_BODEGA === '') {
        e.isValid = false;
        showToast('Seleccione las bodegas.', 'warning');
        return;
      }
      if ((e.newData.MAXIMO > 0 && e.newData.MINIMO === 0) || (e.newData.MAXIMO === 0 && e.newData.MINIMO > 0)) {
        e.isValid = false;
        showToast('Las cantidades deben ser mayor que Cero(0).', 'warning');
        return;
      }
      if (e.newData.MAXIMO <= e.newData.MINIMO) {
        e.isValid = false;
        showToast('El Minimo no puede ser Mayor que el Maximo.', 'error');
        return;
      }
    } else if(this.mnuAccion === 'update') {
      for (let prop in e.newData) {
        if (e.newData.hasOwnProperty(prop) && e.oldData.hasOwnProperty(prop)) {
          e.oldData[prop] = e.newData[prop];
        }
      }

      if (e.oldData.ID_UN_BODEGA === '') {
        e.isValid = false;
        showToast('Seleccione las bodegas.', 'warning');
        return;
      } 
      if ((e.newData.MAXIMO > 0 && e.newData.MINIMO === 0) || (e.newData.MAXIMO === 0 && e.newData.MINIMO > 0)) {
        e.isValid = false;
        showToast('Las cantidades deben ser mayor que Cero(0).', 'warning');
        return;
      }
      if (e.newData.MAXIMO <= e.newData.MINIMO) {
        e.isValid = false;
        showToast('El Minimo no puede ser Mayor que el Maximo.', 'error');
        return;
      }
    }
    if (e.isValid) {
      this.rowApplyChanges = false;
      this._sdatos.M_esEdicionBodegas = false;
      this.rowNew = true;
      this._sdatos.conCambios = this._sdatos.conCambios + 1;
    }
  }

  templateHtml(columna:any, element:any): any {
    let cad = [{ ID_UN_ASOCIADAID_UN_ASOCIADA: '', NOMBRE_UN: ''}];
    let res:any='';
    this.templateGroup.forEach((col:any) => {
      if (columna.row.data.items !== null) {
        cad[0].ID_UN_ASOCIADAID_UN_ASOCIADA = columna.row.data.items[0].ID_UN_ASOCIADAID_UN_ASOCIADA;
        cad[0].NOMBRE_UN = columna.row.data.items[0].NOMBRE_UN;
        switch (element) {
          case 'ID_UN_ASOCIADAID_UN_ASOCIADA':
            res = cad[0].ID_UN_ASOCIADAID_UN_ASOCIADA;
            break;
          case 'NOMBRE_UN':
            res = cad[0].NOMBRE_UN;
            break;
          default:
            break;
        }
      }
      if (columna.row.data.collapsedItems !== undefined) {
        cad[0].ID_UN_ASOCIADAID_UN_ASOCIADA = columna.row.data.collapsedItems[0].ID_UN_ASOCIADAID_UN_ASOCIADA;
        cad[0].NOMBRE_UN = columna.row.data.collapsedItems[0].NOMBRE_UN;
        switch (element) {
          case 'ID_UN_ASOCIADAID_UN_ASOCIADA':
            res = cad[0].ID_UN_ASOCIADAID_UN_ASOCIADA;
            break;
          case 'NOMBRE_UN':
            res = cad[0].NOMBRE_UN;
            break;
          default:
            break;
        }
      }
    });
    return res;
  }

  asignarBodegas(e:any) {
    if(e === 'sin bodega')
      this.DBodegas = [];
    if(e === 'todas')
      this.DBodegas = this.DListaBodegas;
    if(e === 'cancelar')
      this._sdatos.M_esEdicionBodegas = false;
    
    this._sdatos.D_Bodegas = this.DBodegas;
  }

  onToolbarPreparingGrid(e: any) {
    let toolbarItems = e.toolbarOptions.items;  
    e.toolbarOptions.items.unshift(
      {
        location: 'before',
        template: 'titGrid'
      }
    );
  }

  // Dropdown 
  onSelectionChangedBod(e:any, cellInfo:any, datacompo:any) {
    if (e.data){
      cellInfo.data.ID_UN_BODEGA = e.data.ID_UN_BODEGA;
      cellInfo.data.DESCRIPCION = e.data.DESCRIPCION;
      cellInfo.row.data.ID_UN_ASOCIADA = e.data.ID_UN_ASOCIADA;
      cellInfo.row.data.NOMBRE_UN = e.data.NOMBRE_UN;
      this.gridBodegas.instance.cellValue(cellInfo.rowIndex, "DESCRIPCION", cellInfo.data.DESCRIPCION);
      datacompo.close();
    }
  } 
  setNomProValue (rowData: any, value: any) {
    const dnom = this.DListaBodegas.find((s: any) => s.ID_UN_BODEGA === value)!;
    if (dnom != undefined) {
      rowData.DESCRIPCION = dnom.DESCRIPCION;
    };
    rowData.ID_UN_BODEGA = value;
  }

  // Recibe los datos de la grid
  onRespuestaSelecc(e: any) {
    if (e.accion === 'aceptar') {
      if (this.DBodegas.length === 0) {
        this.DBodegas = e.rowsSelected;
        for (var i = 0; i < e.rowsSelected.length; i++) {
          this.DBodegas[i].ITEM = i+1;
          this.DBodegas[i].UBICACION = '';
          this.DBodegas[i].MINIMO = 0;
          this.DBodegas[i].MAXIMO = 0;
        }
      } else if (this.DBodegas.length > 0) {
        for (var i = 0; i < e.rowsSelected.length; i++) {
          const pos:any = this.DBodegas.findIndex((d:any) => d.ID_UN_BODEGA === e.rowsSelected[i].ID_UN_BODEGA);
          if (pos === -1) {
            this.DBodegas.push(e.rowsSelected[i]);
            this.DBodegas[this.DBodegas.length - 1].ITEM = i+1;
            this.DBodegas[this.DBodegas.length - 1].UBICACION = '';
            this.DBodegas[this.DBodegas.length - 1].MINIMO = 0;
            this.DBodegas[this.DBodegas.length - 1].MAXIMO = 0;
          }
        }
      }
      this._sdatos.D_Bodegas = this.DBodegas;
      this._sdatos.conCambios = this._sdatos.conCambios + 1;
    }
  }

  onValueChangedMinMax(e:any, MinMax:string, cellInfo:any) {
    if(this.mnuAccion.match('new|update')) {
      if(MinMax === 'minimo') {
        // if(e.value < cellInfo.data.MAXIMO)
          cellInfo.data.MINIMO = e.value;
        // else {
        //   showToast('El Minimo no puede ser Mayor que el Maximo.', 'error');
        //   cellInfo.data.MINIMO = e.previousValue;
        // }
        this.gridBodegas.instance.cellValue(cellInfo.rowIndex, "MINIMO", cellInfo.data.MINIMO);
      }
      if(MinMax === 'maximo') {
        // if(e.value > cellInfo.data.MINIMO)
          cellInfo.data.MAXIMO = e.value;
        // else {
        //   showToast('El Maximo no puede ser menor o igual que el Minimo.', 'error');
        //   cellInfo.data.MAXIMO = e.previousValue;
        // }
        this.gridBodegas.instance.cellValue(cellInfo.rowIndex, "MAXIMO", cellInfo.data.MAXIMO);
      }
      this._sdatos.conCambios = this._sdatos.conCambios + 1;
    }
  }

  onValueChangedUbicacion(e:any, cellInfo:any) {
    if(this.mnuAccion.match('new|update')) {
      cellInfo.data.UBICACION = e.value;
      this.gridBodegas.instance.cellValue(cellInfo.rowIndex, "UBICACION", cellInfo.data.UBICACION);
      this._sdatos.conCambios = this._sdatos.conCambios + 1;
    }
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
        // this.gridBodegas.instance.addRow();
        this._sdatos.M_esEdicionBodegas = true;
        // this.rowApplyChanges = true;
        const dataConfig = [{ dataField : "ID_UN_BODEGA", caption: "Bodega", width: "200" },
                            { dataField : "DESCRIPCION", caption: "Nombre" },
                            { dataField : "ID_UN_ASOCIADA", caption: "UN asociada", groupIndex: "0", 
                              templateGroup: ["ID_UN_ASOCIADA","NOMBRE_UN"] },
                           ];
        this.eventsSubjectComboGrid.next({ dataSource: this.DListaBodegas, 
                                           rowsSelected: this.DBodegas.map(({ID_UN_BODEGA}) => ({ ID_UN_BODEGA })),
                                           keyExpr: ["ID_UN_BODEGA"],
                                           titGrid: "Asociación de Bodegas", 
                                           colsConfig: dataConfig,
                                           modoSelection:"multiple",
                                           container: 'popup' });
        break;

      case 'edit':
				const key:any = this.gridBodegas.instance.getRowIndexByKey(this.filasSelecc[0]);
				this.gridBodegas.instance.editRow(key);
				this.rowApplyChanges = true;
				this.rowEdit = false;
				this.rowNew = false;
				this.rowDelete = false;
        break;

      case 'save':
        this.gridBodegas.instance.saveEditData();
        break;

      case 'cancel':
        this.gridBodegas.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        this._sdatos.M_esEdicionBodegas = false;
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
            this.filasSelectData.forEach((ele:any) => {
              if (!ele.IR_BODEGA) {
                const index = this.DBodegas.findIndex(a => a.ITEM === ele.ITEM);
                this.DBodegas.splice(index, 1);
              }
            });
            this.gridBodegas.instance.refresh();
            this.filasSelecc = [];
            this.filasSelectData = [];
            this.rowDelete = false;
            this._sdatos.D_Bodegas = this.DBodegas;
            this._sdatos.conCambios = this._sdatos.conCambios + 1;
          }
        });
        this._sdatos.M_esEdicionBodegas = false;
        break;

      default:
        break;
    }
  }

  onEditingStart(e:any) {
    
  }
  onSeleccValAtr(e:any) {
  }
  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    this.filasSelectData = e.selectedRowsData;
    if (this.filasSelecc.length > 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
    
    if (this.filasSelecc.length === 1)
      this.rowEdit = true;
    else
      this.rowEdit = false;
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, operacion = ''){
    if (obj == 'bodegas' || obj == 'todos') {
      const prm = { FILTRO: '' };
      this._sdatos.bodegas('BODEGAS',prm,'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        for (let i = 0; i < res.length; i++) {
          res[i].ITEM = i;
        }
        this.DListaBodegas = res;
      });
    }
    if (obj == 'consulta bodegas') {
      const prm = { PRODUCTO: this._sdatos.PRODUCTO };
      this._sdatos.consulta('consulta bodegas',prm,'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DBodegas = res;
        this._sdatos.D_Bodegas = this.DBodegas;
      });
    }
  }
  
  ngOnInit(): void {
    this.valoresObjetos('bodegas');
  }
  ngAfterViewInit() {
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
