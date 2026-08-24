import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, NgZone} from '@angular/core';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { SPasswordService } from 'src/app/views/password/-s-password.service';
import { clsBarraRegistro } from '../../regbarra/_clsBarraReg';
import { Router } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { SbarraService } from '../../regbarra/_sbarra.service';
import { Subject, Subscription } from 'rxjs';
import { SocketService } from 'src/app/services/socket/socket.service';
import { ApiRestService } from 'src/app/services/usuarios/api-rest.service';
import Swal from 'sweetalert2';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import {
  DxButtonModule,
  DxDateBoxModule,
  DxListComponent,
  DxListModule,
  DxLoadPanelModule,
  DxPopupModule,
  DxScrollViewComponent,
  DxSelectBoxModule,
  DxToolbarModule,
} from 'devextreme-angular';
import { TabService } from '../../tabs/tab.service';
import { libtools } from 'src/app/shared/common/libtools';
import { showToast } from 'src/app/shared/toast/toastComponent.js';
import { UserServiceService } from '../user-profile/user-service.service';
import notify from 'devextreme/ui/notify';
import { environment } from 'src/environments/environment';
import { GES_INFOComponent } from 'src/app/shared/Tareas/GES_INFO/GES_INFO.component';
import { BARRAComponent } from '../Barra/BARRA.component';
import { GoogleService } from 'src/app/services/generales/google.service';
import { v4 as uuidv4 } from 'uuid';
import { BUZONComponent } from 'src/app/shared/CHAT/BUZON/BUZON.component';
@Component({
    selector: 'header-component',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: true,
    imports: [    
    MatBadgeModule,
    DxDateBoxModule,
    DxListModule,
    DxPopupModule,
    DxSelectBoxModule,
    DxLoadPanelModule,
    DxButtonModule,
    DxToolbarModule,
    GES_INFOComponent,
    BARRAComponent,
    BUZONComponent
]
})
export class HeaderComponent implements OnInit, AfterViewInit, OnDestroy  {
  @ViewChild('scrollViewBodyChat', { static: false })
  scrollViewBodyChat: DxScrollViewComponent;
  @ViewChild('listUsuarios', { static: false }) listUsuarios: DxListComponent;
  @ViewChild('listNotification', { static: false }) listNotification: DxListComponent;
  @ViewChild('containerHeaderUno', { static: false }) containerHeaderUno!: ElementRef<HTMLElement>;
  @ViewChild('containerHeaderDos', { static: false }) containerHeaderDos!: ElementRef<HTMLElement>;
  eventsGesInfo: Subject<any> = new Subject<any>();

  title = 'Dashboard';
  subscription: Subscription;
  subscriptionAplicaciones: Subscription;
  subscriptionNotifications: Subscription;
  subscriptionBadgeNtf: Subscription;
  subscriptionBadgeMjs: Subscription;
  subscriptionHNotifications: Subscription;
  subscriptionHchat: Subscription;
  subscriptionActiveChat: Subscription;
  subscriptionUserOnline: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  activeIconPerfil: boolean = false;
  visibleBuscar: boolean = false;
  iconNameUser: any;
  matBadgeNotificaciones: number = 0;
  matBadgeMensajes: number = 0;
  matBadgeInbox: number = 0;
  userName: any;

  DResponsables: any[] = [];
  DAplicaciones: any[] = [];
  Aplicaciones: any[] = [];
  textNotification: string = 'Cargando...';
  notifications: any[] = [{ GRUPO: 'Hoy', DATA: [] }];
  selectAplicacion: any[] = [];
  USUARIO_LOCAL: any = '';
  EMPRESA: any = '';
  EMAIL_USUARIO_LOCAL: any = '';
  ltool: any;
  especAplicacion: any;
  DUsuarios: any[] = [];
  DUserOnline: any[] = [];
  chatsForUser: any[] = [];
  selectUsuario: any[] = [];
  notificationsRecordatorios: any[] = [];
  loadingVisible: boolean = false;
  infoChatActivo: any = {};
  data_prev_mensaje: any = {};

