import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DxNumberBoxModule } from 'devextreme-angular';
import { PRO019DataService } from '../SERVICE/pro019.service';
import { PRO01902Component } from '../PRO01902/PRO01902.component';
import { PRO01903Component } from '../PRO01903/PRO01903.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-COSTOS-DIRECTOS',
  templateUrl: './COSTOS-DIRECTOS.component.html',
  styleUrls: ['./COSTOS-DIRECTOS.component.css'],
  standalone: true,
  imports: [CommonModule, CdkAccordionModule, DxNumberBoxModule, PRO01902Component, PRO01903Component ]
})
export class COSTOSDIRECTOSComponent {

  // @ViewChild("gridMateriales", { static: false }) gridMateriales: DxDataGridComponent;
  // @Input() info_MA_MO: any;
  @Input() getDataTotales: any;
  @Output() send_CostoDirecto: EventEmitter<any> = new EventEmitter();

  subscription: Subscription;

  items:any = ['Materiales', 'Mano de Obra'];
  accordionExpand = [true,true];

  PROTECCION_MA: number = 0;
  SUBTOTAL_MA: number = 0;
  SUBTOTAL_MO: number = 0;
  TOTAL_GRAVADOS: number = 0;
  TOTAL_SIN_IVA: number = 0;
  TOTAL_MATERIALES: number = 0;
  TOTAL_MANO_OBRA: number = 0;
  PROTECCION_MO: number = 0;
  TOTAL_COSTO_DIRECTO: number = 0;
  TOTAL_CIF: number = 0;
  TOTAL_COSTO: number = 0;
  TOTAL_UTILIDAD: number = 0;
  PRECIO_BASE: number = 0;
  CON_OPERATIVA: number = 0;
  TOTAL_AJUSTE_PRECIO: number = 0;
  TOTAL_PAG: number = 0;
  TOTAL_GRAVAMENES: number = 0;
  TOTAL_PDG: number = 0;
  TOTAL_MATRIZ: number = 0;

  ExcGrav: any = [];

  constructor(
    private _sdatos: PRO019DataService
  ) {
    this.subscription = this._sdatos
      .getTotales()
      .subscribe((datprm) => {
        if (datprm.GRUPO === 'COSTOS DIRECTOS')
          this.getTotales(datprm);
      }
    );
    
    this.getTotalMateriales = this.getTotalMateriales.bind(this);
  }

