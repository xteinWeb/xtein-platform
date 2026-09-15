import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxComponent, DxDropDownBoxModule, DxFormComponent, DxTreeListComponent } from 'devextreme-angular';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { PRO007Service } from 'src/app/services/PRO007/PRO007.service';
import Swal from 'sweetalert2';
import { clsPartes, clsProductos, clsProductosPartes } from '../clsPRO022.class';
import notify from 'devextreme/ui/notify';
import { SboxestadosComponent } from 'src/app/shared/sboxestados/sboxestados.component';
import { CommonModule } from '@angular/common';
import { showToast } from '../../../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-PRO02202',
  templateUrl: './PRO02202.component.html',
  styleUrls: ['./PRO02202.component.scss'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxDropDownBoxModule, DxButtonModule, SboxestadosComponent]
})
export class PRO02202Component implements OnInit {
  @ViewChild('gridPartes', { static: false }) gridPartes: DxDataGridComponent;
  @ViewChild('ddParte', { static: false }) ddParte: DxDropDownBoxComponent;
  @ViewChild('ddPadre', { static: false }) ddPadre: DxDataGridComponent;
  

  public _unsubscribeAll: Subject<any>;

  // Variables fijas de la aplicación
  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = false;
  esEdicion: boolean = false;
  esEdicionFila: boolean = false;

  // Variables de datos
  DPartes: clsPartes[];
  DPartesPadre: clsProductosPartes[];
  DListaAtributos: any[];
  DGrupos: any;
  DProductos: any;
  DGravamenes: any;

  treeBoxGrupo: any[] = [];
  gridBoxPro: any[] = [];
  gridBoxParte: any[] = [];
  gridBoxGrav: any[] = [];
  isTreeBoxOpened: boolean;
  isGridBoxOpenedPro: boolean;
  isGridBoxOpenedParte: boolean;
  focusedRowIndex: number;
  focusedRowKey: string;
  dropDownOptions = { width: 700, height: 840 };
  lblItem: string;
  keyItemGrid: number;

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

  constructor(private _sdatos: PRO007Service,
              private http: HttpClient) 
  { 
    this.DPartes = [];
    
    // Recibe de productos
    this.subscription = this._sdatos
    .getObs_ProPartes()
    .subscribe((datprm) => {
      // Ejecuta de acuerdo al parámetro de producto
      this.operCompo(datprm);
      this.esEdicionFila = false;
      if (datprm.operacion) {
        if (datprm.operacion.match('Juego|Producto compuesto|Parte compuesta'))
          this.valoresObjetos('productos', '');
      } else if (datprm.accion && datprm.accion === 'r_nuevo') {
        if (this._sdatos.PRODUCTO_CLASE && this._sdatos.PRODUCTO_CLASE.match('Juego|Producto compuesto|Parte compuesta'))
          this.valoresObjetos('productos', '');
      }
    });
    
    this.onRowValidating = this.onRowValidating.bind(this);
    this.onSelectionGrupo = this.onSelectionGrupo.bind(this);
    this.onSeleccRowPadre = this.onSeleccRowPadre.bind(this);
    this.onSeleccRowParte = this.onSeleccRowParte.bind(this);
    this.insertingRow = this.insertingRow.bind(this);
    this.operGrid = this.operGrid.bind(this);
    this.selectParte = this.selectParte.bind(this);
    this.opPrepararNuevo = this.opPrepararNuevo.bind(this);
    this.ValidaDatos = this.ValidaDatos.bind(this);
    this.btnGuardar = this.btnGuardar.bind(this);
    this.initNewRow = this.initNewRow.bind(this);
    this.selectionGrid = this.selectionGrid.bind(this);

  }

  // Llama a Acciones de registro
  operCompo(operMenu: any): void {
    switch (operMenu.accion) {

      case "r_ini":
        this.opBlanquearForma();
        if (operMenu.esEdicion !== '' || operMenu.esEdicion !== null || operMenu.esEdicion !== undefined ) this.esEdicion = operMenu.esEdicion;
        break;

      case "r_nuevo":
        this.esVisibleSelecc = 'always';
        this.mnuAccion = "new";
        this.readOnly = false;
        this.rowNew = true;
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.esVisibleSelecc = 'always';
        this.mnuAccion = "update";
        this.readOnly = false;
        this.rowNew = true;
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
        this.esVisibleSelecc = 'none';
        this.opIrARegistro(operMenu.accion);
        break;

      case "r_cancelar":
        this.esEdicion = false;
        // this.opBlanquearForma();
        break;

      case "r_refrescar":
        this.gridPartes.instance.repaint();
        this.valoresObjetos('todos', '');
        break;

      default:
        break;
    }
  }

