import { CdkAccordionModule } from '@angular/cdk/accordion';

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DxButtonModule, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxFormModule, DxListModule, DxLoadPanelModule, DxNumberBoxModule, DxPopupModule, DxRadioGroupModule, DxTextBoxModule, DxTreeListModule } from 'devextreme-angular';
import { Observable, Subscription } from 'rxjs';
import { MatrizAvanzadaService } from 'src/app/services/matriz-avanzada/matriz-avanzada.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-lista-precio',
    templateUrl: './lista-precio.component.html',
    styleUrls: ['./lista-precio.component.css'],
    imports: [DxFormModule, DxDataGridModule, DxDropDownBoxModule, DxTextBoxModule, DxNumberBoxModule, DxButtonModule, DxTreeListModule, DxRadioGroupModule, CdkAccordionModule, DxLoadPanelModule, DxPopupModule, DxListModule, DxDateBoxModule]
})
export class ListaPrecioComponent {

  private endPoint = environment.apiUrl;

  @Input() events: Observable<any>;
  @Output() onRespuestaMatriz = new EventEmitter<any>;
  
  private eventsSubscription: Subscription;

  
  DListasPrecio: any[] = [];
  DataSourceMatrices: any[] = [];
  DMatrices: any[] = [];
  DListaSelect: any[] = [];
  selectLista: any[] = [];
  selectMatrices: any[] = [];

  openedPopup: boolean = false;
  openedPopupMatrices: boolean = false;
  loadingVisible: boolean = false;

  constructor(private sData: MatrizAvanzadaService) { }

  ngOnInit(): void {
    this.valoresObjetos('LISTAS PRECIO', '');
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      if (datos.vista === 'Actualizar Parte') {
        switch (datos.accion) {
          case 'cancelar':
            // this.selectLista = [];
            // this.DListaSelect = [];
          break;
          
          default:
          break;
        }
      }
    });
  }

  ngOnDestroid(): void {

  }

  onValueChangedMatrices(e:any) {
    if (e.value === undefined || e.value === null || e.value.length <= 0) {
      const prm = { accion: "limpiar", data: { } };
      this.onRespuestaMatriz.emit(prm);
    }
  }

  onSelectionLista(e:any) {
    if (e.selectedRowKeys === undefined || e.selectedRowKeys === null || e.selectedRowKeys.length <= 0) {
      this.DListaSelect = [];
      this.DataSourceMatrices = [];
      this.selectMatrices = [];
      const prm = { accion: "limpiar", data: { } };
      this.onRespuestaMatriz.emit(prm);
    } else if (e.selectedRowKeys && e.selectedRowKeys.length > 0) {
      this.DListaSelect = e.selectedRowsData;
      this.valoresObjetos('MATRICES LISTA PRECIO', '');
    }
    this.openedPopup = false;
  }

  aceptarBottom(e: any, btn: any) {
    switch (btn) {
      case 'Aceptar':
        var datos:any [] = [];
        if (this.selectMatrices.length > 0) {
          this.selectMatrices.forEach((elem:any) => {
            datos.push(this.DataSourceMatrices.filter((d:any) => d.PRODUCTO === elem)[0]);
          });
          const prm = { accion: "Actualizar por Lista de Precio", data: {ID_LISTA: this.selectLista[0], MATRICES: datos} };
          this.onRespuestaMatriz.emit(prm);
        }
        break;

      case 'Cancelar':
        break;
        
        default:
          break;
      }
    this.openedPopupMatrices = false;
  }

  valoresObjetos(obj: string, condicion: any) {
    if (obj === 'LISTAS PRECIO' || obj === 'todos') {
      const url: string = this.endPoint+'/matrizAvanzada/consulta';
      const prm = {};
      this.loadingVisible = true;
      this.sData.consulta('LISTAS PRECIO', prm, url).subscribe((data: any) => {
        this.loadingVisible = false;
        const res = JSON.parse(data.data);
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        this.loadingVisible = false;
        if (mensaje !== '') {
          this.showModal(mensaje, '', "<i class='icon-alert-ol'></i>");
        } else {
          newArray.forEach((ele:any) => {
            let fecha = new Date(ele.FECHA_INICIO);
            let dia = fecha.getDate().toString().padStart(2, "0");
            let mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
            let anio = fecha.getFullYear();
            let fechaFormateada = `${dia}/${mes}/${anio}`;
            ele.FECHA_INICIO = fechaFormateada;

            fecha = new Date(ele.FECHA_FINAL);
            dia = fecha.getDate().toString().padStart(2, "0");
            mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
            anio = fecha.getFullYear();
            fechaFormateada = `${dia}/${mes}/${anio}`;
            ele.FECHA_FINAL = fechaFormateada;
          });
          this.DListasPrecio = newArray;
        };
      },
        (err => {
          this.loadingVisible = false;
          this.showModal(err.message, '', "<i class='icon-alert-ol'></i>");
        })
      );
    };
    if (obj === 'MATRICES LISTA PRECIO') {
      const url: string = this.endPoint+'/matrizAvanzada/consulta';
      const prm = {};
      this.loadingVisible = true;
      this.sData.consulta('MATRICES LISTA PRECIO', prm, url).subscribe((data: any) => {
        this.loadingVisible = false;
        const res = JSON.parse(data.data);
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        this.loadingVisible = false;
        if (mensaje !== '') {
          this.showModal(mensaje, '', "<i class='icon-alert-ol'></i>");
        } else {
          this.DataSourceMatrices = newArray;
        };
      },
        (err => {
          this.loadingVisible = false;
          this.showModal(err.message, '', "<i class='icon-alert-ol'></i>");
        })
      );
    };
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
