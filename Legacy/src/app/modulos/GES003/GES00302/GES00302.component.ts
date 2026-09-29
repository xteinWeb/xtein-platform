import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { clsCargos } from '../clsGES003.class';
import { CommonModule } from '@angular/common';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { GES003Service } from 'src/app/services/GES003/GES003.service';
import { GES00Service } from 'src/app/shared/Tareas/Service/GES00.service';
import { Subscription } from 'rxjs';
import notify from 'devextreme/ui/notify';
import Swal from 'sweetalert2';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { showToast } from '../../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-ges00302',
  templateUrl: './GES00302.component.html',
  styleUrls: ['./GES00302.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxButtonModule, DxSelectBoxModule, DxTextBoxModule, DxDropDownBoxModule]
})
export class GES00302Component {

  @ViewChild("gridResponsablesCargo", { static: false }) gridResponsablesCargo: DxDataGridComponent;
  
  @Input() APLICACION: string;
  @Input() Datos: clsCargos;
  @Output() DatosResponsables = new EventEmitter<any>;

  subscription: Subscription;
  sub_Responsables: Subscription;
  DResponsables: any [] = [];
  DResponsablesCargo: any[] = [];
  conCambios: number = 0;

  openDropResponsable: boolean = false;
  openDropEstado: boolean = false;
  DlEstados: any = ["ACTIVO","INACTIVO"];
  selectResponsable: any[] = [];

  // Operaciones de grid
  accion:string = '';
  readOnly: boolean = true;
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  esVisibleSelecc: string = 'onClick';
  filasSelecc: any[] = [];
  
  constructor(
    private _sdatos: GES003Service,
    private _sgenerales: GeneralesService,
    private Ges00Service: GES00Service
  ) {

    // this.subscription = this.Ges00Service.getObsActividades().subscribe((data:any) => {
    //   switch (data.accion) {
    //     case 'cargar datos':
    //       this.loadData(data.Datos);
    //       break;
      
    //     default:
    //       break;
    //   }
    // });

    this.sub_Responsables = 
    this._sdatos.getObsResponsables().subscribe((data:any) => {
      switch (data.accion) {
        case 'new':
          this.accion = 'nuevo';
          this.DResponsablesCargo = [];
          this.readOnly = data.readOnly;
          this.gridResponsablesCargo.instance.refresh();
          break;

        case 'copiar':
          this.accion = 'copiar';
          this.readOnly = data.readOnly;
          this.gridResponsablesCargo.instance.refresh();
          break;

        case 'update':
          this.accion = 'update';
          this.readOnly = data.readOnly;
          break;

        case 'cargar datos':
          this.accion = 'cargar';
          this.readOnly = data.readOnly;
          this.loadData(data.Datos);
          break;

        case 'cancelar':
          this.accion = 'cancelar';
          this.DResponsablesCargo = [];
          this.readOnly = data.readOnly;
          this.gridResponsablesCargo.instance.refresh();
          break;
      
        default:
          break;
      }
    });

  }

  ngOnInit(): void {
    this.DResponsablesCargo = [];
    this.valoresObjetos('todos');
  }

  ngOnDestroy() {
    // this.subscription.unsubscribe();
    this.sub_Responsables.unsubscribe();
  }

  loadData(data:any) {
    this.DResponsablesCargo = data.RESPONSABLES;
    for (let i = 0; i < this.DResponsablesCargo.length; i++) {
      const npos: any = this.DResponsablesCargo[i].NOMBRE.indexOf(" ");
      const name = this.DResponsablesCargo[i].NOMBRE.charAt(0).toUpperCase();
      const lastName = this.DResponsablesCargo[i].NOMBRE.substring(npos + 1, this.DResponsablesCargo[i].NOMBRE.length + 1);
      const Lape = lastName.charAt(0).toUpperCase();
      const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
      this.DResponsablesCargo[i].iconNameUser = newName;
    }
    this.gridResponsablesCargo.instance.refresh();
  }

  initNewRow(e:any) {
    if (this.DResponsablesCargo.length > 0) {
      const item = this.DResponsablesCargo.reduce((ant:any, act:any)=>{return (ant.ITEM > act.ITEM) ? ant : act});
      e.data.ITEM = item.ITEM + 1;
    } else {
      e.data.ITEM = 1;
    }
    e.data.ID_RESPONSABLE = '';
    e.data.NOMBRE = '';
    e.data.FOTO = '';
    e.data.ID_CARGO_CONTRACTUAL = '';
    e.data.NOMBRE_CARGO_CONTRACTUAL = '';
    this.esVisibleSelecc = 'none';
    this._sdatos.M_esEdicionRespo = true;
    this.accion = 'nuevo';
  }

