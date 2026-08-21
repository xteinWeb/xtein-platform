import { CommonModule } from '@angular/common';
import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { BnNgIdleService } from 'bn-ng-idle';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { ApiRestService } from 'src/app/services/usuarios/api-rest.service';
import { PasswordComponent } from 'src/app/views/password/password.component';
import Swal from 'sweetalert2';
import { HeaderComponent } from './header/header.component';
import { LeftvarComponent } from './leftvar/leftvar.component';
import { DxButtonModule, DxListModule, DxLoadPanelModule, DxScrollViewComponent, DxScrollViewModule, DxSpeedDialActionModule, DxTextAreaModule } from 'devextreme-angular';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { SocketService } from 'src/app/services/socket/socket.service';
// import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { v4 as uuidv4 } from 'uuid';

import config from 'devextreme/core/config';
import { CHATComponent } from 'src/app/shared/CHAT/CHAT.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
config({
  floatingActionButtonConfig: {
    icon: 'comment',
    position: {
      my: 'right bottom',
      at: 'right bottom',
      of: '#container-body',
      offset: '-16 -16'
    }
  }
});


@Component({
    selector: 'app-dashboard',
    templateUrl: './default-layout.component.html',
    styleUrls: ['./default-layout.component.scss',
        '../../../../node_modules/@angular/material/prebuilt-themes/indigo-pink.css',
        '../../../assets/xtein.scss'],
    imports: [CommonModule, LeftvarComponent, HeaderComponent, PasswordComponent, UserProfileComponent,
        RouterOutlet, DxSpeedDialActionModule, DxListModule, DxButtonModule,
        DxTextAreaModule, DxScrollViewModule, DxLoadPanelModule, CommonModule, CHATComponent
    ]
})
export class DefaultLayoutComponent implements OnInit {

  @ViewChild('scrollViewBodyChat', { static: false }) scrollViewBodyChat: DxScrollViewComponent;

  TIEMPO_SESION: any;
  resizeObservable: Observable<Event>;
  collapsed: boolean;
  leftvarActive: any;
  bodyActive: any;
  subscription: Subscription;
  subscriptionMensages: Subscription;

  DUsuarios: any [] = [];
  chatsForUser: any [] = [];
  infoChatActivo: any = {};
  data_prev_mensaje: any = {};
  activeNewChat: boolean = false;
  activeChatUser: boolean = false;
  activeSendBtn: boolean = false;
  loadingVisible: boolean = false;
  mesajeText: string = '';
  USUARIO_LOCAL: any = '';
  EMPRESA: any = '';
  deviceId: string = '';

  constructor(
    private bnIdle: BnNgIdleService,
    private router: Router,
    private sData: ApiRestService,
    private _sgenerales: GeneralesService,
    public wsocket: SocketService,
  ){
    this.subscription = this.sData.getObs_collapsed()
      .subscribe((prm) => {
        this.collapsed = prm;
    });

    const timeUser: any = localStorage.getItem('TIEMPO_SESION');
    this.TIEMPO_SESION = timeUser;
    // this.bnIdle.startWatching(this.TIEMPO_SESION).subscribe((res) => {
    //   if(res) {
    //     Swal.fire({
		// 			title: '',
		// 			text: 'Tiempo de espera agotado, desea salir o continuar.?',
		// 			iconHtml: "<i class='icon-alert-ol'></i>",
		// 			showCancelButton: true,
		// 			confirmButtonColor: '#DF3E3E',
		// 			cancelButtonColor: '#438ef1',
		// 			cancelButtonText: 'Continuar',
		// 			confirmButtonText: 'Salir'
		// 		  }).then((result) => {
		// 			if (result.isConfirmed) {
    //         this.logout();
    //         //this.router.navigate(['/']);
		// 			}
		// 		});
    //   }
    // });

    this.valoresObjetos = this.valoresObjetos.bind(this);
  }

  ngOnInit(): void {
    const screen:number = window.innerWidth;
    if(screen <= 768)
      this.collapsed = true;
    else
      this.collapsed = false;

    this.sData.collapsed = this.collapsed;
    this.valoresObjetos('usuarios');
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.EMPRESA = localStorage.getItem('empresa')?.toUpperCase();
    this.deviceId = localStorage.getItem('device_id')!;
  };

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  drawerToggle(): void {
    this.collapsed = !this.collapsed;
    this.sData.collapsed = this.collapsed;
    this.sData.setObs_collapsed(this.collapsed);
  }

  onResized(event:any) {
    const screen:number = event.target.innerWidth;
    if(screen <= 768)
      this.collapsed = true;
    else
      this.collapsed = false;

    this.sData.collapsed = this.collapsed;
  }

