import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import Swal from 'sweetalert2';

import { ApiRestService } from '../../services/usuarios/api-rest.service';
import { AuthService } from '../../shared/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { SPasswordService } from '../password/-s-password.service';
import { FLogin } from './clsLogin.class';
import notify from 'devextreme/ui/notify';
import { PasswordComponent } from '../password/password.component';
import { DxFormModule, DxSelectBoxModule, DxTextBoxModule, DxToolbarModule } from 'devextreme-angular';

import { showToast } from '../../shared/toast/toastComponent.js'

@Component({
    selector: 'login-component',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css',
        "../../../assets/xtein.scss"],
    imports: [DxToolbarModule, PasswordComponent, DxFormModule, DxTextBoxModule, DxSelectBoxModule]
})
export class LoginComponent implements OnInit {

  FLogin: FLogin;
  empresas: any = [];
  username = new UntypedFormControl('');
  displayPassword: boolean = false;
  passwordMode: string;
  buttonOptionsVer: any;
  buttonOptionsOcultar: any;
  visiblePasswordIconVer: boolean = false;
  visiblePasswordIconOcultar: boolean = false;

  constructor(
    private sData: ApiRestService,
    private _sdatosPaswword: SPasswordService,
    private auth: AuthService,
    private http: HttpClient
  ) {
    this.passwordMode = 'password';
    this.buttonOptionsVer = {
      icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyNC4wLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDI4IDIwIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAyOCAyMDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4NCgkuc3Qwe2ZpbGw6IzMzMzMzMzt9DQo8L3N0eWxlPg0KPGc+DQoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTIyLjMsMi42Yy0wLjUtMC40LTIuMS0xLjUtNC42LTIuMkMxNi44LDAuMiwxNS45LDAuMSwxNSwwYzAsMCwwLDAsMCwwYy0wLjMsMC0wLjYsMC0xLDBjMCwwLDAsMCwwLDANCgkJYzAsMCwwLDAsMCwwczAsMCwwLDBjLTAuMywwLTAuNywwLTEsMGMwLDAsMCwwLDAsMGMtMSwwLjEtMS45LDAuMi0yLjcsMC40QzcuOCwxLjEsNi4yLDIuMyw1LjcsMi42QzEuNiw1LjYsMCwxMCwwLDEwDQoJCXMzLjQsMTAsMTQsMTBjMTAuNiwwLDE0LTEwLDE0LTEwUzI2LjQsNS42LDIyLjMsMi42eiBNMjEuOCw4LjVjMCw1LTMuNSw5LjEtNy44LDkuMXMtNy44LTQuMS03LjgtOS4xYzAtMS42LDAuMy0zLjEsMS00LjQNCgkJYzEuMi0wLjgsMi41LTEuNCw0LjItMS44YzAsMCwwLjEsMCwwLjEsMGMwLjMtMC4xLDAuNy0wLjEsMS4xLTAuMmMwLjEsMCwwLjEsMCwwLjIsMEMxMy4xLDIsMTMuNSwyLDE0LDJjMCwwLDAsMCwwLDANCgkJYzAuNSwwLDAuOSwwLDEuMywwLjFjMC4xLDAsMC4xLDAsMC4yLDBjMC40LDAsMC43LDAuMSwxLjEsMC4yYzAsMCwwLDAsMC4xLDBjMS42LDAuMywzLDEsNC4yLDEuOEMyMS41LDUuNCwyMS44LDcsMjEuOCw4LjV6DQoJCSBNMi4yLDEwLjFjMC40LTAuOCwxLjEtMiwyLjEtMy40QzQuMiw3LjMsNC4yLDcuOSw0LjIsOC41YzAsMi42LDAuOCw1LDIuMSw2LjlDMy45LDEzLjUsMi43LDExLjIsMi4yLDEwLjF6IE0yMS43LDE1LjQNCgkJYzEuMy0xLjksMi4xLTQuMywyLjEtNi45YzAtMC42LTAuMS0xLjItMC4xLTEuOGMxLjEsMS4zLDEuOCwyLjYsMi4xLDMuNEMyNS4zLDExLjIsMjQuMSwxMy41LDIxLjcsMTUuNHoiLz4NCgk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMTQsNC42Yy0wLjcsMC0xLjQsMC4xLTIsMC40YzAuMSwwLDAuMiwwLDAuMywwYzEuMSwwLjIsMi4xLDEuMSwyLjMsMi4zYzAuNCwyLTEuNCwzLjgtMy40LDMuNA0KCQljLTEuMS0wLjItMS45LTEtMi4yLTIuMUM4LjksOSw4LjgsOS40LDguOCw5LjhjMCwyLjksMi4zLDUuMiw1LjIsNS4yczUuMi0yLjMsNS4yLTUuMlMxNi45LDQuNiwxNCw0LjZ6Ii8+DQo8L2c+DQo8L3N2Zz4NCg==',
      onClick: () => {
        this.onPreparingButton();
      },
    };
    this.buttonOptionsOcultar = {
      icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyNC4wLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDI4IDIwIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAyOCAyMDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4NCgkuc3Qwe2ZpbGw6IzMzMzMzMzt9DQo8L3N0eWxlPg0KPGc+DQoJPGc+DQoJCTxnPg0KCQkJPHBhdGggY2xhc3M9InN0MCIgZD0iTTI0LjEsNC4yYy0wLjEsMC4xLTAuNywwLjctMS42LDEuNmMtMC4xLDAuMS0wLjMsMC4zLTAuNSwwLjVjLTAuMSwwLjEtMC4zLDAuMy0wLjQsMC40DQoJCQkJYzAuMSwwLjYsMC4yLDEuMywwLjIsMS45YzAsMC4zLDAsMC41LDAsMC43Yy0wLjMsNC43LTMuNyw4LjQtNy44LDguNGMtMC4yLDAtMC40LDAtMC41LDBsMCwwYzAsMCwwLDAsMCwwDQoJCQkJYy0wLjgtMC4xLTEuNS0wLjMtMi4zLTAuNmwwLDBjLTEuMSwxLjEtMS45LDEuOS0yLjEsMi4xYzEuNCwwLjUsMy4xLDAuOCw0LjksMC44YzEwLjYsMCwxNC0xMCwxNC0xMFMyNi45LDYuOSwyNC4xLDQuMnoNCgkJCQkgTTIxLjcsMTUuNGMxLjMtMS45LDIuMS00LjMsMi4xLTYuOWMwLTAuNCwwLTAuOC0wLjEtMS4yTDI0LDcuMWMwLjksMS4yLDEuNSwyLjMsMS44LDNDMjUuMywxMS4yLDI0LjEsMTMuNSwyMS43LDE1LjR6Ii8+DQoJCTwvZz4NCgkJPGc+DQoJCQk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMTMuMywxNWMwLjIsMCwwLjUsMC4xLDAuNywwLjFjMi45LDAsNS4yLTIuMyw1LjItNS4yYzAtMC4yLDAtMC41LTAuMS0wLjdDMTksOS4zLDEzLjUsMTQuNywxMy4zLDE1eiIvPg0KCQk8L2c+DQoJPC9nPg0KCTxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yMy43LDAuM2MtMC40LTAuNC0xLTAuNC0xLjQsMGwtMS40LDEuNGMtMC43LTAuNC0xLjgtMC45LTMtMS4yYy0wLjEsMC0wLjEsMC0wLjItMC4xYy0wLjMtMC4xLTAuNy0wLjItMS0wLjINCgkJYy0wLjEsMC0wLjIsMC0wLjMtMC4xYy0wLjMsMC0wLjUtMC4xLTAuOC0wLjFjLTAuMSwwLTAuMiwwLTAuNCwwQzE0LjgsMCwxNC40LDAsMTQsMGgwaDBjLTAuMywwLTAuNywwLTEsMGMwLDAsMCwwLDAsMA0KCQljLTEsMC4xLTEuOSwwLjItMi43LDAuNEM3LjgsMS4xLDYuMiwyLjMsNS43LDIuNkMxLjYsNS42LDAsMTAsMCwxMHMxLjQsNC4yLDUuNCw3LjJsLTEuMSwxLjFjLTAuNCwwLjQtMC40LDEsMCwxLjQNCgkJQzQuNSwxOS45LDQuNywyMCw1LDIwczAuNS0wLjEsMC43LTAuM2wxLjQtMS40YzAsMCwwLDAsMCwwQzcuNiwxNy44LDIyLjUsMi45LDIyLjYsMi45YzAsMCwwLDAsMCwwbDEuMi0xLjINCgkJQzI0LjEsMS4zLDI0LjEsMC43LDIzLjcsMC4zeiBNNy4yLDQuMWMxLjItMC44LDIuNS0xLjQsNC4yLTEuOGMwLDAsMC4xLDAsMC4xLDBjMC4zLTAuMSwwLjctMC4xLDEuMS0wLjJjMC4xLDAsMC4xLDAsMC4yLDANCgkJQzEzLjEsMiwxMy41LDIsMTQsMmMwLDAsMCwwLDAsMGMwLjQsMCwwLjksMCwxLjMsMC4xYzAuMSwwLDAuMSwwLDAuMiwwYzAuNCwwLDAuOCwwLjEsMS4zLDAuMmMwLDAsMCwwLDAuMSwwDQoJCWMwLjksMC4yLDEuNywwLjUsMi41LDAuOUwxNyw1LjZjLTAuOC0wLjYtMS45LTEtMy0xYy0wLjcsMC0xLjQsMC4xLTIsMC40YzAuMSwwLDAuMiwwLDAuMywwYzEuMSwwLjIsMi4xLDEuMSwyLjMsMi4zDQoJCWMwLDAuMiwwLjEsMC41LDAsMC43bC0yLjcsMi43Yy0wLjIsMC0wLjUsMC0wLjcsMGMtMS4xLTAuMi0xLjktMS0yLjItMi4xQzguOSw5LDguOCw5LjQsOC44LDkuOGMwLDEuMSwwLjQsMi4yLDEsM2wtMS43LDEuNw0KCQljLTEuMi0xLjYtMS45LTMuNy0xLjktNkM2LjIsNyw2LjUsNS40LDcuMiw0LjF6IE0yLjIsMTBjMC40LTAuOCwxLjEtMiwyLjEtMy40QzQuMiw3LjMsNC4yLDcuOSw0LjIsOC41YzAsMi42LDAuOCw0LjksMi4xLDYuOA0KCQlDNCwxMy41LDIuNywxMS4yLDIuMiwxMHoiLz4NCjwvZz4NCjwvc3ZnPg0K',
      onClick: () => {
        this.onPreparingButton();
      },
    };
  }

