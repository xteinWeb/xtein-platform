import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiRestService } from '../../services/usuarios/api-rest.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService  {

  private endPoint = environment.apiUrl;

  constructor(private http: HttpClient, private sData: ApiRestService, private router: Router) { }

  login(user: any) {
    const prm = {
      USUARIO: user.USUARIO,
      CONTRASENA: user.PASSWORD,
      EMPRESA: user.EMPRESA,
      ID_UN_ASOCIADA: user.ID_UN_ASOCIADA
    };
    this.sData.usuarioLogin('USUARIO CREDENCIALES', prm).subscribe((data: any) => {
      const mensaje = data.ErrMensaje;
      const token = data.token;
      if(mensaje != 'VALIDO'){
        this.showModal(mensaje);
      } else {
        this.saveLocalStorage(data, prm);
        this.router.navigate(['/home']);
      };
    }, (err: any) => {
      this.showModal(err.error.ErrMensaje);
    });
  }

  saveLocalStorage(data: any, prm:any){
    let usuario = prm.USUARIO;
    let user_name = data.user_name;
    let empresa = prm.EMPRESA;
    let ID_UN_ASOCIADA = prm.ID_UN_ASOCIADA;
    let foto_perfil_user = data.foto_perfil_user;
    let token = data.token;
    let TIEMPO_SESION: any = data.TIEMPO_SESION * 60;
    localStorage.setItem('email', data.EMAIL);
    localStorage.setItem('usuario', usuario);
    localStorage.setItem('user_name', user_name);
    localStorage.setItem('empresa', empresa);
    localStorage.setItem('ID_UN_ASOCIADA', ID_UN_ASOCIADA);
    localStorage.setItem('foto_perfil_user', foto_perfil_user);
    localStorage.setItem('token', token);
    localStorage.setItem('TIEMPO_SESION', TIEMPO_SESION);
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