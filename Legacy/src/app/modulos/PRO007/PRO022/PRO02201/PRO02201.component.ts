import { Component, OnInit, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxLookupComponent, DxLookupModule, DxTreeListComponent, DxTreeListModule, DxValidatorComponent } from 'devextreme-angular';
import { lastValueFrom, Subject, Subscription, takeUntil } from 'rxjs';
import { PRO007Service } from 'src/app/services/PRO007/PRO007.service';
import Swal from 'sweetalert2';
import { clsAtributos, clsProAtributos } from '../clsPRO022.class';
import notify from 'devextreme/ui/notify';
import dxCheckBox from 'devextreme/ui/check_box';
import { CommonModule } from '@angular/common';
import ScrollView from 'devextreme/ui/scroll_view'; 
import { showToast } from '../../../../shared/toast/toastComponent.js'
@Component({
  selector: 'app-PRO02201',
  templateUrl: './PRO02201.component.html',
  styleUrls: ['./PRO02201.component.scss'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxLookupModule, DxTreeListModule, DxButtonModule]
})
export class PRO02201Component implements OnInit {
  @ViewChild("gridAtributos", { static: false }) gridAtributos: DxDataGridComponent;
  @ViewChild("validAtributo", { static: false }) validAtributo: DxValidatorComponent;
  @ViewChild("validValor", { static: false }) validValor: DxValidatorComponent;
  @ViewChild("treeListAtributos", { static: false }) treeAtributos: DxTreeListComponent;


  public _unsubscribeAll: Subject<any>;

  // Variables fijas de la aplicación
  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = false;
  esEdicion: boolean = false;
  esFilaNueva: boolean = false;
  editorProducto: any;
  clase: number;

  // Variables de datos
  DAtributos: clsProAtributos[] = [];
  DListaAtributos: clsAtributos[] = [];
  DListaValAtr: any[];
  ATRIBUTO: any = '';
  VALOR: any = '';

  // Operaciones de grid
  validating: boolean = false;
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  dataEditing: any[] = [];
  selectKeyTreeList: string[] = [];
  esVisibleSelecc: string = 'none';
  recursiveSelecc: boolean = false;
  esVisibleSeleccTree: boolean = false;
  visibleProducto: boolean = false;
  listaAtributos: any;

  // notificaciones
  toaVisible: boolean;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';

  constructor(private _sdatos: PRO007Service) {

    // Recibe de productos
    this.subscription = this._sdatos
      .getObs_ProAtributos()
      .subscribe((datprm) => {
        // Ejecuta de acuerdo al parámetro de producto
        this.operCompo(datprm);
    })
    this.editorProducto = {
      itemTemplate: "lookupCodAtr",
      fieldTemplate: "lookupCodAtrField"
    };

    this.onSeleccAtributo = this.onSeleccAtributo.bind(this);
    this.onRowValidating = this.onRowValidating.bind(this);
    this.selectionGrid = this.selectionGrid.bind(this);
    this.onSeleccValAtr = this.onSeleccValAtr.bind(this);
    this.integridadReferencial = this.integridadReferencial.bind(this);
  }