  ngOnInit(): void {
    this.FLogin = { USUARIO: '', PASSWORD: '', EMPRESA: '', ID_UN_ASOCIADA: ''};
  };

  onPreparingButton() {
    this.passwordMode = this.passwordMode === 'text' ? 'password' : 'text';
    if (this.passwordMode === 'text') {
      this.visiblePasswordIconOcultar = !this.visiblePasswordIconOcultar;
      this.visiblePasswordIconVer = !this.visiblePasswordIconVer;
    }
    if (this.passwordMode === 'password') {
      this.visiblePasswordIconOcultar = !this.visiblePasswordIconOcultar;
      this.visiblePasswordIconVer = !this.visiblePasswordIconVer;
    }
  }
  
  focusOutFunction(e: any) {
    this.FLogin.USUARIO = e.value;
    if (this.FLogin.USUARIO.length >= 5) {
      const prm = {USUARIO: this.FLogin.USUARIO};
      this.sData.usuarioValido('USUARIO VALIDO', prm).subscribe((data: any)=> {
        const res = JSON.parse(data);
        const mensaje = res[0].ErrMensaje;
        if ( mensaje != ''){
          this.showModal(mensaje);
        } else {
          this.displayPassword = res[0].CAMBIAR_CLAVE;
          const data:any = { CAMBIO_PASSWORD: this.displayPassword, USUARIO: this.FLogin.USUARIO };
          this._sdatosPaswword.setPassword(data);
          this.empresas = res[0].EMPRESAS;
          this.FLogin.ID_UN_ASOCIADA = res[0].ID_UN_ASOCIADA;
        }
      });
    }
  };

