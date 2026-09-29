import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxDataGridModule, DxPopupModule } from 'devextreme-angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-VEN002_modaltree',
  templateUrl: './VEN002_modaltree.component.html',
  styleUrls: ['./VEN002_modaltree.component.css'],
  standalone: true,
  imports: [DxPopupModule, DxDataGridModule]
})
export class VEN002ModaltreeComponent implements OnInit {

  @Input('itemVisible') visiblePopup: boolean;
  @Input() incomingData: any;
  @Output() cerrarLista = new EventEmitter<boolean>();
  @Output() saveData = new EventEmitter<any>();

  listaPrecios: any [] = [];

  selectAllModeValue = 'page';
  selectionModeValue = 'all';

  constructor() {
    this.aceptarCambios = this.aceptarCambios.bind(this);
    this.cancelarCambios = this.cancelarCambios.bind(this);
  }

  onShown(e: any) {
    this.listaPrecios = this.incomingData;
  }

  onHidden(e: any) {
    this.cerrarLista.emit(false);
    this.visiblePopup = false;
  }

  aceptarCambios(e: any) {
    this.saveData.emit(this.listaPrecios);
  }

  cancelarCambios(e: any) {
    this.visiblePopup = false;
    this.saveData.emit(false);
  }

  updatingRow(e) {
    if (e.oldData === undefined)
      return;
    e.oldData.isEdit = true;
  }

  updatedRow(e){
  }

  onRowPrepared(e) {
    if (e.rowType === "data") {
      if (e.data.isEdit) {
				// e.rowElement.style.backgroundColor = 'lightyellow';
				const className:string = e.rowElement.className;
				e.rowElement.className = className +' row-modified-focused';
			}
    }
    if (e.rowType === "header" && e.rowIndex === 2) {
      e.rowElement.style.display = "none";
    }
  }

  onRowValidating(e: any) {
    // Valida completitud
  }

  ngOnInit(): void {
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
