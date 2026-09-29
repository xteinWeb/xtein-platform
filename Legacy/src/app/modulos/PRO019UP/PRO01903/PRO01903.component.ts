import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxNumberBoxModule, DxSwitchModule, DxToolbarModule } from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { PRO019DataService } from '../SERVICE/pro019.service';
import { PRO01903_03Component } from './PRO01903_03/PRO01903_03.component';
import { formatNumber } from 'devextreme/localization';

@Component({
  selector: 'app-PRO01903',
  templateUrl: './PRO01903.component.html',
  styleUrls: ['./PRO01903.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxSwitchModule, DxNumberBoxModule, DxButtonModule, DxToolbarModule, PRO01903_03Component]
})
export class PRO01903Component implements OnInit {

  @ViewChild("gridManoObra", { static: false }) gridManoObra: DxDataGridComponent;
  // @Input() dataSecciones: any;
  @Output() send_totalManoObra: EventEmitter<any> = new EventEmitter();

  subscription: Subscription;
  subscriptionRefresh: Subscription;
  subscriptionConsolidado: Subscription;
  subscriptionReadOnly: Subscription;
  DGseccionesManoObra: any = [];
  DGManoObraConsolidado: any [] = [];
  data_temp: any = [];
  modoGrid: string;
  TOTAL_FACTOR_MOD: number = 0;
  TOTAL_SECCIONES: number = 0;
  templateGroup: any = ['ID_PARTE'];

  //notificaicones
  toaVisible: boolean = false;
	type = 'info';
	toaMessage = 'Registro actualizado!';
  // Operaciones de grid
  rowNew: boolean = true;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];

  expandgridManoObra: boolean = true;
  btnContraer: string = 'Expandir';

  constructor(
    private _sdatos: PRO019DataService
  ) {
    // Recibe de principal
    this.subscription = this._sdatos
      .getDataSeccionesManoObra()
      .subscribe((datprm) => {
        this.getDataManoObra(datprm);
      }
    );
    this.subscriptionConsolidado = this._sdatos
      .getModoGrid()
      .subscribe((datprm) => {
        this.activeModoGrid(datprm);
      }
    );
    this.subscriptionRefresh = this._sdatos
      .getRefresh()
      .subscribe((datprm) => {
        if (datprm === true)
          this.refresComponent();
      }
    );

    this.refresComponent = this.refresComponent.bind(this);
    this.ngOnInit = this.ngOnInit.bind(this);
  }

  ngOnInit(): void {
    if ( this._sdatos.DGSECCIONES_MANO_OBRA.length !== 0) {
      this.DGseccionesManoObra = JSON.parse(JSON.stringify(this._sdatos.DGSECCIONES_MANO_OBRA));
    };
    this.data_temp = this.DGseccionesManoObra;
  }

  ngOnDestroid(): void {
    this.subscription.unsubscribe();
    this.subscriptionConsolidado.unsubscribe();
    this.subscriptionReadOnly.unsubscribe();
    this.subscriptionRefresh.unsubscribe();
  }

  refresComponent() {
    this.DGseccionesManoObra = JSON.parse(JSON.stringify(this._sdatos.DGSECCIONES_MANO_OBRA));
    // this._sdatos.MATRIZ_DETALLE_MANO_OBRA = [];
    this.gridManoObra.instance.refresh();
  }

  getDataManoObra(datprm:any) {
    if ( datprm !== '') {
      this.DGseccionesManoObra = JSON.parse(JSON.stringify(datprm));
      this.data_temp = this.DGseccionesManoObra;
      this.gridManoObra.instance.refresh();
    };
  }

  onRowExpanding(e:any) {
    if ( this.expandgridManoObra === true) {
      this.gridManoObra.instance.expandAll(-1);
      this.btnContraer
    }

    if ( this.expandgridManoObra === false)
      this.gridManoObra.instance.collapseAll(-1);
	};

  getTotalSeccion(e:any) {
    let pos:any = 0;
    pos = this.DGseccionesManoObra.findIndex( (d:any) => d.ID_SECCION === e.ID_SECCION );
    if ( pos === -1 || this.DGseccionesManoObra[pos].ID_SECCION !== e.ID_SECCION)
      return;

    if(this._sdatos.accion.match('nuevo|modificar')) {
      this.DGseccionesManoObra[pos].PROTECCION = e.PROTECCION;
      this.DGseccionesManoObra[pos].SUBTOTAL = e.SUB_TOTAL;
      this.DGseccionesManoObra[pos].TOTAL = e.SUB_TOTAL + e.PROTECCION;
  
      this.onCalculateTotalMO();
    };

  }

  onCalculateTotalMO() {
    var subtotalMO: number = 0;
    // Subtotal
    subtotalMO = this.DGseccionesManoObra.reduce( (acc:any, item:any) => {
      return acc += item.SUBTOTAL;
    }, 0);
    // Proteccion
    var totalProteccion:any = this.DGseccionesManoObra.reduce( (acc:any, item:any) => {
      return acc += item.PROTECCION;
    }, 0);

    if (this._sdatos.D_MATRIZ.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
      for (let i = 0; i < this._sdatos.D_MATRIZ_SIMPLE.length; i++) {
        subtotalMO = this._sdatos.D_MATRIZ_SIMPLE[i].SUBTOTAL_MO + subtotalMO;
        totalProteccion = this._sdatos.D_MATRIZ_SIMPLE[i].PROTECCION_MO + totalProteccion;
      };
    }

    this.send_totalManoObra.emit({ SUB_TOTAL: subtotalMO, TOTAL_PROTECCION: totalProteccion});
  }

  activeModoGrid(e: any) {
    this.DGManoObraConsolidado = [];
    this.modoGrid = e.modoGridValue;

    if (this.modoGrid === 'Por Partes') {
      this.DGseccionesManoObra = this.data_temp;
    }

    if (this.modoGrid === 'Por Secciones') {
      let data_modo_secciones:any = [];
      const data: any [] = JSON.parse(JSON.stringify(this.data_temp));
      for (let i = 0; i < data.length; i++) {
        let element = data[i];
        const npos = data_modo_secciones.findIndex((a:any) => a.ID_SECCION === element.ID_SECCION );
        if ( npos != -1 ) {
          data_modo_secciones[npos].TOTAL = data_modo_secciones[npos].TOTAL + element.TOTAL
        } else {
          data_modo_secciones.push(element);
        }
      }
      this.DGseccionesManoObra = data_modo_secciones;
    }

    if (this.modoGrid === 'Consolidado') {
      const dataDetalle: any [] = JSON.parse(JSON.stringify(this._sdatos.MATRIZ_DETALLE_MANO_OBRA));
      for (let i = 0; i < dataDetalle.length; i++) {
        for (let j = 0; j < dataDetalle[i].DATA_SOURCE.length; j++) {
          if ( this.DGManoObraConsolidado.length === 0 ) {
            const element = dataDetalle[i].DATA_SOURCE[j];
            this.DGManoObraConsolidado.push(element);
          } else {
            const element = dataDetalle[i].DATA_SOURCE[j];
            const pos = this.DGManoObraConsolidado.findIndex((d:any) => d.CODIGO === dataDetalle[i].DATA_SOURCE[j].CODIGO);
            if ( pos != -1 ) {
              this.DGManoObraConsolidado[pos].CANTIDAD = this.DGManoObraConsolidado[pos].CANTIDAD + dataDetalle[i].DATA_SOURCE[j].CANTIDAD;
              this.DGManoObraConsolidado[pos].TOTAL = this.DGManoObraConsolidado[pos].TOTAL + dataDetalle[i].DATA_SOURCE[j].TOTAL;
            } else {
              this.DGManoObraConsolidado.push(element);
            }
          }
        };
      };
    };
  }

  onSelectionExpand(e:any) {
    if (e.key != undefined)
      e.component.expandRow(e.key.ID_PARTE, e.key.ID_SECCION);    
  }

  onExpandirMenu(e:any) {
    if(this.expandgridManoObra) {
      this.expandgridManoObra = !this.expandgridManoObra;
      this.btnContraer = 'Contraer';
      this.gridManoObra.instance.expandAll(-1);
      return;
    };
    if(!this.expandgridManoObra) {
      this.btnContraer = 'Expandir';
      this.expandgridManoObra = !this.expandgridManoObra;
      this.gridManoObra.instance.collapseAll(-1);
      return;
    };
  }

  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowsData;
  }

  customizeFactorProteccion(e:any)  {
    return ( 'Total Factor: '+this.TOTAL_FACTOR_MOD );
  }
  customizeSubTotal(e:any) {
    return ( 'Sub Total: '+formatNumber(e.value, "#,##0.00") );
  }

  // Operaciones de grid
  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'refrescar':
        this.gridManoObra.instance.refresh();
        break;
    
      default:
        break;
    }
  }

  showModal(mensaje: any, title: any) {
    const tipo = title;
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo==='Error' ? 'DF3E3E':'#0F4C81 !important',
			title: title,
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
