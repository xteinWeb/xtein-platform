
import { Component, ViewChild } from '@angular/core';
import { DxButtonModule, DxDateBoxModule, DxListComponent, DxListModule, DxLoadPanelModule, DxToolbarModule } from 'devextreme-angular';
import { Subject, Subscription } from 'rxjs';
import { SocketService } from 'src/app/services/socket/socket.service';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { GES_INFOComponent } from '../../Tareas/GES_INFO/GES_INFO.component';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { libtools } from '../../common/libtools';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { showToast } from '../../../shared/toast/toastComponent.js';

@Component({
    selector: 'app-HISTORIAL-NTF',
    templateUrl: './historial-ntf.component.html',
    styleUrls: ['./historial-ntf.component.css'],
    imports: [DxListModule, DxDateBoxModule, DxButtonModule, DxLoadPanelModule, DxToolbarModule, GES_INFOComponent]
})
export class HISTORIALNTFComponent {

  @ViewChild('HtsNotifications', { static: false }) HtsNotifications: DxListComponent;

  eventsGesInfo: Subject<any> = new Subject<any>();
  subscription: Subscription;
  subscriptionNtfApl: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;

  ltool: any;
  EMPRESA: any = '';
  USUARIO_LOCAL:any = '';
  mostrarNtf:any = '';
  loadingVisible = false;
  notifications: any[] = [];
  notificationsTodas: any[] = [
    { key: 'Hoy', items: [] },
    { key: 'Anteriores', items: [] }
  ];
  notificationsLeidas: any[] = [
    { key: 'Hoy', items: [] },
    { key: 'Anteriores', items: [] }
  ];
  notificationsNoLeidas: any[] = [
    { key: 'Hoy', items: [] },
    { key: 'Anteriores', items: [] }
  ];
  notificationsRecordatorios: any[] = [{ GRUPO: 'Hoy', DATA: [] }];

