import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { PRO019Service } from 'src/app/services/PRO019/PRO019.service';
import { showToast } from '../../../shared/toast/toastComponent.js';
import Swal from 'sweetalert2';
import { PRO019DataService } from '../SERVICE/pro019.service';

@Component({
  selector: 'app-PRO01901',
  templateUrl: './PRO01901.component.html',
  styleUrls: ['./PRO01901.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxButtonModule]
})
export class PRO01901Component implements OnInit {

  @ViewChild("gridPartes", { static: false }) gridPartes: DxDataGridComponent;

  @Input() infoPartes: any;
  @Output() send_DatosPartes: EventEmitter<any> = new EventEmitter();
  
  subscriptionRefresh: Subscription;
  subscriptionReadOnly: Subscription;
  // DGPartes: any = [];
  selectParte: any = [];
  readOnly: boolean = true;

  constructor(
		private sData: PRO019Service,
    public _sdatos: PRO019DataService
  ) {
    // Recibe de principal
    this.subscriptionRefresh = this._sdatos
      .getRefresh()
      .subscribe((datprm) => {
        if (datprm === true)
          this.gridPartes.instance.refresh();
        
        this.valoresObjetos('partes', '');
      }
    );
    this.subscriptionReadOnly = this._sdatos
      .getReadOnly()
      .subscribe((datprm) => {
        this.getReadOnly(datprm);
      }
    );
  }

  ngOnInit(): void {
    if ( this.infoPartes.length > 0) {
      this._sdatos.DPartes = this.infoPartes;
    } else {
      this.valoresObjetos('partes', '');
    }
  }

  ngOnDestroid(): void {
    this.subscriptionReadOnly.unsubscribe();
    this.subscriptionRefresh.unsubscribe();
  }

  getReadOnly(datprm:any) {
    this.readOnly = datprm;
  }

  onSelectionParte(e: any) {	}

  consultarMatrices() {
    this.send_DatosPartes.emit(true);
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, condicion: any){
    if (obj === 'partes' || obj === 'todos') {
      if (this._sdatos.D_MATRIZ.CLASE.match('Juego|Producto compuesto|Parte compuesta')){
        const prm = { PRODUCTO: this._sdatos.D_MATRIZ.PRODUCTO };
        this.sData.getPartes('PRODUCTOS PARTES', prm).subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const newArray = res;
          const mensaje = newArray[0].ErrMensaje;
          if (mensaje != '') {
            // this.showModal(mensaje);
            this._sdatos.DPartes = [];
            showToast(mensaje, 'warning');
          } else {
            this._sdatos.DPartes = newArray;
          };
        },
        (err => {
          this.showModal(err.message, 'Error');
        })
        );
      }
    }
  }

  // Operaciones de grid
  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'refrescar':
        this.gridPartes.instance.refresh();
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
