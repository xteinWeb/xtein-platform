import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxFormModule, DxGanttComponent, DxGanttModule, DxProgressBarModule, DxSelectBoxModule, DxTagBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { Observable, Subscription } from 'rxjs';
import { GES007Service } from 'src/app/services/GES007/GES007.service';
import Swal from 'sweetalert2';
import { validatorRes } from 'src/app/shared/validator/validator';
import { Dependency, Resource, ResourceAssignment, Task } from './PRO02904.class';

@Component({
  selector: 'app-PRO02904',
  templateUrl: './PRO02904.component.html',
  styleUrls: ['./PRO02904.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    DxGanttModule,
    DxFormModule,
    DxDateBoxModule,
    DxTextBoxModule,
    DxSelectBoxModule,
    DxDropDownBoxModule,
    DxDataGridModule,
    DxProgressBarModule,
    DxTagBoxModule,
  ]
})
export class PRO02904Component {

  @ViewChild('ganttAgenda', { static: false }) ganttAgenda: DxGanttComponent;

  @Input() events: Observable<any>;
  @Output() onRespuestaDatos: EventEmitter<any> = new EventEmitter<any>();

  private eventsSubscription: Subscription;

  // PRECEDENTES: Dependency[] = [];
  // RESOURCES: Resource[] = [];
  // RESOURCEASSIGNMENT: ResourceAssignment[] = [];
  DAgenda: any = [];
  FProyectos: any;

  conCambios: number = 0;
  USUARIO_LOCAL: any = '';

  maxValue: number = 100;

  constructor(
    private sDatos: GES007Service
  ) {
    this.valoresObjetos = this.valoresObjetos.bind(this);

    // this.TASK = this.sDatos.getTasks();
    // this.DEPENDENCIES = this.sDatos.getDependencies();
    // this.RESOURCES = this.sDatos.getResources();
    // this.RESOURCEASSIGNMENT = this.sDatos.getResourceAssignments();

  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    // this.eventsSubscription = this.events.subscribe((datos: any) => {
    //   switch (datos.accion) {
    //     case 'init':
    //       this.loadDataInit(datos.config);
    //       break;

    //     case 'configurar':
    //       // this.configComponent(datos.dataSource);
    //       break;

    //     case 'cargar datos':
    //       this.updateData(datos.config);
    //       break;

    //     default:
    //       break;
    //   }
    // });

    this.valoresObjetos('agenda');

    this.FProyectos = {
      ID_DOCUMENTO: '',
      CONSECUTIVO: 0,
      NOMBRE: '',
      RESPONSABLE: '',
      PLANTILLA: '',
      FECHA_INICIO: '',
      FECHA_FIN: '',
      DESCRIPCION: '',
      ESTADO: 'ACTIVO',
      FOTO: '',
      USUARIO: this.USUARIO_LOCAL,
      FECHA_REGISTRO: new Date(),
      FECHA_ACTUALIZACION: '',
      SUB_ESTADO: 'Sin Iniciar'
    };
    //Actualiza los responsables
    // this.sDatos.DResponsables.forEach((ele:any) => {
    //   //Responsables
    //   const responsable: Resource = {
    //     id: ele.ID_RESPONSABLE,
    //     text: ele.NOMBRE
    //   };
    //   this.RESOURCES = [...this.RESOURCES, responsable];
    // });
    // this.RESOURCES = this.sDatos.DResponsables;
  }
  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

  valoresObjetos(obj: string) {
    if (obj === 'agenda') {
      const prm: any = {};
      this.sDatos.consulta('CONSULTA GANTT', prm, 'PRO029').subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
          this.DAgenda = [];
          return;
        } else {
          for (let i = 0; i < res.length; i++) {
            const element = res[i];
            // ...código existente...
            element.NOMBRE_COMPLETO = `${element.NOMBRE_PRODUCTO} ${element.ORDEN_PRODUCCION != '' ? element.ORDEN_PRODUCCION : ''} ${element.DOCUMENTO_PEDIDO != '' ? element.DOCUMENTO_PEDIDO : ''} [${element.ESTADO}]`
            element.COLOR = this.getColorByEstado(element.ESTADO);
            // ...código existente...
          }
          this.DAgenda = res;
          this.ganttAgenda.instance.repaint();
        }
      });
    };
  }

  showModal(mensaje: any) {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
      title: '¡Error!',
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
      stopKeydownPropagation: false,
    });
  }

  getColorByEstado(estado: string): string {
    switch (estado) {
      case 'REGISTRADO': return 'custom-task-color-registrado';
      case 'PROGRAMADO': return 'custom-task-color-programado';
      case 'EN PROCESO': return 'custom-task-color-enproceso';
      case 'FINALIZADO': return 'custom-task-color-finalizado';
      default: return 'sin-estado';
    }
  }
  // ...código existente...
}
