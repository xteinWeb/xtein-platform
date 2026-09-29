import { Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { SPasswordService } from './-s-password.service';
import notify from 'devextreme/ui/notify';
import { DxButtonModule, DxFormModule, DxPopupModule, DxTextBoxModule, DxToolbarModule, DxValidatorModule } from 'devextreme-angular';
import { showToast } from '../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css',
              '../../../assets/xtein.scss'],
  standalone: true,
  imports: [DxToolbarModule, PasswordComponent, DxFormModule, DxTextBoxModule, DxPopupModule, DxButtonModule, DxValidatorModule]
})
export class PasswordComponent implements OnInit {

  subscription: Subscription;

  FClave: any = {
    USUARIO : '',
    CLAVE_NUEVA : '',
    CLAVE_NUEVA_CONFIRMAR : ''
  };

  ErrMensaje: any = '';
  displayPassword: boolean = false;

  //notificaciones.
  toaVisible: boolean = false;
	toaTipo = 'info'
  toaMessage = 'Registro actualizado!';

  constructor( private _sdatosPaswword: SPasswordService ) {
    this.subscription = this._sdatosPaswword
    .getPassword()
    .subscribe((data) => {
      this.displayPassword = data.CAMBIO_PASSWORD;
      this.FClave.USUARIO = data.USUARIO;
    });
  }

  ngOnInit(): void {
    this.FClave = {USUARIO:'', CLAVE_NUEVA: '', CLAVE_NUEVA_CONFIRMAR: ''};
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  verificarClave = () => this.FClave.CLAVE_NUEVA;

  cambiarPassword(e: any) {
    if ( this.validarPassword(e) ) {
      this.sendDataPassword(e);
    } else {
      showToast(this.ErrMensaje, 'error');
    }
  }

  validarPassword(e: any) {
    const user = e.USUARIO;
    const pass1: any = e.CLAVE_NUEVA;
    const pass2: any = e.CLAVE_NUEVA_CONFIRMAR;

    if ( (user != '') || (pass1 != '') || (pass2 != '') ) {
      if ( (pass1.length >= 6) || (pass2.length >= 6) ){
        if ( pass1 === pass2 ) {
          this.ErrMensaje  = 'OK';
          return true;
        } else {
          this.ErrMensaje  = 'Las contraseñas no coinciden!';
          return false;
        }
      } else {
        this.ErrMensaje = 'La contraseña debe tener mínimo 6 caracteres.';
        return false;
      }
    } else {
      this.ErrMensaje = 'ERROR: Llene el formulario.';
      return false;
    }
  }

  cerrar() {
    this.FClave.CLAVE_NUEVA = '';
    this.FClave.CLAVE_NUEVA_CONFIRMAR = '';
    this.displayPassword = false;
  }

  sendDataPassword(e: any) {
    const prm = {USUARIO: e.USUARIO, PASSWORD: e.CLAVE_NUEVA};
    this._sdatosPaswword.changePassword('UPDATE PASSWORD', prm).subscribe((data: any)=> {
      const res = JSON.parse(data);
      const mensaje = res[0].ErrMensaje;
      if ( mensaje != ''){
        this.showModal(mensaje);
      } else {
        showToast('Contraseña Actualizada', 'success');
      }
    });
    this.displayPassword = false;
  }

  showModal(mensaje:any) {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
      title: '¡Error!',
      text: mensaje,
      //toast: true
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
      stopKeydownPropagation: false,
    });
  }
}
