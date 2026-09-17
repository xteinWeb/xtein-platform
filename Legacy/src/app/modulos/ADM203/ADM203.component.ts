import {
  DxFormModule,
  DxSwitchModule,
  DxTagBoxModule,
  DxTextBoxModule,
  DxTooltipModule,
  DxToolbarModule,
  DxPopoverModule,
  DxFormComponent,
  DxTreeListModule,
  DxDataGridModule,
  DxTextAreaModule,
  DxTemplateModule,
  DxLoadPanelModule,
  DxSelectBoxModule,
  DxValidatorModule,
  DxTagBoxComponent,
  DxDropDownBoxModule,
  DxTreeListComponent,
  DxDataGridComponent,
  DxButtonModule,
} from 'devextreme-angular';
import Swal from 'sweetalert2';
import { MGrupos } from './clsADM203.class';
import { CommonModule } from '@angular/common';
import { AngularSplitModule } from 'angular-split';
import DataSource from 'devextreme/data/data_source';
import ArrayStore from 'devextreme/data/array_store';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularResizeEventModule } from 'angular-resize-event';
import { showToast } from '../../shared/toast/toastComponent.js';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { Subscription, Subject, takeUntil, lastValueFrom } from 'rxjs';
import { ADM203Service } from 'src/app/services/ADM203/ADM203.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { MenufloatComponent } from 'src/app/shared/menufloat/menufloat.component';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';

@Component({
  selector: 'app-ADM203',
  templateUrl: './ADM203.component.html',
  styleUrls: ['./ADM203.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    DxFormModule,
    DxSwitchModule,
    DxTagBoxModule,
    DxTooltipModule,
    DxTextBoxModule,
    DxToolbarModule,
    DxPopoverModule,
    DxDataGridModule,
    DxTreeListModule,
    DxTextAreaModule,
    DxTemplateModule,
    DxSelectBoxModule,
    DxValidatorModule,
    DxLoadPanelModule,
    AngularSplitModule,
    DxDropDownBoxModule,
    VistarapidaComponent,
    GeninformesComponent,
    AngularResizeEventModule,
    DxButtonModule,
  ],
})
export class ADM203Component implements OnInit {
  @ViewChild('etqSelect', { static: false }) etqSelect: DxTagBoxComponent;
  @ViewChild('formGrupos', { static: false }) formGrupos: DxFormComponent;
  @ViewChild('treeListGrupos', { static: false })
  treeListGrupos: DxTreeListComponent;
  @ViewChild('gridGruposAsociados', { static: false })
  gridGruposAsociados: DxDataGridComponent;

  public _unsubscribeAll: Subject<any>;

  // Variables fijas de la aplicación
  subs_visor: Subscription;
  subs_filtro: Subscription;
  subscription: Subscription;
  eventsSubject: Subject<void> = new Subject<void>();
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();

  VDatosReg: any;
  mnuAccion: string;
  readOnly: boolean = true;
  expandGrupos: boolean = true;
  readOnlyEstado: boolean = true;
  readOnlyIdGrupo: boolean = true;
  btnContraer: string = 'Expandir';
  prmUsrAplBarReg: clsBarraRegistro;
  integridadReferencial: boolean = false;

  // Variables de datos
  QFiltro: any;
  USUARIO: any;
  treeGrupos: any;
  FGrupos: MGrupos;
  FGrupos_prev: any;
  DGruposAsociadosList: any;
  seleccSeccGrupo: any;
  conCambios: number = 0;
  DGruposAsociados: any[] = [];
  DListaGrupos: MGrupos[];
  focusedRowKey: number = 0;
  focusedSeccion: number = 0;
  widthSerchTreeList: any = 200;
  dropDownOptions = {
    width: 700,
    height: 350,
    hideOnParentScroll: true,
    container: '#router-container',
  };
  isGridBoxOpened: boolean;
  autoExpandAll: boolean = false;
  loadingVisible: boolean = false;
  LDatosGruposPadres: MGrupos[] = [];

  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esNuevaFila: boolean = false;
  ltool: any;
  isEdit: boolean = false;
  numFila: number = 0;
  filaData: any = [];
  esEdicion: boolean = false;
  esVisibleSelecc: string = 'none';

