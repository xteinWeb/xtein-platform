import { NgModule, Component, OnInit, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxSwitchModule, DxTemplateModule } from 'devextreme-angular';
import Swal from 'sweetalert2';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { clsSAplicaciones } from '../clsADM015.class';
import { ADM015Service } from 'src/app/services/ADM015/ADM015.service';
import notify from 'devextreme/ui/notify';
import { validatorRes } from 'src/app/shared/validator/validator';

import { showToast } from '../../../shared/toast/toastComponent.js'


@Component({
    selector: 'app-ADM01505',
    templateUrl: './ADM01505.component.html',
    styleUrls: ['./ADM01505.component.css'],
    imports: [DxDataGridModule, DxDropDownBoxModule, DxSwitchModule, DxButtonModule]
})
export class ADM01505Component implements OnInit {
  @ViewChild("gridPMS", { static: false }) gridPMS: DxDataGridComponent;

  public _unsubscribeAll: Subject<any>;

  // Variables fijas de la aplicación
  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = false;
  esEdicion: boolean = false;
  isGridBoxOpened: boolean;
  gridBoxAplicaciones: any[] = [];
  focusedRowIndex: number;
  focusedRowKey: string;
  templateGroup: any = ['ID_APLICACION'];

  // Variables de datos
  DSAplicaciones: clsSAplicaciones[] = [];
  SAplicaciones: clsSAplicaciones[] = [];

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
        const prm = { USUARIO: this._sdatos.USUARIO };
        this.valoresObjetos('settings aplicacion', prm);
        break;

      case "r_refrescar":
        break;

