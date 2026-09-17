import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxNumberBoxComponent, DxNumberBoxModule, DxSwitchModule, DxToolbarModule } from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { PRO019DataService } from '../SERVICE/pro019.service';
import { PRO01902_02Component } from './PRO01902_02/PRO01902_02.component';

@Component({
  selector: 'app-PRO01902',
  templateUrl: './PRO01902.component.html',
  styleUrls: ['./PRO01902.component.css'],
  standalone: true,
  imports: [CommonModule, DxSwitchModule, DxDataGridModule, DxNumberBoxModule, DxButtonModule, DxToolbarModule, PRO01902_02Component]
})
export class PRO01902Component implements OnInit {

  @ViewChild("gridMateriales", { static: false }) gridMateriales: DxDataGridComponent;
  @Input() getExcGrav: any;
  @Output() send_totalMateriales: EventEmitter<any> = new EventEmitter();
  @Output() send_totalGraExc: EventEmitter<any> = new EventEmitter();

  subscription: Subscription;
  subscriptionRefresh: Subscription;
  subscriptionModoGrid: Subscription;
  subscriptionReadOnly: Subscription;
  subscriptionTotales: Subscription;

  DGseccionesMateriales: any = [];
  data_temp: any = [];
  idItem: any;
  // readOnly: boolean = true;
  TOTAL_GRAVADOS: number = 0;
  TOTAL_SIN_IVA: number = 0;
  TOTAL_FACTOR_MA: number = 0;
  TOTAL_SECCIONES: number = 0;

  modoGrid: string;
  DGMaterialesConsolidado: any [] = [];
  send_data_detail: any;

  expandgridmateriales: boolean = true;
  btnContraer: string = 'Expandir';
  templateGroup: any = ['ID_PARTE'];

  //notificaicones
  toaVisible: boolean = false;
	toaTipo = 'info';
	toaMessage = 'Registro actualizado!';

