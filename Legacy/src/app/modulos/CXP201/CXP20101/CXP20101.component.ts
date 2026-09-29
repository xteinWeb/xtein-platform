import { formatNumber } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxDataGridComponent, DxDataGridModule, DxPopupComponent, DxPopupModule } from 'devextreme-angular';
import dxTextBox from 'devextreme/ui/text_box';
import { Observable, Subscription } from 'rxjs';
import { CXP200Service } from 'src/app/services/CXP200/s_CXP200.service';
import { showToast } from '../../../shared/toast/toastComponent.js';

@Component({
  selector: 'app-CXP20101',
  templateUrl: './CXP20101.component.html',
  styleUrls: ['./CXP20101.component.css'],
  standalone: true,
  imports: [ DxDataGridModule, DxPopupModule ]
})
export class CXP20101Component {
  @ViewChild("popFactPrv", { static: false }) popFactPrv: DxPopupComponent;
  @ViewChild("gridFactPrv", { static: false }) gridFactPrv: DxDataGridComponent;
  

  visiblePopup: boolean = false;
  configBotonAceptar: any;
  configBotonCancelar: any;
  configSeleccFacturas: any;
  DFacturasProveedor: any;
  popUpLog: any;
  gridLog: any;
  valSelFac: string;
  textBoxTotSelecc: any;
  titFacturasProveedor: string;
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
      text: 'Aceptar',
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

    this.visiblePopup = false;
    if (accion === 'aceptar') {

      // Guarda lista de preparación para pagos
      var prmDatos: any = this.gridFactPrv.instance.getSelectedRowsData();
      // Si no queda seleccionada, retornar solo el proveedor
      if (prmDatos.length === 0)
        prmDatos = [{ ID_ACREEDOR: this.IdAcreedor, ESTADO: "eliminar" }];
      this.onRespuestaSelecc.emit({ accion, data: prmDatos })
  
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
    if (!this.iniGrid) return;
    var keys = e.selectedRowKeys;

    var valSelecc: number = 0;
    e.selectedRowsData.forEach(fac => {
      valSelecc += fac.SALDO;
    });
    this.valSelFac = formatNumber(valSelecc, 'en-US', '1.2-2');
    this.textBoxTotSelecc.option('value',this.valSelFac);
    this.gridFactPrv.instance.cancelEditData();

    // Restablece valor a pagar
    e.currentDeselectedRowKeys.forEach(item => {
      this.DFacturasProveedor.find(f => f.ITEM === item).SALDO = this.DFacturasProveedor.find(f => f.ITEM === item).VALOR;
    });

    this.gridFactPrv.instance.refresh();

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
      const rowSel = this.gridFactPrv.instance.getSelectedRowKeys();
      if ( rowSel.indexOf(e.data.ITEM) !== -1 ) {
        e.cellElement.style.background = "#ffe1d5" 
      }
    }
  }

  updatedRow(e){
    var selectedRowsData = this.gridFactPrv.instance.getSelectedRowsData();
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
    if (e.newData.SALDO < 0 && e.oldData.ORIGEN !== 'Anticipos') 
      errMsg = 'Valor no puede ser negativo!';
    if (errMsg !== '') {
      e.isValid = false;
      showToast(errMsg, 'error');
      this.gridFactPrv.instance.cancelEditData();
      this.DFacturasProveedor.find(f => f.ITEM === e.key).SALDO = this.DFacturasProveedor.find(f => f.ITEM === e.key).VALOR;
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


  ngOnInit(): void { 
    this.iniGrid = false;
    this.DFacturasProveedor = [];
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      if (datos.accion == 'activar') {
        this.visiblePopup = true;
        this.titFacturasProveedor = "Facturas del proveedor por pagar "+datos.ID_ACREEDOR+" "+datos.NOMBRE;
        this.IdAcreedor = datos.ID_ACREEDOR;
        // if (this.gridFactPrv) this.gridFactPrv.instance.deselectAll();
        
        // Consulta el histórico de transacciones sobre la orden de compra
        this._sdatos.consulta('facturas proveedor',{ ID_ACREEDOR: datos.ID_ACREEDOR },'CXP-201').subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DFacturasProveedor = res;

          // Marcar las que están con pre-egreso
          this.seleccPreEgresos = this.DFacturasProveedor.filter(p => p.ES_PRE_EG).map(s => s.ITEM);
          var sumPre = this.DFacturasProveedor.filter(p => p.ES_PRE_EG).reduce((total, valor) => {
            return total + valor.SALDO
          },0);
          this.valSelFac = formatNumber(sumPre, 'en-US', '1.2-2');
          this.textBoxTotSelecc.option('value',this.valSelFac);
          this.iniGrid = true;
      
        });
  
      }
    });
  }

  ngOnDestroy(){
    this.eventsSubscription.unsubscribe();
  }

}
