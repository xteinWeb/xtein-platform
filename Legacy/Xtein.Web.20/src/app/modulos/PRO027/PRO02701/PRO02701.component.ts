import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxDataGridComponent, DxDataGridModule, DxPopupModule } from 'devextreme-angular';
import { Observable, Subject, Subscription } from 'rxjs';
import { PRO025Service } from 'src/app/services/PRO025/PRO025.service';
import { showToast } from '../../../shared/toast/toastComponent.js';

@Component({
  selector: 'app-PRO02701',
  templateUrl: './PRO02701.component.html',
  styleUrls: ['./PRO02701.component.css'],
  standalone: true,
  imports: [ DxPopupModule, DxDataGridModule ]
})
export class PRO02701Component {
  @ViewChild("popUpBodCan", { static: false }) popUpBodCan: DxDataGridComponent;
  @ViewChild("gridBodCan", { static: false }) gridBodCan: DxDataGridComponent;

  DVista: any;
  readonly allowedPageSizes = [5, 10, 20, 50, 100, 'all'];
  archExcelLiq: string = "";
  titVisor: string = "";
  popupVisible = false;
  subscription: Subscription;
  keyBod = ["ID_UN_BODEGA","PRODUCTO","TIPO_INVENTARIO","ATRIBUTO"];

  // Alert de mensajes
  displayModal: boolean = false;
  errMsg: string = "";
  errTit: string = "";
  isVisible = false;
  type = 'info';
  message = 'msg';
  indValidadoExis: boolean = false;
  cantidadAsignar: number;
  configBotonAceptar: any;
  configBotonCancelar: any;
  dataBodegas: any;

  private eventsSubscription: Subscription;
  eventsSubject: Subject<any> = new Subject<any>();

  @Input() events: Observable<any>;
  //@Output() dataBodegasChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() onSeleccCantidad: EventEmitter<any> = new EventEmitter<any>;

  constructor(private _sdatos: PRO025Service, 
              public datepipe: DatePipe) 
  {

    this.configBotonAceptar = {
      icon: 'todo',
      text: 'Aceptar',
      onClick: this.accionPopUp.bind(this, 'aceptar')
    };
    this.configBotonCancelar = {
      icon: 'close',
      text: 'Cancelar',
      onClick: this.accionPopUp.bind(this, 'cancelar')
    };

    this.asyncValidaExis = this.asyncValidaExis.bind(this);
    this.aceptarCambios = this.aceptarCambios.bind(this);
    this.cancelarCambios = this.cancelarCambios.bind(this);
    this.setCantidadValue = this.setCantidadValue.bind(this);
 
  }

  accionPopUp(accion) {

    if (accion === 'aceptar') {
      // Devuelve cantidades, validando primero
      const can = this.dataBodegas.reduce((sum, current) => sum + current.CANTIDAD, 0);
      if (can !== 0) {
        this.onSeleccCantidad.emit(can);
        this.popupVisible = false;
      }
      else {
        showToast('Debe actualizar la cantidad en la bodega seleccionada!')
      }
    }
    else {
      this.popupVisible = false;
      return;
    }

  }


  onToolbarPreparing(e: any) {
    let toolbarItems = e.toolbarOptions.items;
  
    e.toolbarOptions.items.unshift(
      {
          location: 'before',
          template: 'titVisordatos'
      },
      {
        location: 'before',
        widget: 'dxButton',
        options: {
          icon: 'refresh',
          onClick: this.cargarDatos.bind(this)
        }
      }
    );
  }
  aceptarCambios(e: any) {
    // Valida que esté todo completo
    const totCan = this.DVista.reduce((sum: any, item: any) => sum + item.CANTIDAD, 0);
    if (totCan !== this.cantidadAsignar) {
      this.displayModal = true;
      this.errMsg = "No se han completado todas las cantidades necesarias: " + totCan + " vs." + this.cantidadAsignar;
      this.errTit = "Faltan cantidades";
      return;
    }
    const DBodCan = this.DVista.filter((elem: any) => elem.CANTIDAD > 0);
    this.popupVisible = false;
  }
  cancelarCambios(e: any) {
    this.popupVisible = false;
  }

  onEditorPreparing(e: any) {
    if (e.dataField === undefined) return;
    if (e.dataField.match("CANTIDAD") && e.parentType == "dataRow") {
      //   e.editorOptions.onFocusIn = (args: any) => {            
      //     var input = args.element.querySelector(".dx-texteditor-input");  
      //     if(input != null){  
      //         input.select();  
      //     }  
      // };
   }
  }

