import { DxButtonGroupModule, DxButtonModule, DxDateBoxModule, DxFormModule, DxNumberBoxModule, DxPopupComponent, DxPopupModule, DxRadioGroupModule, DxSelectBoxModule, DxSwitchModule } from 'devextreme-angular';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-fechaplan',
  templateUrl: './fechaplan.component.html',
  styleUrls: ['./fechaplan.component.css'],
  standalone: true,
  imports: [ DxFormModule, DxSelectBoxModule, DxNumberBoxModule, DxRadioGroupModule, 
             DxButtonGroupModule, DxDateBoxModule, DxSwitchModule, CommonModule, 
             DxPopupModule, DxButtonModule ],
  providers: [ DatePipe ]
})
export class FechaplanComponent {
  @ViewChild("popUpFechaEvento", { static: false }) popUpFechaEvento: DxPopupComponent;

  DFechaPlan: any;
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

  @Input() events: Observable<any>;
  @Input() datosEntrada: any;
  @Input() readOnly: any;

  @Output() datosEntradaChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() onRespuestaProg: EventEmitter<any> = new EventEmitter<any>();

  private eventsSubscription: Subscription;

  constructor(private datepipe: DatePipe) 
  {
    this.onCangeRepetir = this.onCangeRepetir.bind(this);  
  }

  selectDia(e) {
    this.DFechaPlan.REPETIR_DIA_SEMANA = this.selectedDiasSemana;
  }
  onCangeRepetir(e) {
    this.visibleRepetir = e.value;
    this.DFechaPlan.REPETIR = e.value;
    this.colsForma = e.value ? 2 : 1;
  }
  onChangeFechaDesde(e) {
    this.DFechaPlan.FECHA_DESDE = this.datepipe.transform(e.value, 'MM/dd/yyyy');
  }
  onChangeFechaHasta(e) {
    this.DFechaPlan.FECHA_HASTA = this.datepipe.transform(e.value, 'MM/dd/yyyy');
  }
  clickAccionFecha(accion) {
    this.onRespuestaProg.emit({ accion, datos: this.DFechaPlan });
    this.popupVisible = false;
  }
  onValueRepetirModo(e) {
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

  onValueRepetirFrec(e) {
    this.DFechaPlan.REPETIR_FRECUENCIA = e.value;
  }
  
  onValueRepetirMes(e) {
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

  iniForma () {
    this.DFechaPlan = {
      FECHA_DESDE: new Date,
      FECHA_HASTA: new Date,
      TODO_DIA: false,
      REPETIR: false,
      REPETIR_MODO: 'Cada hora',
      REPETIR_FRECUENCIA: 1,
      REPETIR_DIA_SEMANA: '',
      REPETIR_EN_DIA: 1,
      REPETIR_EN_MES: {},
      FIN_REPETICION: {},

    }
    this.onValueRepetirModo({ value: 'Cada hora'});

  }

  ngOnInit(): void {
    this.DDiaSemana = [{text:"Lu"},{text:"Ma"},{text:"Mi"},{text:"Ju"},{text:"Vi"},{text:"Sa"},{text:"Do"}];
    this.iniForma();

    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.accion) {
        case 'modificar':
          this.popupVisible = true;
          break;

        default:
          break;
        }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      let popupWidth = Number(this.popUpFechaEvento.instance.option("width"));
      this.popUpFechaEvento.instance.option("width", popupWidth / 2);
    }, 300);
  }

}
