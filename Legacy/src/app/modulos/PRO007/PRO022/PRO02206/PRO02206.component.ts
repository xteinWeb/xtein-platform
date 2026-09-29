import { Component, OnInit, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxLoadPanelModule, DxSelectBoxModule } from 'devextreme-angular';
import { Subject, Subscription } from 'rxjs';
import { PRO007Service } from 'src/app/services/PRO007/PRO007.service';
import Swal from 'sweetalert2';
import { clsCombos, clsProductos } from '../clsPRO022.class';
import notify from 'devextreme/ui/notify';
import { CommonModule } from '@angular/common';
import { showToast } from '../../../../shared/toast/toastComponent.js'
import DataSource from 'devextreme/data/data_source';

@Component({
  selector: 'app-PRO02206',
  templateUrl: './PRO02206.component.html',
  styleUrls: ['./PRO02206.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxDropDownBoxModule, DxButtonModule, DxSelectBoxModule, DxLoadPanelModule]
})
export class PRO02206Component implements OnInit {
  @ViewChild("gridCombos", { static: false }) gridCombos: DxDataGridComponent;
  @ViewChild("GListaProKit", { static: false }) GListaProKit: DxDataGridComponent;

  // Variables fijas de la aplicación
  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = false;
  esEdicion: boolean = false;
  loadingVisible: boolean = false;
  editorProducto: any;

  // Variables de datos
  DCombos: clsCombos[];
  DListaProductos: clsProductos[];

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  DUDM_PRES: any = [];
  esVisibleSelecc: string = 'none';

  gridBoxProKit: any[] = [];
  isGridBoxOpenedProKit: boolean;
  focusedRowIndex: number;
  focusedRowKey: string;
  dropDownOptions = { width: 700, height: 400 };
  lblItem: string;

  // notificaciones
  toaVisible: boolean;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';

  constructor(private _sdatos: PRO007Service) {

    // Recibe de productos
    this.editorProducto = {
      itemTemplate: "lookupCodAtr",
      fieldTemplate: "lookupCodAtrField"
    };

    this.subscription = this._sdatos
    .getObs_Combos()
    .subscribe((datprm) => {
      // Verifica si ya tiene una operación activa
      this.operCompo(datprm);
    })

    this.onRowValidating = this.onRowValidating.bind(this);
    this.setNomProValue = this.setNomProValue.bind(this);
    this.valoresObjetos = this.valoresObjetos.bind(this);
    
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
          this.DCombos = operMenu.datos;
        else
          this.DCombos = [];
        this.esVisibleSelecc = 'none';
        this.esEdicion = false;
        this.gridCombos.instance.repaint();

        if (this.DCombos.length > 0) {
          var latr: any[] = [];
          for (let k=0; k < this.DCombos.length; k++) {
            latr.push(this.DCombos[k].PRODUCTO_KIT);
          }
          const prm: any = {TIPO:'PARTE', DATOS: latr};
          this._sdatos.setObs_ProAtributos({ accion: 'r_numreg', datos: prm, verPro: true, oper_edicion: false, modo: 'consulta', operacion: 'new', clase: 'COMBO' });
        }
        break;

      case "r_refrescar":
        this.valoresObjetos('productos', '');
        break;

      case "r_cancelar":
        this.esEdicion = false;
        // this.opBlanquearForma();
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
    this.DCombos = [];
    // this.DListaProductos = [];
    this.gridBoxProKit = [];
    this._sdatos.D_Combos = [];
    // this.gridCombos.instance.refresh();
  }
  opPrepararBuscar(oper) {}
  opEliminar() {}
  opIrARegistro(acc) {}
  opVista() {}

  onInitNewRow(e:any) {
    e.data.PRODUCTO_KIT = '';
    e.data.NOMBRE = '';
    e.data.UDM_PRES = '';
    e.data.CANTIDAD = 1;
    if (this.DCombos.length > 0) {
      const item = this.DCombos.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    this.gridBoxProKit = [];
    e.data.isEdit = false;
  }
  insertedRow(e:any) {
    // Copia al servicio
    this._sdatos.D_Combos = this.DCombos;
    this._sdatos.M_esEdicionCombo = false;

    // Actualiza los atributos del producto, agrupándolos por tipo de atributo
    var latr: any[] = [];
    for (let k=0; k < this.DCombos.length; k++) {
      latr.push(this.DCombos[k].PRODUCTO_KIT);
    }
    const prm: any = {TIPO:'PARTE', DATOS: latr};
    this._sdatos.setObs_ProAtributos({ accion: 'r_numreg', datos: prm, verPro: true, oper_edicion: false, modo: 'agregar parte', operacion: 'new', clase: 'COMBO' });

  }
  insertingRow(e:any) {
    e.data.isEdit = true;
  }
  updatedRow(e:any) {
    // Copia al servicio
    this._sdatos.D_Combos = this.DCombos;
    this._sdatos.M_esEdicionCombo = false;
  }
  updatingRow(e:any) {
    e.data.isEdit = true;
    // Actualiza los atributos del producto, agrupándolos por tipo de atributo
    var latr: any[] = [];
    for (let k=0; k < this.DCombos.length; k++) {
      latr.push(this.DCombos[k].PRODUCTO_KIT);
    }
    const prm: any = {TIPO:'PARTE', DATOS: latr};
    this._sdatos.setObs_ProAtributos({ accion: 'r_numreg', datos: prm, verPro: true, oper_edicion: false, modo: 'agregar parte', operacion: 'update', clase: 'COMBO' });
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
  removedRow(e:any) {
    // Copia al servicio
    this._sdatos.D_Combos = this.DCombos;
  }
  onRowValidating(e: any) {
    // Valida completitud
    if (e.newData.PRODUCTO_KIT === '' || e.newData.CANTIDAD === 0) {
      e.isValid = false;
      this.toaMessage = 'Faltan completar datos de productos del combo';
      this.toaVisible = true;
      this.toaTipo = 'warning';
      showToast('Faltan completar datos de productos del combo', 'warning');
      return;
    } else {
      e.isValid = true;
      this.rowApplyChanges = false;
    }
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

  // Dropdown productos
  onFocusOutProKit(e:any, cellInfo:any) {
    if (cellInfo.data){
      cellInfo.data.PRODUCTO_KIT = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
      // Valida parte
      if (!this.validaProductoKit(cellInfo.data.PRODUCTO_KIT, cellInfo.key))
        e.component.focus();
      
    }
  }
  onSeleccRowProKit(e:any, cellInfo:any) {
    if (e.data) {
      cellInfo.data.PRODUCTO_KIT = e.data.PRODUCTO;
      cellInfo.data.NOMBRE = this.DListaProductos.find(p => p.PRODUCTO === cellInfo.data.PRODUCTO_KIT)?.NOMBRE;
    }
  }
  onSelectionProKit(e:any) {
    if (e.name === 'value') {
      this.isGridBoxOpenedProKit = false;
    }
  }
  onValueChangedProKit(e:any, cellInfo:any) {
    cellInfo.setValue(e.value);
  }
  validaProductoKit(prokit:any, key:any): boolean {
    // Valida existencia
    if (this.DCombos.findIndex(p => p.PRODUCTO_KIT === prokit && p.ITEM !== key) !== -1) {
      showToast('Este producto ya está asociado', 'error');
      return false;
    }
    return true;
  }

  onSelectionChangedPro(e:any, cellInfo:any, dropDownBoxComponent:any, datos:any) {
    if (e.selectedRowKeys.length === 0) return;
    this.valoresObjetos('UDM_PRES', { PRODUCTO: e.selectedRowKeys[0], cellInfo: cellInfo });
    cellInfo.setValue(e.selectedRowKeys[0]);
    var gridInst = datos.component;
    var rowIndex = gridInst.getRowIndexByKey(e.selectedRowKeys[0]);
    var cellNom = gridInst.getCellElement(rowIndex,"NOMBRE");
    this.gridCombos.instance.cellValue(cellInfo.rowIndex, "NOMBRE", e.selectedRowsData[0].NOMBRE);

    if(e.selectedRowKeys.length > 0) {
      dropDownBoxComponent.close();
    }
  } 

  onValueChangedUdmPres(e:any, cellInfo: any = undefined) {
    cellInfo.setValue(e.value);
    this.gridCombos.instance.cellValue(cellInfo.rowIndex, "UDM_PRES", e.value);
  }


  async setNomProValue (rowData: any, value: any) {
    const dnom = this.DListaProductos.find((s: any) => s.PRODUCTO === value)!;
    if (dnom != undefined) {
      rowData.NOMBRE = dnom.NOMBRE;
    };
    rowData.PRODUCTO_KIT = value;

  }
  
  // Operaciones de grid
  operGrid(e:any, operacion:any) {
    // Valida que haya informacion de producto principal
    if (this._sdatos.PRODUCTO === '') {
      this.showModal('No se ha introducido ningún código de producto principal!');
      return;
    }
    // this.valoresObjetos('productos', '');

    switch (operacion) {
      case 'new':
        this.gridCombos.instance.addRow();
        this.rowApplyChanges = true;
        this._sdatos.M_esEdicionCombo = true;
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this._sdatos.M_esEdicionCombo = true;
        break;
      case 'save':
        this.gridCombos.instance.saveEditData();
        this.rowNew = true;
        this._sdatos.conCambios = this._sdatos.conCambios + 1;
        break;
      case 'cancel':
        this.gridCombos.instance.cancelEditData();
        this._sdatos.M_esEdicionCombo = false;
        this.rowNew = true;
        this.rowApplyChanges = false;
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
          confirmButtonText: 'Sí, cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            let data_delete:any = [];
            this.filasSelecc.forEach((key) => {
              const index = this.DCombos.findIndex(a => a.ITEM === key);
              data_delete.push(this.DCombos[index]);
              this.DCombos.splice(index, 1);
            });
            this.gridCombos.instance.refresh();
            // Actualiza los atributos del producto, agrupándolos por tipo de atributo
            var latr: any[] = [];
            for (let k=0; k < this.DCombos.length; k++) {
              latr.push(this.DCombos[k].PRODUCTO_KIT);
            }
            const prm: any = {TIPO:'PARTE', DATOS: latr};
            this._sdatos.setObs_ProAtributos({ accion: 'r_numreg', datos: prm, verPro: true, oper_edicion: false, modo: 'agregar parte', operacion: 'delete', data_delete: e, clase: 'COMBO' });
            this._sdatos.conCambios = this._sdatos.conCambios + 1;
          }
        });
        break;

      default:
        break;
    }
  }

  onEditingStart(e) {
    
  }
  onSeleccValAtr(e) {
  }
  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, datos:any){
    if (obj == 'productos' || obj == 'todos') {
      const prm = { OBJETO: 'PRODUCTOS' };
      this.loadingVisible = true;
      this._sdatos.consulta('PRODUCTOS',prm, 'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        };
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else {
          this.loadingVisible = false;
        }
        this.DListaProductos = res;
      });
    };
    if (obj == 'UDM_PRES') {
      const prm = { PRODUCTO: datos.PRODUCTO };
      this._sdatos.consulta('UDM PRES', prm, 'PRO022').subscribe((data: any)=> {
        const res:any [] = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        };
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else {
          this.DUDM_PRES = new DataSource({
            store: res,  
            paginate: true,
            pageSize: 20
          });
  
          // Valor x defecto si hay 1 solo
          if (res.length === 1) {
            datos.cellInfo.data.UDM_PRES = res[0].UDM_PRES;
            this.gridCombos.instance.cellValue(datos.cellInfo.rowIndex, "UDM_PRES", res[0].UDM_PRES);
          }
        }
      });
    }
  }
  
  ngOnInit(): void {
    this.valoresObjetos('todos', '');    
  }
  ngAfterViewInit() {
    this.subscription = this._sdatos
    .getObs_Combos()
    .subscribe((datprm) => {
      // Verifica si ya tiene una operación activa
      this.operCompo(datprm);
    })
	}
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  showModal(mensaje:any, titulo = '¡Error!', msg_html= '') {
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