  onWindowScroll($event:Event) {
    var container_header:any = document.getElementById('container-header');
    var header:any = document.getElementById('header-aplicacion');
    const constainer = document.getElementById('container-body') as HTMLElement;
    const router_container = document.getElementById('router-container') as HTMLElement;
    const container_tabs = document.querySelector('mat-tab-header') as HTMLElement;
    container_header.classList.toggle("container-header-toggle", constainer.scrollTop > 0);
    router_container.classList.toggle("container-router-compensacion", constainer.scrollTop > 0);
    container_tabs.classList.toggle("fixed-container-header", constainer.scrollTop > 0);
    header.classList.toggle("header-toggle", constainer.scrollTop > 0);
  }


  logout() {
    let data = {
      "data": {
        "DATOS": {
          "USUARIO": this.USUARIO_LOCAL,
          "DEVICEID": this.deviceId,
        },
      },
      "USUARIO": this.USUARIO_LOCAL,
      "EMPRESA": this.EMPRESA,
      "ACCION": "HISTORICO NOTIFICACION",
    };
    this.wsocket.disconnect(data);
    this.router.navigate(['/']);

    // Luego, desconectar el socket
    localStorage.clear();
  }

  // Relocaliza la barra de herramientas
  dimensBarra() {
    var barra = document.getElementsByClassName('cls-reg-barra') as HTMLCollectionOf<HTMLElement>;
    barra[0].style.setProperty('margin-left','5vw !important;');
    barra[0].style.backgroundColor = 'yellow !important';
  }

  valoresObjetos(obj:string) {
    if (obj === 'usuarios' || obj === 'todos'){
      const prm:any = {};
      this.sData.getUsuarios('USUARIOS', prm).subscribe((data: any)=> {
        const res = validatorRes(data);
        if ( (data.token !== undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje != '') {
          this.showModal(mensaje, 'Error');
        } else {
          // Baja las imagenes
          this._sgenerales.bajar_imagen('bajar imagenes', { RESPONSABLES: [{}],
            params: { comprimir: true, tamX: 300, tamY: 400 } },'spActividades')
            .subscribe({
              next: (varch: any)=> {
                // Adiciona el path en el vector de la galería
                if (varch[0].ErrMensaje === '') {
                  newArray.forEach((eleres:any) => {
                    const ix = varch.findIndex((r:any) => r.etiqueta === eleres.USUARIO);
                    if (ix !== -1) {
                      eleres.FOTO = varch[ix].path;
                      newArray.forEach((usuario:any) => {
                        if (usuario.USUARIO === eleres.USUARIO) {
                          usuario.FOTO = varch[ix].path;
                        }
                      });
                    } else {
                      const npos: any = eleres.NOMBRE.indexOf(" ");
                      const name = eleres.NOMBRE.charAt(0).toUpperCase();
                      const lastName = eleres.NOMBRE.substring(npos + 1, eleres.NOMBRE.length + 1);
                      const Lape = lastName.charAt(0).toUpperCase();
                      const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
                      eleres.iconNameUser = newName;
                    }
                  });
                } else {
                  newArray.forEach((eleres:any) => {
                    const npos: any = eleres.NOMBRE.indexOf(" ");
                    const name = eleres.NOMBRE.charAt(0).toUpperCase();
                    const lastName = eleres.NOMBRE.substring(npos + 1, eleres.NOMBRE.length + 1);
                    const Lape = lastName.charAt(0).toUpperCase();
                    const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
                    eleres.iconNameUser = newName;
                  });
                }
                this.DUsuarios = newArray;
                this._sgenerales.D_USUARIOS = JSON.parse(JSON.stringify(this.DUsuarios));
              }, error: (err => {
                this.showModal('Error procesando imagenes: '+err.message, 'error');
              })
            });
        };
      });
    };
    if (obj === 'historial'){
      this.loadingVisible = true;
      const prm:any = {USUARIO_ENV: this.USUARIO_LOCAL, USUARIO_REC: this.infoChatActivo.USUARIO};
      this.wsocket.getHistorial('HISTORICO CHAT', prm).subscribe((data: any)=> {
        this.loadingVisible = false;
        const res = validatorRes(data);
        if ( (data.token !== undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          // this.showModal(mensaje, 'Error');
          this.infoChatActivo.MENSAJES = [];
        } else {
          newArray.forEach((msj:any) => {
            if(msj.USUARIO_REC === this.USUARIO_LOCAL)
              msj.TYPE = 'received';
            else
              msj.TYPE = 'sent';
          });
          this.data_prev_mensaje = JSON.parse(JSON.stringify(newArray));
          this.infoChatActivo.MENSAJES = newArray;
          setTimeout(() => {
            this.scrollViewBodyChat.instance.scrollTo({ top: this.scrollViewBodyChat.instance.scrollHeight() });
          }, 400);
        };
      });
    };
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
