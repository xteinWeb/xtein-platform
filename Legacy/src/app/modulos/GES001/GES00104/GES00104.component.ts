import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { DxButtonModule, DxDataGridModule, DxDateBoxModule, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxProgressBarModule, DxSelectBoxModule, DxSwitchModule, DxTagBoxModule, DxTextBoxModule, DxTooltipModule, DxSchedulerModule, DxSchedulerComponent } from 'devextreme-angular';
import { lastValueFrom, Observable, Subscription } from 'rxjs';
import { GES001Service } from 'src/app/services/GES001/GES001.service';
import { GES00Service } from 'src/app/shared/Tareas/Service/GES00.service';
import {  } from 'src/app/shared/Tareas/GES_INFO/GES_INFO.component';
import Swal from 'sweetalert2';
import { clsGesActividades, clsNewPoryect } from '../clsGES001.class';
import DataSource from 'devextreme/data/data_source';
import ArrayStore from 'devextreme/data/array_store';
import notify from 'devextreme/ui/notify';
import { validatorRes } from 'src/app/shared/validator/validator';
import { CommonModule, DatePipe } from '@angular/common';
import {MatTooltipModule} from '@angular/material/tooltip';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import {MatChipsModule} from '@angular/material/chips';
import { showToast } from '../../../shared/toast/toastComponent.js'


@Component({
  selector: 'app-GES00104',
  templateUrl: './GES00104.component.html',
  styleUrls: ['./GES00104.component.css'],
  standalone: true,
  imports: [DxButtonModule, DxDataGridModule, DxDateBoxModule, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxProgressBarModule, DxSelectBoxModule, DxSwitchModule, DxTagBoxModule, DxTextBoxModule, DxTooltipModule, DxSchedulerModule]
})
export class GES00104Component implements OnInit {
  @ViewChild("calendarioGespro", { static: false }) calendarioGespro: DxSchedulerComponent;

  
  @Input() events: Observable<any>;

  private eventsSubscription: Subscription;
  subscription: Subscription;
  subscriptionCalendario: Subscription;

  DCalendarios:any [] = [];
  DEventosCalendario:any = [];
  DFestivos:any = [];
  DTareas:any = [];
  DTareas_prev: any = [];
  readOnly: boolean = true;
  currentDate: Date = new Date();

  USUARIO_LOCAL: any = '';
  conCambios: number = 0;
  loadingVisible: boolean = false;
  stylingMode = 'filled';
  selectedCalendars: any

