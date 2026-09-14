import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxPopupModule, DxSpeedDialActionModule } from 'devextreme-angular';
import { Observable, Subject, Subscription, lastValueFrom } from 'rxjs';
import { COM203Service } from 'src/app/services/COM203/COM203.service';
import Swal from 'sweetalert2';
import { clsMovimientos, clsSerialesMov } from '../clsCOM203.class';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-COM20303',
  templateUrl: './COM20303.component.html',
  styleUrls: ['./COM20303.component.css'],
  standalone: true,
  imports: [ DxPopupModule, DxDataGridModule, DxButtonModule, DxSpeedDialActionModule,
             CommonModule
           ]
})
export class COM20303Component {

  @ViewChild('gridSeriales', { static: false }) gridSeriales: DxDataGridComponent;

  datosConfigGrid: any;
  DSeriales: clsSerialesMov[] = [];
  popWidth: number = 600;
  popHeight: number = 400;
  popupVisible: boolean = false;
  popUpGrid: any;
  rowsSelectedGrid: any;
  selectedRowIndex = -1;
  readOnly: boolean;
  serial: string = "";

  editOnkeyPress = true;
  enterKeyAction: any = 'moveFocus';
  enterKeyDirection: any = 'column';

  // Operaciones de grid
  accionesRow: any = { new: false, edit: false, delete: false, save: false, cancel: false, copy: false };
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowCopy: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  popupOperRow: boolean = false;
  filasSelecc: any[] = [];
  esNuevaFila: boolean = false;
  esVisibleSelecc: string = 'none';
  ltool: any;
  usuario: string;
  cumpleReqItems: string;
  esEdicion: boolean = false;
  
  private eventsSubscription: Subscription;
  eventsSubjectSbox: Subject<any> = new Subject<any>();

  @Input() events: Observable<any>;

  @Output() onRespuestaSeriales = new EventEmitter<any>;
  @Input() DMovimientos: clsMovimientos;
  @Output() DMovimientosChange: EventEmitter<clsMovimientos> = new EventEmitter<clsMovimientos>();

  constructor(private _sdatos: COM203Service,
    ) 
  {
    this.initNewRow = this.initNewRow.bind(this);
  }

  onShown(e:any) {

    // if (this.datosConfigGrid.style) {
    //   if (this.datosConfigGrid.style.width) {
    //     this.popWidth = this.datosConfigGrid.style.width;
    //   }
    //   if (this.datosConfigGrid.style.height) {
    //     this.popHeight = this.datosConfigGrid.style.height;
    //   }
    // }
    // else {
    //   this.popWidth = 600;
    //   this.popHeight = 400;
    // }

  }
  onHidden(e:any) {
    this.popupVisible = false;
  }
  onInitializedPopUp(e: any) {
    this.popUpGrid = e.component;
  }
  onResizeEnd(e: any) {
    setTimeout(() => {
    }, 300);
  }

  cerrarLista(e, accion, templateData) {
    if (accion === 'aceptar') {
      const datprm = { rowsSelected: this.rowsSelectedGrid, 
                       accion
                     }
      this.onRespuestaSeriales.emit(datprm);
    }
    else {
      const datprm = { accion } 
      this.onRespuestaSeriales.emit(datprm);
      this.DSeriales = [];
    }
    this.popupVisible = false;
  }

  onSelectionChanged(e) {
    var keys = e.selectedRowKeys;
    this.selectedRowIndex = e.component.getRowIndexByKey(e.selectedRowKeys[0]);
  }

