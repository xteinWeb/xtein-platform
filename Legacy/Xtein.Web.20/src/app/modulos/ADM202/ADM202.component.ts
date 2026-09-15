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
  DxDropDownBoxModule,
  DxTreeListComponent,
  DxTabPanelModule,
  DxTabsComponent,
} from 'devextreme-angular';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { CIDLegales, CListaIdetificacion, CUbicaciones, MUDnegocios } from './clsADM202.class';
import { AngularSplitModule } from 'angular-split';
import DataSource from 'devextreme/data/data_source';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularResizeEventModule } from 'angular-resize-event';
import { showToast } from '../../shared/toast/toastComponent';
import { validatorRes } from 'src/app/shared/validator/validator';
import { Subscription, Subject, takeUntil, lastValueFrom, firstValueFrom } from 'rxjs';
import { ADM202Service } from 'src/app/services/ADM202/ADM202.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { MenufloatComponent } from 'src/app/shared/menufloat/menufloat.component';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';
import { ADM20201Component } from './ADM20201/ADM20201.component';
import { ADM20202Component } from './ADM20202/ADM20202.component';
import { ADM20203Component } from './ADM20203/ADM20203.component';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { DirtelinfoComponent } from 'src/app/shared/dirtelinfo/dirtelinfo.component';

@Component({
  selector: 'app-ADM202',
  templateUrl: './ADM202.component.html',
  styleUrls: ['./ADM202.component.css'],
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
    DxTabPanelModule,
    DxTemplateModule,
    ADM20201Component,
    ADM20202Component,
    ADM20203Component,
    DxSelectBoxModule,
    DxValidatorModule,
    DxLoadPanelModule,
    AngularSplitModule,
    // MenufloatComponent,
    DxDropDownBoxModule,
    VistarapidaComponent,
    GeninformesComponent,
    AngularResizeEventModule,
    DirtelinfoComponent
  ],
})
export class ADM202Component implements OnInit {
  @ViewChild('forMUDnegocios', { static: false })
  forMUDnegocios: DxFormComponent;
  @ViewChild('treeListUDnegocios', { static: false })
  treeListUDnegocios: DxTreeListComponent;
  @ViewChild('tabPanelUND', { static: false }) tabPanelUND: DxTabsComponent;
  eventsSubjectDirTelInfo: Subject<any> = new Subject<any>();

  public _unsubscribeAll: Subject<any>;

  // Variables fijas de la aplicación
  subs_visor: Subscription;
  subs_filtro: Subscription;
  subscription: Subscription;
  eventsSubject: Subject<void> = new Subject<void>();
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();

  isTreeBoxOpened: boolean;
  isGridBoxOpenedIDL: boolean;
  isGridBoxOpenedIUS: boolean;
  isGridBoxOpenedUbicacion: boolean;
  isGridBoxOpenedResponsable: boolean;
  gridBoxIDL: any[] = [];
  gridBoxIUS: any[] = [];
  gridBoxUbicacion: any[] = [];
  gridBoxResponsable: any[] = [];

  VDatosReg: any;
  mnuAccion: string;
  readOnly: boolean = true;
  expandUDN: boolean = true;
  readOnlyEstado: boolean = true;
  readOnlyIdUDnegocios: boolean = true;
  btnContraer: string = 'Expandir';
  prmUsrAplBarReg: clsBarraRegistro;
  integridadReferencial: boolean = false;
  Darchivos: string[] = [];

  // Variables de datos
  QFiltro: any;
  USUARIO: any;
  FUDnegocios: MUDnegocios;
  FUDnegocios_prev: any;
  seleccSeccUDN: any;
  conCambios: number = 0;
  DListaUDnegocios: MUDnegocios[];
  DListaIdLegales: CIDLegales[];
  DListaUbicacines: CUbicaciones[];
  DListaResponsables: CUbicaciones[];
  focusedRowKey: number = 0;
  focusedSeccion: number = 0;
  widthSerchTreeList: any = 200;
  dropDownOptions = {
    width: 700,
    height: 350,
    hideOnParentScroll: true,
    container: '#router-container',
  };
  autoExpandAll: boolean = false;
  loadingVisible: boolean = false;
  LDatosUDNPadres: MUDnegocios[] = [];
  tabsInfoUDnegocios: string[] = [];
  selectedIndex: number;

