import { Component, Input, OnInit, Output } from '@angular/core';
import { DxPopupModule, DxRadioGroupModule } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { SxalertService } from './_sxalert.service';

@Component({
  selector: 'app-xalert',
  templateUrl: './xalert.component.html',
  styleUrls: ['./xalert.component.css'],
  standalone: true,
  imports: [DxPopupModule, DxRadioGroupModule]
})
export class XalertComponent implements OnInit {

  // Variables popUp
  aceptarButtonOptions: any;
  closeButtonOptions: any;
  titPopUpAlert: string;
  esVisible: boolean;
  subscription: Subscription;
  itemsOpciones: any;
  datosOpciones: any;
  opcionSelecc: any;
  titAlert: string;
  
  constructor(private salert: SxalertService) 
  { 
    // Botones de alert
    this.aceptarButtonOptions = {
      text: 'Aceptar',
      icon: 'todo',
      type: "success",
      stylingMode: "contained",
      onClick: this.accionAlert.bind(this,'aceptar')
    };
    this.closeButtonOptions = {
      text: 'Cancelar',
      icon: 'undo',
      stylingMode: "contained",
      onClick: this.accionAlert.bind(this,'cancelar')
    };
    
    // Respuesta del filtro
    this.subscription = this.salert.getAlert().subscribe(prm => {
      // Muestra la ventana
      this.esVisible = prm.visible;
      this.datosOpciones = prm.data;
      this.itemsOpciones = prm.data;
      this.titAlert = prm.titulo;
      this.opcionSelecc = prm.valor;
      console.log('MOSTRAR alert');
    })

    this.descOpcionAlert = this.descOpcionAlert.bind(this);
    
  }

  onShownAlert(e) {
    
  }
  accionAlert(accion, e) {
    this.salert.setAccion(this.opcionSelecc);
    this.esVisible = false;
  }
  descOpcionAlert(opcion) {
    console.log('buscar alert');
    const desc = this.datosOpciones.find(o => o.opcion === opcion).texto;
    return desc;
  }

  ngOnInit(): void {
    
  }

}