  opPrepararNuevo() {
    this.esEdicion = true;
    this._sdatos.M_esEdicionPartes = false;
    this.opBlanquearForma();
  }
  opPrepararModificar() {
    this.esEdicion = true;
  }
  opPrepararGuardar(accion) {}

  opBlanquearForma() {
    this.DPartes = [];
    this.gridBoxGrav = [];
    this._sdatos.D_Partes = [];    
    // this.gridPartes.instance.refresh();
  }

  opPrepararBuscar(oper) {}
  opEliminar() {}

  // Busqueda de datos
  opIrARegistro(acc) 
  {
    this.gridPartes.instance.deselectAll();
    this.valoresObjetos('partes', '');
  }
  opVista() {}
  

  onEditingStart(e) {
    if (this.esEdicion === true) {
      this.gridBoxParte = e.data.ID_PARTE;
      this.lblItem = 'Parte/Producto ['+e.data.ITEM+']';
      this._sdatos.M_esEdicionPartes = true;
      this.esEdicion = true;
      this.rowApplyChanges = true;
      this.rowEdit = false;
      this.rowNew = true;
      this.esVisibleSelecc = 'none';
      this.esEdicionFila = true;
      this.keyItemGrid = e.data.ITEM;
      e.data.esEdit = true;
    }
  }