  constructor(
    public socket: SocketService,
    private _sbarreg: SbarraService,
    private tabService: TabService
   ) {
    this.subscription = this._sbarreg
    .getObsRegApl()
    .subscribe((dempeg) => {
      if (dempeg.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opMenuRegistro(dempeg);
    });

    this.subscriptionNtfApl = this.socket
    .emitNtfApl()
    .subscribe((data) => {
      // data.ACTIVIDAD = JSON.parse(data.ACTIVIDAD);
      if (data.ID_APLICACION === this.prmUsrAplBarReg.aplicacion || this.prmUsrAplBarReg.aplicacion === 'ADM-1000') {
        if (data.ESPEC === 'NOTIFICACION') {
          const newData:any = this.validarNtf([data], 'agregar');
          this.notifications.push(newData[0]);
          this.orderGroupFechas();
        } else if (data.TIPO === 'RECORDATORIO') {
          this.notificationsRecordatorios[0].DATA.push(data);
          this.notificationsRecordatorios[0].DATA.sort(this.compararFechasDesc);
        }
      }
    });

    this.ltool = new libtools(this._sbarreg, this.tabService);
  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.EMPRESA = localStorage.getItem('empresa');
    this.prmUsrAplBarReg = {
      tabla: "MENSAJERIA",
      aplicacion: "ADM-1000",
      usuario: this.USUARIO_LOCAL,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: {r_refrescar: true}
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mostrarNtf = 'Todas';

    const recor:any = localStorage.getItem('RECORDATORIOS');
    if (recor) {
      this.notificationsRecordatorios[0].DATA = JSON.parse(recor);
      this.notificationsRecordatorios[0].DATA.sort(this.compararFechasDesc);
    }

    setTimeout(() => {
      this.valoresObjetos('notificaciones');
    }, 100);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subscriptionNtfApl.unsubscribe();
  }

// Llama a Acciones de registro
opMenuRegistro(operMenu: clsBarraRegistro): void {
  switch (operMenu.accion) {
    case "r_ini":
      const user:any = localStorage.getItem("usuario")
      this.prmUsrAplBarReg = {
        tabla: "MENSAJERIA",
        aplicacion: "ADM-1000",
        usuario: this.USUARIO_LOCAL,
        accion: "r_ini",
        error: "",
        r_numReg: 0,
        r_totReg: 0,
        operacion: {r_refrescar: true}
      };
      this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      break;

    case "r_nuevo":
      break;

    case "r_modificar":
      break;

    case "r_guardar":
      break;

    case "r_buscar":
      break;

    case "r_buscar_ejec":
      break;

    case "r_eliminar":
      break;

    case "r_primero":
    case "r_anterior":
    case "r_siguiente":
    case "r_ultimo":
    case "r_numreg":
      break;

    case "r_cancelar":
      break;

    case "Vista":
      break;

    case 'r_refrescar':
      this.valoresObjetos('todos');
      break;

    case "r_imprimir":
      break;

    default:
      break;
  }
}

  orderGroupFechas() {
    this.notificationsTodas = [
      { key: 'Hoy', items: [] },
      { key: 'Anteriores', items: [] }
    ];
    // Grupos de fechas
    let grupoHoy: any = [];
    let grupoAnteriores: any = [];
    // Agrupa por fecha.
    let hoy = new Date();
    // let ayer = new Date();
    // ayer.setDate(hoy.getDate() - 1);

    // Normalizar las fechas a la medianoche para comparaciones
    let inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    // let inicioAyer = new Date(
    //   ayer.getFullYear(),
    //   ayer.getMonth(),
    //   ayer.getDate()
    // );

    this.notifications.forEach((item: any) => {
      let fechaItem = new Date(item.FECHA_UPDATE);
      if (fechaItem >= inicioHoy) {
        grupoHoy.push(item);
      } else {
        grupoAnteriores.push(item);
      }
    });

    // Ordenar cada grupo por fecha de más reciente a más antigua
    grupoHoy.sort(this.compararFechasDesc);
    grupoAnteriores.sort(this.compararFechasDesc);

    // Combinar los grupos en el orden deseado
    this.notificationsTodas = [
      { key: 'Hoy', items: grupoHoy.length > 70 ? grupoHoy.slice(0, 70) : grupoHoy },
      { key: 'Anteriores', items: grupoAnteriores.length > 70 ? grupoAnteriores.slice(0, 70) : grupoAnteriores }
    ];

    this.loadingVisible = false;
    setTimeout(() => {
      this.HtsNotifications?.instance?._refresh();
    }, 300);
  };

  compararFechasDesc(a: any, b: any) {
    return new Date(b.FECHA ? b.FECHA : b.FECHA_ENVIO).getTime() - new Date(a.FECHA ? a.FECHA : a.FECHA_ENVIO).getTime();
  }

  onContentReadyList(e:any) {
    this.loadingVisible = false;
  }

  abrirApl(item: any) {
    switch (item.ID_APLICACION) {
      case 'GES-001':
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
        this.changeStatus(item.ACTIVIDAD.ACTIVIDAD_DATA, 'Visto', '');
        break;

      case 'ADM-1000':
        item.ID_APLICACION = 'ADM-1000';
        item.title = 'Notificaciones';
        item.icon = 'icon-bell-ol';
        item.TABLA = 'MENSAJERIA';
        this.ltool.abrirApl(item, 'abrir aplicacion');
        break;

      // case 'COM-203': {
      //   // Replicar lógica de header.component.ts para COM-203
      //   item.title = item.NOMBRE_APLICACION || 'Movimiento Inventario';
      //   item.icon = item.icon || 'icon-inventory';
      //   item.TABLA = 'MOVIMIENTOS';
      //   // Buscar los datos igual que en header
      //   let actividad = item?.ACTIVIDAD ?? {};
      //   if (typeof actividad === 'string') {
      //     try { actividad = JSON.parse(actividad); } catch { actividad = {}; }
      //   }
      //   if (actividad === null || typeof actividad !== 'object') actividad = {};
      //   const actividadData = actividad?.ACTIVIDAD_DATA ?? {};
      //   let datos = item?.DATOS ?? {};
      //   if (typeof datos === 'string') {
      //     try { datos = JSON.parse(datos); } catch { datos = {}; }
      //   }
      //   if (datos === null || typeof datos !== 'object') datos = {};
      //   let idDocumento = actividadData.ID_DOCUMENTO
      //     ? String(actividadData.ID_DOCUMENTO).trim()
      //     : datos.ID_DOCUMENTO
      //     ? String(datos.ID_DOCUMENTO).trim()
      //     : (item?.ID_DOCUMENTO ? String(item.ID_DOCUMENTO).trim() : '');
      //   let consecutivo =
      //     actividadData.CONSECUTIVO !== undefined && actividadData.CONSECUTIVO !== null
      //       ? String(actividadData.CONSECUTIVO).trim()
      //       : datos.CONSECUTIVO !== undefined && datos.CONSECUTIVO !== null
      //       ? String(datos.CONSECUTIVO).trim()
      //       : (item?.CONSECUTIVO !== undefined && item?.CONSECUTIVO !== null
      //         ? String(item.CONSECUTIVO).trim()
      //         : '');
      //   const documentoTexto = actividadData.DOCUMENTO || datos.DOCUMENTO || item?.DOCUMENTO || '';
      //   if ((!idDocumento || !consecutivo) && documentoTexto) {
      //     const partesDocumento = String(documentoTexto).trim().split(/\s+/);
      //     if (partesDocumento.length >= 2) {
      //       if (!idDocumento) idDocumento = partesDocumento[0];
      //       if (!consecutivo) consecutivo = partesDocumento[1];
      //     }
      //   }
      //   if (!idDocumento || !consecutivo) {
      //     showToast('No fue posible abrir el movimiento: faltan ID_DOCUMENTO o CONSECUTIVO.', 'warning');
      //     return;
      //   }
      //   // Solo buscar por ID_DOCUMENTO y CONSECUTIVO, sin otros campos
      //   item.FILTRO = JSON.stringify({
      //     ESTRUCTURA: [
      //       { ID_DOCUMENTO: idDocumento, CONSECUTIVO: consecutivo }
      //     ]
      //   });
      //   this.ltool.abrirApl(item, 'consulta');
      //   break;
      // }

      default:
        break;
    }

  }

  changeStatus(item: any, estado: string, grupo: string) {
    let response: any = { USUARIO: this.USUARIO_LOCAL, EMPRESA: this.EMPRESA, ACCION: 'CAMBIO ESTADO' };

    if (item === 'todos') {
      var dataNew:any = [];
      var posData:any = -1;
      if (estado === 'Enviado') {
        posData = this.notificationsLeidas.findIndex((d:any) => d.key === grupo);
        dataNew = this.notificationsLeidas[posData].items;
      } else if (estado === 'Visto') {
        posData = this.notificationsNoLeidas.findIndex((d:any) => d.key === grupo);
        dataNew = this.notificationsNoLeidas[posData].items;
      }
      for (let i = 0; i < dataNew.length; i++) {
        let element = dataNew[i];
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
        const pos:any = this.notifications.findIndex((d:any) => d.ITEM === element.ITEM);
        if (pos !== -1)
          this.notifications[pos] = element;
      }
      if (estado === 'Enviado') {
        this.socket.setBadgeNotificaciones({NUM: dataNew.length, ACCION: 'sumar'});
      } else {
        this.socket.setBadgeNotificaciones({NUM: dataNew.length, ACCION: 'restar'});
      }

    } else {
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
      const pos:any = this.notifications.findIndex((d:any) => d.ITEM === item.ITEM);
      if (pos !== -1)
        this.notifications[pos] = item;
      if (estado === 'Enviado') {
        this.socket.setBadgeNotificaciones({NUM: 1, ACCION: 'sumar'});
      } else {
        this.socket.setBadgeNotificaciones({NUM: 1, ACCION: 'restar'});
      }
    }

    this.orderGroupFechas();
  }

  validarNtf(newArray:any, metodo:any) {
    var notf: any = [];
    for (let i = 0; i < newArray.length; i++) {
      var notificacion = newArray[i];
      notificacion.USUARIO_ENV = metodo === 'consulta' ? JSON.parse(notificacion.USUARIO_ENV) : metodo === 'agregar' ? notificacion.USUARIO_ENV : [];
      // notificacion.USUARIO_REC = metodo === 'consulta' ? JSON.parse(notificacion.USUARIO_REC) : metodo === 'agregar' ? notificacion.USUARIO_REC : [];
      if (notificacion.ACTIVIDAD !== "") {
        notificacion.ACTIVIDAD = metodo === 'consulta' ? JSON.parse(notificacion.ACTIVIDAD) : metodo === 'agregar' ? notificacion.ACTIVIDAD : [];
      }
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
    }
    return newArray;
  }

  valoresObjetos(obj: string) {
    if (obj === 'notificaciones' || obj === 'todos') {
      this.loadingVisible = true;
      const prm: any = { USUARIO: this.USUARIO_LOCAL };
      this.socket.getHistorial('HISTORICO NOTIFICACION', prm)
      .subscribe((data: any) => {
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
          this.notifications = this.validarNtf(newArray, 'consulta');
          this.orderGroupFechas();
        }
      });
    }
  }

}
