import { NgModule, Component, OnInit, ViewChild } from '@angular/core';
import { DxButtonModule, DxCheckBoxModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxLoadPanelModule, DxSelectBoxModule, DxTemplateModule, DxTreeListComponent, DxTreeListModule } from 'devextreme-angular';
import Swal from 'sweetalert2';
import { Subject, Subscription, takeUntil } from 'rxjs';
import  {clsAutorizaciones} from '../clsADM015.class';
import { ADM015Service } from 'src/app/services/ADM015/ADM015.service';
import notify from 'devextreme/ui/notify';
import { validatorRes } from 'src/app/shared/validator/validator';
import { CommonModule } from '@angular/common';
import { showToast } from '../../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-ADM01501',
  templateUrl: './ADM01501.component.html',
  styleUrls: ['./ADM01501.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxTreeListModule, DxDropDownBoxModule, DxCheckBoxModule, DxButtonModule, DxLoadPanelModule, DxSelectBoxModule]
})
export class ADM01501Component implements OnInit {

  @ViewChild("gridAutorizaciones", { static: false }) gridAutorizaciones: DxDataGridComponent;
  @ViewChild("treeListaApl", { static: false }) treeListaApl: DxTreeListComponent;

  public _unsubscribeAll: Subject<any>;

  // Variables fijas de la aplicación
  subscription: Subscription;
  subscriptionAppsRol: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = false;
  esEdicion: boolean = false;
  isGridBoxOpened: boolean = false;
  openedPAplicacion: boolean = false;
  gridBoxAplicacion: any[] = [];
  selectListAplication: any[] = [];
  DAplicaciones_prev: any[] = [];
  focusedRowIndex: number;
  focusedRowKey: string;
  conCambios: number = 0;
  loadingVisible: boolean = false;

  // Variables de datos
  DAutorizaciones: clsAutorizaciones[];
  DAplicaciones: any;

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esVisibleSelecc: string = 'none';
  allowedPageSizes: any[] = [5, 10, 15, 25, 50, 'all'];

  // notificaciones
  toaVisible: boolean;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';

  constructor(private _sdatos: ADM015Service) {
    this.subscription = this._sdatos
    .getObs_UsuarioAutorizaciones()
    .subscribe((datprm) => {
      this.operCompo(datprm);
    })

    this.subscriptionAppsRol = this._sdatos
    .getObs_AppsRol()
    .subscribe((datprm) => {
      if(this.mnuAccion === 'new'){
        this.valoresObjetos('autorizaciones');
      }
    })
  }