  constructor(private _sdatos: GES001Service, private _GES00: GES00Service)
  {
    this.subscriptionCalendario = this._sdatos.getObsCalendario().subscribe((data:any) => {
      switch (data.accion) {
        case 'r_refrescar':
          this.valoresObjetos('todos');
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
    // this.valoresObjetos('todos');
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.accion) {
        case 'init':
          this.loadDataInit(datos.config);
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

  loadDataInit(data:any) {
    switch (data.accion) {
      case 'init':
        if(data.dataSource.length > 0) {
          this.DEventosCalendario = [];
          this.DTareas_prev = data.dataSource;
          this.DTareas_prev.forEach((element:any) => {
            const item:any = {
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
              CLASE: element.CLASE,
              TIPO: element.TIPO,
              ANULADO: element.ANULADO,
              REPETIR: element.REPETIR,
              INTERVALO_FRECUENCIA: element.INTERVALO_FRECUENCIA,
              PERIODO_FRECUENCIA: element.PERIODO_FRECUENCIA,
              FRECUENCIA: element.FRECUENCIA,
              type: element.CLASE
            }
            if (element.CLASE !== 'NODOS') {
              this.DEventosCalendario.push(item);
            } else {
              this.DCalendarios.push(item);
            }
          });
          this.calendarioGespro.instance._refresh();
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

  updateData(data:any) {
    switch (data.accion) {
      case 'update dataSource':
        if(data.dataSource.length > 0) {
          this.DEventosCalendario = [];
          this.DTareas_prev = data.dataSource;
          this.DTareas_prev.forEach((element:any) => {
            const item:any = {
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
              CLASE: element.CLASE,
              TIPO: element.TIPO,
              ANULADO: element.ANULADO,
              REPETIR: element.REPETIR,
              INTERVALO_FRECUENCIA: element.INTERVALO_FRECUENCIA,
              PERIODO_FRECUENCIA: element.PERIODO_FRECUENCIA,
              FRECUENCIA: element.FRECUENCIA,
              type: element.CLASE
            }
            if (element.CLASE !== 'NODOS') {
              this.DEventosCalendario.push(item);
            } else {
              this.DCalendarios.push(item);
            }
          });
          this.calendarioGespro.instance._refresh();
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

  onSelectCalendario(e:any) {}

  onAppointmentAdded(e:any) {
    showToast('Agregado el Evento: '+e.appointmentData.text, 'success');
    this.saveActividadesCalendario();
    this._GES00.setObsActividades({accion: 'r_refrescar'});
  }

  onAppointmentUpdated(e:any) {
    showToast('Actualizado el Evento: '+e.appointmentData.text, 'success');
    this.saveActividadesCalendario();
    this._GES00.setObsActividades({accion: 'r_refrescar'});
  }

  onAppointmentDeleted(e:any) {
    this.saveActividadesCalendario();
    showToast('Eliminado el Evento: '+e.appointmentData.text, 'warning');
    this._GES00.setObsActividades({accion: 'r_refrescar'});
  }

  onAppointmentDblClick(e:any) {
    e;
  }

  onValueChangedCalendario(e:any){
    this.DEventosCalendario = [];
    var item:any;
    e.value.forEach((nodo:any) => {
      this.DTareas_prev.filter((d:any) => d.ID_ACTIVIDAD_PADRE === nodo).forEach((tarea:any) => {
        const item:any = {
          text: tarea.NOMBRE,
          NOMBRE: tarea.NOMBRE,
          description: tarea.DESCRIPCION,
          startDate: new Date(tarea.FECHA_INICIO),
          endDate: new Date(tarea.FECHA_FIN),
          allDay: tarea.TODO_DIA,
          ID_ACTIVIDAD: tarea.ID_ACTIVIDAD,
          ID_ACTIVIDAD_PADRE: tarea.ID_ACTIVIDAD_PADRE,
          PRIORIDAD: tarea.PRIORIDAD,
          ETIQUETAS: tarea.ETIQUETAS,
          MEDICION: tarea.MEDICION,
          ESTADO: tarea.ESTADO,
          USUARIO: tarea.USUARIO,
          CLASE: tarea.CLASE,
          TIPO: tarea.TIPO,
          ANULADO: tarea.ANULADO,
          REPETIR: tarea.REPETIR,
          INTERVALO_FRECUENCIA: tarea.INTERVALO_FRECUENCIA,
          PERIODO_FRECUENCIA: tarea.PERIODO_FRECUENCIA,
          FRECUENCIA: tarea.FRECUENCIA,
          type: tarea.CLASE
        }
        if (tarea.CLASE !== 'NODOS') {
          this.DEventosCalendario.push(item);
        }
      });
    });
    this.calendarioGespro.instance._refresh();
    // const calendarios = e.value;
    // calendarios.forEach((calendar:any) =>{
    //   calendar.EVENTOS.forEach((element:any) =>{
    //     item = {
    //       text: element.NOMBRE,
    //       description: element.DESCRIPCION,
    //       startDate: new Date(element.FECHA_INICIO),
    //       endDate: new Date(element.FECHA_FIN),
    //       allDay: element.TODO_DIA,
    //       recurrenceRule: element.FRECUENCIA,
    //       type: 'Calendarios',
    //       disabled: true
    //     }
    //     this.DEventosCalendario.push(item);
    //   });
    // });
  }

  saveActividadesCalendario(){
    //this.DTareas = this.DEventosCalendario.filter((d:any) => d.type === 'Evento Gespro');
    const prmDatosGuardar = JSON.parse(
      (JSON.stringify({ USUARIO: this.USUARIO_LOCAL, ACTIVIDADES: this.DEventosCalendario })).replace(/}{/g,",")
    );

    // API guardado de datos
    this._sdatos
    .saveActividadesCalendario('save actividades calendario', prmDatosGuardar)
    .subscribe((resp) => {
      const res = JSON.parse(resp.data);
      if (res[0].ErrMensaje !== ""){
        showToast(res[0].ErrMensaje,'error');
      }else{
        showToast('Registro Actualizado','success');
      }
    })

    this.calendarioGespro.instance._refresh();
  }

  valoresObjetos(obj: string) {
    this.DEventosCalendario = [];
    if (obj === 'actividades' || obj === 'todos'){
      const prm:any = {ID_RESPONSABLE: this.USUARIO_LOCAL};
      this.loadingVisible = true;
      this._sdatos.getResponsables('ACTIVIDADES CALENDARIO', prm).subscribe((data: any)=> {
        this.loadingVisible = false;
        const res = validatorRes(data);
        if ( (data.token !== undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if(res[0].ErrMensaje !== '') {
          // showToast(res[0].ErrMensaje, 'error');
          this.DTareas = [];
          return;
        }
        this.loadingVisible = false;
        var item:any;
        this.DTareas = res;
        res.forEach((element:any) => {
          item = {
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
            CLASE: element.CLASE,
            TIPO: element.TIPO,
            ANULADO: element.ANULADO,
            REPETIR: element.REPETIR,
            INTERVALO_FRECUENCIA: element.INTERVALO_FRECUENCIA,
            PERIODO_FRECUENCIA: element.PERIODO_FRECUENCIA,
            FRECUENCIA: element.FRECUENCIA,
            type: 'Evento Gespro'
          }
          this.DEventosCalendario.push(item);
        });
        this.calendarioGespro.instance._refresh();
      });
      // Consulta dias festivos y evenos nacionales en una api externa.
      // this._sdatos.getCalendarioApi().subscribe((data: any) => {
      //   this.loadingVisible = false;
      //   const res = data;
      //   var item:any;
      //   res.forEach((element:any) => {
      //     item = {
      //       text: element.name,
      //       startDate: new Date(element.start),
      //       endDate: new Date(element.start),
      //       allDay: true,
      //       disabled: true,
      //       type: 'Dia Festivo'
      //     }
      //     this.DEventosCalendario.push(item);
      //   });
      //   this.calendarioGespro.instance._refresh();
      // });
    }
    if (obj === 'calendarios' || obj === 'todos'){
      const prm:any = {ESTADO: 'ACTIVO'};
      this.loadingVisible = true;
      this._sdatos.getCalendarios('CALENDARIOS', prm).subscribe((data: any)=> {
        this.loadingVisible = false;
        const res = validatorRes(data);
        if ( (data.token !== undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if(res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
          return;
        }
        this.DCalendarios = res;
        this.loadingVisible = false;
      });
    }
  }
}