  constructor(
    private sData: ADM203Service,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService
  ) {
    this._unsubscribeAll = new Subject();

    this.subscription = this._sbarreg
      .getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((datreg) => {
        // Valida si la petición es para esta aplicacion
        if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(datreg);
      });

    // Respuesta del filtro
    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe((resp) => {
      // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opPrepararBuscar(resp);
    });
    this.subs_visor = this.SVisor.getObs_Apl().subscribe((resp) => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion)
        return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex((d) => d.ID_GRUPO === resp.ID_GRUPO);
      if (nx !== -1) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    });
  }

  ngOnInit(): void {
    this.FGrupos = {
      ID_GRUPO: '',
      ASIGNABLE: '',
      ESTADO: '',
      ID_GRUPO_PADRE: '',
      NOMBRE_GRUPO_PADRE: '',
      NOMBRE: '',
      GRUPOS_ASOCIADOS: [],
    };
    this.USUARIO = localStorage.getItem('usuario')?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'GRUPOS',
      aplicacion: 'ADM-203',
      usuario: this.USUARIO,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_refrescar: true },
    };
    this.mnuAccion = '';
    this.readOnly = true;
    this.readOnlyEstado = true;
    this.readOnlyIdGrupo = true;
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

    this.valoresObjetos('todos');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  opMenuRegistro(operMenu: clsBarraRegistro) {
    switch (operMenu.accion) {
      case 'r_ini':
        this.prmUsrAplBarReg = {
          tabla: 'GRUPOS',
          aplicacion: 'ADM-203',
          usuario: this.USUARIO,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_refrescar: true },
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_nuevo':
        this.mnuAccion = 'new';
        this.readOnly = false;
        this.readOnlyIdGrupo = false;
        this.readOnlyEstado = false;
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        // Acción validación de datos
        if (!this.ValidaDatos('requerido')) {
          return;
        } else {
          if (this.conCambios != 0) {
            this.opPrepararGuardar(this.mnuAccion);
          } else showToast('No hay cambios a guardar', 'warning');
        }
        break;

      case 'r_buscar':
        if (
          GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion
        )
          return;
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_buscar_ejec':
        this.opBlanquearFormGP();
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_eliminar':
        this.opEliminar();
        break;

      case 'r_primero':
      case 'r_anterior':
      case 'r_siguiente':
      case 'r_ultimo':
      case 'r_numreg':
        this.opIrARegistro(operMenu.accion);
        break;

      case 'r_cancelar':
        var mensaje = '¿Desea cancelar la operación?';
        if (this.conCambios != 0)
          mensaje = 'Desea cancelar sin guardar cambios?';
        Swal.fire({
          title: '',
          text: mensaje,
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar',
        }).then((result) => {
          if (result.isConfirmed) {
            this.readOnly = true;
            this.readOnlyEstado = true;
            this.readOnlyIdGrupo = true;
            this.conCambios = 0;
            this.mnuAccion = '';
            this.prmUsrAplBarReg.accion = this.DListaGrupos.length > 0 ? 'r_navegar' : 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.formGrupos.instance._refresh();
            if (
              this.FGrupos_prev === undefined ||
              this.FGrupos_prev === '' ||
              this.FGrupos_prev === null ||
              this.FGrupos_prev.length === 0
            ) {
              this.opBlanquearFormGP();
            } else {
              this.FGrupos = JSON.parse(JSON.stringify(this.FGrupos_prev));
            }
          }
        });
        break;

      case 'r_copiar':
        if (this.FGrupos.ID_GRUPO !== '') {
          this.mnuAccion = 'new';
          this.readOnly = false;
          this.readOnlyIdGrupo = false;
          this.conCambios = 0;
          Swal.fire({
            title: '',
            text: 'Para copiar este Registro recuerde: Se agregara un nuevo Código.',
            iconHtml: "<i class='icon-alert-ol'></i>",
            showCancelButton: false,
            confirmButtonColor: '#DF3E3E',
            confirmButtonText: 'Aceptar',
          }).then((result) => {
            if (result.isConfirmed) {
              this.mnuAccion = 'copiar';
              this.opPrepararModificar();
              this.copiarSeccion();
              this.formGrupos.instance._refresh();
            }
          });
        } else {
          this.mnuAccion = '';
          showToast('Seleccione sección a copiar', 'Error');
        }
        break;

      case 'r_vista':
        this.opVista();
        break;

      case 'r_refrescar':
        this.valoresObjetos('todos');
        break;

      case 'r_imprimir':
        this.imprimirReporte(operMenu);
        break;

      default:
        break;
    }
  }

  opPrepararBuscar(accion: any): void {
    if (accion === 'filtro') {
      this._sfiltro.PrmFiltro = {
        Titulo: 'Datos de filtro para Grupos',
        accion: 'PREPARAR FILTRO',
        Filtro: '',
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { GRUPOS: arrFiltro };

      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this.sData
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          try {
            this.loadingVisible = false;
            const res = JSON.parse(data.data);
            this._sfiltro.enConsulta = false;
            if (data.token != undefined) {
              const refreshToken = data.token;
              localStorage.setItem('token', refreshToken);
            }
            const datares = res;
            if (datares[0].ErrMensaje === '') {
              // Asocia datos
              this.VDatosReg = datares;
              this.FGrupos = datares[0];
              this.QFiltro = datares[0].QFILTRO;

              // Prepara la barra para navegación
              this.prmUsrAplBarReg = {
                ...this.prmUsrAplBarReg,
                r_totReg: datares.length,
                r_numReg: 1,
                accion: 'r_navegar',
                operacion: {},
              };
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
              // Trae los items en los componentes asociados
              this.opIrARegistro('r_primero');
              this.readOnly = true;
              this.readOnlyIdGrupo = true;
            } else {
              this.VDatosReg = [];
              this.opBlanquearFormGP();
              //notificación
              showToast(datares[0].ErrMensaje, 'warning');
              this.prmUsrAplBarReg.accion = 'r_cancelar';
              this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            }
          } catch (error) {
            this.loadingVisible = false;
            this.readOnly = true;
            this.readOnlyIdGrupo = true;
            this._sfiltro.enConsulta = false;
            this.showModal(error, 'Error');
          }
        });
    }
    this.readOnly = true;
    this.readOnlyIdGrupo = true;
  }

  // Eventos del menu float
  // Si está desplegado el menu float de apoyo, ocultarlo
  onScroll(e: Event): void {
    if (this.eventsSubject === undefined) return;
    this.eventsSubject.next();
  }

  onInitialized(e: any) {
    this.treeGrupos = e.component;
  }

  onExpanding(e: any) {
    if (this.expandGrupos) {
      this.autoExpandAll = true;
      this.btnContraer = 'Contraer';
      this.expandGrupos = !this.expandGrupos;
      return;
    }
    if (!this.expandGrupos) {
      this.autoExpandAll = false;
      this.btnContraer = 'Expandir';
      this.expandGrupos = !this.expandGrupos;
      const newArray: any = this.DListaGrupos.filter(
        (d: any) => d.ID_GRUPO_PADRE === 'RAIZ'
      );
      newArray.forEach((el: any) => {
        this.treeListGrupos.instance.collapseRow(el.ID_GRUPO);
      });
      return;
    }
  }

  onResized(event: any) {
    const width: number = event.newRect.width;
    const height: number = event.newRect.height;
    const constainer_expandir: any = document.getElementById(
      'constainer-expandir'
    );
    this.widthSerchTreeList = width - 130;
    if (constainer_expandir !== undefined && constainer_expandir !== null) {
      if (width < 330) {
        this.widthSerchTreeList = width;
        constainer_expandir.style.width = '100%';
        constainer_expandir.style.position = 'relative';
        constainer_expandir.style.padding = '5px';
      } else {
        constainer_expandir.style.width = '110px';
        constainer_expandir.style.position = 'absolute';
        constainer_expandir.style.padding = '0 5px';
      }
    }
  }

  selectGrupo(e: any) {
    if (e.row === undefined) return;

    if (this.readOnly) {
      // No permite navegar si está en modo edición
      if (
        this.mnuAccion.match('new|update') &&
        e.row.data.ID_GRUPO !== this.FGrupos.ID_GRUPO
      ) {
        this.showModal(
          '',
          '',
          '<head>' +
          '<style>' +
          'tr:nth-child(even) {background: #e4f3fa}' +
          'tr:nth-child(odd) {background: #e4f3fa}' +
          '</style>' +
          '</head><table style="text-align: left; width: 100%; border: 1px dotted gray;">' +
          '<tr><td>Se encuentra en modo edición (creando o modificando) del grupos ' +
          this.FGrupos.ID_GRUPO +
          '.</td></tr><tr><td> ' +
          'Finalice la operación de edición para permitir navegar.</td></tr></table>'
        );
        return;
      }
      // Traer datos del array principal ya consultado en el arbol
      const grupo = e.row.data;
      if (grupo !== undefined && grupo !== null) {
        // Datos del registro de navegación
        this.FGrupos = JSON.parse(JSON.stringify(grupo));
        this.VDatosReg = [JSON.parse(JSON.stringify(this.FGrupos))];
        this.QFiltro = "ID_GRUPO = '" + this.FGrupos.ID_GRUPO + "'";
        this.focusedRowKey = grupo.ID_GRUPO_PADRE;
        this.seleccSeccGrupo = grupo.ID_GRUPO_PADRE;
        this.FGrupos.NOMBRE_GRUPO_PADRE = this.DListaGrupos.find(
          (d: any) => d.ID_GRUPO === grupo.ID_GRUPO_PADRE
        )?.NOMBRE;
        this.DGruposAsociados = grupo.GRUPOS_ASOCIADOS;

        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          accion: 'r_navegar',
          r_numReg: 1,
          r_totReg: 1,
          operacion: {},
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      }
    } else {
      showToast(
        'No se puede seleccionar otra grupo si esta en modo edición',
        'warning'
      );
    }
  }

  opPrepararNuevo(): void {
    this.opBlanquearFormGP();
    this.FGrupos.ESTADO = 'ACTIVO';
  }

  opBlanquearFormGP(): void {
    this.FGrupos_prev = JSON.parse(JSON.stringify(this.FGrupos));
    this.FGrupos = {
      ID_GRUPO: '',
      NOMBRE: '',
      ESTADO: '',
      ASIGNABLE: '',
      NOMBRE_GRUPO_PADRE: '',
      ID_GRUPO_PADRE: '',
      GRUPOS_ASOCIADOS: [],
    };
    this.DGruposAsociados = [];
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = 'r_numreg';
    let grupoPadre;
    switch (accion) {
      case 'r_primero':
        if (this.VDatosReg.length != 0) {
          this.FGrupos = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          // Buscamos el elemento que coincida con ID_GRUPO_PADRE
          grupoPadre = this.VDatosReg.find(
            (res) => this.FGrupos.ID_GRUPO_PADRE === res.ID_GRUPO
          );
          // Asignamos el nombre del grupo padre basado en la condición
          if (this.FGrupos.ID_GRUPO_PADRE === 'RAIZ') {
            this.FGrupos.NOMBRE_GRUPO_PADRE = 'Grupo raiz';
          } else if (grupoPadre) {
            this.FGrupos.NOMBRE_GRUPO_PADRE = grupoPadre.NOMBRE;
          }
          this.prmUsrAplBarReg.r_numReg = 1;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.readOnly = true;
          this.readOnlyIdGrupo = true;
          showToast('No se encontraron Datos', 'error');
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1
            ? 1
            : this.prmUsrAplBarReg.r_numReg - 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.FGrupos = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        // Buscamos el elemento que coincida con ID_GRUPO_PADRE
        grupoPadre = this.VDatosReg.find(
          (res) => this.FGrupos.ID_GRUPO_PADRE === res.ID_GRUPO
        );
        // Asignamos el nombre del grupo padre basado en la condición
        if (this.FGrupos.ID_GRUPO_PADRE === 'RAIZ') {
          this.FGrupos.NOMBRE_GRUPO_PADRE = 'Grupo raiz';
        } else if (grupoPadre) {
          this.FGrupos.NOMBRE_GRUPO_PADRE = grupoPadre.NOMBRE;
        }
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.FGrupos = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        // Buscamos el elemento que coincida con ID_GRUPO_PADRE
        grupoPadre = this.VDatosReg.find(
          (res) => this.FGrupos.ID_GRUPO_PADRE === res.ID_GRUPO
        );
        // Asignamos el nombre del grupo padre basado en la condición
        if (this.FGrupos.ID_GRUPO_PADRE === 'RAIZ') {
          this.FGrupos.NOMBRE_GRUPO_PADRE = 'Grupo raiz';
        } else if (grupoPadre) {
          this.FGrupos.NOMBRE_GRUPO_PADRE = grupoPadre.NOMBRE;
        }
        break;

      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.FGrupos = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        grupoPadre = this.VDatosReg.find(
          (res) => this.FGrupos.ID_GRUPO_PADRE === res.ID_GRUPO
        );
        // Asignamos el nombre del grupo padre basado en la condición
        if (this.FGrupos.ID_GRUPO_PADRE === 'RAIZ') {
          this.FGrupos.NOMBRE_GRUPO_PADRE = 'Grupo raiz';
        } else if (grupoPadre) {
          this.FGrupos.NOMBRE_GRUPO_PADRE = grupoPadre.NOMBRE;
        }
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_numreg':
        if (this.prmUsrAplBarReg.r_numReg !== 0) {
          // Valida si hubo cambio de ordenamiento en el visor
          if (this.SVisor.ColSort.Columna !== '') {
            if (this.SVisor.ColSort.Clase === 'asc') {
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
          this.FGrupos = JSON.parse(
            JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
          );
          grupoPadre = this.VDatosReg.find(
            (res) => this.FGrupos.ID_GRUPO_PADRE === res.ID_GRUPO
          );
          // Asignamos el nombre del grupo padre basado en la condición
          if (this.FGrupos.ID_GRUPO_PADRE === 'RAIZ') {
            this.FGrupos.NOMBRE_GRUPO_PADRE = 'Grupo raiz';
          } else if (grupoPadre) {
            this.FGrupos.NOMBRE_GRUPO_PADRE = grupoPadre.NOMBRE;
          }
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearFormGP();
        }
        this.readOnly = true;
        this.readOnlyIdGrupo = true;
        break;

      case 'Eliminado':
        this.valoresObjetos('grupos');
        this.opBlanquearFormGP();

        break;

      default:
        break;
    }

    this.DGruposAsociados = this.FGrupos.GRUPOS_ASOCIADOS;
  }

  // Prepara datos antes de modificar
  async opPrepararModificar() {
    await this.validarIntegridad('update');
    if (this.integridadReferencial) {
      this.loadingVisible = true;
      this.FGrupos_prev = JSON.parse(JSON.stringify(this.FGrupos));
      this.readOnlyIdGrupo = true;
      this.readOnly = false;
      this.readOnlyEstado = true;

      this.esVisibleSelecc = 'always';
      this.loadingVisible = false;
    }
  }

  valoresObjetos(obj: string) {
    if (obj === 'grupos' || obj === 'todos') {
      // Carga las Grupos registradas
      this.sData
        .getGrupos({})
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((data) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          for (let i = 0; i < res.length; i++) {
            const element = res[i];
            element.COD = i;
          }

          // Asocia datos de arbol y de grupos padre
          this.DListaGrupos = res;
          this.LDatosGruposPadres = res;
          this.LDatosGruposPadres.push({
            ID_GRUPO: 'RAIZ',
            NOMBRE: 'Grupo raiz',
            ID_GRUPO_PADRE: '',
            NOMBRE_GRUPO_PADRE: '',
            ASIGNABLE: '',
            ESTADO: '',
            GRUPOS_ASOCIADOS: [],
          });
        });
    }

    // if (obj === 'etiquetas' || obj === 'todos') {
    //   const prm: any = {};
    //   this.sData
    //     .consulta('etiquetas', prm, this.prmUsrAplBarReg.aplicacion)
    //     .subscribe((data: any) => {
    //       const res = validatorRes(data);
    //       if (data.token !== undefined) {
    //         const refreshToken = data.token;
    //         localStorage.setItem('token', refreshToken);
    //       }
    //       const newArray = res;
    //       const mensaje = newArray[0].ErrMensaje;
    //       if (mensaje != '') {
    //         this.showModal(mensaje, 'Error');
    //       } else {
    //         this.DGruposAsociadosList = newArray;
    //       }
    //     });
    // }

    if (obj == 'grupos asociados' || obj == 'todos') {
      const prm = { ID_DOMINIO: 'GRUPOS', ID_GRUPO_DOMINIO: 'GRUPOS ASOCIADOS' };
      this.sData
        .consulta('ITM_DOMINIOS', prm, 'ADM012')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const newArray = res;
          const mensaje = newArray[0].ErrMensaje;
          if (mensaje != '') {
            this.showModal(mensaje, 'Error');
          } else {
            this.DGruposAsociadosList = newArray;
          }
        });
    }

  }

  // Vista/Zoom de los datos consultados
  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'GRUPOS',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: [
        'ID_GRUPO|GRUPO',
        'NOMBRE|NOMBRE',
        'ID_GRUPO_PADRE|GRUPO PADRE',
        'ESTADO|ESTADO',
        'ASIGNABLE|ASIGNABLE',
      ],
      Filtro: '',
      keyGrid: ['ID_GRUPO'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  copiarSeccion() {
    this.mnuAccion = 'new';
    this.readOnly = false;
    this.FGrupos_prev = JSON.parse(JSON.stringify(this.FGrupos));
    this.FGrupos.ID_GRUPO_PADRE = '';
    this.ValideExistencia({ value: this.FGrupos.ID_GRUPO });
  }

  // Valide unicidad de la llave
  async ValideExistencia(e: any) {
    let aprob: boolean = false;
    if (
      this.mnuAccion === undefined ||
      this.readOnly ||
      !this.mnuAccion.match('new|update') ||
      (this.mnuAccion === 'update' && this.FGrupos_prev.ID_GRUPO === e.value)
    ) {
      aprob = true;
    }
    // Valida la existencia de la llave respectiva
    if (!aprob) {
      const prm = { ID_GRUPO: e.value };
      const apiRest = this.sData.validellave(
        'EXISTE GRUPO',
        prm,
        this.prmUsrAplBarReg.aplicacion
      );
      let res = await lastValueFrom(apiRest, { defaultValue: true });
      res = JSON.parse(res.data);
      if (res[0].ErrMensaje === '') {
        this.conCambios++;
        aprob = true;
      } else {
        this.showModal(res[0].ErrMensaje, '¡IMPORTANTE!');
        aprob = false;
      }
    }

    return aprob;
  }

  // Guarda modificaciones
  opPrepararGuardar(accion: string): void {
    // Datos de la seccion a guardar
    const sendData = {
      ID_GRUPO: this.FGrupos.ID_GRUPO,
      ID_GRUPO_PADRE:
        typeof this.FGrupos.ID_GRUPO_PADRE == 'string'
          ? this.FGrupos.ID_GRUPO_PADRE
          : this.FGrupos.ID_GRUPO_PADRE[0],
      NOMBRE: this.FGrupos.NOMBRE,
      ASIGNABLE: this.FGrupos.ASIGNABLE,
      ESTADO: this.FGrupos.ESTADO,
    };
    let ITEMS: any[] = [];
    for (let i = 0; i < this.DGruposAsociados.length; i++) {
      const element = this.DGruposAsociados[i];
      ITEMS.push({ ID_ASOCIADO: element.ID_ASOCIADO, CLASE: element.CLASE });
    }
    var prm: any = {
      GRUPOS: sendData,
      ITEMS_GRUPO: ITEMS,
    };

    // API guardado de datos
    this.sData.save(accion, prm).subscribe((data) => {
      const res = JSON.parse(data.data);
      if (data.token != undefined) {
        const refreshToken = data.token;
        localStorage.setItem('token', refreshToken);
      }
      if (res[0].ErrMensaje !== '') {
        this.showModal(res[0].ErrMensaje);
      } else {
        if (this.mnuAccion === 'new') {
          this.QFiltro = "ID_GRUPO='" + this.FGrupos.ID_GRUPO + "'";
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: '',
            accion: 'r_ini',
            operacion: {},
          };
        } else {
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: '',
            accion: 'r_ini',
            operacion: {},
          };
        }
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        showToast('Registro actualizado', 'success');

        // Actualiza el Item creado y añade nodo al árbol de Grupos
        if (this.FGrupos_prev.ID_GRUPO !== undefined) {
          const ix = this.DListaGrupos.findIndex(
            (s) => s.ID_GRUPO === this.FGrupos_prev.ID_GRUPO
          );
          if (ix !== -1) this.DListaGrupos.splice(ix, 1);
        }
        this.valoresObjetos('grupos');
        this.treeGrupos.refresh();
        this.mnuAccion = '';
        this.readOnly = true;
        this.readOnlyEstado = true;
        this.readOnlyIdGrupo = true;
      }
    });
  }

  async validarIntegridad(accion: string) {
    const prm: any = { ID_GRUPO: this.FGrupos.ID_GRUPO };
    const apiRest = this.sData.getIntegridad('integridad referencial', prm);
    let res = await lastValueFrom(apiRest, { defaultValue: true });
    res = JSON.parse(res.data);
    if (res[0].ErrMensaje !== '') {
      if (accion !== 'delete') {
        await Swal.fire({
          title: '',
          text: '',
          html: res[0].ErrMensaje,
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#DF3E3E',
          confirmButtonText: 'Continuar',
        }).then((result) => {
          if (result.isConfirmed) {
            this.integridadReferencial = true;
            this.readOnlyEstado = true;
          }
          if (result.isDismissed) {
            this.integridadReferencial = false;
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: '',
              accion: 'r_cancelar',
              operacion: {},
            };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.mnuAccion = '';
          }
        });
      } else {
        await Swal.fire({
          title: '',
          text: '',
          html: res[0].ErrMensaje + ', No se puede eliminar el grupo.',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: false,
          confirmButtonColor: '#DF3E3E',
          confirmButtonText: 'Continuar',
        }).then((result) => {
          this.integridadReferencial = false;
        });
      }
    } else {
      this.integridadReferencial = true;
    }
  }

  async opEliminar() {
    await this.validarIntegridad('delete');
    if (this.integridadReferencial) {
      // Confirma...
      Swal.fire({
        title: '',
        text: '',
        html: '¿Desea Eliminar el Grupo <i>' + this.FGrupos.ID_GRUPO + '?',
        iconHtml: "<i class='icon-alert-ol'></i>",
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#438ef1',
        cancelButtonText: 'No',
        confirmButtonText: 'Sí, eliminar',
      }).then((result) => {
        // Procesa eliminación. Llama a la API para validar referenciación y eliminación en tabla
        if (result.isConfirmed) {
          this.AccionEliminar();
        }
      });
    }
  }

  showModal(mensaje: any, titulo: any = '¡Error!', msg_html: any = '') {
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
      position: 'center',
      html: msg_html,
      stopKeydownPropagation: false,
    });
  }

  ValidaDatos(Accion: string): boolean {
    if (Accion === 'requerido') {
      if (
        this.FGrupos.ID_GRUPO === '' ||
        this.FGrupos.NOMBRE === '' ||
        this.FGrupos.ID_GRUPO_PADRE === '' ||
        this.FGrupos.ESTADO === ''
      ) {
        this.showModal(
          'Error al guardar',
          'Faltan datos',
          'Hay datos incompletos. Llena todos los items!'
        );
        return false;
      }
    }
    return true;
  }

  // Ejecuta la eliminación
  AccionEliminar() {
    const prm = {
      ID_GRUPO: this.FGrupos.ID_GRUPO,
    };
    this.sData
      .delete('delete', prm)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((data) => {
        try {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          if (res[0].ErrMensaje !== '') {
            // alert de error
            this.showModal(res[0].ErrMensaje);
            return;
          }
          const idx = this.DListaGrupos.findIndex(g => g.ID_GRUPO === this.FGrupos.ID_GRUPO);
          if (idx !== -1) {
            this.DListaGrupos.splice(idx, 1);
          }
          this.treeListGrupos.instance.refresh();
          this.readOnly = true;
          this.readOnlyIdGrupo = true;
          this.FGrupos_prev = [];
          showToast('Dominio eliminado', 'success');
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: '',
            operacion: {},
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this.opBlanquearFormGP();
          this.treeGrupos.refresh();

          showToast('Sección eliminada', 'success');
        } catch (error) {
          this.showModal(
            'Error respuesta eliminar sección: ' + error + ' Rta:' + data.data
          );
        }
      });
  }

  onSeleccRowSeccionGrupo(e: any) {
    if (e.selectedRowsData.length > 0) {
      this.conCambios++;
      this.isGridBoxOpened = false;
      if (e.selectedRowsData[0].ID_GRUPO === 'RAIZ') {
        this.FGrupos.NOMBRE_GRUPO_PADRE = 'Grupo raiz';
      } else {
        this.FGrupos.NOMBRE_GRUPO_PADRE = e.selectedRowsData[0].NOMBRE;
      }
    }
  }

  onSeleccRowSeccionETGrupo(e: any) {
    if (e.value !== null && e.value !== undefined && e.value !== '') {
      this.sData.conCambios = this.sData.conCambios + 1;
    }
  }

  imprimirReporte(operMenu: any) {
    var prmRep = {
      ...operMenu.operacion,
      accion: 'previsualizar',
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      usuario: this.prmUsrAplBarReg.usuario,
      QFiltro:
        operMenu.operacion.registro === 'todos'
          ? this.QFiltro
          : " GRUPOS.ID_GRUPO = '" + this.FGrupos.ID_GRUPO + "'",
    };
    if (operMenu.operacion.modo === 'previsualizar')
      this.eventsSubjectInformes.next(prmRep);

    if (operMenu.operacion.modo === 'pdf') {
      prmRep = { ...prmRep, accion: 'pdf' };
      this.eventsSubjectInformes.next(prmRep);
    }
  }

  getSizeQualifier(width: any) {
    if (width < 768) return 'xs';
    if (width < 992) return 'sm';
    if (width < 1366) return 'md';
    return 'lg';
  }

  dragEnd(unit: any, sizes: any): any { }

  onValueChangedIdGrupo(e: any) {
    if (e.value !== '') {
      this.conCambios++;
      if (this.mnuAccion === 'new') {
        this.ValideExistencia(e);
      }
    }
  }


  async onValueChangedGridLista(e: any, cellInfo: any, campo: string) {

    if (e.value !== null && e.value !== undefined && e.value !== '') {
      switch (campo) {
        case 'ID_ASOCIADO':
        case 'CLASE':
          this.gridGruposAsociados.instance.cellValue(cellInfo.rowIndex, campo, e.value);
          break;
      }

      this.conCambios++;
    }

  }

  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        this.isEdit = true;
        this.gridGruposAsociados.instance.addRow();
        this.rowApplyChanges = true;
        this.esVisibleSelecc = 'none';
        this.rowNew = false;

        break;
      case 'edit':
        const index = this.gridGruposAsociados.instance.getRowIndexByKey(this.filasSelecc[0]);

        this.gridGruposAsociados.instance.editRow(index);
        this.esVisibleSelecc = 'none';
        this.isEdit = true;
        this.rowApplyChanges = true;
        this.mnuAccion = 'update';
        this.rowEdit = false;

        break;
      case 'save':
        this.isEdit = false;
        this.gridGruposAsociados.instance.saveEditData();
        this.esVisibleSelecc = 'always';
        this.rowApplyChanges = false;
        this.rowNew = true;

        break;
      case 'cancel':
        this.isEdit = false;
        this.gridGruposAsociados.instance.cancelEditData();
        this.esVisibleSelecc = 'always';
        this.rowApplyChanges = false;
        this.rowNew = true;
        break;
      case 'delete':
        // Elimina filas seleccionadas
        this.isEdit = false;
        this.esVisibleSelecc = 'always';
        Swal.fire({
          title: '',
          text: '¿Desea eliminar los items seleccionados?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, eliminar',
        }).then((result) => {
          if (result.isConfirmed) {
            this.filasSelecc.forEach((key) => {
              const index = this.DGruposAsociados.findIndex((a) => a.ITEM === key);
              this.DGruposAsociados.splice(index, 1);
            });
            this.conCambios++;
            this.gridGruposAsociados.instance.refresh();
          }
        });
        break;

      default:
        break;
    }
  }

  onContentReady(e: any) {
    e.component.columnOption('command:edit', 'visible', false);
  }

  onRowValidating(e: any) {
    if (this.mnuAccion === 'new') {
      if (e.newData.ID_LISTA === '') {
        showToast('Debe Seleccionar una lista.', 'error');
        e.isValid = false;
        this.rowApplyChanges = true;
        this.rowNew = true;
        this.esVisibleSelecc = 'none';
      } else {
        e.isValid = true;
        this.rowApplyChanges = false;
        this.rowEdit = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'onClick';
      }
    }
    if (this.mnuAccion === 'update') {
      for (let prop in e.newData) {
        if (e.newData.hasOwnProperty(prop) && e.oldData.hasOwnProperty(prop)) {
          e.oldData[prop] = e.newData[prop];
        }
      }
      if (e.oldData.ID_LISTA === '') {
        showToast('Debe Seleccionar una lista.', 'error');
        e.isValid = false;
        this.rowApplyChanges = true;
        this.rowNew = true;
        this.esVisibleSelecc = 'none';
      } else {
        e.isValid = true;
        this.rowApplyChanges = false;
        this.rowEdit = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'onClick';
      }
    }
  }

  onInitNewRowPro(e: any) {
    if (this.DGruposAsociados.length > 0) {
      const item = this.DGruposAsociados.reduce((ant, act) => {
        return ant.ITEM > act.ITEM ? ant : act;
      });
      e.data.ITEM = item.ITEM + 1;
      e.data.DESCUENTO_PPP = 0;
      e.data.CUOTA_INICIAL = 'No';
    } else {
      e.data.ITEM = 1;
      e.data.DESCUENTO_PPP = 0;
      e.data.CUOTA_INICIAL = 'No';
    }

    e.data.ID_PLAN = this.FGrupos.ID_GRUPO;
    this.numFila = e.data.ITEM;
    this.filaData = e.data;
  }

  selectionGrid(e: any) {
    if (!this.isEdit) {
      this.filasSelecc = e.selectedRowKeys;
      this.numFila = this.DGruposAsociados.findIndex(
        (d: any) => d.ITEM === e.selectedRowKeys[0]
      );
      if (this.filasSelecc.length > 0) this.rowDelete = true;
      if (this.filasSelecc.length === 1) this.rowEdit = true;
      if (this.filasSelecc.length > 1) this.rowEdit = false;
      if (this.filasSelecc.length === 0) {
        this.rowDelete = false;
        this.rowEdit = false;
      }
    }
  }


  onEditingStart(e: any) {
    this.numFila = e.data.ITEM;
    this.filaData = e.data;
    this.mnuAccion = 'edit';
    this.rowNew = false;
    this.rowApplyChanges = true;
    this.rowDelete = false;
  }

  startEdit(e: any) {
    if (this.mnuAccion !== 'new') {
      this.gridGruposAsociados.instance.clearSelection();
      if (e.data !== undefined && e.data !== null) {
        if (this.esEdicion) {
          this.DGruposAsociados.forEach((ele: any) => {
            ele.readOnly_UNIDAD_MEDIDA = true;
          });
          const isEditing = this.gridGruposAsociados.instance.hasEditData();
          if (isEditing) e.component.cancelEditData(this.numFila);
          // e.component.editRow(e.key);
          this.mnuAccion = 'edit';
          e.isEditing = true;
          e.data.readOnly_UNIDAD_MEDIDA = false;

          this.numFila = e.key;
          this.filaData = e.data;
          this.rowNew = false;
          this.rowApplyChanges = true;
          this.rowDelete = false;
          this.readOnly = true;
        }
      }
    }
  }

  onChangedAsignable(e: any) {
  }

}
