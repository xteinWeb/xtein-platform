import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import {
  DxButtonModule,
  DxCheckBoxModule,
  DxDropDownBoxModule,
  DxDropDownButtonModule,
  DxListModule,
  DxLoadPanelModule,
  DxTabsModule,
  DxTextBoxModule,
  DxToolbarModule,
  DxTreeListComponent,
  DxTreeListModule,
} from 'devextreme-angular';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { GES001Service } from 'src/app/services/GES001/GES001.service';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { showToast } from '../../shared/toast/toastComponent.js';
import Swal from 'sweetalert2';
import { CommonModule, DatePipe } from '@angular/common';
import { SocketService } from 'src/app/services/socket/socket.service';
import { GES_INFOComponent } from 'src/app/shared/Tareas/GES_INFO/GES_INFO.component';
import { MatDividerModule } from '@angular/material/divider';
import { GES000Component } from './GES000/GES000.component';
import { GES001Component } from './GES001/GES001.component';
import LocalStore from 'devextreme/data/local_store.js';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { GES00Service } from 'src/app/shared/Tareas/Service/GES00.service';

@Component({
  selector: 'app-GESPRO',
  templateUrl: './GESPRO.component.html',
  styleUrls: ['./GESPRO.component.css'],
  standalone: true,
  imports: [
    GES000Component,
    CommonModule,
    DxTabsModule,
    GES_INFOComponent,
    MatTabsModule,
    DxLoadPanelModule,
    GES001Component,
    DxDropDownBoxModule,
    DxCheckBoxModule,
    DxToolbarModule,
    DxDropDownButtonModule,
    DxListModule,
    DxListModule,
    MatDividerModule,
    DxTreeListModule,
    DxButtonModule,
    DxTextBoxModule
  ],
})
export class GESPROComponent implements OnInit {
  @ViewChild('treeListAreas', { static: false })
  treeListAreas: DxTreeListComponent;

  tabsMovilGespro: any = [
    {
      ID: 0,
      text: 'Actividades',
      icon: 'user',
      content: true,
    },
    {
      id: 1,
      text: 'Calendario',
      icon: 'find',
      content: false,
    },
  ];
  filtroMaestro: any = [
    { ID: 1, DESCRIPCION: 'Activas', VALOR: false },
    { ID: 2, DESCRIPCION: 'Finalizadas', VALOR: false },
    { ID: 3, DESCRIPCION: 'Inactivas', VALOR: false },
  ];
  filtroActividades: any = [false, false, false];
  selectedItemColumnChooser: any = [];
  selectFiltroMaestro: any = [];
  openDropFiltroMaestro: boolean = false;
  readOnlyFiltros: boolean = false;
  openDropColumnChooser: boolean = false;
  selectedItemColumnChooser_prev: any = [];

  //Configuracion GES-000
  eventsDatosGES000: Subject<any> = new Subject<any>();
  eventsGesInfo: Subject<any> = new Subject<any>();
  eventsDatosTablas: Subject<any> = new Subject<any>();
  eventsDatosCalendario: Subject<any> = new Subject<any>();

  DATOS_CONFIG: any[] = [];
  config_obj: any = [];
  openDropFiltroAreas: boolean = false;

  DGareasF: string[] = [];
  DColumnChooser: any = [];

  selectAreas: string[] = [];

  readOnly: boolean;
  QFiltro: any;
  data_prev: any;
  VDatosReg: any;
  USUARIO_LOCAL: any = '';
  EMPRESA: any = '';
  noDataAreas: string = 'No hay Data';
  loadingVisible: boolean = false;
  MOFiltros: boolean = true;

  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();

  DResponsables: any = [];
  DataResTareas: any = [];
  DataResTareas_prev: any = [];
  DataFiltroAreas_prev: any = [];
  DataFiltroAreas: any = [];
  PERMISOS: any;
  nueva_actividad: any;

