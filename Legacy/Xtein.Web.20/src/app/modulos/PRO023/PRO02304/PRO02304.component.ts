import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxGanttComponent, DxGanttModule } from 'devextreme-angular';
import { Observable, Subscription } from 'rxjs';
import { PRO029Service } from 'src/app/services/PRO029/PRO029.service';
import { showToast } from 'src/app/shared/toast/toastComponent';

@Component({
  selector: 'app-PRO02304',
  templateUrl: './PRO02304.component.html',
  styleUrls: ['./PRO02304.component.css'],
  standalone: true,
  imports: [CommonModule, DxGanttModule]
})
export class PRO02304Component {

  @ViewChild('ganttSimulador', { static: false }) ganttSimulador: DxGanttComponent;

  @Input() events: Observable<any>;
  @Output() onRespuestaDatos: EventEmitter<any> = new EventEmitter<any>();
  private eventsSubscription: Subscription;
  subscription: Subscription;


  DetalleProgramacion:any [] = [];
  Programacion:any [] = [];
  datos_filtro:any = [];
  datos_seccion:any = {};

  currentTime: Date;
  curremTimeStart: Date;
  curremTimeEnd: Date;

  constructor (
    private sData: PRO029Service
  ) { }

  ngOnInit(): void {
    //this.valoresObjetos('todos', '');
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.accion) {
        case 'Load Data':
          this.DetalleProgramacion = datos.dataSource;
          this.Programacion = datos.dataSource;
          break;

        case 'Load Fecha Limite':
          this.currentTime = datos.fechas.FECHA_ENTREGA;
          if ((datos.fechas.FECHA_INICIO !== null && datos.fechas.FECHA_INICIO !== undefined) && 
            (datos.fechas.FECHA_FINAL !== null && datos.fechas.FECHA_FINAL !== undefined)
          ) {
            this.curremTimeStart = datos.fechas.FECHA_INICIO;
            this.curremTimeEnd = datos.fechas.FECHA_FINAL;
          }
          this.ganttSimulador.instance.repaint();
          break;

        default:
          break;
      }
    });
  }

  ngOnDestroy() {
    // this.subscription.unsubscribe();
  }


  onTaskClick(e:any) {
    this.datos_filtro = e.value;
    // this.datos_seccion = this.Programacion.filter((d:any) => d.ID_SECCION === e.data.ID_SECCION);

    this.onRespuestaDatos.emit({
      accion: 'Cargar Sesion Filtro',
      dataSource: {  }
      // dataSource: { SECCION: this.datos_seccion, FILTOR: this.datos_filtro }
    });
  }

}
