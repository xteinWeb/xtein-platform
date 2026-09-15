import { DxFormModule, DxSwitchModule, DxTagBoxModule, DxTextBoxModule, DxTooltipModule, DxToolbarModule, DxPopoverModule, DxFormComponent, DxTreeListModule, DxDataGridModule, DxTextAreaModule, DxTemplateModule, DxLoadPanelModule, DxSelectBoxModule, DxValidatorModule, DxTagBoxComponent, DxDropDownBoxModule, DxButtonModule, DxDateBoxModule, DxNumberBoxModule, DxTabsModule, DxPopupModule, DxTreeViewModule, DxDataGridComponent } from 'devextreme-angular';
import Swal from 'sweetalert2';
import { MDocumentos } from './clsADM207.class';
import { CommonModule } from '@angular/common';
import { AngularSplitModule } from 'angular-split';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularResizeEventModule } from 'angular-resize-event';
import { showToast } from '../../shared/toast/toastComponent.js';
import { Subscription, Subject, takeUntil, lastValueFrom } from 'rxjs';
import { ADM207Service } from 'src/app/services/ADM207/ADM207.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';
import { ADM20701Component } from './ADM20701/ADM20701.component';
import { ADM20702Component } from './ADM20702/ADM20702.component';
import { ADM20703Component } from './ADM20703/ADM20703.component';
import { ADM20704Component } from './ADM20704/ADM20704.component';
import { ADM20705Component } from './ADM20705/ADM20705.component';
@Component({
  selector: 'app-ADM207',
  templateUrl: './ADM207.component.html',
  styleUrls: ['./ADM207.component.css'],
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
    DxDateBoxModule,
    DxNumberBoxModule,
    DxTabsModule,
    DxPopupModule,
    DxTreeViewModule,
    ADM20701Component,
    ADM20702Component,
    ADM20703Component,
    ADM20704Component,
    ADM20705Component
],
})

export class ADM207Component implements OnInit {
  @ViewChild('etqSelect', { static: false }) etqSelect: DxTagBoxComponent;
  @ViewChild('forMILegales', { static: false }) forMILegales: DxFormComponent;
  eventsSubjectDirTelInfo: Subject<any> = new Subject<any>();
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

  btnContraer: string = 'Expandir';
  prmUsrAplBarReg: clsBarraRegistro;
  integridadReferencial: boolean = true;

  
  readOnlyIncrement: boolean = true;
  viewRanges: boolean = true;

  // Variables de datos
  QFiltro: any;
  USUARIO: any;
  FDocumentos: MDocumentos;
  FDocumentos_prev: any;
  DUbicacionesList: any;
  conCambios: number = 0;
  DListaIdLegales: MDocumentos[];
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

  rowNew: boolean = true;
  // rowEdit: boolean = true;
  rowDelete: boolean = false;
  private rowIndexToDelete: number | null = null;
  // rowSave: boolean = true;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esNuevaFila: boolean = false;
  ltool: any;
  isEdit: boolean = false;
  numFila: number = 0;
  filaData: any = [];
  esEdicion: boolean = false;
  esVisibleSelecc: string = 'none';

  DDirecciones: any;
  DTelefonos: any;
  DEmail: any;
  selectedTabIndex: number = 0;


  public tabsDocumentos: any[] = [];
  public tabsDocumentosFiltered: any[] = [];



  // --------- --------------- -------------

  DOCUMENTOS_UN: any[] = [];
  DOCUMENTOS_AUTORIZACIONES: any[] = [];
  RANGOS: any[] = [];
  DOCUMENTOS_APLICACIONES: any[] = [];
  DOCUMENTOS_ELEC_GEN: any[] = [];
  DOCUMENTOS_USUARIOS: any[] = [];

  isEditing: boolean = false;

  gridBoxAplicacion: string[] = [];
  // appSelecteds.tring = '';

  treeDataProdcutos: any[] = []; // 🔥 AGREGAR ESTA LÍNEA

  appSelecteds: any[] = [];
  // --------- --------------- -------------

