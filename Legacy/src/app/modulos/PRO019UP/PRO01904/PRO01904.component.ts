import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxNumberBoxModule, DxPopupModule, DxSelectBoxModule, DxTextBoxModule, DxToolbarModule } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import notify from 'devextreme/ui/notify';
import { CommonModule } from '@angular/common';
import { PRO019Service } from 'src/app/services/PRO019/PRO019.service';
import { showToast } from '../../../shared/toast/toastComponent.js'
import { PRO019DataService } from '../SERVICE/pro019.service';
import { PRO0190401Component } from './PRO0190401/PRO0190401.component';

@Component({
  selector: 'app-PRO01904',
  templateUrl: './PRO01904.component.html',
  styleUrls: ['./PRO01904.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxDropDownBoxModule, DxTextBoxModule,
    DxButtonModule, DxNumberBoxModule, DxPopupModule, DxSelectBoxModule, DxToolbarModule, PRO0190401Component
  ]
})
export class PRO01904Component implements OnInit {

  @ViewChild("gridCifMatriz", { static: false }) gridCifMatriz: DxDataGridComponent;
  // @Input() CIFDatos: any;
  @Output() send_totalCIF: EventEmitter<any> = new EventEmitter();
  subscription: Subscription;
  subscriptionModoGrid: Subscription;
  subscriptionRefresh: Subscription;
  // subscriptionRead: Subscription;
  // subscriptionConCambios: Subscription;

  DGcif: any = [];
  DGcif_prev: any = [];
  DGinfoCIF: any = [];
  selectCIF: any = [];
  TipoCIF: any = [];
  selectNewTipoCIF: any = [];
  data_temp: any = [];
  DGCifConsolidado: any [] = [];
  modoGrid: string;

  templateGroup: any = ['ID_PARTE'];
  btnContraer: string = 'Expandir Todo';
  openCIF: boolean = false;
  consultaActiva: boolean = false;
  expandGridCif: boolean = true;
  // conCambios: number = 0;
  totalVariable: number = 0;
  totalFijo: number = 0;

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  maxValor: number = 0.0;
  VALOR_TCD: number;

  // Notificaciones
  toaVisible: boolean = false;
	isChecked = true;
	toaTipo = 'info'
  toaMessage = 'Registro actualizado!';

  constructor(
		private sData: PRO019Service,
    private _sdatos: PRO019DataService
  ) {
    // Recibe de principal
    this.subscription = this._sdatos
      .getDataTiposCif()
      .subscribe((datprm) => {
        this.getDataTiposCif(datprm);
      }
    );
    this.subscriptionModoGrid = this._sdatos
      .getModoGrid()
      .subscribe((datprm) => {
        this.activeModoGrid(datprm);
      }
    );
    this.subscription = this._sdatos
      .getTotalTCDCIF()
      .subscribe((datprm) => {
        // Ejecuta de acuerdo al parámetro
        this.VALOR_TCD = datprm;
        for (let i = 0; i < this.DGinfoCIF.length; i++) {
          this.onCalculateSubTotal([], 0, this.DGinfoCIF[i], i);
        }
    });
    this.subscriptionRefresh = this._sdatos
      .getRefresh()
      .subscribe((datprm) => {
        if (datprm === true)
          this.refresComponent();
      }
    );
    this.onCalculateSubTotal = this.onCalculateSubTotal.bind(this);
    this.onCalculateTotalCIF = this.onCalculateTotalCIF.bind(this);
    this.refresComponent = this.refresComponent.bind(this);
    this.onExpandirMenu = this.onExpandirMenu.bind(this);
  }

  ngOnInit(): void {
    if ( this._sdatos.MATRIZ_CIF.length !== 0) {
      this.TipoCIF = JSON.parse(JSON.stringify(this._sdatos.MATRIZ_CIF));
    };
    this.data_temp = this.TipoCIF;
    // setTimeout(() => {
    //   this.refresComponent();
    // }, 500);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subscriptionModoGrid.unsubscribe();
    this.subscriptionRefresh.unsubscribe();
  }

  onExpandirMenu(e:any) {
    if(this.expandGridCif) {
      this.expandGridCif = !this.expandGridCif;
      this.btnContraer = 'Contraer';
      this.gridCifMatriz.instance.expandAll(-1);
      return;
    };
    if(!this.expandGridCif) {
      this.btnContraer = 'Expandir';
      this.expandGridCif = !this.expandGridCif;
      this.gridCifMatriz.instance.collapseAll(-1);
      return;
    };
  }

  refresComponent() {
    this.TipoCIF = JSON.parse(JSON.stringify(this._sdatos.MATRIZ_CIF));
    // this._sdatos.MATRIZ_DETALLE_CIF = [];
    this.gridCifMatriz.instance.refresh();
  }

