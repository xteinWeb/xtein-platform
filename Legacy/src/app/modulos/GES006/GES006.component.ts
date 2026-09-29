import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { AngularSplitModule } from 'angular-split';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxFormModule, DxLoadPanelModule, DxSelectBoxModule, DxSwitchModule, DxTextAreaModule, DxTextBoxModule, DxTreeListComponent, DxTreeListModule } from 'devextreme-angular';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import Swal from 'sweetalert2';
import { showToast } from 'src/app/shared/toast/toastComponent.js';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { GES006Service } from 'src/app/services/GES006/GES006.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { validatorRes } from 'src/app/shared/validator/validator';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { GES007Service } from 'src/app/services/GES007/GES007.service';

@Component({
  selector: 'app-GES006',
  templateUrl: './GES006.component.html',
  styleUrls: ['./GES006.component.css'],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxSelectBoxModule, AngularSplitModule, DxTextBoxModule,
    DxDateBoxModule, DxTreeListModule, DxDataGridModule, DxTextAreaModule, DxButtonModule,
    DxDropDownBoxModule, DxLoadPanelModule, VistarapidaComponent, DxSwitchModule
  ],
  providers: [GES006Service]
})
export class GES006Component {

  @ViewChild('treeListTareasPlantilla', { static: false }) treeListTareasPlantilla;
  @ViewChild("gridPrecedentes", { static: false }) gridPrecedentes: DxDataGridComponent;

  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  prmUsrAplBarReg: clsBarraRegistro;

  data_prev: any;
  FPlantilla: any;
  FTareas: any;
  objReadOnly: any = {
    readOnly: true,
    tareas: true
  }
  DTareas: any[] = [];
  DGtareas: any[] = [];
  DCategorias: any[] = [];
  DtipoPlantillas: any[] = [];
  RESPONSABLES: any[] = [];
  Gprecedentes: any[] = [];
  filasSelecc: any[] = [];
  filasSeleccPrec: any[] = [];
  selectPrecedentes: any[] = [];
  accionAct: any = '';
  USUARIO_LOCAL: any = '';
  esVisibleSelecc: string = 'onClick';
  mnuAccion: string;
  VDatosReg: any;
  conCambios: number = 0;
  widthBuscarTree: any = 200;

  loadingVisible: boolean = false;
  activeBtnEliminar: boolean = false;
  rowDeleteTree: boolean = false;
  activeBtn: boolean = true;
  rowNewPre: boolean = true;
  rowEditPre: boolean = false;
  rowDeletePre: boolean = false;
  rowSavePre: boolean = false;
  rowApplyChangesPre: boolean = false;