  constructor(
    private sData: ADM207Service,
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
      const nx = this.VDatosReg.findIndex((d) => d.ID_DOCUMENTO === resp.ID_DOCUMENTO);
      if (nx !== -1) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    });
  }

  ngOnInit(): void {
    this.FDocumentos = {
      ID_UN: '',
      ID_DOCUMENTO: '',
      NC_DOCUMENTO: '',
      DESCRIPCION: '',
      INCREMENTO: 0,
      DIGITOS: 0,
      EXPRESION_CONSECUTIVO: '',
      FORMATO: 0,
      DIAS_ATRASO: 0,
      ESTADO: '',
      EXPR_CONSEC_SUFIJO: '',
      SEPARADOR: '',
      DATO_PREFIJO: '',
      DATO_SUFIJO: '',
      ID_APLICACION: [],
      ID_DOC_ELECTRONICO: '',
      ID_UN_ASOCIADA: '',
      LISTA_APL: [],
    };

    this.DOCUMENTOS_UN = [];
    this.DOCUMENTOS_AUTORIZACIONES = [];
    this.RANGOS = [];
    this.DOCUMENTOS_APLICACIONES = [];
    this.DOCUMENTOS_ELEC_GEN = [];
    this.DOCUMENTOS_USUARIOS = [];

    this.USUARIO = localStorage.getItem('usuario')?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'DOCUMENTOS',
      aplicacion: 'ADM-207',
      usuario: this.USUARIO,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_refrescar: true },
    };
    this.mnuAccion = '';
    this.readOnly = true;
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

    this.valoresObjetos('todos');

    this.updateTabsDataSource();
    // --
    this.DListaIdLegales = [];

    this.selectedTabIndex = 0; 
    
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
          tabla: 'DOCUMENTOS',
          aplicacion: 'ADM-207',
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
            this.conCambios = 0;
            this.mnuAccion = '';

            if (this.VDatosReg && this.VDatosReg.length > 0) {    
              this.prmUsrAplBarReg.accion = 'r_navegar';
            } else {
              this.prmUsrAplBarReg.accion = 'r_cancelar';
            }
            
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            if (this.forMILegales && this.forMILegales.instance) {
              this.forMILegales.instance._refresh();
            }
            if (
              this.FDocumentos_prev === undefined ||
              this.FDocumentos_prev === '' ||
              this.FDocumentos_prev === null ||
              this.FDocumentos_prev.length === 0
            ) {
              this.opBlanquearFormGP();
              this.eventsSubjectDirTelInfo.next({
                operacion: 'inactivo',
              });
            } else {
              this.FDocumentos = JSON.parse(JSON.stringify(this.FDocumentos_prev));
              
            }
          }
        });
        break;

      case 'r_copiar':
        if (this.FDocumentos.ID_DOCUMENTO !== '') {
          this.mnuAccion = 'new';
          this.readOnly = false;
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
              if (this.forMILegales && this.forMILegales.instance) {
                this.forMILegales.instance._refresh();
              }
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
        Titulo: 'Datos de filtro para ID LEGALES',
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
      const prm = { DOCUMENTOS: arrFiltro };

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
              this.separarListasDelBackend(datares[0]);
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
            this._sfiltro.enConsulta = false;
            this.showModal(error, 'Error');
          }
        });
    }
    this.readOnly = true;
  }

  // Eventos del menu float
  // Si está desplegado el menu float de apoyo, ocultarlo
  onScroll(e: Event): void {
    if (this.eventsSubject === undefined) return;
    this.eventsSubject.next();
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


  opPrepararNuevo(): void {
    this.opBlanquearFormGP();
    this.eventsSubjectDirTelInfo.next({
      operacion: 'activo',
    });
    this.FDocumentos.ESTADO = 'ACTIVO';
  }

  opBlanquearFormGP(): void {
    this.FDocumentos_prev = JSON.parse(JSON.stringify(this.FDocumentos));
    this.FDocumentos = {
      ID_UN: '',
      ID_DOCUMENTO: '',
      NC_DOCUMENTO: '',
      DESCRIPCION: '',
      INCREMENTO: 0,
      DIGITOS: 0,
      EXPRESION_CONSECUTIVO: '',
      FORMATO: 0,
      DIAS_ATRASO: 0,
      ESTADO: '',
      EXPR_CONSEC_SUFIJO: '',
      SEPARADOR: '',
      DATO_PREFIJO: '',
      DATO_SUFIJO: '',
      ID_APLICACION: [],
      ID_DOC_ELECTRONICO: '',
      ID_UN_ASOCIADA: '',
      LISTA_APL: [],
    };

    this.DOCUMENTOS_UN = [];
    this.DOCUMENTOS_AUTORIZACIONES = [];
    this.RANGOS = [];
    this.DOCUMENTOS_APLICACIONES = [];
    this.DOCUMENTOS_ELEC_GEN = [];
    this.DOCUMENTOS_USUARIOS = [];
  }


  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = 'r_numreg';

    switch (accion) {
      case 'r_primero':
        if (this.VDatosReg.length != 0) {
          this.separarListasDelBackend(this.VDatosReg[0]);
          this.prmUsrAplBarReg.r_numReg = 1;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.readOnly = true;
          showToast('No se encontraron Datos', 'error');
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1
            ? 1
            : this.prmUsrAplBarReg.r_numReg - 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.separarListasDelBackend(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]);
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.separarListasDelBackend(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]);


        break;

      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.separarListasDelBackend(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]);
        

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
          this.separarListasDelBackend(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]);

          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearFormGP();
        }
        this.readOnly = true;
        break;

      case 'Eliminado':
        this.opBlanquearFormGP();

        break;

      default:
        break;
    }

  }

  private separarListasDelBackend(datosBackend: any): void {
    
    this.FDocumentos = {
        ID_UN: datosBackend.ID_UN || '',
        ID_DOCUMENTO: datosBackend.ID_DOCUMENTO || '',
        NC_DOCUMENTO: datosBackend.NC_DOCUMENTO || '',
        DESCRIPCION: datosBackend.DESCRIPCION || '',
        INCREMENTO: datosBackend.INCREMENTO || 0,
        DIGITOS: datosBackend.DIGITOS || 0,
        EXPRESION_CONSECUTIVO: datosBackend.EXPRESION_CONSECUTIVO || '',
        FORMATO: datosBackend.FORMATO || 0,
        DIAS_ATRASO: datosBackend.DIAS_ATRASO || 0,
        ESTADO: datosBackend.ESTADO || '',
        EXPR_CONSEC_SUFIJO: datosBackend.EXPR_CONSEC_SUFIJO || '',
        SEPARADOR: datosBackend.SEPARADOR || '',
        DATO_PREFIJO: datosBackend.DATO_PREFIJO || '',
        DATO_SUFIJO: datosBackend.DATO_SUFIJO || '',
        ID_APLICACION: datosBackend.ID_APLICACION || '',
        ID_DOC_ELECTRONICO: datosBackend.ID_DOC_ELECTRONICO || '',
        ID_UN_ASOCIADA: datosBackend.ID_UN_ASOCIADA || '',
        LISTA_APL: datosBackend.LISTA_APL || [],
      };
      
      this.DOCUMENTOS_UN = datosBackend.DOCUMENTOS_UN || [];
      this.DOCUMENTOS_AUTORIZACIONES = datosBackend.DOCUMENTOS_AUTORIZACIONES || [];
      this.RANGOS = datosBackend.RANGOS || [];
      this.DOCUMENTOS_APLICACIONES = datosBackend.DOCUMENTOS_APLICACIONES || [];
      this.DOCUMENTOS_ELEC_GEN = datosBackend.DOCUMENTOS_ELEC_GEN || [];
      this.DOCUMENTOS_USUARIOS = datosBackend.DOCUMENTOS_USUARIOS || [];

      if(this.FDocumentos.ID_APLICACION != null){
        this.appSelecteds = this.FDocumentos.LISTA_APL
        .filter((item: any) => item && item.APL_ARRAY) // Filtrar items válidos
        .flatMap((item: any) => {
          try {
            return JSON.parse(item.APL_ARRAY); // Parsear cada APL_ARRAY
          } catch (error) {
            console.error('Error al parsear APL_ARRAY:', item.APL_ARRAY, error);
            return []; // Retornar array vacío si hay error
          };
          });
      }


      if(this.FDocumentos.FORMATO == 1){
        this.viewRanges = true;
      }else{
        this.viewRanges = false;
      }

      this.updateTabsDataSource();

  }

  // Prepara datos antes de modificar
  async opPrepararModificar() {
    // await this.validarIntegridad('update');
    if (this.integridadReferencial) {
      this.loadingVisible = true;
      
      this.FDocumentos_prev = JSON.parse(JSON.stringify(this.FDocumentos));
      this.readOnly = false;

      this.esVisibleSelecc = 'always';
      this.loadingVisible = false;
      this.eventsSubjectDirTelInfo.next({
        operacion: 'activo',
      });      
    }
  }

  valoresObjetos(obj: string) {

    if (obj == 'ubicaciones' || obj == 'todos') {
      const prm = { TIPO_UBICACION: "Ciudad" };
      this.sData
        .consulta('ubicaciones', prm, "ADM-006")
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
            this.DUbicacionesList = newArray;
          }
        });
    }

  }

  // Vista/Zoom de los datos consultados
  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'DOCUMENTOS',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: [
        'ID_DOCUMENTO|ID LEGAL',
        'NOMBRE|NOMBRE',
        'ID_DOCUMENTO_PADRE|ID LEGAL PADRE',
        'ESTADO|ESTADO',
        'ASIGNABLE|ASIGNABLE',
      ],
      Filtro: '',
      keyGrid: ['ID_DOCUMENTO'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  copiarSeccion() {
    this.mnuAccion = 'new';
    this.readOnly = false;
    this.FDocumentos_prev = JSON.parse(JSON.stringify(this.FDocumentos));
  }

  // Valide unicidad de la llave


  // Guarda modificaciones
  opPrepararGuardar(accion: string): void {
    var prm: any = {
      DOCUMENTOS: this.FDocumentos,
      DOCUMENTOS_UN: this.DOCUMENTOS_UN,
      DOCUMENTOS_AUTORIZACIONES: this.DOCUMENTOS_AUTORIZACIONES,
      DOCUMENTOS_APLICACIONES: this.DOCUMENTOS_APLICACIONES,
      DOCUMENTOS_ELEC_GEN: this.DOCUMENTOS_ELEC_GEN,
      DOCUMENTOS_USUARIOS: this.DOCUMENTOS_USUARIOS,
      RANGOS: this.RANGOS,
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

        showToast('Registro actualizado', 'success');
        this.mnuAccion = '';
        this.readOnly = true;
        this.opPrepararBuscar('{"FILTRO":"","ESTRUCTURA":[],"aplicacion":"ADM - 205"}');
      }
    });
  }

  async validarIntegridad(accion: string) {
    const prm: any = { ID_DOCUMENTO: this.FDocumentos.ID_DOCUMENTO };
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
          html: res[0].ErrMensaje + ', No se puede eliminar el ID LEGAL.',
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
    // await this.validarIntegridad('delete');
    if (this.integridadReferencial) {
      // Confirma...
      Swal.fire({
        title: '',
        text: '',
        html: '¿Desea Eliminar el ID Legal <i>' + this.FDocumentos.ID_DOCUMENTO + '?',
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
        this.FDocumentos.ID_DOCUMENTO === '' ||
        this.FDocumentos.ESTADO === ''
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
      ID_DOCUMENTO: this.FDocumentos.ID_DOCUMENTO,
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
          const idx = this.DListaIdLegales.findIndex(g => g.ID_DOCUMENTO === this.FDocumentos.ID_DOCUMENTO);
          if (idx !== -1) {
            this.DListaIdLegales.splice(idx, 1);
          }
          this.readOnly = true;
          this.FDocumentos_prev = [];
          showToast('Dominio eliminado', 'success');
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: '',
            operacion: {},
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this.opBlanquearFormGP();

          showToast('Sección eliminada', 'success');
        } catch (error) {
          this.showModal(
            'Error respuesta eliminar sección: ' + error + ' Rta:' + data.data
          );
        }
      });
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
          : " DOCUMENTOS.ID_DOCUMENTO = '" + this.FDocumentos.ID_DOCUMENTO + "'",
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


  
  updateTabsDataSource() {
    const newTabs = [
      {
        ID: 0,
        text: 'General',
        content: true,
      },
      {
        ID: 1,
        text: 'UN y Aplicaciones',
        content: true,
      },
      {
        ID: 2,
        text: 'Autorizaciones',
        content: true,
      },
      {
        ID: 3,
        text: 'Rangos',
        content: this.viewRanges,
      },
      {
        ID: 4,
        text: 'Usuarios',
        content: true,
      },
    ];

    
    const newFiltered = newTabs.filter(tab => tab.content !== false);
    
    if (this.tabsDocumentosFiltered.length !== newFiltered.length) {
      this.tabsDocumentos = newTabs;
      this.tabsDocumentosFiltered = newFiltered;
      
    }
  }



  onRespuestaDirTelInfo(e: any) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;

    if (e !== 'refrescar') {
    }
  }

  onTabChanged(e: any) {
    const selectedTab = this.tabsDocumentosFiltered[e.itemIndex];
    this.selectedTabIndex = selectedTab.ID;
  }

  
