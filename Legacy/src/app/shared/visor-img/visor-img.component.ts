import { Component, OnInit } from '@angular/core';
import { SvisorRutasService } from './_svisor-img.service';
import { Subscription } from 'rxjs';
import notify from 'devextreme/ui/notify';
import Swal from 'sweetalert2';
import { imgtool } from '../classes/imgtools';
import { DxPopupModule } from 'devextreme-angular';
import { showToast } from '../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-visor-img',
  templateUrl: './visor-img.component.html',
  styleUrls: ['./visor-img.component.css'],
  standalone: true,
  imports: [DxPopupModule]
})
export class VisorImgComponent implements OnInit {

  subscription: Subscription;
  titulo: string;
  imgBase64: any = '../../../assets/no-image.jpg';
  visibleVisorImg: boolean = false;

  constructor(private _service: SvisorRutasService) 
  {
    this.subscription = this._service.getObs_VisorRutas().subscribe((data) => {
      this.valoresObjetos('visor imagen', data);
      this.visibleVisorImg = data.VISIBLE;
      this.titulo = data.TITULO;
    });
  }

  onShown(e) {
    var imgz = document.getElementById("imgVisor");
    var imgv = new imgtool();
    imgv.zoomImageRollMouse(imgz);
  }

  ngOnInit(): void {
  }
  ngAfterViewInit(): void {
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, data: any){
    if (obj === 'visor imagen') {
      const prm = { ID_APLICACION: data.ID_APLICACION, DATO: data.DATO };
      this._service.consulta('visor imagen', prm).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje != '') {
          showToast(mensaje, 'error');
        }
        else {
          if(newArray[0].IMAGEN !== '')
            this.imgBase64 = newArray[0].IMAGEN;
          else
            this.imgBase64 = '../../../assets/no-image.jpg';
        };
      },
        (err => {
          this.showModal(err.message, 'Error');
        })
      );
    }
  }

  showModal(mensaje:any , tipo:any) {
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
			title: tipo,
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
