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
  DxDateBoxModule,
  DxNumberBoxModule,
} from 'devextreme-angular';
import Swal from 'sweetalert2';
import { MILegales } from './clsADM205.class';
import { CommonModule } from '@angular/common';
import { AngularSplitModule } from 'angular-split';
import DataSource from 'devextreme/data/data_source';
import ArrayStore from 'devextreme/data/array_store';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularResizeEventModule } from 'angular-resize-event';
import { showToast } from '../../shared/toast/toastComponent.js';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { Subscription, Subject, takeUntil, lastValueFrom } from 'rxjs';
import { ADM205Service } from 'src/app/services/ADM205/ADM205.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { MenufloatComponent } from 'src/app/shared/menufloat/menufloat.component';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';
import { DirtelinfoComponent } from 'src/app/shared/dirtelinfo/dirtelinfo.component';

@Component({
  selector: 'app-ADM205',
  templateUrl: './ADM205.component.html',
  styleUrls: ['./ADM205.component.css'],
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
    DirtelinfoComponent
  ],
})
export class ADM205Component implements OnInit {
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
  integridadReferencial: boolean = false;

  // Variables de datos
  QFiltro: any;
  USUARIO: any;
  FIDLegales: MILegales;
  FIDLegales_prev: any;
  DUbicacionesList: any;
  conCambios: number = 0;
  DListaIdLegales: MILegales[];
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

