import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  map,
  throwError,
} from 'rxjs';
import { Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
interface WebSocketMessage {
  topic: string;
  data: any;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {

  private endPoint = environment.apiUrl;

  private socket: Socket;
  private wsocket: WebSocket;

  public chats: any = [];
  public chatsForUser: any = [];
  public infoChatActivo: any = {};
  public active_users: any[] = [];
  public dataRecordatorios: any[] = [];
  private USUARIO_LOCAL: any = '';
  private socketId: string = '';

  private subjectEmitMessage = new Subject<any>();
  private subjectEmitSaveMessage = new Subject<any>();
  private subjectActiveChat = new Subject<any>();
  private subjectBadgeNotificaciones = new Subject<any>();
  private subjectBadgeMensjes = new Subject<any>();
  private subjectUserOnline = new Subject<any>();

  private subjectEmitMessageAct = new Subject<any>();
  private subjectEmitMessageForo = new Subject<any>();
  private subjectEmitNotifications = new Subject<any>();
  private subjectEmitNotificationsRec = new Subject<any>();
  private subscriptionNotifications = new Subject<any>();
  private subscriptionChats = new Subject<any>();
  private subscriptionMensajes = new Subject<any>();
  private subjectEmitApl = new Subject<any>();
  private subjectEmitStatusNotificacion = new Subject<any>();
  private reconnectingSubject = new BehaviorSubject<boolean>(false); // Para indicar cuando estamos reconectando

  reconnectInterval: number; // Tiempo inicial para reconectar (1 segundo)
  maxReconnectInterval: number;
  private hasAttemptedReconnect: boolean;
  private reconnectTimer: any = null;

  constructor(private http: HttpClient) {
    this.reconnectInterval = 1000; // Tiempo inicial para reconectar (1 segundo)
    this.maxReconnectInterval = 30000;
    this.hasAttemptedReconnect = true;

    this.validarRecordatorios();
  }

  validarRecordatorios() {
    const recor: any = localStorage.getItem('RECORDATORIOS');
    var newData: any[] = [];
    if (recor)
      newData = JSON.parse(recor);

    if (newData.length > 0) {
      this.dataRecordatorios = newData.filter((d: any) => d.FECHA_ENVIO === new Date());
      if (this.dataRecordatorios.length === 0)
        localStorage.removeItem('RECORDATORIOS');

    } else {
      this.dataRecordatorios = [];
      localStorage.removeItem('RECORDATORIOS');
    }
  }

  connect(url: string, datos: any): void {
    return;
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.wsocket = new WebSocket(url);
    this.wsocket.onopen = (event) => {
      console.log('WebSocket connection established:', event);
      setTimeout(() => {
        this.sendSocket('session_started', 'get_data_recodatorio', datos);
        this.sendSocket('pong', '', {});
        this.onSuccessfulConnection();
      }, 100);
    };
    this.wsocket.onmessage = (event) => {
      let response = JSON.parse(event.data)

      switch (response.topic) {
        case 'response_recodatorio':
          if (response.data.USUARIO_REC === this.USUARIO_LOCAL) {
            this.subjectEmitNotifications.next(response.data);
            this.subjectEmitApl.next(response.data);
            if (this.dataRecordatorios.length === 0)
              this.dataRecordatorios = [response.data];
            else if (this.dataRecordatorios.length > 0)
              this.dataRecordatorios.push(response.data);

            localStorage.setItem('RECORDATORIOS', JSON.stringify(this.dataRecordatorios));
          }
          break
        case 'notificaciones':
          let usuariosRec = (Array.isArray(response.data.data.USUARIO_REC) ? response.data.data.USUARIO_REC : [])
            .map((u: any) => {
              const userId = typeof u === 'string' ? u : u?.USUARIO || u?.ID_RESPONSABLE || '';
              return String(userId).trim().toUpperCase();
            })
            .filter((u: string) => u !== '');
          let usuarioEnv = String(response.data.data.USUARIO_ENV.ID_RESPONSABLE || '').trim().toUpperCase();
          let usuarioLogueado = String(this.USUARIO_LOCAL || '').trim().toUpperCase();

          let esParaTodos = usuariosRec.includes('TODOS');
          let esParausuarioLogueado = usuariosRec.includes(usuarioLogueado);
          let excluirEmisor = usuariosRec.includes(usuarioEnv);

          let esParaMi = (esParausuarioLogueado && !excluirEmisor) || esParaTodos;

          if (esParaMi) {
            this.subjectEmitNotifications.next(response.data.data);
            this.subjectEmitApl.next(response.data.data);
          }
          break;

        case 'change_of_status':
          this.subjectEmitStatusNotificacion.next(JSON.parse(response.data))
          break
        case 'mensajes_actividad':
          // this.subjectEmitMessageAct.next(JSON.parse(response.data.data.ACTIVIDAD));
          this.subjectEmitMessageForo.next(response.data.data);
          break
        case 'historial_notificaciones':
          this.subscriptionNotifications.next(response.data)
          break

        case 'historial_chat':
          this.subscriptionChats.next(response.data)
          break

        case 'listar_chats':
          this.subscriptionChats.next(response.data)
          break

        case 'listar_mensajes':
          this.subscriptionMensajes.next(response.data)
          break

        case 'privateReveiceMessage':
          this.subjectEmitMessage.next(response.data);
          this.subjectBadgeMensjes.next({ ...response.data, NUM: 1, ACCION: 'sumar' });
          break

        case 'change_state_mesaje':
          this.subjectEmitMessage.next(response.data);
          break

        case 'change_save_mesaje':
          this.subjectEmitSaveMessage.next(response.data);
          break

        case 'ping':
          let params: WebSocketMessage = {
            topic: 'pong',
            data: {}
          }
          this.wsocket.send(JSON.stringify(params));
          break
        case 'ERRROR':
          console.error(response.data)
          break
        case 'SUCCES_EMAIL':
          console.error(response.data)
          break

        default:
          break;
      }
    };

    this.wsocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);

      if (!this.hasAttemptedReconnect) {
        this.hasAttemptedReconnect = true;
        this.reconnect();            // Primer intento inmediato
        this.startReconnectLoop();  // Luego cada X minutos
      }
    };
    this.wsocket.onclose = (event) => {
      console.warn('🔌 WebSocket cerrado:', event);
      if (!this.hasAttemptedReconnect) {
        console.log('♻️ Reintentando conexión...');
        this.hasAttemptedReconnect = true;
        this.reconnect();
        this.startReconnectLoop();
      }
    };
  }

  reconnect(): void {
    const datos = {
      USUARIO: this.USUARIO_LOCAL
    };
    const endPoint = environment.apiWebSocket;
    const url = `${endPoint}?userId=${datos.USUARIO}`;
    this.connect(url, datos);
  }

  startReconnectLoop(): void {
    this.reconnectTimer = setInterval(() => {
      this.reconnect();
    }, 5 * 60 * 1000);
  }


  onSuccessfulConnection(): void {
    this.hasAttemptedReconnect = false;
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }


  disconnect(data: any): void {
    this.hasAttemptedReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      console.log('⏹️ Temporizador de reconexión cancelado.');
    }

    try {
      this.sendSocket('SESSION_CONTROL', 'force_disconnect', data);

      this.wsocket.close(); // Cierra la conexión WebSocket
      console.log('🔌 Conexión WebSocket cerrada por este dispositivo.');
    } catch (e) {
      console.warn('⚠️ Error al cerrar el WebSocket:', e);
    }
  }


  sendSocket(topic: string, action: string, datos: any) {
    let params: WebSocketMessage = {
      topic: topic,
      data: {
        action: action,
        payload: {
          data: datos,
          user: datos.USUARIO,
          idUSer: datos.USUARIO
        }
      }
    }
    console.log("Intentando enviar por socket...", params);
    if (this.wsocket && this.wsocket.readyState === WebSocket.OPEN) {
      console.log("Socket abierto, enviando...");
      this.wsocket.send(JSON.stringify(params));
    } else {
      console.warn("Socket cerrado o no inicializado. Reintentando conexión...");
      this.reconnect();
      // Esperar un momento a que conecte y reintentar el envío (opcional o informar error)
      setTimeout(() => {
        if (this.wsocket && this.wsocket.readyState === WebSocket.OPEN) {
          this.wsocket.send(JSON.stringify(params));
        } else {
          console.error("No se pudo restablecer la conexión del socket.");
        }
      }, 1000);
    }
  }

  sendSocketEmail(urlConnet: string, topic: string, action: string, datos: any) {
    this.wsocket = new WebSocket(urlConnet);
    this.wsocket.onopen = () => {
      console.log('Conexión WebSocket abierta');
      let params: WebSocketMessage = {
        topic: topic,
        data: {
          action: action,
          payload: {
            data: datos,
            user: datos.USUARIO,
            idUSer: datos.USUARIO
          }
        }
      }
      this.wsocket.send(JSON.stringify(params));
    };
  }

  setBadgeNotificaciones(data: any): void {
    this.subjectBadgeNotificaciones.next(data);
  }
  getBadgeNotificaciones(): Observable<any> {
    return this.subjectBadgeNotificaciones.asObservable();
  }
  setBadgeMensajes(data: any): void {
    this.subjectBadgeMensjes.next(data);
  }
  getBadgeMensajes(): Observable<any> {
    return this.subjectBadgeMensjes.asObservable();
  }

  setAciveChat(data: any): void {
    this.subjectActiveChat.next(data);
  }

  getAciveChat(): Observable<any> {
    return this.subjectActiveChat.asObservable();
  }
  //Unir a sala de chat
  setJoinRoom(data: any) {
    // this.socket.emit('joinRoom', data);
  }
  getJoinRoom() {
    this.socket.on('joinRoom', (data) => {
      if (data.USUARIO === this.USUARIO_LOCAL) {
        this.socket.emit('joinRoom', { ...data, TYPE: 'unirme' });
      }
    });
  }
  getUserOnline(): Observable<any> {
    return this.subjectUserOnline.asObservable();
  }
  onReceiveMessage(response: any) {
    // const npos: any = this.chats.findIndex((d: any) => d.USUARIO === response.USER_SENDS[0].USUARIO);
    // if (npos === -1) {
    //   this.chats.push({
    //     ...response.USER_SENDS[0],
    //     MENSAJES: response.USER_RECEIVES.MENSAJES,
    //     ROOM: response.USER_RECEIVES.ROOM,
    //   });
    // } else {
    //   this.chats[npos].MENSAJES = response.USER_RECEIVES.MENSAJES;
    // }
    // this.infoChatActivo = {
    //   ...response.USER_SENDS[0],
    //   MENSAJES: response.USER_RECEIVES.MENSAJES,
    //   ROOM: response.USER_RECEIVES.ROOM,
    // };
    // const newData: any = {
    //   CHATS: this.chats,
    //   INFOCHATACTIVO: this.infoChatActivo,
    // };
    this.subjectEmitMessage.next(response);
  }
  emitMessage(): Observable<any> {
    return this.subjectEmitMessage.asObservable();
  }
  emitSaveMessage(): Observable<any> {
    return this.subjectEmitSaveMessage.asObservable();
  }
  emitMessageACT(): Observable<any> {
    return this.subjectEmitMessageAct.asObservable();
  }
  emitMessageForo(): Observable<any> {
    return this.subjectEmitMessageForo.asObservable();
  }
  emitnotificactions(): Observable<any> {
    return this.subjectEmitNotifications.asObservable();
  }
  emitHistorialNotificaciones(): Observable<any> {
    return this.subscriptionNotifications.asObservable();
  }
  emitHistorialChat(): Observable<any> {
    return this.subscriptionChats.asObservable();
  }
  emitHistorialMensajes(): Observable<any> {
    return this.subscriptionMensajes.asObservable();
  }
  emitNtfApl(): Observable<any> {
    return this.subjectEmitApl.asObservable();
  }

  //comunicación DB
  saveInfo(accion: any, prmDatos: any): Observable<any> {
    const prmJ = {
      prmAccion: accion,
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: { EMPRESA: localStorage.getItem('empresa') },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token'),
      },
    };

    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/CHAT/save';
    return this.http
      .post<any>(url, body, {
        headers: {
          'Content-Type': 'application/json'
        },
      })
      .pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(() => new Error(err));
        })
      );
  }

  getHistorial(accion: any, prmDatos: any): Observable<any> {
    const prmJ = {
      prmAccion: accion,
      prmDatos: JSON.stringify(prmDatos),
      prmConexion: { EMPRESA: localStorage.getItem('empresa') },
      prmTokenDatos: {
        USUARIO: localStorage.getItem('usuario'),
        EMPRESA: localStorage.getItem('empresa'),
        TOKEN: localStorage.getItem('token'),
      },
    };

    const body = JSON.stringify(prmJ);
    let url = this.endPoint + '/CHAT/historial';
    return this.http
      .post<any>(url, body, {
        headers: {
          'Content-Type': 'application/json'
        },
      })
      .pipe(
        map((vec: any) => {
          return vec;
        }),
        catchError((err) => {
          return throwError(() => new Error(err));
        })
      );
  }
}