  maxItem: any;
  initNewRow(e) { 
    e.data.ID_PARTE = "";
    e.data.NOMBRE_PARTE = "";
    e.data.ID_UDM = "";
    e.data.ATRIBUTO = "";
    e.data.ESTADO = "ACTIVO";
    e.data.CANTIDAD = 1;
    e.data.esEdit = true;
    this.gridBoxPro = [1];
    this.gridBoxParte = [];
    this.treeBoxGrupo = [];
    this.gridBoxGrav = [];
    this._sdatos.M_esEdicionPartes = true;

    // Genera key nueva
    if (this.DPartes.length > 0) {
      const item = this.DPartes.reduce(function(ant, act) {
        return (ant.ITEM > act.ITEM) ? ant : act
      }) 
      this.maxItem = item.ITEM;
    }
    else {
      this.maxItem = 0;
    }
    e.data.ITEM = Number(this.maxItem) + 1;
    this.lblItem = 'Parte/Producto ['+e.data.ITEM+']';
    this.esVisibleSelecc = 'none';
    this.keyItemGrid = e.data.ITEM;

  }
  insertedRow(e:any) {
    this.gridPartes.instance.refresh();

    // Copia al servicio
    this._sdatos.D_Partes = this.DPartes;
    this._sdatos.M_esEdicionPartes = false;
    this.actualizarFila('new', e);

  }
  insertingRow(e) {
      let err_msg = '';
      if (e.data.ID_PARTE === '') err_msg = 'Parte,';
      if (e.data.CANTIDAD === '') err_msg += 'Cantidad';
      if (err_msg !== '' ) {
        //this.showModal('Falta completar datos de '+err_msg,'Error de datos');
        e.cancel = true;
        showToast('Falta completar datos de '+err_msg,'Error de datos', 'error');
      }
      else {
        // Valida parte
        if (!this.validaParte(e.data.ID_PARTE, e.data.ITEM))
          e.cancel = true;
        else {
          e.data.esEdit = false;
          e.cancel = false
        }
      }

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

  validaParte(parte, key): boolean {
    // Validar que el código inicie con 'PF' solo si la clase es 'Juego'
    if (this._sdatos.PRODUCTO_CLASE === 'Juego') {
      if (!parte || !parte.startsWith('PF')) {
        showToast('Solo se permiten productos cuyo código inicie con PF', 'Error de validación', 'error');
        return false;
      }
    }
    // Valida existencia
    if (this.DPartes.findIndex(p => p.ID_PARTE === parte && p.ITEM !== key) !== -1) {
      this.toaMessage = 'Este código de parte ya está asociada!';
      this.toaVisible = true;
      this.toaTipo = 'error';
      showToast('Este código de parte ya está asociada', 'error');
      return false;
    }
    return true;
  }
  onValueChanged(e, cellInfo) {
    const val = Array.isArray(e.value) ? e.value[0] : e.value;
    if (this._sdatos.PRODUCTO_CLASE === 'Juego') {
      if (val && !val.startsWith('PF')) {
        showToast('Solo se permiten productos cuyo código inicie con PF', 'Error de validación', 'error');
        this.gridBoxParte = [];
        return;
      }
    }
    // Valida repetido
    if (this.itemRepetido(val, cellInfo.data.ITEM)) {
      return;
    }
    else
      cellInfo.setValue(val);
  }
  updatingRow(e) {
    let err_msg = '';
    const parte = !e.newData.ID_PARTE ? e.oldData.ID_PARTE : e.newData.ID_PARTE;
    const keyParte = !e.newData.ITEM ? e.oldData.ITEM : e.newData.ITEM;
    if (e.newData.ID_PARTE === '') err_msg = 'Parte,';
    if (e.newData.NOMBRE_PARTE === '') err_msg += 'Nombre,';
    if (e.newData.ATRIBUTO === '') err_msg += 'Atributo';
    if (err_msg !== '' ) {
      this.showModal('Falta completar datos de '+err_msg,'Error de datos');
      this.rowApplyChanges = true;
      this.rowNew = false;
      e.cancel = true;
      return;
    }

    // Valida parte
    if (!this.validaParte(parte, keyParte)) {
      this.rowApplyChanges = true;
      this.rowNew = false;
      e.cancel = true;
      return;
    }
    e.newData.esEdit = false;
    e.oldData.esEdit = false;
  }
  updatedRow(e:any) {
    // Copia al servicio
    this._sdatos.D_Partes = this.DPartes;
    this._sdatos.M_esEdicionPartes = false;
    this.actualizarFila('update', e);
  }

  // Operaciones de actualización de fila
  actualizarFila(operacion:any, e:any) {
    this.rowApplyChanges = false;
    this.rowEdit = false;
    this.rowNew = true;
    this.esVisibleSelecc = 'always';
    this.esEdicionFila = false;

    // Actualiza los atributos del producto, agrupándolos por tipo de atributo
    var latr: any[] = [];
    for (let k=0; k < this.DPartes.length; k++) {
      latr.push(this.DPartes[k].ID_PARTE);
    }
    const prm: any = {TIPO:'PARTE', DATOS: latr};
    if(operacion !== 'delete')
      this._sdatos.setObs_ProAtributos({ accion: 'r_numreg', datos: prm, verPro: true, oper_edicion: true, modo: 'agregar parte', operacion: operacion });
    else
      this._sdatos.setObs_ProAtributos({ accion: 'r_numreg', datos: prm, verPro: true, oper_edicion: true, modo: 'agregar parte', operacion: operacion, data_delete: e });
    this._sdatos.setObs_Cubicaje({ accion: 'r_numreg', datos: latr, verPro: true, oper_edicion: true, producto: this._sdatos.PRODUCTO });

  }

  removedRow(e) {
    // Copia al servicio
    this._sdatos.D_Partes = this.DPartes;
  }
  onRowValidating(e) {
  }
  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }
  startEdit(e) {
    if(e.rowType === "data") {
      e.component.editRow(e.rowIndex);
      this.esEdicionFila = true;
    }
  }
  onContentReady(e) {  
    e.component.columnOption("command:edit", "visible", false);  
  }
  
  onContentReadyPadres(e) {
    const parte = Array.isArray(this.ddParte.instance.option('value')) 
                  ? this.ddParte.instance.option('value')[0] 
                  : this.ddParte.instance.option('value');
    e.component.filter(['ID_PARTE', '<>', parte]);
  }