  titlePopup: any = '';
  ofDropdownNTF: any = '';
  estadoPopup: any = 'cerrardo';
  estadoPopupChat: any = 'cerrardo';
  optionsPopup: any = {};
  popupVisible: boolean = false;
  showTitlePopup: boolean = false;
  popupVisibleChat: boolean = false;
  visible_toolbar_item: boolean = false;
  deviceId: string = '';
  private resizeObservers: ResizeObserver[] = [];
  constructor(
    private _sdatosPaswword: SPasswordService,
    private _sdatosUser: UserServiceService,
    private router: Router,
    private _sbarreg: SbarraService,    
    public wsocket: SocketService,
    private sData: ApiRestService,
    private _sgenerales: GeneralesService,
    public googleService: GoogleService,
    private tabService: TabService,
    private ngZone: NgZone
  ) {
    localStorage.removeItem('nueva_actividad');
    this.subscription = this._sbarreg.getObsMenuReg().subscribe((prmBarra) => {
      // Procesa acción...
      this.prmUsrAplBarReg = prmBarra;
    });

    this.subscriptionNotifications = this.wsocket
    .emitnotificactions()
    .subscribe((prm) => {
      if (prm.DESCRIPCION === 'Envio de Correo') {
        prm.DESCRIPCION = 'Se le ha enviado un correo electronico...'
        this.alertNtf(prm);
        return;
      } else if (prm.DESCRIPCION !== 'Envio de Correo') {
        // this.playNotificationSound();
        if ("Notification" in window) {
          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
              this.mostrarNotificacion("XTEIN", prm.DESCRIPCION);
            } else {
              console.warn("Permiso denegado.");
            }
          });
        } else {
          console.warn("Tu navegador no soporta notificaciones.");
        }
        this.configNtf(prm, 'agregar');
      }
    });

    this.subscriptionHNotifications = this.wsocket
    .emitHistorialNotificaciones()
    .subscribe((prm) => {
      this.getHistorialNotificaciones(prm)
    });

    this.subscriptionHchat = this.wsocket
    .emitHistorialChat()
    .subscribe((prm) => {
      const res = validatorRes(prm);
      var contMsj:number = 0;
      res.forEach((chat: any) => {
        if (chat.CONT_MENSAJES > 0)
          contMsj = contMsj + 1;
      });
      this.matBadgeMensajes = contMsj;
    });

    this.subscriptionUserOnline = this.wsocket
    .getUserOnline()
    .subscribe((prm) => {
      this.DUserOnline = prm;
      this.configureUserOnline();
    });

    // Recibe de productos
    this.subscriptionAplicaciones = this._sgenerales
    .getAplicaciones()
    .subscribe((apli: any) => {
      this.Aplicaciones = apli;
      const newArray: any = apli.filter((d: any) => d.TIPO === 'aplicacion');
      this.DAplicaciones = newArray;
    });

    // Recibe de cambios en el Badge de notificaciones
    this.subscriptionBadgeNtf = this.wsocket
    .getBadgeNotificaciones()
    .subscribe((prm: any) => {
      switch (prm.ACCION) {
        case 'sumar':
          this.matBadgeNotificaciones = this.matBadgeNotificaciones + prm.NUM;
          break;
        case 'restar':
          this.matBadgeNotificaciones = this.matBadgeNotificaciones - prm.NUM;
          break;
        case 'resetear':
          this.matBadgeNotificaciones = 0;
          break;

        default:
          break;
      }
    });

    // Recibe de cambios en el Badge de mensajes
    this.subscriptionBadgeMjs = this.wsocket
    .getBadgeMensajes()
    .subscribe((prm: any) => {
      switch (prm.ACCION) {
        case 'sumar':
          this.matBadgeMensajes = this.matBadgeMensajes + prm.NUM;
          break;
        case 'restar':
          this.matBadgeMensajes = this.matBadgeMensajes - prm.NUM;
          break;
        case 'resetear':
          this.matBadgeMensajes = prm.NUM;
          break;

        default:
          break;
      }
    });

    this.ltool = new libtools(this._sbarreg, this.tabService);

    this.onSelectBusqueda = this.onSelectBusqueda.bind(this);
  }

  ngOnInit(): void {
    this.popupVisibleChat = false;
    this.displayUsuario();
    this.displayEmpresa();
    this.displayFotoUsuario();
    let datos = {
      USUARIO: this.USUARIO_LOCAL
    }
    let endPoint = environment.apiWebSocket;
    let deviceID = this.getOrCreateDeviceId();
    let url = `${endPoint}userId=${datos.USUARIO}&deviceId=${deviceID}`;
    this.wsocket.connect(url, datos);

    var recor: any = localStorage.getItem('RECORDATORIOS');
    if (recor) {
      recor = JSON.parse(recor);
      recor.forEach((ele: any) => {
        this.configNtf(ele, 'consulta');
      });
    }
  }

  getOrCreateDeviceId(): string {
    const key = 'device_id';
    this.deviceId = localStorage.getItem(key)!;

    if (!this.deviceId) {
      this.deviceId = uuidv4();
      localStorage.setItem(key, this.deviceId);
    }

    return this.deviceId!;
  }

  ngAfterViewInit(): void {
    this.initializeResizeObservers();
    setTimeout(() => {
      this.valoresObjetos('todos', '');
      // this.getDataGoogle();
    }, 1000);
  }

  private initializeResizeObservers(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    if (this.containerHeaderUno?.nativeElement) {
      this.observeElementResize(
        this.containerHeaderUno.nativeElement,
        'barra'
      );
    }

    if (this.containerHeaderDos?.nativeElement) {
      this.observeElementResize(
        this.containerHeaderDos.nativeElement,
        'header'
      );
    }
  }

  private observeElementResize(
    element: HTMLElement,
    obj: 'barra' | 'header'
  ): void {

    const observer = new ResizeObserver((entries) => {

      const entry = entries[0];

      if (!entry) {
        return;
      }

      const width = entry.contentRect.width;
      const height = entry.contentRect.height;

      this.ngZone.run(() => {
        this.onResized(width, height, obj);
      });
    });

    observer.observe(element);

    this.resizeObservers.push(observer);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subscriptionAplicaciones.unsubscribe();
    this.subscriptionNotifications.unsubscribe();
    this.subscriptionBadgeNtf.unsubscribe();
    this.subscriptionBadgeMjs.unsubscribe();
    this.resizeObservers.forEach(
      observer => observer.disconnect()
    );
    this.resizeObservers = [];
  }

  displayUsuario() {
    this.userName = localStorage.getItem('user_name');
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.EMPRESA = localStorage.getItem("empresa")?.toUpperCase();
    this.EMAIL_USUARIO_LOCAL = localStorage.getItem('email');
    return this.userName;
  }

  displayEmpresa() {
    this.EMPRESA = localStorage.getItem('empresa');
    let empresa = localStorage.getItem('nombre empresa');
    return empresa
  }

  displayFotoUsuario() {
    let foto: any = localStorage.getItem('foto_perfil_user');
    if (foto === 'null' || foto === '') {
      foto = '';
      this.activeIconPerfil = true;
      this.createIconName();
    }
    return foto;
  }

  configureUserOnline() {
    this.DUserOnline.forEach((user: any) => {
      if (this.DUsuarios.length > 0) {
        const npos: any = this.DUsuarios.findIndex(
          (d: any) => d.USUARIO === user.usuario
        );
        if (npos !== -1) this.DUsuarios[npos].ESTADO = 'ONLINE';
      }
    });
  }

  configNtf(prm: any, modo: string) {
    var notificacion: any = prm;
    if (notificacion.ESPEC === 'NOTIFICACION') {
      if (notificacion.ACTIVIDAD !== null || notificacion.ACTIVIDAD !== undefined) {
        notificacion.ACTIVIDAD = JSON.parse(notificacion.ACTIVIDAD);
      }
      const res: any = this.DResponsables.findIndex(
        (d: any) => d.ID_RESPONSABLE === notificacion.USUARIO_ENV.ID_RESPONSABLE
      );
      notificacion.USUARIO_ENV = this.DResponsables[res];
      if (
        notificacion.NOMBRE_APLICACION === undefined ||
        notificacion.NOMBRE_APLICACION === null
      ) {
        const apl: any = this._sgenerales.APLICACIONES.findIndex(
          (d: any) => d.ID_APLICACION === notificacion.APLICACION
        );
        notificacion.NOMBRE_APLICACION =
          this._sgenerales.APLICACIONES[apl].NOMBRE;
      }

      //Agrupa por fecha
      let hoy = new Date();
      let ayer = new Date();
      ayer.setDate(hoy.getDate() - 1);
      // Normalizar las fechas a la medianoche para comparaciones
      let inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      let inicioAyer = new Date(
        ayer.getFullYear(),
        ayer.getMonth(),
        ayer.getDate()
      );
      // Clasificar las fechas en los grupos correspondientes
      let fechaItem = new Date(notificacion.FECHA_UPDATE);
      if (fechaItem >= inicioHoy) {
        if (this.notifications[0].DATA.length > 0) {
          const item = this.notifications[0].DATA.reduce((ant: any, act: any) => {
            return ant.ITEM > act.ITEM ? ant : act;
          });
          notificacion.ITEM = item.ITEM === "NaN" ? 0 + 1 : item.ITEM + 1;
        } else {
          notificacion.ITEM = 1;
        }
        this.notifications[0].DATA.push(notificacion);
        this.notifications[0].DATA.sort(this.compararFechasDesc);
      }

      this.alertNtf(notificacion);
      // if (this.popupVisible)
      //   this.listNotification.instance._refresh();

    } else if (notificacion.TIPO === 'RECORDATORIO') {
      // const npos:any =  this.notifications[0].DATA
      if (this.notifications[0].DATA.length > 0) {
        notificacion.ITEM = this.notifications[0].DATA.reduce((ant: any, act: any) => {
          return ant.ITEM > act.ITEM ? ant.ITEM : act.ITEM;
        });
        notificacion.ITEM++;
        if (modo !== 'consulta')
          notificacion.DESCRIPCION_REC = JSON.parse(notificacion.DESCRIPCION_REC);
      } else {
        notificacion.ITEM = 1;
      }
      this.notifications[0].DATA.push(notificacion);
      this.notifications[0].DATA.sort(this.compararFechasDesc);
    }

    this.matBadgeNotificaciones++;
  }

  alertNtf(message: any, offset?: any) {
    const container: any = document.getElementById('router-container');

    notify(
      {
        // title: ,
        message: message.DESCRIPCION,
        width: 300,
        height: 70,
        position: {
          at: 'bottom right',
          my: 'bottom right',
          of: container,
        },
        animation: {
          show: { type: 'fade', duration: 400, from: 0, to: 1 },
          hide: { type: 'fade', duration: 400, to: 0 },
        },
      },
      'info',
      5000
    );
  }

  onResized(
    width: number,
    height: number,
    obj: 'barra' | 'header'
  ): void {

    if (obj === 'barra') {

      this._sbarreg.setOnResized(0);

      // Conservamos la lógica anterior comentada
      // para una futura revisión responsive.
    }

    if (obj === 'header') {

      const icon_campana: any =
        document.getElementById('icon-bell-ol-header');

      const icon_inbox: any =
        document.getElementById('icon-inbox-ol-header');

      const icon_buscar: any =
        document.getElementById('icon-buscar-ol-header');

      const nombres_header: any =
        document.getElementById('nombres-header');

      if (!icon_inbox || !icon_campana || !icon_buscar) {
        return;
      }

      if (width <= 89) {
        icon_inbox.style.display = 'none';
        icon_campana.style.display = 'none';
        icon_buscar.style.display = 'none';
      }

      if (width >= 90 && width <= 119) {
        icon_inbox.style.display = 'none';
        icon_campana.style.display = 'none';
        icon_buscar.style.display = 'none';
      }

      if (width >= 120 && width <= 159) {
        icon_inbox.style.display = 'none';
        icon_campana.style.display = 'none';
        icon_buscar.style.display = '';
      }

      if (width >= 160 && width <= 199) {
        icon_inbox.style.display = 'none';
        icon_campana.style.display = '';
        icon_buscar.style.display = '';
      }

      if (width >= 200) {
        icon_inbox.style.display = '';
        icon_campana.style.display = '';
        icon_buscar.style.display = '';
      }
    }
  }

  openBuscar(e: any) {
    this.visibleBuscar = !this.visibleBuscar;
  }

  createIconName() {
    const npos: any = this.userName.indexOf(' ');
    const name = this.userName.charAt(0).toUpperCase();
    const lastName = this.userName.substring(
      npos + 1,
      this.userName.length + 1
    );
    const Lape = lastName.charAt(0).toUpperCase();
    const newName: string =
      name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
    this.iconNameUser = newName;
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
    this.activeIconPerfil = false;

    // Luego, desconectar el socket
    localStorage.clear();
  }

  changePassword() {
    const usuario: any = localStorage.getItem('usuario');
    const data: any = { CAMBIO_PASSWORD: true, USUARIO: usuario };
    this._sdatosPaswword.setPassword(data);
  }

  userProfile() {
    const usuario: any = localStorage.getItem('usuario');
    const data: any = { VISIBLE: true };
    this._sdatosUser.setUserProfile(data);
  }

  abrirNotificaciones(e: any) {
    this.titlePopup = 'Hoy';
    this.showTitlePopup = true;
    this.visible_toolbar_item = true;
    this.ofDropdownNTF = '#DropdownNTF';
    this.optionsPopup = {
      width: 160,
      text: 'Marcar todas leidas',
      type: 'default',
      stylingMode: 'contained',
      onClick: () => { this.changeStatus('todos', 'Visto') }
    };
    if (this.estadoPopup === 'cerrardo') {
      this.popupVisible = true;
      this.estadoPopup = 'abierto';
    } else if (this.estadoPopup === 'abierto') {
      this.popupVisible = false;
      this.estadoPopup = 'cerrardo';
    } else {
      this.popupVisible = false;
      this.estadoPopup = 'cerrardo';
    }
    // for (let i = 0; i < this.notifications.length; i++) {
    //   const element = this.notifications[i];
    //   if (element.ESTADO === 'Enviado') {
    //     this.matBadgeNotificaciones = this.matBadgeNotificaciones++;
    //   }

    // }
  }
  onContentReadyList(e: any) {
    if (this.popupVisible) {
      const ntfRecor: any[] = this.notifications.filter((d: any) => d.TIPO === "RECORDATORIO");
      if (ntfRecor.length > 0) {
        const ntfSinLeer: any = this.notifications.filter((d: any) => d.ESTADO === "Enviado");
        this.matBadgeNotificaciones = ntfSinLeer.length;
      }
    }
  }
  onHidingPopup(e: any) {
    setTimeout(() => {
      this.popupVisible = false;
      this.estadoPopup = 'cerrardo';
    }, 300);
  }

  abrirBuzon(e: any) {
    if (this.estadoPopupChat === 'cerrardo') {
      this.popupVisibleChat = true;
      this.estadoPopupChat = 'abierto';
    } else if (this.estadoPopupChat === 'abierto') {
      this.popupVisibleChat = false;
      this.estadoPopupChat = 'cerrardo';
    } else {
      this.popupVisibleChat = false;
      this.estadoPopupChat = 'cerrardo';
    }
  }
  onHidingPopupChat(e: any) {
    setTimeout(() => {
      this.popupVisibleChat = false;
      this.estadoPopupChat = 'cerrardo';
    }, 300);
  }

  private getEstadoLocalStorageKey(): string {
    const empresa = this.EMPRESA || localStorage.getItem('empresa') || '';
    const usuario = this.USUARIO_LOCAL || localStorage.getItem('usuario') || '';
    return `ntf_estado_${String(empresa).toUpperCase()}_${String(usuario).toUpperCase()}`;
  }

  private getNotificacionId(notificacion: any): string {
    // Genera un identificador único e inmutable basado en propiedades del backend
    // que no cambian entre recargas
    const idResponsable = notificacion?.USUARIO_ENV?.ID_RESPONSABLE || notificacion?.USUARIO_ENV?.USUARIO || '';
    const aplicacion = notificacion?.ID_APLICACION || notificacion?.APLICACION || '';
    const tipo = notificacion?.TIPO || '';
    const fechaUpdate = notificacion?.FECHA_UPDATE || '';

    // Crear un hash simple concatenando estos campos
    return `${idResponsable}|${aplicacion}|${tipo}|${fechaUpdate}`;
  }

  private getEstadoLocalMap(): Record<string, string> {
    try {
      const raw = localStorage.getItem(this.getEstadoLocalStorageKey());
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
      return {};
    } catch {
      return {};
    }
  }

  private setEstadoLocal(item: any, estado: string): void {
    const itemId = this.getNotificacionId(item);
    if (!itemId || itemId === '||') {
      return;
    }

    const mapEstado = this.getEstadoLocalMap();
    mapEstado[itemId] = estado;
    localStorage.setItem(this.getEstadoLocalStorageKey(), JSON.stringify(mapEstado));
  }

  private aplicarEstadoLocal(notificacion: any): any {
    const itemId = this.getNotificacionId(notificacion);
    if (!itemId || itemId === '||') {
      return notificacion;
    }

    const mapEstado = this.getEstadoLocalMap();
    const estadoLocal = mapEstado[itemId];
    if (estadoLocal) {
      notificacion.ESTADO = estadoLocal;
    }
    return notificacion;
  }

  private marcarLeidaSiAplica(item: any): void {
    if (item && item.TIPO !== 'RECORDATORIO' && item.ESTADO === 'Enviado') {
      // Marca como Visto en UI
      item.ESTADO = 'Visto';
      // Persiste en localStorage usando identificador único
      this.setEstadoLocal(item, 'Visto');
      // Decrementa el badge
      this.badgeNotificaciones('restar');
      // Envía cambio al socket para broadcast
      const response = {
        data: {
          TIPO: 'NOTIFICACION',
          DATOS: item,
        },
        USUARIO: this.USUARIO_LOCAL,
        EMPRESA: this.EMPRESA,
        ACCION: 'CAMBIO ESTADO'
      };
      this.wsocket.sendSocket('change_state', 'get_data_change_state', response);
    }
  }

  changeStatus(item: any, estado: string) {
    let response: any = { USUARIO: this.USUARIO_LOCAL, EMPRESA: this.EMPRESA, ACCION: 'CAMBIO ESTADO' };

    if (item === 'todos') {
      this.badgeNotificaciones('resetear');
      let notificaciones = this.notifications[0].DATA;
      for (let i = 0; i < notificaciones.length; i++) {
        let element = notificaciones[i];
        if (element.TIPO !== 'RECORDATORIO') {
          if (element.ESTADO === 'Enviado') {
            element.ESTADO = estado;
            this.setEstadoLocal(element, estado);
            response = {
              data: {
                TIPO: 'NOTIFICACION',
                DATOS: element,
              },
              ...response
            }
            this.wsocket.sendSocket('change_state', 'get_data_change_state', response);
            response = {
              USUARIO: this.USUARIO_LOCAL,
              EMPRESA: this.EMPRESA,
              ACCION: 'CAMBIO ESTADO'
            };
          }
        }
      }
    } else {
      if (estado === 'Enviado') {
        this.badgeNotificaciones('sumar');
      } else {
        this.badgeNotificaciones('restar');
      }
      item.ESTADO = estado;
      this.setEstadoLocal(item, estado);
      item.FECHA_UPDATE = new Date();
      response = {
        data: {
          TIPO: 'NOTIFICACION',
          DATOS: item,
        },
        ...response
      }
      this.wsocket.sendSocket('change_state', 'get_data_change_state', response);
    }
  }
  abrirApl(item: any) {
    this.popupVisible = false;
    const idAplicacion = (item?.ID_APLICACION || item?.APLICACION || '').toUpperCase();
    item.ID_APLICACION = idAplicacion;
    switch (idAplicacion) {
      case 'GES-001':
        // if (item.ACTIVIDAD.ACCION === 'nueva_actividad') {
        //   item.ID_APLICACION = 'GES-001';
        //   item.title = item.NOMBRE_APLICACION;
        //   item.icon = item.icon;
        //   item.TABLA = item.TABLA;
        //   this.ltool.abrirApl(item, 'abrir aplicacion');
        //   localStorage.setItem('nueva_actividad', JSON.stringify(item))
        // } else if (item.ACTIVIDAD.ACCION === 'modifico_actividad') {
        item.ID_APLICACION = 'GES-001';
        this.eventsGesInfo.next({
          accion: 'cargar datos',
          config: { accion: 'cargar datos notificacion', dataSource: item.ACTIVIDAD.ACTIVIDAD_DATA, readOnly: true, VISIBLE: true },
        });
        // }
        this.popupVisible = false;
        this.estadoPopup = 'cerrardo';
        this.marcarLeidaSiAplica(item);

        break;

      case 'ADM-1000':
        item.ID_APLICACION = 'ADM-1000';
        item.title = 'Notificaciones';
        item.icon = 'icon-bell-ol';
        item.TABLA = 'MENSAJERIA';
        this.ltool.abrirApl(item, 'abrir aplicacion');
        this.popupVisible = false;
        this.estadoPopup = 'cerrardo';
        break;
      case 'GES-007':
        item.ID_APLICACION = item.ID_APLICACION;
        item.title = item.NOMBRE_APLICACION;
        item.icon = item.icon;
        item.TABLA = 'PROYECTOS';
        this.ltool.abrirApl(item, 'abrir aplicacion');
        this.popupVisible = false;
        this.estadoPopup = 'cerrardo';
        this.marcarLeidaSiAplica(item);

        break;

      case 'COM-203': {
        let actividad: any = item?.ACTIVIDAD ?? {};
        if (typeof actividad === 'string') {
          try {
            actividad = JSON.parse(actividad);
          } catch {
            actividad = {};
          }
        }
        if (actividad === null || typeof actividad !== 'object') {
          actividad = {};
        }
        const actividadData: any = actividad?.ACTIVIDAD_DATA ?? {};

        let datos: any = item?.DATOS ?? {};
        if (typeof datos === 'string') {
          try {
            datos = JSON.parse(datos);
          } catch {
            datos = {};
          }
        }
        if (datos === null || typeof datos !== 'object') {
          datos = {};
        }

        let idDocumento = actividadData.ID_DOCUMENTO
          ? String(actividadData.ID_DOCUMENTO).trim()
          : datos.ID_DOCUMENTO
          ? String(datos.ID_DOCUMENTO).trim()
          : (item?.ID_DOCUMENTO ? String(item.ID_DOCUMENTO).trim() : '');
        let consecutivo =
          actividadData.CONSECUTIVO !== undefined && actividadData.CONSECUTIVO !== null
            ? String(actividadData.CONSECUTIVO).trim()
            : datos.CONSECUTIVO !== undefined && datos.CONSECUTIVO !== null
            ? String(datos.CONSECUTIVO).trim()
            : (item?.CONSECUTIVO !== undefined && item?.CONSECUTIVO !== null
              ? String(item.CONSECUTIVO).trim()
              : '');

        const documentoTexto = actividadData.DOCUMENTO || datos.DOCUMENTO || item?.DOCUMENTO || '';

        if ((!idDocumento || !consecutivo) && documentoTexto) {
          const partesDocumento = String(documentoTexto).trim().split(/\s+/);
          if (partesDocumento.length >= 2) {
            if (!idDocumento) {
              idDocumento = partesDocumento[0];
            }
            if (!consecutivo) {
              consecutivo = partesDocumento[1];
            }
          }
        }

        if (!idDocumento || !consecutivo) {
          console.warn('Notificacion COM-203 sin datos para redireccion', {
            ID_APLICACION: item?.ID_APLICACION,
            APLICACION: item?.APLICACION,
            ACTIVIDAD: item?.ACTIVIDAD,
            DATOS: item?.DATOS,
            ID_DOCUMENTO: item?.ID_DOCUMENTO,
            CONSECUTIVO: item?.CONSECUTIVO,
            DOCUMENTO: item?.DOCUMENTO
          });
          showToast('No fue posible abrir el movimiento: faltan ID_DOCUMENTO o CONSECUTIVO.', 'warning');
          return;
        }

        const compoApl = {
          ID_APLICACION: 'COM-203',
          title: 'Movimientos inventario',
          TABLA: 'MOVIMIENTOS',
          user: this.USUARIO_LOCAL,
          FILTRO: '{ "ESTRUCTURA": ' +
            '[{"CAMPO": "ID_DOCUMENTO", "EXPRESION": "' + idDocumento + '"},' +
            ' {"CAMPO": "CONSECUTIVO", "EXPRESION": "' + consecutivo + '"}] }'
        };

        this.ltool.abrirApl(compoApl, 'consulta');
        this.popupVisible = false;
        this.estadoPopup = 'cerrardo';
        this.marcarLeidaSiAplica(item);
        break;
      }

      default:
        break;
    }
  }

  onSelectOptionPopup(e: any) {
    showToast('Marcar todas leidas', 'info');
  }

  onSelectionChangedUsuario(e: any) {
    if (e.addedItems.length > 0) {
      this.wsocket.setAciveChat(e.addedItems[0]);
      // this.selectUsuario = [];
      this.infoChatActivo = { ...e.addedItems[0], MENSAJES: [] };
      const npos: any = this.chatsForUser.findIndex(
        (d: any) => d.USUARIO === this.infoChatActivo.USUARIO
      );
      if (npos === -1) {
        this.chatsForUser.push({ ...this.infoChatActivo });
      }
      this.wsocket.chats = this.chatsForUser;

      var nameRoom: string = '';
      if (
        this.infoChatActivo.ROOM === '' ||
        this.infoChatActivo.ROOM === undefined ||
        this.infoChatActivo.ROOM === null
      ) {
        nameRoom = this.USUARIO_LOCAL + '_to_' + this.infoChatActivo.USUARIO;
        this.infoChatActivo.ROOM = nameRoom;
      }

      // this.wsocket.setJoinRoom({ ...this.infoChatActivo, TYPE: 'crear' });
      this.valoresObjetos('historial', '');
    }
  }

  onSelectBusqueda(e: any) {
    const data: any = e.itemData;
    // Verifica si es una aplicacion multiple con uso de aplicacion padre
    var subm: any = this.Aplicaciones.filter(
      (d: any) => d.ID_APLICACION === data.ID_APLICACION
    );
    let aplicacion = data.ID_APLICACION;
    let nom_aplicacion = data.NOMBRE;
    if (subm.length !== 0) {
      if (subm[0].PARAMETROS !== '') {
        aplicacion = subm[0].PARAMETROS;
        nom_aplicacion = subm[0].NOMBRE;
      }
    }

    const apli: any = {
      component: '',
      title: nom_aplicacion,
      tabData: '',
      ID_APLICACION: aplicacion,
      icon: data.icon,
      TABLA: data.TABLA_APLICACION,
      active: false,
    };
    this.ltool.abrirApl(apli, 'abrir aplicacion');
    this.selectAplicacion = [];
  }

  // Respuesta accion del correo
  onRespuestaEnvioCorreo(datos: any) {
    // showToast('Enviando correo. Espere un momento...');

    let template =
      this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'TEMPLATE')
        ?.VALOR_DEFECTO ?? '';
    let filtroRep: any = '';
    const prmRpt = {
      usuario: localStorage.getItem('usuario'),
      filtro: JSON.stringify(filtroRep),
      prm_email: datos,
      template,
      replacements: datos.REMPLAZAR,
    };

    let data = {
      data: {
        datos:
          prmRpt
      },
      USUARIO: this.prmUsrAplBarReg.usuario
    }


    this.wsocket.sendSocket('email', 'get_data_email', data);
  }

  orderGroupFechas(datos: any) {
    // Grupos de fechas
    let grupoHoy: any = [];
    let grupoAyer: any = [];
    let grupoAnteriores: any = [];
    // Agrupa por fecha.
    let hoy = new Date();
    let ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    // Normalizar las fechas a la medianoche para comparaciones
    let inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    let inicioAyer = new Date(
      ayer.getFullYear(),
      ayer.getMonth(),
      ayer.getDate()
    );

    // Clasificar las fechas en los grupos correspondientes
    datos.forEach((item: any) => {
      let fechaItem = new Date(item.FECHA_UPDATE);
      if (fechaItem >= inicioHoy) {
        // item.ACTIVIDAD = item.ACTIVIDAD !== undefined ? JSON.parse(item.ACTIVIDAD) : ''
        grupoHoy.push(item);
        if (item.ESTADO === 'Enviado') {
          this.matBadgeNotificaciones++;
        }
      }
      // else if (fechaItem >= inicioAyer && fechaItem < inicioHoy) {
      //   grupoAyer.push(item);
      // } else {
      //   grupoAnteriores.push(item);
      // }
    });

    // Ordenar cada grupo por fecha de más reciente a más antigua
    grupoHoy.sort(this.compararFechasDesc);
    // grupoAyer.sort(this.compararFechasDesc);
    // grupoAnteriores.sort(this.compararFechasDesc);
    // Combinar los grupos en el orden deseado
    if (grupoHoy.length === 0) {
      this.textNotification = "No hay notificaciones"
      return;
    } else {
      this.notifications = [{ GRUPO: 'Hoy', DATA: [...this.notifications[0].DATA, ...grupoHoy] }];
    }
  }

  // Función para comparar fechas y ordenar de más reciente a más antigua
  compararFechasDesc(a: any, b: any) {
    return new Date(b.FECHA ? b.FECHA : b.FECHA_ENVIO).getTime() - new Date(a.FECHA ? a.FECHA : a.FECHA_ENVIO).getTime();
  }
  // compararFechasDesc(a: any, b: any) {
  //   return new Date(b.ITEM).getTime() - new Date(a.ITEM).getTime();
  // }

  valoresObjetos(obj: string, accion: string) {
    if (obj === 'usuarios' || obj === 'todos') {
      const prm: any = {};
      if (this._sgenerales.D_USUARIOS.length > 0) {
        this.DUsuarios = JSON.parse(
          JSON.stringify(this._sgenerales.D_USUARIOS)
        );
        this.configureUserOnline();
      } else {
        this.sData.getUsuarios('USUARIOS', prm).subscribe((data: any) => {
          const res = validatorRes(data);
          if (data.token !== undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          const newArray = res;
          const mensaje = newArray[0].ErrMensaje;
          if (mensaje != '') {
            this.showModal(mensaje);
          } else {
            // Baja las imagenes
            this._sgenerales
              .bajar_imagen(
                'bajar imagenes',
                {
                  RESPONSABLES: [{}],
                  params: { comprimir: true, tamX: 300, tamY: 400 },
                },
                'spActividades'
              )
              .subscribe({
                next: (varch: any) => {
                  // Adiciona el path en el vector de la galería
                  if (varch[0].ErrMensaje === '') {
                    newArray.forEach((eleres: any) => {
                      const ix = varch.findIndex(
                        (r: any) => r.etiqueta === eleres.USUARIO
                      );
                      if (ix !== -1) {
                        eleres.FOTO = varch[ix].path;
                        newArray.forEach((usuario: any) => {
                          if (usuario.USUARIO === eleres.USUARIO) {
                            usuario.FOTO = varch[ix].path;
                          }
                        });
                        eleres.ESTADO = 'OFFLINE';
                      } else {
                        const npos: any = eleres.NOMBRE.indexOf(' ');
                        const name = eleres.NOMBRE.charAt(0).toUpperCase();
                        const lastName = eleres.NOMBRE.substring(
                          npos + 1,
                          eleres.NOMBRE.length + 1
                        );
                        const Lape = lastName.charAt(0).toUpperCase();
                        const newName: string =
                          name.charAt(0).toUpperCase() +
                          Lape.charAt(0).toUpperCase();
                        eleres.iconNameUser = newName;
                        eleres.ESTADO = 'OFFLINE';
                        eleres.FOTO = '';
                      }
                    });
                  } else {
                    newArray.forEach((eleres: any) => {
                      const npos: any = eleres.NOMBRE.indexOf(' ');
                      const name = eleres.NOMBRE.charAt(0).toUpperCase();
                      const lastName = eleres.NOMBRE.substring(
                        npos + 1,
                        eleres.NOMBRE.length + 1
                      );
                      const Lape = lastName.charAt(0).toUpperCase();
                      const newName: string =
                        name.charAt(0).toUpperCase() +
                        Lape.charAt(0).toUpperCase();
                      eleres.FOTO = '';
                      eleres.iconNameUser = newName;
                      eleres.ESTADO = 'OFFLINE';
                    });
                  }
                  this.DUsuarios = newArray;
                  this._sgenerales.D_USUARIOS = JSON.parse(
                    JSON.stringify(this.DUsuarios)
                  );
                  this.configureUserOnline();
                },
                error: (err) => {
                  this.showModal('Error procesando imagenes: ' + err.message);
                },
              });
          }
        });
      }
    }
    if (obj === 'responsables' || obj === 'todos') {
      const prm: any = {};
      if (this._sgenerales.D_USUARIOS.length > 0) {
        this.DResponsables = this._sgenerales.D_USUARIOS;
        // this.valoresObjetos('notificaciones', '');
      } else {
        this.sData
          .getResponsables('RESPONSABLES', prm)
          .subscribe((data: any) => {
            const res = validatorRes(data);
            if (data.token !== undefined) {
              const refreshToken = data.token;
              localStorage.setItem('token', refreshToken);
            }
            for (let i = 0; i < res.length; i++) {
              const element = res[i];
              element.ITEM = i;
              if (
                element.FOTO === '' ||
                element.FOTO === undefined ||
                element.FOTO === null
              ) {
                const npos: any = element.NOMBRE.indexOf(' ');
                const name = element.NOMBRE.charAt(0).toUpperCase();
                const lastName = element.NOMBRE.substring(
                  npos + 1,
                  element.NOMBRE.length + 1
                );
                const Lape = lastName.charAt(0).toUpperCase();
                const newName: string =
                  name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
                element.iconNameUser = newName;
              }
            }

            this.DResponsables = res;
            // Baja las imagenes
            this._sgenerales
              .bajar_imagen(
                'bajar imagenes',
                {
                  RESPONSABLES: [{}],
                  params: { comprimir: true, tamX: 300, tamY: 400 },
                },
                'spActividades'
              )
              .subscribe({
                next: (varch: any) => {
                  // Adiciona el path en el vector de la galería
                  if (varch[0].ErrMensaje === '') {
                    res.forEach((eleres: any) => {
                      const ix = varch.findIndex(
                        (r: any) => r.etiqueta === eleres.ID_RESPONSABLE
                      );
                      if (ix !== -1) {
                        eleres.FOTO = varch[ix].path;
                        this.DResponsables.forEach((responsable: any) => {
                          if (
                            responsable.ID_RESPONSABLE === eleres.ID_RESPONSABLE
                          ) {
                            responsable.FOTO = varch[ix].path;
                          }
                        });
                      }
                    });
                    // this.valoresObjetos('notificaciones', '');
                  }
                },
                error: (err) => {
                  this.showModal('Error procesando imagenes: ' + err.message);
                },
              });

            this._sgenerales.D_USUARIOS = JSON.parse(
              JSON.stringify(this.DResponsables)
            );
          });
      }
    }
    if (obj === 'notificaciones' || obj === 'todos') {
      const prm: any = { USUARIO: this.USUARIO_LOCAL };
      var response = {
        USUARIO: this.USUARIO_LOCAL,
        EMPRESA: this.EMPRESA,
        ACCION: 'HISTORICO NOTIFICACION',
        data: {
          DATOS: prm
        }
      }
      this.wsocket.sendSocket('historial_notificaciones', 'get_data_historial_notificaciones', response);
    }
    // if (obj === 'historial') {
    //   const prm: any = {
    //     USUARIO_ENV: this.USUARIO_LOCAL,
    //     USUARIO_REC: this.infoChatActivo.USUARIO,
    //   };
    //   response = {
    //     data: {
    //       DATOS: prm
    //     },
    //     ACCION: 'HISTORICO CHAT',
    //     ...response
    //   }
    //   this.wsocket.sendSocket('historial_chat', 'get_data_historial_chat', response);
    // };
    if (obj === 'listar_chats' || obj === 'todos') {
      setTimeout(() => {
        const prm: any = { USUARIO: this.USUARIO_LOCAL };
        var response = {
          USUARIO: this.USUARIO_LOCAL,
          EMPRESA: this.EMPRESA,
          ACCION: 'LISTAR CHATS',
          data: {
            DATOS: prm
          }
        }
        this.wsocket.sendSocket('listar_chats', 'get_lista_chats', response);
      }, 2000);
    };
    if (obj == 'especificaciones' || obj == 'todos') {
      this._sgenerales
        .consulta(
          'ESPECIFICACIONES HOME',
          { ID_APLICACION: 'HOME', USUARIO: this.USUARIO_LOCAL },
          'ADM-011'
        )
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          this.especAplicacion = res;
        });
    };
  }
  getHistorialNotificaciones(data: any) {
    this.textNotification = "Cargando..."
    const res = validatorRes(data);
    if (data.token !== undefined) {
      const refreshToken = data.token;
      localStorage.setItem('token', refreshToken);
    }

    const newArray = res;
    const mensaje = newArray[0].ErrMensaje;
    if (mensaje !== '') {
      this.notifications = [];
    } else {
      if (newArray.length === 0) {
        this.textNotification = "No hay notificaciones"
        return;
      }
      var notf: any = [];
      newArray.forEach((notificacion: any) => {
        notificacion.USUARIO_ENV = JSON.parse(notificacion.USUARIO_ENV);
        // notificacion.USUARIO_REC = JSON.parse(notificacion.USUARIO_REC);
        if (notificacion.ACTIVIDAD !== "") {
          notificacion.ACTIVIDAD = JSON.parse(notificacion.ACTIVIDAD);
        }
        this.aplicarEstadoLocal(notificacion);
        var npos: any = notificacion.USUARIO_ENV.NOMBRE.indexOf(' ');
        var name =
          notificacion.USUARIO_ENV.NOMBRE.charAt(0).toUpperCase();
        var lastName = notificacion.USUARIO_ENV.NOMBRE.substring(
          npos + 1,
          notificacion.USUARIO_ENV.NOMBRE.length + 1
        );
        var Lape = lastName.charAt(0).toUpperCase();
        var newName: string =
          name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
        notificacion.USUARIO_ENV.iconNameUser = newName;

        // npos = notificacion.USUARIO_REC.NOMBRE.indexOf(' ');
        // name = notificacion.USUARIO_REC.NOMBRE.charAt(0).toUpperCase();
        // lastName = notificacion.USUARIO_REC.NOMBRE.substring(
        //   npos + 1,
        //   notificacion.USUARIO_REC.NOMBRE.length + 1
        // );
        // Lape = lastName.charAt(0).toUpperCase();
        // newName =
        //   name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
        // notificacion.USUARIO_REC.iconNameUser = newName;

        const pos: any = notf.findIndex(
          (d: any) => d.ITEM === notificacion.ITEM
        );
        if (pos !== -1) notf[pos] = notificacion;
        else notf.push(notificacion);
      });
      this.orderGroupFechas(newArray);
    }
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
  badgeNotificaciones(ACCION: string) {
    switch (ACCION) {
      case 'sumar':
        this.matBadgeNotificaciones++;
        break;
      case 'restar':
        this.matBadgeNotificaciones = this.matBadgeNotificaciones - 1;
        break;
      case 'resetear':
        this.matBadgeNotificaciones = 0;
        break;

      default:
        break;
    }
  }

  mostrarNotificacion(titulo, mensaje) {
    if (Notification.permission === "granted") {
      const notificacion = new Notification(titulo, {
        body: mensaje,
        icon: 'assets/img/logo/xtein.svg'
      });

      notificacion.onclick = () => {
        window.focus();
        // O abre un enlace
        // window.open(environment.URL_XTEIN, "_blank");
        window.open(environment.URL_XTEIN, window.name);
      };
    } else {
      console.warn("No se pueden mostrar notificaciones sin permiso.");
    }
  }

  playNotificationSound() {
    const audio = new Audio('assets/sounds/tono_notificacion.mp3'); // Ruta al archivo de sonido
    audio.play().catch(error => {
      console.warn('El sonido no pudo reproducirse automáticamente. El usuario debe interactuar primero con la página.', error);
    });
  }

  getDataGoogle() {
    const data = this.googleService.getDataProfileGoogle();
    localStorage.setItem('Profile Google', JSON.stringify(data))
  }

}

