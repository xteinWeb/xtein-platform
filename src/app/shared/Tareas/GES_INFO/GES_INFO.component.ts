import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import {
  DxButtonModule, DxDateBoxModule, DxDropDownButtonModule, DxFileUploaderModule, DxLoadPanelModule, DxPopupModule,
  DxScrollViewComponent, DxScrollViewModule, DxSelectBoxModule, DxTagBoxModule, DxTextAreaModule, DxTextBoxModule,
  DxToolbarModule, DxValidatorModule, getElement
} from 'devextreme-angular';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import { Observable, Subscription, firstValueFrom, of } from 'rxjs';
import { clsGES_INFO } from './clsGES_INFO.class';
import { validatorRes } from 'src/app/shared/validator/validator';
import notify from 'devextreme/ui/notify';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { TimelineModule } from "primeng/timeline";
import { CardModule } from "primeng/card";
import Swal from 'sweetalert2';
import { GES00Service } from 'src/app/shared/Tareas/Service/GES00.service';
import { showToast } from '../../../shared/toast/toastComponent.js';
import { RouterLink } from '@angular/router';
import { SocketService } from 'src/app/services/socket/socket.service';
import { GES001Service } from 'src/app/services/GES001/GES001.service';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';

@Component({
    selector: 'GES_INFO',
    templateUrl: './GES_INFO.component.html',
    styleUrls: ['./GES_INFO.component.scss'],
    imports: [CommonModule, DxPopupModule, DxTagBoxModule, DxDateBoxModule, DxSelectBoxModule, DxTextAreaModule, DxTextBoxModule,
        DxButtonModule, MatDividerModule, TimelineModule, CardModule, DxLoadPanelModule, DxToolbarModule, DxValidatorModule,
        DxScrollViewModule, DxDropDownButtonModule, DxFileUploaderModule
    ],
    providers: [DatePipe]
})
export class GES_INFOComponent implements OnInit {


  @Input() events: Observable<any>;
  @Output() onRespuestaComponent: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('scrollViewBodyChat', { static: false }) scrollViewBodyChat: DxScrollViewComponent;

  private eventsSubscription: Subscription;
  subscription: Subscription;

  container: any;
  readOnly: boolean = false;
  visibleGesproInfo: boolean = false;
  loadingVisible: boolean = false;
  indAsoArchivo: boolean = false;
  mostrarSubirArchivos: boolean = false;
  img_height: number = 0;
  img_width: number = 0;

  ocultarInfoAct: boolean = true;
  tituloGesproInfo: string;
  mesajeText: string = '';
  base64DataFile: any;
  archivoDoc: any;
  indexOff: number = 0;
  DTimeline: any[];
  DLEstados: any = [];
  JsonDataSource: any = [];

  USUARIO_LOCAL: any = '';
  data_prev: any = '';
  new_data: any;
  listEstados: any = ['Sin iniciar', 'En proceso', 'En pausa', 'Finalizado', 'Completada'];
  listPrioridad: any = ['Inmediato', 'Alta', 'Media', 'Baja'];
  itemsFiltro: any[] = [
    { value: 'Todo', name: 'Todo' },
    { value: 'Historico', name: 'Historico' },
    { value: 'Novedades', name: 'Novedades' }
  ];
  selectFiltro: string = 'Novedades';
  templateGroup: any = ['ID_RESPONSABLE'];
  eventos: any[];
  valueFile: any[] = [];
  DResponsables: any = [];
  Darchivos: any = [];
  conCambios: number = 0;

  accionLocal: any = '';
  CLASE_ACTIVA: string = '';
  APLICACION: string = '';
  EMPRESA: any = '';
  subscriptionMensagesACT: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;

