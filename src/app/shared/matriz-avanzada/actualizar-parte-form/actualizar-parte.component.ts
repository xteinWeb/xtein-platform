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
import { Observable, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-actualizar-parte',
    templateUrl: './actualizar-parte.component.html',
    styleUrls: ['./actualizar-parte.component.css'],
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
        AngularSplitModule
    ],
    providers: []
})
export class ActualizarParteComponent implements OnInit {

  private endPoint = environment.apiUrl;

  @Input() events: Observable<any>;
  @Output() onRespuestaMatriz = new EventEmitter<any>;
  
  private eventsSubscription: Subscription;

  DMatrices: any[] = [];
  DMatrizSelected: any[] = [];
  selectMatriz: any[] = [];

  openedPopup: boolean = false;
  loadingVisible: boolean = false;

  constructor(private sData: MatrizAvanzadaService) { }

  ngOnInit(): void {
    this.valoresObjetos('MATRICES EXISTENTES', '');
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      if (datos.vista === 'Actualizar Parte') {
        switch (datos.accion) {
          case 'cancelar':
            this.selectMatriz = [];
            this.DMatrizSelected = [];
          break;
          
          default:
          break;
        }
      }
    });
  }

  valoresObjetos(obj: string, condicion: any) {
    if (obj === 'MATRICES EXISTENTES' || obj === 'todos') {
      const url: string = this.endPoint+'/matrizAvanzada/consulta';
      const prm = {};
      this.loadingVisible = true;
      this.sData.consulta('MATRICES EXISTENTES', prm, url).subscribe((data: any) => {
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
          this.DMatrices = newArray;
        };
      },
        (err => {
          this.loadingVisible = false;
          this.showModal(err.message, '', "<i class='icon-alert-ol'></i>");
        })
      );
    };
  }

  onSelectionCambioMatriz(e: any,) {
    if (e.selectedRowsData.length === 0) { 
      this.DMatrizSelected = [];
      const prm = { accion: "limpiar", data: { } };
      this.onRespuestaMatriz.emit(prm);
      
    } else if (e.selectedRowsData.length !== 0) {
      this.selectMatriz = e.selectedRowsData[0].PRODUCTO;
      this.DMatrizSelected = e.selectedRowsData;
      const prm = { accion: "Actualizar Parte", data: { PRODUCTO: e.selectedRowsData[0].PRODUCTO, IVA: e.selectedRowsData[0].IVA, MARGEN: e.selectedRowsData[0].MARGEN } };
      this.onRespuestaMatriz.emit(prm);
    }
    this.openedPopup = false;
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