import { NgModule, Component, OnInit, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxTemplateModule } from 'devextreme-angular';
import Swal from 'sweetalert2';
import { Subject, Subscription, takeUntil } from 'rxjs';
import  {clsPermisosEspeciales} from '../clsADM015.class';
import { ADM015Service } from 'src/app/services/ADM015/ADM015.service';
import notify from 'devextreme/ui/notify';
import { validatorRes } from 'src/app/shared/validator/validator';

@Component({
  selector: 'app-ADM01502',
  templateUrl: './ADM01502.component.html',
  styleUrls: ['./ADM01502.component.css'],
  standalone: true,
  imports: [DxDataGridModule, DxButtonModule]
})
export class ADM01502Component implements OnInit {
  @ViewChild("gridPermisosEspeciales", { static: false }) gridPermisosEspeciales: DxDataGridComponent;

  public _unsubscribeAll: Subject<any>;

    // Variables fijas de la aplicación
    subscription: Subscription;
    unSubscribe: Subject<boolean> = new Subject<boolean>();
    mnuAccion: string;
    VDatosReg: any;
    readOnly: boolean = false;
    esEdicion: boolean = false;
    focusedRowIndex: number;
    focusedRowKey: string;
  
    // Variables de datos
    DPermisosEspeciales: clsPermisosEspeciales[];
  
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
    .getObs_UsuarioPermisosEspeciales()
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
        this.valoresObjetos('permisosEspeciales');
        break;

      default:
        break;
    }
  }

  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'new':
        this.gridPermisosEspeciales.instance.addRow();
        this.rowApplyChanges = true;
        this._sdatos.M_esEdicionPermisosEspeciales = true;
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this._sdatos.M_esEdicionPermisosEspeciales = true;
        break;
      case 'save':
        this.gridPermisosEspeciales.instance.saveEditData();
        this.rowNew = true;
        break;
      case 'cancel':
        this.gridPermisosEspeciales.instance.cancelEditData();
        this.rowApplyChanges = false;
        this._sdatos.M_esEdicionPermisosEspeciales = false;
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
              const index = this.DPermisosEspeciales.findIndex(a => a.ITEM === key);
              this.DPermisosEspeciales.splice(index, 1);
            });
            this.gridPermisosEspeciales.instance.refresh();
          }
        });
        break;

      default:
        break;
    }
  }

  opPrepararNuevo() {
    this.esEdicion = true;
    this.valoresObjetos('permisosEspeciales');
  }

  opPrepararModificar() {
    this.esEdicion = true;
  }

  opPrepararGuardar(accion:any) {
    this._sdatos.D_PermisosEspeciales = this.DPermisosEspeciales;
    this._sdatos.M_esEdicionPermisosEspeciales = false;
    this.esEdicion = false;
  }

  opEliminar() {}
  opPrepararBuscar(oper:any) {}

  opBlanquearForma() {
    this.DPermisosEspeciales = [{
      ITEM: 0,
      ID_UN: '',
      USUARIO: '',
      TRANSACCION: '',
      NOMBRE: '',
      PERMISO: false,
      APROBACION: false
    }]
  }

  opIrARegistro(acc:any) {
    this.valoresObjetos('permisosEspeciales');
  }

  initNewRow(e:any){
    e.data.ID_UN = '';
    e.data.USUARIO = '';
    e.data.TRANSACCION = '';
    e.data.NOMBRE = '';
    e.data.PERMISO = false;
    e.data.APROBACION = false;
    if (this.DPermisosEspeciales.length > 0) {
      const item = this.DPermisosEspeciales.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    e.data.isEdit = false;
  }

  insertingRow(e:any) {
    e.data.isEdit = true;
  }

  insertedRow(e:any){
    this._sdatos.D_PermisosEspeciales= this.DPermisosEspeciales;
    this._sdatos.M_esEdicionPermisosEspeciales = false;
  }

  updatingRow(e:any) {
    // e.data.isEdit = true;
  }

  removedRow(e:any) {
    // Copia al servicio
    this._sdatos.D_Autorizaciones= this.DPermisosEspeciales;
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

  onRowValidating(e: any) {}

  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  valoresObjetos(obj: string){
    if ((obj == 'permisosEspeciales' || obj == 'todos') && this._sdatos.USUARIO != '') {
      const prm = {USUARIO: this._sdatos.USUARIO};
      this._sdatos.consulta('PERMISOS ESPECIALES',prm,'ADM015').subscribe((data: any)=> {
        const res = validatorRes(data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if(res[0].ErrMensaje === ""){
          this.DPermisosEspeciales = res;
        }else{
          this.opBlanquearForma();
        }
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
}

@NgModule({
  imports: [
    DxDataGridModule,
    DxTemplateModule,
  ]
})
export class AppModule { }