      default:
        break;
    }
  }

  operGrid(e: any, operacion: any) {
    switch (operacion) {
      case 'new':
        this.gridBoxAplicaciones = [];
        this.gridPMS.instance.addRow();
        this.rowApplyChanges = true;
        this._sdatos.M_esEdicionAplicaciones = true;
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this._sdatos.M_esEdicionAplicaciones = true;
        break;
      case 'save':
        this.gridPMS.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        break;
      case 'cancel':
        this.gridPMS.instance.cancelEditData();
        this.rowApplyChanges = false;
        this._sdatos.M_esEdicionAplicaciones = false;
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
              const index = this.DSAplicaciones.findIndex(a => a.ITEM === key);
              this.DSAplicaciones.splice(index, 1);
            });
            this.gridPMS.instance.refresh();
          }
        });
        break;

      default:
        break;
    }
  }

  opPrepararModificar() {
    this.esEdicion = true;
  }

  opPrepararGuardar(accion: any) {
    this._sdatos.D_Aplicaciones = this.SAplicaciones;
    this._sdatos.M_esEdicionAplicaciones = false;
    this.esEdicion = false;
  }

  opBlanquearForma() {
    this.DSAplicaciones = [{
      ITEM: 0,
      ID_APLICACION: '',
      NOMBRE_APLICACION: '',
      ASIGNAR: false,
      DESCRIPCION: ''
    }]
  }

  opIrARegistro(acc: any) {
    const prm = { USUARIO: this._sdatos.USUARIO };
    this.valoresObjetos('settings aplicacion', prm);
  }

  opPrepararBuscar(oper: any) { }
  opEliminar() { }

  initNewRow(e: any) {
    e.data.ITEM = 0;
    e.data.ID_APLICACION = '';
    e.data.NOMBRE_APLICACION = '';
    e.data.DESCRIPCION = '';
    e.data.ASIGNAR = false;
    if (this.DSAplicaciones.length > 0) {
      const item = this.DSAplicaciones.reduce((ant, act) => { return (ant.ITEM > act.ITEM) ? ant : act })
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    e.data.isEdit = false;
  }

  updatingRow(e: any) {
    let newData = {
      ...e.oldData,
      ASIGNAR: e.newData.ASIGNAR
    }
    let indice = this.SAplicaciones.findIndex(data => data.ITEM === newData.ITEM);

    if (indice !== -1) {
      this.SAplicaciones.splice(indice, 1); // Elimina el objeto en esa posición
      for (let i = 0; i < this.DSAplicaciones.length; i++) {
        let element = this.DSAplicaciones[i];
        if (element.ID_APLICACION === newData.ID_APLICACION && element.DESCRIPCION === newData.DESCRIPCION) {
          this.DSAplicaciones[i] = newData
        }
      }
    } else {
      this.SAplicaciones.push(newData)
      for (let i = 0; i < this.DSAplicaciones.length; i++) {
        let element = this.DSAplicaciones[i];
        if (element.ID_APLICACION === newData.ID_APLICACION && element.DESCRIPCION === newData.DESCRIPCION) {
          this.DSAplicaciones[i] = newData
        }
      }
    }
  }

  onFocusOutConexion(e: any, cellInfo: any) {
    if (cellInfo.data) {
      cellInfo.data.ID_APLICACION = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onSelectionConexion(e: any) {
    if (e.name === 'value') {
      this.isGridBoxOpened = false;
    }
    if (e.value != null && e.value.length > 0 && e.name === 'displayValue') {
      this.filterConexion(e.value[0])
    }
  }

  onSeleccRowConexion(e: any, cellInfo: any, datacompo: any) {
    if (e.data) {
      cellInfo.data.ID_APLICACION = e.data.ID_APLICACION;
      cellInfo.data.NOMBRE = this._sdatos.D_Aplicaciones.find((p: any) => p.ID_APLICACION === cellInfo.data.ID_APLICACION).NOMBRE;
      this.gridPMS.instance.cellValue(cellInfo.rowIndex, "ID_APLICACION", cellInfo.data.NOMBRE);
      datacompo.close();
      this.gridBoxAplicaciones = cellInfo.data.ID_APLICACION;
      this.isGridBoxOpened = false;
    }
  }

  onValueChangedConexion(e: any, cellInfo: any) {
    cellInfo.setValue(e.value);
  }

  filterConexion(ID_APLICACION: any) {
    const conexion = this.DSAplicaciones.filter(el => el.ID_APLICACION === ID_APLICACION)
    if (conexion.length > 0) {
      this.toaMessage = 'La Conexión seleccionada ya se encuentra asociada';
      this.toaTipo = 'error';
      showToast('La Conexión seleccionada ya se encuentra asociada', 'error');
    }
  }

  valoresObjetos(obj: string, data: any) {
    if (obj == 'settings aplicacion' || obj == 'todos') {
      const prm = data;
      this._sdatos.consulta('settings_aplicacion', prm, 'ADM015').subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje === "") {

          if (this.DSAplicaciones.length > 0) {
            if (res[0].ID_APLICACION !== null && res[0].ID_APLICACION !== undefined) {
              res.forEach((newData: any) => {
                let indice = this.DSAplicaciones.findIndex(data => data.ID_APLICACION === newData.ID_APLICACION && data.DESCRIPCION === newData.DESCRIPCION);
                if (indice !== -1) {
                  this.DSAplicaciones[indice] = newData
                  
                }
              })
              this.SAplicaciones = res
            } else {
              let newArray: any[] = [];
              this.DSAplicaciones.forEach((newData: any) => {
                newData.ASIGNAR = false;
                newArray.push(newData);
              })
              this.DSAplicaciones = newArray;
              this.SAplicaciones = []
            }
          } else {
            this.DSAplicaciones = res;
          }
        } else {
          this.opBlanquearForma();
        }
      });
    }
  }

  showToast(message: any, type: any, offset: any) {
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
      type, 4500);
  }

  ngOnInit(): void {
    this.DSAplicaciones = this._sdatos.DSAplicaciones;
    this.operCompo({ accion: this._sdatos.accion });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  showModal(mensaje: any, titulo = '¡Error!', msg_html = '') {
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


  templateHtml(columna:any, element:any): any {
    let cad = [{ ID_APLICACION: '', NOMBRE_APLICACION: ''}];
    let res:any='';
    this.templateGroup.forEach((col:any) => {
      if (columna.row.data.items !== null) {
        cad[0].ID_APLICACION = columna.row.data.items[0].ID_APLICACION;
        cad[0].NOMBRE_APLICACION = columna.row.data.items[0].NOMBRE_APLICACION;
        switch (element) {
          case 'ID_APLICACION':
            res = cad[0].ID_APLICACION;
            break;
          case 'NOMBRE_APLICACION':
            res = cad[0].NOMBRE_APLICACION;
            break;
          default:
            break;
        }
      }
      if (columna.row.data.collapsedItems !== undefined) {
        cad[0].ID_APLICACION = columna.row.data.collapsedItems[0].ID_APLICACION;
        cad[0].NOMBRE_APLICACION = columna.row.data.collapsedItems[0].NOMBRE_APLICACION;
        switch (element) {
          case 'ID_APLICACION':
            res = cad[0].ID_APLICACION;
            break;
          case 'NOMBRE_APLICACION':
            res = cad[0].NOMBRE_APLICACION;
            break;
          default:
            break;
        }
      }
    });
    return res;
  }
}