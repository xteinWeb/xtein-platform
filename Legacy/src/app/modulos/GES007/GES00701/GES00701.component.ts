import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxFormModule, DxLoadPanelModule, DxProgressBarModule, DxSelectBoxModule, DxTabsModule, DxTextAreaModule, DxTextBoxModule, DxTreeListModule } from 'devextreme-angular';
import { GES000Component } from '../../GESPRO/GES000/GES000.component';
import { AngularSplitModule } from 'angular-split';
import { CommonModule } from '@angular/common';
import { GES007Service } from 'src/app/services/GES007/GES007.service';
import { Observable, Subject, Subscription } from 'rxjs';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import Swal from 'sweetalert2';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { showToast } from 'src/app/shared/toast/toastComponent.js';
import { GES001Service } from 'src/app/services/GES001/GES001.service';

@Component({
  selector: 'app-GES00701',
  templateUrl: './GES00701.component.html',
  styleUrls: ['./GES00701.component.css'],
  standalone: true,
  imports: [
    GES000Component,
    CommonModule, DxFormModule, DxSelectBoxModule, AngularSplitModule, DxTextBoxModule,
    DxDateBoxModule, DxTreeListModule, DxDataGridModule, DxTextAreaModule, DxLoadPanelModule,
    DxDropDownBoxModule,
    DxTabsModule,
    DxProgressBarModule
  ],
})
export class GES00701Component {

  eventsGesInfo: Subject<any> = new Subject<any>();
  eventsSubjectDatos: Subject<any> = new Subject<any>();


  @Input() eventsDatos: Observable<any>;
  @Output() onRespuestaDatos: EventEmitter<any> = new EventEmitter<any>();

  private eventsSubscription: Subscription;
  DATOS_CONFIG: any[] = [];
  DResponsables: any = [];
  DPlantillas: any = [];
  DTareas: any = [];

  selectPlantilla: any = [];
  selectReferencia: any = [];
  REFERENCIAS: any[] = [];

  USUARIO_LOCAL: any = '';
  EMPRESA: any = '';
  minDate: Date = new Date();

  isActiveGridReferencias: boolean = true;
  isGridBoxOpened: boolean = false;
  isGridBoxOpenedReferencia: boolean = false;
  loadingVisible: boolean = false;
  objReadOnly: any = {
    readOnly: true,
    readOnlyPlantilla: true,
    readonlyStatus: true,
    referencia: true
  }
  FProyectos: any;

  conCambios: number = 0;
  tabsProyectos: any = [
    {
      ID: 0,
      text: 'Tree List',
      icon: 'user',
      content: true,
    },
    {
      ID: 1,
      text: 'Gantt',
      icon: 'find',
      content: false,
    },
  ];
  mnuAccion: any;
  proyecto_prev: any;
  maxValue: number = 100;

  constructor(
    private sDatos: GES007Service,
    private _sbarreg: SbarraService,
    private _sdatos: GES001Service,

  ) {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.EMPRESA = localStorage.getItem('empresa')?.toUpperCase();
  }

