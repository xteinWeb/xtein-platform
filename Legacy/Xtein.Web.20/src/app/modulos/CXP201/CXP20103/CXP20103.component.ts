import { formatNumber } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxDataGridComponent, DxDataGridModule, DxPopupComponent, DxPopupModule } from 'devextreme-angular';
import dxTextBox from 'devextreme/ui/text_box';
import { Observable, Subscription } from 'rxjs';
import { showToast } from '../../../shared/toast/toastComponent.js';
import Swal from 'sweetalert2';
import { CXP200Service } from '../../../services/CXP200/s_CXP200.service';
import { clsPreEgresos } from '../clsCXP201.class';

@Component({
  selector: 'app-CXP20103',
  templateUrl: './CXP20103.component.html',
  styleUrls: ['./CXP20103.component.css'],
  standalone: true,
  imports: [ DxDataGridModule, DxPopupModule ]
})
export class CXP20103Component {
  @ViewChild("popGenElec", { static: false }) popGenElec: DxPopupComponent;
  @ViewChild("gridGenElec", { static: false }) gridGenElec: DxDataGridComponent;
  

  visiblePopup: boolean = false;
  configBotonAceptar: any;
  configBotonCancelar: any;
  configSeleccFacturas: any;
  DPreEgresos: clsPreEgresos[] = [];
  DEgresos: clsPreEgresos = new clsPreEgresos();
  DDocumentos: any[] = [];
  DBancos: any[] = [];
  popUpLog: any;
  gridLog: any;
  valSelFac: string;
  valorTotEgreso: number;
  textBoxTotSelecc: any;
  titEgresos: string;
  seleccPreEgresos: number[] = [];
  IdAcreedor: any;
  iniGrid: boolean = false;
  private eventsSubscription: Subscription;

  @Input() events: Observable<any>;

  @Input() visible: boolean;

  @Output() onRespuestaSelecc = new EventEmitter<any>;

  
  constructor(private _sdatos: CXP200Service
             ) 
  { 

    this.configBotonAceptar = {
      icon: 'todo',
      text: 'Generar Archivo',
      onClick: this.accionPopUp.bind(this, 'aceptar')
    };
    this.configBotonCancelar = {
      icon: 'close',
      text: 'Cancelar',
      onClick: this.accionPopUp.bind(this, 'cancelar')
    };
    this.configSeleccFacturas = {
      elementAttr: {
        id: "totalSelecc",
        class: "total-selecc"
      },
      readOnly: true,
      onInitialized: this.iniTotalSelecc.bind(this)
    };
  }

  iniTotalSelecc(e) {
    this.textBoxTotSelecc = e.component as dxTextBox;
  }

  accionPopUp(accion) {

    if (accion === 'aceptar') {

      // Validación previa
      var cMsg = '';
      if (this.valorTotEgreso <= 0) {
        cMsg += 'No hay pagos seleccionados de proveedores o el valor a pagar es cero!'
      }
      if (cMsg !== ''){
        this.showModal('','Faltan datos',cMsg);
        return;
      }

      Swal.fire({
        title: '',
        text: 'Desea generar el archivo para pago electrónico?',
        iconHtml: "<i class='icon-alert-ol'></i>",
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#438ef1',
        cancelButtonText: 'No',
        confirmButtonText: 'Sí, generar',
    }).then((result) => {
        if (result.isConfirmed) {
          this.visiblePopup = false;

          // Guarda lista de preparación para pagos
          var prmDatos: any = { GEN_ELEC: this.gridGenElec.instance.getSelectedRowsData()
                              };
          // Si no queda seleccionada, retornar solo el proveedor
          if (prmDatos.length === 0)
            prmDatos = [{ ID_ACREEDOR: this.IdAcreedor, ESTADO: "eliminar" }];
          this.onRespuestaSelecc.emit({ accion, data: prmDatos })
        }
      });
  
    }

    if (accion === 'cancelar') {
      this.visiblePopup = false;
    }

    return;

  }

  onShown(e: any) {
  }
  onHidden(e:any) {
    this.visiblePopup = false;
  }
  onInitializedPopUp(e: any) {
    this.popUpLog = e.component;
  }
  onInitializedGrid(e: any) {
    this.gridLog = e.component;
  }
  onResizeEnd(e: any) {
    //let popupHeight = Number(this.popUpVisor.instance.option("height"))?? 400;
    let popupHeight = Number(this.popUpLog.option("height"))?? 400;
    this.gridLog.option("height",popupHeight-100);
  }

  onSelectionFact(e) {
    if (!this.gridGenElec) return;
    var keys = e.selectedRowKeys;

    var valSelecc: number = 0;
    e.selectedRowsData.forEach(fac => {
      valSelecc += fac.VALOR;
    });
    this.valorTotEgreso = valSelecc;
    this.valSelFac = formatNumber(valSelecc, 'en-US', '1.2-2');
    this.textBoxTotSelecc.option('value',this.valSelFac);
    this.gridGenElec.instance.cancelEditData();
    this.gridGenElec.instance.refresh();

  }

  onEditingStart(e) {
    // No permitir editar si no está seleccionada
    const seleccRows = e.component.getSelectedRowKeys();
    if (seleccRows.indexOf(e.key) === -1) {
      e.cancel = true;
      // this.gridDatos.instance.cancelEditData();
    }
  }

  // Si hubo cambios, señalar
  onCellPrepared(e: any) {
    if(e.rowType === "data" && e.column.dataField === "SALDO" ) {
      const rowSel = this.gridGenElec.instance.getSelectedRowKeys();
      if ( rowSel.indexOf(e.data.ITEM) !== -1 ) {
        e.cellElement.style.background = "#ffe1d5" 
      }
    }
  }


  templateHtml(columna): string {
    let cad = "";
    const col = "BANCO";
    if (columna.row.data.items !== null) {
      if (columna.row.data.items.length !== 0)
        cad = cad + (cad !== "" ? " " : "") + columna.row.data.items[0][col];
    }
    if (columna.row.data.collapsedItems !== undefined) {
      if (columna.row.data.collapsedItems.length !== 0)
        cad = cad + (cad !== "" ? " " : "") + columna.row.data.collapsedItems[0][col];
    }
    return cad;
  }

    // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined){
    
    if (obj == 'egresos para pago electronico' || obj == 'todos') {
    
      const prm = { ID_APLICACION : 'CXP-201', USUARIO: localStorage.getItem('usuario')};
      this._sdatos
        .consulta('egresos para pago electronico', prm, 'CXP-201')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DPreEgresos = res;
          this.seleccPreEgresos = [];
        });
    }

  }  

  ngOnInit(): void { 

    this.eventsSubscription = this.events.subscribe((datos: any) => {
      if (datos.accion == 'activar') {
        this.visiblePopup = true;
        this.titEgresos = "Egresos para pago electrónico";
        this.valoresObjetos('todos');

        // Inicialización de datos
        this.valorTotEgreso = 0;

      }
    });
  }

  ngOnDestroy(){
    this.eventsSubscription.unsubscribe();
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
