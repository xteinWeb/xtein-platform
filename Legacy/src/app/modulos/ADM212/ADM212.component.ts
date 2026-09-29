import {
  DxDataGridModule,
  DxDropDownBoxModule,
  DxButtonModule,
  DxFormModule,
  DxSelectBoxModule,
  DxFormComponent,
  DxPopupModule,
  DxRadioGroupModule,
  DxTabPanelModule,
  DxTextBoxModule,
  DxValidatorModule,
  DxLoadPanelModule,
  DxDataGridComponent,
} from 'devextreme-angular';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { Component, OnInit, ViewChild } from '@angular/core';
import { showToast } from '../../shared/toast/toastComponent';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { ADM212Service } from 'src/app/services/ADM212/ADM212.service';
import { lastValueFrom, Subject, Subscription, takeUntil } from 'rxjs';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { clsDominios, clsDM_Asociadas, FDominios } from './clsADM212.class';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';

@Component({
  selector: 'app-ADM212',
  templateUrl: './ADM212.component.html',
  styleUrls: ['./ADM212.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    DxFormModule,
    DxPopupModule,
    DxButtonModule,
    DxTextBoxModule,
    DxDataGridModule,
    DxTabPanelModule,
    DxLoadPanelModule,
    DxSelectBoxModule,
    DxValidatorModule,
    DxRadioGroupModule,
    DxDropDownBoxModule,
    VistarapidaComponent,
    GeninformesComponent,
  ],
})
export class ADM212Component implements OnInit {
  @ViewChild('gridDominios', { static: false })
  gridDominios: DxDataGridComponent;

  subs_visor: Subscription;
  subs_filtro: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();

  // Variables fijas de la aplicación
  VDatosReg: any[] = [];
  readOnly: boolean;
  mnuAccion: string;
  data_prev: any = '';
  FDominios: FDominios;
  conCambios: number = 0;
  Itm_Dominios: any[] = [];
  esEdicion: boolean = false;
  subscription: Subscription;
  iniEdicion: boolean = false;
  validatorForm: boolean = false;
  esVisibleSelecc: string = 'none';
  readOnlyForm: boolean = false;
  prmUsrAplBarReg: clsBarraRegistro;
  activeFormCalidad: boolean = false;

  // Notificaciones
  toaVisible: boolean;
  loadingVisible: boolean = false;

  // Variables de datos
  QFiltro: any;
  USUARIO: any;
  filaData: any = [];
  numFila: number = 0;
  DDominios_prev: any;
  DDominios: clsDominios;
  DDMsociadas: clsDM_Asociadas[];

  // Operaciones de grid
  rowNew: boolean = true;
  filasSelecc: any[] = [];
  isEdit: boolean = false;
  rowEdit: boolean = false;
  rowSave: boolean = false;
  rowDelete: boolean = false;
  readOnlyVALOR2: boolean = true;
  readOnlyVALOR3: boolean = true;
  readOnlyVALOR4: boolean = true;
  rowApplyChanges: boolean = false;

  constructor(
    private SVisor: SvisorService,
    private tabService: TabService,
    private _sdatos: ADM212Service,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService
  ) {
    this.subscription = this._sbarreg
      .getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((dempeg) => {
        // Valida si la petición es para esta aplicacion
        if (dempeg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(dempeg);
      });

    // Respuesta del filtro
    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe((resp) => {
      // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opPrepararBuscar(resp);
    });

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe((resp) => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion)
        return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex(
        (d) => d.ID_DOMINIO === resp.ID_DOMINIO
      );
      if (nx !== -1) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    });
   
