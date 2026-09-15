import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import {
  DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule,
  DxFormModule, DxGanttComponent, DxGanttModule, DxProgressBarModule,
  DxSelectBoxModule, DxTagBoxModule, DxTextBoxModule, DxAccordionModule
} from 'devextreme-angular';
import { Observable, Subscription } from 'rxjs';
import { GES007Service } from 'src/app/services/GES007/GES007.service';
import Swal from 'sweetalert2';
import { validatorRes } from 'src/app/shared/validator/validator';
import { Dependency, Resource, ResourceAssignment, Task } from './GES00703.class';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { exportGantt as exportGanttToPdf } from 'devextreme/pdf_exporter';

type ExportMode = Parameters<typeof exportGanttToPdf>[0]['exportMode'];
type DateRange = Parameters<typeof exportGanttToPdf>[0]['dateRange'];

@Component({
  selector: 'app-GES00703',
  templateUrl: './GES00703.component.html',
  styleUrls: ['./GES00703.component.css'],
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
    DxAccordionModule
  ]
})
export class GES00703Component {

  @ViewChild('ganttProyectos', { static: false }) ganttProyectos: DxGanttComponent;

  @Input() events: Observable<any>;
  @Output() onRespuestaDatos: EventEmitter<any> = new EventEmitter<any>();

  private eventsSubscription: Subscription;

  TASK: Task[] = [];
  PRECEDENTES: Dependency[] = [];
  RESOURCES: Resource[] = [];
  RESOURCEASSIGNMENT: ResourceAssignment[] = [];

  DTareas: any = [];
  DProyecto: any = {};
  DResponsables: any = [];
  FProyectos: any;

  conCambios: number = 0;
  USUARIO_LOCAL: any = '';


  readOnly: boolean = false;
  maxValue: number = 100;

  exportButtonOptions: any = {
    hint: 'Export to PDF',
    icon: 'exportpdf',
    stylingMode: 'text',
    onClick: () => this.exportButtonClick(),
  };
  exportModes = ['All', 'Chart', 'Tree List'];
  dateRanges = ['all', 'visible', 'custom'];
  exportModeBoxValue = this.exportModes[0];
  dateRangeBoxValue = this.dateRanges[1];
  startDate: Date = new Date("2026-06-01T00:00:00Z");
  endDate: Date = new Date("2026-08-31T00:00:00Z");
  startTaskIndex = 0;
  endTaskIndex = 300;

  constructor(
    private sDatos: GES007Service
  ) {
    this.valoresObjetos = this.valoresObjetos.bind(this);
    this.updateData = this.updateData.bind(this);

    // this.TASK = this.sDatos.getTasks();
    // this.DEPENDENCIES = this.sDatos.getDependencies();
    // this.RESOURCES = this.sDatos.getResources();
    // this.RESOURCEASSIGNMENT = this.sDatos.getResourceAssignments();

  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
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
    this.RESOURCES = this.sDatos.DResponsables;
  }
  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

  loadDataInit(data: any) {
    switch (data.accion) {
      case 'init':
        this.DProyecto = data.dataSource;
        this.readOnly = data.readOnly;
        // this.valoresObjetos('actividades');
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
        this.TASK = [];
        this.RESOURCEASSIGNMENT = [];
        this.readOnly = data.readOnly;
        this.FProyectos = data.dataSource.ENCABEZADO;
        if (data.dataSource.TAREAS.length > 0) {
          for (let i = 0; i < data.dataSource.TAREAS.length; i++) {
            const element = data.dataSource.TAREAS[i];
            element.id = element.ID_ACTIVIDAD
          }
          this.DTareas = data.dataSource.TAREAS;
          this.PRECEDENTES = [];

          let dependenciaId = 1;
          const tareaIds = new Set(this.DTareas.map(t => t.ID_ACTIVIDAD));

          for (const tarea of this.DTareas) {

            if (Array.isArray(tarea.PRECEDENTES)) {
              if (tarea.PRECEDENTES.length > 0) {
                for (const idPrecedente of tarea.PRECEDENTES) {
                  // Solo agregar si el ID de precedente existe en las tareas
                  if (tareaIds.has(idPrecedente)) {
                    this.PRECEDENTES.push({
                      id: dependenciaId++,
                      predecessorId: idPrecedente,
                      successorId: tarea.ID_ACTIVIDAD,
                      type: 0 // Fin-Inicio
                    });
                  }
                }
              }
            } else {
              if (tarea.PRECEDENTES.length > 0) {

                let PRECEDENTES = JSON.parse(tarea.PRECEDENTES);
                for (const idPrecedente of PRECEDENTES) {
                  // Solo agregar si el ID de precedente existe en las tareas
                  if (tareaIds.has(idPrecedente)) {
                    this.PRECEDENTES.push({
                      id: dependenciaId++,
                      predecessorId: idPrecedente,
                      successorId: tarea.ID_ACTIVIDAD,
                      type: 0 // Fin-Inicio
                    });
                  }
                }
              }
            }
          }
          this.ganttProyectos.instance.repaint(); // <- ¡Esto es clave!


          // this.TASK = data.dataSource.TAREAS;
          // this.RESOURCEASSIGNMENT = data.dataSource.TAREAS;
          // for (let i = 0; i < data.dataSource.TAREAS.length; i++) {
          // const ele:any = data.dataSource.TAREAS[i];
          //Tareas
          // const task: Task = {
          //   id: ele.ID_ACTIVIDAD,
          //   // parentId: ele.ID_ACTIVIDAD_PADRE === -1 ? 0 : ele.ID_ACTIVIDAD_PADRE,
          //   parentId: ele.ID_ACTIVIDAD_PADRE,
          //   title: ele.NOMBRE,
          //   start: ele.FECHA_INICIO,
          //   end: ele.FECHA_FIN,
          //   progress: ele.PROGRESO? ele.PROGRESO : 0
          // };
          // this.TASK = [...this.TASK, task];

          //Responsable-Actividad
          // const ASIG: ResourceAssignment = {
          //   id: ele.ID_ACTIVIDAD,
          //   taskId: ele.ID_ACTIVIDAD,
          //   resourceId: ele.RESPONSABLE
          // };
          // this.RESOURCEASSIGNMENT = [...this.RESOURCEASSIGNMENT, ASIG];
          // }
          // this.DTareas = data.dataSource.TAREAS;
          // this.ganttProyectos.instance.repaint();
        } else {
          this.DTareas = [];
          // this.ganttProyectos.instance.repaint();
        }
        break;

      case 'update data config':
        // this.JsonDataSource[data.parametro] = data.dataSource;
        break;

      default:
        break;
    }
  }


