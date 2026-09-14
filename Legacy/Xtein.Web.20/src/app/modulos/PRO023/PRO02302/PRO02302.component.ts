import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DxButtonGroupModule, DxButtonModule, DxCheckBoxModule, DxDateBoxModule, DxDropDownBoxModule, DxFormModule, DxListModule, DxNumberBoxModule, DxScrollViewModule, DxTabsModule, DxTreeListModule } from 'devextreme-angular';
import { Observable, Subject, Subscription, takeUntil } from 'rxjs';
import { PRO02303Component } from '../PRO02303/PRO02303.component';
import { PRO02304Component } from '../PRO02304/PRO02304.component';
import { PRO029Service } from 'src/app/services/PRO029/PRO029.service';
import { showToast } from 'src/app/shared/toast/toastComponent';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { PRO008Service } from 'src/app/services/PRO008/s_PRO008.service';
import dxCheckBox from 'devextreme/ui/check_box';
import { PRO023Service } from 'src/app/services/PRO023/PRO023.service';
import { validatorRes } from 'src/app/shared/validator/validator';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-PRO02302',
  templateUrl: './PRO02302.component.html',
  styleUrls: ['./PRO02302.component.css'],
  standalone: true,
  imports: [CommonModule, DxTabsModule, DxFormModule, DxDateBoxModule, DxCheckBoxModule, DxNumberBoxModule,
            DxScrollViewModule, DxButtonModule, DxButtonGroupModule, CdkAccordionModule, DxDropDownBoxModule,
            DxTreeListModule, DxListModule,
            PRO02303Component, PRO02304Component
  ]
})
export class PRO02302Component {


  @Input() eventProgramado: Observable<any>;
  @Output() onRespuestaDatos: EventEmitter<any> = new EventEmitter<any>();

  datosPassDiagram: Subject<any> = new Subject<any>();
  datosPassGrantt: Subject<any> = new Subject<any>();
  datosPassDashboard: Subject<any> = new Subject<any>();
  
  public _unsubscribeAll: Subject<any>;
  
  private eventsSubscription: Subscription;
  subscription: Subscription;

  tabsAgenda:any = [
    { id: 0, text: 'Tabla', icon: 'icon-postit-ol', content: false },
    { id: 1, text: 'DashBoard', icon: 'icon-matriz', content: false },
    { id: 2, text: 'Diagrama', icon: 'icon-tarea-sl', content: true }
  ];
  filtroCriterios:any = [
    { id: 0, text: 'Horarios (Aumentar horas)', value: false },
    { id: 1, text: 'Mover Mano Obra', value: false },
    { id: 2, text: 'Nueva Mano Obra', value: false },
    { id: 3, text: 'Capacidad Ociosa', value: false },
    { id: 4, text: 'Cuellos de Botella', value: false },
    { id: 5, text: 'Disminuir Mano Obra', value: false }
  ];
  DDiaSemana:any = [
    { id: 'DO', text: 'D' },
    { id: 'LU', text: 'L' },
    { id: 'MA', text: 'M' },
    { id: 'MI', text: 'M' },
    { id: 'JU', text: 'J' },
    { id: 'VI', text: 'V' },
    { id: 'SA', text: 'S' },
  ];
  selectedDiasSemana: string[] = [];
  selectSeccionSalidaCR2:any [];
  selectSeccionEntradaCR2:any [];
  selectSeccionCR3:any [];
  selectTurnos:any [] = [];
  DSecciones:any = [];
  itemsAccordion:any [] = [];
  accordionExpand: any = [];

  DataSource:any [] = [];
  DetalleProgramacion:any [] = [];
  Programacion:any [] = [];
  DGEmpleados:any []= [];
  Dturnos:any [] = [];
  selectEmpleados:any [] = [];
  DCriterios:any [] = [];
  FSimulador:any;

  openDropTurnos: boolean = false;
  openDropSeccSalidaCr2: boolean = false;
  openDropSeccEntradaCr2: boolean = false;
  openDropSeccCr3: boolean = false;
  activeFiltros:boolean = false;
  activeCriterio1:boolean = false;
  activeCriterio2:boolean = false;
  activeCriterio3:boolean = false;
  activeCriterio4:boolean = false;
  activeCriterio5:boolean = false;
  activeCriterio6:boolean = false;
  activeListEmpleados:boolean = false;
  loadingVisible:boolean = false;
  
  datos_filtro:any = [];
  datos_seccion:any = {};
  noDataEmpleados:string = '';
  
  fechaDesde: Date;
  fechaHasta: Date;