  onInitializedFromResponsables(e:any, data:any) {
    for (let i = 0; i < data.length; i++) {
      const npos: any = data[i].NOMBRE.indexOf(" ");
      const name = data[i].NOMBRE.charAt(0).toUpperCase();
      const lastName = data[i].NOMBRE.substring(npos + 1, data[i].NOMBRE.length + 1);
      const Lape = lastName.charAt(0).toUpperCase();
      const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
      data[i].iconNameUser = newName;
    }
  }

  onSelectionChangedResponsable(e:any, cellInfo:any) {
    this.openDropResponsable = false;
    if((e.selectedRowsData[0] !== null) && (e.selectedRowsData[0] !== undefined) && (e.selectedRowsData[0] !== '' )) {
      //verifica que no se repita:
      if(this.DResponsablesCargo.findIndex((d:any) => d.ID_RESPONSABLE === e.selectedRowsData[0].ID_RESPONSABLE) === -1) {
        cellInfo.data.ID_RESPONSABLE = e.selectedRowsData[0].ID_RESPONSABLE;
        cellInfo.data.NOMBRE = e.selectedRowsData[0].NOMBRE;
        cellInfo.data.FOTO = e.selectedRowsData[0].FOTO;
        cellInfo.data.ID_CARGO_CONTRACTUAL = e.selectedRowsData[0].ID_CARGO_CONTRACTUAL;
        cellInfo.data.NOMBRE_CARGO_CONTRACTUAL = e.selectedRowsData[0].NOMBRE_CARGO_CONTRACTUAL;
        cellInfo.data.iconNameUser = e.selectedRowsData[0].iconNameUser;
      } else {  
        cellInfo.data.ID_RESPONSABLE = '';
        cellInfo.data.NOMBRE = '';
        cellInfo.data.FOTO = '';
        cellInfo.data.ID_CARGO_CONTRACTUAL = '';
        cellInfo.data.NOMBRE_CARGO_CONTRACTUAL = '';
        showToast('El responsable ya esta asignado a este cargo.', 'error');
        return;
      }
    } else {
      cellInfo.data.ID_RESPONSABLE = '';
      cellInfo.data.NOMBRE = '';
      cellInfo.data.FOTO = '';
      cellInfo.data.ID_CARGO_CONTRACTUAL = '';
      cellInfo.data.NOMBRE_CARGO_CONTRACTUAL = '';
      showToast('Debe seleccionar un RESPONSABLE.', 'error');
      return;
    }
    this.conCambios++;
  }

