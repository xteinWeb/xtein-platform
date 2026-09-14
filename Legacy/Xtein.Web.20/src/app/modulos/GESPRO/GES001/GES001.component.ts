import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  DxButtonModule,
  DxDataGridModule,
  DxDateBoxModule,
  DxFormModule,
  DxLoadPanelModule,
  DxNumberBoxModule,
  DxProgressBarModule,
  DxSelectBoxModule,
  DxSwitchModule,
  DxTagBoxModule,
  DxTextBoxModule,
  DxTooltipModule,
  DxSchedulerModule,
  DxSchedulerComponent,
} from 'devextreme-angular';
import { lastValueFrom, Observable, Subscription } from 'rxjs';
import { GES001Service } from 'src/app/services/GES001/GES001.service';
import { GES00Service } from 'src/app/shared/Tareas/Service/GES00.service';
import { validatorRes } from 'src/app/shared/validator/validator';
import { showToast } from '../../../shared/toast/toastComponent.js';
import { MColaboradores, Resource } from '../clsGESPRO.class';
import { HttpClient } from '@angular/common/http';
import { GoogleService } from 'src/app/services/generales/google.service';
import { ADM015Service } from 'src/app/services/ADM015/ADM015.service';

declare var updateEvent: any;
declare var createGoogleEvent: any;

@Component({
  selector: 'app-GES001',
  templateUrl: './GES001.component.html',
  styleUrls: ['./GES001.component.css'],
  standalone: true,
  imports: [
    DxButtonModule,
    DxDataGridModule,
    DxDateBoxModule,
    DxFormModule,
    DxLoadPanelModule,
    DxNumberBoxModule,
    DxProgressBarModule,
    DxSelectBoxModule,
    DxSwitchModule,
    DxTagBoxModule,
    DxTextBoxModule,
    DxTooltipModule,
    DxSchedulerModule,
  ],
})
export class GES001Component implements OnInit {
  @ViewChild('calendarioGespro', { static: false })
  calendarioGespro: DxSchedulerComponent;

  @Input() events: Observable<any>;

  private eventsSubscription: Subscription;
  subscription: Subscription;
  subscriptionCalendario: Subscription;

  DNDCalendarios: any[] = [];
  DEventosCalendario: any = [];
  DEventosCalendarioGoogle: any = [];
  DFestivos: any = [];
  DTareas: any = [];
  groups: any = [];
  DTareas_prev: any = [];
  readOnly: boolean = true;
  currentDate: Date = new Date();
  // currentDate: Date = new Date(2024, 10, 25);

  USUARIO_LOCAL: any = '';
  conCambios: number = 0;
  loadingVisible: boolean = false;
  stylingMode = 'filled';
  selectedNDCalendars: any;
  colaboradoresData: MColaboradores[] = []
  resourcesData: Resource[] = [
    {
      text: 'EVENTOS',
      color: 'rgba(0,111,134,.95)',
      id: 'EVENTOS',
    },
    {
      text: 'TAREAS',
      color: 'rgba(23,61,76,.95)',
      id: 'TAREAS',
    },
    {
      text: 'COMUNITARIAS',
      color: 'rgba(23,56,115,.95)',
      id: 'COMUNITARIAS',
    },
    {
      text: 'RESPONSABILIDADES',
      color: 'rgba(43,85,151,.95)',
      id: 'RESPONSABILIDADES',
    },
  ];

  constructor(
    private _sdatos: GES001Service,
    private _GES00: GES00Service,
    private _sdata: ADM015Service,

    private googleService: GoogleService,
    private http: HttpClient
  ) {
    this.subscriptionCalendario = this._sdatos
      .getObsCalendario()
      .subscribe((data: any) => {
        switch (data.accion) {
          case 'r_refrescar':
            this.calendarioGespro.instance._refresh();
            break;
          case 'r_calendario':
            this.calendarioGespro.instance._refresh();
            break;
        }
      });
    this.valoresObjetos = this.valoresObjetos.bind(this);
  }