  ngOnInit(): void {
    if (this._sdatos.D_MATRIZ.CLASE === 'Juego')
      this.accordionExpand = [false,false];
    else
      this.accordionExpand = [true,true];

    if ( (this.getDataTotales !== undefined && this.getDataTotales !== null) && (this.getDataTotales.length > 0) ) {
      this.TOTAL_MATERIALES = this.getDataTotales.TOTAL_MATERIALES;
      this.SUBTOTAL_MA = this.getDataTotales.SUBTOTAL_MA;
      this.PROTECCION_MA = this.getDataTotales.PROTECCION_MA;
      this.TOTAL_SIN_IVA = this.getDataTotales.TOTAL_SIN_IVA;
      this.TOTAL_GRAVADOS = this.getDataTotales.TOTAL_GRAVADOS;
      this.TOTAL_MANO_OBRA = this.getDataTotales.TOTAL_MANO_OBRA;
      this.SUBTOTAL_MO = this.getDataTotales.SUBTOTAL_MO;
      this.PROTECCION_MO = this.getDataTotales.PROTECCION_MO;
    } else {
      this.TOTAL_MATERIALES = this._sdatos.TOTAL_MATERIALES;
      this.SUBTOTAL_MA = this._sdatos.SUBTOTAL_MA;
      this.PROTECCION_MA = this._sdatos.PROTECCION_MA;
      this.TOTAL_SIN_IVA = this._sdatos.TOTAL_SIN_IVA;
      this.TOTAL_GRAVADOS = this._sdatos.TOTAL_GRAVADOS;
      this.TOTAL_MANO_OBRA = this._sdatos.TOTAL_MANO_OBRA;
      this.SUBTOTAL_MO = this._sdatos.SUBTOTAL_MO;
      this.PROTECCION_MO = this._sdatos.PROTECCION_MO;
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getTotalMateriales(e:any) {
    if (this._sdatos.accion !== 'consultar') {
      this.PROTECCION_MA = e.TOTAL_PROTECCION;
      this.SUBTOTAL_MA = e.SUB_TOTAL;
      this.TOTAL_MATERIALES = this.PROTECCION_MA + this.SUBTOTAL_MA;
      this._sdatos.TOTAL_MATERIALES = this.TOTAL_MATERIALES;
      this._sdatos.SUBTOTAL_MA = this.SUBTOTAL_MA;
      this._sdatos.PROTECCION_MA = this.PROTECCION_MA;
      // this.getTotalTCD();
      this.send_CostoDirecto.emit({ TOTAL_MATERIALES: this.TOTAL_MATERIALES });
    }
  }

  getTotalGraExc(e:any) {
    this.TOTAL_GRAVADOS = this.TOTAL_GRAVADOS + e.TOTAL_GRAVADOS;
    this.TOTAL_SIN_IVA = this.TOTAL_SIN_IVA + e.TOTAL_SIN_IVA;
    this._sdatos.TOTAL_GRAVADOS = this.TOTAL_GRAVADOS;
    this._sdatos.TOTAL_SIN_IVA = this.TOTAL_SIN_IVA;
  }

  getTotalManoObra(e: any) {
    if (this._sdatos.accion !== 'consultar') {
      this.PROTECCION_MO = e.TOTAL_PROTECCION;
      this.SUBTOTAL_MO = e.SUB_TOTAL;
      this.TOTAL_MANO_OBRA = this.PROTECCION_MO + this.SUBTOTAL_MO;
      this._sdatos.TOTAL_MANO_OBRA = this.TOTAL_MANO_OBRA;
      this._sdatos.SUBTOTAL_MO = this.SUBTOTAL_MO;
      this._sdatos.PROTECCION_MO = this.PROTECCION_MO;
      // this.getTotalTCD();
      this.send_CostoDirecto.emit({ TOTAL_MANO_OBRA: this.TOTAL_MANO_OBRA });
    }
  }

  getTotales(datprm: any) {
    if ( datprm.PROTECCION_MA !== undefined && datprm.PROTECCION_MA !== null ) {
      this.PROTECCION_MA = datprm.PROTECCION_MA;
      this._sdatos.PROTECCION_MA = this.PROTECCION_MA;
    }
    if ( datprm.SUBTOTAL_MA !== undefined && datprm.SUBTOTAL_MA !== null ) {
      this.SUBTOTAL_MA = datprm.SUBTOTAL_MA;
      this._sdatos.SUBTOTAL_MA = this.SUBTOTAL_MA;
    }
    if ( datprm.TOTAL_MATERIALES !== undefined && datprm.TOTAL_MATERIALES !== null ) {
      this.TOTAL_MATERIALES = datprm.TOTAL_MATERIALES;
      this._sdatos.TOTAL_MATERIALES = this.TOTAL_MATERIALES;
    }
    if ( datprm.TOTAL_GRAVADOS !== undefined && datprm.TOTAL_GRAVADOS !== null ) {
      this.TOTAL_GRAVADOS = datprm.TOTAL_GRAVADOS;
      this._sdatos.TOTAL_GRAVADOS = this.TOTAL_GRAVADOS;
    }
    if ( datprm.TOTAL_SIN_IVA !== undefined && datprm.TOTAL_SIN_IVA !== null ) {
      this.TOTAL_SIN_IVA = datprm.TOTAL_SIN_IVA;
      this._sdatos.TOTAL_SIN_IVA = this.TOTAL_SIN_IVA;
    }
    if ( datprm.PROTECCION_MO !== undefined && datprm.PROTECCION_MO !== null ) {
      this.PROTECCION_MO = datprm.PROTECCION_MO;
      this._sdatos.PROTECCION_MO = this.PROTECCION_MO;
    }
    if ( datprm.SUBTOTAL_MO !== undefined && datprm.SUBTOTAL_MO !== null ) {
      this.SUBTOTAL_MO = datprm.SUBTOTAL_MO;
      this._sdatos.SUBTOTAL_MO = this.SUBTOTAL_MO;
    }
    if ( datprm.TOTAL_MANO_OBRA !== undefined && datprm.TOTAL_MANO_OBRA !== null ) {
      this.TOTAL_MANO_OBRA = datprm.TOTAL_MANO_OBRA;
      this._sdatos.TOTAL_MANO_OBRA = this.TOTAL_MANO_OBRA;
    }
    if ( datprm.TOTAL_COSTO_DIRECTO !== undefined && datprm.TOTAL_COSTO_DIRECTO !== null ) {
      this.TOTAL_COSTO_DIRECTO = datprm.TOTAL_COSTO_DIRECTO;
      this._sdatos.TOTAL_COSTO_DIRECTO = this.TOTAL_COSTO_DIRECTO;
    }
  }

}