  onFocusInButtonPassword(e:any) {
    if (this.passwordMode === 'password') {
      this.visiblePasswordIconVer = true;
      this.visiblePasswordIconOcultar = false;
    };
    if (this.passwordMode === 'text') {
      this.visiblePasswordIconVer = false;
      this.visiblePasswordIconOcultar = true;
    }
  }

  onFocusOutButtonPassword(e:any) {
    this.visiblePasswordIconVer = false;
    this.visiblePasswordIconOcultar = false;
  }

  onValueChangedPassword(e:any) {
    this.FLogin.PASSWORD = e.value;
  }

  onValueChangedEmpresa(e:any) {
    this.FLogin.EMPRESA = e.value;
  }

  login(loginForm:any){
    if (this.onValidator()) {
      this.auth.login(loginForm);
      let nombreEmpresa = this.empresas.find((e:any) => e.ID_UN === loginForm.EMPRESA);
      localStorage.setItem("nombre empresa", nombreEmpresa.NOMBRE);
    };
  }

  onValidator() {
    if (this.FLogin.USUARIO.length < 5) {
      showToast('El usuario es invalido', 'error');
      return false
    };
    if (this.FLogin.USUARIO !== '' && this.FLogin.PASSWORD !== '' && this.FLogin.EMPRESA !== '') return true;
    else {
      showToast('Faltan datos por completar.', 'error');
      return false;
    }
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