  // Operaciones de grid
  rowNew: boolean = true;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];

  constructor(
    private _sdatos: PRO019DataService
  ) {
    // Recibe de principal
    this.subscription = this._sdatos
      .getDataSeccionesMateriales()
      .subscribe((datprm) => {
        this.getDataMateriales(datprm);
      }
    );
    this.subscriptionModoGrid = this._sdatos
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
    this.subscriptionTotales = this._sdatos
      .getTotales()
      .subscribe((datprm) => {
        if (datprm.GRUPO === 'MATERIALES')
          this.getTotales(datprm);
      }
    );
    this.getTotalSeccionMateriales = this.getTotalSeccionMateriales.bind(this);
    this.onCalculateTotalMaterialesPartes = this.onCalculateTotalMaterialesPartes.bind(this);
    this.refresComponent = this.refresComponent.bind(this);
  }

  ngOnInit(): void {
    if ( this._sdatos.DGSECCIONES_MATERIALES.length != 0)
      this.DGseccionesMateriales = JSON.parse(JSON.stringify(this._sdatos.DGSECCIONES_MATERIALES));

    this.data_temp = this.DGseccionesMateriales;
    if ( this.getExcGrav !== undefined && this.getExcGrav !== null && this.getExcGrav.length > 0) {
      this.TOTAL_SIN_IVA = this.TOTAL_SIN_IVA + this.getExcGrav.TOTAL_SIN_IVA;
      this.TOTAL_GRAVADOS = this.TOTAL_GRAVADOS + this.getExcGrav.TOTAL_GRAVADOS;
      this.send_totalGraExc.emit({ TOTAL_SIN_IVA: this.TOTAL_SIN_IVA, TOTAL_GRAVADOS: this.TOTAL_GRAVADOS });
    } else {
      this.TOTAL_SIN_IVA = this._sdatos.TOTAL_SIN_IVA;
      this.TOTAL_GRAVADOS = this._sdatos.TOTAL_GRAVADOS;
    }
  }

  ngOnDestroid(): void {
    this.subscription.unsubscribe();
    this.subscriptionModoGrid.unsubscribe();
    this.subscriptionReadOnly.unsubscribe();
    this.subscriptionRefresh.unsubscribe();
    this.subscriptionTotales.unsubscribe();
  }

  refresComponent() {
    this.DGseccionesMateriales = JSON.parse(JSON.stringify(this._sdatos.DGSECCIONES_MATERIALES));
    this.gridMateriales.instance.refresh();
  }

  getDataMateriales(datprm:any) {
    if ( datprm !== '') {
      this.DGseccionesMateriales = JSON.parse(JSON.stringify(datprm));
      this.data_temp = this.DGseccionesMateriales;
      this.gridMateriales.instance.refresh();
    };
  }

  getTotales(datprm: any) {
    if ( datprm.TOTAL_GRAVADOS !== undefined && datprm.TOTAL_GRAVADOS !== null ) {
      this.TOTAL_GRAVADOS = datprm.TOTAL_GRAVADOS;
      this._sdatos.TOTAL_GRAVADOS = this.TOTAL_GRAVADOS;
    }
    if ( datprm.TOTAL_SIN_IVA !== undefined && datprm.TOTAL_SIN_IVA !== null ) {
      this.TOTAL_SIN_IVA = datprm.TOTAL_SIN_IVA;
      this._sdatos.TOTAL_SIN_IVA = this.TOTAL_SIN_IVA;
    }
  }

  onRowExpanding(e:any) {
    if ( e.value === true)
      this.gridMateriales.instance.expandAll(-1);

    if ( e.value === false)
      this.gridMateriales.instance.collapseAll(-1);
	};

  getTotalSeccionMateriales(e:any) {
    let pos:any = -1;
    pos = this.DGseccionesMateriales.findIndex( (d:any) => d.ID_SECCION === e.ID_SECCION );
    if ( pos === -1 || this.DGseccionesMateriales[pos].ID_SECCION !== e.ID_SECCION)
      return;

    if(this._sdatos.accion.match('nuevo|modificar')) {
      this.DGseccionesMateriales[pos].PROTECCION = e.PROTECCION;
      this.DGseccionesMateriales[pos].FACTOR_MA = e.FACTOR_MA;
      this.DGseccionesMateriales[pos].SUBTOTAL = e.SUB_TOTAL;
      this.DGseccionesMateriales[pos].TOTAL = e.SUB_TOTAL + e.PROTECCION;
      this.DGseccionesMateriales[pos].EXCLUIDOS = e.TOTAL_SIN_IVA;
      this.DGseccionesMateriales[pos].GRAVADOS = e.TOTAL_GRAVADOS;

      this.onCalculateTotalMaterialesPartes();

    } else if(this._sdatos.accion === 'consultar' ) {
      this.DGseccionesMateriales[pos].FACTOR_MA = e.FACTOR_MA;
    }
  }

  onCalculateTotalMaterialesPartes() {
    var subtotalMateriales: number = 0;
    // Subtotal
    subtotalMateriales = this.DGseccionesMateriales.reduce( (acc:any, item:any) => {
      return acc += item.SUBTOTAL;
    }, 0);
    // Proteccion
    var totalProteccion: number = this.DGseccionesMateriales.reduce( (acc:any, item:any) => {
      return acc += item.PROTECCION;
    }, 0);

    const sinIva: number = this.DGseccionesMateriales.reduce( (acc:any, item:any) => {
      return acc += item.EXCLUIDOS;
    }, 0);
    const gravados: number = this.DGseccionesMateriales.reduce( (acc:any, item:any) => {
      return acc += item.GRAVADOS;
    }, 0);
    this.TOTAL_SIN_IVA = sinIva;
    this.TOTAL_GRAVADOS = gravados;

    if (this._sdatos.D_MATRIZ.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
      for (let i = 0; i < this._sdatos.D_MATRIZ_SIMPLE.length; i++) {
        subtotalMateriales = this._sdatos.D_MATRIZ_SIMPLE[i].SUBTOTAL_MA + subtotalMateriales;
        totalProteccion = this._sdatos.D_MATRIZ_SIMPLE[i].PROTECCION_MA + totalProteccion;
      };
    }

    this.send_totalMateriales.emit({ SUB_TOTAL: subtotalMateriales, TOTAL_PROTECCION: totalProteccion});
    this.send_totalGraExc.emit({ TOTAL_SIN_IVA: this.TOTAL_SIN_IVA, TOTAL_GRAVADOS: this.TOTAL_GRAVADOS });
  }

  activeModoGrid(e: any) {
    this.DGMaterialesConsolidado = [];
    this.modoGrid = e.modoGridValue;

    if (this.modoGrid === 'Por Partes') {
      this.DGseccionesMateriales = this.data_temp;
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
      this.DGseccionesMateriales = data_modo_secciones;
    }

    if (this.modoGrid === 'Consolidado') {
      const data: any [] = JSON.parse(JSON.stringify(this._sdatos.MATRIZ_DETALLE_MATERIALES));
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].DATA_SOURCE.length; j++) {
          if ( this.DGMaterialesConsolidado.length === 0 ) {
            const element = data[i].DATA_SOURCE[j];
            this.DGMaterialesConsolidado.push(element);
          } else {
            const element = data[i].DATA_SOURCE[j];
            const pos = this.DGMaterialesConsolidado.findIndex((d:any) => d.ID_COMPONENTE === data[i].DATA_SOURCE[j].ID_COMPONENTE);
            if ( pos != -1 ) {
              this.DGMaterialesConsolidado[pos].CANTIDAD = this.DGMaterialesConsolidado[pos].CANTIDAD + data[i].DATA_SOURCE[j].CANTIDAD;
              this.DGMaterialesConsolidado[pos].TOTAL = this.DGMaterialesConsolidado[pos].TOTAL + data[i].DATA_SOURCE[j].TOTAL;
            } else {
              this.DGMaterialesConsolidado.push(element);
            }
          }
        };
      };
    };

  }

  onSelectionExpand(e:any) {
    if (e.key !== undefined)
      e.component.expandRow(e.key.ID_PARTE, e.key.ID_SECCION);    
  }

  onRowPrepared(e: any) {
    if (this.getExcGrav.length > 0 ) {
      if (this.getExcGrav.TOTAL_SIN_IVA !== this.TOTAL_SIN_IVA) {
        this.TOTAL_SIN_IVA = this.getExcGrav.TOTAL_SIN_IVA;
      }
      if ( this.getExcGrav.TOTAL_GRAVADOS !== this.TOTAL_GRAVADOS ) {
        this.TOTAL_GRAVADOS = this.getExcGrav.TOTAL_GRAVADOS;
      }
    }
  }

  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowsData;
  }

  // Operaciones de grid
  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'refrescar':
        this.gridMateriales.instance.refresh();
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