  onValueChangedEstado(e:any, cellInfo:any) {
    cellInfo.data.ESTADO = e.value;
    this.gridResponsablesCargo.instance.cellValue(cellInfo.rowIndex, 'ESTADO', cellInfo.data.ESTADO);
    this.openDropEstado = false;
    this.conCambios++;
  }

  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length === 1)
      this.rowEdit = true;
    else
      this.rowEdit = false;

    if (this.filasSelecc.length !== 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  onRowInserted(e:any) {
    // this.DatosResponsables.emit([e.data]);
    this.DatosResponsables.emit({data: e.data, accion: this.accion});
    this._sdatos.M_esEdicionRespo = false;
  }

  onRowUpdated(e:any) {
    // this.DatosResponsables.emit([e.data]);
    this.DatosResponsables.emit({data: e.data, accion: this.accion});
    this._sdatos.M_esEdicionRespo = false;
  }
  onEditingStart(e:any) {
    this._sdatos.M_esEdicionRespo = true;
    this.selectResponsable = [e.data.ID_RESPONSABLE];
  }

  onRowValidating(e:any) {
    var res:boolean = false;
    if( e.newData !== '' && e.newData !== null && e.newData !== undefined) {
      if(((e.newData.ID_RESPONSABLE !== '' && e.newData.ID_RESPONSABLE !== null && e.newData.ID_RESPONSABLE !== undefined) &&
          (e.newData.NOMBRE !== '' && e.newData.NOMBRE !== null && e.newData.NOMBRE !== undefined)
        ) || (
          (e.oldData.ID_RESPONSABLE !== '' && e.oldData.ID_RESPONSABLE !== null && e.oldData.ID_RESPONSABLE !== undefined) &&
          (e.oldData.NOMBRE !== '' && e.oldData.NOMBRE !== null && e.oldData.NOMBRE !== undefined)
        )
      ){
        e.isValid = true;
        res = true;
        this.rowApplyChanges = false;
        this.rowEdit = false;
        this.rowSave = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'onClick';
        this.accion = 'save';
        return
      } else {
        e.isValid = false;
        this.rowApplyChanges = true;
        this.rowEdit = true;
        this.rowSave = true;
        this.rowNew = false;
        this.esVisibleSelecc = 'none';
        showToast('Debe seleccionar un responsable..', 'error');
        return;
      }

    } else {
      e.isValid = false;
      this.rowApplyChanges = true;
      this.rowEdit = true;
      this.rowSave = true;
      this.rowNew = false;
      showToast('Debe seleccionar un responsable..', 'error');
    }
  }

  // Operaciones de grid
  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'new':
        //valida si la aplicacion activa necesita parametros de entrada antes de agregar la nueva fila.
        if(this.Datos.ID_CARGO === '' || this.Datos.NOMBRE === '') {
          showToast('Falta información del Cargo.', 'error');
          return;
        }
        this.rowApplyChanges = true;
        this.rowNew = false;
        this.accion = 'nuevo';
        this.selectResponsable = [];
        this.gridResponsablesCargo.instance.addRow();
        break;
      case 'update':
        const pos:any = this.DResponsablesCargo.findIndex((d:any) => d.ITEM === this.filasSelecc[0]);
        this.gridResponsablesCargo.instance.editRow(pos);
        this.accion = 'edit';
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this._sdatos.M_esEdicionRespo = true;
        break;
      case 'save':
        this.gridResponsablesCargo.instance.saveEditData();
        break;
      case 'cancel':
        this.accion = 'cancelar';
        this.gridResponsablesCargo.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.selectResponsable = [];
        this._sdatos.M_esEdicionRespo = false;
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
            this.accion = 'eliminar';
            this.filasSelecc.forEach((key) => {
              const index = this.DResponsablesCargo.findIndex(a => a.ITEM === key);
              const infoFila:any = this.DResponsablesCargo[index];
              this.DResponsablesCargo.splice(index, 1);
              this.DatosResponsables.emit({data: infoFila, accion: this.accion});
            });
            this.gridResponsablesCargo.instance.refresh();
						this.conCambios++;
            this.selectResponsable = [];
          }
        });
        break;

      default:
        break;
    }
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, prmObj: any = undefined){
    if (obj == 'responsables' || obj == 'todos' ) {
      const prm = { };
      this._sdatos.getResponsables('RESPONSABLES',prm).subscribe((data: any)=> {
        const res = validatorRes(data);
        if ( (data.token !== undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if(res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
          return;
        }
        for (let i = 0; i < res.length; i++) {
          const npos: any = res[i].NOMBRE.indexOf(" ");
          const name = res[i].NOMBRE.charAt(0).toUpperCase();
          const lastName = res[i].NOMBRE.substring(npos + 1, res[i].NOMBRE.length + 1);
          const Lape = lastName.charAt(0).toUpperCase();
          const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
          res[i].ITEM = i;
          res[i].iconNameUser = newName;
        }
        this.DResponsables = res;

        // Baja las imagenes
        this._sgenerales.bajar_imagen('bajar imagenes', { RESPONSABLES: [{}], 
          params: { comprimir: true, tamX: 300, tamY: 400 } },'spActividades')
          .subscribe({
          next: (varch: any)=> {
            // Adiciona el path en el vector de la galería
            if (varch[0].ErrMensaje === '') {
              this.DResponsables.forEach((eleres) => {
                const ix = varch.findIndex(r => r.etiqueta === eleres.ID_RESPONSABLE);
                if (ix !== -1) {
                  eleres.FOTO = varch[ix].path;
                }
              });
              
              this._sgenerales.D_USUARIOS = JSON.parse(JSON.stringify(this.DResponsables));
            }
          },
          error: (err => {
            this.showModal('Error procesando imagenes: '+err.message);
          })
        });
  
      });
    }

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
