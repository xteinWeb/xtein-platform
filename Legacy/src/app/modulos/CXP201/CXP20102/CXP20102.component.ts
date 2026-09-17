import { formatNumber } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxDataGridComponent, DxDataGridModule, DxFormModule, DxPopupComponent, DxPopupModule, DxSelectBoxModule } from 'devextreme-angular';
import dxTextBox from 'devextreme/ui/text_box';
import { Observable, Subscription } from 'rxjs';
import { showToast } from '../../../shared/toast/toastComponent.js';
import Swal from 'sweetalert2';
import { CXP200Service } from '../../../services/CXP200/s_CXP200.service';
import { clsPreEgresos } from '../clsCXP201.class';

@Component({
  selector: 'app-CXP20102',
  templateUrl: './CXP20102.component.html',
  styleUrls: ['./CXP20102.component.css'],
  standalone: true,
  imports: [ DxDataGridModule, DxPopupModule, DxFormModule, DxSelectBoxModule ]

})
export class CXP20102Component {
  @ViewChild("popGenEgreso", { static: false }) popGenEgreso: DxPopupComponent;
  @ViewChild("gridGenEgreso", { static: false }) gridGenEgreso: DxDataGridComponent;
  

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
      text: 'Generar Egreso',
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
      if (this.DEgresos.DOCUMENTO == '' || this.DEgresos.BANCO == '') {
        cMsg = 'Falta escoger el documento o el banco para el egreso!<br >'
      }
      if (this.valorTotEgreso < 0) {
        cMsg += 'No hay pagos seleccionados de proveedores o el valor a pagar es cero!'
      }
      if (cMsg !== ''){
        this.showModal('','Faltan datos',cMsg);
        return;
      }

      Swal.fire({
        title: '',
        text: 'Desea generar los egresos para los proveedores seleccionados?',
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
          var prmDatos: any = { PAGOS_PROV: this.gridGenEgreso.instance.getSelectedRowsData(),
                                PRM_EGRESO: this.DEgresos
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
    if (!this.gridGenEgreso) return;
    var keys = e.selectedRowKeys;

    var valSelecc: number = 0;
    e.selectedRowsData.forEach(fac => {
      valSelecc += fac.VALOR;
    });
    this.valorTotEgreso = valSelecc;
    this.valSelFac = formatNumber(valSelecc, 'en-US', '1.2-2');
    this.textBoxTotSelecc.option('value',this.valSelFac);
    this.gridGenEgreso.instance.cancelEditData();
    this.gridGenEgreso.instance.refresh();

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
      const rowSel = this.gridGenEgreso.instance.getSelectedRowKeys();
      if ( rowSel.indexOf(e.data.ITEM) !== -1 ) {
        e.cellElement.style.background = "#ffe1d5" 
      }
    }
  }

  updatedRow(e){
    var selectedRowsData = this.gridGenEgreso.instance.getSelectedRowsData();
    var valSelecc: number = 0;
    selectedRowsData.forEach(fac => {
      valSelecc += fac.SALDO;
    });
    this.valSelFac = formatNumber(valSelecc, 'en-US', '1.2-2');
    this.textBoxTotSelecc.option('value',this.valSelFac);
  }

  onRowValidating(e: any) {
    // Valida completitud
    var errMsg = '';
    if (e.newData.SALDO === 0) 
      errMsg = 'Valor no puede ser cero!';
    if (e.oldData.VALOR < e.newData.SALDO) 
      errMsg = 'Valor a pagar es superior al valor de la factura!';
    if (e.newData.SALDO < 0) 
      errMsg = 'Cantidad no puede ser negativo!';
    if (errMsg !== '') {
      e.isValid = false;
      showToast(errMsg, 'error');
      this.gridGenEgreso.instance.cancelEditData();
      this.DPreEgresos.find(f => f.ITEM === e.key)!.SALDO = this.DPreEgresos.find(f => f.ITEM === e.key)!.VALOR;
      return;
    }
  }


  templateHtml(columna): string {
    let cad = "";
    const col = "ORIGEN";
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

  onSeleccDocumento(e) {
    this.DEgresos.DOCUMENTO = e.value;
  }
  onSeleccBanco(e) {
    this.DEgresos.BANCO = e.value;
  }

  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined){
    
    if (obj == 'documento' || obj == 'todos') {
    
      const prm = { ID_APLICACION : 'FIN-012', USUARIO: localStorage.getItem('usuario')};
      this._sdatos
        .consulta('DOCUMENTOS CONSECUTIVO', prm, 'CXP-201')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DDocumentos = res;
        });
    }

    if (obj == 'banco' || obj == 'todos') {
    
      const prm = { ID_APLICACION : 'FIN-204', USUARIO: localStorage.getItem('usuario')};
      this._sdatos
        .consulta('BANCOS', prm, 'CXP-201')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DBancos = res;
        });
    }
    
    if (obj == 'pre egreso' || obj == 'todos') {
    
      const prm = { ID_APLICACION : 'CXP-201', USUARIO: localStorage.getItem('usuario')};
      this._sdatos
        .consulta('pre egreso', prm, 'CXP-201')
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
        this.titEgresos = "Proveedores por pagar";
        this.valoresObjetos('todos');

        // Inicialización de datos
        this.DEgresos.DOCUMENTO = '';
        this.DEgresos.BANCO = '';
        this.DEgresos.GENERA_ELEC = false;
        this.valorTotEgreso = 0;

        // Consulta el histórico de transacciones sobre la orden de compra
        // this._sdatos.consulta('pre egreso proveedores',{ ID_ACREEDOR: datos.ID_ACREEDOR },'CXP-201').subscribe((data: any) => {
        //   const res = JSON.parse(data.data);
        //   if ( (data.token != undefined) ){
        //     const refreshToken = data.token;
        //     localStorage.setItem("token", refreshToken);
        //   }
        //   this.DPreEgresos = res;

        //   // Marcar las que están con pre-egreso
        //   this.seleccPreEgresos = this.DPreEgresos.filter(p => p.ES_PRE_EG).map(s => s.ITEM);
        //   var sumPre = this.DPreEgresos.filter(p => p.ES_PRE_EG).reduce((total, valor) => {
        //     return total + valor.SALDO
        //   },0);
        //   this.valSelFac = formatNumber(sumPre, 'en-US', '1.2-2');
        //   this.textBoxTotSelecc.option('value',this.valSelFac);
        //   this.iniGrid = true;
      
        // });
  
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