    this.ValideExistencia = this.ValideExistencia.bind(this);
  }

  ngOnInit(): void {
    this.FDominios = {
      ID_DOMINIO: '',
      NOMBRE: '',
      ID_GRUPO_DOMINIO: '',
    };
    this.USUARIO = localStorage.getItem('usuario')?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'DOMINIOS',
      aplicacion: 'ADM-212',
      usuario: this.USUARIO,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_refrescar: true },
    };
    this.mnuAccion = '';
    this.readOnly = true;
    this.readOnlyForm = true;
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case 'r_ini':
        this.mnuAccion = 'init';
        this.prmUsrAplBarReg = {
          tabla: 'DOMINIOS',
          aplicacion: 'ADM-212',
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
        this.readOnlyForm = false;
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        if (!this.ValidaDatos('requerido')) {
          return;
        } else {
          if (this.conCambios != 0) {
            this.opPrepararGuardar(this.mnuAccion);
          } else showToast('No hay cambios a guardar', 'warning');
        }

        break;

      case 'r_buscar':
        // this._sdatos.accion = 'consultar';
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
        // this._sdatos.accion = 'consultar';
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
        const tipo = 'Error';
        if (this.conCambios != 0)
          mensaje = 'Desea cancelar sin guardar cambios?';
        Swal.fire({
          title: '',
          text: mensaje,
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor:
            tipo === 'Error' ? '#DF3E3E !important' : '#0F4C81 !important',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar',
        }).then((result: any) => {
          if (result.isConfirmed) {
            this.readOnly = true;
            this.readOnlyForm = true;
            this.validatorForm = false;
            this.conCambios = 0;
            this.mnuAccion = '';
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.esVisibleSelecc = 'none';
            if (
              this.data_prev === undefined ||
              this.data_prev === '' ||
              this.data_prev === null ||
              this.data_prev.length === 0
            ) {
              this.opBlanquearFormDM();
            } else {
              this.FDominios = JSON.parse(JSON.stringify(this.data_prev));
              this.Itm_Dominios = JSON.parse(
                JSON.stringify(this.data_prev.ITEMS)
              );
            }
          } else {}
        });
        break;

      case 'r_vista':
        this.opVista();
        break;

      case 'r_copiar':
        if (
          this.FDominios.ID_DOMINIO !== '' &&
          this.FDominios.ID_GRUPO_DOMINIO !== '' &&
          this.FDominios.NOMBRE !== ''
        ) {
          this.mnuAccion = 'new';
          this.readOnly = false;
          this.readOnlyForm = false;
          this.data_prev = JSON.parse(JSON.stringify(this.FDominios));
          this.conCambios = 0;
        }
        break;

      case 'r_refrescar':
        this.mnuAccion = 'init';
        this.valoresObjetos('refrescar');
        break;

      case 'r_imprimir':
        this.imprimirReporte(operMenu);
        break;

      case 'r_configurar':
        break;

      default:
        break;
    }
  }

  ValidaDatos(Accion: string): boolean {
    // Valida datos completados de pestaña <Generales>

    if (Accion === 'requerido') {
      if (
        this.FDominios.ID_DOMINIO === '' ||
        this.FDominios.NOMBRE === '' ||
        this.FDominios.ID_GRUPO_DOMINIO === '' ||
        this.Itm_Dominios.length === 0
      ) {
        this.showModal(
          'Error al guardar',
          'Faltan datos',
          'Hay datos incompletos del Dominio. Revisar contenido de los items marcados!'
        );
        return false;
      }
    }
    return true;
  }

  valoresObjetos(obj: string) {
    if (obj === 'refrescar') {
      this.loadingVisible = true;
      const prm = {
        DOMINIOS: [
          { CAMPO: 'ID_DOMINIO', EXPRESION: this.FDominios.ID_DOMINIO },
          {
            CAMPO: 'ID_GRUPO_DOMINIO',
            EXPRESION: this.FDominios.ID_GRUPO_DOMINIO,
          },
        ],
      };
      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this._sdatos
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
              if (datares ?? '' != '') {
                // cabecera
                const newDataPosition = this.VDatosReg.findIndex(
                  (row) =>
                    row.ID_DOMINIO === datares[0].ID_DOMINIO &&
                    row.ID_GRUPO_DOMINIO === datares[0].ID_GRUPO_DOMINIO
                );

                if (newDataPosition === -1) {
                  showToast('Elemento no encontrado', 'warning');
                } else {
                  this.QFiltro = datares[0].QFILTRO;
                  this.VDatosReg[newDataPosition] = datares[0];
                  this.data_prev = datares[0];
                  // Prepara la barra para navegación
                  this.prmUsrAplBarReg = {
                    ...this.prmUsrAplBarReg,
                    r_totReg: this.VDatosReg.length,
                    r_numReg: newDataPosition + 1,
                    accion: 'r_navegar',
                    operacion: {},
                  };
                  this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
                  // Trae los items en los componentes asociados
                  this.opIrARegistro('r_numreg');
                  this.readOnly = true;
                  this.readOnlyForm = true;
                }
              }
            } else {
              this.VDatosReg = [];
              //notificación
              showToast(datares[0].ErrMensaje, 'warning');
              this.prmUsrAplBarReg.accion = 'r_cancelar';
              this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
              //this.opBlanquearFormDM();
            }
          } catch (error) {
            this.loadingVisible = false;
            this.readOnly = true;
            this.readOnlyForm = true;
            this._sfiltro.enConsulta = false;
            this.showModal(error, 'Error');
          }
        });
    }
  }

  onContentReady(e: any) {
    e.component.columnOption('command:edit', 'visible', false);
  }

  onRowValidating(e: any) {
    if (this.mnuAccion === 'new') {
      if (e.newData.VALOR1 === '') {
        showToast('Faltan completar datos del Dominio.', 'error');
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
      if (e.oldData.VALOR1 === '') {
        showToast('Faltan completar datos del Dominio.', 'error');
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
    if (this.Itm_Dominios.length > 0) {
      const item = this.Itm_Dominios.reduce((ant, act) => {
        return ant.ITEM > act.ITEM ? ant : act;
      });
      e.data.ITEM = item.ITEM + 1;
    } else {
      e.data.ITEM = 1;
    }

    e.data.ID_DOMINIO = this.FDominios.ID_DOMINIO;
    e.data.VALOR1 = '';
    e.data.VALOR2 = '';
    e.data.VALOR3 = '';
    e.data.VALOR4 = '';
    this.numFila = e.data.ITEM;
    this.filaData = e.data;
  }

  selectionGrid(e: any) {
    if (!this.isEdit) {
      this.filasSelecc = e.selectedRowKeys;
      this.numFila = this.Itm_Dominios.findIndex(
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
      this.gridDominios.instance.clearSelection();
      if (e.data !== undefined && e.data !== null) {
        if (this.esEdicion) {
          this.Itm_Dominios.forEach((ele: any) => {
            ele.readOnly_UNIDAD_MEDIDA = true;
          });
          const isEditing = this.gridDominios.instance.hasEditData();
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
          this._sdatos.readonly = true;
          this._sdatos.readonlyForm = true;
        }
      }
    }
  }

  opPrepararNuevo(): void {
    this.loadingVisible = true;
    this.esEdicion = true;
    this.iniEdicion = true;
    this.opBlanquearFormDM();
    this.resetValidaciones();
    this.esVisibleSelecc = 'onClick';
    this.FDominios.TIPO = 'USUARIO';

    // Activa componentes
    this._sdatos.accion = 'r_nuevo';
    this.loadingVisible = false;
  }

  opPrepararModificar() {
    this.loadingVisible = true;
    this.esVisibleSelecc = 'onClick';
    this.data_prev = JSON.parse(
      JSON.stringify({
        ...this.FDominios,
        ITEMS: this.Itm_Dominios,
      })
    );
    this.validatorForm = true;
    this.readOnly = false;
    this.readOnlyForm = true;
    this.esEdicion = true;
    this.iniEdicion = true;

    // Activa componentes
    this.loadingVisible = false;
  }

  opPrepararGuardar(accion: string): void {
    if (this.conCambios != 0) {
      const prmDatosGuardar = {
        ENCABEZADO: this.FDominios,
        ITEMS: this.Itm_Dominios,
      };

      this.loadingVisible = true;
      // API guardado de datos
      var exito = false;
      this._sdatos
        .save(accion, prmDatosGuardar, this.prmUsrAplBarReg.aplicacion)
        .subscribe((resp) => {
          this.loadingVisible = false;
          const res = JSON.parse(resp.data);
          if (res[0].ErrMensaje !== '') {
            this.showModal(res[0].ErrMensaje);
            this.esVisibleSelecc = 'onClick';
          } else {
            this.readOnly = true;
            this.readOnlyForm = true;
            this.esEdicion = false;
            // Operaciones de barra
            if (this.mnuAccion === 'new') {
              this.VDatosReg = [
                { ...this.FDominios, ITEMS: this.Itm_Dominios },
              ];
              this.QFiltro = "DOMINIO='" + this.FDominios.ID_DOMINIO + "'";
              this.prmUsrAplBarReg = {
                ...this.prmUsrAplBarReg,
                error: '',
                accion: 'r_navegar',
                r_numReg: 1,
                r_totReg: 1,
                operacion: {},
              };
            } else {
              this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1] = JSON.parse(
                JSON.stringify(this.FDominios)
              );
              this.prmUsrAplBarReg = {
                ...this.prmUsrAplBarReg,
                error: '',
                accion: 'r_navegar',
                operacion: {},
              };
            }
            this.esVisibleSelecc = 'none';
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.toaVisible = true;
            showToast('Registro actualizado', 'success');
            this.mnuAccion = '';
            // Inactiva cambios
          }
        });
    } else {
      this.esVisibleSelecc = 'always';
    }
  }

  // Operaciones de grid
  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        this.isEdit = true;
        if (this.validatorForm) {
          this.gridDominios.instance.addRow();
          this.rowApplyChanges = true;
          this.esVisibleSelecc = 'none';
          this.rowNew = false;
        } else {
          showToast('Faltan datos del Dominio.', 'error');
        }
        break;
      case 'edit':
        this.gridDominios.instance.editRow(this.numFila);
        this.esVisibleSelecc = 'none';
        this.isEdit = true;
        this.rowApplyChanges = true;
        this.mnuAccion = 'update';
        this.rowEdit = false;

        break;
      case 'save':
        this.isEdit = false;
        this.gridDominios.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        break;
      case 'cancel':
        this.isEdit = false;
        this.gridDominios.instance.cancelEditData();
        this.esVisibleSelecc = 'onCLick';
        this.rowApplyChanges = false;
        this.rowNew = true;
        break;
      case 'delete':
        // Elimina filas seleccionadas
        this.isEdit = false;
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
              const index = this.Itm_Dominios.findIndex((a) => a.ITEM === key);
              this.Itm_Dominios.splice(index, 1);
            });
            this.conCambios++;
            this.gridDominios.instance.refresh();
          }
        });
        break;

      default:
        break;
    }
  }

  async ValideExistencia() {
    if (this.mnuAccion === 'new') {
      // Valida la existencia de la llave respectiva
      const prm = {
        ID_DOMINIO: this.FDominios.ID_DOMINIO,
        ID_GRUPO_DOMINIO: this.FDominios.ID_GRUPO_DOMINIO,
        accion: this.mnuAccion,
      };

      if (prm.ID_DOMINIO !== '' && prm.ID_GRUPO_DOMINIO !== '') {
        const apiRest = this._sdatos.validellave(
          'EXISTE GRUPO DOMINIO',
          prm,
          'ADM212'
        );
        let res = await lastValueFrom(apiRest, { defaultValue: true });
        res = JSON.parse(res.data);
        if (res[0].ErrMensaje === '') {
          this.conCambios++;
          this.validatorForm = true;
          return true;
        } else {
          if (this.FDominios.ID_DOMINIO !== '') {
            showToast('El Dominio registrado ya esta en uso', 'warning');
            this.FDominios.ID_DOMINIO = '';
            this.validatorForm = false;
          } else if (this.FDominios.ID_GRUPO_DOMINIO !== '') {
            showToast('El Grupo Dominio registrado ya esta en uso', 'warning');
            this.FDominios.ID_GRUPO_DOMINIO = '';
            this.validatorForm = false;
          }
          this.conCambios = 0;
          if (
            res[0].ErrMensaje !== null ||
            res[0].ErrMensaje !== '' ||
            res[0].ErrMensaje !== undefined
          ) {
            showToast(res[0].ErrMensaje, 'error');
          }
        }
        return false;
      }
      return false;
    }
    return;
  }

  onValueChangedFormID_DOMINIO(e: any) {
    if (this.mnuAccion.match('new|update')) {
      if (e.value === '' || e.value === undefined || e.value === null) {
        this.FDominios.ID_DOMINIO = '';
        this.validatorForm = false;
      } else {
        this.FDominios.ID_DOMINIO = e.value;
        if (
          this.FDominios.ID_DOMINIO !== '' &&
          this.FDominios.NOMBRE !== '' &&
          this.FDominios.ID_GRUPO_DOMINIO !== ''
        )
        this.ValideExistencia();
        else this.validatorForm = false;
        this.conCambios++;
      }
    }
  }
  onValueChangedFormID_GDOMINIO(e: any) {
    if (this.mnuAccion.match('new|update')) {
      if (e.value === '' || e.value === undefined || e.value === null) {
        this.FDominios.ID_GRUPO_DOMINIO = '';
        this.validatorForm = false;
      } else {
          this.FDominios.ID_GRUPO_DOMINIO = e.value;
          if (
            this.FDominios.ID_DOMINIO !== '' &&
            this.FDominios.NOMBRE !== '' &&
            this.FDominios.ID_GRUPO_DOMINIO !== ''
          )
          this.ValideExistencia();
        else this.validatorForm = false;
      }
    }
  }
  onValueChangedFormID_DESDOMINIO(e: any) {
    if (this.mnuAccion.match('new|update')) {
      if (e.value === '' || e.value === undefined || e.value === null) {
        this.FDominios.NOMBRE = '';
        this.validatorForm = false;
      } else {
        this.FDominios.NOMBRE = e.value;
        if (
          this.FDominios.ID_DOMINIO !== '' &&
          this.FDominios.NOMBRE !== '' &&
          this.FDominios.ID_GRUPO_DOMINIO !== ''
        )
          this.ValideExistencia();
        else this.validatorForm = false;
        this.conCambios++;
      }
    }
  }

  opPrepararBuscar(accion: any): void {
    if (accion === 'filtro') {
      this._sfiltro.PrmFiltro = {
        Titulo: 'Datos de filtro para DOMINIOS',
        accion: 'PREPARAR FILTRO',
        Filtro: '',
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { DOMINIOS: arrFiltro };
      this.loadingVisible = true;
      this._sdatos
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
              if (datares ?? '' != '') {
                // cabecera
                this.VDatosReg = datares;
                this.data_prev = datares[0];
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
                this.readOnlyForm = true;
              }
            } else {
              this.VDatosReg = [];
              //notificación
              showToast(datares[0].ErrMensaje, 'warning');
              this.prmUsrAplBarReg.accion = 'r_cancelar';
              this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
              //this.opBlanquearFormDM();
            }
          } catch (error) {
            this.loadingVisible = false;
            this.readOnly = true;
            this.readOnlyForm = true;
            this._sfiltro.enConsulta = false;
            this.showModal(error, 'Error');
          }
        });
    }

    this.readOnly = true;
    this.readOnlyForm = true;
    this.resetValidaciones();
  }

  opBlanquearFormDM(): void {
    this.FDominios = {
      ID_DOMINIO: '',
      NOMBRE: '',
      ID_GRUPO_DOMINIO: '',
    };
    this._sdatos.ID_DOMINIO = '';
    this._sdatos.ID_DOMINIO_prev = '';
    this.Itm_Dominios = [];
    this.DDominios_prev = JSON.parse(JSON.stringify(this.FDominios));
  }
  opEliminar(): void {
    // Confirma...
    Swal.fire({
      title: '',
      text: '',
      html:
        'Desea eliminar el DOMINIO <i>' + this.FDominios.ID_DOMINIO + '</i> ?',
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

  AccionEliminar(): void {
    // API eliminación de datos
    const prm = {
      ID_DOMINIO: this.FDominios.ID_DOMINIO,
      ID_GRUPO_DOMINIO: this.FDominios.ID_GRUPO_DOMINIO,
    };
    this._sdatos
      .delete('delete', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        try {
          if (res[0].ErrMensaje !== '') {
            this.showModal(res[0].ErrMensaje);
            return;
          }

          // Elimina y posiciona en el Array de Consulta
          this.opIrARegistro('Eliminado');
          this.readOnly = true;
          this.readOnlyForm = true;
          showToast('Dominio eliminado', 'success');

          // Operaciones de barra
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: '',
            accion: this.prmUsrAplBarReg.r_totReg !== 0 ? 'r_navegar' : 'r_ini',
            operacion: {},
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } catch (error) {
          this.showModal(error, 'Error al eliminar: ');
        }
      });
  }

  opIrARegistro(accion: string): void {
    let newArray: any = [];
    this.prmUsrAplBarReg.accion = 'r_numreg';
    switch (accion) {
      case 'r_primero':
        this.prmUsrAplBarReg.r_numReg = 1;
        if (this.VDatosReg.length != 0) {
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.readOnly = true;
          this.readOnlyForm = true;
          showToast('No se encontraron Datos', 'error');
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1
            ? 1
            : this.prmUsrAplBarReg.r_numReg - 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        newArray = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

        newArray = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );

        break;
      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        newArray = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
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
          newArray = JSON.parse(
            JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
          );

          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearFormDM();
          setTimeout(() => {
            this.resetValidaciones();
          }, 100);
        }
        this.readOnly = true;
        this.readOnlyForm = true;
        break;
      case 'Eliminado':
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        this.prmUsrAplBarReg.r_totReg = this.VDatosReg.length;
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          this.FDominios = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
          this.Itm_Dominios =
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITEMS;
          newArray = JSON.parse(
            JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
          );
        } else {
          this.opBlanquearFormDM();
        }
        break;
      default:
        break;
    }
    this.FDominios.ID_DOMINIO = newArray.ID_DOMINIO;
    this.FDominios.NOMBRE = newArray.NOMBRE;
    this.FDominios.ID_GRUPO_DOMINIO = newArray.ID_GRUPO_DOMINIO;
    this.Itm_Dominios = newArray.ITEMS;
    // Navega  los componentes items
    this._sdatos.accion = 'r_numreg';
  }

  onValueChangedGridValor1(e: any, cellInfo: any) {
    if (e.value !== null && e.value !== undefined && e.value !== '') {
      this.gridDominios.instance.cellValue(
        cellInfo.rowIndex,
        'VALOR1',
        e.value
      );
      this.conCambios++;
      this.readOnlyVALOR2 = false;
    }
  }
  onValueChangedGridValor2(e: any, cellInfo: any) {
    if (e.value !== null && e.value !== undefined && e.value !== '') {
      this.gridDominios.instance.cellValue(
        cellInfo.rowIndex,
        'VALOR2',
        e.value
      );
      this.conCambios++;
      this.readOnlyVALOR3 = false;
    }
  }
  onValueChangedGridValor3(e: any, cellInfo: any) {
    if (e.value !== null && e.value !== undefined && e.value !== '') {
      this.gridDominios.instance.cellValue(
        cellInfo.rowIndex,
        'VALOR3',
        e.value
      );
      this.conCambios++;
      this.readOnlyVALOR4 = false;
    }
  }
  onValueChangedGridValor4(e: any, cellInfo: any) {
    if (e.value !== null && e.value !== undefined && e.value !== '') {
      this.gridDominios.instance.cellValue(
        cellInfo.rowIndex,
        'VALOR4',
        e.value
      );
      this.conCambios++;
    }
  }

  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'DOMINIOS',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: [
        'ID_DOMINIO|DOMINIO',
        'ID_GRUPO_DOMINIO|GRUPO DOMINIO',
        'NOMBRE|DESCRIPCION',
      ],
      Filtro: '',
      keyGrid: ['ID_DOMINIO'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
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
          : " DOMINIOS.ID_DOMINIO = '" +
            this.FDominios.ID_DOMINIO +
            "' AND DOMINIOS.ID_GRUPO_DOMINIO = '" +
            this.FDominios.ID_GRUPO_DOMINIO +
            "'",
    };
    if (operMenu.operacion.modo === 'previsualizar')
      this.eventsSubjectInformes.next(prmRep);

    if (operMenu.operacion.modo === 'pdf') {
      prmRep = { ...prmRep, accion: 'pdf' };
      this.eventsSubjectInformes.next(prmRep);
    }
  }

  resetValidaciones() {
    // this.formDominios.instance.resetValues();
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
      position: 'center',
      html: msg_html,
      stopKeydownPropagation: false,
    });
  }
}