  onValueChanged(e: any, campo: string) {
    switch (campo) {
      case 'NOMBRE':
        if (e.value !== '')
          this.conCambios++;
        break;

      case 'RESPONSABLE':
        if (e.value !== '')
          this.FProyectos.RESPONSABLE = e.value;
        else if (e.value === '')
          this.FProyectos.RESPONSABLE = '';

        this.conCambios++;
        break;

      case 'FECHA_INICIO':
        if (e.value)
          this.conCambios++;
        break;


      case 'FECHA_FIN':
        if (e.value) {
          if (this.FProyectos.FECHA_INICIO < e.value) {
            this.conCambios++;
          } else {
            this.FProyectos.FECHA_FIN = this.FProyectos.FECHA_INICIO;
            this.showModal('La fecha final debe ser mayor a la fecha inicial');
          }
        }
        break;

      default:
        break;
    }
    if (this.conCambios > 1) {
      this.onRespuestaDatos.emit({
        accion: 'update datasource',
        data: {
          ENCABEZADO: this.FProyectos,
          TAREAS: this.DTareas
        }
      });
    }
  }

  valoresObjetos(obj: string) {
    if (obj === 'actividades') {
      const prm: any = { DOCUMENTO: this.DProyecto.DOCUMENTO };
      this.sDatos.consulta('ACTIVIDADES PROYECTOS', prm, this.sDatos.prmUsrAplBarReg.aplicacion,).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
          this.DTareas = [];
          return;
        } else {
          this.DTareas = res;
          this.ganttProyectos.instance.repaint();
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

  format(ratio) {
    let value = ratio * 100
    return `${value > 0 && value < 100 ? value.toFixed(2) : value}%`;
  }

  exportButtonClick() {
    const gantt = this.ganttProyectos.instance;
    const format = 'auto';
    const isLandscape = true;
    const exportMode = 'all';  //this.getExportMode();
    const dataRangeMode = 'custom'; //this.dateRangeBoxValue;
    let dateRange: DateRange;

    if (dataRangeMode === 'custom') {
      dateRange = {
        startIndex: this.startTaskIndex,
        endIndex: this.endTaskIndex,
        startDate: this.startDate,
        endDate: this.endDate,
      };
    } else {
      dateRange = dataRangeMode as Exclude<DateRange, 'custom'>;
    }

    // exportGanttToPdf(
    //   {
    //     component: gantt,
    //     createDocumentMethod: (args?: any) => new jsPDF(args),
    //     format,
    //     landscape: isLandscape,
    //     exportMode,
    //     dateRange,
    //   },
    // ).then((doc) => doc.save('gantt.pdf'));

    exportGanttToPdf({
      component: gantt,
      createDocumentMethod: (args) => new jsPDF(args),
      format: 'auto',          // Ajuste automático de tamaño de página
      landscape: true,
      exportMode: 'all',
      dateRange: dateRange         // <--- Esto jala todo el timeline del proyecto completo
    }).then((doc) => {
      doc.save('gantt-completo.pdf');
    });
  }

  getExportMode: () => ExportMode = () => {
    const modes: Record<string, ExportMode> = {
      'Tree List': 'treeList',
      Chart: 'chart',
    };
    return modes[this.exportModeBoxValue] || 'all';
  };


}