  DDirecciones: any;
  DTelefonos: any;
  DEmail: any;
  constructor(
    private sData: ADM205Service,
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
      const nx = this.VDatosReg.findIndex((d) => d.ID_LEGAL === resp.ID_LEGAL);
      if (nx !== -1) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    });
  }

  ngOnInit(): void {
    this.FIDLegales = {
      APELLIDO: '',
      APELLIDO2: '',
      ESTADO: '',
      FECHA_EXPEDICION: '',
      ID_LEGAL: 0,
      LUGAR_EXPEDICION: '',
      NOMBRE: '',
      NOMBRE2: '',
      PERSONA: '',
      TIPO_ID: '',
      DIRECCIONES: [],
      TELEFONOS: [],
      EMAIL: [],
    };
    this.USUARIO = localStorage.getItem('usuario')?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'IDENTIFICACIONES_LEGALES',
      aplicacion: 'ADM-205',
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
          tabla: 'IDENTIFICACIONES_LEGALES',
          aplicacion: 'ADM-205',
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
            this.prmUsrAplBarReg.accion = this.DListaIdLegales.length > 0 ? 'r_navegar' : 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.forMILegales.instance._refresh();
            if (
              this.FIDLegales_prev === undefined ||
              this.FIDLegales_prev === '' ||
              this.FIDLegales_prev === null ||
              this.FIDLegales_prev.length === 0
            ) {
              this.opBlanquearFormGP();
              this.eventsSubjectDirTelInfo.next({
                operacion: 'inactivo',
              });
            } else {
              this.FIDLegales = JSON.parse(JSON.stringify(this.FIDLegales_prev));
            }
          }
        });
        break;

      case 'r_copiar':
        if (this.FIDLegales.ID_LEGAL !== 0) {
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
              this.forMILegales.instance._refresh();
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
      const prm = { IDENTIFICACIONES_LEGALES: arrFiltro };

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
              this.FIDLegales = datares[0];
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
    this.FIDLegales.ESTADO = 'ACTIVO';
  }

  opBlanquearFormGP(): void {
    this.FIDLegales_prev = JSON.parse(JSON.stringify(this.FIDLegales));
    this.FIDLegales = {
      APELLIDO: '',
      APELLIDO2: '',
      ESTADO: '',
      FECHA_EXPEDICION: '',
      ID_LEGAL: 0,
      LUGAR_EXPEDICION: '',
      NOMBRE: '',
      NOMBRE2: '',
      PERSONA: '',
      TIPO_ID: '',
      DIRECCIONES: [],
      TELEFONOS: [],
      EMAIL: [],
    };
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = 'r_numreg';

    switch (accion) {
      case 'r_primero':
        if (this.VDatosReg.length != 0) {
          this.FIDLegales = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          // Buscamos el elemento que coincida con ID_LEGAL_PADRE
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
        this.FIDLegales = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );

        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.FIDLegales = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );

        break;

      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.FIDLegales = JSON.parse(
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
          this.FIDLegales = JSON.parse(
            JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
          );

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

    this.DDirecciones = this.FIDLegales.DIRECCIONES ?? [];
    this.DTelefonos = this.FIDLegales.TELEFONOS ?? [];
    this.DEmail = this.FIDLegales.EMAIL ?? [];
    this.eventsSubjectDirTelInfo.next({
      operacion: 'consulta',
      Dir: { dataSource: this.DDirecciones ?? [] },
      Tel: { dataSource: this.DTelefonos ?? [] },
      Email: { dataSource: this.DEmail ?? [] },
      Contacto: { dataSource: [] }

    });
  }

  // Prepara datos antes de modificar
  async opPrepararModificar() {
    await this.validarIntegridad('update');
    if (this.integridadReferencial) {
      this.loadingVisible = true;
      this.FIDLegales_prev = JSON.parse(JSON.stringify(this.FIDLegales));
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
      Titulo: 'IDENTIFICACIONES_LEGALES',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: [
        'ID_LEGAL|ID LEGAL',
        'NOMBRE|NOMBRE',
        'ID_LEGAL_PADRE|ID LEGAL PADRE',
        'ESTADO|ESTADO',
        'ASIGNABLE|ASIGNABLE',
      ],
      Filtro: '',
      keyGrid: ['ID_LEGAL'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  copiarSeccion() {
    this.mnuAccion = 'new';
    this.readOnly = false;
    this.FIDLegales_prev = JSON.parse(JSON.stringify(this.FIDLegales));
  }

  // Valide unicidad de la llave


  // Guarda modificaciones
  opPrepararGuardar(accion: string): void {
    var prm: any = {
      IDENTIFICACIONES_LEGALES: {
        APELLIDO: this.FIDLegales.APELLIDO,
        APELLIDO2: this.FIDLegales.APELLIDO2,
        ESTADO: this.FIDLegales.ESTADO,
        FECHA_EXPEDICION: this.FIDLegales.FECHA_EXPEDICION,
        ID_LEGAL: this.FIDLegales.ID_LEGAL,
        LUGAR_EXPEDICION: this.FIDLegales.LUGAR_EXPEDICION,
        NOMBRE: this.FIDLegales.NOMBRE,
        NOMBRE2: this.FIDLegales.NOMBRE2,
        PERSONA: this.FIDLegales.PERSONA,
        TIPO_ID: this.FIDLegales.TIPO_ID,
      },
      TELEFONOS: this.DTelefonos,
      EMAIL: this.DEmail,
      DIRECCIONES: this.DDirecciones,
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
    const prm: any = { ID_LEGAL: this.FIDLegales.ID_LEGAL };
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
    await this.validarIntegridad('delete');
    if (this.integridadReferencial) {
      // Confirma...
      Swal.fire({
        title: '',
        text: '',
        html: '¿Desea Eliminar el ID Legal <i>' + this.FIDLegales.ID_LEGAL + '?',
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
        this.FIDLegales.ID_LEGAL === 0 ||
        this.FIDLegales.NOMBRE === '' ||
        this.FIDLegales.ESTADO === ''
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
      ID_LEGAL: this.FIDLegales.ID_LEGAL,
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
          const idx = this.DListaIdLegales.findIndex(g => g.ID_LEGAL === this.FIDLegales.ID_LEGAL);
          if (idx !== -1) {
            this.DListaIdLegales.splice(idx, 1);
          }
          this.readOnly = true;
          this.FIDLegales_prev = [];
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
          : " IDENTIFICACIONES_LEGALES.ID_LEGAL = '" + this.FIDLegales.ID_LEGAL + "'",
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
        case 'TIPO_ID':
          this.FIDLegales.TIPO_ID = e.value;
          break;
        case 'PERSONA':
          this.FIDLegales.PERSONA = e.value;
          break;
        case 'ID_LEGAL':
          this.FIDLegales.ID_LEGAL = e.value;
          break;
        case 'NOMBRE':
          this.FIDLegales.NOMBRE = e.value;
          break;
        case 'NOMBRE2':
          this.FIDLegales.NOMBRE2 = e.value;
          break;
        case 'APELLIDO':
          this.FIDLegales.APELLIDO = e.value;
          break;
        case 'APELLIDO2':
          this.FIDLegales.APELLIDO2 = e.value;
          break;
        case 'FECHA_EXPEDICION':
          this.FIDLegales.FECHA_EXPEDICION = e.value;
          break;
        case 'LUGAR_EXPEDICION':
          this.FIDLegales.LUGAR_EXPEDICION = e.value;
          break;
        case 'ESTADO':
          this.FIDLegales.ESTADO = e.value;
          break;

        default:
          break;
      }
      this.conCambios++;
    }
  }
  onChangedAsignable(e: any) {
  }


  onRespuestaDirTelInfo(e: any) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;

    if (e !== 'refrescar') {
    }
  }

}