  onSelectionGrupo(e, cellInfo) {
    this.isTreeBoxOpened = false;
    if (e.selectedRowsData){
      cellInfo.data.ID_GRUPO = this.treeBoxGrupo[0];
    }
  }
  onSelectionPro(e) {
    if (e.name === 'value') {
      this.isGridBoxOpenedPro = false;
    }
  }
  onSeleccRowPadre(e, cellInfo) {

  }
  onSelectionParte(e) {
    if (e.name === 'value') {
      this.isGridBoxOpenedParte = false;
    }
  }
  onFocusOutParte(e, cellInfo) {
    if (cellInfo.data){
      cellInfo.data.ID_PARTE = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");

      // Valida parte
      if (!this.validaParte(cellInfo.data.ID_PARTE, cellInfo.key))
        e.component.focus();
      
    }
  }
  async onSeleccRowParte(e, cellInfo) {
    if (e.data){

      // Validar que el código inicie con 'PF' solo si la clase es 'Juego'
      if (this._sdatos.PRODUCTO_CLASE === 'Juego') {
        if (!e.data.PRODUCTO || !e.data.PRODUCTO.startsWith('PF')) {
          showToast('Solo se permiten productos cuyo código inicie con PF', 'Error de validación', 'error');
          this.gridBoxParte = [];
          this.ddParte.instance.close();
          return;
        }
      }

      // Valida repetido
      if (this.itemRepetido(e.data.PRODUCTO, this.keyItemGrid)) return;

      cellInfo.data.ID_PARTE = e.data.PRODUCTO;
      const datPro = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.ID_PARTE);
      if (datPro) {
        cellInfo.data.NOMBRE_PARTE = datPro.NOMBRE;
        cellInfo.data.ID_UDM = datPro.ID_UDM;
      }
      else {
        cellInfo.data.NOMBRE_PARTE = '';
        cellInfo.data.ID_UDM = '';
      }
      this.gridPartes.instance.cellValue(cellInfo.rowIndex, "NOMBRE_PARTE", cellInfo.data.NOMBRE_PARTE);

      // Carga los atributos del producto
      this.DListaAtributos = this.DProductos.find(p => p.PRODUCTO === cellInfo.data.ID_PARTE).ATRIBUTOS;
      this.ddParte.instance.close();
  
    }
  }
  onSelectionChangedAtr(selectedRowKeys: any, cellInfo: any, dropDownBoxComponent: any, datos: any) {
    if (selectedRowKeys.length === 0) return;
    cellInfo.setValue(selectedRowKeys[0]);
    var gridInst = datos.component;
    var rowIndex = gridInst.getRowIndexByKey(selectedRowKeys[0]);
    var cellNom = gridInst.getCellElement(rowIndex,"NOMBRE_PARTE");

    if(selectedRowKeys.length > 0) {
      dropDownBoxComponent.close();
    }
  } 
  async setValAtributo (rowData: any, value: any) {  }

  // Valida consistencia y datos completos
  ValidaDatos(Accion: string): boolean {
    if (this.keyItemGrid === undefined || this.ddParte === undefined) return true;
    let rowIndex = this.gridPartes.instance.getRowIndexByKey(this.keyItemGrid);
    if (rowIndex === -1) rowIndex = this.DPartes.length;
    const v_parte = this.ddParte.instance.option('value');
    const v_cantidad = this.gridPartes.instance.cellValue(rowIndex, 'CANTIDAD');
    if (Accion === "requerido") {
      if (
        v_parte === "" ||
        v_cantidad === 0 
      ) {
        this.showModal('',"Faltan datos","<b>Hay datos que faltan. Revisar contenido de datos de la parte!</b>");
        return false;
      }
    }

    // Validar que el código inicie con 'PF' solo si la clase es 'Juego'
    if (this._sdatos.PRODUCTO_CLASE === 'Juego') {
      const parteStr = Array.isArray(v_parte) ? v_parte[0] : v_parte;
      if (parteStr && !parteStr.startsWith('PF')) {
        showToast('Solo se permiten productos cuyo código inicie con PF', 'Error de validación', 'error');
        return false;
      }
    }

    // Valida repetido
    if (this.itemRepetido(v_parte, this.keyItemGrid)) 
      return false;
    else
      return true;

  }

  // Operaciones sobre la grid
  btnGuardar(e, datos, modo = '') {
    // Valida si no hay datos
    if (datos === undefined) {
      this.showModal('Valores nulos producto, cantidad o estado');
      return;
    }

    
    // Datos digitados
    let rowIndex = datos.rowIndex;
    const v_parte = this.ddParte.instance.option('value');

    // Valida repetido
    if (this.itemRepetido(v_parte, this.keyItemGrid)) return;
    
    // Valida...
    if (v_parte === '') {
      this.showModal('Valor nulo en parte');
      return;
    }
    this.esEdicionFila = false;
    this.rowApplyChanges = false; 
    if (modo === '')
      this.gridPartes.instance.saveEditData();
  }
  
  // Valida si el atributo está repetido
  itemRepetido(dato, item): boolean {
    if (this.DPartes.findIndex(a => a.ID_PARTE === dato && a.ITEM !== item) !== -1) {
      this.ddParte.instance.close();
      this.showModal('Parte repetida!');
      return true;
    }
    else
      return false;
  }

  // Operaciones de grid
  operGrid(e, operacion) {
    // Valida que haya informacion de producto principal
    if (this._sdatos.PRODUCTO === '') {
      this.showModal('No se ha introducido ningún código de producto.');
      return;
    }

    // Operaciones de barra
    switch (operacion) {
      case 'new':
        if (this.ValidaDatos('requerido')) {
          if (this.esEdicionFila) this.btnGuardar(e, this.keyItemGrid)
          setTimeout(() => {
            this.gridPartes.instance.addRow();
          }, 100);
        }
        this.rowApplyChanges = true;
        this.esVisibleSelecc = 'none';
        this.esEdicionFila = true;
        this.rowDelete = false;
        this.gridPartes.instance.deselectAll();
        this.filasSelecc = [];
        break;
      case 'edit':
        const rowindex = this.gridPartes.instance.getSelectedRowKeys()[0];
        this.gridPartes.instance.editRow(rowindex);
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this.rowNew = false;
        this.esVisibleSelecc = 'none';
        this.esEdicionFila = true;
        this.gridPartes.instance.deselectAll();
        this.filasSelecc = [];
        break;
      case 'save':
        this.gridPartes.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowEdit = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        this.esEdicionFila = false;
        this._sdatos.conCambios = this._sdatos.conCambios + 1;
        break;
      case 'cancel':
        this.gridPartes.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.rowEdit = false;
        this.rowNew = true;
        this._sdatos.M_esEdicionPartes = false;
        this.esVisibleSelecc = 'always';
        this.esEdicionFila = false;
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
            let data_delete:any = [];
            this.filasSelecc.forEach((key) => {
              const index = this.DPartes.findIndex(a => a.ITEM === key);
              data_delete.push(this.DPartes[index]);
              this.DPartes.splice(index, 1);
            });
            this.gridPartes.instance.refresh();
            this.esVisibleSelecc = 'always';
            this.actualizarFila('delete',data_delete);
            this.gridPartes.instance.deselectAll();
            this.filasSelecc = [];
            this._sdatos.conCambios = this._sdatos.conCambios + 1;
          }
        });
        break;

      default:
        break;
    }
  }
  selectParte(e) {
    if (e.row) {
      if (e.row.data.ITEM === 1 || this.rowApplyChanges) return;
      this.rowEdit = false;
      this.rowNew = false;
      this.rowApplyChanges = true;
      this.gridPartes.instance.editRow(e.rowIndex);
    }

  }
  setValueEstado(e: any, datos: any): void {
    datos.setValue(e.value);
  }

  onValueChangedGrav(e: any, cellInfo) {
    cellInfo.setValue(e.value);
  }  
  onSelectionChangedGrav(e, templateData: any) {
    var keys = e.selectedRowKeys;
    templateData.option('value', keys);
  }


  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, operacion = ''){  

    // Productos, con atributos incluidos
    if (obj == 'productos' || obj == 'todos') {
      const prm = { };
      this._sdatos.consulta('PARTES PARA PRODUCTOS',prm, 'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '')
          this.DProductos = [];
        else
          this.DProductos = res;
      });
    }

    // Grupos de Productos
    if (obj == 'grupos' || obj == 'todos') {
      this.DGrupos = this._sdatos.LGrupos;
    }

    // Cuando está en modo consulta, traer datos de las partes
    if (obj == 'partes') {
      if (this._sdatos.accion !== 'r_nuevo' && (this._sdatos.PRODUCTO && this._sdatos.PRODUCTO !== '')) {
        const prm = { PRODUCTO: this._sdatos.PRODUCTO };
        this._sdatos.consulta('PRODUCTOS PARTES',prm, 'PRO022').subscribe((data: any)=> {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.opBlanquearForma();
          if(res[0].ErrMensaje === '') {
            res.forEach(par => {
              this.DPartes.push(par);
            });
            this.DPartesPadre = res;
            if ( this._sdatos.accion === 'r_numreg' ){
              var dat:any [] = [];
              for (let index = 0; index < this.DPartesPadre.length; index++) {
                const element = this.DPartesPadre[index].ID_PARTE;                
                dat.push(element);
              }
              dat.push(this._sdatos.PRODUCTO);
              this._sdatos.setObs_Cubicaje({ accion: 'r_numreg', datos: dat, verPro: true, oper_edicion: true, producto: this._sdatos.PRODUCTO });
            }
            
          } else {
            this.DPartes = [];
          }
          this._sdatos.D_Partes = this.DPartes;
        });
      }
    }

  }

  ngOnInit(): void {
    // Ini
    this.valoresObjetos('todos', '');
    this.operCompo({ accion: this._sdatos.accion });
    this.esEdicion = false;
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