  ngOnInit(): void {

    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.valoresObjetos('todos');
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.accion) {
        case 'init':
          this.loadDataInit(datos.config);
          // this.getData({});
          // getEvents()
          // getEventById()
          // updateEvent();
          break;

        case 'configurar':
          // this.configComponent(datos.dataSource);
          break;

        case 'cargar datos':
          this.updateData(datos.config);
          break;

        default:
          break;
      }
    });
  }

  ngOnDestroy() {
    this.subscriptionCalendario.unsubscribe();
  }

  loadDataInit(data: any) {
    switch (data.accion) {
      case 'init':
        if (data.dataSource.length > 0) {
          this.DEventosCalendario = [];
          this.DTareas_prev = data.dataSource;
          this.DTareas_prev.forEach((element: any) => {
            let DATA_PROGRAMACION;
            if (element.DATA_PROGRAMACION !== null && typeof element.DATA_PROGRAMACION === 'string') {
              DATA_PROGRAMACION = JSON.parse(element.DATA_PROGRAMACION);
            } else if (element.DATA_PROGRAMACION !== null && typeof element.DATA_PROGRAMACION === 'object') {
              DATA_PROGRAMACION = element.DATA_PROGRAMACION;
            } else {
              DATA_PROGRAMACION = '';
            }
            const item: any = {
              id: element.ID_ACTIVIDAD,
              ID_ACTIVIDAD: element.ID_ACTIVIDAD,
              ID_ACTIVIDAD_PADRE: element.ID_ACTIVIDAD_PADRE,
              text: element.NOMBRE !== null ? element.NOMBRE : '',
              NOMBRE: element.NOMBRE !== null ? element.NOMBRE : '',
              description: element.DESCRIPCION !== null ? element.DESCRIPCION : '',
              DESCRIPCION: element.DESCRIPCION !== null ? element.DESCRIPCION : '',
              startDate: element.FECHA_INICIO !== null ? new Date(element.FECHA_INICIO) : new Date(),
              FECHA_INICIO: element.FECHA_INICIO !== null ? new Date(element.FECHA_INICIO) : new Date(),
              endDate: element.FECHA_FIN !== null ? new Date(element.FECHA_FIN) : new Date(),
              FECHA_FIN: element.FECHA_FIN !== null ? new Date(element.FECHA_FIN) : new Date(),
              allDay: element.TODO_DIA !== null ? element.TODO_DIA : false,
              TODO_DIA: element.TODO_DIA !== null ? element.TODO_DIA : false,
              PRIORIDAD: element.PRIORIDAD !== null ? element.PRIORIDAD : '',
              USUARIO: element.USUARIO !== null ? element.USUARIO : this.USUARIO_LOCAL,
              RESPONSABLE: element.RESPONSABLE ? element.RESPONSABLE : this.USUARIO_LOCAL,
              COLABORADORES: element.COLABORADORES !== null ? element.COLABORADORES : [],
              CLASE: 'EVENTOS',
              TIPO: element.TIPO !== null ? element.TIPO : '',
              ANULADO: element.ANULADO !== null ? element.ANULADO : false,
              REPETIR: DATA_PROGRAMACION !== ''
                ? DATA_PROGRAMACION.REPETIR : false,
              type: 'EVENTOS',
              recurrenceRule:
                DATA_PROGRAMACION !== ''
                  ? DATA_PROGRAMACION.RECURRENCERULE
                  : '',
            };
            if (element.CLASE !== 'NODOS') {
              this.DEventosCalendario.push(item);
            } else {
              this.DNDCalendarios.push(item);
            }
          });
          // this.selectedNDCalendars = this.DNDCalendarios[0];
          // this.calendarioGespro.instance._refresh();
        } else {
          this.DEventosCalendario = [];
        }
        break;

      case 'update data config':
        // this.JsonDataSource[data.parametro] = data.dataSource;
        break;

      default:
        break;
    }
  }

  updateData(data: any) {
    switch (data.accion) {
      case 'update dataSource':
        if (data.dataSource.length > 0) {
          this.DEventosCalendario = [];
          this.DTareas_prev = data.dataSource;
          this.DTareas_prev.forEach((element: any) => {
            let DATA_PROGRAMACION;
            if (element.DATA_PROGRAMACION !== null && typeof element.DATA_PROGRAMACION === 'object') {
              DATA_PROGRAMACION = JSON.parse(element.DATA_PROGRAMACION);
            } else {
              DATA_PROGRAMACION = '';
            }
            const item: any = {
              id: element.ID_ACTIVIDAD,
              ID_ACTIVIDAD: element.ID_ACTIVIDAD,
              ID_ACTIVIDAD_PADRE: element.ID_ACTIVIDAD_PADRE,
              text: element.NOMBRE !== null ? element.NOMBRE : '',
              NOMBRE: element.NOMBRE !== null ? element.NOMBRE : '',
              description: element.DESCRIPCION !== null ? element.DESCRIPCION : '',
              DESCRIPCION: element.DESCRIPCION !== null ? element.DESCRIPCION : '',
              startDate: element.FECHA_INICIO !== null ? new Date(element.FECHA_INICIO) : new Date(),
              FECHA_INICIO: element.FECHA_INICIO !== null ? new Date(element.FECHA_INICIO) : new Date(),
              endDate: element.FECHA_FIN !== null ? new Date(element.FECHA_FIN) : new Date(),
              FECHA_FIN: element.FECHA_FIN !== null ? new Date(element.FECHA_FIN) : new Date(),
              allDay: element.TODO_DIA !== null ? element.TODO_DIA : false,
              TODO_DIA: element.TODO_DIA !== null ? element.TODO_DIA : false,
              PRIORIDAD: element.PRIORIDAD !== null ? element.PRIORIDAD : '',
              USUARIO: element.USUARIO !== null ? element.USUARIO : this.USUARIO_LOCAL,
              RESPONSABLE: element.RESPONSABLE ? element.RESPONSABLE : this.USUARIO_LOCAL,
              COLABORADORES: element.COLABORADORES !== null ? element.COLABORADORES : [],
              CLASE: 'EVENTOS',
              TIPO: element.TIPO !== null ? element.TIPO : '',
              ANULADO: element.ANULADO !== null ? element.ANULADO : false,
              REPETIR: DATA_PROGRAMACION !== ''
                ? DATA_PROGRAMACION.REPETIR : false,
              type: 'EVENTOS',
              recurrenceRule:
                DATA_PROGRAMACION !== ''
                  ? DATA_PROGRAMACION.RECURRENCERULE
                  : '',
            };
            if (element.CLASE !== 'NODOS') {
              this.DEventosCalendario.push(item);
            }
          });
          // this.calendarioGespro.instance._refresh();
        } else {
          this.DEventosCalendario = [];
        }
        break;

      case 'update data config':
        // this.JsonDataSource[data.parametro] = data.dataSource;
        break;

      default:
        break;
    }
  }

  onSelectCalendario(e: any) { }

  onAppointmentAdded(e: any) {
    let item = this.setValueJSON(e, 'new');
    if (item.NOMBRE === '') {
      showToast(
        'Evento no registrado debes degitar el asunto del evento',
        'warning'
      );
      return;
    } else {
      this.calendarioGespro.instance._refresh();
      this.saveActividadesCalendario('new', item);
      showToast('Agregado el Evento: ' + e.appointmentData.text, 'success');
      this._GES00.setObsActividades({ accion: 'r_refrescar' });
    }
  }

  onAppointmentUpdated(e: any) {
    let item = this.setValueJSON(e, 'update');
    if (item.NOMBRE === '') {
      showToast(
        'Evento no actualizado debes degitar el asunto del evento',
        'warning'
      );
      return;
    } else {
      this.calendarioGespro.instance._refresh();
      this.saveActividadesCalendario('update', item);
      showToast('Actualizado el Evento: ' + e.appointmentData.text, 'success');
      this._GES00.setObsActividades({ accion: 'r_refrescar' });
    }
  }

  setValueJSON(e, accion) {
    let recurrenceData;
    let item;
    if (e.appointmentData.recurrenceRule) {
      recurrenceData = this.getRecurrenceData(e);
    }

    if (recurrenceData !== undefined && accion === 'update') {
      item = {
        NOMBRE: e.appointmentData.text,
        DESCRIPCION: e.appointmentData.description,
        FECHA_INICIO: new Date(e.appointmentData.startDate),
        FECHA_FIN: new Date(e.appointmentData.endDate),
        TODO_DIA: e.appointmentData.allDay,
        ID_ACTIVIDAD: e.appointmentData.ID_ACTIVIDAD,
        ID_ACTIVIDAD_PADRE: e.appointmentData.ID_ACTIVIDAD_PADRE,
        PRIORIDAD: e.appointmentData.PRIORIDAD,
        ETIQUETAS: e.appointmentData.ETIQUETAS,
        MEDICION: e.appointmentData.MEDICION,
        ESTADO: e.appointmentData.ESTADO,
        USUARIO: e.appointmentData.USUARIO,
        CLASE: 'EVENTOS',
        TIPO: e.appointmentData.TIPO,
        COLABORADORES: e.appointmentData.COLABORADORES,
        ANULADO: e.appointmentData.ANULADO,
        REPETIR: e.appointmentData.recurrenceRule === '' ? false : true,
        DATA_PROGRAMACION: {
          TODO_DIA: e.appointmentData.allDay,
          REPETIR: e.appointmentData.recurrenceRule === '' ? false : true,
          INTERVALO_FRECUENCIA:
            recurrenceData.INTERVALO_FRECUENCIA !== undefined
              ? recurrenceData.INTERVALO_FRECUENCIA
              : 0,
          PERIODO_FRECUENCIA_MES:
            recurrenceData.PERIODO_FRECUENCIA_MES !== undefined
              ? recurrenceData.PERIODO_FRECUENCIA_MES
              : 0,
          PERIODO_FRECUENCIA_DIA:
            recurrenceData.PERIODO_FRECUENCIA_DIA !== undefined
              ? recurrenceData.PERIODO_FRECUENCIA_DIA
              : 0,
          FRECUENCIA:
            recurrenceData.FRECUENCIA !== undefined
              ? recurrenceData.FRECUENCIA
              : 0,
          FIN_FRECUENCIA:
            recurrenceData.FIN_FRECUENCIA !== undefined
              ? recurrenceData.FIN_FRECUENCIA
              : 0,
          TIPO_FIN_FRECUENCIA:
            recurrenceData.TIPO_FIN_FRECUENCIA !== undefined
              ? recurrenceData.TIPO_FIN_FRECUENCIA
              : 0,
          PROGRAMACION: e.appointmentData.PROGRAMACION,
          FECHA_INICIO: e.appointmentData.startDate,
          FECHA_FIN: e.appointmentData.endDate,
          RECURRENCERULE: e.appointmentData.recurrenceRule,
          RECURRENCERULEGC: recurrenceData,
          USUARIO: this.USUARIO_LOCAL,
          RESPONSABLE: this.USUARIO_LOCAL,
        },
      };
    } else if (recurrenceData === undefined && accion === 'update') {
      item = {
        NOMBRE: e.appointmentData.text,
        DESCRIPCION: e.appointmentData.description,
        FECHA_INICIO: new Date(e.appointmentData.startDate),
        FECHA_FIN: new Date(e.appointmentData.endDate),
        TODO_DIA: e.appointmentData.allDay,
        ID_ACTIVIDAD: e.appointmentData.ID_ACTIVIDAD,
        ID_ACTIVIDAD_PADRE: e.appointmentData.ID_ACTIVIDAD_PADRE,
        PRIORIDAD: e.appointmentData.PRIORIDAD,
        ETIQUETAS: e.appointmentData.ETIQUETAS,
        MEDICION: e.appointmentData.MEDICION,
        ESTADO: e.appointmentData.ESTADO,
        CLASE: 'EVENTOS',
        TIPO: e.appointmentData.TIPO,
        COLABORADORES: e.appointmentData.COLABORADORES,
        ANULADO: e.appointmentData.ANULADO,
        REPETIR: false,
        USUARIO: this.USUARIO_LOCAL,
        RESPONSABLE: this.USUARIO_LOCAL,
      };
    } else if (recurrenceData !== undefined && accion === 'new') {
      item = {
        NOMBRE: e.appointmentData.text,
        DESCRIPCION: e.appointmentData.description,
        FECHA_INICIO: new Date(e.appointmentData.startDate),
        FECHA_FIN: new Date(e.appointmentData.endDate),
        TODO_DIA: e.appointmentData.allDay,
        ID_ACTIVIDAD: 1000,
        ID_ACTIVIDAD_PADRE: '-30',
        PRIORIDAD: '',
        ETIQUETAS: '',
        MEDICION: 0,
        ESTADO: 'SIN INICIAR',
        USUARIO: this.USUARIO_LOCAL,
        RESPONSABLE: this.USUARIO_LOCAL,
        CLASE: 'EVENTOS',
        TIPO: '',
        COLABORADORES: e.appointmentData.COLABORADORES,

        ELIMINADO: 0,
        ANULADO: 0,
        REPETIR: e.appointmentData.recurrenceRule === '' ? false : true,
        DATA_PROGRAMACION: {
          TODO_DIA: e.appointmentData.allDay,
          REPETIR: e.appointmentData.recurrenceRule === '' ? false : true,
          INTERVALO_FRECUENCIA:
            recurrenceData.INTERVALO_FRECUENCIA !== undefined
              ? recurrenceData.INTERVALO_FRECUENCIA
              : 0,
          PERIODO_FRECUENCIA_MES:
            recurrenceData.PERIODO_FRECUENCIA_MES !== undefined
              ? recurrenceData.PERIODO_FRECUENCIA_MES
              : 0,
          PERIODO_FRECUENCIA_DIA:
            recurrenceData.PERIODO_FRECUENCIA_DIA !== undefined
              ? recurrenceData.PERIODO_FRECUENCIA_DIA
              : 0,
          FRECUENCIA:
            recurrenceData.FRECUENCIA !== undefined
              ? recurrenceData.FRECUENCIA
              : 0,
          FIN_FRECUENCIA:
            recurrenceData.FIN_FRECUENCIA !== undefined
              ? recurrenceData.FIN_FRECUENCIA
              : 0,
          TIPO_FIN_FRECUENCIA:
            recurrenceData.TIPO_FIN_FRECUENCIA !== undefined
              ? recurrenceData.TIPO_FIN_FRECUENCIA
              : 0,
          FECHA_INICIAL: e.appointmentData.startDate,
          FECHA_FINAL: e.appointmentData.endDate,
          RECURRENCERULE: e.appointmentData.recurrenceRule,
          RECURRENCERULEGC: recurrenceData,
        },
      };
    } else if (recurrenceData === undefined && accion === 'new') {
      item = {
        NOMBRE: e.appointmentData.text,
        DESCRIPCION: e.appointmentData.description,
        FECHA_INICIO: new Date(e.appointmentData.startDate),
        FECHA_FIN: new Date(e.appointmentData.endDate),
        TODO_DIA: e.appointmentData.allDay,
        ID_ACTIVIDAD: 1000,
        ID_ACTIVIDAD_PADRE: '-30',
        PRIORIDAD: '',
        ETIQUETAS: '',
        MEDICION: 0,
        ESTADO: 'SIN INICIAR',
        USUARIO: this.USUARIO_LOCAL,
        RESPONSABLE: this.USUARIO_LOCAL,
        CLASE: 'EVENTOS',
        TIPO: '',
        COLABORADORES: e.appointmentData.COLABORADORES,
        ELIMINADO: 0,
        ANULADO: 0,
        REPETIR: false,
      };
    }
    return item;
  }

  onAppointmentDeleted(e: any) {
    const item = {
      ID_ACTIVIDAD: e.appointmentData.ID_ACTIVIDAD,
      CLASE: 'EVENTOS',
    };
    this.deleteActividadCalendario(item);
    showToast('Eliminado el Evento: ' + e.appointmentData.text, 'success');
    this._GES00.setObsActividades({ accion: 'r_refrescar' });
  }

  onAppointmentDblClick(e: any) {
    e;
  }
  onAppointmentFormOpening(e: any) {
    if (e.appointmentData.RESPONSABLE !== undefined && e.appointmentData.RESPONSABLE !== null) {
      if (e.appointmentData.RESPONSABLE !== this.USUARIO_LOCAL && e.appointmentData.USUARIO !== this.USUARIO_LOCAL) {
        e;
        showToast(
          'No puede modificar esta Tarea si no eres el responsable o quien la asigno.',
          'warning'
        );
        return this.readOnly = false;
      } else {
        e;
        return this.readOnly = true;
      }
    } else {
      e;
      return this.readOnly = true;
    }
  }

  onValueChangedCalendario(e: any) {
    this.DEventosCalendario = [];
    var item: any;
    if (e.value.length > 0) {
      e.value.forEach((nodo: any) => {
        this.DTareas_prev.filter(
          (d: any) => d.ID_ACTIVIDAD_PADRE === nodo
        ).forEach((element: any) => {
          let DATA_PROGRAMACION;
          if (element.DATA_PROGRAMACION != null) {
            DATA_PROGRAMACION = JSON.parse(element.DATA_PROGRAMACION);
          } else {
            DATA_PROGRAMACION = '';
          }
          const item: any = {
            id: element.ID_ACTIVIDAD,
            text: element.NOMBRE,
            NOMBRE: element.NOMBRE,
            description: element.DESCRIPCION,
            startDate: new Date(element.FECHA_INICIO),
            endDate: new Date(element.FECHA_FIN),
            allDay: element.TODO_DIA,
            ID_ACTIVIDAD: element.ID_ACTIVIDAD,
            ID_ACTIVIDAD_PADRE: element.ID_ACTIVIDAD_PADRE,
            PRIORIDAD: element.PRIORIDAD,
            ETIQUETAS: element.ETIQUETAS,
            MEDICION: element.MEDICION,
            ESTADO: element.ESTADO,
            USUARIO: element.USUARIO,
            CLASE: 'EVENTOS',
            TIPO: element.TIPO,
            ANULADO: element.ANULADO,
            REPETIR: element.REPETIR,
            INTERVALO_FRECUENCIA: element.INTERVALO_FRECUENCIA,
            PERIODO_FRECUENCIA_DIA: element.PERIODO_FRECUENCIA_DIA,
            PERIODO_FRECUENCIA_MES: element.PERIODO_FRECUENCIA_MES,
            FRECUENCIA: element.FRECUENCIA,
            type: 'EVENTOS',
            recurrenceRule:
              DATA_PROGRAMACION !== '' ? DATA_PROGRAMACION.RECURRENCERULE : '',
          };
          if (element.CLASE !== 'NODOS') {
            this.DEventosCalendario.push(item);
          }
        });
      });
      this.calendarioGespro.instance._refresh();
    } else {
      this.DEventosCalendario = this.DTareas_prev;
      this.calendarioGespro.instance._refresh();
    }
  }

  // private getData(requestOptions: Record<string, any>) {
  //   const CALENDAR_ID =
  //     //  'desarrollador@xtein.com';
  //     'c_f6e492926a766161480aecd82c40796d05d3ad8ed0451a7ad86c6a6981aabcdf@group.calendar.google.com';
  //   const accessToken = localStorage.getItem('nextSyncToken'); // Token de acceso obtenido con OAuth
  //   const dataUrl = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`;

  //   requestOptions = {
  //     headers: {
  //       Authorization: `Bearer ${accessToken}`,
  //     },
  //   };

  //   return lastValueFrom(this.http.get(dataUrl, requestOptions)).then(
  //     ({ items }: Record<string, any>) => {
  //       console.log(items);
  //     }
  //   );
  // }

  // getData(requestOptions: Record<string, unknown>) {
  //   const PUBLIC_KEY = 'AIzaSyAHlH7ZjFxCc6RDGfsl2wjaQFuIhXvzvQ8';
  //   const CALENDAR_ID =
  //     //  'desarrollador@xtein.com';
  //     'c_f6e492926a766161480aecd82c40796d05d3ad8ed0451a7ad86c6a6981aabcdf@group.calendar.google.com';
  //   const URL = 'https://www.googleapis.com/calendar/v3/calendars/';
  //   const dataUrl = [URL, CALENDAR_ID, '/events?key=', PUBLIC_KEY].join('');
  //   this._sdatos.getEvents(dataUrl, requestOptions).subscribe((data: any) => {
  //     console.log(data);

  //     //   localStorage.setItem('nextSyncToken', data.nextSyncToken);
  //     //   const nextSyncToken = localStorage.getItem('nextSyncToken');
  //     //   const datos = this._sdatos.getEventById(CALENDAR_ID);
  //     //   console.log(datos);
  //     // for (let i = 0; i < data.items.length; i++) {
  //     //   const element = data.items[i];
  //     //   this._sdatos.getEventById(element.htmlLink).subscribe({
  //     //     next: (event) => {
  //     //       console.log('Evento encontrado:', event);
  //     //     },
  //     //     error: (error) => {
  //     //       console.error('Error al obtener el evento:', error.message);
  //     //     },
  //     //   });
  //     // element.startDate = element.start.dateTime
  //     //   ? element.start.dateTime
  //     //   : element.start.date;
  //     // element.endDate = element.end.dateTime
  //     //   ? element.end.dateTime
  //     //   : element.end.date;
  //     // this.DEventosCalendario.push(element);
  //     // this.DEventosCalendarioGoogle.push(element);
  //     // }
  //     // console.log(this.DEventosCalendario);
  //     // console.log(this.DEventosCalendarioGoogle);
  //   });
  // }

  saveActividadesCalendario(ACCION: string, data: any) {
    if (ACCION === 'new') {
      const eventDetails = {
        email: localStorage.getItem('email'),
        nameEvent: data.NOMBRE,
        descripcion: data.DESCRIPCION,
        startDate: data.FECHA_INICIO,
        recurrenceRule: data.RECURRENCERULEGC,
        endDate: data.FECHA_FIN,
        allDay: data.TODO_DIA,
        COLABORADORES: data.COLABORADORES
      };
      // this.googleService.addEventToGoogleCalendar(eventDetails);
      createGoogleEvent(eventDetails, this.colaboradoresData);
    }
    const prmDatosGuardar = JSON.parse(
      JSON.stringify({
        USUARIO: this.USUARIO_LOCAL,
        ACTIVIDAD: data,
        ACCION,
      })
    );

    // API guardado de datos
    this._sdatos
      .saveActividadesCalendario('save actividad calendario', prmDatosGuardar)
      .subscribe((resp) => {
        const res = JSON.parse(resp.data);
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        } else {
          showToast('Registro Actualizado con exito', 'success');
        }
      });

    this.calendarioGespro.instance._refresh();
  }

  deleteActividadCalendario(data: any) {
    const prmDatosGuardar = JSON.parse(
      JSON.stringify({
        USUARIO: this.USUARIO_LOCAL,
        ACTIVIDAD: data,
      })
    );

    // API guardado de datos
    this._sdatos
      .deleteActividadesCalendario(
        'delete actividad calendario',
        prmDatosGuardar
      )
      .subscribe((resp) => {
        const res = JSON.parse(resp.data);
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        } else {
          showToast('Registro Actualizado con exito', 'success');
        }
      });

    this.calendarioGespro.instance._refresh();
  }

  valoresObjetos(obj: string) {
    this.DEventosCalendario = [];
    if (obj === 'responsables' || obj === 'todos') {
      this.loadingVisible = true;
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
              element.text = element.NOMBRE;
              element.id = element.USUARIO;
              element.COLABORADORES = element.ID_RESPONSABLE;
            }
            this.colaboradoresData = res;
          }
        },
        (err: any) => {
          showToast(err.mensaje, 'Error');
        }
      );
    }
  }

  parseRecurrenceRule(recurrenceRule) {
    if (!recurrenceRule) {
      return null; // Retorna null si no hay regla de recurrencia
    }

    const partes = recurrenceRule.split(';');
    const resultado = {};

    for (let i = 0; i < partes.length; i++) {
      const element = partes[i];
      const keys = element.split('='); // Cambia `splice` por `split`

      if (keys.length === 2) {
        resultado[keys[0]] = keys[1]; // Asigna la clave y el valor
      }
    }

    return resultado; // Retorna el objeto con los datos analizados
  }

  getRecurrenceData(e) {
    // 'CADA CUANTO': INTERVALO_FRECUENCIA = INTERVAL ○○○
    // 'FINALIZA DESPUES DE': FIN_FRECUENCIA = COUNT  || 'FINALIZA EN': FIN_FRECUENCIA = UNTIL|| 'NUNCA': FIN_FRECUENCIA = ''
    // 'REPETIR': FRECUENCIA = FREQ ("HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY")
    // 'REPETIR EN': PERIODO_FRECUENCIA_DIA = BYDAY ("SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA") || PERIODO_FRECUENCIA_DIA = BYMONTHDAY 10
    // 'REPETIR EN': PERIODO_FRECUENCIA_MES = BYMONTH 16

    let recurrenceInfo;
    let FRECUENCIA;
    let INTERVALO_FRECUENCIA;
    let PERIODO_FRECUENCIA_MES;
    let PERIODO_FRECUENCIA_DIA;
    let FIN_FRECUENCIA;
    let TIPO_FIN_FRECUENCIA;

    // Verifica si existe la regla de recurrencia
    if (e.appointmentData.recurrenceRule) {
      recurrenceInfo = this.parseRecurrenceRule(
        e.appointmentData.recurrenceRule
      );
    }

    // Asignación de variables
    if (recurrenceInfo !== undefined || recurrenceInfo !== null) {
      FRECUENCIA =
        recurrenceInfo.FREQ !== ''
          ? recurrenceInfo.FREQ
          : e.appointmentData.FRECUENCIA;
      if (recurrenceInfo.INTERVAL === undefined) {
        INTERVALO_FRECUENCIA = 1;
      } else {
        INTERVALO_FRECUENCIA =
          recurrenceInfo.INTERVAL !== '' ? recurrenceInfo.INTERVAL : 1;
      }
      PERIODO_FRECUENCIA_MES = recurrenceInfo.BYMONTH;
      PERIODO_FRECUENCIA_DIA =
        recurrenceInfo.BYDAY || recurrenceInfo.BYMONTHDAY
          ? recurrenceInfo.BYDAY || recurrenceInfo.BYMONTHDAY
          : e.appointmentData.PERIODO_FRECUENCIA;
      FIN_FRECUENCIA = recurrenceInfo.COUNT
        ? recurrenceInfo.COUNT
        : recurrenceInfo.UNTIL
          ? recurrenceInfo.UNTIL
          : 'nunca';
      TIPO_FIN_FRECUENCIA = recurrenceInfo.COUNT
        ? 'COUNT'
        : recurrenceInfo.UNTIL
          ? 'UNTIL'
          : 'NUNCA';

      // Retorna un objeto con la información de recurrencia
    }
    return {
      FRECUENCIA,
      INTERVALO_FRECUENCIA,
      PERIODO_FRECUENCIA_DIA,
      PERIODO_FRECUENCIA_MES,
      FIN_FRECUENCIA,
      TIPO_FIN_FRECUENCIA,
    };
  }
}