  constructor (
    private sData: PRO029Service,
    private sService: PRO023Service,
    private sDataSecciones: PRO008Service
  ) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.FSimulador = {
      FECHA_INICIO: null,
      FECHA_FINAL: null,
      FECHA_ENTREGA: null,
      ACTIVE_CRITERIO_1: false,
      ACTIVE_CRITERIO_2: false,
      ACTIVE_CRITERIO_3: false,
      CRITERIO_1: {ID_HORARIO: '', N_HORAS: 0, DIAS: []},
      CRITERIO_2: {ID_SECCION_ENTRADA:'', ID_SECCION_SALIDA:'', EMPLEADOS: []},
      CRITERIO_3: {FECHA_INGRESO: null, ID_SECCION: '', N_EMPLEADOS: 0}
    }
    this.valoresObjetos('secciones', '');
    this.valoresObjetos('turnos', '');
    this.eventsSubscription = this.eventProgramado.subscribe((datos: any) => {
      switch (datos.accion) {
        case 'Load Data':
          if (this.Programacion.length <= 0) {
            this.DataSource = datos.dataSource;
            this.fechaDesde = datos.fechas[0].FECHA_INICIO;
            this.fechaHasta = datos.fechas[0].FECHA_FINAL;
            this.valoresObjetos('DETALLE PROGRAMADO', '');
          } else {
            if (this.tabsAgenda[0].content) {
              this.datosPassDiagram.next({
                accion: 'Load Data',
                dataSource: this.Programacion,
                fechas: datos.fechas
              });
            } else if (this.tabsAgenda[1].content) {
              
            } else if (this.tabsAgenda[2].content) {
              this.datosPassGrantt.next({
                accion: 'Load Data',
                dataSource: this.Programacion,
                fechas: datos.fechas
              });
              
            }
          }
          break;

        default:
          break;
      }
    });
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
    this._unsubscribeAll.next('');
    this._unsubscribeAll.complete();
  }

  onTabChanged(e: any) {
    switch (e.itemIndex) {
      case 0:
        this.tabsAgenda[0].content = true;
        this.tabsAgenda[1].content = false;
        this.tabsAgenda[2].content = false;
        // setTimeout(() => {
        //   this.datosPass.next({
          //   accion: 'Consulta',
          //   dataSource: datos.dataSource
          // });
        // }, 500);
        break;
      case 1:
        this.tabsAgenda[0].content = false;
        this.tabsAgenda[1].content = true;
        this.tabsAgenda[2].content = false;
        // setTimeout(() => {
        //   this.eventsDatosCalendario.next({
        //     accion: 'init',
        //     config: { accion: 'init', dataSource: this.DataResTareas },
        //   });
        // }, 500);
        break;
      case 2:
        this.tabsAgenda[0].content = false;
        this.tabsAgenda[1].content = false;
        this.tabsAgenda[2].content = true;
        // setTimeout(() => {
        //   this.eventsDatosCalendario.next({
        //     accion: 'init',
        //     config: { accion: 'init', dataSource: this.DataResTareas },
        //   });
        // }, 500);
        break;
      default:
        break;
    }
  }

  onValueChangedFechaLimite(e:any) {
    // this.FSimulador.FECHA_ENTREGA = e.value;
    // if (this.tabsAgenda[0].content) {
    //   this.datosPassDiagram.next({
    //     accion: 'Load Fecha Limite',
    //     fecha: this.FSimulador.FECHA_ENTREGA
    //   });
    // } 
    // else if (this.tabsAgenda[1].content) {
      
    // } else 
    if (this.tabsAgenda[2].content) {
      this.datosPassGrantt.next({
        accion: 'Load Fecha Limite',
        fechas: {FECHA_ENTREGA: this.FSimulador.FECHA_ENTREGA, FECHA_INICIO: this.FSimulador.FECHA_INICIO, FECHA_FINAL: this.FSimulador.FECHA_FINAL}
      });
    }
  }

  onValueChangedCiterio(e:any, criterio:string) {
    switch (criterio) {
      case 'activeCriterio1':
        this.activeCriterio1 = e.value;
        this.FSimulador.ACTIVE_CRITERIO_1 = e.value;
        break;
      case 'activeCriterio2':
        this.activeCriterio2 = e.value;
        this.FSimulador.ACTIVE_CRITERIO_2 = e.value;
        break;
      case 'activeCriterio3':
        this.activeCriterio3 = e.value;
        this.FSimulador.ACTIVE_CRITERIO_3 = e.value;
        break;
      // case 'activeCriterio4':
      //   this.activeCriterio4 = e.value;
      //   this.FSimulador.ACTIVE_CRITERIO_4 = e.value;
      //   break;
      // case 'activeCriterio5':
      //   this.activeCriterio5 = e.value;
      //   this.FSimulador.ACTIVE_CRITERIO_5 = e.value;
      //   break;
      // case 'activeCriterio6':
      //   this.activeCriterio6 = e.value;
      //   this.FSimulador.ACTIVE_CRITERIO_6 = e.value;
      //   break;
    
      default:
        break;
    }
  };

  onRespuestaComponent(datos: any, componenet: string) {
    switch (componenet) {
      case 'GANTT':
        switch (datos.accion) {
          case 'Cargar Sesion Filtro':
            this.activeFiltros = false;
            this.Programacion = datos.dataSource;
            this.DetalleProgramacion = datos.dataSource;
            break;

          default:
            break;
        }
        break;

      default:
        break;
    }

  };

  onValueChangedCriterio1(e:any) {
    this.FSimulador.CRITERIO_1.N_HORAS = e.value;
  }
  selectDia(e:any) {
    if (e.removedItems.length > 0) {
      e.removedItems.forEach((ele:any) => {
        const npos:any = this.FSimulador.CRITERIO_1.DIAS.findIndex((d:any) => d === ele.id);
        this.FSimulador.CRITERIO_1.DIAS.splice(npos, 1);
      });
    }
    if (e.addedItems.length > 0) {
      e.addedItems.forEach((ele:any) => {
        const npos:any = this.FSimulador.CRITERIO_1.DIAS.findIndex((d:any) => d === ele.id);
        if (npos === -1)
          this.FSimulador.CRITERIO_1.DIAS.push(ele.id);
      });
    }
  }

  onCellPrepared(e: any): void {
    // Solo deja seleccionables las Proceso
    if (
      e.rowType == "data" &&
      e.cellElement.querySelector(".dx-select-checkbox")
    ) {
      const check = e.cellElement.querySelectorAll(".dx-select-checkbox");
      check.forEach((ele: any, ixfila: any) => {
        const inst = dxCheckBox.getInstance(ele);
        if (e.data.TIPO === 'PROCESO')
          inst.option("visible", true);
        else 
          inst.option("visible", false);
      });
    }
  }
  selectSeccion(e: any, criterio:string, secc: string) {
    switch (criterio) {
      case 'CR2':
        if (secc === 'Salida') {
          this.FSimulador.CRITERIO_2.ID_SECCION_SALIDA = e.selectedRowsData[0].ID_SECCION;
        } else if (secc === 'Entrada') {
          this.FSimulador.CRITERIO_2.ID_SECCION_ENTRADA = e.selectedRowsData[0].ID_SECCION;
        }
        break;
    
      case 'CR3':
        this.FSimulador.CRITERIO_3.ID_SECCION = e.selectedRowsData[0].ID_SECCION;
        break;

      default:
        break;
    }
  }

  onSelectTurno(e:any) {
    this.FSimulador.CRITERIO_1.ID_HORARIO = this.selectTurnos[0];
    this.openDropTurnos = false;
  }

  onSelectListaEmpleados(e:any) {
    this.FSimulador.CRITERIO_2.EMPLEADOS = this.selectEmpleados;
  }

  aceptarBottom(e: any, btn: any, criterio:string, secc:string) {
    switch (btn) {
      case 'Aceptar':

        switch (criterio) {
          case 'CR2':
            if (secc === 'Salida') {
              this.openDropSeccSalidaCr2 = false;
              if (this.selectSeccionSalidaCR2.length > 0) {
                this.itemsAccordion = [];
                this.selectSeccionSalidaCR2.forEach((ele:any) => {
                  const secc = this.DSecciones.filter((d:any) => d.ITEM === ele);
                  const nombre:string = secc[0].DESCRIPCION;
                  if (this.itemsAccordion.findIndex((e:any) => e === nombre) === -1)
                    this.itemsAccordion.push(nombre)
                });
                this.activeListEmpleados = true;
              }
            } else if (secc === 'Entrada') {
              this.openDropSeccEntradaCr2 = false;
            }
            break;
            
          case 'CR3':
            this.openDropSeccCr3 = false;
            break;
        
          default:
            break;
        }
        break;

      case 'Cancelar':
        switch (criterio) {
          case 'CR2':
            if (secc === 'Salida') {
              this.openDropSeccSalidaCr2 = false;
              this.selectSeccionSalidaCR2 = [];
            } else if (secc === 'Entrada') {
              this.openDropSeccEntradaCr2 = false;
              this.selectSeccionEntradaCR2 = [];
            }
            break;
            
          case 'CR3':
            this.openDropSeccCr3 = false;
            this.selectSeccionCR3 = [];
            break;
        
          default:
            break;
        }
        break;

      default:
        break;
    }
  }

  onValueChangedTurno(e:any) {
    if (e.value === undefined || e.value === null || e.value.length <= 0) {
      this.selectTurnos = [];
    } else {
      this.selectTurnos = e.value;
      // this.FSimulador.CRITERIO_1.ID_TURNO = this.selectTurnos;
    }
  }

  onValueChangedSecciones(e:any, criterio:string, secc:string) {
    if (e.value === undefined || e.value === null || e.value.length <= 0) {
      switch (criterio) {
        case 'CR2':
          this.itemsAccordion = [];
          this.activeListEmpleados = false;
          break;
          
        case 'CR3':
          
          break;
      
        default:
          break;
      }
    }
  }

  calcularFechas(e:any) {
    const prm = {CRITERIOS: this.FSimulador};
    // API guardado de datos
    this.loadingVisible = true;
    this.sService.consulta_fechas('APLICAR CRITERIOS', prm, 'PRO023').subscribe((data) => {
      this.loadingVisible = false;
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      if (res[0].ErrMensaje !== '') {
        showToast(res[0].ErrMensaje, 'Error');
      } else {
        showToast('Registro actualizado', 'success');
      }
    });
  }


  opPrepararGuardar(accion: string): void {
    const prm = {PRODUCTOS: this.FSimulador};
    // API guardado de datos
    // this.loadingVisible = true;
    // this.sData.save(accion, prm).subscribe((data) => {
    //   this.loadingVisible = false;
    //   const res = JSON.parse(data.data);
    //   if ( (data.token != undefined) ){
    //     const refreshToken = data.token;
    //     localStorage.setItem("token", refreshToken);
    //   }
    //   if (res[0].ErrMensaje !== '') {
    //     showToast(res[0].ErrMensaje, 'Error');
    //   } else {
    //     showToast('Registro actualizado', 'success');
    //   }
    // });
    this.onRespuestaDatos.emit({ACCION: 'guardar datos'});
	}

  valoresObjetos(obj: string, datos:any){
    if (obj === 'DETALLE PROGRAMADO') {
      const prm = {PRODUCTOS: this.DataSource};
      this.sService.consulta_fechas("DETALLE PROGRAMADO", prm, 'PRO023')
      .subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        };
        if (res[0].ErrMensaje !== undefined && res[0].ErrMensaje !== null && res[0].ErrMensaje !== '') {
          showToast(res.ErrMensaje, 'error');
        } else {
          this.Programacion = res;
          if (this.tabsAgenda[0].content) {
            this.datosPassDiagram.next({
              accion: 'Load Data',
              dataSource: this.Programacion
            });
          } else if (this.tabsAgenda[1].content) {
            
          } else if (this.tabsAgenda[2].content) {
            this.datosPassGrantt.next({
              accion: 'Load Data',
              dataSource: this.Programacion
            });
            
          }
        }
      });
    };
    if (obj === 'secciones' || obj === 'todos') {
      // Carga las secciones registradas
      this.sDataSecciones
      .getSecciones({ FILTRO: "" })
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }        
        for (let i = 0; i < res.length; i++) {
          res[i].COD = i;
        }
        this.DSecciones = res.filter((d:any) => d.TIPO === 'Planta' || d.TIPO === 'PROCESO');
      });
    };
    if (obj === 'empleados secciones') {
      // this.DGEmpleados = [];
      const id_secc:any = this.DSecciones.filter((d:any) => d.DESCRIPCION === datos);
      const prm = {ID_SECCION: id_secc[0].ID_SECCION};
      this.sService.consulta_fechas("EMPLEADOS SECCIONES", prm, 'PRO023')
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        };
        if (res[0].ErrMensaje !== '') {
          this.noDataEmpleados = res[0].ErrMensaje;
        } else {
          this.DGEmpleados = res;
        }
      });
    };
    if (obj === 'turnos' || obj === 'todos') {
      const prm = { };
      this.sData.consulta('TURNOS', prm, 'PRO023').subscribe((data: any) => {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'Error');
          return;
        } else {
          const newArray = res;
          this.Dturnos = newArray;
        };
      },
        (err => {
          this.showModal(err.message, 'Error');
        })
      );
    };
  }

  showModal(mensaje:any, titulo:any='¡Error!', msg_html:any= '') {
    let iconHtml = "<i class='icon-cancelar-ol error-color'></i>";
    if (titulo !== '¡Error!') iconHtml = "<i class='icon-alert-ol'></i>";
    Swal.fire({
      iconHtml: iconHtml,
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

}