  // Llama a Acciones del componente
  operCompo(operMenu: any): void {

    switch (operMenu.accion) {

      case "r_ini":
        this.opBlanquearForma();
        if (operMenu.esEdicion !== '' || operMenu.esEdicion !== null || operMenu.esEdicion !== undefined ) this.esEdicion = operMenu.esEdicion;
        if (this._sdatos.PRODUCTO_CLASE !== ''){
          if (this._sdatos.PRODUCTO_CLASE.match('Producto simple|Parte simple')) this.clase = 1;
          if (this._sdatos.PRODUCTO_CLASE.match('Juego|Producto compuesto|Parte compuesta')) this.clase = 2;
        } else 
          this.clase = 1;
          this.esVisibleSelecc = 'none';
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.esEdicion = true;
        this.esVisibleSelecc = 'none';
        this.rowNew = true;
        if (operMenu.verPro !== undefined) // Columna de producto
          this.visibleProducto = operMenu.verPro;
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.integridadReferencial();
        if (operMenu.verPro !== undefined) // Columna de producto
          this.visibleProducto = operMenu.verPro;
        break;

      case "r_guardar":
        // this.opPrepararGuardar(this.mnuAccion);
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
        if ((this._sdatos.PRODUCTO_CLASE !== '') && (this._sdatos.PRODUCTO_CLASE !== undefined) && (this._sdatos.PRODUCTO_CLASE !== null)){
          // Depende de la clase, muestra grid o treelist
          //Modo Grid
          if (!this._sdatos.PRODUCTO_CLASE.match('COMBO|Juego|Producto compuesto|Parte compuesta')) {
            this.clase = 1;
            if (operMenu.PRODUCTO !== undefined) this.valoresObjetos('atributos simples', operMenu.PRODUCTO);
          }
          // Modo Treelist
          if (this._sdatos.PRODUCTO_CLASE.match('COMBO|Juego|Producto compuesto|Parte compuesta')) {
            this.clase = 2;
            if(operMenu.operacion === 'delete') {
              operMenu.data_delete.forEach((ele:any) => {
                const index = this.DAtributos.findIndex((a:any) => a.CODIGO === ele.ID_PARTE || a.ATRIBUTO === ele.ID_PARTE);
                const data_padre:any = this.DAtributos[index];
                this.DAtributos.splice(index, 1);
                const data_hijos:any = this.DAtributos.filter((a:any) => a.ANTERIOR === data_padre.CODIGO || a.ITEM_PADRE === data_padre.ITEM);
                data_hijos.forEach((element:any) => {
                  const index = this.DAtributos.findIndex((a:any) => a.CODIGO === element.CODIGO || a.ANTERIOR === element.ATRIBUTO);
                  this.DAtributos.splice(index, 1);
                });
              });
              this._sdatos.conCambios = this._sdatos.conCambios + 1;
              this.rowDelete = false;
              this.gridAtributos.instance.refresh();
            } else {
              this.valoresObjetos('atributos partes', operMenu);
            }
          }
        } else {
          this.clase = 1;
        }
        
        this._sdatos.M_esEdicionAtr = true;
        this.esVisibleSelecc = 'none';
        if (operMenu.operacion === undefined || operMenu.operacion === 'Juego' || operMenu.clase === 'COMBO') 
          this.esEdicion = false;
        else
          this.esEdicion = true;
        if (operMenu.verPro !== undefined) // Columna de producto
          this.visibleProducto = operMenu.verPro;

        break;

      case "r_cancelar":
        this.esEdicion = false;
        this.esVisibleSelecc = 'none';
        // this.opBlanquearForma();
        break;

      case "r_refrescar":
        this.valoresObjetos('atributos');
        break;

      default:
        break;
        
    }
  }

  opPrepararNuevo() {
    this.esEdicion = true;
    if ((this._sdatos.PRODUCTO_CLASE !== '') && (this._sdatos.PRODUCTO_CLASE !== undefined) && (this._sdatos.PRODUCTO_CLASE !== null)){
      if (this._sdatos.PRODUCTO_CLASE.match('Producto simple|Parte simple'))
        this.clase = 1;
      if (this._sdatos.PRODUCTO_CLASE.match('Juego|Producto compuesto|Parte compuesta'))
        this.clase = 2;
    } else 
      this.clase = 1;
    this.opBlanquearForma();
  }
  opPrepararModificar() {
    if (this.DAtributos === null)
      this.DAtributos = [];
    if ((this._sdatos.PRODUCTO_CLASE !== '') && (this._sdatos.PRODUCTO_CLASE !== undefined) && (this._sdatos.PRODUCTO_CLASE !== null)){
      if (this._sdatos.PRODUCTO_CLASE.match('Producto simple|Parte simple'))
        this.clase = 1;
      if (this._sdatos.PRODUCTO_CLASE.match('Juego|Producto compuesto|Parte compuesta'))
        this.clase = 2;
    } else 
      this.clase = 1;

    this.mnuAccion = "update";
    this.esEdicion = true;
    this.esVisibleSelecc = 'always';
  }
  
  async integridadReferencial() {
    const prm = { PRODUCTO: this._sdatos.PRODUCTO };
    const apiRest = this._sdatos.consulta('INTEGRIDAD ATRIBUTOS', prm, 'PRO-022');
    const resData = await lastValueFrom(apiRest, { defaultValue: true });
    const newArray = JSON.parse(resData.data);
    if (newArray[0].ErrMensaje !== '') {
      newArray.forEach((ele:any) => {
        var npos:any = -1;
        //si ejecuta Grid
        if (this.gridAtributos !== undefined)
          npos = this.DAtributos.findIndex((d:any) => (d.CODIGO === ele.CODIGO) && (d.ATRIBUTO === ele.ATRIBUTO));
        //si ejecuta TreeList
        if (this.treeAtributos !== undefined)
          npos = this.DAtributos.findIndex((d:any) => (d.CODIGO === ele.CODIGO) && (d.ATRIBUTO === ele.ATRIBUTO) && (d.ANTERIOR === ele.PRODUCTO));

        if (npos > -1) {
          this.DAtributos[npos].ErrMensaje = ele.ErrMensaje;
        }
      });
    }
    
    this.opPrepararModificar();
  }

