import {
  DxButtonGroupModule,
  DxButtonModule,
  DxDateBoxModule,
  DxFormModule,
  DxNumberBoxModule,
  DxPopupComponent,
  DxPopupModule,
  DxRadioGroupModule,
  DxSelectBoxModule,
  DxSwitchModule,
  DxTextAreaModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { GeneralesService } from 'src/app/services/generales/generales.service';

@Component({
    selector: 'app-fechaplan',
    templateUrl: './fechaplan.component.html',
    styleUrls: ['./fechaplan.component.css'],
    imports: [
    DxFormModule,
    DxSelectBoxModule,
    DxNumberBoxModule,
    DxRadioGroupModule,
    DxButtonGroupModule,
    DxDateBoxModule,
    DxSwitchModule,
    DxPopupModule,
    DxButtonModule,
    DxTextAreaModule,
    DxTextBoxModule
],
    providers: [DatePipe]
})
export class FechaplanComponent implements OnInit, OnDestroy {
  @ViewChild('popUpFechaEvento', { static: false })
  popUpFechaEvento: DxPopupComponent;

  DFechaPlan: any;
  private yaInicializado = false;

  text_intervalo: string;
  fechaFinFrec: Date = new Date();
  count_fin_frecuencia: number = 1;
  DDiaSemana: any[];
  ItemsFrecuencia: object[] = [
    { FRECUENCIA: 'HOURLY', textFRECUENCIA: 'Cada Hora' },
    { FRECUENCIA: 'DAILY', textFRECUENCIA: 'Diario' },
    { FRECUENCIA: 'WEEKLY', textFRECUENCIA: 'Semanal' },
    { FRECUENCIA: 'MONTHLY', textFRECUENCIA: 'Mensual' },
    { FRECUENCIA: 'YEARLY', textFRECUENCIA: 'Anual' },
  ];
  ItemsSeguimiento: object[] = [
    { TIPO_RECORDATORIO: 'MINUTO', textTIPO_RECORDATORIO: 'Minuto(s)' },
    { TIPO_RECORDATORIO: 'HORA', textTIPO_RECORDATORIO: 'Hora(s)' },
    { TIPO_RECORDATORIO: 'DIA', textTIPO_RECORDATORIO: 'Dia(s)' },
    // { TIPO_RECORDATORIO: 'SEMANA', textTIPO_RECORDATORIO: 'Semana(s)' },
  ];
  DMeses: any[] = [
    'Enero',
    'Febero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Dicembre',
  ];
  DListaFinRepeticion: any[] = [
    { id: 'NUNCA', text: 'Nunca' },
    { id: 'UNTIL', text: 'El' },
    { id: 'COUNT', text: 'Despues de' },
  ];
  popupVisible: boolean = false;
  visibleRepetir: boolean = false;
  visibleAllDay: boolean = false;
  visibleRecordatorio: boolean = true;
  colsForma: number = 1;
  selectedDiasSemana: string[] = [];
  titRepetirFrec: string = '';
  tit1RepetirFrec: string = '';
  titRepetirDia: string = '';
  minRepetirFrec: number = 1;
  maxRepetirFrec: number = 1;
  maxDiaMes: number = 1;
  maxCountValue: number = 1;
  countColRecord: number = 3;
  data: any;
  CLASE: string;

  @Input() events: Observable<any>;
  @Input() readOnly: any;

  @Output() datosEntradaChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() onRespuestaProg: EventEmitter<any> = new EventEmitter<any>();

  private eventsSubscription: Subscription;
  rangeStart: string | number | Date | any;
  rangeEnd: string | number | Date | any;

  constructor(
    private datepipe: DatePipe,
    public generalesService: GeneralesService,
  ) {
    this.onRepetir = this.onRepetir.bind(this);
    this.disableDates = this.disableDates.bind(this);
  }

  ngOnInit(): void {
    this.DDiaSemana = [
      { id: 'SU', text: 'DOM' },
      { id: 'MO', text: 'LUN' },
      { id: 'TU', text: 'MAR' },
      { id: 'WE', text: 'MIE' },
      { id: 'TH', text: 'JUE' },
      { id: 'FR', text: 'VIE' },
      { id: 'SA', text: 'SÁB' },
    ];

    this.iniForma();

    this.eventsSubscription = this.events.subscribe((res: any) => {
      this.data = res;
      this.rangeStart = this.data?.rangoFecha?.FECHA_INICIO ? new Date(this.data.rangoFecha.FECHA_INICIO) : null;
      this.rangeEnd = this.data?.rangoFecha?.FECHA_FIN ? new Date(this.data.rangoFecha.FECHA_FIN) : null;
      if (res.cellData) {
        switch (res.accion) {
          case 'modificar':
            this.CLASE = res.cellData.CLASE
            let DATA_PROGRAMACION;
            let DATA_RECORDATORIO;
            //SETEO DE LA PROGRAMACIÓN
            if (
              res.cellData.DATA_PROGRAMACION !== undefined &&
              res.cellData.DATA_PROGRAMACION !== null &&
              res.cellData.DATA_PROGRAMACION !== 'null'
            ) {
              DATA_PROGRAMACION =
                typeof res.cellData.DATA_PROGRAMACION === 'string' ? JSON.parse(res.cellData.DATA_PROGRAMACION) : res.cellData.DATA_PROGRAMACION;
              this.DFechaPlan = {
                NOMBRE: res.cellData.NOMBRE.length <= 30 ? res.cellData.NOMBRE : 'Nueva tarea o actividad',
                ID_ACTIVIDAD: res.cellData.ID_ACTIVIDAD,
                FECHA_INICIO: res.allDay
                  ? this.datepipe.transform(res.startDate, 'MM/dd/yyyy')
                  : this.datepipe.transform(res.startDate, 'MM/dd/yyyy HH:mm:ss'),
                FECHA_FIN: res.allDay
                  ? this.datepipe.transform(res.endDate, 'MM/dd/yyyy')
                  : this.datepipe.transform(res.endDate, 'MM/dd/yyyy HH:mm:ss'),
                TODO_DIA: res.cellData.TODO_DIA ? res.cellData.TODO_DIA : false,
                REPETIR: DATA_PROGRAMACION.REPETIR ? DATA_PROGRAMACION.REPETIR : false,
                FRECUENCIA: DATA_PROGRAMACION.FRECUENCIA === '' ? 'HOURLY' : DATA_PROGRAMACION.FRECUENCIA,
                INTERVALO_FRECUENCIA: DATA_PROGRAMACION.INTERVALO_FRECUENCIA === 0 ? 1 : DATA_PROGRAMACION.INTERVALO_FRECUENCIA,
                TIPO_FIN_FRECUENCIA: DATA_PROGRAMACION.TIPO_FIN_FRECUENCIA ? DATA_PROGRAMACION.TIPO_FIN_FRECUENCIA : 'NUNCA',
                PERIODO_FRECUENCIA_DIA: DATA_PROGRAMACION.PERIODO_FRECUENCIA_DIA ? DATA_PROGRAMACION.PERIODO_FRECUENCIA_DIA.split(',') : parseInt(DATA_PROGRAMACION.PERIODO_FRECUENCIA_DIA),
                PERIODO_FRECUENCIA_MES: DATA_PROGRAMACION.PERIODO_FRECUENCIA_MES ? DATA_PROGRAMACION.PERIODO_FRECUENCIA_MES : 'Ene',
                RECORDATORIO: res.cellData.RECORDATORIO ? res.cellData.RECORDATORIO : false,
              };
              this.selectedDiasSemana = this.DFechaPlan.PERIODO_FRECUENCIA_DIA;

              //SETEO DE LA FRECUENCIA
              if (DATA_PROGRAMACION.TIPO_FIN_FRECUENCIA === 'UNTIL') {
                this.DFechaPlan.FIN_FRECUENCIA = this.datepipe.transform(
                  DATA_PROGRAMACION.FIN_FRECUENCIA ? DATA_PROGRAMACION.FIN_FRECUENCIA : new Date(),
                  'MM/dd/yyyy'
                );
                this.fechaFinFrec = this.DFechaPlan.FIN_FRECUENCIA;
                let data: any = { value: this.fechaFinFrec };
                this.onChangeFechaFinFrec(
                  this.DFechaPlan.TIPO_FIN_FRECUENCIA,
                  data
                );
              } else if (DATA_PROGRAMACION.TIPO_FIN_FRECUENCIA === 'COUNT') {
                this.DFechaPlan.FIN_FRECUENCIA =
                  DATA_PROGRAMACION.FIN_FRECUENCIA ? DATA_PROGRAMACION.FIN_FRECUENCIA : 1;
                this.count_fin_frecuencia = this.DFechaPlan.FIN_FRECUENCIA;
                let data: any = { value: this.count_fin_frecuencia };
                this.onChangeFechaFinFrec(
                  this.DFechaPlan.TIPO_FIN_FRECUENCIA,
                  data
                );
              } else if (this.DFechaPlan.TIPO_FIN_FRECUENCIA === 'NUNCA') {
                this.fechaFinFrec = new Date();
                this.count_fin_frecuencia = 1;
              }
            } else {
              this.DFechaPlan = {
                NOMBRE:
                  res.cellData.NOMBRE.length <= 30
                    ? res.cellData.NOMBRE
                    : 'Nueva tarea o actividad',
                ID_ACTIVIDAD: res.cellData.ID_ACTIVIDAD,
                FECHA_INICIO: res.startDate !== null ? new Date(res.startDate) : new Date(),
                FECHA_FIN: res.endDate !== null ? new Date(res.endDate) : new Date(),
                TODO_DIA: res.cellData.TODO_DIA ? res.cellData.TODO_DIA : false,
                REPETIR: res.cellData.REPETIR ? res.cellData.REPETIR : false,
                FRECUENCIA: 'HOURLY',
                INTERVALO_FRECUENCIA: 1,
                PERIODO_FRECUENCIA_DIA: 1,
                PERIODO_FRECUENCIA_MES: 'Ene',
                RECORDATORIO: res.cellData.RECORDATORIO
                  ? res.cellData.RECORDATORIO
                  : false,
              };
            }

            // FIN SETEO PROGRAMACIÓN
            //SETEO DEL RECORDATORIO
            if (this.DFechaPlan.RECORDATORIO) {
              if (
                res.cellData.DATA_RECORDATORIO !== undefined &&
                res.cellData.DATA_RECORDATORIO !== null &&
                res.cellData.DATA_RECORDATORIO !== 'null'
              ) {
                DATA_RECORDATORIO = typeof res.cellData.DATA_RECORDATORIO === 'string'
                  ? JSON.parse(res.cellData.DATA_RECORDATORIO)
                  : res.cellData.DATA_RECORDATORIO;

              }
              this.setDataRecordar(DATA_RECORDATORIO);
            } else {
              this.DFechaPlan.TIPO_RECORDATORIO = false;
              this.DFechaPlan.INTERVALO_REC = 0;
              this.DFechaPlan.INTERVALO_REC_FECHA = null;
            }

            // FIN SETEO RECORDATORIO
            if (this.DFechaPlan.TODO_DIA) {
              this.countColRecord = 2;
              this.visibleRecordatorio = false;
              this.ItemsSeguimiento = [
                {
                  TIPO_RECORDATORIO: 'TODO_DIA_R',
                  textTIPO_RECORDATORIO: 'Todos los dias',
                },
              ];
            } else {
              this.countColRecord = 3;
              this.visibleRecordatorio = true;
              this.ItemsSeguimiento = [
                {
                  TIPO_RECORDATORIO: 'MINUTO',
                  textTIPO_RECORDATORIO: 'Minuto(s)',
                },
                { TIPO_RECORDATORIO: 'HORA', textTIPO_RECORDATORIO: 'Hora(s)' },
                { TIPO_RECORDATORIO: 'DIA', textTIPO_RECORDATORIO: 'Dia(s)' },
                // { TIPO_RECORDATORIO: 'SEMANA', textTIPO_RECORDATORIO: 'Semana(s)'},
              ];
            }
            this.popupVisible = true;
            this.visibleAllDay = this.DFechaPlan.TODO_DIA;
            this.visibleRepetir = this.DFechaPlan.REPETIR;
            break;

          default:
            break;
        }
      }
    });
  }

  ngOnDestroy() {
    this.iniForma();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      let popupWidth = Number(this.popUpFechaEvento.instance.option('width'));
      this.popUpFechaEvento.instance.option('width', popupWidth / 2);
    }, 300);
  }

  disableDates(args: any) {
    const startDate = new Date(this.datepipe.transform(this.rangeStart, 'MM/dd/yyyy')!);
    const endDate = new Date(this.datepipe.transform(this.rangeEnd, 'MM/dd/yyyy')!);
    const selectedDate = new Date(this.datepipe.transform(args.date, 'MM/dd/yyyy')!);
    if (!this.rangeStart || !this.rangeEnd) {
      return false;
    }
    return selectedDate < startDate || selectedDate > endDate;
  }


  selectDia(e) {
    this.DFechaPlan.PERIODO_FRECUENCIA_DIA = this.selectedDiasSemana;
  }
  changePeriodoFrecu(e) {
    this.DFechaPlan.PERIODO_FRECUENCIA_MES = e.value;
  }
  changePeriodoFrecuDia(e) {
    this.DFechaPlan.PERIODO_FRECUENCIA_DIA = e.value;
  }
  onRepetir(e) {
    this.visibleRepetir = e.value;
    this.DFechaPlan.REPETIR = e.value;
  }
  onRecordar(e) {
    this.DFechaPlan.RECORDATORIO = e.value;
  }

  onTodoDia(e) {
    this.ItemsSeguimiento = [];
    this.visibleAllDay = e.value;
    this.DFechaPlan.TODO_DIA = e.value;
    this.DFechaPlan.FECHA_FIN = this.datepipe.transform(
      this.DFechaPlan.FECHA_FIN,
      'MM/dd/yyyy'
    );
    this.DFechaPlan.FECHA_INICIO = this.datepipe.transform(
      this.DFechaPlan.FECHA_INICIO,
      'MM/dd/yyyy'
    );
    if (e.value) {
      this.countColRecord = 2;
      this.visibleRecordatorio = false;
      this.ItemsSeguimiento = [
        {
          TIPO_RECORDATORIO: 'TODO_DIA_R',
          textTIPO_RECORDATORIO: 'Todos los dias',
        },
      ];
    } else {
      this.countColRecord = 3;
      this.visibleRecordatorio = true;
      this.ItemsSeguimiento = [
        { TIPO_RECORDATORIO: 'MINUTO', textTIPO_RECORDATORIO: 'Minuto(s)' },
        { TIPO_RECORDATORIO: 'HORA', textTIPO_RECORDATORIO: 'Hora(s)' },
        { TIPO_RECORDATORIO: 'DIA', textTIPO_RECORDATORIO: 'Dia(s)' },
        // { TIPO_RECORDATORIO: 'SEMANA', textTIPO_RECORDATORIO: 'Semana(s)' },
      ];
    }
  }

  onChangeFechaDesde(e) {
    let compInicial;
    let compFinal;
    if (!this.visibleAllDay) {
      this.DFechaPlan.FECHA_INICIO = this.datepipe.transform(
        e.value,
        'MM/dd/yyyy HH:mm:ss'
      );
      compInicial = this.generalesService.getFechaComponents(this.DFechaPlan.FECHA_INICIO);
      compFinal = this.generalesService.getFechaComponents(this.DFechaPlan.FECHA_FIN);
      if (compInicial.ano >= compFinal.ano) {
        if (compInicial.mes > compFinal.mes) {
          if (compInicial.dia > compFinal.dia) {
            this.DFechaPlan.FECHA_FIN = this.datepipe.transform(
              e.value,
              'MM/dd/yyyy HH:mm:ss'
            );
          }
        }
      }
      return;
    }
    this.DFechaPlan.FECHA_INICIO = this.datepipe.transform(
      e.value,
      'MM/dd/yyyy'
    );
    compInicial = this.generalesService.getFechaComponents(this.DFechaPlan.FECHA_INICIO);
    compFinal = this.generalesService.getFechaComponents(this.DFechaPlan.FECHA_FIN);
    if (compInicial.ano >= compFinal.ano) {
      if (compInicial.mes >= compFinal.mes) {
        if (compInicial.dia > compFinal.dia) {
          this.DFechaPlan.FECHA_FIN = this.datepipe.transform(
            e.value,
            'MM/dd/yyyy'
          );
        }
      }
    }
  }
  onChangeFechaHasta(e) {
    if (!this.visibleAllDay) {
      this.DFechaPlan.FECHA_FIN = this.datepipe.transform(
        e.value,
        'MM/dd/yyyy HH:mm:ss'
      );
      return;
    }
    this.DFechaPlan.FECHA_FIN = this.datepipe.transform(e.value, 'MM/dd/yyyy');
  }
  onChangeFechaFinFrec(accion, e?) {
    if (!this.yaInicializado) {
      this.yaInicializado = true;
      return;
    }
    switch (accion) {
      case 'UNTIL':
        this.DFechaPlan.TIPO_FIN_FRECUENCIA = accion;
        if (e === '') {
          this.DFechaPlan.FIN_FRECUENCIA = this.datepipe.transform(
            this.fechaFinFrec,
            'MM/dd/yyyy'
          );
        } else {
          this.DFechaPlan.FIN_FRECUENCIA = this.datepipe.transform(
            e.value ? e.value : this.fechaFinFrec,
            'MM/dd/yyyy'
          );
        }
        break;
      case 'COUNT':
        this.DFechaPlan.TIPO_FIN_FRECUENCIA = accion;
        if (e === '') {
          this.DFechaPlan.FIN_FRECUENCIA = this.count_fin_frecuencia;
        } else {
          this.DFechaPlan.FIN_FRECUENCIA = e.value
            ? e.value
            : this.count_fin_frecuencia;

        }
        break;
      case 'NUNCA':
        this.DFechaPlan.TIPO_FIN_FRECUENCIA = 'NUNCA';
        this.DFechaPlan.FIN_FRECUENCIA = '';
        break;

      default:
        break;
    }
  }

  clickAccionFecha(accion) {
    if (accion === 'cancelar') {
      this.popupVisible = false;
      this.yaInicializado = false;
      return;
    }
    
    this.onRespuestaProg.emit({ accion, datos: this.DFechaPlan });
    this.popupVisible = false;
    this.yaInicializado = false;
  }

  onValueRepetirModo(e) {
    switch (e.value) {
      case 'HOURLY':
        this.DFechaPlan.FRECUENCIA = e.value;
        this.tit1RepetirFrec = 'Cada';
        this.titRepetirFrec = 'Hora(s)';
        break;
      case 'DAILY':
        this.DFechaPlan.FRECUENCIA = e.value;
        this.tit1RepetirFrec = 'Cada';
        this.titRepetirFrec = 'Día(s)';
        break;
      case 'WEEKLY':
        this.DFechaPlan.FRECUENCIA = e.value;
        this.tit1RepetirFrec = 'Cada';
        this.titRepetirFrec = 'Semana(s)';
        break;
      case 'MONTHLY':
        this.DFechaPlan.FRECUENCIA = e.value;
        this.tit1RepetirFrec = 'Cada Mes(es)';
        this.titRepetirFrec = '';
        this.titRepetirDia = 'El día';
        break;
      case 'YEARLY':
        this.DFechaPlan.FRECUENCIA = e.value;
        this.tit1RepetirFrec = 'Cada';
        this.titRepetirFrec = 'Año(s)';
        break;
      default:
        break;
    }
  }
  onValueRecordar(e) {
    let DATA_RECORDATORIO: any = {};
    switch (e.value) {
      case 'TODO_DIA_R':
        DATA_RECORDATORIO.INTERVALO_REC_FECHA = this.DFechaPlan.INTERVALO_REC_FECHA
          ? this.datepipe.transform(this.DFechaPlan.INTERVALO_REC_FECHA, 'MM/dd/yyyy HH:mm:ss')
          : this.datepipe.transform(new Date(), 'MM/dd/yyyy HH:mm:ss');
        DATA_RECORDATORIO.TIPO_RECORDATORIO = e.value;
        this.visibleRecordatorio = false;
        break;
      case 'MINUTO':
      case 'HORA':
      case 'DIA':
      case 'SEMANA':
      case 'MES':
        DATA_RECORDATORIO.INTERVALO_REC = this.DFechaPlan.INTERVALO_REC
          ? this.DFechaPlan.INTERVALO_REC
          : 1;
        DATA_RECORDATORIO.TIPO_RECORDATORIO = e.value;
        this.visibleRecordatorio = true;
        break;

      default:
        break;
    }
    this.DFechaPlan.TIPO_RECORDATORIO = e.value;
    this.setDataRecordar(DATA_RECORDATORIO);

  }

  setDataRecordar(DATA_RECORDATORIO: any) {
    this.DFechaPlan.TIPO_RECORDATORIO = DATA_RECORDATORIO.TIPO_RECORDATORIO;
    switch (DATA_RECORDATORIO.TIPO_RECORDATORIO) {
      case 'TODO_DIA_R':
        this.DFechaPlan.INTERVALO_REC_FECHA = new Date(
          DATA_RECORDATORIO.INTERVALO_REC_FECHA
        );
        break;
      case 'MINUTO':
        this.text_intervalo = 'Minuto(s)';
        this.DFechaPlan.INTERVALO_REC = DATA_RECORDATORIO.INTERVALO_REC;
        this.maxCountValue = 59;
        break;
      case 'HORA':
        this.text_intervalo = 'Hora(s)';
        this.DFechaPlan.INTERVALO_REC = DATA_RECORDATORIO.INTERVALO_REC;
        this.maxCountValue = 24;
        break;
      case 'DIA':
        this.text_intervalo = 'Dia(s)';
        this.DFechaPlan.INTERVALO_REC = DATA_RECORDATORIO.INTERVALO_REC;
        this.maxCountValue = 7;
        break;
      case 'SEMANA':
        this.text_intervalo = 'Semana(s)';
        this.DFechaPlan.INTERVALO_REC = DATA_RECORDATORIO.INTERVALO_REC;
        this.maxCountValue = 8;
        break;
      case 'MES':
        this.text_intervalo = 'Mes(es)';
        this.DFechaPlan.INTERVALO_REC = DATA_RECORDATORIO.INTERVALO_REC;
        this.maxCountValue = 12;
        break;

      default:
        break;
    }
  }

  setHoraRecordatorioTD(e: any) {
    this.DFechaPlan.INTERVALO_REC_FECHA = this.datepipe.transform(
      e.value,
      'MM/dd/yyyy HH:mm:ss'
    );
  }

  setHoraRecordatorio(e: any) {
    this.DFechaPlan.INTERVALO_REC = e.value === undefined ? 1 : e.value;
  }
  onValueRepetirFrec(e) {
    this.DFechaPlan.INTERVALO_FRECUENCIA = e.value;
  }

  onValueRepetirMes(e) {
    this.DFechaPlan.PERIODO_FRECUENCIA_MES = e.value;
    if (this.DFechaPlan.PERIODO_FRECUENCIA_MES) {
      const ixmes = this.DMeses.indexOf(this.DFechaPlan.PERIODO_FRECUENCIA_MES);
      if (ixmes !== -1) {
        const today = new Date();
        if (today.getMonth() == 12) this.maxDiaMes = 31;
        else {
          let fec = new Date(today.getFullYear(), ixmes + 1, 1);
          fec.setDate(fec.getDate() - 1);
          this.maxDiaMes = fec.getDate();
        }
      }
    }
  }

  iniForma() {
    this.DFechaPlan = {
      FECHA_INICIO: new Date(),
      FECHA_FIN: new Date(),
      TODO_DIA: false,
      REPETIR: false,
      FRECUENCIA: 'HOURLY',
      INTERVALO_FRECUENCIA: 1,
      PERIODO_FRECUENCIA_DIA: 1,
      PERIODO_FRECUENCIA_MES: 'Ene',
      TIPO_FIN_FRECUENCIA: 'NUNCA',
      FIN_FRECUENCIA: 1,
      RECODATORIO: false,
    };
    this.fechaFinFrec = new Date();
    this.count_fin_frecuencia = 1;
    this.countColRecord = 3
    this.visibleRecordatorio = true;
    this.selectedDiasSemana = [];
    this.onValueRepetirModo({ value: 'HOURLY' });
  }
}
