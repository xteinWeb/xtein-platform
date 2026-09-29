import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import Swal from 'sweetalert2';
import { validatorRes } from 'src/app/shared/validator/validator';
import { Observable, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { DxButtonModule, DxDateBoxModule, DxListModule, DxPopupModule, DxProgressBarModule, DxSortableModule, DxToolbarModule } from 'devextreme-angular';
import { GES00Service } from 'src/app/shared/Tareas/Service/GES00.service';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { GES007Service } from 'src/app/services/GES007/GES007.service';
import { showToast } from 'src/app/shared/toast/toastComponent.js';


@Component({
  selector: 'app-GES00702',
  templateUrl: './GES00702.component.html',
  styleUrls: ['./GES00702.component.css'],
  standalone: true,
  imports: [CommonModule, MatCardModule, DxDateBoxModule, DxButtonModule, CdkAccordionModule, DxToolbarModule, DxListModule, DxSortableModule, DxProgressBarModule, DxPopupModule]
})
export class GES00702Component implements OnInit {

  @Input() Filtros: any;
  @Input() eventsDatos: Observable<any>;
  @Input() proyecData: any;

  @Output() onRespuestaDatos: EventEmitter<any> = new EventEmitter<any>();

  container: any
  private eventsSubscription: Subscription;
  subscriptionActividades: Subscription;
  subs_filtros: Subscription;
  DActividades: any[] = [];
  PSinIniciar: any[] = [];
  PEnProceso: any[] = [];
  PEnPausa: any[] = [];
  PFinalizados: any[] = [];
  grupos: any = ['Responsabilidades', 'Tareas', 'Eventos'];
  itemsFilters: any = [
    { ITEM: 1, ID_FILTRO: 'MIS_ACTIVIDADES', DESCRIPCION: 'Mis Actividades' },
    { ITEM: 2, ID_FILTRO: 'ASIGNADAS', DESCRIPCION: 'Asignadas' },
    { ITEM: 3, ID_FILTRO: 'AREA_FUNCIONAL', DESCRIPCION: 'Area Funcional' },
    { ITEM: 4, ID_FILTRO: 'COLABORADOR', DESCRIPCION: 'Colaborador' },
    { ITEM: 5, ID_FILTRO: 'FINALIZADAS', DESCRIPCION: 'Finalizadas' }
  ]
  accordionExpand = [false, false, false];
  dropDownButton: any;

  filtroMaestro: any = [
    { ID: 1, DESCRIPCION: 'Activas', VALOR: false },
    { ID: 2, DESCRIPCION: 'Finalizadas', VALOR: false }
  ];
  filtroActividades: any = [true, false, false, false];

  USUARIO_LOCAL: any = '';
  esEdicion: boolean = false;
  changeStatus: string = 'Activar'


  maxValue: number = 100;
  popupActionsVisible: boolean = false;
  DProyectos: any;

  constructor(
    private _sdatos: GES007Service,
    private Ges00Service: GES00Service,
    private _sgenerales: GeneralesService
  ) {
  }

  ngOnInit(): void {
    this.container = document.getElementById('container-body');
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.eventsSubscription = this.eventsDatos.subscribe((datos: any) => {
      switch (datos.accion) {
        case 'init':
          this.loadDataInit(datos.config);
          break;

        case 'configurar':
          // this.configComponent(datos.dataSource);
          break;

        case 'cargar datos':
          if (datos.changeStatus === 0) {
            this.changeStatus = 'Inactivar'
          } else {
            this.changeStatus = 'Activar'
          }
          this.updateData(datos.config);
          break;
        case 'filtrar datos':
          this.filtrarProyectos(datos.textFilter);
          break;

        default:
          break;
      }
    });
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

  loadDataInit(data: any) {
    switch (data.accion) {
      case 'init':
        this.PFinalizados = [];
        this.PEnProceso = [];
        this.PEnPausa = [];
        this.PSinIniciar = [];
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
          const newArray: any = data.dataSource;
          this.DProyectos = data.dataSource;
          this.proyecData = newArray;
          this.PSinIniciar = newArray.filter((d: any) => d.SUB_ESTADO === 'Sin Iniciar');
          this.PEnPausa = newArray.filter((d: any) => d.SUB_ESTADO === 'En Pausa');
          this.PEnProceso = newArray.filter((d: any) => d.SUB_ESTADO === 'En Proceso');
          this.PFinalizados = newArray.filter((d: any) => d.SUB_ESTADO === 'Finalizado');
        } else {
          this.PFinalizados = [];
          this.PEnProceso = [];
          this.PEnPausa = [];
          this.PSinIniciar = [];
        }
        break;

      case 'update data config':
        // this.JsonDataSource[data.parametro] = data.dataSource;
        break;

      default:
        break;
    }
  }

  onInitializedBtnFilter = (e: any) => {
    this.dropDownButton = e.component;
  };

  opBlancearForma() {
    this.DActividades = [];
    this.PSinIniciar = [];
    this.PEnPausa = [];
    this.PEnProceso = [];
    this.PFinalizados = [];
  }

  dblclick(e: any, proyecto: any) {
    this.onRespuestaDatos.emit({
      accion: 'view gantt',
      dataSource: proyecto,
      position: this.DProyectos.findIndex((data: any) => data.ID_DOCUMENTO === proyecto.ID_DOCUMENTO) + 1
    });
  }

  valoresObjetos(obj: string) {

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

  openPopupActions() {
    this.popupActionsVisible = true;
  }

  gestionProyect(proyecto: any) {
    if (proyecto.ID_DOCUMENTO) {
      this.onRespuestaDatos.emit({
        accion: 'view gantt',
        dataSource: proyecto,
        position: this.DProyectos.findIndex((data: any) => data.ID_DOCUMENTO === proyecto.ID_DOCUMENTO) + 1
      });
    }
  }

  viewProyect(proyecto: any) {
    if (proyecto.ID_DOCUMENTO) {
      this.onRespuestaDatos.emit({
        accion: 'view form',
        dataSource: proyecto,
        position: this.DProyectos.findIndex((data: any) => data.ID_DOCUMENTO === proyecto.ID_DOCUMENTO) + 1
      });
    }
  }

  opEliminar(proyecto): void {
    // Confirma...
    Swal.fire({
      title: '',
      text: '',
      html: "¿Desea eliminar el Proyecto <i>" +
        proyecto.NOMBRE +
        "</i> ?",
      iconHtml: "<i class='icon-alert-ol'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      // Procesa eliminación. Llama a la API para validar referenciación y 
      // eliminación en tabla
      if (result.isConfirmed) {
        this.deleteProyect(proyecto);
      }
    });

  }

  deleteProyect(proyecto: any) {
    if (proyecto) {
      const prm: any = { ID_DOCUMENTO: proyecto.ID_DOCUMENTO, CONSECUTIVO: proyecto.CONSECUTIVO };
      this._sdatos.consulta('delete', prm, this._sdatos.prmUsrAplBarReg.aplicacion).subscribe(
        (data: any) => {
          const res = validatorRes(data);
          if (res[0].ErrMensaje === '') {
            const proyectos = this.proyecData.filter((x: any) => x.ID_DOCUMENTO !== proyecto.ID_DOCUMENTO)
            this.updateData({ accion: 'update dataSource', dataSource: proyectos });
            setTimeout(() => {
              this.onRespuestaDatos.emit({
                accion: 'get data',
                DESCRIPCION: 'Elimino el proyecto',
                dataSource: proyecto
              });
            }, 300);
            showToast('El proyecto se elimino con exito!.', 'success');
          } else {
            this.showModal(res[0].ErrMensaje);
          }
        })
    }
  }
  FNChangeStatus(proyecto) {
    if (this.changeStatus === 'Inactivar') {
      proyecto.ESTADO = 'INACTIVO'
    } else if (this.changeStatus === 'Activar') {
      proyecto.ESTADO = 'ACTIVO'
    }
    let data = {
      ENCABEZADO: proyecto,
      TAREAS: proyecto.TAREAS
    }
    this.opPrepararGuardar('update', data);
  };

  opPrepararGuardar(accion: string, proyecto: any): void {
    this._sdatos.consulta(accion, proyecto, this._sdatos.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== "") {
          this.showModal(res[0].ErrMensaje);
        } else {
          setTimeout(() => {
            this.onRespuestaDatos.emit({
              accion: 'get data',
              DESCRIPCION: 'Cambio el estado del proyecto a ' + proyecto.ENCABEZADO.ESTADO,
              dataSource: res[0]
            });
          }, 300);
          showToast('Cambio de estado actualizado', 'success');
        };
      });
  };

  filtrarProyectos(textFilter: string) {
    const data_prev = this.DProyectos;
    let newArray = [];
    if (textFilter.length > 2) {
      const proyectos = this.DProyectos.filter((proyecto: any) =>
        proyecto.NOMBRE.toLowerCase().includes(textFilter.toLowerCase())
        || proyecto.DESCRIPCION.toLowerCase().includes(textFilter.toLowerCase())
        // || proyecto.FE.toLowerCase().includes(textFilter.toLowerCase())
      );
      if (proyectos.length > 0) {
        newArray = proyectos;
      } else {
        newArray = data_prev;
      };
    } else {
      newArray = data_prev;
    }
    this.PSinIniciar = newArray.filter((d: any) => d.SUB_ESTADO === 'Sin Iniciar');
    this.PEnPausa = newArray.filter((d: any) => d.SUB_ESTADO === 'En Pausa');
    this.PEnProceso = newArray.filter((d: any) => d.SUB_ESTADO === 'En Proceso');
    this.PFinalizados = newArray.filter((d: any) => d.SUB_ESTADO === 'Finalizado');
  };
}