  operCompo(operMenu: any): void {
    switch (operMenu.accion) {
      case "r_ini":
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
        this.opIrARegistro(operMenu.accion);
        this.esVisibleSelecc = 'none';
        this.esEdicion = false;
        break;

      case "r_cancelar":
        this.valoresObjetos('autorizaciones');
        break;

      default:
        break;
    }
  }

  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'new':
        this.gridBoxAplicacion = [];
        this.gridAutorizaciones.instance.addRow();
        this.rowApplyChanges = true;
        this._sdatos.M_esEdicionAutorizaciones = true;
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this._sdatos.M_esEdicionAutorizaciones = true;
        break;
      case 'save':
        this.gridAutorizaciones.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        break;
      case 'cancel':
        this.gridAutorizaciones.instance.cancelEditData();
        this.rowApplyChanges = false;
        this._sdatos.M_esEdicionAutorizaciones = false;
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
              const index = this.DAutorizaciones.findIndex(a => a.ITEM === key);
              this.DAutorizaciones.splice(index, 1);
            });
            this.gridAutorizaciones.instance.refresh();
            this.conCambios++;
          }
        });
        break;

      default:
        break;
    }
  }

  opPrepararNuevo() {
    this.esEdicion = true;
    this.DAutorizaciones = [];
    this.conCambios = 0;
    this.gridAutorizaciones.instance.refresh();
  }

  opPrepararModificar() {
    this.esEdicion = true;
  }

  opPrepararGuardar(accion:any) {
    this._sdatos.D_Autorizaciones = this.DAutorizaciones;
    this._sdatos.M_esEdicionAutorizaciones = false;
    this.esEdicion = false;
    this.esVisibleSelecc = 'none';
  }

  opBlanquearForma() {
    this.DAutorizaciones = [];
  }

  opPrepararBuscar(oper:any) {}

  opEliminar() {}

  opIrARegistro(acc:any) {
    this.valoresObjetos('autorizaciones');
  }

  opVista() {}

  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  initNewRow(e:any){
    e.data.ID_UN = '';
    e.data.USUARIO = '';
    e.data.ID_APLICACION = '';
    e.data.CREAR = false;
    e.data.MODIFICAR = false;
    e.data.ELIMINAR = false;
    e.data.BUSCAR = false;
    e.data.LISTAR = false;
    e.data.EXCLUSIVA = false;
    e.data.CONFIGURAR = false;
    e.data.NOMBRE = '';
    e.data.S_NIVEL = false;
    e.data.S_CLAVE = '';
    e.data.S_ABRIR = false;
    e.data.S_CREAR = false;
    e.data.S_MODIFICAR = false;
    e.data.S_ELIMINAR = false;
    e.data.S_BUSCAR = false;
    e.data.S_LISTAR = false;
    e.data.S_APROBAR = false;
    e.data.A_NIVEL = false;
    e.data.A_CLAVE = '';
    e.data.A_ABRIR = false;
    e.data.A_CREAR = false;
    e.data.A_MODIFICAR = false;
    e.data.A_ELIMINAR = false;
    e.data.A_BUSCAR = false;
    e.data.A_LISTAR = false;
    e.data.A_APROBAR = false;
    if (this.DAutorizaciones.length > 0) {
      const item = this.DAutorizaciones.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act})
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    e.data.isEdit = false;
  }

  insertingRow(e:any) {
    this.conCambios++;
    e.data.isEdit = true;
    // Valida datos
    if (e.data.ID_APLICACION === ''){
      this.toaVisible = true;
      showToast('Faltan completar datos de la Aplicación', 'warning');
      e.cancel = true;
    }
  }

  insertedRow(e:any){
    this._sdatos.D_Autorizaciones= this.DAutorizaciones;
    this._sdatos.M_esEdicionAutorizaciones = false;
    this.sortByAplicacion()
  }

  updatingRow(e:any) {
    this.conCambios++;
    if (e.oldData === undefined)
      return;
    e.oldData.isEdit = true;
  }

  removedRow(e:any) {
    this._sdatos.D_Autorizaciones= this.DAutorizaciones;
  }

  onRowPrepared(e:any) {
    if (e.rowType === "data") {
      if (e.data.isEdit) {
				// e.rowElement.style.backgroundColor = 'lightyellow';
				const className:string = e.rowElement.className;
				e.rowElement.className = className +' row-modified-focused';
			}
    }
    if (e.rowType === "header" && e.rowIndex === 2 && !this.esEdicion) {
      e.rowElement.style.display = "none";
    }
  }

  onRowValidating(e: any) {
    // Valida completitud
    if (e.newData.ID_APLICACION === '' || e.oldData.ID_APLICACION === '') {
      e.isValid = false;
      this.toaVisible = true;
      showToast('Faltan completar datos de la Aplicación', 'warning');
      return;
    }
    if(((!e.oldData.S_ABRIR && e.oldData.A_ABRIR) || (e.oldData.S_ABRIR && !e.oldData.A_ABRIR)) && (e.newData.S_ABRIR || e.newData.A_ABRIR )){
      this.showPermAprToast();
      e.newData.S_ABRIR = !e.newData.S_ABRIR;
      e.newData.A_ABRIR = !e.newData.A_ABRIR;
    }
    if(((!e.oldData.S_CREAR && e.oldData.A_CREAR) || (e.oldData.S_CREAR && !e.oldData.A_CREAR)) && (e.newData.S_CREAR || e.newData.A_CREAR )){
      this.showPermAprToast();
      e.newData.S_CREAR = !e.newData.S_CREAR;
      e.newData.A_CREAR = !e.newData.A_CREAR;
    }
    if(((!e.oldData.S_MODIFICAR && e.oldData.A_MODIFICAR) || (e.oldData.S_MODIFICAR && !e.oldData.A_MODIFICAR)) && (e.newData.S_MODIFICAR || e.newData.A_MODIFICAR )){
      this.showPermAprToast();
      e.newData.S_MODIFICAR = !e.newData.S_MODIFICAR;
      e.newData.A_MODIFICAR = !e.newData.A_MODIFICAR;
    }
    if(((!e.oldData.S_ELIMINAR && e.oldData.A_ELIMINAR) || (e.oldData.S_ELIMINAR && !e.oldData.A_ELIMINAR)) && (e.newData.S_ELIMINAR || e.newData.A_ELIMINAR )){
      this.showPermAprToast();
      e.newData.S_ELIMINAR = !e.newData.S_ELIMINAR;
      e.newData.A_ELIMINAR = !e.newData.A_ELIMINAR;
    }
    if(((!e.oldData.S_BUSCAR && e.oldData.A_BUSCAR) || (e.oldData.S_BUSCAR && !e.oldData.A_BUSCAR)) && (e.newData.S_BUSCAR || e.newData.A_BUSCAR )){
      this.showPermAprToast();
      e.newData.S_BUSCAR = !e.newData.S_BUSCAR;
      e.newData.A_BUSCAR = !e.newData.A_BUSCAR;
    }
    if(((!e.oldData.S_LISTAR && e.oldData.A_LISTAR) || (e.oldData.S_LISTAR && !e.oldData.A_LISTAR)) && (e.newData.S_LISTAR || e.newData.A_LISTAR )){
      this.showPermAprToast();
      e.newData.S_LISTAR = !e.newData.S_LISTAR;
      e.newData.A_LISTAR = !e.newData.A_LISTAR;
    }
  }

  onSelectionChangedAplicacion(e:any){
    this.gridBoxAplicacion = e.selectedRowKeys;
    this.isGridBoxOpened = false;
  }

  onSelectionAplicacion(e:any) {
    if (e.name === 'value') {
      this.isGridBoxOpened = false;
    }
    if (e.value != null && e.value.length > 0 && e.name === 'displayValue'){
      this.filterAplicaciones(e.value[0]);
      e.cancel = true;
      e = null;
    }
  }

  onFocusOutAplicaciones(e:any, cellInfo:any) {
    if (cellInfo.data){
      cellInfo.data.ID_APLICACION = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onValueChangedAplicacion(e:any, cellInfo:any) {
    cellInfo.setValue(e.value);
  }

  onOpenedListaAplicacion(e: any) {
    // Pre-seleccionar en el treelist las aplicaciones ya asignadas en la grilla
    // const yaAsignadas = this.DAutorizaciones.map((d: any) => d.ID_APLICACION);
    // Incluir también los padres de las asignadas para que la selección recursiva funcione
    // const conPadres: any[] = [];
    // yaAsignadas.forEach((id: any) => {
    //   let nodo = this.DAplicaciones.find((d: any) => d.ID_APLICACION === id);
    //   while (nodo) {
    //     if (!conPadres.includes(nodo.ID_APLICACION))
    //       conPadres.push(nodo.ID_APLICACION);
    //     nodo = this.DAplicaciones.find((d: any) => d.ID_APLICACION === nodo.ID_APLICACION_PADRE);
    //   }
    // });
    // this.selectListAplication = conPadres;
    // Mapeamos los ítems de la grilla, pero filtramos para pasarle al TreeList
    // SOLO aquellos que no tienen dependientes (hojas). Él deducirá el estado de los padres de forma limpia.
    this.selectListAplication = this.DAutorizaciones
      .map((d: any) => d.ID_APLICACION)
      .filter((key: any) => {
        return !this.DAplicaciones.some((d: any) => d.ID_APLICACION_PADRE === key);
      });
  }

  onValueChangedListaAplicacion(e:any) {

  }

  onCheckAllListaApl(e:any,data:any){
    const name = data.column.dataField;
    for (let i = 0; i < this.selectListAplication.length; i++) {
      const key = this.selectListAplication[i];
      const isParent = this.DAplicaciones.some((d:any) => d.ID_APLICACION_PADRE === key);
      if (isParent) continue;
      const index = this.DAplicaciones.findIndex((d:any) => d.ID_APLICACION === key);
      if ( index > -1 ){
        this.DAplicaciones[index][name] = e.value;
      }
    }
    this.treeListaApl.instance.refresh();
  }

  onEditorPreparingTreeApl(e:any){
    // if (e.parentType === 'dataRow') {
    //   const isParent = this.DAplicaciones.some((d:any) => d.ID_APLICACION_PADRE === e.row?.key);
    //   if (isParent) {
    //     e.editorOptions.disabled = true;
    //   }
    // }
  }

  aceptarBottom(e:any) {
    // this.openedPAplicacion = false;

    // // Solo hojas (sin hijos) de lo seleccionado
    // const leafKeys = this.selectListAplication.filter((key:any) => {
    //   return !this.DAplicaciones.some((d:any) => d.ID_APLICACION_PADRE === key);
    // });

    // if (leafKeys.length > 0) {
    //   // Guardar snapshot de la grilla actual para conservar permisos
    //   const autorizacionesActuales = JSON.parse(JSON.stringify(this.DAutorizaciones));

    //   // Reconstruir DAutorizaciones con las seleccionadas
    //   const nueva: any[] = [];
    //   let nextItem = autorizacionesActuales.length > 0
    //     ? autorizacionesActuales.reduce((ant: any, act: any) => (ant.ITEM > act.ITEM ? ant : act)).ITEM
    //     : 0;

    //   for (const key of leafKeys) {
    //     // Si ya existía, conservar la fila con todos sus permisos
    //     const existente = autorizacionesActuales.find((d: any) => d.ID_APLICACION === key);
    //     if (existente) {
    //       nueva.push(existente);
    //       continue;
    //     }

    //     // Es nueva: tomar valores del treelist
    //     const index = this.DAplicaciones.findIndex((d: any) => d.ID_APLICACION === key);
    //     if (index > -1) {
    //       nextItem++;
    //       nueva.push({
    //         ITEM: nextItem,
    //         ID_UN: '',
    //         USUARIO: '',
    //         ID_APLICACION: this.DAplicaciones[index].ID_APLICACION,
    //         NOMBRE: this.DAplicaciones[index].NOMBRE,
    //         CREAR: this.DAplicaciones[index].CREAR,
    //         MODIFICAR: this.DAplicaciones[index].MODIFICAR,
    //         ELIMINAR: this.DAplicaciones[index].ELIMINAR,
    //         BUSCAR: this.DAplicaciones[index].BUSCAR,
    //         LISTAR: false,
    //         EXCLUSIVA: false,
    //         CONFIGURAR: false,
    //         S_NIVEL: false,
    //         S_CLAVE: '',
    //         S_ABRIR: false,
    //         S_CREAR: false,
    //         S_MODIFICAR: false,
    //         S_ELIMINAR: false,
    //         S_BUSCAR: false,
    //         S_LISTAR: false,
    //         S_APROBAR: false,
    //         A_NIVEL: false,
    //         A_CLAVE: '',
    //         A_ABRIR: false,
    //         A_CREAR: false,
    //         A_MODIFICAR: false,
    //         A_ELIMINAR: false,
    //         A_BUSCAR: false,
    //         A_LISTAR: false,
    //         A_APROBAR: false,
    //         isEdit: true
    //       });
    //     }
    //   }

    //   this.DAutorizaciones = nueva;
    // } else {
    //   // Sin selección: limpiar grilla
    //   this.DAutorizaciones = [];
    // }

    // this.selectListAplication = [];
    // this.gridAutorizaciones.instance.refresh();
    this.openedPAplicacion = false;

    // 1. Tomamos TODO lo que quedó seleccionado en el TreeList (Padres, Hijos, Nietos, etc.)
    const todasLasLlaves = this.selectListAplication;

    if (todasLasLlaves.length > 0) {
      // Guardar snapshot de la grilla actual para conservar los permisos que ya estaban digitados
      const autorizacionesActuales = JSON.parse(
        JSON.stringify(this.DAutorizaciones),
      );

      // Reconstruir DAutorizaciones
      const nueva: any[] = [];
      let nextItem =
        autorizacionesActuales.length > 0
          ? autorizacionesActuales.reduce((ant: any, act: any) =>
              ant.ITEM > act.ITEM ? ant : act,
            ).ITEM
          : 0;

      for (const key of todasLasLlaves) {
        // Si ya existía en la grilla, lo conservamos tal cual (con sus permisos intactos)
        const existente = autorizacionesActuales.find(
          (d: any) => d.ID_APLICACION === key,
        );
        if (existente) {
          nueva.push(existente);
          continue;
        }

        // Es un nodo nuevo (puede ser Padre o Hijo): buscamos sus datos en la lista global de aplicaciones
        const index = this.DAplicaciones.findIndex(
          (d: any) => d.ID_APLICACION === key,
        );
        if (index > -1) {
          nextItem++;
          nueva.push({
            ITEM: nextItem,
            ID_UN: '',
            USUARIO: '',
            ID_APLICACION: this.DAplicaciones[index].ID_APLICACION,
            NOMBRE: this.DAplicaciones[index].NOMBRE,
            // Si el TreeList tenía pre-marcados checks de operaciones, los hereda, si no, van en false
            CREAR: this.DAplicaciones[index].CREAR || false,
            MODIFICAR: this.DAplicaciones[index].MODIFICAR || false,
            ELIMINAR: this.DAplicaciones[index].ELIMINAR || false,
            BUSCAR: this.DAplicaciones[index].BUSCAR || false,
            LISTAR: false,
            EXCLUSIVA: false,
            CONFIGURAR: false,
            S_NIVEL: false,
            S_CLAVE: '',
            S_ABRIR: false,
            S_CREAR: false,
            S_MODIFICAR: false,
            S_ELIMINAR: false,
            S_BUSCAR: false,
            S_LISTAR: false,
            S_APROBAR: false,
            A_NIVEL: false,
            A_CLAVE: '',
            A_ABRIR: false,
            A_CREAR: false,
            A_MODIFICAR: false,
            A_ELIMINAR: false,
            A_BUSCAR: false,
            A_LISTAR: false,
            A_APROBAR: false,
            isEdit: true,
          });
        }
      }

      this.DAutorizaciones = nueva;
    } else {
      // Si el usuario desmarcó absolutamente todo en el árbol, limpiamos la grilla
      this.DAutorizaciones = [];
    }

    this.selectListAplication = [];
    // Forzamos al Grid principal a repintar las filas (ahora verás los padres e hijos juntos)
    this.gridAutorizaciones.instance.refresh();
  }

  closeBottom(e:any) {
    this.openedPAplicacion = false;
    this.selectListAplication = [];
  }

  onSeleccRowAplicacion(e:any, cellInfo:any, datacompo:any) {
    if (e.data){
      cellInfo.data.ID_APLICACION = e.data.ID_APLICACION;
      cellInfo.data.NOMBRE = this.DAplicaciones.find((p:any) => p.ID_APLICACION === cellInfo.data.ID_APLICACION).NOMBRE;
      this.gridAutorizaciones.instance.cellValue(cellInfo.rowIndex, "NOMBRE", cellInfo.data.NOMBRE);
      datacompo.close();
      this.isGridBoxOpened = false;
    }
  }

  onEditingStart(e:any) {
    this.gridBoxAplicacion = [e.data.ID_APLICACION];
  }

  onToolbarPreparingTreeApl(e: any) {
    e.toolbarOptions.items.push({
      location: 'before',
      widget: 'dxCheckBox',
      options: {
        width: 140,
        text: 'Solo seleccionadas',
        onValueChanged: this.onSoloSeleccionadasApl.bind(this),
      },
    });
  }

  onSoloSeleccionadasApl(e: any) {
    if (e.value) {
      if (this.selectListAplication.length > 0) {
        this.DAplicaciones_prev = JSON.parse(JSON.stringify(this.DAplicaciones));
        let data: any = JSON.parse(JSON.stringify(
          this.DAplicaciones.filter((item: any) => {
            return this.selectListAplication.includes(item.ID_APLICACION);
          })
        ));
        if (data.length > 0) {
          data.forEach((item: any) => {
            if (data.findIndex((d: any) => d.ID_APLICACION === item.ID_APLICACION_PADRE) === -1)
              item.ID_APLICACION_PADRE = null;
          });
          this.DAplicaciones = data;
        }
        this.treeListaApl.instance.refresh();
      } else {
        showToast('No hay aplicaciones seleccionadas por mostrar.', 'error');
      }
    } else {
      this.DAplicaciones = JSON.parse(JSON.stringify(this.DAplicaciones_prev));
    }
  }

  onToolbarPreparingGrid(e: any) {
    let toolbarItems = e.toolbarOptions.items;
    e.toolbarOptions.items.unshift(
      {
        location: 'before'
      }
    );
  }

  onCheckMarkAll(e:any,name:any){
    name = name.substring(1);
    for (const item in this.DAutorizaciones){
      this.DAutorizaciones[item][name] = e.value;
    }
  }

  onRefreshGrid(){
    this.conCambios = 1;
    this.valoresObjetos('autorizaciones')
  }

  filterAplicaciones(ID_APLICACION:any){
    const aplicacion = this.DAutorizaciones.filter(el => el.ID_APLICACION === ID_APLICACION)
    if(aplicacion.length > 0){
    showToast('La Aplicación seleccionada ya se encuentra asociada', 'error');
    }
  }

  valoresObjetos(obj: string){
    this.loadingVisible = true;
    if (obj == 'autorizaciones' || obj == 'todos') {
      const prm = {USUARIO: this._sdatos.USUARIO, ACCION: this.mnuAccion, ID_ROL: this._sdatos.ROL};
      this._sdatos.consulta('AUTORIZACIONES',prm,'ADM015').subscribe((data: any)=> {
        const res = validatorRes(data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if(res[0].ErrMensaje === ""){
          this.DAutorizaciones = res;
        }else{
          this.opBlanquearForma();
        }
      });
    }
    if (obj == 'aplicaciones' || obj == 'todos'){
      const prm = {TIPO: "APLICACION", ESTADO: "ACTIVO"};
      this._sdatos
        .consulta('APLICACIONES', prm, 'ADM001')
        .subscribe((data: any) => {
          const res:any = validatorRes(data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          res.forEach((apl:any) => {
            apl.CREAR = false;
            apl.MODIFICAR = false;
            apl.ELIMINAR = false;
            apl.BUSCAR = false;
          });

          //Nueva logica: Hacer rootValue Dinamico para el TreeList
          const codigosExistentes = new Set(res.map((item:any) => item.ID_APLICACION));

          res.forEach((item:any) => {
            if (!codigosExistentes.has(item.ID_APLICACION_PADRE)) {
              item.ID_APLICACION_PADRE = null;
            }
          });


          this.DAplicaciones = res;
        });
    }
    this.loadingVisible = false;
  }

  sortByAplicacion(){
    this.gridAutorizaciones.instance.columnOption("ID_APLICACION", {
      sortOrder: "asc",
      sortIndex: 0
    });
}

  showPermAprToast(){
    showToast('No se puede asociar Permisos y Asociación de Permisos sobre la misma acción', 'warning');
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

  showToast(message:any, type:any, offset:any) {
    const container: any = document.getElementById('router-container');
    notify({
      message: message,
      width: 300,
      position: {
        at: 'top right',
        my: 'top right',
        of: container,
        offset: offset
      },
      animation: {
        show: { type: 'fade', duration: 400, from: 0, to: 1 },
        hide: { type: 'fade', duration: 40, to: 0 }
      },
    },
    type, 4500 );
  }

  ngOnInit(): void {
    this.valoresObjetos('todos');
    this.operCompo({ accion: this._sdatos.accion });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subscriptionAppsRol.unsubscribe();
  }
}

@NgModule({
  imports: [
    DxDataGridModule,
    DxTemplateModule,
  ]
})
export class AppModule { }