// 🔥 FUNCIÓN onValueChangedForm CORREGIDA
onValueChangedForm(e: any, campo: string): void {
  if (e.value !== '') {
    (this.FDocumentos as any)[campo] = e.value;
    
    if (campo === 'INCREMENTO') {
      this.readOnlyIncrement = e.value === 0;
    }
    
    if (campo === 'FORMATO') {
      this.viewRanges = e.value === 1;
      
      // 🔥 DIFERIR LA ACTUALIZACIÓN
      setTimeout(() => {
        this.updateTabsDataSource();
      }, 0);
    }
    
    this.conCambios++;
  }
}



  onFormValidated(isValid: boolean): void {
    console.log('📝 Formulario válido:', isValid);
  }

  onGeneralDataChanged(event: {field: string, value: any}): void {
    (this.FDocumentos as any)[event.field] = event.value;
    
    // 🔥 LÓGICA ESPECIAL PARA FORMATO (diferida)
    if (event.field === 'FORMATO') {
      this.viewRanges = event.value === 1; // Si formato es "Manual"
      
      // 🔥 DIFERIR LA ACTUALIZACIÓN PARA EVITAR EL ERROR
      setTimeout(() => {
        this.updateTabsDataSource();
      }, 0);
    }
    
    this.conCambios++;
  }

  // UN y Aplicaciones
  onDocumentosUnChanged(data: any[]): void {
    this.DOCUMENTOS_UN = data;
    this.conCambios++;
  }

  onSelectionGridUN(e: any): void {
     if (e.type === 'aplicaciones') {
      this.appSelecteds = e.selectedKeys;

      let stringSeparadoPorComas: string = this.appSelecteds.join(",");

      this.FDocumentos.ID_APLICACION = this.appSelecteds;
    }
  }

  // Autorizaciones
  onDocumentosAutorizacionesChanged(data: any[]): void {
    this.DOCUMENTOS_AUTORIZACIONES = data;
    this.conCambios++;
  }

  // Rangos
  onRangosChanged(data: any[]): void {
    this.RANGOS = data;
    this.conCambios++;
  }
  
  onSelectionCountChanged(count: number): void {
    console.log('🎯 Elementos seleccionados:', count);
  }

  // Usuarios
  onDocumentosUsuariosChanged(data: any): void {
    this.DOCUMENTOS_USUARIOS = data;
    this.conCambios++;
  }
  
  



}

