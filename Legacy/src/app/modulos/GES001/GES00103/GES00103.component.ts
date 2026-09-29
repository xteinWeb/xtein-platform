import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import notify from 'devextreme/ui/notify';
import Swal from 'sweetalert2';
import { validatorRes } from 'src/app/shared/validator/validator';
import { clsGesActividades } from '../clsGES001.class';
import { GES001Service } from 'src/app/services/GES001/GES001.service';
import { Observable, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import { DxButtonModule, DxDateBoxModule, DxListModule, DxToolbarModule } from 'devextreme-angular';
import { GESPROINFOComponent } from '../GESPROINFO/GESPROINFO.component';
import { GES00Service } from 'src/app/shared/Tareas/Service/GES00.service';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { showToast } from '../../../shared/toast/toastComponent.js'
import { CdkAccordionModule } from '@angular/cdk/accordion';

@Component({
  selector: 'app-GES00103',
  templateUrl: './GES00103.component.html',
  styleUrls: ['./GES00103.component.css'],
  standalone: true,
  imports: [CommonModule, MatCardModule, DxDateBoxModule, DxButtonModule, CdkAccordionModule, GESPROINFOComponent, DxToolbarModule, DxListModule]
})
export class GES00103Component implements OnInit {

  @Input() Filtros: any;
  @Input() eventsDatos: Observable<any>;

  @Output() onRespuestaComponent: EventEmitter<any> = new EventEmitter<any>();

  private eventsSubscription: Subscription;
  subscriptionActividades: Subscription;
  subs_filtros: Subscription;

  DActividades: any [] = [];
  ActividadesSinIniciar: any [] = [];
  ActividadesEnProceso: any [] = [];
  ActividadesEnPausa: any [] = [];
  ActividadesFinalizadas: any [] = [];
  grupos:any = ['Responsabilidades', 'Tareas', 'Eventos'];
  itemsFilters:any = [
    {ITEM: 1, ID_FILTRO:'MIS_ACTIVIDADES', DESCRIPCION: 'Mis Actividades'},
    {ITEM: 2, ID_FILTRO:'ASIGNADAS', DESCRIPCION: 'Asignadas'},
    {ITEM: 3, ID_FILTRO:'AREA_FUNCIONAL', DESCRIPCION: 'Area Funcional'},
    {ITEM: 4, ID_FILTRO:'COLABORADOR', DESCRIPCION: 'Colaborador'},
    {ITEM: 5, ID_FILTRO:'FINALIZADAS', DESCRIPCION: 'Finalizadas'}
  ]
  accordionExpand = [false,false,false];
  dropDownButton: any;
  
  filtroMaestro: any = [
    {ID: 1, DESCRIPCION: 'Activas', VALOR: false },
    {ID: 2, DESCRIPCION: 'Finalizadas', VALOR: false }
  ];
  filtroActividades: any = [true,false,false,false];

  USUARIO_LOCAL: any = '';
  esEdicion: boolean = false;

  constructor(
    private _sdatos: GES001Service,
    private Ges00Service: GES00Service,
    private _sgenerales: GeneralesService
  ) {
    // this.subscriptionActividades = this._sdatos
    // .getObsTablas().subscribe((data:any) => {
    //   switch (data.accion) {
    //     case 'cargar datos':
    //       if(data.dataSource.length > 0) {
    //         const newArray:any = data.dataSource;
    //         this.ActividadesSinIniciar = newArray.filter((d:any) => d.ESTADO === 'Sin Iniciar');
    //         this.ActividadesEnPausa = newArray.filter((d:any) => d.ESTADO === 'En Pausa');
    //         this.ActividadesEnProceso = newArray.filter((d:any) => d.ESTADO === 'En Proceso');
    //         this.ActividadesFinalizadas = newArray.filter((d:any) => d.ESTADO === 'Finalizado');
    //       } else {
    //         this.ActividadesFinalizadas = [];
    //         this.ActividadesEnProceso = [];
    //         this.ActividadesEnPausa = [];
    //         this.ActividadesSinIniciar = [];
    //       }
    //       break;
    //     case 'r_refrescar':
    //       this.valoresObjetos('todos');  
    //       break;
      
    //     default:
    //       break;
    //   }
    //   // if (data.accion === 'r_refrescar')
    //   //   this.valoresObjetos('todos');
    // });

    // this.subs_filtros = this._sdatos
    // .getObsFiltros().subscribe((data:any) => {
    //   switch (data.accion) {
    //     case 'filtrar':
    //       this.filtroMaestro = data.filtroMaestro;
    //       this.filtroActividades = data.filtroActividades;
    //       this.onValueChangedFiltro(data);
    //       break;

    //     default:
    //       break;
    //   }
    // });

  }

  ngOnInit(): void {
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
          this.updateData(datos.config);
          break;

        default:
          break;
      }
    });
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

  loadDataInit(data:any) {
    switch (data.accion) {
      case 'init':
        if(data.dataSource.length > 0) {
          const newArray:any = data.dataSource;
          this.ActividadesSinIniciar = newArray.filter((d:any) => d.ESTADO === 'Sin Iniciar');
          this.ActividadesEnPausa = newArray.filter((d:any) => d.ESTADO === 'En Pausa');
          this.ActividadesEnProceso = newArray.filter((d:any) => d.ESTADO === 'En Proceso');
          this.ActividadesFinalizadas = newArray.filter((d:any) => d.ESTADO === 'Finalizado');
        } else {
          this.ActividadesFinalizadas = [];
          this.ActividadesEnProceso = [];
          this.ActividadesEnPausa = [];
          this.ActividadesSinIniciar = [];
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
          const newArray:any = data.dataSource;
          this.ActividadesSinIniciar = newArray.filter((d:any) => d.ESTADO === 'Sin Iniciar');
          this.ActividadesEnPausa = newArray.filter((d:any) => d.ESTADO === 'En Pausa');
          this.ActividadesEnProceso = newArray.filter((d:any) => d.ESTADO === 'En Proceso');
          this.ActividadesFinalizadas = newArray.filter((d:any) => d.ESTADO === 'Finalizado');
        } else {
          this.ActividadesFinalizadas = [];
          this.ActividadesEnProceso = [];
          this.ActividadesEnPausa = [];
          this.ActividadesSinIniciar = [];
        }
      break;
        
      case 'update data config':
        // this.JsonDataSource[data.parametro] = data.dataSource;
      break;
    
      default:
        break;
    }
  }

  onInitializedBtnFilter = (e:any) => {
    this.dropDownButton = e.component;
  };

  opBlancearForma() {
    this.DActividades = [];
    this.ActividadesSinIniciar = [];
    this.ActividadesEnPausa = [];
    this.ActividadesEnProceso = [];
    this.ActividadesFinalizadas = [];
  }

  showChatsComentarios(e:any, data:any) {
    this._sdatos.setObsGesproInfo({
      TITULO: data.NOMBRE,
      VISIBLE: true,
      DATA: data
    });
  }

  onValueChangedFiltro(e:any) {
    this.ActividadesFinalizadas = [];
    this.ActividadesEnProceso = [];
    this.ActividadesEnPausa = [];
    this.ActividadesSinIniciar = [];

    const Nodos:any = JSON.parse(JSON.stringify(this.DActividades.filter((d:any) => d.CLASE === 'NODOS')));

    //APLICA EL FILTRO MAESTRO
    var DMaestro = JSON.parse(JSON.stringify(this.DActividades.filter((d:any) => d.CLASE !== 'NODOS')));
    if (this.filtroMaestro[0].VALOR && !this.filtroMaestro[1].VALOR)
      DMaestro = JSON.parse(JSON.stringify(DMaestro.filter((d:any) => d.ESTADO !== 'FINALIZADO')));
    if (!this.filtroMaestro[0].VALOR && this.filtroMaestro[1].VALOR)
      DMaestro = JSON.parse(JSON.stringify(DMaestro.filter((d:any) => d.ESTADO == 'FINALIZADO')));

    //SE APLICA LOS SUB-FILTROS
    let DFiltrados:any = [];
    if(this.filtroActividades[0]) {
      const misAct:any = JSON.parse(JSON.stringify(DMaestro.filter((d:any) => d.ACT_MIAS === true)));
      for (let i = 0; i < misAct.length; i++) {
        if(DFiltrados.findIndex((a:any) => a.ID_ACTIVIDAD === misAct[i].ID_ACTIVIDAD) === -1)
          DFiltrados.push(misAct[i]);
      }
    }
    if(this.filtroActividades[1]) {
      const asig:any = JSON.parse(JSON.stringify(DMaestro.filter((d:any) => d.ACT_ASIG === true)));
      for (let i = 0; i < asig.length; i++) {
        if(DFiltrados.findIndex((a:any) => a.ID_ACTIVIDAD === asig[i].ID_ACTIVIDAD) === -1)
          DFiltrados.push(asig[i]);
      }
    }
    if(this.filtroActividades[2]) {
      const Area:any = JSON.parse(JSON.stringify(DMaestro.filter((d:any) => d.ACT_AREA === true)));
      for (let i = 0; i < Area.length; i++) {
        if(DFiltrados.findIndex((a:any) => a.ID_ACTIVIDAD === Area[i].ID_ACTIVIDAD) === -1)
          DFiltrados.push(Area[i]);
      }

    }
    if(this.filtroActividades[3]) {
      const col:any = JSON.parse(JSON.stringify(DMaestro.filter((d:any) => d.ACT_COLAB === true)));
      for (let i = 0; i < col.length; i++) {
        if(DFiltrados.findIndex((a:any) => a.ID_ACTIVIDAD === col[i].ID_ACTIVIDAD) === -1)
          DFiltrados.push(col[i]);
      }
    }

    DFiltrados.forEach((tarea:any) => {
      if (DFiltrados.findIndex((d:any) => tarea.ID_ACTIVIDAD_PADRE === d.ID_ACTIVIDAD ) === -1 ) {
        if ( tarea.CLASE === 'TAREAS'){
          tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
          tarea.ID_ACTIVIDAD_PADRE = -10;
        };
        if ( tarea.CLASE === 'RESPONSABILIDADES'){
          tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
          tarea.ID_ACTIVIDAD_PADRE = -20;
        };
        if ( tarea.CLASE === 'EVENTOS'){
          tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
          tarea.ID_ACTIVIDAD_PADRE = -30;
        };
      };
    });

    if(DFiltrados.length > 0) {
      const newArray:any = [...Nodos, ...DFiltrados];
      this.ActividadesSinIniciar = newArray.filter((d:any) => d.ESTADO === 'Sin Iniciar');
      this.ActividadesEnPausa = newArray.filter((d:any) => d.ESTADO === 'En Pausa');
      this.ActividadesEnProceso = newArray.filter((d:any) => d.ESTADO === 'En Proceso');
      this.ActividadesFinalizadas = newArray.filter((d:any) => d.ESTADO === 'Finalizado');
    } else {
      this.ActividadesFinalizadas = [];
      this.ActividadesEnProceso = [];
      this.ActividadesEnPausa = [];
      this.ActividadesSinIniciar = [];
    }

  }

  valoresObjetos(obj: string) {
    if (obj === 'actividades' || obj === 'todos'){
      const prm:any = {USUARIO: this.USUARIO_LOCAL};
      this._sdatos.getActividades('ACTIVIDADES', prm).subscribe((data: any)=> {
        const res = validatorRes(data);
        if ( (data.token !== undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if(res[0].ErrMensaje !== '') {
          // showToast(res[0].ErrMensaje, 'error');
          this.DActividades = [];
          return;
        }
        this.DActividades = res;
        for (let i = 0; i < this.DActividades.length; i++) {
          const element = this.DActividades[i];
          element.ITEM = i;
          element.visibleBtnAgregar = false;
          element.visibleBtnComentarios = false;
        };

        this.DActividades.forEach((ele:any) => {
          if(ele.CLASE !== 'NODOS') {
            const npos:any [] = this.DActividades.filter((d:any) =>  ele.ID_ACTIVIDAD ===  d.ID_ACTIVIDAD_PADRE);
            if( npos.length > 0 ) {
              ele.SUB_TAREAS = [];
              npos.forEach((dato:any) => {
                ele.SUB_TAREAS.push(dato);
                const pos:any = this.DActividades.findIndex((d:any) =>  dato.ID_ACTIVIDAD ===  d.ID_ACTIVIDAD);
                this.DActividades.splice(pos, 1);
              });
            } else {
              ele.SUB_TAREAS = [];
            }
          }
          else {
            ele.SUB_TAREAS = [];
          }
        });

        this.ActividadesSinIniciar = this.DActividades.filter((d:any) => d.ESTADO === 'Sin Iniciar');
        this.ActividadesEnPausa = this.DActividades.filter((d:any) => d.ESTADO === 'En Pausa');
        this.ActividadesEnProceso = this.DActividades.filter((d:any) => d.ESTADO === 'En Proceso');
        this.ActividadesFinalizadas = this.DActividades.filter((d:any) => d.ESTADO === 'Finalizado');

        if (this._sgenerales.D_USUARIOS.length > 0) {
          this.DActividades.forEach((eleres) => {
            eleres.COLABORADORES.forEach(elecol => {
              const ix = this._sgenerales.D_USUARIOS.findIndex(r => r.USUARIO === elecol.ID_RESPONSABLE);
              if (ix !== -1) {
                elecol.FOTO = this._sgenerales.D_USUARIOS[ix].path;
              }
            });
          })
        } else {
          // Baja las imagenes
          this._sgenerales.bajar_imagen('bajar imagenes', { RESPONSABLES: [{}], 
            params: { comprimir: true, tamX: 300, tamY: 400 } },'spActividades')
            .subscribe({
            next: (varch: any)=> {
              // Adiciona el path en el vector de la galería
              if (varch[0].ErrMensaje === '') {
                this.DActividades.forEach((eleres) => {
                  eleres.COLABORADORES.forEach(elecol => {
                    const ix = varch.findIndex(r => r.etiqueta === elecol.ID_RESPONSABLE);
                    if (ix !== -1) {
                      elecol.FOTO = varch[ix].path;
                    }
                  });
                })
              }
            },
            error: (err => {
              this.showModal('Error procesando imagenes: '+err.message);
            })
          });
        }


      });
    };
  }

  showModal(mensaje:any) {
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

}