  constructor(
    private _sdatos: GES001Service,
    private _sdatosGes: GES00Service,
    private _sbarreg: SbarraService,
    public wsocket: SocketService,
    private datepipe: DatePipe,
    public generalesService: GeneralesService,

  ) {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.EMPRESA = localStorage.getItem('empresa')?.toUpperCase();
    this.subscription = this._sbarreg
      .getObsRegApl()
      .subscribe((dempeg) => {
        if (dempeg.aplicacion === this._sdatosGes.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(dempeg);
      });

    this.onRespuestaComponent = this.onRespuestaComponent.bind(this);
    this.valoresObjetos = this.valoresObjetos.bind(this);
  }

  ngOnInit(): void {
    this._sdatosGes.prmUsrAplBarReg = {
      tabla: 'GESPRO',
      aplicacion: 'GES-001',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_refrescar: true },
    };
    this._sbarreg.setObsMenuReg(this._sdatosGes.prmUsrAplBarReg);
    this.readOnly = false;
    setTimeout(() => {
      this.eventsDatosGES000.next({
        accion: 'init',
        config: {
          accion: 'init',
          readOnly: this.readOnly,
          APLICACION: this._sdatosGes.prmUsrAplBarReg.aplicacion,
        },
      });
      this.eventsGesInfo.next({
        accion: 'init',
        config: {
          accion: 'init',
          readOnly: this.readOnly,
          APLICACION: this._sdatosGes.prmUsrAplBarReg.aplicacion,
        },
      });
    }, 300);


    this.valoresObjetos('configurar', 'GESPRO');
    this.valoresObjetos('datos columnas', '');
    this.valoresObjetos('actividades', '');
    this.valoresObjetos('areas', '');
    this.valoresObjetos('responsables', '');
    this.valoresObjetos('prioridad', '');
    this.filtroMaestro[0].VALOR = true;
    this.filtroActividades[0] = true;
    this.selectFiltroMaestro = [1];


    this.nueva_actividad = localStorage.getItem('nueva_actividad')
    this.nueva_actividad = JSON.parse(this.nueva_actividad)
    // if (this.nueva_actividad !== null && this.nueva_actividad.ACTIVIDAD.ACCION === 'nueva_actividad') {
    //   for (let i = 0; i < this.nueva_actividad.ACTIVIDAD.ACTIVIDAD_DATA.COLABORADORES.length; i++) {
    //     const element = this.nueva_actividad.ACTIVIDAD.ACTIVIDAD_DATA.COLABORADORES[i];
    //     if (element === this.USUARIO_LOCAL) {
    //       this.filtroActividades[2] = true;
    //     }
    //   }
    // }

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  mostrarOcultarFiltros(e: any) {
    this.MOFiltros = !this.MOFiltros;
  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case 'r_ini':
        this._sdatosGes.prmUsrAplBarReg = {
          tabla: 'GESPRO',
          aplicacion: 'GES-001',
          usuario: this.USUARIO_LOCAL,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_refrescar: true },
        };
        this._sbarreg.setObsMenuReg(this._sdatosGes.prmUsrAplBarReg);
        break;
      case 'r_refrescar':
        if (this.selectAreas.length === 0)
          this.valoresObjetos('todos', '');
        else if (this.selectAreas.length > 0)
          this.valoresObjetos('filtro areas', this.selectAreas);
        setTimeout(() => {
          if (this.tabsMovilGespro[0].content) {
            this.eventsDatosGES000.next({
              accion: 'init',
              config: {
                accion: 'init',
                readOnly: this.readOnly,
                APLICACION: this._sdatosGes.prmUsrAplBarReg.aplicacion,
              },
            });
          }
          if (this.tabsMovilGespro[1].content) {
            this.eventsDatosCalendario.next({
              accion: 'init',
              config: { accion: 'init', dataSource: this.DataResTareas },
            });
          }
        }, 1000);
        break;

      case 'r_imprimir':
        break;

      case 'r_configurar':
        break;

      default:
        break;
    }
  }

  onValueChangedFiltro(e: any) {
    this.openDropFiltroMaestro = false;
    if (e.addedItems !== undefined || e.removedItems !== undefined) {
      this.loadingVisible = true;
      if (e.addedItems !== undefined && e.addedItems.length > 0) {
        const npos: any = this.filtroMaestro.findIndex(
          (d: any) => d.ID === e.addedItems[0].ID
        );
        this.filtroMaestro[npos].VALOR = true;
      }
      if (e.removedItems !== undefined && e.removedItems.length > 0) {
        const npos: any = this.filtroMaestro.findIndex(
          (d: any) => d.ID === e.removedItems[0].ID
        );
        this.filtroMaestro[npos].VALOR = false;
      }
      // this.selectAreas = [];
      // this.readOnlyFiltros = false;
      if (!this.readOnlyFiltros && this.selectAreas.length <= 0)
        this.filtrarActividades('Filtro Maestro');
      else if (this.readOnlyFiltros && this.selectAreas.length > 0)
        this.filtrarPorAreas('Filtro Areas');

      this.loadingVisible = false;
    }
  }

  onButtonClickAreas(e: any) {
    if (this.selectAreas.length > 0) {
      this.selectAreas = [];
      this.readOnlyFiltros = false;
      this.openDropFiltroAreas = false;
      this.filtrarActividades('Filtro Areas');
    } else {
      this.openDropFiltroAreas = !this.openDropFiltroAreas;
    }
  }

  onSelectionChangedArea(e: any) {
    const row = this.treeListAreas.instance.getSelectedRowKeys('true');
    this.selectAreas = row;
  }

  aceptarBottom(e: any, btn: any) {
    switch (btn) {
      case 'AREAS':
        this.openDropFiltroAreas = false;
        if (this.selectAreas.length > 0) {
          this.readOnlyFiltros = true;
          this.valoresObjetos('filtro areas', this.selectAreas);
        } else {
          this.readOnlyFiltros = false;
          this.filtrarActividades('Filtro Areas');
        }
        break;

      case 'COLUMNAS':
        this.openDropColumnChooser = false;
        this.selectedItemColumnChooser_prev = JSON.parse(
          JSON.stringify(this.selectedItemColumnChooser)
        );
        this.eventsDatosGES000.next({
          accion: 'column chooser',
          filtro: 'filtro',
          config: {
            accion: 'column chooser',
            dataSource: this.selectedItemColumnChooser,
          },
        });
        break;

      default:
        break;
    }
  }

  closeBottom(e: any, btn: any) {
    switch (btn) {
      case 'AREAS':
        this.readOnlyFiltros = false;
        this.openDropFiltroAreas = false;
        break;

      case 'COLUMNAS':
        this.openDropColumnChooser = false;
        this.selectedItemColumnChooser = this.selectedItemColumnChooser_prev;
        break;

      default:
        break;
    }
  }

  onButtonClickColumnas(e: any) {
    this.openDropColumnChooser = true;
    this.selectedItemColumnChooser_prev = JSON.parse(
      JSON.stringify(this.selectedItemColumnChooser)
    );
  }

  onSelectionChangedColumn(e: any) {
    if (e.addedItems.length > 0) {
      e.addedItems.forEach((ele: any) => {
        if (this.selectedItemColumnChooser.indexOf(ele) === -1)
          this.selectedItemColumnChooser.push(ele);
      });
    }
    if (e.removedItems.length > 0) {
      e.removedItems.forEach((ele: any) => {
        const pos: any = this.selectedItemColumnChooser.indexOf(ele);
        if (pos > -1) this.selectedItemColumnChooser.splice(pos, 1);
      });
    }
  }

  onRespuestaGesInfo(datos: any) {
    switch (datos.accion) {
      case 'update datasource':
        this._sdatosGes.prmUsrAplBarReg.accion = datos.accionLocal;
        this.opPrepararGuardar(datos);
        break;

      default:
        break;
    }
  }

  onRespuestaComponent(datos: any) {
    switch (datos.accion) {
      case 'cargar nodo':
        // this.valoresObjetos('actividad', e.data);
        break;

      case 'update datasource':
        this._sdatosGes.prmUsrAplBarReg.accion = datos.accionLocal;
        this.opPrepararGuardar(datos);
        break;

      case 'historial tarea':
        const tarea: any = {
          TITULO: datos.data.NOMBRE,
          VISIBLE: true,
          DATA: datos.data,
          readOnly: datos.readOnly,
        };
        this.eventsGesInfo.next({
          accion: 'cargar datos',
          config: { accion: 'update dataSource', dataSource: tarea },
        });
        break;

      case 'column chooser':
        datos.data.forEach((ele: any) => {
          if (this.selectedItemColumnChooser.indexOf(ele) === -1)
            this.selectedItemColumnChooser.push(ele);
        });
        break;

      case 'save column for user':
        this.sendStorageRequest(datos.data);
        break;

      case 'enviar email':
        //notificacion al Responsable
        this.envioNotificacion('enviar email', datos.data, '');
        break;

      default:
        break;
    }
  }

  opPrepararGuardar(datos: any) {

    var prm: any;
    var act: any = JSON.parse(JSON.stringify(datos.data));
    act.ID_ACTIVIDAD_PADRE = act.TEMP !== null && act.TEMP !== undefined && act.TEMP !== '' && act.TEMP !== 0 ? act.TEMP : act.ID_ACTIVIDAD_PADRE
    act.PRECEDENTES = act.PRECEDENTES !== undefined && act.PRECEDENTES !== null && act.PRECEDENTES !== '' && act.PRECEDENTES.length > 0 ? act.PRECEDENTES.map((d: any) => d) : [];
    act.PRECEDENTES = act.PRECEDENTES.length > 0 ? JSON.stringify(act.PRECEDENTES) : '[]';

    if (datos.accionLocal === 'update') {
      prm = { USUARIO: act.USUARIO, ACTIVIDAD: act };
    } else {
      prm = { USUARIO: this.USUARIO_LOCAL, ACTIVIDAD: act };
    }
    this._sdatos.saveActividades(datos.accionLocal, prm).subscribe(
      (data: any) => {
        this._sdatos.loadingVisible = false;
        const res = validatorRes(data);
        if (data.token !== undefined) {
          const refreshToken = data.token;
          localStorage.setItem('token', refreshToken);
        }
        const mensaje = res[0].ErrMensaje;
        if (mensaje !== '') {
          Swal.fire({
            title: 'Error',
            text: mensaje,
            iconHtml: "<i class='icon-alert-ol'></i>",
            showCancelButton: false,
            confirmButtonColor: '#DF3E3E',
            confirmButtonText: 'Continuar',
          }).then((result) => {
            if (result.isConfirmed) {
              this.eventsDatosGES000.next({
                accion: 'error',
                config: {
                  accion: 'error de guardado',
                  dataSource: prm.ACTIVIDAD,
                  accionLocal: datos.accionLocal,
                },
              });
            }
          });
        } else {
          showToast('Registro exitoso.', 'success');

          const TIMELINE = res[0].TIMELINE;
          const ACT = res[0].ID_ACTIVIDAD;
          const ACT_PA = res[0].ID_ACTIVIDAD_PADRE;
          const ASIGNADA_POR = res[0].ASIGNADA_POR;

          var TIPO_TAREA: any = '';
          switch (prm.ACTIVIDAD.CLASE) {
            case 'RESPONSABILIDADES':
              TIPO_TAREA = 'RESPONSABILIDAD';
              break;

            case 'TAREAS':
              TIPO_TAREA = 'TAREA';
              break;

            case 'EVENTOS':
              TIPO_TAREA = 'EVENTO';
              break;

            default:
              break;
          }

          // Actualiza tarea en datasource principal
          if (this.selectAreas.length === 0)
            this.valoresObjetos('actividades', '');

          var regAct: any = {};
          const prmAct = prm.ACTIVIDAD;
          const exisAct = this.DataResTareas_prev.findIndex(
            (t: any) => t.ID_ACTIVIDAD == prmAct.ID_ACTIVIDAD
          );
          regAct = {
            ID_ACTIVIDAD: ACT,
            ID_ACTIVIDAD_PADRE: prmAct.ID_ACTIVIDAD_PADRE,
            TEMP: ACT_PA,
            NOMBRE: prmAct.NOMBRE,
            DESCRIPCION: prmAct.DESCRIPCION,
            FECHA_INICIO: prmAct.FECHA_INICIO,
            FECHA_FIN: prmAct.FECHA_FIN,
            PRIORIDAD: prmAct.PRIORIDAD,
            ETIQUETAS: prmAct.ETIQUETAS,
            MEDICION: prmAct.MEDICION,
            ESTADO: prmAct.ESTADO,
            USUARIO: prmAct.USUARIO,
            CLASE: prmAct.CLASE,
            TIPO: prmAct.TIPO,
            TODO_DIA: prmAct.TODO_DIA,
            ANULADO: prmAct.ANULADO,
            RESPONSABLE: prmAct.RESPONSABLE,
            COLABORADORES: prmAct.COLABORADORES,
            PROGRAMACION: prmAct.PROGRAMACION,
            ELIMINADO: prmAct.ELIMINADO,
            ORDEN: prmAct.ORDEN,
            DESCRIPCION_ESTILO: prmAct.DESCRIPCION_ESTILO,
            ASIGNADA_POR: ASIGNADA_POR,
            AVANCE: prmAct.AVANCE,
            DATA_PROGRAMACION: prmAct.DATA_PROGRAMACION
              ? JSON.parse(prmAct.DATA_PROGRAMACION)
              : null,
            RECORDATORIO: prmAct.RECORDATORIO,
            DATA_RECORDATORIO: prmAct.DATA_RECORDATORIO
              ? JSON.parse(prmAct.DATA_RECORDATORIO)
              : null,
            ACT_MIAS: prmAct.RESPONSABLE == this.USUARIO_LOCAL ? true : false,
            ACT_ASIG:
              exisAct == -1
                ? true
                : prmAct.USUARIO == this.USUARIO_LOCAL
                  ? true
                  : false,
            ACT_AREA: false,
            ACT_COLAB:
              prmAct.COLABORADORES.findIndex(
                (col: any) => col.ID_RESPONSABLE == this.USUARIO_LOCAL
              ) != -1
                ? true
                : false,
            ACT_FIN: prmAct.ESTADO == 'Finalizado' ? true : false,
            ErrMensaje: '',
            ITEM: prmAct.ITEM,
            btnComentarios: true,
            readOnlyResponsables: true,
            readOnlyColaboradores: true,
            readOnlyTipo: true,
            esEdit: true,
          };
          this.DataResTareas_prev = [...this.DataResTareas_prev, regAct];
          const pos = this.DataResTareas.findIndex(
            (d: any) => d.ID_ACTIVIDAD === prmAct.ID_ACTIVIDAD
          );
          this.DataResTareas[pos] = regAct;
          if (this.tabsMovilGespro[0].content) {
            this.eventsDatosGES000.next({
              accion: 'cargar datos',
              config: {
                accion: 'update dataSource',
                dataSource: this.DataResTareas,
              },
            });
          }

          // Actualiza la padre si las vbles de filtro quedaron activas/inactivas
          const actPadre = this.DataResTareas_prev.findIndex(
            (t: any) => t.ID_ACTIVIDAD == prmAct.ID_ACTIVIDAD_PADRE
          );
          if (actPadre != -1) {
            let actMias = false;
            if (
              this.DataResTareas_prev.findIndex(
                (t: any) =>
                  t.ID_ACTIVIDAD_PADRE === prmAct.ID_ACTIVIDAD_PADRE &&
                  t.ACT_MIAS
              ) !== -1
            )
              actMias = true;

            this.actualizFiltrosRecur(
              prmAct.ID_ACTIVIDAD_PADRE,
              'ACT_MIAS',
              actMias
            );

            let actAsig = false;
            if (
              this.DataResTareas_prev.findIndex(
                (t: any) =>
                  t.ID_ACTIVIDAD_PADRE === prmAct.ID_ACTIVIDAD_PADRE &&
                  t.ACT_ASIG
              ) !== -1
            )
              actAsig = true;
            this.actualizFiltrosRecur(
              prmAct.ID_ACTIVIDAD_PADRE,
              'ACT_ASIG',
              actAsig
            );
            let actColab = false;
            if (
              this.DataResTareas_prev.findIndex(
                (t: any) =>
                  t.ID_ACTIVIDAD_PADRE === prmAct.ID_ACTIVIDAD_PADRE &&
                  t.ACT_COLAB
              ) !== -1
            )
              actColab = true;
            this.actualizFiltrosRecur(
              prmAct.ID_ACTIVIDAD_PADRE,
              'ACT_COLAB',
              actColab
            );

          }

          //notificacion al Responsable
          this.envioNotificacion('notificacion', prm.ACTIVIDAD, TIMELINE);
        }
      },
      (err) => {
        this._sdatos.loadingVisible = false;
        // this.showModal(err.message, 'error');
        Swal.fire({
          title: 'Error',
          text: err.message,
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: false,
          confirmButtonColor: '#DF3E3E',
          confirmButtonText: 'Continuar',
        }).then((result) => {
          if (result.isConfirmed) {
            this.eventsDatosGES000.next({
              accion: 'error',
              config: {
                accion: 'error de guardado',
                dataSource: prm.ACTIVIDAD,
                accionLocal: datos.accionLocal,
              },
            });
          }
        });
      }
    );
  }

  // Actualiza recursivamente las actividades padre con los filtros activo/inactivo
  actualizFiltrosRecur(actPadre: any, nomFiltro: any, valor: boolean) {
    if (actPadre < 0) return;
    const ix = this.DataResTareas_prev.findIndex(
      (p) => p.ID_ACTIVIDAD == actPadre
    );
    if (ix !== -1) {
      this.DataResTareas_prev[ix][nomFiltro] = valor;
      const arrActPadre = this.DataResTareas_prev.find(
        (p) => p.ID_ACTIVIDAD == this.DataResTareas_prev[ix].ID_ACTIVIDAD_PADRE
      );
      if (arrActPadre !== undefined)
        this.actualizFiltrosRecur(arrActPadre.ID_ACTIVIDAD, nomFiltro, valor);
    }
  }

  envioNotificacion(fuente: any, prm: any, TIMELINE: any) {
    const TIPO_TAREA: any = prm.CLASE;
    const usr_env: any = this.DResponsables.filter(
      (d: any) => d.ID_RESPONSABLE === this.USUARIO_LOCAL
    );

    let nombrePartes = usr_env[0].NOMBRE.split(' ');
    let user_name = nombrePartes.length > 2 ? nombrePartes[0] + ' ' + nombrePartes[2] : nombrePartes[0] + ' ' + nombrePartes[1]

    let usr_rec: String[] = [];
    usr_rec.push(prm.RESPONSABLE);
    usr_rec.push(prm.USUARIO);
    if (prm.COLABORADORES.length > 0 && prm.COLABORADORES != undefined && prm.COLABORADORES != null) {
      prm.COLABORADORES.forEach((user) =>
        usr_rec.push(user))
    }
    const index = usr_rec.indexOf(this.USUARIO_LOCAL);
    if (index !== -1) {
      usr_rec.splice(index, 1); // Elimina ese elemento
    }
    usr_rec = [...new Set(usr_rec)];

    var sendMail: boolean = false;
    var msj: any = '';
    var desc: any = '';
    var accion: any = '';

    if (fuente === 'notificacion') {
      sendMail = false;
    } else if (fuente === 'enviar email') {
      sendMail = true;
      msj = 'Envio de Correo';
    }

    if (this._sdatosGes.prmUsrAplBarReg.accion === 'new') {
      if (TIPO_TAREA === 'RESPONSABILIDAD' || TIPO_TAREA === 'TAREA') {
        msj = user_name + ', te asignó la ' + 'RESPONSABILIDAD ' + prm.NOMBRE.toUpperCase();
        desc = user_name + ', te añadio como Colaborador a la ' + 'RESPONSABILIDAD ' + prm.NOMBRE.toUpperCase();
      }
      if (TIPO_TAREA === 'EVENTOS') {
        msj = user_name + ', te asignó el ' + 'EVENTO ' + prm.NOMBRE.toUpperCase();
        desc = user_name + ', te añadio como Colaborador a un ' + TIPO_TAREA;
      }
      if (TIPO_TAREA === 'COMUNITARIAS') {
        msj = user_name + ', te asignó la actividad ' + prm.NOMBRE.toUpperCase();
        desc = user_name + ', te añadio como Colaborador a la actividad ' + prm.NOMBRE.toUpperCase();
      }
      if (TIPO_TAREA === 'TAREAS') {
        msj = user_name + ', te asignó la ' + 'TAREA ' + prm.NOMBRE.toUpperCase();
        desc = user_name + ', te añadio como Colaborador a la ' + 'TAREA ' + prm.NOMBRE.toUpperCase();
      }

      accion = 'nueva_actividad'
    } else if (this._sdatosGes.prmUsrAplBarReg.accion === 'update') {
      desc = '';
      if (TIPO_TAREA === 'RESPONSABILIDAD') {
        msj = user_name + ', modificó la ' + 'RESPONSABILIDAD ' + prm.NOMBRE.toUpperCase();
      }
      if (TIPO_TAREA === 'EVENTOS') {
        msj = user_name + ', modificó el ' + 'EVENTO ' + prm.NOMBRE.toUpperCase();
      }
      if (TIPO_TAREA === 'COMUNITARIAS') {
        msj = user_name + ', modificó la actividad ' + prm.NOMBRE.toUpperCase();
      }
      if (TIPO_TAREA === 'TAREAS') {
        msj = user_name + ', modificó la ' + 'TAREA ' + prm.NOMBRE.toUpperCase();
      }

      accion = 'modifico_actividad'
    }

    //Envia el responsable
    const posApl: any = this.generalesService.APLICACIONES.findIndex((d: any) => d.ID_APLICACION === this._sdatosGes.prmUsrAplBarReg.aplicacion);
    var dataNotificacion: any = {
      APLICACION: this._sdatosGes.prmUsrAplBarReg.aplicacion,
      ID_APLICACION: this._sdatosGes.prmUsrAplBarReg.aplicacion,
      NOMBRE_APLICACION: posApl > -1 ? this.generalesService.APLICACIONES[posApl].NOMBRE : null,
      FECHA: this.datepipe.transform(
        new Date(),
        'MM/dd/yyyy HH:mm:ss'
      ),
      USUARIO_ENV: usr_env[0],
      USUARIO_REC: usr_rec,
      DESCRIPCION: msj,
      TIPO: 'AUTOMATICA',
      FECHA_UPDATE: this.datepipe.transform(
        new Date(),
        'MM/dd/yyyy HH:mm:ss'
      ),
      ESTADO: 'Enviado',
      SEND_EMAIL: sendMail,
      EMPRESA: this.EMPRESA,
      ESPEC: 'NOTIFICACION',
      ACCION: accion,
      TIMELINE: TIMELINE,
      CLASE: TIPO_TAREA,
      ACTIVIDAD: JSON.stringify({
        EMPRESA: this.EMPRESA,
        ESPEC: 'NOTIFICACION',
        ACCION: accion,
        TIMELINE: TIMELINE,
        CLASE: TIPO_TAREA,
        ACTIVIDAD_DATA: prm
      })
    };
    // API guardado de datos

    const data1: any = {
      TIPO: 'NOTIFICACION',
      DATOS: dataNotificacion,
    };
    this.wsocket.saveInfo('SAVE NOTIFICACION', data1).subscribe((data) => {
      const res = JSON.parse(data.data);
      if (res[0].ErrMensaje !== '') {
        this.showModal(res[0].ErrMensaje, 'Error al enviar notificación.');
      } else {
        let datos = {
          data: dataNotificacion,
          USUARIO: dataNotificacion.USUARIO_ENV
        }
        this.wsocket.sendSocket('notificaciones', 'get_data_notificaciones', datos);
        if (sendMail === true) {
          showToast('Correo Enviado.', 'success');
        }
      }
    });
  }

  sendStorageRequest = (datos: any) => {
    const prm: any = {
      ID_APLICACION: this._sdatosGes.prmUsrAplBarReg.aplicacion,
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

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, data?: any) {
    if (obj === 'permisos') {
      const user: any = localStorage.getItem('usuario');
      const prm = {
        USUARIO: user,
        ID_APLICACION: this._sdatosGes.prmUsrAplBarReg.aplicacion,
      };
      this._sdatos.getPermisos('PERMISOS', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        }
        this.PERMISOS = res[0];
      });
    }
    if (obj === 'config user treeList') {
      const prm: any = {
        ID_USUARIO: this.USUARIO_LOCAL,
        ID_APLICACION: this._sdatosGes.prmUsrAplBarReg.aplicacion,
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
          // if (res[0].ErrMensaje !== '') {
          //   showToast(res[0].ErrMensaje, 'error');
          //   return;
          // }
          this.config_obj = JSON.parse(res[0].CONFIGURACION);
          this.eventsDatosGES000.next({
            accion: 'config column for user',
            filtro: 'config',
            config: {
              accion: 'config column for user',
              dataSource: this.config_obj,
            },
          });
        });
    }
    if (obj === 'configurar') {
      this.loadingVisible = true;
      const prm = { ID_APLICACION: 'GES-001', PLANTILLA: data };
      this._sdatos.consulta('CONFIGURACION', prm).subscribe(
        (data: any) => {
          this.loadingVisible = false;
          const res = validatorRes(data);
          if (data.token !== undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          this.DColumnChooser = [];
          const newArray = res;
          const mensaje = newArray[0].ErrMensaje;
          if (mensaje !== '') {
            showToast(mensaje, 'Error');
            this.DATOS_CONFIG = [];
          } else {
            this.DATOS_CONFIG = JSON.parse(JSON.stringify(newArray));
            newArray.push({ readOnly: this.readOnly });
            var newData = this.DATOS_CONFIG.filter(
              (d: any) =>
                d.CONFIG_PADRE === 'COLUMNAS' &&
                !d.CONFIG.match('ID_|Err|Mensaje|Read|btn')
            );
            newData.forEach((ele: any) => {
              const edi: any[] = this.DATOS_CONFIG.filter(
                (d: any) =>
                  d.CONFIG === 'EDITABLE' && d.CONFIG_PADRE === ele.CONFIG
              );
              if (edi.length > 0) {
                const val = JSON.parse(edi[0].VALOR);
                if (val.valor) this.DColumnChooser.push(ele.CONFIG);
              }
            });
            this.eventsDatosGES000.next({
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
    }
    // Filtro especial por áreas
    if (obj === 'filtro areas') {
      const prm: any = { AREAS: data };
      this.loadingVisible = true;
      this._sdatos
        .getActividades('FILTRO AREAS', prm)
        .subscribe((data: any) => {
          const res = validatorRes(data);
          if (data.token !== undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          if (res[0].ErrMensaje !== '') {
            showToast(res[0].ErrMensaje, 'error');
            this.selectAreas = [];
            this.readOnlyFiltros = false;
            this.openDropFiltroAreas = false;
            this.loadingVisible = false;
            return;
          }
          for (let i = 0; i < res.length; i++) {
            const element = res[i];
            element.ITEM = i;
            element.btnComentarios = true;
            element.readOnlyResponsables = true;
            element.readOnlyColaboradores = true;
            element.readOnlyTipo = true;
            if (
              element.PERIODO_FRECUENCIA === null ||
              element.PERIODO_FRECUENCIA === '' ||
              element.PERIODO_FRECUENCIA === undefined
            ) {
              element.PERIODO_FRECUENCIA = [];
            } else {
              element.PERIODO_FRECUENCIA = element.PERIODO_FRECUENCIA;
            }
          }
          this.DataFiltroAreas_prev = JSON.parse(JSON.stringify(res));
          this.DataFiltroAreas_prev.forEach((tarea: any) => {
            if (tarea.CLASE !== 'NODOS') {
              tarea.readOnlyResponsables = true;
              tarea.readOnlyColaboradores = true;
            }
          });
          this.DataFiltroAreas = JSON.parse(
            JSON.stringify(this.DataFiltroAreas_prev)
          );
          this.loadingVisible = false;
          this.filtrarPorAreas('areas');
        });
    }
    if (obj === 'responsables' || obj === 'todos') {
      const prm: any = {};
      this._sdatos.getResponsables('RESPONSABLES', prm).subscribe(
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
            this.eventsDatosGES000.next({
              accion: 'cargar datos',
              config: {
                accion: 'update data config',
                parametro: 'RESPONSABLE',
                dataSource: res,
              },
            });
            this.eventsDatosGES000.next({
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
    }
    if (obj === 'estados' || obj === 'todos') {
      const prm: any = { ID_GRUPO_DOMINIO: 'ESTADOS GES' };
      this._sdatos.getEstados('ESTADOS', prm).subscribe(
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
            this.eventsDatosGES000.next({
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
    if (obj === 'areas' || obj === 'todos') {
      const prm: any = { USUARIO: this.USUARIO_LOCAL };
      this._sdatos.getAreas('AREAS', prm).subscribe(
        (data: any) => {
          const res = validatorRes(data);
          if (data.token !== undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          const newArray = res;
          const mensaje = newArray[0].ErrMensaje;
          if (mensaje !== '') {
            this.noDataAreas = mensaje;
          } else {
            newArray.forEach((area: any) => {
              if (
                newArray.findIndex(
                  (d: any) => area.ID_AREA_SUPERIOR === d.ID_AREA
                ) === -1
              )
                area.ID_AREA_SUPERIOR = 'RAIZ';
            });
            newArray.push({
              ID_AREA: 'RAIZ',
              DESCRIPCION: 'Area raiz',
              ID_UN: '',
              ITEM: 0,
              ID_AREA_SUPERIOR: '',
              ID_UN_ITEM: '',
              ESTADO: '',
              TIPO: '',
              IsActive: false,
            });
            this.DGareasF = newArray;
            this.eventsDatosGES000.next({
              accion: 'init',
              config: {
                accion: 'readOnly',
                dataSource: res,
                readOnly: this.readOnly,
              },
            });
          }
        },
        (err: any) => {
          this.showModal(err.message, 'Error');
        }
      );
    }
    if (obj === 'prioridad' || obj === 'todos') {
      const prm: any = { ID_GRUPO_DOMINIO: 'PRIORIDAD GES' };
      this._sdatos.getEstados('ESTADOS', prm).subscribe(
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
            this.eventsDatosGES000.next({
              accion: 'cargar datos',
              config: {
                accion: 'update data config',
                parametro: 'PRIORIDAD',
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
    if (obj === 'datos columnas') {
      const prm: any = {};
      this._sdatos.consulta('datos columnas', prm).subscribe(
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
            this.eventsDatosGES000.next({
              accion: 'cargar datos',
              config: {
                accion: 'update data config',
                parametro: 'ESTADO',
                dataSource: res[0].ESTADOS,
              },
            });
            this.eventsGesInfo.next({
              accion: 'cargar datos',
              config: {
                accion: 'update data config',
                parametro: 'ESTADO',
                dataSource: res[0].ESTADOS,
              },
            });
          }
        },
        (err: any) => {
          this.showModal(err.message, 'Error');
        }
      );
    }
    if (obj === 'actividades' || obj === 'todos') {
      const prm: any = { USUARIO: this.USUARIO_LOCAL };
      this.loadingVisible = true;
      this._sdatos
        .getActividades('ACTIVIDADES MAESTRO', prm)
        .subscribe((data: any) => {
          this.loadingVisible = false;
          const res = validatorRes(data);
          if (data.token !== undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          if (res[0].ErrMensaje !== '') {
            showToast(res[0].ErrMensaje, 'error');
            this.DataResTareas = [];
            return;
          }
          for (let i = 0; i < res.length; i++) {
            const element = res[i];
            element.ITEM = i;
            element.btnComentarios = true;
            element.readOnlyResponsables = true;
            element.readOnlyColaboradores = true;
            element.readOnlyTipo = true;
            element.COLABORADORES = JSON.parse(element.COLABORADORES);
            element.GRUPOS = JSON.parse(element.GRUPOS);
            element.PRECEDENTES = typeof element.PRECEDENTES === 'string' && element.PRECEDENTES === '' ? [] : JSON.parse(element.PRECEDENTES);
            if (
              element.PERIODO_FRECUENCIA === null ||
              element.PERIODO_FRECUENCIA === '' ||
              element.PERIODO_FRECUENCIA === undefined
            ) {
              element.PERIODO_FRECUENCIA = [];
            } else {
              element.PERIODO_FRECUENCIA = element.PERIODO_FRECUENCIA;
            }
          }
          // this.DataResTareas = JSON.parse(JSON.stringify(res));
          this.DataResTareas_prev = JSON.parse(JSON.stringify(res));
          this.DataResTareas_prev.forEach((tarea: any) => {
            if (tarea.CLASE !== 'NODOS') {
              // if (
              //   this.DataResTareas_prev.findIndex(
              //     (d: any) => tarea.ID_ACTIVIDAD_PADRE === d.ID_ACTIVIDAD
              //   ) === -1
              // ) {
              //   switch (tarea.CLASE) {
              //     case 'TAREAS':
              //       tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
              //       tarea.ID_ACTIVIDAD_PADRE = -10;
              //       break;
              //     case 'RESPONSABILIDADES':
              //       tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
              //       tarea.ID_ACTIVIDAD_PADRE = -20;
              //       break;
              //     case 'EVENTOS':
              //       tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
              //       tarea.ID_ACTIVIDAD_PADRE = -30;
              //       break;
              //     case 'COMUNITARIAS':
              //       tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
              //       tarea.ID_ACTIVIDAD_PADRE = -50;
              //       break;

              //     default:
              //       break;
              //   }
              // }

              tarea.isEdit = false;
              tarea.readOnlyResponsables = true;
              tarea.readOnlyColaboradores = true;
              const prm: any = { data: tarea };
              this.setProgramacion(prm);
            }
          });
          this.filtrarActividades('actividades');
        });
    }
  }

  // Compone cadena que muestra la programacion escogida
  setProgramacion(data) {
    let respProg = '';


    const fecha_inicial = new Date(data.data.FECHA_INICIO);
    const fecha_final = new Date(data.data.FECHA_FIN);

    if (fecha_inicial && fecha_final) {
      const compInicial = this.generalesService.getFechaComponents(fecha_inicial);
      const compFinal = this.generalesService.getFechaComponents(fecha_final);

      const mismoDia =
        compInicial.dia === compFinal.dia &&
        fecha_inicial.getMonth() === fecha_final.getMonth() &&
        fecha_inicial.getFullYear() === fecha_final.getFullYear();
      const mismoMes =
        fecha_inicial.getMonth() === fecha_final.getMonth() &&
        fecha_inicial.getFullYear() === fecha_final.getFullYear();

      if (data.data.TODO_DIA && !data.data.REPETIR) {
        if (mismoDia) {
          respProg = `El ${compInicial.dia} Todo el día`;
        } else if (mismoMes) {
          respProg = `${compInicial.dia} - ${compFinal.dia} ${compFinal.mes} Todo el día`;
        } else {
          respProg = `${compInicial.dia} ${compInicial.mes} - ${compFinal.dia} ${compFinal.mes} Todo el día`;
        }
      } else if (!data.data.TODO_DIA && data.data.REPETIR) {
        if (mismoDia) {
          respProg = `${compInicial.dia} - ${compInicial.mes}`;
        } else if (mismoMes) {
          respProg = `${compInicial.dia} - ${compFinal.dia} ${compInicial.mes}`;
        } else {
          respProg = `${compInicial.dia} - ${compInicial.mes} ${compInicial.ano} - ${compFinal.dia} - ${compFinal.mes} ${compFinal.ano}`;
        }
      } else if (
        (!data.data.TODO_DIA && !data.data.REPETIR) ||
        (data.data.TODO_DIA && data.data.REPETIR)
      ) {
        if (mismoDia) {
          respProg = `${compInicial.dia} - ${compInicial.mes}`;
        } else if (mismoMes) {
          respProg = `${compInicial.dia} - ${compFinal.dia} ${compInicial.mes}`;
        } else {
          respProg = `${compInicial.dia} - ${compInicial.mes} ${compInicial.ano} - ${compFinal.dia} - ${compFinal.mes} ${compFinal.ano}`;
        }
      }

      // let fechaHoy = new Date()
      // if (fecha_final.getFullYear() === fechaHoy.getFullYear()) {
      //   respProg = `${compFinal.dia}-${compFinal.mes}`;
      // } else {
      //   respProg = `${compFinal.dia}-${compFinal.mes}-${compFinal.ano}`;
      // }
    }

    // Actualiza valor en el treelist
    data.data.PROGRAMACION = respProg;
    // if (
    //   data.data.DATA_PROGRAMACION &&
    //   data.data.DATA_PROGRAMACION !== null &&
    //   data.data.DATA_PROGRAMACION !== 'null'
    // ) {
    //   let DATA_PROGRAMACION = JSON.parse(data.data.DATA_PROGRAMACION);
    //   data.data.REPETIR = DATA_PROGRAMACION.REPETIR;
    //   data.data.FECHA_INICIAL = DATA_PROGRAMACION.FECHA_INICIAL;
    //   data.data.FECHA_FINAL = DATA_PROGRAMACION.FECHA_FINAL;
    // }
    // if (
    //   data.data.DATA_RECORDATORIO &&
    //   data.data.DATA_RECORDATORIO !== null &&
    //   data.data.DATA_RECORDATORIO !== 'null'
    // ) {
    //   let DATA_RECORDATORIO = JSON.parse(data.data.DATA_RECORDATORIO);
    //   data.data.TIPO_RECORDATORIO = DATA_RECORDATORIO.TIPO_RECORDATORIO;
    //   data.data.INTERVALO_REC = DATA_RECORDATORIO.INTERVALO_REC;
    //   data.data.INTERVALO_REC_FECHA = DATA_RECORDATORIO.INTERVALO_REC_FECHA;
    // }
  }

  filtrarPorAreas(accionFiltro: string) {
    this.loadingVisible = true;
    this.DataResTareas = [];
    //Se cargan nodos principales
    let Nodos: any = JSON.parse(
      JSON.stringify(
        this.DataResTareas_prev.filter(
          (d: any) => d.CLASE === 'NODOS' && (d.TIPO === '' || d.TIPO === null) && d.ID_ACTIVIDAD !== -50
        )
      )
    );
    //Carga nodos segun area y cargo
    Nodos = [
      ...Nodos,
      ...JSON.parse(
        JSON.stringify(
          this.DataFiltroAreas_prev.filter(
            (d: any) => d.CLASE === 'NODOS' && (d.TIPO !== '' || d.TIPO !== null) && d.ID_ACTIVIDAD_PADRE !== -50
          )
        )
      )
    ];

    // APLICA EL FILTRO MAESTRO
    var newArray = JSON.parse(JSON.stringify(this.DataFiltroAreas_prev));

    var DMaestro: any = [];
    // Activas
    if (this.filtroMaestro[0].VALOR) {
      if (DMaestro.length <= 0) {
        DMaestro = JSON.parse(
          JSON.stringify(
            newArray.filter(
              (d: any) => d.ESTADO !== 'Finalizado' && d.ANULADO === false && d.CLASE !== 'COMUNITARIAS' && d.CLASE !== 'NODOS'
            )
          )
        );
      } else {
        const Act: any = JSON.parse(
          JSON.stringify(
            newArray.filter(
              (d: any) => d.ESTADO !== 'Finalizado' && d.ANULADO === false && d.CLASE !== 'COMUNITARIAS' && d.CLASE !== 'NODOS'
            )
          )
        );
        for (let i = 0; i < Act.length; i++) {
          if (DMaestro.findIndex((a: any) => a.ID_ACTIVIDAD === Act[i].ID_ACTIVIDAD) === -1)
            DMaestro.push(Act[i]);
        }

      }
    }
    // Finalizadas
    if (this.filtroMaestro[1].VALOR) {
      if (DMaestro.length <= 0) {
        DMaestro = JSON.parse(
          JSON.stringify(
            newArray.filter(
              (d: any) => d.ESTADO === 'Finalizado' && d.ANULADO === false && d.CLASE !== 'COMUNITARIAS' && d.CLASE !== 'NODOS'
            )
          )
        );
      } else {
        const Act: any = JSON.parse(
          JSON.stringify(
            newArray.filter(
              (d: any) => d.ESTADO === 'Finalizado' && d.ANULADO === false && d.CLASE !== 'COMUNITARIAS' && d.CLASE !== 'NODOS'
            )
          )
        );
        for (let i = 0; i < Act.length; i++) {
          if (DMaestro.findIndex((a: any) => a.ID_ACTIVIDAD === Act[i].ID_ACTIVIDAD) === -1)
            DMaestro.push(Act[i]);
        }

      }
    }
    // Inactivas
    if (this.filtroMaestro[2].VALOR) {
      if (DMaestro.length <= 0) {
        DMaestro = JSON.parse(
          JSON.stringify(newArray.filter((d: any) => d.ANULADO === true && d.CLASE !== 'COMUNITARIAS' && d.CLASE !== 'NODOS'))
        );
      } else {
        const Act: any = JSON.parse(
          JSON.stringify(newArray.filter((d: any) => d.ANULADO === true && d.CLASE !== 'COMUNITARIAS' && d.CLASE !== 'NODOS'))
        );
        for (let i = 0; i < Act.length; i++) {
          if (DMaestro.findIndex((a: any) => a.ID_ACTIVIDAD === Act[i].ID_ACTIVIDAD) === -1)
            DMaestro.push(Act[i]);
        }

      }
    }

    if (DMaestro.length > 0) this.DataResTareas = [...Nodos, ...DMaestro];
    else this.DataResTareas = Nodos;

    this.DataResTareas.forEach((tarea: any) => {
      if (this.DataResTareas.findIndex((d: any) => tarea.ID_ACTIVIDAD_PADRE === d.ID_ACTIVIDAD) === -1 && tarea.CLASE !== 'NODOS') {
        var act: any = this.DataResTareas.filter((e: any) => e.CLASE === 'NODOS' && e.ID_AREA === tarea.ID_AREA);
        var pos: any = -1;
        tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
        switch (tarea.CLASE) {
          case 'RESPONSABILIDADES':
            pos = act.findIndex((d: any) => d.ID_ACTIVIDAD < -2000 && d.ID_ACTIVIDAD > -3000);
            tarea.ID_ACTIVIDAD_PADRE = act[pos].ID_ACTIVIDAD;
            break;

          case 'TAREAS':
            pos = act.findIndex((d: any) => d.ID_ACTIVIDAD < -1000 && d.ID_ACTIVIDAD > -2000);
            tarea.ID_ACTIVIDAD_PADRE = act[pos].ID_ACTIVIDAD;
            break;

          case 'EVENTOS':
            pos = act.findIndex((d: any) => d.ID_ACTIVIDAD < -3000 && d.ID_ACTIVIDAD > -4000);
            tarea.ID_ACTIVIDAD_PADRE = act[pos].ID_ACTIVIDAD;
            break;

          default:
            break;
        }
      }
    });

    this.loadingVisible = false;
    if (this.tabsMovilGespro[0].content) {
      this.eventsDatosGES000.next({
        accion: 'cargar datos',
        config: {
          accion: 'update dataSource',
          dataSource: this.DataResTareas,
          accionFiltro,
        },
      });
    }
    if (this.tabsMovilGespro[1].content) {
      this.eventsDatosCalendario.next({
        accion: 'cargar datos',
        config: { accion: 'update dataSource', dataSource: this.DataResTareas },
      });
    }
  }

  filtrarActividades(accionFiltro: string, nuevaActividad?: string) {
    this.loadingVisible = true;
    // this.selectAreas = [];
    let Nodos: any = new Set(
      this.DataResTareas_prev
        .filter((d: any) => d.CLASE === 'NODOS')
        .map((d: any) => JSON.stringify(d))
    );

    // nuevosNodos = this.DataResTareas_prev.filter(
    //   (d: any) =>
    //     d.CLASE === 'NODOS' &&
    //     (d.TIPO !== '' || d.TIPO !== null) &&
    //     d.ID_ACTIVIDAD === element.ID_ACTIVIDAD_PADRE &&
    //     d.ID_ACTIVIDAD_PADRE !== -20 &&
    //     ![-10, -20, -30, -40, -50].includes(d.ID_ACTIVIDAD)
    // );
    // nuevosNodos.forEach((nodo) => Nodos.add(JSON.stringify(nodo)));
    Nodos = new Set([...Nodos]);
    // Nodos = Array.from(new Set([...Nodos].map((d: any) => JSON.parse(d))));
    // Nodos = JSON.parse(
    //   JSON.stringify(
    //     this.DataResTareas_prev.filter(
    //       (d: any) => d.CLASE === 'NODOS' && (d.TIPO === '' || d.TIPO === null)
    //     )
    //   )
    // );


    // APLICA EL FILTRO MAESTRO
    var newArray = JSON.parse(JSON.stringify(this.DataResTareas_prev));

    var DMaestro: any = [];
    // Activas
    if (this.filtroMaestro[0].VALOR) {
      if (DMaestro.length <= 0) {
        DMaestro = JSON.parse(
          JSON.stringify(
            newArray.filter(
              (d: any) => d.ESTADO !== 'Finalizado' && d.ANULADO === false
            )
          )
        );
      } else {
        DMaestro = [
          ...DMaestro,
          ...JSON.parse(
            JSON.stringify(
              newArray.filter(
                (d: any) => d.ESTADO !== 'Finalizado' && d.ANULADO === false
              )
            )
          ),
        ];
      }
    }
    // Finalizadas
    if (this.filtroMaestro[1].VALOR) {
      if (DMaestro.length <= 0) {
        DMaestro = JSON.parse(
          JSON.stringify(
            newArray.filter(
              (d: any) => d.ESTADO === 'Finalizado' && d.ANULADO === false
            )
          )
        );
      } else {
        DMaestro = [
          ...DMaestro,
          ...JSON.parse(
            JSON.stringify(
              newArray.filter(
                (d: any) => d.ESTADO === 'Finalizado' && d.ANULADO === false
              )
            )
          ),
        ];
      }
    }
    // Inactivas
    if (this.filtroMaestro[2].VALOR) {
      if (DMaestro.length <= 0) {
        DMaestro = JSON.parse(
          JSON.stringify(newArray.filter((d: any) => d.ANULADO === true))
        );
      } else {
        DMaestro = [
          ...DMaestro,
          ...JSON.parse(
            JSON.stringify(newArray.filter((d: any) => d.ANULADO === true))
          ),
        ];
      }
    }
    // Comunitarias
    if (this.filtroMaestro[2].VALOR) {
      if (DMaestro.length <= 0) {
        DMaestro = JSON.parse(
          JSON.stringify(
            newArray.filter(
              (d: any) => d.CLASE === 'COMUNITARIAS' && d.ANULADO === true
            )
          )
        );
      } else {
        DMaestro = [
          ...DMaestro,
          ...JSON.parse(
            JSON.stringify(
              newArray.filter(
                (d: any) => d.CLASE === 'COMUNITARIAS' && d.ANULADO === true
              )
            )
          ),
        ];
      }
    }

    //SE APLICA LOS SUB-FILTROS
    let DFiltrados: any = [];
    // Mis Actividades
    if (this.filtroActividades[0]) {
      const misAct: any = JSON.parse(
        JSON.stringify(DMaestro.filter((d: any) => d.ACT_MIAS === true))
      );
      for (let i = 0; i < misAct.length; i++) {
        if (
          DFiltrados.findIndex(
            (a: any) => a.ID_ACTIVIDAD === misAct[i].ID_ACTIVIDAD
          ) === -1
        )
          DFiltrados.push(misAct[i]);
      }
    }
    // Asignadas -- Que asignó a otros usuarios
    if (this.filtroActividades[1]) {
      const asig: any = JSON.parse(
        JSON.stringify(DMaestro.filter((d: any) => d.ACT_ASIG === true))
      );
      for (let i = 0; i < asig.length; i++) {
        if (
          DFiltrados.findIndex(
            (a: any) => a.ID_ACTIVIDAD === asig[i].ID_ACTIVIDAD
          ) === -1
        )
          DFiltrados.push(asig[i]);
      }
    }
    // Colaborador -- En aquellas que es colaborador
    if (this.filtroActividades[2]) {
      const col: any = JSON.parse(
        JSON.stringify(DMaestro.filter((d: any) => d.ACT_COLAB === true))
      );
      for (let i = 0; i < col.length; i++) {
        if (
          DFiltrados.findIndex(
            (a: any) => a.ID_ACTIVIDAD === col[i].ID_ACTIVIDAD
          ) === -1
        )
          DFiltrados.push(col[i]);
      }
    }
    // Comunitarias -- Aquellas que son publicas
    const col: any = JSON.parse(
      JSON.stringify(DMaestro.filter((d: any) => d.CLASE === 'COMUNITARIAS'))
    );
    for (let i = 0; i < col.length; i++) {
      if (
        DFiltrados.findIndex(
          (a: any) => a.ID_ACTIVIDAD === col[i].ID_ACTIVIDAD
        ) === -1
      )
        DFiltrados.push(col[i]);
    }
    let pos: any = -1;

    DFiltrados.forEach((tarea: any) => {
      if (
        DFiltrados.findIndex(
          (d: any) => tarea.ID_ACTIVIDAD_PADRE === d.ID_ACTIVIDAD
        ) === -1
      ) {
        switch (tarea.CLASE) {
          case 'TAREAS':
            if (tarea.TIPO === '') {
              tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
              tarea.ID_ACTIVIDAD_PADRE = -10;
            } else {


              // const pos = Nodos.findIndex((nodo) => nodo.TIPO === tarea.TIPO && nodo.ETIQUETAS === 'PROYECTOS');
              const nodos = Array.from(new Set([...Nodos].map((d: any) => JSON.parse(d))));

              console.log(nodos);

              const index = nodos.findIndex((nodo: any) =>
                nodo.TIPO === tarea.TIPO && nodo.ETIQUETAS === 'PROYECTO'
              );
              if (index != -1) {
                tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
                tarea.ID_ACTIVIDAD_PADRE = nodos[index].ID_ACTIVIDAD;
              }

              // let nuevosNodos: any[] = [];
              // for (let i = 0; i < DFiltrados.length; i++) {
              //   const element = DFiltrados[i];
              //   if(tarea.TIPO === element.TIPO ){

              //   }
              // nuevosNodos = this.DataResTareas_prev.filter(
              //   (d: any) =>
              //     d.CLASE === 'NODOS' &&
              //     (d.TIPO !== '' || d.TIPO !== null) &&
              //     d.ID_ACTIVIDAD === element.ID_ACTIVIDAD_PADRE &&
              //     d.ID_ACTIVIDAD_PADRE !== -20 &&
              //     ![-10, -20, -30, -40, -50].includes(d.ID_ACTIVIDAD)
              // );
              // nuevosNodos.forEach((nodo) => Nodos.add(JSON.stringify(nodo)));
              // }

            }



            break;
          case 'RESPONSABILIDADES':
            tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
            tarea.ID_ACTIVIDAD_PADRE = -20;
            break;
          case 'EVENTOS':
            tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
            tarea.ID_ACTIVIDAD_PADRE = -30;
            break;
          case 'COMUNITARIAS':
            tarea.TEMP = tarea.ID_ACTIVIDAD_PADRE;
            tarea.ID_ACTIVIDAD_PADRE = -50;
            break;

          default:
            break;
        }
      }
    });
    Nodos = Array.from(new Set([...Nodos].map((d: any) => JSON.parse(d))));

    if (DFiltrados.length > 0) this.DataResTareas = [...Nodos, ...DFiltrados];
    else this.DataResTareas = Nodos;

    this.loadingVisible = false;
    if (this.tabsMovilGespro[0].content) {
      this.eventsDatosGES000.next({
        accion: 'cargar datos',
        config: {
          accion: 'update dataSource',
          dataSource: this.DataResTareas,
          nuevaActividad,
          accionFiltro,
        },
      });
    }
    if (this.tabsMovilGespro[1].content) {
      this.eventsDatosCalendario.next({
        accion: 'cargar datos',
        config: { accion: 'update dataSource', dataSource: this.DataResTareas },
      });
    }
  }

  onTabChanged(e: any) {
    switch (e.itemIndex) {
      case 0:
        this.tabsMovilGespro[0].content = true;
        this.tabsMovilGespro[1].content = false;
        this.valoresObjetos('configurar', 'GESPRO');
        this.valoresObjetos('datos columnas', '');
        this.valoresObjetos('actividades', '');
        this.valoresObjetos('responsables', '');
        setTimeout(() => {
          this.eventsDatosGES000.next({
            accion: 'init',
            config: {
              accion: 'init',
              readOnly: this.readOnly,
              APLICACION: this._sdatosGes.prmUsrAplBarReg.aplicacion,
            },
          });
        }, 500);
        break;
      case 1:
        this.tabsMovilGespro[0].content = false;
        this.tabsMovilGespro[1].content = true;
        setTimeout(() => {
          this.eventsDatosCalendario.next({
            accion: 'init',
            config: { accion: 'init', dataSource: this.DataResTareas },
          });
        }, 500);
        break;
      default:
        break;
    }
  }

  showModal(mensaje: any, title: any) {
    const tipo = title;
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo === 'Error' ? 'DF3E3E' : '#0F4C81 !important',
      title: title,
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
      stopKeydownPropagation: false,
    });
  }

  onValueChangedFilter(e: any) {
    this.eventsDatosGES000.next({
      accion: 'filtrar datos',
      textFilter: e.value
    });
  }
}