  opBlanquearForma() {
    this.DAtributos = [];
    this._sdatos.D_Atributos = [];
    // this.gridAtributos.instance.refresh();
  }

  opPrepararBuscar(oper) {}
  opEliminar() {}
  opIrARegistro(acc) {
    this.valoresObjetos('atributos');
  }
  opVista() {}
  onInitNewRow(e:any, element:string) {
    if (element === 'grid') {
      if (this.DAtributos.length > 0) {
        const item = this.DAtributos.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
        e.data.ITEM = item.ITEM + 1;
      } 
      else {
        e.data.ITEM = 1;
      }
      e.data.CODIGO_NOMBRE = '';
      e.data.ATRIBUTO = '';
      e.data.CODIGO = '';
      e.data.VALOR = '';
      e.data.NOMBRE = '';
      e.data.DETALLE = '';
      e.data.TIPO = 'grid';
      e.data.isSelecc = true;
      e.data.isEdit = true;
      this.esFilaNueva = true;
    }
    if (element === 'treeList') {
      e.data.ANTERIOR = 'RAIZ';
      e.data.CODIGO = '';
      e.data.ATRIBUTO = '';
      e.data.VALOR = '';
      e.data.NOMBRE = '';
      e.data.TIPO = 'new';
      if (this.DAtributos.length > 0) {
        const item = this.DAtributos.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
        e.data.ITEM = item.ITEM + 1;
        const index:number = this.DAtributos.findIndex((d:any) => d.CODIGO === this._sdatos.PRODUCTO);
        if(index !== -1)
          e.data.ITEM_PADRE = this.DAtributos[index].ITEM;
        else
          e.data.ITEM_PADRE = 'RAIZ';
      } else {
        e.data.ITEM = 1;
      }
      e.data.ErrMensaje = 'ATRIBUTO';
      e.data.isEdit = true;
      this.esFilaNueva = true;
    }
  }
  insertedRow(e:any, element:string) {
    // Copia al servicio
    this._sdatos.D_Atributos = this.DAtributos;
    this._sdatos.M_esEdicionAtr = false;
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';

    if (element === 'grid') {
      // Reordena de acuerdo al orden del atributo
      this.gridAtributos.instance.columnOption("ORDEN", {
        sortOrder: "asc",
        sortIndex: 0
      });
    }
  }
  insertingRow(e:any, element:string) {
    if (element === 'grid')
      e.data.isEdit = true;
  }
  updatedRow(e:any, element:string) {
    // Copia al servicio
    this._sdatos.D_Atributos = this.DAtributos;
    this._sdatos.M_esEdicionAtr = false;
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';

    if (element === 'grid') {
      // Reordena de acuerdo al orden del atributo
      this.gridAtributos.instance.columnOption("ORDEN", {
        sortOrder: "asc",
        sortIndex: 0
      });
    }
  }
  
  onRowPrepared(e:any, element:string) {
    if (e.rowType === "data") {
      if (e.data.isEdit) {
				// e.rowElement.style.backgroundColor = 'lightyellow';
				const className:string = e.rowElement.className;
				e.rowElement.className = className +' row-modified-focused';
			}
    }

    if (element === 'grid') {
      // Si no tiene partes, que el grupo no se visualice
      if (e.rowType === "group" && e.groupIndex === 0) {
        if (e.data.items[0].ID_PARTE === null || 
            e.data.items[0].ID_PARTE === undefined || 
            e.data.items[0].ID_PARTE === ''
          ){
            e.rowElement.style.display = "none";
          }
      }
    }
  }