  constructor(
    private sDatos: GES006Service,
    private _sDatos: GES007Service,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private tabService: TabService,
    private SVisor: SvisorService
  ) {
    // Servicio de barra de registro
    this.subscription = this._sbarreg
      .getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((datreg) => {
        // Valida si la petición es para esta aplicacion
        if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(datreg);
      });

    // Filtro de búsqueda
    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe(resp => {
      // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opPrepararBuscar(resp);
    });

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex((d: any) => d.ID_DOCUMENTO === resp.ID_DOCUMENTO);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    });

    this.onResized = this.onResized.bind(this);
    this.switchEjecutable = this.switchEjecutable.bind(this);
    this.onDragChange = this.onDragChange.bind(this);


  }


  ngOnInit() {
    this.USUARIO_LOCAL = localStorage.getItem("usuario");
    this.FPlantilla = {
      ID_DOCUMENTO: '',
      CONSECUTIVO: 0,
      NOMBRE: '',
      DESCRIPCION: '',
      ESTADO: '',
      TIPO: '',
      CATEGORIA: '',
      FECHA_REGISTRO: '',
      USUARIO: '',
    };
    this.FTareas = {
      ID_ACTIVIDAD: '',
      ID_ACTIVIDAD_PADRE: '',
      ACTIVIDAD: '',
      ESTADO: '',
      OBJETIVO: '',
      DESCRIPCION: '',
      ORDEN: '',
      EJECUTABLE: false,
      RESPONSABLE: '',
      PRECEDENTES: []
    };
    this.Gprecedentes = [];
    this.prmUsrAplBarReg = {
      tabla: "PLANTILLAS",
      aplicacion: "GES-006",
      usuario: this.USUARIO_LOCAL,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: {}
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';
    this.objReadOnly = {
      readOnly: true,
      tareas: true
    };
    this.VDatosReg = [];
    this.valoresObjetos('categorias');
    this.valoresObjetos('tipo_categorias');
    this.valoresObjetos('responsables');
  }


  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  onResized(event: any) {
    const width: number = event.newRect.width;
    setTimeout(() => {
      const ed = this.treeListTareasPlantilla.instance.element().offsetWidth;
      this.widthBuscarTree = ed - 20;
    }, 300);
  }

  dragEnd(e: any): any {
    const ed = this.treeListTareasPlantilla.instance.element().offsetWidth;
    setTimeout(() => {
      const ed = this.treeListTareasPlantilla.instance.element().offsetWidth;
      this.widthBuscarTree = ed - 20;
    }, 300);
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.prmUsrAplBarReg = {
          tabla: "PLANTILLAS",
          aplicacion: "GES-006",
          usuario: this.USUARIO_LOCAL,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: {}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.mnuAccion = "update";
        this.opPrepararModificar();
        break;

      case "r_guardar":
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case "r_buscar":
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case "r_buscar_ejec":
        this.opBlanquearForma();
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case "r_eliminar":

        this.validPlantilla()

        break;

      case "r_primero":
      case "r_anterior":
      case "r_siguiente":
      case "r_ultimo":
      case "r_numreg":
        this.opIrARegistro(operMenu.accion);
        break;

      case "r_cancelar":
        Swal.fire({
          title: '',
          text: '¿Desea cancelar la operación?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              operacion: {}
            }
            this.objReadOnly.readOnly = true;
            this.objReadOnly.tareas = true;
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            if (this.VDatosReg.length > 0) {
              this.opIrARegistro('r_numreg');
            } else {
              this.opBlanquearForma();
            }
            // Restituye los valores
            this.mnuAccion = "";
          }
        });

        break;

      case "r_vista":
        this.opVista();
        break;

      case 'r_refrescar':
        this.valoresObjetos('todos');
        break;

      case "r_imprimir":
        // this.imprimirReporte(
        //   operMenu.operacion.id_reporte,
        //   operMenu.operacion.archivo,
        //   operMenu.operacion.data_rpt
        // );
        break;

      default:
        break;
    }
  }
  validPlantilla() {
    const prm = { DOCUMENTO: this.FPlantilla.ID_DOCUMENTO };
    this.sDatos.consulta('INTEGRIDAD REFERENCIAL', prm, this.prmUsrAplBarReg.aplicacion).subscribe(data => {
      let res = JSON.parse(data.data);
      if (res[0].ErrMensaje !== '' && res[0].ErrMensaje !== undefined && res[0].ErrMensaje !== null) {
        this.showModal(res[0].ErrMensaje)
      } else {
        this.opEliminar();
      }
    });


  }

  // Llama a Acciones de registro
  opPrepararNuevo(): void {
    this.opBlanquearForma();
    if (this.mnuAccion.match('new'))
      this.valoresObjetos('consecutivo');

    this.FPlantilla.ESTADO = 'ACTIVO';
    this.FPlantilla.FECHA_REGISTRO = new Date();
    this.FPlantilla.USUARIO = this.USUARIO_LOCAL;
  }

  opBlanquearForma(): void {
    this.FPlantilla = {
      ID_DOCUMENTO: '',
      CONSECUTIVO: 0,
      NOMBRE: '',
      DESCRIPCION: '',
      ESTADO: '',
      TIPO: '',
      CATEGORIA: '',
      FECHA_REGISTRO: '',
      USUARIO: '',
    };

    this.DTareas = [];
    this.DGtareas = [];
    this.Gprecedentes = [];
    this.filasSelecc = [];
    this.filasSeleccPrec = [];
  }

  opPrepararModificar(): void {
    this.objReadOnly = {
      readOnly: false,
      tareas: false
    };
  }

  opPrepararBuscar(accion: any): void {
    if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Plantillas",
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion
      };
      this._sfiltro.getObsFiltro.emit(true);

    } else {
      this._sfiltro.enConsulta = true;
      this.loadingVisible = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { PLANTILLAS: arrFiltro };

      // Ejecuta búsqueda API
      this.sDatos
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((resp: any) => {

          this._sfiltro.enConsulta = false;
          this.loadingVisible = false;
          const datares = JSON.parse(resp.data);

          if (datares[0].ErrMensaje !== '') {
            this.VDatosReg = [];
            this.opBlanquearForma();
            showToast(datares[0].ErrMensaje, 'error');
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              accion: "r_ini",
              error: "",
              r_numReg: 0,
              r_totReg: 0,
              operacion: {}
            };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            return;
          }
          // for (let i = 0; i < datares.length; i++) {
          //   const element = datares[i];
          //   for (let j = 0; j < element.ITEMS.length; j++) {
          //     const data = element.ITEMS[j];
          //     if (data.PRECEDENTES !== '') {
          //       data.PRECEDENTES = JSON.parse(data.PRECEDENTES);
          //     }else {
          //       data.PRECEDENTES = [];
          //     }
          //   }
          // }
          this.VDatosReg = [];
          this.VDatosReg = datares === null ? [] : datares;
          if (this.VDatosReg.length > 0) {
            this.data_prev = this.VDatosReg[0];
            // Prepara la barra para navegación
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              r_totReg: this.VDatosReg.length,
              r_numReg: 1,
              accion: 'r_navegar',
              operacion: {}
            }
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.opIrARegistro('r_primero');
          } else {
            this.opBlanquearForma();
          }

          this.objReadOnly = {
            readOnly: true,
            tareas: true
          };
        });
    }
  }

  opIrARegistro(accion: string): void {
    var newArray: any = {};
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        this.prmUsrAplBarReg.r_numReg = 1;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[0]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_numreg":
        if (this.prmUsrAplBarReg.r_numReg !== 0) {
          // Valida si hubo cambio de ordenamiento en el visor
          if (this.SVisor.ColSort.Columna !== "") {
            if (this.SVisor.ColSort.Clase === "asc") {
              this.VDatosReg = this.VDatosReg.sort((a: any, b: any) =>
                a[this.SVisor.ColSort.Columna].toUpperCase() <
                  b[this.SVisor.ColSort.Columna].toUpperCase()
                  ? -1
                  : 1
              );
            } else {
              this.VDatosReg = this.VDatosReg.sort((a: any, b: any) =>
                a[this.SVisor.ColSort.Columna].toUpperCase() >
                  b[this.SVisor.ColSort.Columna].toUpperCase()
                  ? -1
                  : 1
              );
            }
          }
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

        } else {
          newArray = {};
        }
        this.objReadOnly = {
          readOnly: true,
          tareas: true
        };
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        this.prmUsrAplBarReg.r_totReg--;
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length > 0) {
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        } else {
          newArray = {};
        }
        break;

      default:
        break;
    }

    try {
      // Trae secciones asociadas a la ruta
      this.data_prev = JSON.parse(JSON.stringify(newArray));
      this.FPlantilla = {
        ID_DOCUMENTO: newArray.ID_DOCUMENTO,
        CONSECUTIVO: newArray.CONSECUTIVO,
        NOMBRE: newArray.NOMBRE,
        DESCRIPCION: newArray.DESCRIPCION,
        ESTADO: newArray.ESTADO,
        TIPO: newArray.TIPO,
        CATEGORIA: newArray.CATEGORIA,
        FECHA_REGISTRO: new Date(newArray.FECHA_REGISTRO),
        USUARIO: newArray.USUARIO,
      };
      newArray.ITEMS.forEach((ele: any) => {
        ele.PRECEDENTES = ele.PRECEDENTES === '' ? [] : JSON.parse(ele.PRECEDENTES);
        for (let i = 0; i < ele.PRECEDENTES.length; i++) {
          var newTarea: any = {};
          const ite: any = ele.PRECEDENTES[i];
          const pos: any = newArray.ITEMS.findIndex((d: any) => d.ID_ACTIVIDAD === ite);
          if (pos > -1) {
            newTarea = {
              ITEM: i,
              ID_ACTIVIDAD: newArray.ITEMS[pos].ID_ACTIVIDAD,
              ID_ACTIVIDAD_PADRE: newArray.ITEMS[pos].ID_ACTIVIDAD_PADRE,
              ACTIVIDAD: newArray.ITEMS[pos].ACTIVIDAD,
              ACTIVIDAD_PADRE: newArray.ITEMS[pos].ACTIVIDAD_PADRE ? newArray.ITEMS[pos].ACTIVIDAD_PADRE :
                newArray.ITEMS[pos].ID_ACTIVIDAD_PADRE === -5 ? this.FPlantilla.NOMBRE : ''
            }
          }
          ele.PRECEDENTES[i] = newTarea;
        }
      });
      this.DTareas = JSON.parse(JSON.stringify(newArray.ITEMS));
      this.DTareas.push({
        ITEM: 0,
        ID_ACTIVIDAD: -5,
        ID_ACTIVIDAD_PADRE: -1,
        ACTIVIDAD: this.FPlantilla.NOMBRE,
        PRECEDENTES: [],
        ESTADO: '',
        OBJETIVO: '',
        DESCRIPCION: ''
      });
      this.DTareas.sort((a, b) => a.ORDEN - b.ORDEN);
      this.DGtareas = JSON.parse(JSON.stringify(this.DTareas));
      setTimeout(() => {
        this.treeListTareasPlantilla.instance.refresh();
      }, 300);

    } catch (err) {
      this.showModal(err);
    }
  }

  opEliminar(): void {
    // Confirma...
    Swal.fire({
      title: '',
      text: '',
      html: "¿Desea eliminar la Plantilla <i>" +
        this.FPlantilla.NOMBRE +
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
        this.AccionEliminar();
      }
    });

  }
  // Ejecuta la eliminación
  AccionEliminar(): void {
    // API eliminación de datos
    const prm = { ID_DOCUMENTO: this.FPlantilla.ID_DOCUMENTO, CONSECUTIVO: this.FPlantilla.CONSECUTIVO };
    this.sDatos
      .consulta('eliminar', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        this.opIrARegistro("Eliminado");
        this.objReadOnly = {
          readOnly: true,
          tareas: true
        };
        showToast('Plantilla eliminada', 'success');

        // Operaciones de barra
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          error: "",
          accion: this.prmUsrAplBarReg.r_totReg !== 0 ? 'r_navegar' : 'r_ini',
          operacion: {}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      });
  }
  // Vista/Zoom de los datos consultados
  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: "Plantillas",
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: ['ID_DOCUMENTO|Documento', 'NOMBRE|Nombre', 'DESCRIPCION|Descripción', 'CATEGOTIA|Categoria', 'TIPO|Tipo'],
      Filtro: '',
      keyGrid: ['ID_DOCUMENTO']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opPrepararGuardar(accion: string) {
    // Acción validación de datos
    if (!this.ValidaDatos()) return;

    this.loadingVisible = true;
    //ajuste de campos adicionales
    var newDTareas: any = JSON.parse(JSON.stringify(this.DTareas));
    newDTareas.forEach((ele: any) => {
      ele.PRECEDENTES = ele.PRECEDENTES ? ele.PRECEDENTES.map((d: any) => d.ID_ACTIVIDAD) : [];
      ele.PRECEDENTES = ele.PRECEDENTES.length > 0 ? JSON.stringify(ele.PRECEDENTES) : '';

    });
    const pos: any = newDTareas.findIndex((d: any) => d.ID_ACTIVIDAD === -5);
    newDTareas.splice(pos, 1);
    // API guardado de datos
    const prmDatos = { ENCABEZADO: this.FPlantilla, ITEMS: newDTareas };
    this.sDatos.consulta(accion, prmDatos, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        this.loadingVisible = false;
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== "") {
          this.showModal(res[0].ErrMensaje);
        } else {

          this.objReadOnly = {
            readOnly: true,
            tareas: true
          }

          // Operaciones de barra
          if (this.mnuAccion === 'new')
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              r_numReg: 1,
              r_totReg: 1,
              operacion: {}
            };
          else
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              operacion: {}
            };

          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          showToast('Registro actualizado', 'success');
        }
      });
  }

  ValidaDatos() {
    var resValidatos: boolean = false;
    if (
      this.FPlantilla.ID_DOCUMENTO === '' &&
      this.FPlantilla.CONSECUTIVO <= 0 &&
      this.FPlantilla.DESCRIPCION === '' &&
      this.FPlantilla.CATEGORIA === ''
    ) {
      this.showModal('', "Faltan datos", "<b>Hay datos que faltan. Revisar contenido de datos!</b>");
      return resValidatos = false;
    } else if (this.DTareas.length <= 0) {
      this.showModal('', "Faltan datos por cargar", "<b>Revisar contenido del arbol de las actividades.</b>");
      return resValidatos = false;
    } else if (this.FTareas.ACTIVIDAD !== '' && this.rowApplyChangesPre && !this.rowNewPre) {
      this.showModal('', "Faltan datos por cargar", "<b>Revisar contenido de la actividad seleccionada y sus actividades precedentes.</b>");
      return resValidatos = false;
    } else if (this.conCambios <= 0) {
      showToast('No hay cambios pendientes por guardar.', 'warning');
      return resValidatos = false;
    } else if (this.rowApplyChangesPre) {
      showToast('Faltan datos por guardar en las Tareas Precedentes.', 'error');
      return resValidatos = false;
    }
    return resValidatos = true;
  }

  onRowPrepared(e: any) {
    if (e.rowType === 'data') {
      if (Number(e.data.ID_ACTIVIDAD) < 0) {
        const className: string = e.rowElement.className;
        e.rowElement.className = className + ' xt-header-row';
      }
      if (Number(e.data.ID_ACTIVIDAD) === -5) {
        const dragicon = e.rowElement.getElementsByClassName('dx-select-checkbox');
        if (dragicon.length > 0) dragicon[0].style['visibility'] = 'hidden';
      }
    }
  }

  onContentReady(e: any, campo: string) {
    e.component.columnOption("command:edit", "visible", false);
    setTimeout(() => {
      const ed = this.treeListTareasPlantilla.instance.element().offsetWidth;
      this.widthBuscarTree = ed - 20;
    }, 300);
  }

  selectionTreeList(e: any) {
    this.filasSelecc = e.selectedRowsData;
    if (this.filasSelecc.length > 0)
      this.rowDeleteTree = true;
    else
      this.rowDeleteTree = false;

    if (this.filasSelecc.length === 1) {
      if (e.selectedRowsData[0].ID_ACTIVIDAD !== -5) {
        this.FTareas = e.selectedRowsData[0];
        this.Gprecedentes = e.selectedRowsData[0].PRECEDENTES ? e.selectedRowsData[0].PRECEDENTES : [];
        this.activeBtn = false;
        this.accionAct = 'update';

        //Se verifica si tinene tareas hijas
        const Thijas: any[] = this.DTareas.filter((d: any) => d.ID_ACTIVIDAD_PADRE === this.FTareas.ID_ACTIVIDAD);
        if (Thijas.length > 0)
          this.activeBtnEliminar = false;
        else
          this.activeBtnEliminar = true;

      } else {
        this.FTareas = {
          ID_ACTIVIDAD: '',
          ID_ACTIVIDAD_PADRE: '',
          ACTIVIDAD: '',
          ESTADO: '',
          OBJETIVO: '',
          DESCRIPCION: '',
          ORDEN: '',
          EJECUTABLE: false,
          RESPONSABLE: '',
          PRECEDENTES: []
        };
        this.Gprecedentes = [];
        this.activeBtn = true;
        this.activeBtnEliminar = false;
        this.accionAct = 'new';
      }
    } else if (this.filasSelecc.length > 1 || this.filasSelecc.length < 1) {
      this.FTareas = {
        ID_ACTIVIDAD: '',
        ID_ACTIVIDAD_PADRE: '',
        ACTIVIDAD: '',
        ESTADO: '',
        OBJETIVO: '',
        DESCRIPCION: '',
        ORDEN: '',
        EJECUTABLE: false,
        RESPONSABLE: '',
        PRECEDENTES: []
      };
      this.Gprecedentes = [];
      this.activeBtn = true;
      this.activeBtnEliminar = false;
      this.accionAct = 'new';
    }
  }

  onValueChanged(e: any, formulario: string, campo: string) {
    if (this.mnuAccion.match('new|update')) {
      switch (formulario) {
        case 'Plantilla':
          switch (campo) {
            case 'NOMBRE_PLANTILLA':
              if (e.value.length > 0 && e.value.length >= 5) {
                const dTarea: any = {
                  ID_ACTIVIDAD: -5,
                  ID_ACTIVIDAD_PADRE: -1,
                  ACTIVIDAD: e.value,
                  PRECEDENTES: [],
                  OBJETIVO: '',
                  DESCRIPCION: ''
                }
                this.agregarTarea(dTarea);
                this.accionAct = 'new';
              } else if (e.value.length > 0 && e.value.length < 5) {
                showToast('El nombre de la plantilla debe tener mas de cinco(5) caracteres.', 'warning');
              }
              break;

            case 'ESTADO':
              if (e.value.length > 0 && e.value.length < 5) {
                showToast('El nombre de la actividad debe tener tener min:5 y max:100 caracteres.', 'warning');
              }
              break;

            default:
              break;
          }

          break;

        case 'Tareas':
          switch (campo) {
            case 'NOMBRE_ACTIVIDAD':
              if (e.value.length > 0 && e.value.length < 5) {
                showToast('El nombre de la actividad debe tener tener min:5 y max:100 caracteres.', 'warning');
              }
              break;

            case 'OBJETIVO':
              if (e.value.length > 0 && e.value.length < 5) {
                showToast('El objetivo debe tener más de cinco(5) caracteres.', 'warning');
              } else {
                this.FTareas.OBJETIVO = e.value;
              }
              break;

            case 'DESCRIPCION':
              if (e.value.length > 0 && e.value.length < 5) {
                showToast('La descripción debe tener más de cinco(5) caracteres.', 'warning');
              } else {
                this.FTareas.DESCRIPCION = e.value;
              }
              break;

            default:
              break;
          }

          break;

        default:
          break;
      }

      this.conCambios++;
      this.validarDatos();
    }
  }

  agregarTarea(data: any) {
    if (this.DTareas.length > 0) {
      const pos: any = this.DTareas.findIndex((d: any) => d.ID_ACTIVIDAD === data.ID_ACTIVIDAD);
      if (pos > -1) {
        this.DTareas[pos] = data;
      } else {
        this.DTareas.push(data);
        this.DGtareas.push(data);
      }
      this.DTareas.sort((a, b) => a.ORDEN - b.ORDEN);
    } else {
      this.DTareas = [data];
      this.DGtareas.push(data);
      this.DTareas.sort((a, b) => a.ORDEN - b.ORDEN);
    }

    setTimeout(() => {
      this.treeListTareasPlantilla.instance.refresh();
    }, 300);

    if (this.DTareas.length > 0)
      this.objReadOnly.tareas = false;
    else
      this.objReadOnly.tareas = true;
  }

  validarDatos() {
    if (this.FTareas.ID_ACTIVIDAD_PADRE !== '' && this.FTareas.ID_ACTIVIDAD_PADRE !== -1 && this.FTareas.ACTIVIDAD !== '')
      this.activeBtn = false;
  }

  // Operaciones de grid
  operGrid(e: any, operacion: any, componente: any) {
    switch (componente) {
      case 'TreeListTareas':
        switch (operacion) {
          case 'delete':
            // Elimina filas seleccionadas
            Swal.fire({
              title: '',
              text: '¿Desea eliminar los items seleccionados?',
              iconHtml: "<i class='icon-alert-ol'></i>",
              showCancelButton: true,
              confirmButtonColor: '#DF3E3E',
              cancelButtonColor: '#438ef1',
              cancelButtonText: 'No',
              confirmButtonText: 'Sí, eliminar'
            }).then((result) => {
              if (result.isConfirmed) {
                this.filasSelecc.forEach((data: any) => {
                  const index = this.DTareas.findIndex((a: any) => a.ID_COMPONENTE === data.ID_COMPONENTE);
                  this.DTareas.splice(index, 1);
                });
                this.treeListTareasPlantilla.instance.refresh();
                if (this.filasSelecc.length > 0) {
                  this.rowDeleteTree = true;
                } else {
                  this.rowDeleteTree = false;
                }
                this.conCambios++;
              }
            });
            break;

          default:
            break;
        }
        break;

      case 'GreedPrececentes':
        switch (operacion) {
          case 'new':
            this.gridPrecedentes.instance.clearSelection();
            this.gridPrecedentes.instance.addRow();
            this.filasSelecc = [];
            this.rowApplyChangesPre = true;
            this.rowNewPre = false;
            this.rowDeletePre = false;
            // this.esVisibleSelecc = 'none';
            break;
          case 'edit':
            this.gridPrecedentes.instance.clearSelection();
            this.rowApplyChangesPre = true;
            this.rowNewPre = false;
            this.rowDeletePre = false;
            // this.esVisibleSelecc = 'none';
            break;
          case 'save':
            this.gridPrecedentes.instance.saveEditData();
            // this.rowApplyChangesPre = false;
            // this.rowNewPre = true;
            break;
          case 'cancel':
            this.gridPrecedentes.instance.cancelEditData();
            this.rowApplyChangesPre = false;
            this.rowNewPre = true;
            if (this.filasSelecc.length > 0) {
              this.rowDeletePre = true;
            } else {
              this.rowDeletePre = false;
            };
            if (this.filasSeleccPrec.length === 1) {
              this.rowEditPre = true;
            } else if (this.filasSeleccPrec.length > 1 || this.filasSeleccPrec.length < 1) {
              this.rowEditPre = false;
            };
            this.gridPrecedentes.instance.refresh();
            break;
          case 'delete':
            // Elimina filas seleccionadas
            Swal.fire({
              title: '',
              text: '¿Desea eliminar los items seleccionados?',
              iconHtml: "<i class='icon-alert-ol'></i>",
              showCancelButton: true,
              confirmButtonColor: '#DF3E3E',
              cancelButtonColor: '#438ef1',
              cancelButtonText: 'No',
              confirmButtonText: 'Sí, eliminar'
            }).then((result) => {
              if (result.isConfirmed) {
                this.filasSelecc.forEach((data: any) => {
                  const index = this.Gprecedentes.findIndex((a: any) => a.ID_COMPONENTE === data.ID_COMPONENTE);
                  this.Gprecedentes.splice(index, 1);
                });
                this.gridPrecedentes.instance.refresh();
                this.rowApplyChangesPre = false;
                this.rowNewPre = true;
                if (this.filasSelecc.length > 0) {
                  this.rowDeletePre = true;
                } else {
                  this.rowDeletePre = false;
                }
                this.conCambios++;
              }
            });
            break;

          default:
            break;
        }
        break;

      default:
        break;
    }

  }

  onSelectionPrecedente(e: any, cellInfo: any) {
    if (e.selectedRowKeys.length > 0) {
      if (this.Gprecedentes.findIndex((d: any) => d.ID_ACTIVIDAD === e.selectedRowsData[0].ID_ACTIVIDAD) === -1) {
        cellInfo.data.ID_ACTIVIDAD = e.selectedRowsData[0].ID_ACTIVIDAD;
        cellInfo.data.ID_ACTIVIDAD_PADRE = e.selectedRowsData[0].ID_ACTIVIDAD_PADRE;
        cellInfo.data.ACTIVIDAD = e.selectedRowsData[0].ACTIVIDAD;
        const pos: any = this.DGtareas.findIndex((d: any) => d.ID_ACTIVIDAD === cellInfo.data.ID_ACTIVIDAD_PADRE);
        if (pos > -1)
          cellInfo.data.ACTIVIDAD_PADRE = this.DGtareas[pos].ACTIVIDAD;

        this.gridPrecedentes.instance.cellValue(cellInfo.rowIndex, "ACTIVIDAD", cellInfo.data.ACTIVIDAD);
        this.gridPrecedentes.instance.cellValue(cellInfo.rowIndex, "ACTIVIDAD_PADRE", cellInfo.data.ACTIVIDAD_PADRE);
      } else {
        cellInfo.data.ID_ACTIVIDAD = '';
        cellInfo.data.ID_ACTIVIDAD_PADRE = '';
        cellInfo.data.ACTIVIDAD = '';
        this.gridPrecedentes.instance.cellValue(cellInfo.rowIndex, "ACTIVIDAD", cellInfo.data.ACTIVIDAD);
        this.gridPrecedentes.instance.cellValue(cellInfo.rowIndex, "ID_ACTIVIDAD_PADRE", cellInfo.data.ID_ACTIVIDAD_PADRE);
        showToast('No puede repetir el máterial en la misma sección.', 'error');
      }
    } else {
      cellInfo.data.ID_ACTIVIDAD = '';
      cellInfo.data.ID_ACTIVIDAD_PADRE = '';
      cellInfo.data.ACTIVIDAD = '';
      this.gridPrecedentes.instance.cellValue(cellInfo.rowIndex, "ACTIVIDAD", cellInfo.data.ACTIVIDAD);
      this.gridPrecedentes.instance.cellValue(cellInfo.rowIndex, "ID_ACTIVIDAD_PADRE", cellInfo.data.ID_ACTIVIDAD_PADRE);
      showToast('No puede repetir el máterial en la misma sección.', 'error');
    }
  }

  onSelectionChangedPrecedentes(e: any) {
    this.filasSeleccPrec = e.selectedRowsData;
    if (this.filasSeleccPrec.length > 0)
      this.rowDeletePre = true;
    else
      this.rowDeletePre = false;

    if (this.filasSeleccPrec.length === 1) {
      this.rowEditPre = true;
    } else if (this.filasSeleccPrec.length > 1 || this.filasSeleccPrec.length < 1) {
      this.rowEditPre = false;
    }
  }

  onRowInsertedPrecedentes(e: any) {
    this.FTareas.PRECEDENTES = this.Gprecedentes;
  }

  onInitNewRowPrecedentes(e: any) {
    e.data.ID_ACTIVIDAD = '';
    e.data.ID_ACTIVIDAD_PADRE = '';
    if (this.Gprecedentes.length > 0) {
      const item = this.Gprecedentes.reduce((ant, act) => {
        return ant.ITEM > act.ITEM ? ant : act;
      });
      e.data.ITEM = item.ITEM + 1;
    } else {
      e.data.ITEM = 1;
    }
    this.selectPrecedentes = [];
  }

  onRowValidatingPrecedentes(e: any) {
    let mensaje: any = '';
    let propiedadesVacias: any = [];
    const propiedadesVerificar = ["ACTIVIDAD", "ACTIVIDAD_PADRE"];

    if (((e.newData.ID_ACTIVIDAD === '') || (e.newData.ID_ACTIVIDAD === null)) ||
      ((e.newData.ID_ACTIVIDAD_PADRE === '') || (e.newData.ID_ACTIVIDAD_PADRE === null))
    ) {
      for (let key in e.newData) {
        if (propiedadesVerificar.includes(key) && !e.newData[key]) {
          propiedadesVacias.push(key);
        }
      }
      if (propiedadesVacias.length > 0)
        mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;

      e.isValid = false;
      showToast(mensaje, 'error');

    } else {
      e.isValid = true;
      this.rowNewPre = true;
      this.rowApplyChangesPre = false;
      this.rowDeletePre = false;
      this.rowEditPre = false;
      this.selectPrecedentes = [];
      // this.esVisibleSelecc = 'onClick';
    }

    this.gridPrecedentes.instance.clearSelection();
    return e.isValid;

  }

  onClickBtn(e: any, btn: any) {
    switch (btn) {
      case 'ACEPTAR':
        if (!this.rowApplyChangesPre) {
          if (this.accionAct === '')
            this.accionAct = 'new';

          if (this.accionAct === 'new') {
            if (this.DTareas.length > 0) {
              const item = this.DTareas.reduce((ant, act) => {
                return ant.ID_ACTIVIDAD > act.ID_ACTIVIDAD ? ant : act;
              });
              this.FTareas.ID_ACTIVIDAD = item.ID_ACTIVIDAD + 1;
            } else {
              this.FTareas.ID_ACTIVIDAD = 1;
            }

            if (this.FTareas.ID_ACTIVIDAD < 0)
              this.FTareas.ID_ACTIVIDAD = 1

            this.FTareas.ESTADO = 'Sin Iniciar';
          }
          this.agregarTarea(this.FTareas);
          this.onClickBtn('', 'LIMPIAR');
        } else {
          showToast('Faltan datos por guardar en las Precedentes.', 'error');
          return;
        }
        break;

      case 'LIMPIAR':
        if (!this.rowApplyChangesPre) {
          this.FTareas = {
            ID_ACTIVIDAD: '',
            ID_ACTIVIDAD_PADRE: '',
            ACTIVIDAD: '',
            ESTADO: '',
            OBJETIVO: '',
            DESCRIPCION: '',
            ORDEN: '',
            EJECUTABLE: false,
            RESPONSABLE: '',
            PRECEDENTES: []
          };
          this.Gprecedentes = [];
          this.selectPrecedentes = [];
          this.activeBtn = true;
          this.activeBtnEliminar = false;
          this.accionAct = 'new';
          this.treeListTareasPlantilla.instance.clearSelection();
        } else {
          showToast('Faltan datos por guardar en las Precedentes.', 'error');
          return;
        }
        break;

      case 'ELIMINAR':
        if (!this.rowApplyChangesPre) {
          const pos: any = this.DTareas.findIndex((d: any) => d.ID_ACTIVIDAD === this.FTareas.ID_ACTIVIDAD);
          if (pos > -1) {
            this.DTareas.splice(pos, 1);
          };
          const npos: any = this.DGtareas.findIndex((d: any) => d.ID_ACTIVIDAD === this.FTareas.ID_ACTIVIDAD);
          if (npos > -1) {
            this.DGtareas.splice(pos, 1);
          };
          this.onClickBtn('', 'LIMPIAR');
        } else {
          showToast('Faltan datos por guardar en las Precedentes.', 'error');
          return;
        }
        break;

      default:
        break;
    }

  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string) {
    if (obj === 'consecutivo') {
      const prm = { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, CLASE: 'PLANTILLA' };
      this.sDatos.consulta('CONSECUTIVO', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if (res.ErrMensaje !== '') {
          this.showModal(res.ErrMensaje);
        } else {
          if (res.CONSECUTIVO !== 0) {
            this.FPlantilla.ID_DOCUMENTO = res.ID_DOCUMENTO;
            this.FPlantilla.CONSECUTIVO = res.CONSECUTIVO;
            this.objReadOnly.readOnly = false;
          } else {
            this.FPlantilla.ID_DOCUMENTO = '';
            this.FPlantilla.CONSECUTIVO = '';
          }
        }
      });
    };
    if (obj === 'categorias' || obj === 'todos') {
      this.sDatos.consulta('CATEGORIAS', {}, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== '') {
          this.DCategorias = [];
          this.showModal(res.ErrMensaje);
        } else {
          this.DCategorias = res;
        }
      });
    };
    if (obj === 'tipo_categorias' || obj === 'todos') {
      const prm = { ID_DOMINIO: 'PLANTILLAS', ID_GRUPO_DOMINIO: 'TIPO' };
      this.sDatos.getDominios('ITM_DOMINIOS', prm).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== '') {
          this.DtipoPlantillas = [];
          this.showModal(res.ErrMensaje);
        } else {
          this.DtipoPlantillas = res;
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
            this.RESPONSABLES = res;
          }
        },
        (err: any) => {
          this.showModal(err.message, 'Error');
        }
      );
    }
  }

  // Imprimir reporte de aplicación
  imprimirReporte(id_reporte: any, archivo: any, datosrpt: any) {
    let filtroRep = {};
    const prmLiq = {
      clid: localStorage.getItem('empresa'),
      usuario: localStorage.getItem('usuario'),
      idrpt: archivo,
      id_reporte,
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      filtro: filtroRep
    };

    // Si no existe, no está abierta entonces agrega Tab
    const listaTab = this.tabService.tabs.find(c => c.aplicacion === id_reporte);
    if (listaTab === undefined)
      GlobalVariables.listaAplicaciones.unshift({ aplicacion: id_reporte, barra: undefined, statusEdicion: '' });

    // Abre pestaña con nuevo reporte
    this.tabService.addTab(new Tab(VisorrepComponent,    // visor
      datosrpt.text,        // título
      { parent: "PrincipalComponent", args: prmLiq }, // parámetro: reporte,filtro
      id_reporte,           // código del reporte
      '',
      'reporte',
      true
    ));
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

  switchEjecutable(e: any) {

    if (e.value === false) {
      this.FTareas.RESPONSABLE = '';
    }
    this.FTareas.EJECUTABLE = e.value;
  }




  onDragStart(e: any) {
    if (e.itemData.CLASE === 'NODOS') {
      showToast('No puede mover este Item.', 'warning');
      e.cancel = true;
      return;
    }
  }

  onDragChange(e: any) {
    const visibleRows = e.component.getVisibleRows();
    const sourceNode = e.component.getNodeByKey(e.itemData.ID_ACTIVIDAD);

    let targetNode = visibleRows[e.toIndex].node;
    if (sourceNode === undefined) return;

    const positonAnterior = sourceNode.data.ORDEN;
    sourceNode.data.ORDEN = targetNode.data.ORDEN;
    targetNode.data.ORDEN = positonAnterior;
    this.DTareas.sort((a, b) => a.ORDEN - b.ORDEN);
    setTimeout(() => {
      this.treeListTareasPlantilla.instance.refresh();
    }, 300);

  }
}
