import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  DxButtonModule,
  DxDataGridModule,
  DxDropDownBoxModule,
  DxFormModule,
  DxListModule,
  DxLoadPanelModule,
  DxNumberBoxModule,
  DxPopupModule,
  DxRadioGroupModule,
  DxTextBoxModule,
  DxTreeListModule,
} from 'devextreme-angular';
import Swal from 'sweetalert2';
import { AngularSplitModule } from 'angular-split';
import { MatrizAvanzadaService } from 'src/app/services/matriz-avanzada/matriz-avanzada.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-cambio-materiales',
    templateUrl: './cambio-materiales.component.html',
    styleUrls: ['./cambio-materiales.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        DxFormModule,
        DxDataGridModule,
        DxDropDownBoxModule,
        DxTextBoxModule,
        DxNumberBoxModule,
        DxButtonModule,
        DxTreeListModule,
        DxRadioGroupModule,
        CdkAccordionModule,
        DxLoadPanelModule,
        DxPopupModule,
        DxListModule,
        AngularSplitModule,
    ]
})
export class CambiarMaterialComponent implements OnInit {

  private endPoint = environment.apiUrl;

  @Input() events: any;
  @Output() onRespuestaMatriz = new EventEmitter<any>;

  private eventsSubscription: Subscription;

  DProductos: any[] = [];
  DProductos2: any[] = [];
  MAnterior: any[] = [];
  MNuevo: any[] = [];


  selectProductoOld: any[] = [];
  selectProductoNuevo: any[] = [];

  openedPopupCambioPro: boolean = false;
  openedPopupCambioOld: boolean = false;
  loadingVisible: boolean = false;

  constructor(private sData: MatrizAvanzadaService) { }

  ngOnInit(): void {
    this.valoresObjetos('PRODUCTOS MATERIALES', '');
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      if (datos.vista === 'Actualizar Parte') {
        switch (datos.accion) {
          case 'cancelar':
          break;

          default:
          break;
        }
      }
    });
  }

  valoresObjetos(obj: string, condicion: any) {
    if (obj === 'PRODUCTOS MATERIALES' || obj === 'todos') {
      const url: string = this.endPoint+'/matrizAvanzada/consulta';
      const prm = { BASE_COSTO: this.sData.BASES_COSTOS };
      this.loadingVisible = true;
      this.sData.consulta('PRODUCTOS MATERIALES', prm, url).subscribe(
        (data: any) => {
          this.loadingVisible = false;
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          const newArray = res;
          const mensaje = newArray[0].ErrMensaje;
          if (mensaje !== '') {
            this.showModal(mensaje, '', "<i class='icon-alert-ol'></i>");
          } else {

            newArray.forEach((tarea: any, key: number) => {
              tarea.ITEM = key + 1;
            });

            this.DProductos = newArray;
          }
        },
        (err) => {
          this.loadingVisible = false;
          this.showModal(err.message, '', "<i class='icon-alert-ol'></i>");
        }
      );
    }
  }

  onSelectionCambioProducto(e: any, campo: string) {
    // let prm = { accion: 'Cambio de Material', data: {} };
    switch (campo) {
      case 'ANTERIOR':
        if (e.selectedRowsData.length !== 0) {
          this.selectProductoOld = e.selectedRowsData[0].ITEM;
          this.MAnterior = this.DProductos.filter((data: any) => data.ITEM === e.selectedRowsData[0].ITEM);
          this.MNuevo = []
          this.DProductos2 = this.DProductos.filter((data: any) => data.ID_UDM === e.selectedRowsData[0].ID_UDM)
          // prm.data = { PRODUCTO: this.MAnterior[0].ID_COMPONENTE, ID_UDM: this.MAnterior[0].ID_UDM, MANTERIOR: this.MAnterior }
          // this.onRespuestaMatriz.emit(prm);
        } else {
          this.MAnterior = [];
          this.MNuevo = [];
          this.selectProductoNuevo = [];
          this.DProductos2 = [];
          const prm = { accion: "limpiar", data: { } };
          this.onRespuestaMatriz.emit(prm);
        }
        this.openedPopupCambioOld = false;
        break;

      case 'NUEVO':
        if (e.selectedRowsData.length !== 0) {
          this.selectProductoNuevo = e.selectedRowsData[0].ITEM;
          this.MNuevo = this.DProductos.filter((data: any) => data.ITEM === e.selectedRowsData[0].ITEM);
          const prm = { accion: 'Set Materiales', data: { MANTERIOR: this.MAnterior, MNUEVO: this.MNuevo } }
          this.onRespuestaMatriz.emit(prm);
        } else {
          this.MNuevo = [];
          const prm = { accion: "limpiar", data: { } };
          this.onRespuestaMatriz.emit(prm);
        }
        this.openedPopupCambioPro = false;
        break;

      default:
        break;
    }

    if (this.MNuevo.length > 0 && this.MAnterior.length > 0) {
      const prm = { accion: 'Cambio de Material', data: {PRODUCTO_ANT: this.MAnterior[0], PRODUCTO_NEW: this.MNuevo[0]} };
      this.onRespuestaMatriz.emit(prm);
    }

  }

  showModal(mensaje: any, title: any, icon: string) {
    const tipo = title;
    Swal.fire({
      iconHtml: icon,
      confirmButtonColor: tipo === 'Error' ? 'DF3E3E' : '#0F4C81 !important',
      title: title,
      html: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
      stopKeydownPropagation: false,
    });
  }
}
