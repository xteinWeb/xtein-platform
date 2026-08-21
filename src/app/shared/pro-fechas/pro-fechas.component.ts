import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DxButtonGroupModule, DxButtonModule, DxDateBoxModule, DxFormModule, DxNumberBoxModule, DxPopupComponent, DxPopupModule, DxRadioGroupModule, DxSelectBoxModule, DxSwitchModule } from 'devextreme-angular';
import { Observable, Subject, Subscription } from 'rxjs';
import { DxCalendarModule } from 'devextreme-angular/ui/calendar';

@Component({
    selector: 'app-pro-fechas',
    templateUrl: './pro-fechas.component.html',
    styleUrls: ['./pro-fechas.component.css'],
    providers: [DatePipe],
    imports: [DxPopupModule, DxFormModule, DxSelectBoxModule, DxNumberBoxModule, DxRadioGroupModule, DxButtonGroupModule, DxDateBoxModule, DxSwitchModule, DxPopupModule, DxButtonModule, DxCalendarModule]
})
export class ProFechasComponent {

  
  @ViewChild("popUpFechaEvento", { static: false }) popUpFechaEvento: DxPopupComponent;
  
  @Input() events: Observable<any>;
  @Output() onRespuestaComponent: EventEmitter<any> = new EventEmitter<any>();

  private eventsSubscription: Subscription;

  DFechaPlan: any;
  infoTarea:any = {};
  fechaHoy: Date = new Date();
  DDiaSemana: any[];
  DMeses: any[] = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  DListaFinRepeticion: any[] = ["Nunca","Hasta","Despues de"];
  valorFinRep: any;
  popupVisible: boolean = false;
  visibleRepetir: boolean = false;
  colsForma: number = 1;
  selectedDiasSemana: string[];
  titRepetirFrec: string = '';
  titRepetirDia: string = '';
  minRepetirFrec: number = 1;
  maxRepetirFrec: number = 1;
  maxDiaMes: number = 1;

  zoomLevels:any [] = ['month', 'year', 'decade', 'century'];

  constructor(
    private datepipe: DatePipe
  ) {
    this.onCangeRepetir = this.onCangeRepetir.bind(this);  
  }
  
  ngOnInit(): void {
    this.DDiaSemana = [{text:"Lu"},{text:"Ma"},{text:"Mi"},{text:"Ju"},{text:"Vi"},{text:"Sa"},{text:"Do"}];
    this.iniForma();
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.accion) {
        // case 'init':
        //   this.loadDataInit(datos.config);
        //   break;
      
        case 'cargar fechas':
          // this.updateData(datos.config);
          this.popupVisible = datos.config.visible;
          this.infoTarea = datos.config.dataSource.data;
          this.updateForma(datos.config.dataSource.data);
          break;

        default:
          break;
      }
    });
  }

  iniForma() {
    this.DFechaPlan = {
      NOMBRE: '',
      FECHA_INICIO: new Date,
      FECHA_FIN: new Date,
      TODO_DIA: false,
      REPETIR: false,
      FRECUENCIA: 'Cada hora',
      INTERVALO_FRECUENCIA: 1,
      REPETIR_DIA_SEMANA: '',
      REPETIR_EN_DIA: 1,
      REPETIR_EN_MES: {},
      FIN_REPETICION: {}
    }
    this.onValueRepetirModo({ value: 'Cada hora'});
  }

  
  updateForma(datos:any) {
    this.DFechaPlan = {
      NOMBRE: datos.NOMBRE,
      FECHA_INICIO: datos.FECHA_INICIO,
      FECHA_FIN: datos.FECHA_FIN,
      TODO_DIA: datos.TODO_DIA,
      REPETIR: datos.REPETIR,
      FRECUENCIA: datos.FRECUENCIA,
      INTERVALO_FRECUENCIA: datos.INTERVALO_FRECUENCIA,
      REPETIR_DIA_SEMANA: datos.PERIODO,
      REPETIR_EN_DIA: 1,
      REPETIR_EN_MES: {},
      FIN_REPETICION: {}
    }
    this.onValueRepetirModo({ value: 'Cada hora'});
  }

  ngAfterViewInit() {
    setTimeout(() => {
      let popupWidth = Number(this.popUpFechaEvento.instance.option("width"));
      this.popUpFechaEvento.instance.option("width", popupWidth / 2);
    }, 300);
  }

  selectDia(e:any) {

  }
  onCangeRepetir(e:any) {
    this.visibleRepetir = e.value;
    this.DFechaPlan.REPETIR = e.value;
    this.colsForma = e.value ? 2 : 1;
  }
  onChangeFechaDesde(e:any) {
    this.DFechaPlan.FECHA_INICIO = this.datepipe.transform(e.value, 'MM/dd/yyyy');
  }
  onChangeFechaHasta(e:any) {
    this.DFechaPlan.FECHA_FIN = this.datepipe.transform(e.value, 'MM/dd/yyyy');
  }
  clickAccionFecha(accion:any) {
    
  }
  onValueRepetirModo(e:any) {
    switch (e.value) {
      case "Cada hora":
        this.titRepetirFrec = "Repetir cada (horas)"
        break;
      case "Diario":
        this.titRepetirFrec = "Repetir cada (dias)"
        break;
      case "Semanal":
        this.titRepetirFrec = "Repetir cada (semanas)"
        break;
      case "Mensual":
        this.titRepetirFrec = "Repetir cada (meses)"
        this.titRepetirDia = "El día"
        break;
      case "Anual":
        this.titRepetirFrec = "Repetir cada (años)"
        this.titRepetirDia = "El día"
        break;
    
      default:
        break;
    }
  }
  
  onValueRepetirMes(e:any) {
    this.DFechaPlan.REPETIR_MES = e.value;
    if (this.DFechaPlan.REPETIR_MES) {
      const ixmes = this.DMeses.indexOf(this.DFechaPlan.REPETIR_MES);
      if (ixmes !== -1) {
        const today = new Date();
        if (today.getMonth() == 12)
          this.maxDiaMes = 31
        else {
          let fec = new Date(today.getFullYear(), ixmes+1, 1)
          fec.setDate(fec.getDate() - 1 );
          this.maxDiaMes = fec.getDate();
        }
      }

    }

  }





}
