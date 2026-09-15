import { NgModule, Component, OnInit, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxSwitchModule, DxTemplateModule } from 'devextreme-angular';
import Swal from 'sweetalert2';
import { Subject, Subscription, takeUntil } from 'rxjs';
import  { clsConexiones} from '../clsADM015.class';
import { ADM015Service } from 'src/app/services/ADM015/ADM015.service';
import notify from 'devextreme/ui/notify';
import { validatorRes } from 'src/app/shared/validator/validator';
import { CommonModule } from '@angular/common';
import { showToast } from '../../../shared/toast/toastComponent.js'


@Component({
  selector: 'app-ADM01504',
  templateUrl: './ADM01504.component.html',
  styleUrls: ['./ADM01504.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxDropDownBoxModule, DxSwitchModule, DxButtonModule]
})
export class ADM01504Component implements OnInit {
  @ViewChild("gridConexiones", { static: false }) gridConexiones: DxDataGridComponent;

  public _unsubscribeAll: Subject<any>;

  // Variables fijas de la aplicación
  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = false;
  esEdicion: boolean = false;
  isGridBoxOpened: boolean;
  gridBoxConexiones: any[] = [];
  focusedRowIndex: number;
  focusedRowKey: string;

  // Variables de datos
  DConexiones: clsConexiones[];
  D_Conexiones: any;

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

  constructor(private _sdatos: ADM015Service) {
    this.subscription = this._sdatos
    .getObs_UsuarioConexiones()
    .subscribe((datprm) => {
      this.operCompo(datprm);
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
        this.valoresObjetos('conexiones');
        break;

      case "r_refrescar":
        break;

      default:
        break;
    }
  }

  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'new':
        this.gridBoxConexiones = [];
        this.gridConexiones.instance.addRow();
        this.rowApplyChanges = true;
        this._sdatos.M_esEdicionConexiones = true;
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this._sdatos.M_esEdicionConexiones = true;
        break;
      case 'save':
        this.gridConexiones.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        break;
      case 'cancel':
        this.gridConexiones.instance.cancelEditData();
        this.rowApplyChanges = false;
        this._sdatos.M_esEdicionConexiones = false;
        break;
      case 'delete':
        // Elimina filas seleccionadas
        Swal.fire({
          title: '',
          iconHtml: "<i class='icon-alert-ol'></i>",
          icon: 'warning',
          showCancelButton: true,
					confirmButtonColor: '#DF3E3E',
					cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.filasSelecc.forEach((key) => {
              const index = this.DConexiones.findIndex(a => a.ITEM === key);
              this.DConexiones.splice(index, 1);
            });
            this.gridConexiones.instance.refresh();
          }
        });
        break;

      default:
        break;
    }
  }

  opPrepararNuevo() {
    this.esEdicion = true;
    this.DConexiones = [];
  }

  opPrepararModificar() {
    this.esEdicion = true;
  }

  opPrepararGuardar(accion:any) {
    this._sdatos.D_Conexiones = this.DConexiones;
    this._sdatos.M_esEdicionConexiones = false;
    this.esEdicion = false;
  }

  opBlanquearForma() {
    this.DConexiones = [{
      ITEM: 0,
      USUARIO: '',
      ID_CONEXION: '',
      ULTIMA: false,
      ULTIMA_UN: ''
    }]
  }

  opIrARegistro(acc:any) {
    this.valoresObjetos('conexiones');
  }

  opPrepararBuscar(oper:any) {}
  opEliminar() {}

  initNewRow(e:any){
    e.data.ITEM = 0;
    e.data.USUARIO = '';
    e.data.ID_CONEXION = '';
    e.data.ULTIMA = false;
    e.data.ULTIMA_UN = '';
    if (this.DConexiones.length > 0) {
      const item = this.DConexiones.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    e.data.isEdit = false;
  }

  insertingRow(e:any) {
    e.data.isEdit = true;
    // Valida datos
    if (e.data.ID_UN_ASOCIADA === ''){
      e.cancel = true;
      showToast('Faltan completar datos de la Conexión', 'warning');
    }
  }

  insertedRow(e:any){
    this._sdatos.D_Conexiones= this.DConexiones;
    this._sdatos.M_esEdicionConexiones = false;
  }

  updatingRow(e:any) {
    e.data.isEdit = true;
  }

  removedRow(e:any) {
    // Copia al servicio
    this._sdatos.D_Conexiones = this.DConexiones;
  }

  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  onEditingStart(e:any) {
    this.gridBoxConexiones = [e.data.ID_CONEXION];
  }

  onToolbarPreparingGrid(e: any) {
    let toolbarItems = e.toolbarOptions.items;
  
    e.toolbarOptions.items.unshift(
      {
          location: 'before'
      }
    );
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

  onRowValidating(e: any) {
    // Valida completitud
    if (e.newData.ID_CONEXION === '') {
      e.isValid = false;
      this.toaVisible = true;
      showToast('Faltan completar datos de la Conexión', 'warning');
      return;
    }
  }

  onFocusOutConexion(e:any, cellInfo:any) {
    if (cellInfo.data){
      cellInfo.data.ID_CONEXION = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onSelectionConexion(e:any) {
    if (e.name === 'value') {
      this.isGridBoxOpened = false;
    }
    if (e.value != null && e.value.length > 0 && e.name === 'displayValue'){
      this.filterConexion(e.value[0])
    }
  }

  onSeleccRowConexion(e:any, cellInfo:any, datacompo:any) {
    if (e.data){
      cellInfo.data.ID_CONEXION = e.data.ID_CONEXION;
      cellInfo.data.NOMBRE = this.D_Conexiones.find((p:any) => p.ID_CONEXION === cellInfo.data.ID_CONEXION).NOMBRE;
      this.gridConexiones.instance.cellValue(cellInfo.rowIndex, "ID_CONEXION", cellInfo.data.NOMBRE);
      datacompo.close();
      this.gridBoxConexiones = cellInfo.data.ID_CONEXION;
      this.isGridBoxOpened = false;
    }
  }

  onValueChangedConexion(e:any, cellInfo:any) {
    cellInfo.setValue(e.value);
  }

  filterConexion(ID_CONEXION:any){
    const conexion = this.DConexiones.filter(el => el.ID_CONEXION === ID_CONEXION)
    if(conexion.length > 0){
      this.toaMessage = 'La Conexión seleccionada ya se encuentra asociada';
      this.toaTipo = 'error';
      showToast('La Conexión seleccionada ya se encuentra asociada', 'error');
    }
  }

  valoresObjetos(obj: string){
    if (obj == 'conexiones' || obj == 'todos') {
      const prm = {USUARIO: this._sdatos.USUARIO};
      this._sdatos.consulta('CONEXIONES',prm,'ADM015').subscribe((data: any)=> {
        const res = validatorRes(data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if(res[0].ErrMensaje === ""){
          this.DConexiones = res;
        }else{
          this.opBlanquearForma();
        }
      });
    }
    if (obj == 'CONEXIONES' || obj == 'todos'){
      const prm = {};
      this._sdatos
        .consulta('CONEXIONES', prm, 'generales')
        .subscribe((data: any) => {
          const res = validatorRes(data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.D_Conexiones = res;
        });
    }
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

@NgModule({
  imports: [
    DxDataGridModule,
    DxTemplateModule,
  ]
})
export class AppModule { }