  onRowValidating(e: any) {
    // Valida inventario
    const prm = { PRODUCTO: e.oldData.PRODUCTO, 
                  CANTIDAD: e.newData.CANTIDAD, 
                  TIPO_INVENTARIO: e.oldData.TIPO_INVENTARIO,  
                  ATRIBUTO: e.oldData.ATRIBUTO,  
                  BODEGAS: [e.oldData.ID_UN_BODEGA] };
    e.promise = this._sdatos.pconsulta('existencias',prm, 'PRO-027')
      .then((result: any) => {
          const res = JSON.parse(result.data);
          e.errorText = res[0].ErrMensaje;
          if (res[0].ErrMensaje !== "") {
            showToast(res[0].ErrMensaje, 'error');
            e.isValid = false;
          }
          else
            e.isValid = true;
      });
  }
  
  // Valida inventario
  asyncValidaExis(params: any) {
    // Valida inventario
    /*return new Promise((resolve, reject) => {
      if (params.value === undefined || this.indValidadoExis) {
        this.indValidadoExis = false;
        resolve("");
        return;
      }
      const prm = { PRODUCTO: params.data.PRODUCTO, CANTIDAD: params.value, BODEGAS: [{ ID_UN_BODEGA: params.data.ID_UN_BODEGA}] };
      this._sdatos.getDatos('VALIDA INVENTARIO',prm).subscribe((data: any)=> {
        const res = JSON.parse(data);
        if (res[0].ErrMensaje != '')
        {
          this.displayModal = true;
          this.errMsg = res[0].ErrMensaje;
          this.errTit = "Validación de inventario";
          reject('Error en existencias');
        }
        else
          resolve("");
        this.indValidadoExis = true;
      });
    });*/

  }

  // Valida datos completos
  updatingRow(e: any) {
    for (let key in e.newData) {
      if ((e.newData[key] === "" || e.newData[key] === null) && key.match("CANTIDAD"))
      {
        this.displayModal = true;
        this.errMsg = 'Cantidad inválida o no definida!';
        this.errTit = "Valores nulos";
        e.cancel = true;
        return;
      }
      // if (key.match("CANTIDAD")) {
      //   const prm = { PRODUCTO: e.oldData.PRODUCTO, 
      //                 CANTIDAD: e.newData.CANTIDAD, 
      //                 TIPO_INVENTARIO: e.oldData.TIPO_INVENTARIO,  
      //                 ATRIBUTO: e.oldData.ATRIBUTO,  
      //                 BODEGAS: [e.oldData.ID_UN_BODEGA] };
      //   this._sdatos.consulta('existencias',prm, 'PRO-027').subscribe((data: any)=> {
      //     const res = JSON.parse(data.data);
      //     e.errorText = res[0].ErrMensaje;
      //     if (res[0].ErrMensaje !== "") {
      //       showToast(res[0].ErrMensaje, 'error');
      //       e.cancel = true;
      //     }
      //     else
      //       e.cancel = false;
      //   });
      // }
    }
  }

  setCantidadValue (rowData: any, value: any, currentRowData: any) {
    rowData.CANTIDAD = value;
  }

  updateRowPro(e: any) {
    // Actualiza BD
    /*this._sdatos.getDatos('ACTUALIZAR PRODUCTOS',e.data).subscribe((data: any)=> {
      const res = JSON.parse(data);
      if (res[0].ErrMensaje != '')
      {
        this.displayModal = true;
        this.errMsg = res[0].ErrMensaje;
        this.errTit = "Error actualización producto";
        return;
      }
      this.type = 'success';
      this.message = "Producto actualizado";
      this.isVisible = true;
    });*/
  }


  onResizeEnd(e: any) {
    let popupHeight = Number(this.popUpBodCan.instance.option("height"))?? 400;
    this.gridBodCan.instance.option("height",popupHeight-100);
  }
  // Seleccion de fila
  onSeleccRegistro(e: any): void {
    this.popupVisible = false;
  }

  cargarDatos(accion: string, producto: string, bodegas: string, atr: string, tinv: string) {
    const prm = { BODEGAS: bodegas, PRODUCTO: producto, ATRIBUTO: atr, TIPO_INVENTARIO: tinv };
    this._sdatos.consulta(accion, prm, "PRO-027").subscribe((data: any)=> {
      const res = JSON.parse(data);
      this.DVista = res;
    });
  }

  ngOnInit(): void {
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      if (datos) {
        this.dataBodegas = datos;
        this.popupVisible = true;
      }
    });

  }
  ngAfterViewInit(): void {   
  }
  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

}
