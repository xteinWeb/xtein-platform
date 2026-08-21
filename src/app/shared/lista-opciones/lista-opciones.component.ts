import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxListModule, DxPopupModule, DxTreeListComponent } from 'devextreme-angular';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-lista-opciones',
    templateUrl: './lista-opciones.component.html',
    styleUrls: ['./lista-opciones.component.css'],
    imports: [DxPopupModule, DxListModule]
})
export class ListaOpcionesComponent implements OnInit {

  @ViewChild('listOptions', { static: false }) listOptions: DxTreeListComponent;
  @Input('itemVisible') visiblePopup: boolean;
  @Input() incomingData: any;
  @Output() cerrarLista = new EventEmitter<boolean>();
  @Output() saveData = new EventEmitter<any>();
  
  listaOpciones: any [] = [];
  opcionesValue: any [] = [];

  selectAllModeValue = 'page';
  selectionModeValue = 'all';

  constructor() {
    this.aceptarCambios = this.aceptarCambios.bind(this);
    this.cancelarCambios = this.cancelarCambios.bind(this);
    this.seleccProducto = this.seleccProducto.bind(this);
  }

  ngOnInit(): void {
  }

  seleccProducto(e: any) {
    this.opcionesValue = e.itemData;
    // const pos:any = this.opcionesValue.findIndex((d:any) => d.PRODUCTO === e.itemData.PRODUCTO );
    // if ( pos !== -1 ){
    //   this.opcionesValue.splice(pos,1);
    // } else {      
    //   this.opcionesValue.push(e.itemData);
    // }
  }

  onShown(e: any) {
    this.listaOpciones = this.incomingData;
  }

  onHidden(e: any) {
    this.visiblePopup = false;
    this.listaOpciones = [];
  }

  aceptarCambios(e: any) {
    this.saveData.emit(this.opcionesValue);
    this.opcionesValue = [];
  }

  cancelarCambios(e: any) {
    this.cerrarLista.emit(false);
    this.visiblePopup = false;
    this.opcionesValue = [];
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