  activeModoGrid(e: any) {
    this.DGCifConsolidado = [];
    this.modoGrid = e.modoGridValue;

    if (this.modoGrid.match('Por Partes|Por Secciones')) {
      let data_modo_partes:any = [];
      const data: any [] = JSON.parse(JSON.stringify(this.data_temp));
      for (let i = 0; i < data.length; i++) {
        let element = data[i];
        const npos = data_modo_partes.findIndex((a:any) => (a.ID_PARTE === element.ID_PARTE) && (a.TIPO === element.TIPO) );
        if ( npos != -1 ) {
          data_modo_partes[npos].TOTAL = data_modo_partes[npos].TOTAL + element.TOTAL
        } else {
          data_modo_partes.push(element);
        }
      }
      this.TipoCIF = data_modo_partes;
    }

    if (this.modoGrid === 'Consolidado') {
      const data: any [] = JSON.parse(JSON.stringify(this._sdatos.MATRIZ_DETALLE_CIF));
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].DATA_SOURCE.length; j++) {
          if ( this.DGCifConsolidado.length === 0 ) {
            const element = data[i].DATA_SOURCE[j];
            this.DGCifConsolidado.push(element);
          } else {
            const element = data[i].DATA_SOURCE[j];
            const pos = this.DGCifConsolidado.findIndex((d:any) => d.CODIGO === element.CODIGO);
            if ( pos !== -1 ) {
              this.DGCifConsolidado[pos].VALOR = this.DGCifConsolidado[pos].VALOR + element.VALOR;
              this.DGCifConsolidado[pos].TOTAL = this.DGCifConsolidado[pos].TOTAL + element.TOTAL;
            } else {
              this.DGCifConsolidado.push(element);
            }
          }
        };
      };
    };

  }

  getDataTiposCif(datprm:any) {
    if ( datprm !== '') {
      this.TipoCIF = JSON.parse(JSON.stringify(datprm));
      this.data_temp = this.TipoCIF;
      this.gridCifMatriz.instance.refresh();
    };
  }

  getTotalesCIF(e: any) {
    if(e.TIPO === 'Fijo') {
      this.TipoCIF[0].TOTAL = e.TOTAL_CIF;
      this._sdatos.TOTAL_CIF_FIJO = this.TipoCIF[0].TOTAL;
    };
    if(e.TIPO === 'Variable') {
      this.TipoCIF[1].TOTAL = e.TOTAL_CIF;
      this._sdatos.TOTAL_CIF_VARIABLE = this.TipoCIF[1].TOTAL;
    };

    var totalCIF:number = this.TipoCIF.reduce( (acc:any, item:any) => {
      return acc += item.TOTAL;
    }, 0);

    if (this._sdatos.D_MATRIZ.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
      for (let i = 0; i < this._sdatos.D_MATRIZ_SIMPLE.length; i++) {
        totalCIF = this._sdatos.D_MATRIZ_SIMPLE[i].TOTAL_CIF + totalCIF;
      };
    }

    this.send_totalCIF.emit({ TOTAL_CIF: totalCIF });
  }

  onRowExpanding(e:any) {
    if ( e.value === true)
      this.gridCifMatriz.instance.expandAll(-1);

    if ( e.value === false)
      this.gridCifMatriz.instance.collapseAll(-1);
	};

  onCalculateSubTotal(rowData: any, value: any, currentRowData: any, pos: any) {
    if (currentRowData.TIPO === 'Fijo') {
      rowData.CANTIDAD = value;
      rowData.TOTAL = rowData.CANTIDAD * currentRowData.VALOR;
      rowData.BASE = '';
      rowData.formatValor = '#,##0.0';
    };

    if (currentRowData.TIPO === 'Variable') {
      rowData.CANTIDAD = value;
      if (currentRowData.BASE === 'PRECIO DE VENTA') {
        const subTotal = (currentRowData.VALOR_BASE * currentRowData.VALOR)/100;
        rowData.TOTAL = subTotal;

        const tcd = this._sdatos.TOTAL_COSTO_DIRECTO;
        const cifVariables:any = this.DGinfoCIF.filter((d:any) => d.TIPO === 'Variable');
        
        const totalCifVariables = cifVariables.reduce((acc:any, item:any) => {
          return acc += item.VALOR;
        }, 0);
        rowData.TOTAL = currentRowData.VALOR * (tcd / (1-(totalCifVariables/100) + this._sdatos.D_MATRIZ.MARGEN_RENTABILIDAD ));
      };

      if (currentRowData.BASE === 'COSTO DIRECTO') {
        const tcd = this._sdatos.TOTAL_COSTO_DIRECTO;
        const subTotal = currentRowData.VALOR * tcd;
        rowData.TOTAL = subTotal;

        if ( pos !== undefined)
          this.DGinfoCIF[pos].TOTAL = subTotal;

        rowData.TOTAL = subTotal;
      };

    };
    this._sdatos.conCambios++;
    this._sdatos.setConCambios(this._sdatos.conCambios);
    if (!this.consultaActiva)
      this.onCalculateTotalCIF();
  }

  onCalculateTotalCIF() {
    const totalCIF = this.DGinfoCIF.reduce( (acc:any, item:any) => {
      return acc += item.TOTAL;
    }, 0);
    this.send_totalCIF.emit(totalCIF);
    this._sdatos.MATRIZ_CIF = { DATA: this.DGinfoCIF };
  }

  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  // Operaciones de grid
  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'refrescar':
        this.gridCifMatriz.instance.refresh();
        break;
    
      default:
        break;
    }
  }

  showModal(mensaje:any) {
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
			title: '¡Error!',
			text: mensaje,
			allowOutsideClick: true,
			allowEscapeKey: false,
			allowEnterKey: false,
			backdrop: true,
			position: 'center',
			stopKeydownPropagation: false,
		});
	}
}