  removedRow(e:any, element:string) {
    // Copia al servicio
    this._sdatos.D_Atributos = this.DAtributos;
  }
  onRowValidating(e:any, element:string) {
    // Valida completitud
    if(this.clase === 2)
      e.newData.ANTERIOR = this._sdatos.PRODUCTO;
    if (e.newData.CODIGO === '' || e.newData.VALOR === '') {
      e.isValid = false;
      this.validating = false;
      this.rowApplyChanges = true;
      showToast('Faltan completar datos del atributo o valor', 'warning');
      return;
    } else {
      const npos = this.DAtributos.findIndex((d:any) => (d.CODIGO === e.newData.CODIGO) && (d.VALOR === e.newData.VALOR) && (d.ANTERIOR === e.newData.ANTERIOR));
      if (npos !== -1) {
        e.isValid = false;
        this.validating = false;
        this.rowApplyChanges = true;
        showToast('No puede repetirce el atributo y su valor', 'warning');
        return;
      } else {
        this.ATRIBUTO = '';
        this.VALOR = '';
        this.validating = true;
        this.rowApplyChanges = true;
        return;
      }
    }
  }

  
  onValidating() {
    // Valida completitud
    if (this.ATRIBUTO === '' || this.VALOR === '') {
      this.validating = false;
      showToast('Faltan completar datos del atributo o valor', 'warning');
      this.rowApplyChanges = true;
      return false;
    } else {
      this.ATRIBUTO = '';
      this.VALOR = '';
      this.validating = true;
      this.rowApplyChanges = false;
      return true;
    }
  }

