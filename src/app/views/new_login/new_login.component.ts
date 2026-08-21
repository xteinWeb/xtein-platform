
import { Component } from '@angular/core';
import { ApiRestService } from 'src/app/services/usuarios/api-rest.service';
import { SPasswordService } from '../password/-s-password.service';
import { AuthService } from 'src/app/shared/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { FLogin } from '../login/clsLogin.class';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { showToast } from '../../shared/toast/toastComponent.js';
import Swal from 'sweetalert2';
import { Subject, Subscription, lastValueFrom } from 'rxjs';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { SocketService } from 'src/app/services/socket/socket.service';
import { environment } from 'src/environments/environment';
import { GoogleService } from 'src/app/services/generales/google.service';

@Component({
    selector: 'app-new-login',
    templateUrl: './new_login.component.html',
    styleUrls: ['./new_login.component.css'],
    imports: [ReactiveFormsModule, FormsModule]
})
export class NewLoginComponent {
  empresas: any = [];
  username = new FormControl('');
  digitos: any[] = ['', '', '', '', '', '']; // Almacena los dígitos ingresados

  especAplicacion: any;
  loginForm: any = {
    USUARIO: '',
    PASSWORD: '',
    EMPRESA: '',
    ID_UN_ASOCIADA: '',
  };
  passwordForm: any = {
    USUARIO: '',
    NEW_PASSWORD: '',
    CONFIRM_PASSWORD: '',
  };

  private messageSubscription: Subscription;

  constructor(
    private sData: ApiRestService,
    private _sgenerales: GeneralesService,
    public socket: SocketService,
    public googleService: GoogleService,
    private auth: AuthService
  ) {
    this.focusOutFunction = this.focusOutFunction.bind(this);
  }

  ngOnInit(): void { }


  isComplete(): boolean {
    return this.digitos.every((d) => d !== '' && d !== null && d !== undefined);
  }

  onDigitInput(index: number) {
    const value = this.digitos[index]?.toString() || '';

    // Si se ingresó más de un dígito (ej. al pegar)
    if (value.length > 1) {
      const digitsArray = value.split('').filter(d => /\d/.test(d));
      digitsArray.forEach((digit, i) => {
        if (index + i < 6) {
          this.digitos[index + i] = digit;
        }
      });
      // Enfocar el último dígito ingresado o el siguiente
      const nextIndex = Math.min(index + digitsArray.length - 1, 5);
      this.focusInput(nextIndex);
    } else if (value.length === 1) {
      // Mover al siguiente input
      if (index < 5) {
        this.focusInput(index + 1);
      }
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.digitos[index] && index > 0) {
      // Si el input actual está vacío y se presiona borrar, retroceder
      this.focusInput(index - 1);
    }
  }

  focusInput(index: number) {
    setTimeout(() => {
      const element = document.getElementById(`digito${index + 1}`);
      if (element) {
        element.focus();
      }
    }, 0);
  }

  onPaste(event: ClipboardEvent, index: number) {
    event.preventDefault();
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text') || '';
    
    // Filtrar solo los números
    const digitsArray = pastedText.split('').filter(d => /\d/.test(d));
    
    if (digitsArray.length > 0) {
      digitsArray.forEach((digit, i) => {
        if (index + i < 6) {
          this.digitos[index + i] = digit;
        }
      });
      
      // Enfocar el último dígito ingresado o el siguiente
      const nextIndex = Math.min(index + digitsArray.length - 1, 5);
      this.focusInput(nextIndex);
    }
  }

