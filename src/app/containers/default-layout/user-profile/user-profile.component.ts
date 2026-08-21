
import { Component } from '@angular/core';
import { DxButtonModule, DxFormModule, DxPopupModule, DxScrollViewModule, DxTextBoxModule } from 'devextreme-angular';
import { UserServiceService } from './user-service.service';
import { Subscription } from 'rxjs';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import Swal from 'sweetalert2';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.css'],
    imports: [DxPopupModule, DxFormModule, DxTextBoxModule, DxButtonModule, DxScrollViewModule]
})
export class UserProfileComponent {


  
  subscription: Subscription;

  visiblePopup: boolean = false;
  activeIconPerfil: boolean = false;
  readOnly: boolean = true;

  iconNameUser: any;
  USUARIO_LOCAL: any = '';

  FUser:any = {};
  
  constructor (
    private _sDatosUser: UserServiceService,
    private _sgenerales: GeneralesService,
    private router: Router
  ) {

    this.subscription = this._sDatosUser.getUserProfile()
    .subscribe((data) => {
      this.visiblePopup = data.VISIBLE;
      this.valoresObjetos('todos', '');
    });


  }

  ngOnInit(): void {
    this.FUser = {
      USUARIO: '',
      PRIMER_NOMBRE: '',
      SEGUNDO_NOMBRE: '',
      PRIMER_APELLIDO: '',
      SEGUNDO_APELLIDO: '',
      NOMBRE_COMPLETO: '',
      TELEFONO: '',
      EMAIL: '',
      FOTO: '',
      DIRECCION: '',
      ROL: '',
      FECHA_NACIMIENTO: '',
      AREA: ''
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  createIconName() {
    const npos: any = this.FUser.NOMBRE_COMPLETO.indexOf(" ");
    const name = this.FUser.NOMBRE_COMPLETO.charAt(0).toUpperCase();
    const lastName = this.FUser.NOMBRE_COMPLETO.substring(npos + 1, this.FUser.NOMBRE_COMPLETO.length + 1);
    const Lape = lastName.charAt(0).toUpperCase();
    const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
    this.iconNameUser = newName;
  }

  logout(){
    this.router.navigate(['/']);
    this.activeIconPerfil = false;
    localStorage.clear();
  }


  valoresObjetos(obj: string, accion:string) {
    if (obj === 'usuario' || obj === 'todos'){
      this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
      const prm:any = {USUARIO: this.USUARIO_LOCAL};
      this._sDatosUser.getDataUser('INFO USUARIO', prm).subscribe((data: any)=> {
        const res = validatorRes(data);
        if ( (data.token !== undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.showModal(mensaje);
        } else {
          this.FUser = newArray[0];
          this._sgenerales.bajar_imagen('bajar imagenes', { RESPONSABLES: [{}], 
            params: { comprimir: true, tamX: 300, tamY: 400 } },'spActividades')
            .subscribe({
              next: (varch: any)=> {
                // Adiciona el path en el vector de la galería
                if (varch[0].ErrMensaje === '') {
                  const ix = varch.findIndex((r:any) => r.etiqueta === this.FUser.USUARIO);
                  if (ix !== -1) {
                    this.FUser.FOTO = varch[ix].path;
                    this.activeIconPerfil = false;
                  } else {
                    this.FUser.FOTO = '';
                    this.activeIconPerfil = true;
                    this.createIconName();
                  }
                } else {
                  this.FUser.FOTO = '';
                  this.activeIconPerfil = true;
                  this.createIconName();
                }
              }, error: (err => {
                this.showModal('Error procesando imagenes: '+err.message);
              })
            });
        };
      });
    };
  }

  showModal(mensaje:any) {
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
			title: 'Error!',
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
