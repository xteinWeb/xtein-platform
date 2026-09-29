import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DxListModule, DxPopupModule } from 'devextreme-angular';
import { Observable } from 'rxjs';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-aplsettings',
  templateUrl: './aplsettings.component.html',
  styleUrls: ['./aplsettings.component.scss'],
  standalone: true,
  imports: [DxPopupModule, DxListModule]
})
export class AplsettingsComponent implements OnInit {

  visibleListaOpc: boolean = false;
  listaOpciones: any[] = [];

  @Input() aplicacion: any;

  @Output() onSeleccOpcion = new EventEmitter<any>();

  constructor(
    private _sgenerales: GeneralesService
  ) 
  { }

  mostrarOpciones() {
    this.visibleListaOpc = true;

    // Cargar opciones
    this._sgenerales.consulta('settings_aplicacion', 
                              { aplicacion: this.aplicacion}, 'generales' )
      .subscribe({ 
      next: (resp: any) => {
        const res = JSON.parse(resp.data);
        if (res[0].ErrMensaje === '') {
          this.listaOpciones = [];
          res.forEach(eleres => {
            this.listaOpciones.push({ text: eleres.VALOR,
                                      data: eleres
                                    })
          });
        }
        else {
          this.listaOpciones = [];
        }
      },
      error: (err => {
        this.showModal('Error al cargar configuración de aplicación: '+err.message);
      })
    });

  }

  seleccOpcion(e) {
    this.onSeleccOpcion.emit(e.itemData);
    this.visibleListaOpc = false;
  }

  ngOnInit(): void {

  }

  showModal(mensaje, titulo = '¡Error!', msg_html= '') {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
      title: titulo,
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: "center",
      html: msg_html,
      stopKeydownPropagation: false,
    });
  }


}