  ngOnInit() {
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
      REFERENCIA: '',
      FOTO: '',
      USUARIO: this.USUARIO_LOCAL,
      FECHA_REGISTRO: new Date(),
      FECHA_ACTUALIZACION: '',
      SUB_ESTADO: 'Sin Iniciar',
      AVANCE: 0
    };
    this.eventsSubscription = this.eventsDatos.subscribe((datos: any) => {
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
    // setTimeout(() => {
    //   this.eventsSubjectDatos.next({
    //     accion: 'init',
    //     config: { accion: 'init', APLICACION: this.sDatos.prmUsrAplBarReg.aplicacion, readOnly: false }
    //   });
    // }, 1000);
    this.valoresObjetos('todos', '');
    this.valoresObjetos('consecutivo');
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

  loadDataInit(data: any) {
    switch (data.accion) {
      case 'init':
        this.mnuAccion = data.mnuAccion;
        if (this.mnuAccion === 'new') {
          if (data.readOnly !== undefined || data.readOnly !== null) {
            this.objReadOnly.readOnly = data.readOnly;
            this.objReadOnly.readOnlyPlantilla = true;
            this.FProyectos = {
              ESTADO: 'ACTIVO',
              USUARIO: this.USUARIO_LOCAL,
              FECHA_REGISTRO: new Date(),
              SUB_ESTADO: 'Sin Iniciar',
              AVANCE: 0
            }
            this.DTareas = []
            this.selectPlantilla = [];
            this.selectReferencia = [];
            this.eventsSubjectDatos.next({
              accion: 'cargar datos',
              config: { accion: 'update dataSource', dataSource: this.DTareas }
            });
          }
          this.valoresObjetos('consecutivo');
        }
        break;

      case 'update data config':
        // this.JsonDataSource[data.parametro] = JSON.parse(
        //   JSON.stringify(data.dataSource)
        // );
        break;

      default:
        break;
    }
  }

  updateData(data: any) {
    const proyecto: any = data.dataSource;
    for (let i = 0; i < proyecto.TAREAS.length; i++) {
      const element = proyecto.TAREAS[i];
      element.btnComentarios = true;
    }
    this.proyecto_prev = proyecto;
    this.mnuAccion = data.mnuAccion
    switch (data.accion) {
      case 'update dataSource':
        if (this.mnuAccion === 'update') {
          this.FProyectos = proyecto.ENCABEZADO
          this.DTareas = proyecto.TAREAS
          this.selectPlantilla = proyecto.ENCABEZADO.PLANTILLA;
          this.selectReferencia = proyecto.ENCABEZADO.REFERENCIA;

          if (this.selectPlantilla.length > 0) {
            this.valoresObjetos('codigos referencias');
          }

          this.onValueChanged({ value: proyecto.ENCABEZADO.PLANTILLA }, 'PLANTILLA');
          this.eventsSubjectDatos.next({
            accion: 'cargar datos',
            config: {
              accion: 'update dataSource', dataSource: this.DTareas,
              rangoFecha: { FECHA_INICIO: this.FProyectos.FECHA_INICIO, FECHA_FIN: this.FProyectos.FECHA_FIN }

            }
          });
          if (proyecto.ENCABEZADO.ESTADO === 'INACTIVO') {
            this.objReadOnly.readonlyStatus = false;
            return;
          }
          this.objReadOnly.readonlyStatus = data.readOnly;
          this.objReadOnly.readOnly = data.readOnly;
          this.objReadOnly.readOnlyPlantilla = data.readOnly;
          this.objReadOnly.referencia = data.readOnly && this.objReadOnly.readOnlyPlantilla;
        } else if (this.mnuAccion === 'new') {

          this.FProyectos = this.proyecto_prev.ENCABEZADO
          this.DTareas = this.proyecto_prev.TAREAS
          this.selectPlantilla = this.proyecto_prev.ENCABEZADO.PLANTILLA;
          this.selectReferencia = proyecto.ENCABEZADO.REFERENCIA;
          this.onValueChanged({ value: proyecto.ENCABEZADO.PLANTILLA }, 'PLANTILLA');
          this.eventsSubjectDatos.next({
            accion: 'cargar datos',
            config: {
              accion: 'update dataSource', dataSource: this.DTareas,
              rangoFecha: { FECHA_INICIO: this.FProyectos.FECHA_INICIO, FECHA_FIN: this.FProyectos.FECHA_FIN }

            }
          });
          this.objReadOnly.readonlyStatus = data.readOnly;
          this.objReadOnly.readOnly = data.readOnly;
          this.objReadOnly.referencia = data.readOnly && this.objReadOnly.readOnlyPlantilla;
        } else {
          this.FProyectos = this.proyecto_prev.ENCABEZADO
          this.DTareas = this.proyecto_prev.TAREAS
          this.selectPlantilla = this.proyecto_prev.ENCABEZADO.PLANTILLA;
          this.selectReferencia = proyecto.ENCABEZADO.REFERENCIA;
          if (this.selectPlantilla.length > 0) {
            this.valoresObjetos('codigos referencias');
          }
          this.onValueChanged({ value: proyecto.ENCABEZADO.PLANTILLA }, 'PLANTILLA');
          this.eventsSubjectDatos.next({
            accion: 'cargar datos',
            config: {
              accion: 'update dataSource', dataSource: this.DTareas,
              rangoFecha: { FECHA_INICIO: this.FProyectos.FECHA_INICIO, FECHA_FIN: this.FProyectos.FECHA_FIN }

            }
          });
          this.objReadOnly.readonlyStatus = true;
          this.objReadOnly.readOnly = true;
          this.objReadOnly.readOnlyPlantilla = true;
          this.objReadOnly.referencia = true;
        }
        break;
      case 'copiar proyecto':
        if (this.mnuAccion === 'new') {
          this.valoresObjetos('consecutivo')
          this.objReadOnly.readOnly = data.readOnly;
          this.FProyectos = proyecto.ENCABEZADO
          this.DTareas = proyecto.TAREAS
          this.selectPlantilla = proyecto.ENCABEZADO.PLANTILLA;
          this.selectReferencia = proyecto.ENCABEZADO.REFERENCIA;

          this.onValueChanged({ value: proyecto.ENCABEZADO.PLANTILLA }, 'PLANTILLA');
          this.eventsSubjectDatos.next({
            accion: 'cargar datos',
            config: {
              accion: 'update dataSource', dataSource: this.DTareas,
              rangoFecha: { FECHA_INICIO: this.FProyectos.FECHA_INICIO, FECHA_FIN: this.FProyectos.FECHA_FIN }

            }
          });
        }
        this.objReadOnly.readOnly = data.readOnly;
        this.objReadOnly.readOnlyPlantilla = data.readOnly;
        this.objReadOnly.referencia = data.readOnly && this.objReadOnly.readOnlyPlantilla;
        break;

      case 'update dataSource prev':
        this.objReadOnly.readOnly = data.readOnly;
        this.objReadOnly.readOnlyPlantilla = data.readOnly;
        this.objReadOnly.referencia = data.readOnly && this.objReadOnly.readOnlyPlantilla;
        this.FProyectos = this.proyecto_prev.ENCABEZADO
        this.DTareas = this.proyecto_prev.TAREAS
        this.selectPlantilla = this.proyecto_prev.ENCABEZADO.PLANTILLA;
        this.selectReferencia = proyecto.ENCABEZADO.REFERENCIA;

        break;
      case 'readOnly':
        this.objReadOnly.readOnly = data.readOnly;
        this.objReadOnly.readOnlyPlantilla = data.readOnly;
        this.objReadOnly.referencia = data.readOnly && this.objReadOnly.readOnlyPlantilla;
        break;

      default:
        break;
    }
  }

  onValueChanged(data: any, campo: string) {
    switch (campo) {
      case 'ID_DOCUMENTO':
        if (data.value !== '')
          this.conCambios++;
        break;

      case 'ESTADO':
        if (data.value !== '') {
          if (data.value === 'ACTIVO') {
            this.objReadOnly.readOnly = false;
            this.objReadOnly.readOnlyPlantilla = false;
          }
          this.conCambios++;
        }
        break;


      case 'NOMBRE':
        if (data.value !== '')
          this.conCambios++;
        break;

      case 'RESPONSABLE':
        if (data.value !== '')
          this.FProyectos.RESPONSABLE = data.value;
        else if (data.value === '')
          this.FProyectos.RESPONSABLE = '';

        this.conCambios++;
        break;

      case 'PLANTILLA':
        if (data.value !== undefined && data.value !== null && data.value.length > 0) {
          let plantilla = typeof data.value === 'object' ? data.value[0] : data.value;
          const dPlt: any = this.DPlantillas.filter((d: any) => d.ID_DOCUMENTO === plantilla);
          if (this.mnuAccion === 'new') {
            for (let i = 0; i < dPlt[0].TAREAS.length; i++) {
              const ele = dPlt[0].TAREAS[i];
              if (ele.ID_ACTIVIDAD_PADRE === -5)
                ele.ID_ACTIVIDAD_PADRE = -1
              if (ele.DATA_PROGRAMACION === '') {
                ele.DATA_PROGRAMACION = [];
              } else {
                ele.DATA_PROGRAMACION = typeof ele.DATA_PROGRAMACION === 'string' ? JSON.parse(ele.DATA_PROGRAMACION) : ele.DATA_PROGRAMACION;
              }
              if (ele.DATA_RECORDATORIO === '') {
                ele.DATA_RECORDATORIO = [];
              } else {
                ele.DATA_RECORDATORIO = typeof ele.DATA_RECORDATORIO === 'string' ? JSON.parse(ele.DATA_RECORDATORIO) : ele.DATA_RECORDATORIO;
              }
              if (ele.PRECEDENTES === '') {
                ele.PRECEDENTES = [];
              } else {
                ele.PRECEDENTES = typeof ele.PRECEDENTES === 'string' ? JSON.parse(ele.PRECEDENTES) : ele.PRECEDENTES;
              }
              ele.FECHA_INICIO = new Date();
              ele.FECHA_FIN = new Date();
              ele.USUARIO = this.USUARIO_LOCAL;
            }

            let NODO = {
              ID_ACTIVIDAD: 8000,
              ID_ACTIVIDAD_PADRE: -1,
              NOMBRE: dPlt[0].NOMBRE,
              DESCRIPCION: "",
              FECHA_INICIO: null,
              FECHA_FIN: null,
              PRIORIDAD: null,
              ETIQUETAS: null,
              MEDICION: null,
              DATA_PROGRAMACION: null,
              RECORDATORIO: null,
              DATA_RECORDATORIO: null,
              ESTADO: null,
              CLASE: 'NODOS',
              TIPO: null,
              PRECEDENTES: "",
              ANULADO: false,
              ELIMINADO: false,
              REPETIR: false,
              TODO_DIA: false,
              RESPONSABLE: null,
              NOMBRE_RESPONSABLE: null,
              COLABORADORES: [],
              PROGRAMACION: "",
              ORDEN: null,
              DESCRIPCIO_ESTILO: "",
              USUARIO: "",
              ASIGNADO_POR: null,
              ACT_MIAS: false,
              ACT_ASIG: false,
              ACT_AREA: false,
              ACT_COLAB: false,
              ACT_FIN: false,
              AVANCE: false,
              TEMP: 0,
              ErrMessage: ""
            }
            let yaExiste = dPlt[0].TAREAS.some(t => t.ID_ACTIVIDAD === NODO.ID_ACTIVIDAD);
            if (yaExiste === false) {
              dPlt[0].TAREAS.push(NODO);
            }
            for (let j = 0; j < dPlt[0].TAREAS.length; j++) {
              let data = dPlt[0].TAREAS[j];
              if (data.CLASE != 'NODOS' && data.ID_ACTIVIDAD_PADRE == -1) {
                data.TEMP = data.ID_ACTIVIDAD_PADRE;
                data.ID_ACTIVIDAD_PADRE = 8000;
              }
            }

            this.DTareas = dPlt[0].TAREAS;
            if (this.FProyectos.FECHA_INICIO && this.FProyectos.FECHA_FIN) {
              this.eventsSubjectDatos.next({
                accion: 'cargar datos',
                config: {
                  accion: 'update dataSource', dataSource: this.DTareas,
                  rangoFecha: { FECHA_INICIO: this.FProyectos.FECHA_INICIO, FECHA_FIN: this.FProyectos.FECHA_FIN }
                }
              });
            }
            if (this.selectPlantilla.length > 0) {
              this.valoresObjetos('codigos referencias');
            }
          } else if (this.mnuAccion === 'update') {
            for (let i = 0; i < this.DTareas.length; i++) {
              const ele = this.DTareas[i];
              if (ele.CLASE === 'NODOS') {
                ele.NOMBRE = dPlt[0].NOMBRE;
              }
              ele.USUARIO = this.USUARIO_LOCAL;
              ele.DATA_PROGRAMACION = typeof ele.DATA_PROGRAMACION == 'string' ? ele.DATA_PROGRAMACION : JSON.stringify(ele.DATA_PROGRAMACION);
              ele.DATA_RECORDATORIO = typeof ele.DATA_RECORDATORIO == 'string' ? ele.DATA_RECORDATORIO : JSON.stringify(ele.DATA_RECORDATORIO);
            }



            this.DTareas = this.DTareas;
            this.eventsSubjectDatos.next({
              accion: 'cargar datos',
              config: {
                accion: 'update dataSource', dataSource: this.DTareas,
                rangoFecha: { FECHA_INICIO: this.FProyectos.FECHA_INICIO, FECHA_FIN: this.FProyectos.FECHA_FIN }
              }
            });
          } else {
            for (let i = 0; i < this.DTareas.length; i++) {
              const element = this.DTareas[i];
              if (element.CLASE === 'NODOS') {
                element.NOMBRE = dPlt[0].NOMBRE;
              }
              element.USUARIO = this.USUARIO_LOCAL;
              if (element.PRECEDENTES !== null && element.PRECEDENTES !== undefined) {
                if (typeof element.PRECEDENTES === 'object' && element.PRECEDENTES.length > 0) {
                  element.PRECEDENTES = element.PRECEDENTES;
                } else if (typeof element.PRECEDENTES === 'string' && element.PRECEDENTES !== '') {
                  element.PRECEDENTES = JSON.parse(element.PRECEDENTES);
                } else {
                  element.PRECEDENTES = []
                }
              } else {
                element.PRECEDENTES = []
              }
              element.DATA_PROGRAMACION = typeof element.DATA_PROGRAMACION == 'string' ? element.DATA_PROGRAMACION : JSON.stringify(element.DATA_PROGRAMACION);
              element.DATA_RECORDATORIO = typeof element.DATA_RECORDATORIO == 'string' ? element.DATA_RECORDATORIO : JSON.stringify(element.DATA_RECORDATORIO);
            }
            this.DTareas = this.DTareas;
            this.eventsSubjectDatos.next({
              accion: 'cargar datos',
              config: {
                accion: 'update dataSource', dataSource: this.DTareas,
                rangoFecha: { FECHA_INICIO: this.FProyectos.FECHA_INICIO, FECHA_FIN: this.FProyectos.FECHA_FIN }
              }
            });
          }
          this.eventsSubjectDatos.next({
            accion: 'cargar datos',
            config: {
              accion: 'update data config',
              parametro: 'PRECEDENTES',
              dataSource: this.DTareas,
            },
          });

          this.objReadOnly.referencia = this.objReadOnly.referencia = data.readOnly && this.objReadOnly.readOnlyPlantilla;
          ;

        }

        this.conCambios++;
        break;

      case 'FECHA_INICIO':
        if (data.value) {

          this.conCambios++;
          if (this.selectPlantilla) {
            this.eventsSubjectDatos.next({
              accion: 'cargar datos',
              config: {
                accion: 'update dataSource', dataSource: this.DTareas,
                rangoFecha: { FECHA_INICIO: this.FProyectos.FECHA_INICIO, FECHA_FIN: this.FProyectos.FECHA_FIN }
              }
            });
          }
        }
        break;

      case 'FECHA_FIN':
        if (data.value !== undefined) {
          if (this.FProyectos.FECHA_INICIO < data.value) {
            if (this.FProyectos.SUB_ESTADO !== 'Sin Iniciar') {
              if (data.value < this.FProyectos.FECHA_FIN) {
                this.showModal('La fecha Final de este proyecto no debe ser menor a la establecida anteriormente.');
              }
            }
            if (this.objReadOnly.readOnly === true) {
              this.objReadOnly.readOnlyPlantilla = true;
            } else {
              this.objReadOnly.readOnlyPlantilla = false;
            }
            if (this.selectPlantilla) {
              this.eventsSubjectDatos.next({
                accion: 'cargar datos',
                config: {
                  accion: 'update dataSource', dataSource: this.DTareas,
                  rangoFecha: { FECHA_INICIO: this.FProyectos.FECHA_INICIO, FECHA_FIN: this.FProyectos.FECHA_FIN }
                }
              });
            }
            this.conCambios++;
          } else {
            this.objReadOnly.readOnlyPlantilla = true;
            this.FProyectos.FECHA_FIN = this.FProyectos.FECHA_INICIO;
            this.showModal('La fecha final debe ser mayor a la fecha inicial');
          }
        }
        break;

      case 'DESCRIPCION':
        if (data.value !== '')
          this.conCambios++;
        break;
      case 'REFERENCIA':
        if (data.value !== '')
          this.conCambios++;
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
        },
      });
    }
  }

  onSelectPlantilla(e: any) {
    this.isGridBoxOpened = false;
    this.FProyectos.PLANTILLA = e.selectedRowKeys[0];
  }
  onSelectReferencia(e: any) {
    this.isGridBoxOpenedReferencia = false;
    this.FProyectos.REFERENCIA = e.selectedRowKeys[0];
  }


  onRespuestaComponent(e: any) {
    switch (e.accion) {
      case 'cargar nodo':
        // this.valoresObjetos('actividad', e.data);
        break;
      case 'update datasource':
        this.conCambios++;
        const post = this.DTareas.findIndex((row) => row.ID_ACTIVIDAD === e.data.ID_ACTIVIDAD)
        e.data.TEMP = e.data.ID_ACTIVIDAD_PADRE === 8000 ? -1 : e.data.ID_ACTIVIDAD_PADRE;
        e.data.USUARIO = this.USUARIO_LOCAL;
        e.data.CLASE = "TAREAS";
        if (!(e.data.ID_ACTIVIDAD >= 8001 && e.data.ID_ACTIVIDAD <= 8999)) {
          e.data.UPDATE = true;
        }
        e.data.TIPO = this.FProyectos.ID_DOCUMENTO;
        if (post > -1) {
          this.DTareas[post] = e.data
        } else {
          this.DTareas.push(e.data)
        }

        this.onRespuestaDatos.emit({
          accion: 'update datasource',
          data: {
            ENCABEZADO: this.FProyectos,
            TAREAS: this.DTareas
          },
          parametro: 'tareas'
        });
        break;

      case 'save column for user':
        this.sendStorageRequest(e.data);
        break;


      default:
        break;
    }
  }

  valoresObjetos(obj: string, data?: any) {
    if (obj === 'consecutivo') {
      const prm = { ID_APLICACION: this.sDatos.prmUsrAplBarReg.aplicacion, CLASE: 'PROYECTO' };
      this.sDatos.consulta('CONSECUTIVO', prm, this.sDatos.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        let res = JSON.parse(data.data);
        if (res.ErrMensaje !== '') {
          this.showModal(res.ErrMensaje);
        } else {
          if (res.CONSECUTIVO !== 0) {
            this.FProyectos.ID_DOCUMENTO = res.ID_DOCUMENTO;
            this.FProyectos.CONSECUTIVO = res.CONSECUTIVO;
          } else {
            this.FProyectos.ID_DOCUMENTO = '';
            this.FProyectos.CONSECUTIVO = '';
          }
        }
      });
    };
    if (obj === 'responsables' || obj === 'todos') {
      const prm: any = {};
      this.sDatos.getResponsables('RESPONSABLES', prm).subscribe(
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
            }
            this.DResponsables = res;
            this.eventsSubjectDatos.next({
              accion: 'cargar datos',
              config: {
                accion: 'update data config',
                parametro: 'RESPONSABLE',
                dataSource: res,
              },
            });
            this.eventsSubjectDatos.next({
              accion: 'cargar datos',
              config: {
                accion: 'update data config',
                parametro: 'COLABORADORES',
                dataSource: res,
              },
            });
            this.eventsGesInfo.next({
              accion: 'cargar datos',
              config: {
                accion: 'update data config',
                parametro: 'RESPONSABLE',
                dataSource: res,
              },
            });
            this.eventsGesInfo.next({
              accion: 'cargar datos',
              config: {
                accion: 'update data config',
                parametro: 'COLABORADORES',
                dataSource: res,
              },
            });
          }
        },
        (err: any) => {
          this.showModal(err.message, 'Error');
        }
      );
    };
    if (obj === 'plantillas' || obj === 'todos') {
      const prm = {};
      this.sDatos.consulta('PLANTILLAS', prm, this.sDatos.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        let res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== '') {
          this.DPlantillas = [];
          this.showModal(res.ErrMensaje);
        } else {
          this.DPlantillas = res;
          // this.valoresObjetos('codigos referencias');
        }
      });
    };
    if (obj === 'codigos referencias') {
      const prm = {};
      let plantillaS = typeof this.selectPlantilla === 'string' ? this.selectPlantilla : this.selectPlantilla[0];
      let plantilla = this.DPlantillas.filter((plantilla: any) => plantilla.ID_DOCUMENTO === plantillaS)[0];
      if (plantilla === undefined || plantilla === null || plantilla.TIPO === '') {
        this.isActiveGridReferencias = false;
        this.REFERENCIAS = [];
        showToast('Debe asignar el Tipo a la plantilla seleccionada.', 'warning');
        return;
      }
      this.isActiveGridReferencias = true;
      this.loadingVisible = true;
      this.sDatos.consulta(plantilla.TIPO, prm, this.sDatos.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        this.loadingVisible = false;
        let res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'error');
        } else {
          this.REFERENCIAS = res;
        }
      });
    };
    if (obj === 'configurar' || obj === 'todos') {
      this.loadingVisible = true;
      const prm = { ID_APLICACION: 'GES-007', PLANTILLA: 'PROYECTOS' };
      this.sDatos.consulta('CONFIGURACION TREELIST', prm, this.sDatos.prmUsrAplBarReg.aplicacion).subscribe(
        (data: any) => {
          this.loadingVisible = false;
          const res = validatorRes(data);
          if (data.token !== undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          const newArray = res;
          const mensaje = newArray[0].ErrMensaje;
          if (mensaje !== '') {
            showToast(mensaje, 'Error');
            this.DATOS_CONFIG = [];
          } else {
            this.DATOS_CONFIG = newArray;
            this.eventsSubjectDatos.next({
              accion: 'configurar',
              dataSource: this.DATOS_CONFIG,
            });

            this.valoresObjetos('config user treeList');
          }
        },
        (err: any) => {
          this.showModal(err.message, 'Error');
        }
      );
    };
    if (obj === 'estados' || obj === 'todos') {
      const prm: any = { ID_GRUPO_DOMINIO: 'ESTADOS GES' };
      this.sDatos.getEstados('ESTADOS', prm).subscribe(
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
            this.eventsSubjectDatos.next({
              accion: 'cargar datos',
              config: {
                accion: 'update data config',
                parametro: 'ESTADO',
                dataSource: res,
              },
            });
          }
        },
        (err: any) => {
          this.showModal(err.message, 'Error');
        }
      );
    }
    if (obj === 'config user treeList') {
      const prm: any = {
        ID_USUARIO: this.USUARIO_LOCAL,
        ID_APLICACION: this.sDatos.prmUsrAplBarReg.aplicacion,
        ID_OBJETO: 'TreeListTareas',
      };
      this._sdatos
        .getConsultaConfigObjeto('CONSULTA CONFIGURACION OBJETOS', prm)
        .subscribe((data: any) => {
          const res = validatorRes(data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          if (res[0].ErrMensaje !== '') {
            // showToast(res[0].ErrMensaje, 'error');
            // this.valoresObjetos('configurar');
            return;
          } else {


            let config_obj = JSON.parse(res[0].CONFIGURACION);
            this.eventsSubjectDatos.next({
              accion: 'config column for user',
              filtro: 'config',
              config: {
                accion: 'config column for user',
                dataSource: config_obj,
              },
            });
          }
        });
    }
  }


  showModal(mensaje: any, titulo = '¡Error!', msg_html = '') {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
      title: titulo,
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: "center",
      html: msg_html,
      stopKeydownPropagation: false,
    });
  }

  onTabChanged(e: any) {
    switch (e.itemIndex) {
      case 0:
        this.tabsProyectos[0].content = true;
        this.tabsProyectos[1].content = false;
        break;
      case 1:
        this.tabsProyectos[0].content = false;
        this.tabsProyectos[1].content = true;

        break;
      default:
        break;
    }
  }

  format(ratio) {
    let value = ratio * 100
    return `${value > 0 && value < 100 ? value.toFixed(2) : value}%`;
  }

  sendStorageRequest = (datos: any) => {
    const prm: any = {
      ID_APLICACION: this.sDatos.prmUsrAplBarReg.aplicacion,
      ID_USUARIO: this.USUARIO_LOCAL,
      ID_OBJETO: datos.obj,
      CONFIGURACION: datos.state,
    };
    this._sdatos
      .saveConfigObjeto('GUARDAR CONFIGURACION OBJETOS', prm)
      .subscribe(
        (data: any) => {
          const res = validatorRes(data);
          const mensaje = res[0].ErrMensaje;
          if (mensaje !== '') {
            showToast(mensaje, 'error');
          }
        },
        (err) => {
          this._sdatos.loadingVisible = false;
          this.showModal(err.message, 'error');
        }
      );
  };

  viewReferencia() {
    let plantillaS = typeof this.selectPlantilla === 'string' ? this.selectPlantilla : this.selectPlantilla[0];
    let plantilla = this.DPlantillas.filter((plantilla) => plantilla.ID_DOCUMENTO === plantillaS)[0];
    if (plantilla === undefined || plantilla === null || plantilla.TIPO === '') {
      return;
    }
    switch (plantilla.TIPO) {
      case 'PRODUCTOS':
        console.log('Va hacia productos');
        break;

      default:
        break;
    }
  }

}