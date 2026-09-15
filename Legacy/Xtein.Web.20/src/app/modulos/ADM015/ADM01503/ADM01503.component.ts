import { NgModule, Component, OnInit, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxSwitchModule, DxTemplateModule } from 'devextreme-angular';
import Swal from 'sweetalert2';
import { Subject, Subscription, takeUntil } from 'rxjs';
import  { clsUN_Asociadas} from '../clsADM015.class';
import { ADM015Service } from 'src/app/services/ADM015/ADM015.service';
import notify from 'devextreme/ui/notify';
import { validatorRes } from 'src/app/shared/validator/validator';
import { CommonModule } from '@angular/common';
import { showToast } from '../../../shared/toast/toastComponent.js'


@Component({
  selector: 'app-ADM01503',
  templateUrl: './ADM01503.component.html',
  styleUrls: ['./ADM01503.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxDropDownBoxModule, DxSwitchModule, DxButtonModule]
})
export class ADM01503Component implements OnInit {
  @ViewChild("gridUNAsociadas", { static: false }) gridUNAsociadas: DxDataGridComponent;

  public _unsubscribeAll: Subject<any>;

  // Variables fijas de la aplicación
  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = false;
  esEdicion: boolean = false;
  isGridBoxOpened: boolean;
  gridBoxUnidadesNegocio: any[] = [];
  focusedRowIndex: number;
  focusedRowKey: string;
  conCambios: number = 0;

  // Variables de datos
  DUNAsociadas: clsUN_Asociadas[];
  DUnidadesNegocios: any;

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
    .getObs_UsuarioUNAsociadas()
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
        this.valoresObjetos('unAsociadas');
        break;

      default:
        break;
    }
  }

  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'new':
        this.gridBoxUnidadesNegocio = [];
        this.gridUNAsociadas.instance.addRow();
        this.rowApplyChanges = true;
        this._sdatos.M_esEdicionUNAsociadas = true;
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this._sdatos.M_esEdicionUNAsociadas = true;
        break;
      case 'save':
        this.gridUNAsociadas.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        break;
      case 'cancel':
        this.gridUNAsociadas.instance.cancelEditData();
        this.rowApplyChanges = false;
        this._sdatos.M_esEdicionUNAsociadas = false;
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
              const index = this.DUNAsociadas.findIndex(a => a.ITEM === key);
              this.DUNAsociadas.splice(index, 1);
            });
            this.gridUNAsociadas.instance.refresh();
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
    this.DUNAsociadas = [];
  }

  opPrepararModificar() {
    this.esEdicion = true;
  }

  opPrepararGuardar(accion:any) {
    if(this.conCambios != 0){
      this._sdatos.D_UNAsociadas = this.DUNAsociadas;
      this._sdatos.M_esEdicionUNAsociadas = false;
      this.esEdicion = false;
    }
  }

  opBlanquearForma() {
    this.DUNAsociadas = [{
      ITEM: 0,
      ID_UN: '',
      ID_UN_ASOCIADA: '',
      NOMBRE: '',
      USUARIO: '',
      VALOR_DEFECTO: false
    }]
  }

  opIrARegistro(acc:any) {
    this.valoresObjetos('unAsociadas');
  }

  opPrepararBuscar(oper:any) {}
  opEliminar() {}

  initNewRow(e:any){
    e.data.ITEM = 0;
    e.data.ID_UN = '';
    e.data.ID_UN_ASOCIADA = '';
    e.data.USUARIO = '';
    e.data.VALOR_DEFECTO = false;
    if (this.DUNAsociadas.length > 0) {
      const item = this.DUNAsociadas.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
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
    if (e.data.ID_UN_ASOCIADA === ''){
      e.cancel = true;
      showToast('Faltan completar datos de la Unidad de Negocio', 'warning');
    }
  }

  insertedRow(e:any){
    this._sdatos.D_UNAsociadas= this.DUNAsociadas;
    this._sdatos.M_esEdicionUNAsociadas = false;
  }

  updatingRow(e:any) {
    this.conCambios++;
    if (e.oldData === undefined)
      return;
    e.oldData.isEdit = true;
  }

  removedRow(e:any) {
    // Copia al servicio
    this._sdatos.D_UNAsociadas = this.DUNAsociadas;
  }

  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  onEditingStart(e:any) {
    this.gridBoxUnidadesNegocio = [e.data.ID_UN_ASOCIADA];
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
    if (e.newData.ID_UN_ASOCIADA === '') {
      e.isValid = false;
      this.toaTipo = 'warning';
      showToast('Faltan completar datos de la Unidad de Negocio', 'warning');
      return;
    }
  }

  onFocusOutUnidadNegocio(e:any, cellInfo:any) {
    if (cellInfo.data){
      cellInfo.data.ID_UN_ASOCIADA = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onSelectionUnidadNegocio(e:any) {
    if (e.name === 'value') {
      this.isGridBoxOpened = false;
    }
    if (e.value !=null && e.value.length > 0 && e.name === 'displayValue'){
      this.filterUnidadNegocio(e.value[0])
    }
  }

  onSeleccRowUnidadNegocio(e:any, cellInfo:any, datacompo:any) {
    if (e.data){
      cellInfo.data.ID_UN_ASOCIADA = e.data.ID_UN;
      cellInfo.data.NOMBRE = this.DUnidadesNegocios.find((p:any) => p.ID_UN === cellInfo.data.ID_UN_ASOCIADA).NOMBRE;
      this.gridUNAsociadas.instance.cellValue(cellInfo.rowIndex, "NOMBRE", cellInfo.data.NOMBRE);
      datacompo.close();
      this.isGridBoxOpened = false;
    }
  }

  onValueChangedUnidadNegocio(e:any, cellInfo:any) {
    cellInfo.setValue(e.value);
  }

  filterUnidadNegocio(ID_UN:any){
    const aplicacion = this.DUNAsociadas.filter(el => el.ID_UN_ASOCIADA === ID_UN)
    if(aplicacion.length > 0){
      showToast('La Unidad de Negocio seleccionada ya se encuentra asociada', 'error');
    }
  }

  valoresObjetos(obj: string){
    if (obj == 'unAsociadas' || obj == 'todos') {
      const prm = {USUARIO: this._sdatos.USUARIO};
      this._sdatos.consulta('UN ASOCIADAS',prm,'ADM015').subscribe((data: any)=> {
        const res = validatorRes(data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if(res[0].ErrMensaje === ""){
          this.DUNAsociadas = res;
        }else{
          this.opBlanquearForma();
        }
      });
    }
    if (obj == 'UNIDADES NEGOCIOS' || obj == 'todos'){
      const prm = {};
      this._sdatos
        .consulta('UNIDADES NEGOCIOS', prm, 'ADM002')
        .subscribe((data: any) => {
          const res = validatorRes(data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DUnidadesNegocios = res;
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