  async onChangePassword(e: any, prm: any) {
    let front_face: any = '';
    let front_back: any = '';
    switch (prm) {
      case 'contrasena':
        front_face = document.querySelector('.face-front');
        front_face.style.transform = 'rotateY(-180deg)';
        front_back = document.querySelector('.face-back');
        front_back.style.transform = 'rotateY(0deg)';
        break;

      case 'salir':
        this.loginForm.USUARIO = '';
        this.loginForm.PASSWORD = '';
        this.loginForm.EMPRESA = '';
        this.loginForm.ID_UN_ASOCIADA = '';
        front_face = document.querySelector('.face-front');
        front_face.style.transform = 'rotateY(0deg)';
        front_back = document.querySelector('.face-back');
        front_back.style.transform = 'rotateY(-180deg)';
        let from_padre: any = document.querySelector('.from-padre');
        from_padre.style.transition = '.2s ease-out';
        from_padre.style.transform = 'translateX(0%)';
        // this.googleService.logOutGoogle();
        // localStorage.removeItem('Profile Google')

        break;

      case 'enviar':
        if (this.loginForm.USUARIO.length < 5) {
          showToast('El usuario es invalido', 'error');
          break;
        } else {
          const prm = { USUARIO: this.loginForm.USUARIO };
          this.sData.generarCodigo('GENERAR CODIGO', prm).subscribe({
            next: (res: any) => {
              console.log('Respuesta recibida:', res);
              console.log('Tipo de respuesta:', typeof res);
              
              let data: any;
              try {
                // Si ya viene como objeto, no necesita parsing
                if (typeof res === 'object' && res !== null) {
                  data = res;
                } else if (typeof res === 'string') {
                  data = JSON.parse(res);
                } else {
                  throw new Error('Formato de respuesta no válido');
                }
                
                console.log('Data procesada:', data);
                const msg = data[0].ErrMensaje;
                if (msg !== '') {
                  this.showModal(msg);
                } else {
                  const email = data[0].DATA_USER.EMAIL;
                  Swal.fire({
                    iconHtml: "<i class='icon-check-ol success-color'></i>",
                    confirmButtonColor: '#0F4C81',
                    title: 'Código Enviado',
                    text: `Se ha enviado el código de verificación al correo electrónico ${email}`,
                    allowOutsideClick: true,
                    allowEscapeKey: false,
                    allowEnterKey: false,
                    backdrop: true,
                    position: 'center',
                    stopKeydownPropagation: false,
                  }).then((result) => {
                    if (result.isConfirmed || result.isDismissed) {
                      // Navegar al input del código
                      const from_padre: any = document.querySelector('.from-padre');
                      from_padre.style.transition = '.2s ease-out';
                      from_padre.style.transform = 'translateX(-33.5%)';
                    }
                  });
                }
              } catch (error) {
                console.error('Error processing response:', error);
                console.error('Respuesta original:', res);
                this.showModal('Error al procesar la respuesta del servidor.');
              }
            },
            error: (error: any) => {
              console.error('Error en la API:', error);
              this.showModal('Error de conexión. Intente nuevamente.');
            }
          });
        }
        break;

      case 'aceptar':
        if (!this.isComplete()) {
          showToast('Digite todos los números del código (6 dígitos).', 'error');
          break;
        }
        else {
          const prm = {
            USUARIO: this.loginForm.USUARIO,
            CODIGO: this.digitos.join(''),
          };
          console.log(prm);
          const apiRest = this.sData.validateCodigo('VERIFICAR CODIGO', prm);
          const res = await lastValueFrom(apiRest, { defaultValue: true });
          const data = res;
          const msg = data.ErrMensaje;
          if (msg !== '') {
            this.showModal(msg);
          } else {
            this.passwordForm.USUARIO = this.loginForm.USUARIO;

            const from_padre: any = document.querySelector('.from-padre');
            from_padre.style.transition = '.2s ease-out';
            from_padre.style.transform = 'translateX(-67%)';
          }
        }
        break;

      default:
        break;
    }
  }

  focusOutFunction(e: any) {
    if (this.loginForm.USUARIO.length >= 5) {
      const prm = { USUARIO: this.loginForm.USUARIO };
      this.sData.usuarioValido('USUARIO VALIDO', prm).subscribe((data: any) => {
        const res = JSON.parse(data);
        const mensaje = res[0].ErrMensaje;
        if (mensaje != '') {
          this.showModal(mensaje);
        } else {
          this.empresas = res[0].EMPRESAS;
          this.loginForm.ID_UN_ASOCIADA = res[0].ID_UN_ASOCIADA;
          this.loginForm.EMPRESA = res[0].EMPRESAS[0].ID_UN;
        }
      });
    } else {
      showToast('Usuario con minimo 5 caracteres.', 'warning');
    }
  }