  constructor(
    private _sdatos: GES00Service,
    private _sDatos: GES001Service,
    public socket: SocketService,
    // private datepipe: DatePipe
    private datepipe: DatePipe,
    public generalesService: GeneralesService,

  ) {

    this.container = document.getElementById('container-body');
    this.subscriptionMensagesACT = this.socket.emitMessageForo()
      .subscribe((prm) => {
        if (this.visibleGesproInfo) {
          this.valoresObjetos('timeline', '');
        }
      });
    this.prmUsrAplBarReg = {
      tabla: 'GESPRO',
      aplicacion: 'GES-001',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_refrescar: true }
    };
    this.onSelectionChangedFiltro = this.onSelectionChangedFiltro.bind(this);
    this.guardarComentarios = this.guardarComentarios.bind(this);
    this.onInitializedFromResponsables = this.onInitializedFromResponsables.bind(this);
  }

  ngOnInit(): void {
    this.archivoDoc = '';
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.EMPRESA = localStorage.getItem('empresa')?.toUpperCase();
    this.selectFiltro = 'Todo';
    this.valoresObjetos('todos', '');
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.accion) {
        case 'init':
          this.loadDataInit(datos.config);
          break;

        case 'cargar datos':
          this.updateData(datos.config);
          break;

        default:
          break;
      }
    });
    this.prmUsrAplBarReg = {
      tabla: 'GESPRO',
      aplicacion: 'GES-001',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_refrescar: true }
    };
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

  ngAfterViewInit() {
    if (this.scrollViewBodyChat) {
      console.log('scrollViewBodyChat inicializado:', this.scrollViewBodyChat);
    }
  }

  loadDataInit(data: any) {
    switch (data.accion) {
      case 'init':
        this.readOnly = data.readOnly;
        this.APLICACION = data.APLICACION;
        break;

      case 'readOnly':
        this.readOnly = data.READONLY;
        break;

      case 'update data config':
        this.JsonDataSource[data.parametro] = JSON.parse(JSON.stringify(data.dataSource));
        break;

      default:
        break;
    }
  }

  updateData(data: any) {
    switch (data.accion) {
      case 'update dataSource':
        this.new_data = JSON.parse(JSON.stringify(data.dataSource.DATA));
        this.data_prev = JSON.parse(JSON.stringify(data.dataSource.DATA));

        if ((this.new_data.RESPONSABLE === this.USUARIO_LOCAL || this.new_data.USUARIO === this.USUARIO_LOCAL) && this.new_data.ESTADO !== 'Finalizado' && !this.new_data.ANULADO) {
          this.readOnly = false;
        } else if ((this.new_data.COLABORADORES.findIndex((d: any) => d.ID_RESPONSABLE === this.USUARIO_LOCAL) !== -1) || this.new_data.ANULADO) {
          this.readOnly = true;
        } else {
          this.readOnly = true;
        }
        this.tituloGesproInfo = data.dataSource.TITULO;
        this.visibleGesproInfo = data.dataSource.VISIBLE;
        this.archivoDoc = '';
        this.eventos = [];
        this.DTimeline = [];
        this.selectFiltro = 'Todo';
        this.valoresObjetos('timeline', '');
        this.loadingVisible = true;

        break;

      case 'cargar datos notificacion':
        this.new_data = JSON.parse(JSON.stringify(data.dataSource));
        this.valoresObjetos('actividad_by_id', this.new_data.ID_ACTIVIDAD);
        this.data_prev = JSON.parse(JSON.stringify(data.dataSource));

        if ((this.new_data.RESPONSABLE === this.USUARIO_LOCAL || this.new_data.USUARIO === this.USUARIO_LOCAL) && this.new_data.ESTADO !== 'Finalizado' && !this.new_data.ANULADO) {
          this.readOnly = false;
        } else if ((this.new_data.COLABORADORES.findIndex((d: any) => d.ID_RESPONSABLE === this.USUARIO_LOCAL) !== -1) || this.new_data.ANULADO) {
          this.readOnly = true;
        } else {
          this.readOnly = true;
        }
        this.tituloGesproInfo = data.dataSource.NOMBRE;
        this.visibleGesproInfo = data.VISIBLE;
        this.archivoDoc = '';
        this.eventos = [];
        this.DTimeline = [];
        this.selectFiltro = 'Todo';
        this.ocultarInfoAct = false;
        this.valoresObjetos('responsables', '');
        this.valoresObjetos('timeline', '');
        this.loadingVisible = true;

        break;

      case 'update data config':
        this.JsonDataSource[data.parametro] = JSON.parse(JSON.stringify((data.dataSource)));
        this.JsonDataSource['prev_' + data.parametro] = JSON.parse(JSON.stringify((data.dataSource)));
        break;

      default:
        break;
    }
  }

  getDataSource(dataField: any) {
    const res: any = this.JsonDataSource[dataField] || [];
    return of(res);
  }

  onValueChangedNombre(e: any) {
    this.new_data.NOMBRE = e.value;
    this.conCambios++;
  }

  onInitializedFromResponsables(e: any) {
    for (let i = 0; i < this.DResponsables.length; i++) {
      const data: any = this.DResponsables[i];
      const npos: any = data.NOMBRE.indexOf(" ");
      const name = data.NOMBRE.charAt(0).toUpperCase();
      const lastName = data.NOMBRE.substring(npos + 1, data.NOMBRE.length + 1);
      const Lape = lastName.charAt(0).toUpperCase();
      const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
      data.iconNameUser = newName;
    }
  }

  onValueChangedFechaInicial(e: any) {
    this.new_data.FECHA_INICIO = e.value;
    this.conCambios++;
  }

  onValueChangedFechaFinal(e: any) {
    this.new_data.FECHA_FIN = e.value;
    this.conCambios++;
  }

  onValueCOLABORADORES(e: any) {
    this.new_data.COLABORADORES = e.value;
    this.conCambios++;
  }
  onValueRESPONSABLE(e: any) {
    this.new_data.RESPONSABLE = e.value;
    this.conCambios++;
  }

  onSelectionPrioridad(e: any) {
    if (e.value !== '') {
      this.new_data.PRIORIDAD = e.value;
    }
    this.conCambios++;
  }

  onSeleccEstado(e: any) {
    if (e.value !== '') {
      this.new_data.ESTADO = e.value;
    }
    this.conCambios++;
  }

  onValueChangedDescripcion(e: any) {
    this.conCambios++;
  }

  onSelectionChangedFiltro(e: any) {
    this.selectFiltro = e.item.value;
    switch (this.selectFiltro) {
      case 'Todo':
        this.DTimeline = this.eventos;
        break;

      case 'Novedades':
        this.DTimeline = this.eventos.filter((d: any) => d.TIPO === 'MANUAL');
        break;

      case 'Historico':
        this.DTimeline = this.eventos.filter((d: any) => d.TIPO === 'AUTOMATICO');
        break;

      default:
        this.DTimeline = this.eventos;
        break;
    }
  };

  aceptarBottom(e: any) {
    if (this.conCambios > 0) {
      this.visibleGesproInfo = false;
      this.conCambios = 0;
      this.opPrepararGuardar(this.new_data);
    } else {
      this.visibleGesproInfo = false;
      this.conCambios = 0;
    }
  }


  opPrepararGuardar(datos: any) {
    var prm: any = { USUARIO: this.USUARIO_LOCAL, ACTIVIDAD: datos };
    // Guarda la actividad
    this._sdatos.saveActividades('update', prm).subscribe(
      (data: any) => {
        this._sdatos.loadingVisible = false;
        const res = validatorRes(data);
        if (data.token !== undefined) {
          const refreshToken = data.token;
          localStorage.setItem('token', refreshToken);
        }
        //notificacion al Responsable
        this.envioNotificacion('notificacion', prm.ACTIVIDAD, '');
      })
  }

  envioNotificacion(fuente: any, prm: any, TIMELINE: any) {
    const TIPO_TAREA: any = prm.CLASE;
    const usr_env: any = this.DResponsables.filter(
      (d: any) => d.ID_RESPONSABLE === this.USUARIO_LOCAL
    );
    let usr_rec: String[] = [];
    usr_rec.push(prm.RESPONSABLE);
    usr_rec.push(prm.USUARIO);
    if (prm.COLABORADORES.length > 0 && prm.COLABORADORES != undefined && prm.COLABORADORES != null) {
      prm.COLABORADORES.forEach((user) =>
        usr_rec.push(user))
    }
    const index = usr_rec.indexOf(this.USUARIO_LOCAL);
    if (index !== -1) {
      usr_rec.splice(index, 1); // Elimina ese elemento
    }
    usr_rec = [...new Set(usr_rec)];
    let nombrePartes = usr_env[0].NOMBRE.split(' ');
    let user_name = nombrePartes.length > 2 ? nombrePartes[0] + ' ' + nombrePartes[2] : nombrePartes[0] + ' ' + nombrePartes[1]
    var sendMail: boolean = false;
    var msj: any = '';
    var accion: any = '';

    if (fuente === 'notificacion') {
      sendMail = false;
      accion = 'modifico_actividad'
    }

    if (TIPO_TAREA === 'RESPONSABILIDAD' && fuente === 'notificacion') {
      msj = user_name + ', modificó la ' + 'RESPONSABILIDAD ' + this.new_data.NOMBRE.toUpperCase();
    }
    if (TIPO_TAREA === 'EVENTOS' && fuente === 'notificacion') {
      msj = user_name + ', modificó el ' + 'EVENTO ' + this.new_data.NOMBRE.toUpperCase();
    }
    if (TIPO_TAREA === 'COMUNITARIAS' && fuente === 'notificacion') {
      msj = user_name + ', modificó la actividad ' + this.new_data.NOMBRE.toUpperCase();
    }
    if (TIPO_TAREA === 'TAREAS' && fuente === 'notificacion') {
      msj = user_name + ', modificó la ' + 'TAREA ' + this.new_data.NOMBRE.toUpperCase();
    }
    if (fuente === 'notificacion chat') {
      msj = user_name + ', Registro un mensaje en la ' + 'TAREA ' + this.new_data.NOMBRE.toUpperCase();
      accion = 'nuevo mensaje'
    }

    //Envia el responsable
    const posApl: any = this.generalesService.APLICACIONES.findIndex((d: any) => d.ID_APLICACION === this.prmUsrAplBarReg.aplicacion);

    var dataNotificacion: any = {
      FECHA: this.datepipe.transform(
        new Date(),
        'MM/dd/yyyy HH:mm:ss'
      ),
      USUARIO_ENV: usr_env[0],
      USUARIO_REC: usr_rec,
      NOMBRE_APLICACION: posApl > -1 ? this.generalesService.APLICACIONES[posApl].NOMBRE : null,
      DESCRIPCION: msj,
      TIPO: 'AUTOMATICA',
      ESTADO: 'Enviado',
      APLICACION: 'GES-001',
      ID_APLICACION: 'GES-001',
      FECHA_UPDATE: this.datepipe.transform(
        new Date(),
        'MM/dd/yyyy HH:mm:ss'
      ),
      SEND_EMAIL: sendMail,
      EMPRESA: this.EMPRESA,
      ESPEC: 'NOTIFICACION',
      ACCION: accion,
      TIMELINE: TIMELINE,
      CLASE: TIPO_TAREA,
      ACTIVIDAD: JSON.stringify({
        EMPRESA: this.EMPRESA,
        ESPEC: 'NOTIFICACION',
        ACCION: accion,
        TIMELINE: TIMELINE,
        CLASE: TIPO_TAREA,
        ACTIVIDAD_DATA: prm
      })
    };
    // API guardado de datos

    const data1: any = {
      TIPO: 'NOTIFICACION',
      DATOS: dataNotificacion,
    };
    this.socket.saveInfo('SAVE NOTIFICACION', data1).subscribe((data) => {
      const res = JSON.parse(data.data);
      if (res[0].ErrMensaje !== '') {
        this.showModal(res[0].ErrMensaje, 'Error al enviar notificación.');
      } else {
        let datos = {
          data: dataNotificacion,
          USUARIO: dataNotificacion.USUARIO_ENV
        }
        this.socket.sendSocket('notificaciones', 'get_data_notificaciones', datos);
      }
    });
  }


  showUploadFile(e: any) {
    this.mostrarSubirArchivos = !this.mostrarSubirArchivos;
  }

  onBeforeSendArchivos(e: any) {
    if (e.file !== undefined && e.file !== null && e.file !== '') {
      var prm: any;
      prm = { USUARIO: this.USUARIO_LOCAL, ARCHIVO: e.file, ID_ACTIVIDAD: this.new_data.ID_ACTIVIDAD };
      this._sdatos.saveArchivos('SAVE ARCHIVO', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        const mensaje = res[0].ErrMensaje;
        if (mensaje !== '') {
          showToast(mensaje, 'error');
        } else {
          this.mostrarSubirArchivos = !this.mostrarSubirArchivos;
          this.valueFile = [];
          this.valoresObjetos('timeline', '');
          showToast('Archivo enviado.', 'success');
        };
      },
        ((err: any) => {
          this._sdatos.loadingVisible = false;
          this.showModal(err.message, '');
        })
      );
    }
  }

  compressImage(src: any, newX: any, newY: any, src_w: any, src_h: any) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.src = src;
      img.onload = rs => {
        const elem = document.createElement('canvas');
        var ratio = Math.min(newX / src_w, newY / src_h);
        elem.width = src_w * ratio;  // newX
        elem.height = src_h * ratio;  // newY
        const ctx: any = elem.getContext('2d');
        ctx.drawImage(img, 0, 0, src_w * ratio, src_h * ratio);   //, newX, newY);
        const data = elem.toDataURL();
        res(data);
      }
      img.onerror = error => rej(error);
    })
  }

  formatDateTime(date = new Date()) {
    const pad = (n, z = 2) => n.toString().padStart(z, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.` +
      `${pad(date.getMilliseconds(), 3)}`;
  }

  async guardarComentarios() {
    if (this.mesajeText.length > 0 || this.Darchivos.length > 0) {


      let msj: string = '';
      if (this.mesajeText.length > 0) {
        msj = this.mesajeText;
      } else if (this.Darchivos.length === 1) {
        msj = localStorage.getItem('user_name') + ',  adjunto un archivo.';
      } else if (this.Darchivos.length > 1) {
        msj = localStorage.getItem('user_name') + ',  adjunto varios archivos.';
      } else {
        msj = this.mesajeText;
      }
      if (this.Darchivos.length > 0) {
        for (let i = 0; i < this.Darchivos.length; i++) {
          const element = this.Darchivos[i];
          if (this.tamArchivoImg > 100000) {
            await this.compressImage(element.IMAGEN, 600, 600, this.img_width, this.img_height).then(compressed => {
              this.generalesService.cargar_archivo(`GES00/${element.ARCHIVO.replace(/\s+/g, '')}`, compressed).subscribe((data: any) => {
                element.IMAGEN = data
              });
            })
          } else {

            element.IMAGEN = await firstValueFrom(
              this.generalesService.cargar_archivo(`GES00/${element.ARCHIVO.replace(/\s+/g, '')}`, element.IMAGEN)
            );

          }
        }
      }

      const usr_env: any = this.DResponsables.filter((d: any) => d.ID_RESPONSABLE === this.USUARIO_LOCAL);
      let usr_rec: String[] = [];

      usr_rec.push(this.new_data.RESPONSABLE);
      usr_rec.push(this.new_data.USUARIO);
      if (this.new_data.COLABORADORES.length > 0) {
        this.new_data.COLABORADORES.forEach((user) =>
          usr_rec.push(user))
      }
      const index = usr_rec.indexOf(this.USUARIO_LOCAL);
      if (index !== -1) {
        usr_rec.splice(index, 1); // Elimina ese elemento
      }
      usr_rec = [...new Set(usr_rec)];
      const prm: any = {
        USUARIO_ENV: usr_env[0],
        USUARIO_REC: usr_rec,
        DESCRIPCION: msj,
        ID_ACTIVIDAD: this.new_data.ID_ACTIVIDAD,
        ARCHIVOS: this.Darchivos,
        ID_APLICACION: 'GES-001',
        FECHA: this.formatDateTime(),
      };

      this._sdatos.saveComentarios('SAVE MENSAJE', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        const mensaje = res[0].ErrMensaje;
        if (mensaje !== '') {
          showToast(mensaje, 'error');
        } else {
          this.mesajeText = '';
          this.valoresObjetos('timeline', '');
          showToast('Comentario agregado.', 'success');

          let datos = {
            data: prm,
            USUARIO: prm.USUARIO_ENV
          }
          this.socket.sendSocket('mensajes_actividad', 'get_data_mensajes_actividad', datos);
          this.envioNotificacion('notificacion chat', this.new_data, '');
        };
      },
        ((err: any) => {
          this._sdatos.loadingVisible = false;
          this.showModal(err.message);
        })
      );
    };
    this.Darchivos = [];
    this.mesajeText = '';
    this.mostrarSubirArchivos = false;
  }

  validatingData() {
    if ((this.new_data.RESPONSABLE !== '')
      && (this.new_data.FECHA_INICIO !== null && this.new_data.FECHA_INICIO !== undefined)
      && (this.new_data.FECHA_FIN !== null && this.new_data.FECHA_FIN !== undefined)
      && (this.new_data.PRIORIDAD !== '')
      && (this.new_data.ESTADO !== '')
      && (this.new_data.DESCRIPCION !== '')
    ) {
      return true;
    } else {
      return false;
    }
  }

  closeBottom(e: any) {
    this.visibleGesproInfo = false;
    this.ocultarInfoAct = true;
    this.Darchivos = [];
    this.conCambios = 0;
  }

  onClickEliminarArchivo(e: any, archivo: any) {
    const npos: any = this.Darchivos.findIndex((d: any) => d.ITEM === archivo.ITEM && d.ARCHIVO === archivo.ARCHIVO);
    this.Darchivos.splice(npos, 1);
  }

  // Abrir archivo
  onClickAbrir(archPDF: any, cellInfo: any) {
    // Si está en modo visualizacion, asigna fila de datos
    if (cellInfo !== undefined)
      this.new_data = cellInfo;

    // Tipos de archivos
    const signatures = {
      JVBERi0: "application/pdf",
      ".pdf": "application/pdf",
      R0lGODdh: "image/gif",
      R0lGODlh: "image/gif",
      iVBORw0KGgo: "image/png",
      TU0AK: "image/tiff",
      "/9j/": "image/jpg",
      UEs: "application/vnd.openxmlformats-officedocument.",
      PK: "application/zip",
    };
    var fileType = '';
    for (var s in signatures) {
      if (this.new_data.IMAGEN.indexOf(s) !== -1) {
        fileType = signatures[s];
        // return
        break;
      }
    }
    if (fileType.match('image')) {
      var image = new Image();
      image.src = this.new_data.IMAGEN;
      var w = window.open("");
      w?.document.write("<style>img{max-width: 75%;}</style>", image.outerHTML);
    }
    if (fileType.match('pdf')) {
      let pdfWindow = window.open("");
      pdfWindow?.document.write("<iframe width='100%' height='100%' src='" + this.new_data.IMAGEN + "#view=FitH'></iframe>");
    }

  }

  onPasteMsj(e: any) {
    this.mostrarSubirArchivos = true;
    const items = e.event.originalEvent.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const file = item.getAsFile();
      if (file) {
        const larch = file.name;
        const tipoArchivo: any = file.type;
        var icon: any = '';

        // Icono segun tipo de archivo
        if (tipoArchivo.includes('image')) {
          icon = 'icon-image-ol';
        } else if (tipoArchivo.includes('pdf')) {
          icon = 'icon-pdf-doc-sl';
        } else if (tipoArchivo.includes('excel') || tipoArchivo.includes('spreadsheetml') || tipoArchivo.includes('word')) {
          icon = 'icon-doc-ol';
        } else { //otros
          icon = 'icon-link-ol';
        }

        const reader = new FileReader();
        reader.onload = (e: any) => {
          const archivo: any = e.target.result;
          if (this.Darchivos.length === 0) {
            this.Darchivos = [{
              USUARIO: this.USUARIO_LOCAL,
              ITEM: 1,
              ARCHIVO: larch,
              ID_ACTIVIDAD: this.new_data.ID_ACTIVIDAD,
              IMAGEN: archivo,
              icon: 'icon-image-ol',
              TYPE: file.type
            }];
          } else {
            const item = this.Darchivos.reduce((ant: any, act: any) => { return (ant.ITEM > act.ITEM) ? ant : act });
            this.Darchivos.push({
              USUARIO: this.USUARIO_LOCAL,
              ITEM: item.ITEM + 1,
              ARCHIVO: larch,
              ID_ACTIVIDAD: this.new_data.ID_ACTIVIDAD,
              IMAGEN: archivo,
              icon: 'icon-image-ol',
              TYPE: file.type
            });
          }

        };
        reader.readAsDataURL(file);
      }
    }
  }


  // Cargar archivo
  onClickCargar(archPDF: any) {
    this.operArcImg('cargar', archPDF);
  }

  // Llama al cargue del archivo
  datArchivo: any;
  operArcImg(operArch: any, archivo: any) {

    // Operación de cargue de archivo
    if (operArch.match('cargar|icon-upload-file-sl')) {
      let input = document.createElement('input');
      this.datArchivo = archivo;
      input.type = 'file';
      input.multiple = true;
      input.accept = "image/*,video/*,.pdf,.csv";
      this.indAsoArchivo = false;
      input.addEventListener("change", (e) => {
        if (!this.indAsoArchivo) this.fileChangeEvent(e, this.datArchivo);
      });
      if (!this.indAsoArchivo) input.click();
    }
  }

  imageError: string = '';
  tamArchivoImg: any;
  imgBase64zip: any;
  fileChangeEvent(fileInput: any, tarea: any) {
    var res: boolean = false;
    const signatures = {
      JVBERi0: "application/pdf",
      R0lGODdh: "image/gif",
      R0lGODlh: "image/gif",
      iVBORw0KGgo: "image/png",
      TU0AK: "image/tiff",
      "/9j/": "image/jpg",
      UEs: "application/vnd.openxmlformats-officedocument.",
      PK: "application/zip",
    };
    this.imageError = '';
    this.indAsoArchivo = true;
    for (let i = 0; i < fileInput.target.files.length; i++) {
      const file = fileInput.target.files[i];
      const larch = file.name;
      const tipoArchivo: any = file.type;
      var icon: any = '';

      // Icono segun tipo de archivo
      if (tipoArchivo.includes('image')) {
        icon = 'icon-image-ol';
      } else if (tipoArchivo.includes('pdf')) {
        icon = 'icon-pdf-doc-sl';
      } else if (tipoArchivo.includes('excel') || tipoArchivo.includes('spreadsheetml') || tipoArchivo.includes('word')) {
        icon = 'icon-doc-ol';
      } else { //otros
        icon = 'icon-link-ol';
      }

      if (this.Darchivos.length === 0) {
        this.Darchivos = [{
          USUARIO: this.USUARIO_LOCAL,
          ITEM: 1,
          ARCHIVO: larch,
          ID_ACTIVIDAD: tarea.ID_ACTIVIDAD,
          IMAGEN: '',
          icon: icon,
          TYPE: tipoArchivo
        }];
      } else {
        const item = this.Darchivos.reduce((ant: any, act: any) => { return (ant.ITEM > act.ITEM) ? ant : act });
        this.Darchivos.push({
          USUARIO: this.USUARIO_LOCAL,
          ITEM: item.ITEM + 1,
          ARCHIVO: larch,
          ID_ACTIVIDAD: tarea.ID_ACTIVIDAD,
          IMAGEN: '',
          icon: icon,
          TYPE: tipoArchivo
        });
      }

      //Ajusta el popup
      // this.heightGesproInfo

      this.archivoDoc = larch;
      if (fileInput.target.files && file) {
        // Size Filter Bytes
        const max_size = 100000;
        const allowed_types = ['image/png', 'image/jpeg', 'image/jpeg', 'application/pdf'];
        const max_height = 15200;
        const max_width = 25600;

        /*if (file.size > max_size) {
          this.imageError = 'El máximo tamaño no debe supearar los 1.000.000 Kbytes ó ' + max_size / 1000000 + 'Mb';
          this.showModal(this.imageError);
          return false;
        }*/
        this.tamArchivoImg = file.size;

        /*if (!_.includes(allowed_types, file.type)) {
          this.imageError = 'Only Images are allowed ( JPG | PNG )';
          return false;
        }*/
        var fileType = '';
        const reader = new FileReader();
        reader.onload = (e: any) => {
          for (var s in signatures) {
            if (e.target.result.indexOf(s) !== 0) {
              var fileType = signatures[s];
              // return
              break;
            }
          }
          this.base64DataFile = e.target.result;
          const npos: any = this.Darchivos.findIndex((d: any) => d.ARCHIVO === larch)
          this.Darchivos[npos].IMAGEN = e.target.result;
          // this.new_data = archivo;
          this.mostrarSubirArchivos = true;
          if (fileType.match('image')) {
            const image = new Image();
            image.src = e.target.result;
            image.onload = async (rs: any) => {
              this.img_height = rs.currentTarget['height'];
              this.img_width = rs.currentTarget['width'];

              if (this.img_height > max_height && this.img_width > max_width) {
                this.imageError =
                  'Máximas dimensiones permitidas: ' +
                  max_height +
                  '*' +
                  max_width +
                  'px';
                this.showModal(this.imageError);
                res = false;
              } else {
                // Guarda archivo en la url
                const ext = larch.substring(larch.lastIndexOf(".") + 1);
                var imgBase64Path = e.target.result;

                // Redimensionar tamaño si supera determinado tamaño
                if (this.tamArchivoImg > 10000) {
                  // await this.compressImage(imgBase64Path, 200, 200, img_width, img_height).then(compressed => {
                  //   imgBase64Path = compressed;
                  // })
                }

                // this.usuarioImg = imgBase64Path;

                res = true;
              }
            };
          }
        };

        if (this.imageError === '') reader.readAsDataURL(file);

        res = true;
      } else {
        res = false;
      }
    };
    return res;
  }

  templateHtmlColb(data: any, element: any): any {
    let cad = [{ ID_RESPONSABLE: '', NOMBRE: '', iconNameUser: '', FOTO: '' }];
    let res: any = '';
    const pos: any = this.DResponsables.findIndex((d: any) => d.ID_RESPONSABLE === data.ID_RESPONSABLE);
    const USR: any = this.DResponsables[pos];
    this.templateGroup.forEach((col: any) => {
      if (USR !== null && USR !== undefined) {
        cad[0].ID_RESPONSABLE = USR.ID_RESPONSABLE;
        cad[0].NOMBRE = USR.NOMBRE;
        cad[0].iconNameUser = USR.iconNameUser;
        cad[0].FOTO = USR.FOTO;
        switch (element) {
          case 'iconNameUser':
            res = cad[0].iconNameUser;
            break;
          case 'NOMBRE':
            res = cad[0].NOMBRE;
            break;
          default:
            break;
        }
      }
    });
    return res;
  }

  valoresObjetos(obj: string, datos) {
    if (obj === 'estados' || obj === 'todos') {
      const prm: any = {};
      this._sdatos.getEstados('ESTADOS', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'warning');
          return;
        }
        this.DLEstados = res;
      });
    };

    if (obj === 'responsables' || obj === 'todos') {
      const prm: any = {};
      this._sdatos.getResponsables('RESPONSABLES', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          showToast(mensaje, 'warning');
        } else {
          for (let i = 0; i < res.length; i++) {
            const element = res[i];
            const npos: any = element.NOMBRE.indexOf(" ");
            const name = element.NOMBRE.charAt(0).toUpperCase();
            const lastName = element.NOMBRE.substring(npos + 1, element.NOMBRE.length + 1);
            const Lape = lastName.charAt(0).toUpperCase();
            const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
            element.iconNameUser = newName;
            element.ITEM = i;
          };
          this.DResponsables = res;
        }
      });
    };

    if (obj === 'actividad_by_id') {
      const prm: any = {
        ID_ACTIVIDAD: datos
      };
      this._sdatos.getActividadById('DETALLE ACTIVIDAD', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          showToast(mensaje, 'warning');
        } else {
          res[0].COLABORADORES = JSON.parse(res[0].COLABORADORES)
          this.new_data = res[0];
        }
      });
    };
    if (obj === 'timeline') {
      const prm: any = { ID_ACTIVIDAD: this.new_data.ID_ACTIVIDAD };
      this._sdatos.getEstados('TIMELINE', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.loadingVisible = false;
          showToast(res[0].ErrMensaje, 'warning');
          return;
        }
        res.forEach((event: any) => {
          if (event.ARCHIVOS === undefined || event.ARCHIVOS === null) event.ARCHIVOS = [];
          else event.ARCHIVOS = JSON.parse(event.ARCHIVOS);
        });
        this.eventos = res;
        // this.DTimeline = this.eventos.filter((d: any) => d.TIPO === 'MANUAL');
        this.DTimeline = this.eventos.slice(-50);
      });

      setTimeout(() => {
        if (this.scrollViewBodyChat?.instance) {
          this.scrollViewBodyChat.instance.scrollTo({ top: this.scrollViewBodyChat.instance.scrollHeight() });
          this.loadingVisible = false;
        } else {
          console.warn('scrollViewBodyChat no está definido o no tiene una instancia válida.');
        }
      }, 400);
    };
  }

  showModal(mensaje: any, title: any = '') {
    const tipo = title;
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo === 'Error' ? 'DF3E3E' : '#0F4C81 !important',
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