  // Operaciones de grid
  operGrid(e:any, operacion:any, element:any) {
    // Valida que haya informacion de producto principal
    if (this._sdatos.PRODUCTO === '') {
      this.showModal('No se ha introducido ningún código de producto principal!');
      return;
    }

    if(element === 'grid') {
      switch (operacion) {
        case 'new':
          this.gridAtributos.instance.addRow();
          this.rowApplyChanges = true;
          this.DListaValAtr = [];
          this._sdatos.M_esEdicionAtr = true;
          break;
        case 'edit':
          this.esEdicion = true;
          this.rowApplyChanges = true;
          this.rowEdit = false;
          this._sdatos.M_esEdicionAtr = true;
          break;
        case 'save':
          if (this.onValidating()) {
            this.gridAtributos.instance.saveEditData();
            this.rowNew = true;
            this.rowApplyChanges = false;
            this._sdatos.conCambios = this._sdatos.conCambios + 1;
          } else {
            this.rowApplyChanges = true;
          }
          break;
        case 'cancel':
          this.gridAtributos.instance.cancelEditData();
          this._sdatos.M_esEdicionAtr = false;
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
                const index = this.DAtributos.findIndex(a => a.ITEM === key);
                if (this.DAtributos[index].ErrMensaje !== '' && this.DAtributos[index].ErrMensaje !== 'ATRIBUTO') {
                  showToast(this.DAtributos[index].ErrMensaje, 'error');
                  this.rowDelete = false;
                  this.gridAtributos.instance.clearSelection();
                } else {
                  this.DAtributos.splice(index, 1);
                  this._sdatos.conCambios = this._sdatos.conCambios + 1;
                  this.rowDelete = false;
                  this.gridAtributos.instance.refresh();
                }
              });
            }
          });
          break;
  
        default:
          break;
      }
    };
    if(element === 'treelist') {
      switch (operacion) {
        case 'new':
          let data:any = {};
          if(this.clase === 2) {
            if ( this.DAtributos.findIndex((d:any) => d.CODIGO === this._sdatos.PRODUCTO) === -1) {
              data.ANTERIOR = 'RAIZ';
              data.ATRIBUTO = this._sdatos.PRODUCTO;
              data.CODIGO = this._sdatos.PRODUCTO;
              data.DETALLE = '';
              data.ErrMensaje = 'ATRIBUTO';
              data.NOMBRE = this._sdatos.NOMBRE_PRODUCTO;
              data.TIPO = 'new';
              data.VALOR = '';
              data.ITEM_PADRE = 'RAIZ';
              if (this.DAtributos.length > 0) {
                const item = this.DAtributos.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
                data.ITEM = item.ITEM + 1;
              } else {
                data.ITEM = 1;
              }
              data.isEdit = true;
              this.DAtributos.push(data);
              this.treeAtributos.instance.refresh();
            }
          }
          this.treeAtributos.instance.addRow();
          this.rowApplyChanges = true;
          this.DListaValAtr = [];
          this._sdatos.M_esEdicionAtr = true;
          break;
        case 'edit':
          this.esEdicion = true;
          this.rowApplyChanges = true;
          this.rowEdit = false;
          this._sdatos.M_esEdicionAtr = true;
          break;
        case 'save':
          this.treeAtributos.instance.saveEditData();
          this.esVisibleSelecc = 'always';
          this._sdatos.conCambios = this._sdatos.conCambios + 1;
          break;
        case 'cancel':
          this.treeAtributos.instance.cancelEditData();
          this._sdatos.M_esEdicionAtr = false;
          this.rowApplyChanges = false;
          this.rowNew = true;
          this.esVisibleSelecc = 'always'
          this._sdatos.conCambios = this._sdatos.conCambios - 1;
          break;
        case 'delete':
          let msj:string = '¿Desea eliminar los items seleccionados?';
          //verifica si se va a eliminar los atributos del producto principal:
          if(this.clase === 2) {
            var index:any;
            this.filasSelecc.forEach((key) => {
              index = this.DAtributos.findIndex((a:any) => a.ITEM_PADRE === key);
              if(index !== -1) {
                msj = 'El item '+this.DAtributos[index].CODIGO_NOMBRE+', tiene items Hijos que seran eliminados.¿Desea eliminar los items seleccionados?'
              } else {
                msj = '¿Desea eliminar los items seleccionados?'
              }
            });
          }
          // Elimina filas seleccionadas
          Swal.fire({
            title: '',
            text: msj,
            iconHtml: "<i class='icon-alert-ol'></i>",
            showCancelButton: true,
            confirmButtonColor: '#DF3E3E',
            cancelButtonColor: '#438ef1',
            cancelButtonText: 'No',
            confirmButtonText: 'Sí, eliminar'
          }).then((result) => {
            if (result.isConfirmed) {
              var index:any;
              this.filasSelecc.forEach((key) => {
                //elimina atributos hijos:
                index = this.DAtributos.findIndex(a => a.ITEM === key);
                if(this.DAtributos[index].ErrMensaje !== '' && this.DAtributos[index].ErrMensaje !== 'ATRIBUTO' ) {
                  // this.showModal('No puede eliminar el atributo '+this.DAtributos[index].ATRIBUTO, 'ADVERTENCIA', '');
                  showToast(this.DAtributos[index].ErrMensaje, 'error');
                  this.treeAtributos.instance.clearSelection();
                } else {
                  this.DAtributos.splice(index, 1);
                  this._sdatos.conCambios = this._sdatos.conCambios + 1;
                }
                if(this.clase === 2) {
                  //elimina atributos padres e hijos:
                  const data_hijos:any = this.DAtributos.filter((a:any) => a.ITEM_PADRE === key);
                  data_hijos.forEach((element:any) => {
                    index = this.DAtributos.findIndex((a:any) => a.ITEM_PADRE === key);
                    if(index !== -1) {
                      this.DAtributos.splice(index, 1);
                      this._sdatos.conCambios = this._sdatos.conCambios + 1;
                    }
                  });
                }
              });
              this.rowDelete = false;
              this.treeAtributos.instance.refresh();
            }
          });
          break;
  
        default:
          break;
      }
    }

  }

  onSelecValAtr: boolean;
  onSeleccAtributo(rowData: any, value: any, currentRowData: any) {
    this.ATRIBUTO = value;
    const npos = this.DAtributos.findIndex((d:any) => d.CODIGO === value);
    if (npos !== -1) {
      if ((this.DAtributos[npos].VALOR !== '' && currentRowData.VALOR !== '') &&
          (this.DAtributos[npos].VALOR === currentRowData.VALOR)
        )
      {
        this.rowApplyChanges = true;
        this._sdatos.M_esEdicionAtr = true;
        showToast('El atributo no puede repetirse', 'warning');
      } else {
        const lval = this.DListaAtributos.find(a => a.CODIGO === value);
        if (lval !== undefined) {
          this.DListaValAtr = lval.ITM_ATRIBUTOS;
          rowData.ORDEN = lval.ORDEN;
          rowData.NOMBRE = lval.NOMBRE;
          rowData.CODIGO = lval.CODIGO;
          rowData.CODIGO_NOMBRE = lval.CODIGO + ' - ' + lval.NOMBRE;
        }
        if(this.VALOR !== null || this.VALOR !== undefined || this.VALOR !== '') {
          const npos = this.DListaValAtr.findIndex((d:any) => d.ATRIBUTO === this.VALOR);
          if (npos !== -1) {
            rowData.VALOR = '';
            //si ejecuta Grid
            if (this.gridAtributos !== undefined)
              this.gridAtributos.instance.cellValue(currentRowData.VALOR, "VALOR", rowData.VALOR);
            //si ejecuta TreeList
            if (this.treeAtributos !== undefined)
              this.treeAtributos.instance.cellValue(currentRowData.VALOR, "VALOR", rowData.VALOR);
          }
        }
        rowData.ATRIBUTO = value;
        //si ejecuta Grid
        if (this.gridAtributos !== undefined) {
          this.gridAtributos.instance.cellValue(currentRowData.ATRIBUTO, "ATRIBUTO", rowData.ATRIBUTO);
          this.gridAtributos.instance.cellValue(currentRowData.NOMBRE, "NOMBRE", rowData.CODIGO);
          this.gridAtributos.instance.cellValue(currentRowData.CODIGO_NOMBRE, "CODIGO_NOMBRE", rowData.CODIGO_NOMBRE);
        }
        //si ejecuta TreeList
        if (this.treeAtributos !== undefined) {
          this.treeAtributos.instance.cellValue(currentRowData.ATRIBUTO, "ATRIBUTO", rowData.ATRIBUTO);
          this.treeAtributos.instance.cellValue(currentRowData.NOMBRE, "NOMBRE", rowData.CODIGO);
          this.treeAtributos.instance.cellValue(currentRowData.CODIGO_NOMBRE, "CODIGO_NOMBRE", rowData.CODIGO_NOMBRE);
          this._sdatos.conCambios = this._sdatos.conCambios + 1;
        }
        return;
      }
    } else {
      const lval = this.DListaAtributos.find(a => a.CODIGO === value);
      if (lval !== undefined) {
        this.DListaValAtr = lval.ITM_ATRIBUTOS;
        rowData.ORDEN = lval.ORDEN;
        rowData.NOMBRE = lval.NOMBRE;
        rowData.CODIGO = lval.CODIGO;
        rowData.CODIGO_NOMBRE = lval.CODIGO + ' - ' + lval.NOMBRE;
      }
      if(this.VALOR !== null || this.VALOR !== undefined || this.VALOR !== '') {
        const npos = this.DListaValAtr.findIndex((d:any) => d.ATRIBUTO === this.VALOR);
        if (npos !== -1) {
          rowData.VALOR = '';
          //si ejecuta Grid
          if (this.gridAtributos !== undefined)
            this.gridAtributos.instance.cellValue(currentRowData.VALOR, "VALOR", rowData.VALOR);
          //si ejecuta TreeList
          if (this.treeAtributos !== undefined)
            this.treeAtributos.instance.cellValue(currentRowData.VALOR, "VALOR", rowData.VALOR);
        }
      }
      rowData.ATRIBUTO = value;
      //si ejecuta Grid
      if (this.gridAtributos !== undefined) {
        this.gridAtributos.instance.cellValue(currentRowData.ATRIBUTO, "ATRIBUTO", rowData.ATRIBUTO);
        this.gridAtributos.instance.cellValue(currentRowData.NOMBRE, "NOMBRE", rowData.CODIGO);
        this.gridAtributos.instance.cellValue(currentRowData.CODIGO_NOMBRE, "CODIGO_NOMBRE", rowData.CODIGO_NOMBRE);
      }
      //si ejecuta TreeList
      if (this.treeAtributos !== undefined) {
        this.treeAtributos.instance.cellValue(currentRowData.ATRIBUTO, "ATRIBUTO", rowData.ATRIBUTO);
        this.treeAtributos.instance.cellValue(currentRowData.NOMBRE, "NOMBRE", rowData.CODIGO);
        this.treeAtributos.instance.cellValue(currentRowData.CODIGO_NOMBRE, "CODIGO_NOMBRE", rowData.CODIGO_NOMBRE);
        this._sdatos.conCambios = this._sdatos.conCambios + 1;
      }
      return;
    }
    if (this.DListaValAtr.length !== 0) {
      this.onSeleccValAtr(rowData, value, currentRowData);
    };
    const lval = this.DListaAtributos.find(a => a.CODIGO === value);
    if (lval !== undefined) {
      this.DListaValAtr = lval.ITM_ATRIBUTOS;
      rowData.ORDEN = lval.ORDEN;
      rowData.NOMBRE = lval.NOMBRE;
      rowData.CODIGO = lval.CODIGO;
    }
    this.ATRIBUTO = value;
    //si ejecuta Grid
    if (this.gridAtributos !== undefined)
      this.gridAtributos.instance.cellValue(currentRowData.NOMBRE, "NOMBRE", rowData.CODIGO);
    //si ejecuta TreeList
    if (this.treeAtributos !== undefined)
      this.treeAtributos.instance.cellValue(currentRowData.NOMBRE, "NOMBRE", rowData.CODIGO);
  }

  onSeleccValAtr(rowData: any, value: any, currentRowData: any) {
    this.toaMessage = '';
    this.VALOR = value;
    if(this.ATRIBUTO === undefined || this.ATRIBUTO === null || this.ATRIBUTO === '') this.ATRIBUTO = currentRowData.ATRIBUTO;
    const pos = this.DListaValAtr.findIndex((d:any) => (d.CODIGO === this.ATRIBUTO) && (d.ATRIBUTO === value) );
    if (pos === -1) {
      this.toaMessage = 'El valor no pertence al atributo seleccionado';
      this.toaVisible = true;
      this.toaTipo = 'warning';
      this.rowApplyChanges = true;
      this._sdatos.M_esEdicionAtr = true;
      rowData.VALOR = '';
      this.onSelecValAtr = false;
      //si ejecuta Grid
      if (this.gridAtributos !== undefined) 
        this.gridAtributos.instance.cellValue(currentRowData.VALOR, "VALOR", rowData.VALOR);
      //si ejecuta TreeList
      if (this.treeAtributos !== undefined)
        this.treeAtributos.instance.cellValue(currentRowData.VALOR, "VALOR", rowData.VALOR);
      showToast(this.toaMessage, this.toaTipo);
      return;
    } else {
      this.onSelecValAtr = true;
      rowData.VALOR = value;
      const npos = this.DAtributos.filter((d:any) => d.CODIGO === currentRowData.CODIGO);
      for (let i = 0; i < npos.length; i++) {
        if( ((npos[i].ATRIBUTO !== '' && currentRowData.ATRIBUTO !== '') &&
              (npos[i].ATRIBUTO === currentRowData.ATRIBUTO)
            ) && (
              (npos[i].VALOR !== '' && rowData.VALOR !== '') &&
              (npos[i].VALOR === rowData.VALOR)
            )
          )
        {
          rowData.VALOR = '';
          this.toaMessage = 'El atributo no puede repetirse';
          this.toaVisible = true;
          this.toaTipo = 'warning';
          this.rowApplyChanges = true;
          this._sdatos.M_esEdicionAtr = true;
        } else {
          this.toaMessage = '';
        }
      }
      if (this.toaMessage !== '') {
        rowData.VALOR = '';
        //si ejecuta Grid
        if (this.gridAtributos !== undefined)
          this.gridAtributos.instance.cellValue(currentRowData.VALOR, "VALOR", rowData.VALOR);
        //si ejecuta TreeList
        if (this.treeAtributos !== undefined)
          this.treeAtributos.instance.cellValue(currentRowData.VALOR, "VALOR", rowData.VALOR);
        showToast(this.toaMessage, this.toaTipo);
      } else {
        //si ejecuta Grid
        if (this.gridAtributos !== undefined)
          this.gridAtributos.instance.cellValue(currentRowData.VALOR, "VALOR", rowData.VALOR);
        //si ejecuta TreeList
        if (this.treeAtributos !== undefined)
          this.treeAtributos.instance.cellValue(currentRowData.VALOR, "VALOR", rowData.VALOR);
        
        this._sdatos.conCambios = this._sdatos.conCambios + 1;
      }
      
    }
  }

  onEditingStart(e:any, element:string) {
    if (this.esFilaNueva) {
      this.esFilaNueva = false;
      e.cancel = false;
    } else {
      if(e.data.isEdit) {
        this.rowApplyChanges = true;
        this.dataEditing = e.data;
        const lval = this.DListaAtributos.find((a:any) => a.CODIGO === e.data['ATRIBUTO']);
        if (lval !== undefined) {
          const rta = lval.ITM_ATRIBUTOS.sort((a:any,b:any) => a.ATRIBUTO.localeCompare(b.ATRIBUTO));
          this.DListaValAtr = rta;
        }
      } else {
        e.cancel = true;
      }
    }
  }

  selectionGrid(e:any, element:string) {
    if(e.selectedRowKeys.length > 0) {
      this.filasSelecc = e.selectedRowKeys;
      if(element === 'grid') {
        this.rowDelete = true;
      };
      if(element === 'treeList') {
        e.selectedRowsData.forEach((ele:any) => {
          if(ele.ErrMensaje !== 'ATRIBUTO') {
            this.rowDelete = false;
          } else {
            this.rowDelete = true;
          }
        });
      };
    } else {
      this.filasSelecc = [];
      this.rowDelete = false;
    }
  }

  onCellPrepared(e:any, element:string) {
    if (e.rowType === 'data') {
      if (e.cellElement.querySelector(".dx-select-checkbox")) {
        let check = e.cellElement.querySelectorAll(".dx-select-checkbox");
        check.forEach((ele: any, ixfila: any) => {
          const inst = dxCheckBox.getInstance(ele);
          if(e.data.ErrMensaje !== 'ATRIBUTO') {
            inst.option("visible", false);
          } else {
            inst.option("visible", true);
          }
        });
      }
    }
  }

  // Scroll de objetos
  onContentReadyListaAtributosSimple(e:any) {
    var el = e.element.querySelector(".dx-scrollable");  
    var instance = ScrollView.getInstance(el);  
    instance.option('showScrollbar', 'always');  
  }

  onContentReadyTreeListAtributos(e:any) {
		e.component.columnOption("command:edit", "visible", false);  
	}

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, datos: any = ''){
    
    // Lista de Atributos 
    if (obj === 'atributos' || obj === 'todos') {
      const prm = { };
      this._sdatos.consulta('ATRIBUTOS',prm,'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const mensaje = res.ATRIBUTOS[0].ErrMensaje;
        if (mensaje !== '') {
          showToast(mensaje, 'error');
          this.DListaAtributos = [];
        } else {
          this.DListaAtributos = res.ATRIBUTOS;
        }
      });
    }

    // Atributos asociados a partes o productos simples
    if (obj === 'atributos simples') {
      const prm = {PRODUCTO: datos};
      this._sdatos.consulta('atributos simples',prm,'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token !== undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const mensaje = res[0].ErrMensaje;
        if (mensaje !== '') {
				  if (!mensaje.match('No hay atributos registrados para este producto.'))
            showToast(mensaje, 'error');
          this.DAtributos = [];
          this._sdatos.D_Atributos = this.DAtributos;
        } else {
          res.forEach((element:any) => {
            element.isEdit = false;
            element.TIPO = 'grid';
            element.ErrMensaje = 'ATRIBUTO';
          });
          this.DAtributos = res;
          this._sdatos.D_Atributos = this.DAtributos;
          this.valoresObjetos('atributos', '');
        }
      });
    }

    // Atributos asociados a partes o productos compuestos
    if (obj === 'atributos partes') {
      var prm:any;
      if (datos.datos !== undefined) prm = datos.datos;
      if (datos.PRODUCTO !== undefined) prm = datos.PRODUCTO;
      
      this._sdatos.consulta('atributos partes',prm,'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const mensaje = res[0].ErrMensaje;
        if (mensaje !== '') {
          showToast(mensaje, 'error');
          this.DAtributos = [];
        } else {
          res.forEach((element:any) => {
            element.isEdit = false;
            if(element.ANTERIOR === this._sdatos.PRODUCTO)
              element.TIPO = 'new'
            else
              element.TIPO = 'old'

          });
          if(datos.modo === 'consulta') {
            for (let I = 0; I < res.length; I++) {
              res[I].ITEM = I;
              const itemPadre = res.findIndex((d:any) => d.ATRIBUTO === res[I].ANTERIOR);
              if(itemPadre !== -1)
                res[I].ITEM_PADRE = res[itemPadre].ITEM;
              if(res[I].ErrMensaje === 'ATRIBUTO')
                res[I].ITEM_PADRE = 'RAIZ';
              if(res[I].ANTERIOR === this._sdatos.PRODUCTO)
                res[I].ErrMensaje = 'ATRIBUTO';
            }
            this.DAtributos = res;
          }
        };
        if(datos.modo === 'agregar parte') {
          if(this.DAtributos.length !== 0) {
            res.forEach((ele:any) => {
              if (this.DAtributos.length > 0) {
                const item = this.DAtributos.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act});
                ele.ITEM = item.ITEM + 1;
              } else {
                ele.ITEM = 1;
              };
              const itemPadre = res.findIndex((d:any) => d.ATRIBUTO === ele.ANTERIOR);
              if(itemPadre !== -1)
                ele.ITEM_PADRE = res[itemPadre].ITEM;
              if(this.DAtributos.findIndex((d:any) => (d.ANTERIOR === ele.ANTERIOR) && (d.CODIGO === ele.CODIGO)) === -1)
                this.DAtributos.push(ele);
            });
          } else {
            for (let I = 0; I < res.length; I++) {
              res[I].ITEM = I;
              const itemPadre = res.findIndex((d:any) => d.ATRIBUTO === res[I].ANTERIOR);
              if(itemPadre !== -1)
                res[I].ITEM_PADRE = res[itemPadre].ITEM;
            }
            this.DAtributos = res;
          }
        }
        this._sdatos.D_Atributos = this.DAtributos;
        this.valoresObjetos('atributos', '');
      });
    }

  }
  
  ngOnInit(): void {
    this.valoresObjetos('atributos');
    this.esEdicion;
    this.clase = 1;
    this.esVisibleSelecc = 'none';
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