  tamArchivoImg: any;

  img_height: number = 0;
  img_width: number = 0;

  DEmail: any;
  DDirecciones: any;
  DTelefonos: any;
  DContactoAdic: any;

  constructor(
    private sData: ADM202Service,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private _sgenerales: GeneralesService
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
      const nx = this.VDatosReg.findIndex((d) => d.ID_UN === resp.ID_UN);
      if (nx !== -1) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    });
  }

  ngOnInit(): void {
    this.FUDnegocios = {
      ID_UN: '',
      NOMBRE: '',
      ID_UN_SUPERIOR: '',
      NOMBRE_SUPERIOR: '',
      ID_LEGAL: '',
      RESPONSABLE: '',
      ID_GRUPO: '',
      ID_UBICACION: '',
      TIPO: '',
      UN_OPERATIVA: false,
      MANEJO_PRESUPUESTO: false,
      DESCRIPCION: '',
      ESTADO: '',
      CONTACTOS: [],
      DIRECCIONES: [],
      TELEFONOS: [],

    };
    this.USUARIO = localStorage.getItem('usuario')?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'UNIDADES_NEGOCIOS',
      aplicacion: 'ADM-202',
      usuario: this.USUARIO,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_refrescar: true },
    };
    this.mnuAccion = '';
    this.readOnly = true;
    this.sData.setReadOnly(this.readOnly);
    this.readOnlyEstado = true;
    this.readOnlyIdUDnegocios = true;
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
          tabla: 'UNIDADES_NEGOCIOS',
          aplicacion: 'ADM-202',
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
        this.sData.setReadOnly(this.readOnly);
        this.readOnlyIdUDnegocios = false;
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
            this.sData.setReadOnly(this.readOnly);
            this.readOnlyEstado = true;
            this.readOnlyIdUDnegocios = true;
            this.conCambios = 0;
            this.mnuAccion = '';
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.sData.accion = operMenu.accion;
            this.setObsToService('r_cancelar');
            // this.forMUDnegocios.instance._refresh();
            if (
              this.FUDnegocios_prev === undefined ||
              this.FUDnegocios_prev === '' ||
              this.FUDnegocios_prev === null ||
              this.FUDnegocios_prev.length === 0
            ) {
              this.opBlanquearFormGP();
              this.eventsSubjectDirTelInfo.next({
                operacion: 'inactivo',
              });
            } else {
              this.FUDnegocios = JSON.parse(JSON.stringify(this.FUDnegocios_prev));
            }
          }
        });
        break;

      case 'r_copiar':
        if (this.FUDnegocios.ID_UN !== '') {
          this.mnuAccion = 'new';
          this.readOnly = false;
          this.sData.setReadOnly(this.readOnly);
          this.readOnlyIdUDnegocios = false;
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
              // this.forMUDnegocios.instance._refresh();
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
        Titulo: 'Datos de filtro para Unidades de Negocio',
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
      const prm = { UNIDADES_NEGOCIOS: arrFiltro };

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
              datares[0].RESPONSABLE.toString();
              this.FUDnegocios = datares[0];
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
              this.sData.setReadOnly(this.readOnly);
              this.readOnlyIdUDnegocios = true;
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
            this.sData.setReadOnly(this.readOnly);
            this.readOnlyIdUDnegocios = true;
            this._sfiltro.enConsulta = false;
            this.showModal(error, 'Error');
          }
        });
    }
    this.readOnly = true;
    this.sData.setReadOnly(this.readOnly);
    this.readOnlyIdUDnegocios = true;
  }

  onSelectionChangedIDL(e: any) {
    this.gridBoxIDL = e.selectedRowKeys;
    this.FUDnegocios.ID_LEGAL = e.selectedRowKeys[0];
    this.isGridBoxOpenedIDL = false;
  }

  onSelectionChangedIUS(e: any) {
    this.gridBoxIUS = e.selectedRowKeys;
    this.FUDnegocios.ID_UN_SUPERIOR = e.selectedRowKeys[0];
    this.isGridBoxOpenedIUS = false;
  }

  onSelectionChangedUbicaciones(e: any) {
    this.gridBoxUbicacion = e.selectedRowKeys;
    this.FUDnegocios.ID_UBICACION = e.selectedRowKeys[0];
    this.isGridBoxOpenedUbicacion = false;
  }
  onSelectionChangedResponsable(e: any) {
    this.gridBoxResponsable = e.selectedRowKeys;
    this.FUDnegocios.RESPONSABLE = e.selectedRowKeys[0];
    this.isGridBoxOpenedResponsable = false;
  }

  // Eventos del menu float
  // Si está desplegado el menu float de apoyo, ocultarlo
  onScroll(e: Event): void {
    if (this.eventsSubject === undefined) return;
    this.eventsSubject.next();
  }

  onInitialized(e: any) {
  }

  onExpanding(e: any) {
    if (this.expandUDN) {
      this.autoExpandAll = true;
      this.btnContraer = 'Contraer';
      this.expandUDN = !this.expandUDN;
      return;
    }
    if (!this.expandUDN) {
      this.autoExpandAll = false;
      this.btnContraer = 'Expandir';
      this.expandUDN = !this.expandUDN;
      const newArray: any = this.DListaUDnegocios.filter(
        (d: any) => d.ID_UN_SUPERIOR === 'RAIZ'
      );
      newArray.forEach((el: any) => {
        this.treeListUDnegocios.instance.collapseRow(el.ID_UN);
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

  refreshTabs(tabsInfoUDnegocios: string[], tabActive) {
    if (this.tabPanelUND) {
      this.tabsInfoUDnegocios = tabsInfoUDnegocios;
      this.selectedIndex = tabActive;
      // this.tabPanelUND.instance.option('selectedItem', this.selectedIndex);
    }
  }

  selectUDnegocios(e: any) {
    if (e.row === undefined) return;

    if (this.readOnly) {
      // No permite navegar si está en modo edición
      if (
        this.mnuAccion.match('new|update') &&
        e.row.data.ID_UN !== this.FUDnegocios.ID_UN
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
          '<tr><td>Se encuentra en modo edición (creando o modificando) unidades de negocio ' +
          this.FUDnegocios.ID_UN +
          '.</td></tr><tr><td> ' +
          'Finalice la operación de edición para permitir navegar.</td></tr></table>'
        );
        return;
      }
      // Traer datos del array principal ya consultado en el arbol
      const unidad_negocio = e.row.data;
      if (unidad_negocio !== undefined && unidad_negocio !== null) {
        // Datos del registro de navegación
        this.FUDnegocios = JSON.parse(JSON.stringify(unidad_negocio));
        this.sData.FUDnegocios = JSON.parse(JSON.stringify(unidad_negocio));
        this.VDatosReg = [JSON.parse(JSON.stringify(this.FUDnegocios))];
        this.QFiltro = "ID_UN = '" + this.FUDnegocios.ID_UN + "'";
        this.focusedRowKey = unidad_negocio.ID_UN_SUPERIOR;
        this.seleccSeccUDN = unidad_negocio.ID_UN_SUPERIOR;

        this.FUDnegocios.ID_LEGAL = parseInt(this.FUDnegocios.ID_LEGAL);

        if (unidad_negocio.ID_UN_SUPERIOR === 'RAIZ') {
          this.FUDnegocios.NOMBRE_SUPERIOR = 'Raiz';
          const tabsInfoUDnegocios = [
            'Identificación',
            'Imagen',
            'Contabilidad',
            'Configuraciones',
          ];

          this.refreshTabs(tabsInfoUDnegocios, 'Identificación');
          this.sData.setReadOnly(this.readOnly);
        } else {
          this.FUDnegocios.NOMBRE_SUPERIOR = this.DListaUDnegocios.find(
            (res: any) => res.ID_UN === unidad_negocio.ID_UN_SUPERIOR
          )?.NOMBRE;
          const tabsInfoUDnegocios = ['Imagen'];
          this.refreshTabs(tabsInfoUDnegocios, 'Imagen');
          this.sData.setReadOnly(this.readOnly);
        }

        this.sData.D_Identificacion = this.FUDnegocios;
        this.sData.D_Contabilidad = this.FUDnegocios;

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
        'No se puede seleccionar otra unidad de negocio si esta en modo edición',
        'warning'
      );
    }
  }

  opPrepararNuevo(): void {
    this.opBlanquearFormGP();
    this.FUDnegocios.ESTADO = 'ACTIVO';
    this.sData.accion = this.mnuAccion;
    this.setObsToService('r_nuevo');
    const tabsInfoUDnegocios = [
      'Identificación',
      'Imagen',
      'Contabilidad',
      'Configuraciones',
    ];
    this.refreshTabs(tabsInfoUDnegocios, 'Identificación');
    this.sData.D_Contabilidad = []
    this.sData.D_Identificacion = []
    this.sData.D_Imagen = []

    this.eventsSubjectDirTelInfo.next({
      operacion: 'activo',
    });
  }

  opBlanquearFormGP(): void {
    this.FUDnegocios_prev = JSON.parse(JSON.stringify(this.FUDnegocios));
    this.FUDnegocios = {
      ID_UN: '',
      NOMBRE: '',
      ID_UN_SUPERIOR: '',
      NOMBRE_SUPERIOR: '',
      ID_LEGAL: '',
      RESPONSABLE: '',
      ID_GRUPO: '',
      ID_UBICACION: '',
      TIPO: '',
      UN_OPERATIVA: false,
      MANEJO_PRESUPUESTO: false,
      DESCRIPCION: '',
      ESTADO: '',
      CONTACTOS: [],
      DIRECCIONES: [],
      TELEFONOS: [],
    };
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = 'r_numreg';
    let UNPadre;
    switch (accion) {
      case 'r_primero':
        if (this.VDatosReg.length != 0) {
          this.FUDnegocios = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          // Buscamos el elemento que coincida con ID_UN_SUPERIOR
          UNPadre = this.VDatosReg.find(
            (res) => this.FUDnegocios.ID_UN_SUPERIOR === res.ID_UN
          );
          if (this.FUDnegocios.ID_UN_SUPERIOR === 'RAIZ') {
            this.FUDnegocios.NOMBRE_SUPERIOR = 'UN raiz';
          } else if (UNPadre) {
            this.FUDnegocios.NOMBRE_SUPERIOR = UNPadre.NOMBRE;
          }
          this.prmUsrAplBarReg.r_numReg = 1;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.readOnly = true;
          this.sData.setReadOnly(this.readOnly);
          this.readOnlyIdUDnegocios = true;
          showToast('No se encontraron Datos', 'error');
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1
            ? 1
            : this.prmUsrAplBarReg.r_numReg - 1;

        UNPadre = this.VDatosReg.find(
          (res) => this.FUDnegocios.ID_UN_SUPERIOR === res.ID_UN
        );
        if (this.FUDnegocios.ID_UN_SUPERIOR === 'RAIZ') {
          this.FUDnegocios.NOMBRE_SUPERIOR = 'UN raiz';
        } else if (UNPadre) {
          this.FUDnegocios.NOMBRE_SUPERIOR = UNPadre.NOMBRE;
        }
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.FUDnegocios = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        // Buscamos el elemento que coincida con ID_UN_SUPERIOR
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;

        UNPadre = this.VDatosReg.find(
          (res) => this.FUDnegocios.ID_UN_SUPERIOR === res.ID_UN
        );
        if (this.FUDnegocios.ID_UN_SUPERIOR === 'RAIZ') {
          this.FUDnegocios.NOMBRE_SUPERIOR = 'UN raiz';
        } else if (UNPadre) {
          this.FUDnegocios.NOMBRE_SUPERIOR = UNPadre.NOMBRE;
        }
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.FUDnegocios = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        // Buscamos el elemento que coincida con ID_UN_SUPERIOR
        break;

      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;

        UNPadre = this.VDatosReg.find(
          (res) => this.FUDnegocios.ID_UN_SUPERIOR === res.ID_UN
        );
        if (this.FUDnegocios.ID_UN_SUPERIOR === 'RAIZ') {
          this.FUDnegocios.NOMBRE_SUPERIOR = 'UN raiz';
        } else if (UNPadre) {
          this.FUDnegocios.NOMBRE_SUPERIOR = UNPadre.NOMBRE;
        }
        this.FUDnegocios = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
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
          this.FUDnegocios = JSON.parse(
            JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
          );
          UNPadre = this.VDatosReg.find(
            (res) => this.FUDnegocios.ID_UN_SUPERIOR === res.ID_UN
          );
          if (this.FUDnegocios.ID_UN_SUPERIOR === 'RAIZ') {
            this.FUDnegocios.NOMBRE_SUPERIOR = 'UN raiz';
          } else if (UNPadre) {
            this.FUDnegocios.NOMBRE_SUPERIOR = UNPadre.NOMBRE;
          }
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearFormGP();
        }
        this.readOnly = true;
        this.sData.setReadOnly(this.readOnly);
        this.readOnlyIdUDnegocios = true;
        break;

      case 'Eliminado':
        this.valoresObjetos('UDnegocios');
        this.opBlanquearFormGP();

        break;

      default:
        break;
    }

    this.FUDnegocios.RESPONSABLE = this.FUDnegocios.RESPONSABLE.toString();
  }

  // Prepara datos antes de modificar
  async opPrepararModificar() {
    await this.validarIntegridad('update');
    if (this.integridadReferencial) {
      this.loadingVisible = true;
      this.FUDnegocios_prev = JSON.parse(JSON.stringify(this.FUDnegocios));
      this.sData.accion = this.mnuAccion;
      this.setObsToService('r_modificar');
      this.readOnlyIdUDnegocios = true;
      this.readOnly = false;
      this.sData.setReadOnly(this.readOnly);
      this.readOnlyEstado = true;

      this.loadingVisible = false;
      this.eventsSubjectDirTelInfo.next({
        operacion: 'activo',
      });
    }
  }

  valoresObjetos(obj: string) {
    if (obj === 'UDnegocios' || obj === 'todos') {
      const prm = { ESTADO: 'ACTIVO' };
      this.sData
        .consulta('UNIDADES NEGOCIOS', prm, 'ADM202')
        .subscribe((data: any) => {
          const res = validatorRes(data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          for (let i = 0; i < res.length; i++) {
            res[i].COD = i;
          }

          this.DListaUDnegocios = res;
          this.LDatosUDNPadres = res;
          this.LDatosUDNPadres.push({
            ID_UN: 'RAIZ',
            NOMBRE: 'Raiz',
            ID_UN_SUPERIOR: '',
            NOMBRE_SUPERIOR: '',
            ID_LEGAL: '',
            RESPONSABLE: '',
            ID_GRUPO: '',
            ID_UBICACION: '',
            TIPO: '',
            UN_OPERATIVA: false,
            MANEJO_PRESUPUESTO: false,
            DESCRIPCION: '',
            ESTADO: '',
            CONTACTOS: [],
            DIRECCIONES: [],
            TELEFONOS: [],
          });
        });
    }
    if (obj === 'IDLEGALES' || obj === 'todos') {
      const prm = { ESTADO: 'ACTIVO' };
      this.sData
        .consulta('ID LEGALES', prm, 'ADM202')
        .subscribe((data: any) => {
          const res = validatorRes(data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          for (let i = 0; i < res.length; i++) {
            res[i].COD = i;
          }

          this.DListaIdLegales = res;
        });
    }
    if (obj === 'UBICAION' || obj === 'todos') {
      const prm = { ESTADO: 'ACTIVO' };
      this.sData
        .consulta('UBICACIONES', prm, 'ADM202')
        .subscribe((data: any) => {
          const res = validatorRes(data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          for (let i = 0; i < res.length; i++) {
            res[i].COD = i;
          }

          this.DListaUbicacines = res;
        });
    }
    if (obj === 'RESPONSABLES' || obj === 'todos') {
      const prm = { ESTADO: 'ACTIVO' };
      this.sData
        .consulta('RESPONSABLES', prm, 'ADM202')
        .subscribe((data: any) => {
          const res = validatorRes(data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          for (let i = 0; i < res.length; i++) {
            res[i].COD = i;
          }

          this.DListaResponsables = res;
        });
    }
  }

  // Vista/Zoom de los datos consultados
  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'UNIDADES DE NEGOCIO',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: [],
      Filtro: '',
      keyGrid: ['ID_UN'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  copiarSeccion() {
    this.mnuAccion = 'new';
    this.readOnly = false;
    this.sData.setReadOnly(this.readOnly);
    this.FUDnegocios_prev = JSON.parse(JSON.stringify(this.FUDnegocios));
    this.validarIntegridad('new');
  }

  // Guarda modificaciones
  async opPrepararGuardar(accion: string) {
    this.sData.accion = this.mnuAccion;
    this.setObsToService('r_guardar');
    if (this.sData.D_Imagen.length > 0) {
      await this.cargarArchivosUrl();
    }

    this.FUDnegocios = {
      ...this.FUDnegocios,
      ...this.sData.D_Identificacion,
      ...this.sData.D_Contabilidad,
      CONTACTOS: this.DEmail,
      DIRECCIONES: this.DDirecciones,
      TELEFONOS: this.DTelefonos,
    }

    var prm: any = {
      UNIDADES_NEGOCIOS: this.FUDnegocios,
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
          this.QFiltro = "ID_UN='" + this.FUDnegocios.ID_UN + "'";
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: '',
            accion: 'r_navegar',
            operacion: {},
          };
        } else {
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: '',
            accion: 'r_navegar',
            operacion: {},
          };
        }
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        showToast('Registro actualizado', 'success');

        if (this.FUDnegocios_prev.ID_UN !== undefined) {
          const ix = this.DListaUDnegocios.findIndex(
            (s) => s.ID_UN === this.FUDnegocios_prev.ID_UN
          );
          if (ix !== -1) this.DListaUDnegocios.splice(ix, 1);
        }
        this.valoresObjetos('UDnegocios');
        this.mnuAccion = '';
        this.readOnly = true;
        this.sData.setReadOnly(this.readOnly);
        this.readOnlyEstado = true;
        this.readOnlyIdUDnegocios = true;
      }
    });
  }

  async cargarArchivosUrl() {
    for (let i = 0; i < this.sData.D_Imagen.length; i++) {
      const element = this.sData.D_Imagen[i];
      // Espera a que el FileReader termine de leer el archivo
      element.file.BASE64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e: any) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(element.file);
      });

      // Ahora manda el base64 a la API
      if (this.FUDnegocios[element.tipo] && this.FUDnegocios[element.tipo].startsWith('http')) {
        continue;
      };
      this.FUDnegocios[element.tipo] = await firstValueFrom(
        this._sgenerales.cargar_archivo(
          `ADM202/${element.file.name.replace(/\s+/g, '')}`,
          element.file.BASE64
        )
      );

    }
  }
  compressImage(src: any, newX: any, newY: any, src_w: any, src_h: any) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.src = src;
      img.onload = (rs) => {
        const elem = document.createElement('canvas');
        var ratio = Math.min(newX / src_w, newY / src_h);
        elem.width = src_w * ratio; // newX
        elem.height = src_h * ratio; // newY
        const ctx: any = elem.getContext('2d');
        ctx.drawImage(img, 0, 0, src_w * ratio, src_h * ratio); //, newX, newY);
        const data = elem.toDataURL();
        res(data);
      };
      img.onerror = (error) => rej(error);
    });
  }


  async validarIntegridad(accion: string) {
    const prm: any = { ID_UN: this.FUDnegocios.ID_UN };
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
          html: res[0].ErrMensaje + ', No se puede eliminar la unidad de negocio.',
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
        html: '¿Desea Eliminar la unidad de negocio <i>' + this.FUDnegocios.ID_UN + '?',
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
      if (this.FUDnegocios.ID_UN === '' || this.FUDnegocios.NOMBRE === '') {
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
      ID_UN: this.FUDnegocios.ID_UN,
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
          this.readOnly = true;
          this.sData.setReadOnly(this.readOnly);
          this.readOnlyIdUDnegocios = true;
          this.FUDnegocios_prev = [];
          showToast('Dominio eliminado', 'success');
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: '',
            accion: 'r_ini',
            operacion: {},
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);


          showToast('Sección eliminada', 'success');
        } catch (error) {
          this.showModal(
            'Error respuesta eliminar sección: ' + error + ' Rta:' + data.data
          );
        }
      });
  }

  onSeleccRowSeccionUDnegocios(e: any) {
    if (e.selectedRowsData.length > 0) {
      this.conCambios++;
      this.isTreeBoxOpened = false;
      if (e.selectedRowsData[0].ID_UN === 'RAIZ') {
        this.FUDnegocios.NOMBRE_SUPERIOR = 'UN raiz';
      } else {
        this.FUDnegocios.NOMBRE_SUPERIOR = e.selectedRowsData[0].NOMBRE;
      }
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
          : " UNIDADES_NEGOCIOS.ID_UN = '" + this.FUDnegocios.ID_UN + "'",
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

  onValueChangedForm(e: any, campo: string) {
    if (e.value !== '') {
      switch (campo) {
        case 'ID_UN':
          this.FUDnegocios.ID_UN = e.value;
          if (this.mnuAccion === 'new') {
            this.validarIntegridad('new');
          }
          break;
        case 'NOMBRE':
          this.FUDnegocios.NOMBRE = e.value;
          break;
        case 'ID_UN_SUPERIOR':
          this.FUDnegocios.ID_UN_SUPERIOR = e.value[0];
          const UNPadre = this.VDatosReg.find(
            (res) => this.FUDnegocios.ID_UN_SUPERIOR === res.ID_UN
          );
          this.FUDnegocios.NOMBRE_SUPERIOR = UNPadre.NOMBRE;
          break;
        case 'TIPO':
          this.FUDnegocios.TIPO = e.value;
          break;
        case 'UBICACION':
          this.FUDnegocios.NOMBRE_SUPERIOR = e.value;
          break;

        default:
          break;
      }
      this.conCambios++;
    }
  }

  onItemClickTab(e: any) {
    if (e.itemData === 'Identificación') {
      this.sData.setObs_Identificacion({ accion: 'r_refrescar' });
    }
    if (e.itemData === 'Imagen') {
      this.sData.setObs_Imagen({ accion: 'r_refrescar' });
    }

    if (e.itemData === 'Contabilidad') {
      this.sData.setObs_Contabilidad({ accion: 'r_refrescar' });
    }

    if (e.itemData === 'Configuraciones') {

      for (let i = 0; i < this.FUDnegocios.CONTACTOS.length; i++) {
        const element = this.FUDnegocios.CONTACTOS[i];
        element.ITEM = i + 1;
      }
      this.sData.setObs_Configuraciones({ accion: 'r_refrescar' });
      this.DEmail = this.FUDnegocios.CONTACTOS;
      this.DDirecciones = this.FUDnegocios.DIRECCIONES;
      this.DTelefonos = this.FUDnegocios.TELEFONOS;
      this.eventsSubjectDirTelInfo.next({
        operacion: this.mnuAccion.match('new|update') ? 'activo' : 'consulta',
        Dir: { dataSource: this.DDirecciones ?? [] },
        Tel: { dataSource: this.DTelefonos ?? [] },
        Email: { dataSource: this.DEmail ?? [] },
        Contacto: { dataSource: this.DEmail ?? [] }
      });
    }

    this.sData.setReadOnly(this.readOnly);

    // Valida datos completados
    // if (this.mnuAccion.match('new|update')) {
    //   var result = this.forMUDnegocios.instance.validate();
    //   if (!result.isValid) {
    //     showToast('Faltan completar datos del Usuario', 'warning');
    //   }
    // }
  }

  setObsToService(accion: any) {
    this.sData.setObs_Identificacion({ accion: accion });
    // this.sData.setObs_Imagen({ accion: accion });
    this.sData.setObs_Contabilidad({ accion: accion });
  }

  onRespuestaDirTelInfo(e: any) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;

    if (e !== 'refrescar') {
    }
  }


  onChangedUNOperativa(e: any) {
    this.FUDnegocios.MANEJO_PRESUPUESTO = !this.FUDnegocios.MANEJO_PRESUPUESTO;

  }
  onChangedPresupuesto(e: any) {
    this.FUDnegocios.MANEJO_PRESUPUESTO = !this.FUDnegocios.MANEJO_PRESUPUESTO;
  }

  // En tu componente TypeScript, agrega este método:
  onDropDownValueChanged(e: any) {
    this.onValueChangedForm(e, 'ID_UN_SUPERIOR');
  }
}
