
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DxButtonModule, DxDateBoxModule, DxListModule, DxPopupModule, DxToolbarModule, DxTooltipModule } from 'devextreme-angular';
import { libtools } from 'src/app/shared/common/libtools';
import { SocketService } from 'src/app/services/socket/socket.service';
import Swal from 'sweetalert2';
import { Subject, Subscription } from 'rxjs';
import { GES_INFOComponent } from 'src/app/shared/Tareas/GES_INFO/GES_INFO.component';
import { GES001Service } from 'src/app/services/GES001/GES001.service';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { showToast } from '../../toast/toastComponent.js';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';

@Component({
    selector: 'app-notificacion',
    templateUrl: './notificacion.component.html',
    styleUrls: ['./notificacion.component.css'],
    imports: [
    DxListModule,
    DxDateBoxModule,
    GES_INFOComponent,
    DxPopupModule
]
})
export class NotificacionComponent implements OnInit {
  @Input() notifications: any;
  @Output() badgeNotificaciones: EventEmitter<any> = new EventEmitter();
  ltool: any;
  eventsGesInfo: Subject<any> = new Subject<any>();
  DResponsables: any = [];
  USUARIO_LOCAL: any = '';
  EMPRESA: any = '';
  popupVisible: boolean = false;

  constructor(
    private _sbarreg: SbarraService,
    private tabService: TabService,
    private _sdatos: GES001Service,
    public socket: SocketService
  ) {
    this.EMPRESA = localStorage.getItem("empresa")?.toUpperCase();
    this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase();
    this.abrirApl = this.abrirApl.bind(this);

    this.ltool = new libtools(this._sbarreg, this.tabService);
  }
  ngOnInit(): void {
    this.valoresObjetos('todos', '');
    this.popupVisible = true;
  }

  // ****** Adiciona a la página de tareas la aplicacion seleccionada ******
  // Buscar en el arbol de aplicaciones si es una aplicacion
  // Abrir la aplicacion si no está abierta


  async abrirApl(item: any) {
    if (item.ACTIVIDAD.ACCION === 'nueva_actividad') {
      item.ID_APLICACION = 'GES-001';
      item.title = item.NOMBRE_APLICACION;
      item.icon = item.icon;
      item.TABLA = item.TABLA;
      this.ltool.abrirApl(item, 'abrir aplicacion');
      localStorage.setItem('nueva_actividad', JSON.stringify(item))
    } else if (item.ACTIVIDAD.ACCION === 'modifico_actividad') {
      this.eventsGesInfo.next({
        accion: 'cargar datos',
        config: { accion: 'cargar datos notificacion', dataSource: item.ACTIVIDAD.ACTIVIDAD_DATA, readOnly: true, VISIBLE: true },
      });
    }
    this.changeStatus(item, 'Visto')
  }

  showModal(mensaje: any, title?: any) {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
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

  valoresObjetos(obj: string, data: any) {
    if (obj === 'responsables' || obj === 'todos') {
      const prm: any = {};
      this._sdatos.getResponsables('RESPONSABLES', prm).subscribe(
        (data: any) => {
          const res = validatorRes(data);
          if (data.token !== undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          const newArray = res;
          const mensaje = newArray[0].ErrMensaje;
          if (mensaje !== '') {
            showToast(mensaje, 'Error');
          } else {
            for (let i = 0; i < res.length; i++) {
              const element = res[i];
              element.ITEM = i;
            }
            this.DResponsables = res;
            this.eventsGesInfo.next({
              accion: 'cargar datos',
              config: {
                accion: 'update data config',
                parametro: 'RESPONSABLE',
                dataSource: res,
              },
            });
            this.eventsGesInfo.next({
              accion: 'cargar datos',
              config: {
                accion: 'update data config',
                parametro: 'COLABORADORES',
                dataSource: res,
              },
            });
          }
        },
        (err: any) => {
          this.showModal(err.message, 'Error');
        }
      );
    }
    if (obj === 'estados' || obj === 'todos') {
      const prm: any = { ID_GRUPO_DOMINIO: 'ESTADOS GES' };
      this._sdatos.getEstados('ESTADOS', prm).subscribe(
        (data: any) => {
          const res = validatorRes(data);
          if (data.token !== undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          const newArray = res;
          const mensaje = newArray[0].ErrMensaje;
          if (mensaje !== '') {
            showToast(mensaje, 'Error');
          } else {
            this.eventsGesInfo.next({
              accion: 'cargar datos',
              config: {
                accion: 'update data config',
                parametro: 'ESTADO',
                dataSource: res,
              },
            });
          }
        },
        (err: any) => {
          this.showModal(err.message, 'Error');
        }
      );
    }
  }
  changeStatus(item: any, estado: string) {
    let response: any = {
      USUARIO: this.USUARIO_LOCAL,
      EMPRESA: this.EMPRESA,
      ACCION: 'CAMBIO ESTADO'
    };

    if (item === 'todos') {
      this.badgeNotificaciones.emit('resetear');
      let notificaciones = this.notifications[0].DATA;
      for (let i = 0; i < notificaciones.length; i++) {
        let element = notificaciones[i];
        if (element.ESTADO === 'Enviado') {
          element.ESTADO = estado;
          response = {
            data: {
              TIPO: 'NOTIFICACION',
              DATOS: element,
            },
            ...response
          }
          this.socket.sendSocket('change_state', 'get_data_change_state', response);
          response = {
            USUARIO: this.USUARIO_LOCAL,
            EMPRESA: this.EMPRESA,
            ACCION: 'CAMBIO ESTADO'
          };
        }
      }
    } else {
      if (estado === 'Enviado') {
        this.badgeNotificaciones.emit('sumar');
      } else if (estado === 'Visto') {
        this.badgeNotificaciones.emit('restar');
      }
      item.ESTADO = estado;
      item.FECHA_UPDATE = new Date();
      response = {
        data: {
          TIPO: 'NOTIFICACION',
          DATOS: item,
        },
        ...response
      }
      this.socket.sendSocket('change_state', 'get_data_change_state', response);
    }
  }
  popup_showing(e: any) {
  }
  openPopup() {
    this.popupVisible = true;
  }
}