  login(datos: any) {
    // console.log(this.loginForm);
    
    if (this.onValidator())
      this.auth.login(datos);
    let nombreEmpresa = this.empresas.find(
      (e: any) => e.ID_UN === datos.EMPRESA
    );

    localStorage.setItem('nombre empresa', nombreEmpresa.NOMBRE);
    // this.googleService.loginGoogle()
  }

  // Respuesta accion del correo
  onRespuestaEnvioCorreo(datos: any) {
    showToast('Enviando correo. Espere un momento...');

    let template =
      this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'TEMPLATE')
        ?.VALOR_DEFECTO ?? '';
    let filtroRep: any = '';
    const prmRpt = {
      usuario: this.username.value,
      filtro: JSON.stringify(filtroRep),
      prm_email: datos,
      template,
      replacements: {
        CODIGO: datos.CODIGO,
        NOMBRE_USUARIO: datos.NOMBRE_USUARIO,
      },
    };
    let data = {
      data: {
        datos:
          prmRpt
      },
      USUARIO: this.username.value
    }
    let urlConnect = `${environment.apiWebSocket}userIdChangePass=${this.username.value}`
    this.socket.sendSocketEmail(urlConnect, 'email', 'get_data_email', data);
    setTimeout(() => {
      showToast('Correo enviado a ' + datos.DESTINO_EMAIL);
      const from_padre: any = document.querySelector('.from-padre');
      from_padre.style.transition = '.2s ease-out';
      from_padre.style.transform = 'translateX(-33.5%)';
    }, 5000);
  }

  // Validador de contraseñas seguras
  validateSecurePassword(password: string): { isValid: boolean; message: string } {
    const errors: string[] = [];
    
    // Lista de contraseñas prohibidas y patrones inseguros
    const forbiddenPasswords = [
      'admadm123', '123456', '12345678', 'password', 'admin', 'qwerty',
      'letmein', 'welcome', '1234', '12345', '123123', 'abc123',
      'password123', 'admin123', '1111', '0000', '9999', 'test',
      'user', 'guest', 'demo', '111111', '222222', '333333'
    ];
    
    // Verificar longitud mínima
    if (password.length < 8) {
      errors.push('Mínimo 8 caracteres');
    }
    
    // Verificar longitud máxima
    if (password.length > 128) {
      errors.push('Máximo 128 caracteres');
    }
    
    // Verificar contraseñas prohibidas (insensible a mayúsculas)
    const lowerPassword = password.toLowerCase();
    if (forbiddenPasswords.some(forbidden => lowerPassword.includes(forbidden))) {
      errors.push('No usar contraseñas comunes o inseguras');
    }
    
    // Verificar que no contenga el nombre de usuario
    if (this.loginForm.USUARIO && lowerPassword.includes(this.loginForm.USUARIO.toLowerCase())) {
      errors.push('No debe contener el nombre de usuario');
    }
    
    // Verificar patrones secuenciales
    const sequentialPatterns = [
      '123456', '654321', 'abcdef', 'fedcba', 'qwerty', 'asdfgh',
      '098765', '567890', 'mnbvcx', 'zxcvbn'
    ];
    if (sequentialPatterns.some(pattern => lowerPassword.includes(pattern))) {
      errors.push('No usar secuencias de caracteres consecutivos');
    }
    
    // Verificar complejidad: debe tener TODOS estos tipos de caracteres
    const hasLowerCase = /[a-z]/.test(password); // minúsculas
    const hasUpperCase = /[A-Z]/.test(password); // mayúsculas  
    const hasNumbers = /[0-9]/.test(password); // números
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(password); // caracteres especiales
    
    if (!hasLowerCase) {
      errors.push('Al menos una letra minúscula (a-z)');
    }
    
    if (!hasUpperCase) {
      errors.push('Al menos una letra mayúscula (A-Z)');
    }
    
    if (!hasNumbers) {
      errors.push('Al menos un número (0-9)');
    }
    
    if (!hasSpecialChars) {
      errors.push('Al menos un carácter especial (!@#$%^&*-_=+)');
    }
    
    // Verificar que no sea solo repetición del mismo carácter
    if (/^(.)\1+$/.test(password)) {
      errors.push('No puede ser solo repetición del mismo carácter');
    }
    
    if (errors.length > 0) {
      return { 
        isValid: false, 
        message: `La contraseña debe cumplir: ${errors.join(', ')}` 
      };
    }
    
    return { isValid: true, message: 'Contraseña válida.' };
  }

  onValidator() {
    if (this.loginForm.USUARIO.length < 5) {
      showToast('El usuario es invalido', 'error');
      return false;
    }
    if (
      this.loginForm.USUARIO !== '' &&
      this.loginForm.PASSWORD !== '' &&
      this.loginForm.EMPRESA !== ''
    )
      return true;
    else {
      showToast('Faltan datos por completar.', 'error');
      return false;
    }
  }

  valuechangedPassword(e: any, campo: any) {
    switch (campo) {
      case 'NEW_PASSWORD':
        const passwordValidation = this.validateSecurePassword(this.passwordForm.NEW_PASSWORD);
        if (!passwordValidation.isValid) {
          showToast(passwordValidation.message, 'error');
        } else {
          showToast('Contraseña válida.', 'success');
        }
        break;

      case 'CONFIRM_PASSWORD':
        const confirmValidation = this.validateSecurePassword(this.passwordForm.CONFIRM_PASSWORD);
        if (!confirmValidation.isValid) {
          showToast(confirmValidation.message, 'error');
        } else if (this.passwordForm.CONFIRM_PASSWORD !== this.passwordForm.NEW_PASSWORD) {
          showToast('Las contraseñas no coinciden!', 'error');
        } else {
          showToast('Las contraseñas coinciden.', 'success');
        }
        break;

      default:
        showToast('ERROR: Llene el formulario.', 'error');
        break;
    }
  }

  cambiarPassword(e: any) {
    // Validar contraseña final antes de enviar
    const finalValidation = this.validateSecurePassword(e.CONFIRM_PASSWORD);
    if (!finalValidation.isValid) {
      showToast(finalValidation.message, 'error');
      return;
    }
    
    // Verificar que las contraseñas coincidan
    if (e.NEW_PASSWORD !== e.CONFIRM_PASSWORD) {
      showToast('Las contraseñas no coinciden!', 'error');
      return;
    }
    
    const prm = { USUARIO: e.USUARIO, PASSWORD: e.CONFIRM_PASSWORD };
    this.sData.changePassword('UPDATE PASSWORD', prm).subscribe((data: any) => {
      const res = JSON.parse(data);
      const mensaje = res[0].ErrMensaje;
      if (mensaje != '') {
        this.showModal(mensaje);
      } else {
        showToast('Contraseña actualizada exitosamente.', 'success');
        this.loginForm = {
          USUARIO: '',
          PASSWORD: '',
          EMPRESA: '',
          ID_UN_ASOCIADA: '',
        };
        this.passwordForm = {
          USUARIO: '',
          NEW_PASSWORD: '',
          CONFIRM_PASSWORD: '',
        };
        let front_face: any = document.querySelector('.face-front');
        front_face.style.transform = 'rotateY(0deg)';
        let front_back: any = document.querySelector('.face-back');
        front_back.style.transform = 'rotateY(-180deg)';
        let from_padre: any = document.querySelector('.from-padre');
        from_padre.style.transition = '.2s ease-out';
        from_padre.style.transform = 'translateX(0%)';
      }
    });
  }

  showModal(mensaje: any) {
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
  