  // Valida datos necesarios para operar los items o al guardar
  async validarRequisitosMov()  {

    // Dependiendo del movimiento y el tipo, validar datos completos
    this.cumpleReqItems = "";
    const resValid = await new Promise((resolve, reject) => {

      // Valida existencia
      const prm = { SERIAL: this.serial };
      const apiRest = this._sdatos.consulta('existencia serial', prm, "COM-203");
      let res = lastValueFrom(apiRest, {defaultValue: true});
      res = JSON.parse(res["data"]); 
      if (res[0].ErrMensaje === '') {
        this.cumpleReqItems = res[0].ErrMensaje;
      }

      // Resuelve
      if (this.cumpleReqItems !== "") {
        resolve (false);
      }
      else {
        resolve (true);
      };
    });

    // Responda
    if (resValid)
      return (true);
    else
      return (false);

  }
  // Operaciones sobre la grid
  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        // Valida requisitos
        this.gridSeriales.instance.addRow();
        this.rowApplyChanges = true;
        this.rowNew = false;
        this.esVisibleSelecc = 'none';
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this.esVisibleSelecc = 'none';
        break;
      case 'save':
        let valido = this.validarRequisitosMov();
        if (this.cumpleReqItems === "") {
          this.gridSeriales.instance.saveEditData();
          this.rowApplyChanges = false;
          this.rowNew = true;
          this.esVisibleSelecc = 'always';
          this.gridSeriales.instance.deselectAll();    
        }
        else {
          this.cumpleReqItems = this.cumpleReqItems.replace(/[|]/g,"<br>");
          this.showModal("","Faltan datos",this.cumpleReqItems);
        }
        break;
      case 'cancel':
        this.gridSeriales.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.esVisibleSelecc = 'always';
        this.gridSeriales.instance.deselectAll();    
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
              const index = this.DSeriales.findIndex(a => a.ITEM === key);
              this.DSeriales.splice(index, 1);
            });
            this.gridSeriales.instance.refresh();
          }
        });
        break;

      default:
        break;
    }
  }

  initNewRow(e){
    e.data.ITEM = 0;
    e.data.SERIAL = '';
    e.data.PRODUCTO = '';
    if (this.DSeriales.length > 0) {
      const item = this.DSeriales.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    e.data.isEdit = true;
  }
  insertedRow(e){
    this.rowNew = true;
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
    this.gridSeriales.instance.deselectAll();    
  }
  insertingRow(e) {
    e.data.isEdit = false;
  }
  removedRow(e) {
    this.rowApplyChanges = false;
  }
  updatedRow(e){
    this.rowNew = true;
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
    this.gridSeriales.instance.deselectAll();    
  }
  updatingRow(e) {
    if (e.oldData === undefined)
      return;
    e.oldData.isEdit = false;
  }
  onEditingStart(e) {
    this.esVisibleSelecc = 'none';
    this.rowApplyChanges = true;
    e.data.isEdit = true;
  }

  onCellHoverChanged(e) {
    if (e.rowType === "data" && e.column.dataField) {
      if (e.column.dataField.match("operacion")) {
        if (e.eventType === "mouseover") {
          this.popupOperRow = true;
            // this.toolTip.instance.show(this.TooltipTarget);
        } else {
          // this.popupOperRow = false;
            // this.toolTip.instance.hide();
        }
      }
    }
  }
  onContentReady(e) {  
    e.component.columnOption("command:edit", "visible", false);  
  }
  onRowPrepared(e) {
    if (e.rowType === "data") {
      if (!e.isEditing && e.data.isEdit) 
        {
          this.rowNew = true;
          this.esVisibleSelecc = 'always';
          this.rowApplyChanges = false;
          e.data.isEdit = false;
        }
    }
  }


  onShowing(e: any) {  
    var content = e.component.content();  
    if (!content.classList.contains("xs-content-bar-edit")) {  
      content.classList.add("xs-content-bar-edit");  
      content.style.width = "60px";
    }  
  }  

  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined){

    if (obj == 'consulta' ) {
      const prm = {  };
      this._sdatos.consulta('seriales movimiento', prm, 'COM-203').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }

        // Asigna datos de acuerdo al movimiento y la transacción
        if (res[0].ErrMensaje === '')
          this.DSeriales = res;
        else
          this.DSeriales = [];

      });
    }
  }

  // Activa campos de la forma para edición 
  // dependiendo de la acción a realizar
  activarEdicion(accion) {
    switch (accion) {
      case 'consulta':
      case 'inactivo':
        this.esVisibleSelecc = 'none';
        this.readOnly = true;
        break;
      case 'activo':
      case 'nuevo':
        this.esVisibleSelecc = 'always';
        this.popupVisible = true;
        this.rowApplyChanges = false;
        this.esEdicion = true;
        this.rowNew = true;
      break;
    
      default:
        break;
    }
  }

  ngOnInit(): void {
    // this.DMovimientos = new clsMovimientos();
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.operacion) {
        case 'nuevo':
          break;
      
        case 'ini':
          this.readOnly = true;
          break;
      
        case 'consulta':
          break;

        default:
          break;
      }
      this.activarEdicion(datos.operacion);

      // Inicializa datos
      this.valoresObjetos('todos');

      // setTimeout(() => {
      //   this.gridSeriales.instance.columnOption(1, "visible", this.rowApplyChanges); 
      // }, 300);

    });

  }

  ngOnDestroy(){
    if (this.eventsSubscription) this.eventsSubscription.unsubscribe();
  }

  showModal(mensaje: any, titulo = '¡Error!', msg_html= '') {
    const tipo = titulo;
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo==='Error' ? 'DF3E3E':'#0F4C81 !important',
			title: titulo,
			text: mensaje,
			allowOutsideClick: true,
			allowEscapeKey: false,
			allowEnterKey: false,
			backdrop: true,
			position: 'center',
      html: msg_html,
			stopKeydownPropagation: false,
		});
	}

}
