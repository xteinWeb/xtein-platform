import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxFormModule, DxNumberBoxModule, DxRadioGroupModule, DxSelectBoxModule, DxTextBoxModule, DxTreeListModule, DxValidatorModule } from 'devextreme-angular';
import { clsBonos } from './clsGHU230.class';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { GHU230Service } from 'src/app/services/GHU-230/GHU-230.service';
import { every, Subject, Subscription, takeUntil } from 'rxjs';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import Swal from 'sweetalert2';
import { showToast } from '../../shared/toast/toastComponent';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-GHU-230',
  templateUrl: './GHU-230.component.html',
  styleUrls: ['./GHU-230.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    DxFormModule,
    DxTextBoxModule,
    DxValidatorModule,
    DxDataGridModule,
    DxButtonModule,
    DxDateBoxModule,
    DxSelectBoxModule,
    DxNumberBoxModule,
    DxRadioGroupModule,
    DxTreeListModule,
    VistarapidaComponent,
    DxDropDownBoxModule
  ]
})
export class GHU230Component {

  private endPoint = environment.apiUrl;

  @ViewChild('gridEmpleados', { static: false }) gridEmpleados: DxDataGridComponent;

  FPorcentajeBonos: clsBonos;
  ANO: Date = new Date();
  MES: Date = new Date();
  DperiodList: any[];
  DSeccion: any[] = [];
  Dusuarios: any[] = [];
  DRadioButtons = [
    'Porcentaje',
    'Valor',
  ];
  data_prev: any = '';

  readOnlyForm: boolean = true;
  readOnlyFormEdit: boolean = true;
  public _unsubscribeAll: Subject<any>;
  openDropFiltro: boolean = false;
  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string;
  mnuAccionGrid: string;
  loadingVisible: boolean = false;

  subscription: Subscription;
  subs_visor: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  subs_filtro: Subscription;

  USUARIO: any;
  conCambios: number = 0;
  Itm_Usuarios: any[] = [];
  VDatosReg: any[] = [];
  QFiltro: any;

  numFila: number = 0;
  filaData: any = [];
  isEdit: boolean = false;
  filasSelecc: any[] = [];
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowSave: boolean = false;
  rowDelete: boolean = false;
  rowApplyChanges: boolean = false;
  esVisibleSelecc: string = 'none';
  templateGroup: any = ['ID_EMPLEADO'];

  accionEspecial: string = '';
  validGrid: boolean = false;

  constructor(
    public generalesService: GeneralesService,
    private _sbarreg: SbarraService,
    private _sdato: GHU230Service,
    private SVisor: SvisorService,
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
      const nx = this.VDatosReg.findIndex(d => d.ID_SECCION === resp.ID_SECCION);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    });

    this._unsubscribeAll = new Subject();
    this.FPorcentajeBonos = {
      ITEM: '',
      ANO: 2025,
      MES: 10,
      PERIODO: 1,
      TYPEVALUE: 'Porcentaje',
      PORCENTAJE: 0,
      VALOR: 0,
      ID_SECCION: '',
    }
    this.DperiodList = [{ PERIODO: 1, VALOR: 'Primera Quincena' }, { PERIODO: 2, VALOR: 'Segunda Quincena' }]

    this.adicionarColumnas = this.adicionarColumnas.bind(this);
  }


  ngOnInit(): void {
    this.USUARIO = localStorage.getItem('usuario')?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'BONIFICACIONES_PRO',
      aplicacion: 'GHU-230',
      usuario: this.USUARIO,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_refrescar: true, },
    };
    this.mnuAccion = '';
    this.readOnlyForm = true;
    this.readOnlyFormEdit = true;
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.valoresObjetos('secciones');
  }

  ngOnDestroy() {
    this._unsubscribeAll.next('');
    this._unsubscribeAll.complete();
    this.subs_filtro.unsubscribe();
    this.subscription.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case 'r_ini':
        this.mnuAccion = 'init';
        this.prmUsrAplBarReg = {
          tabla: 'BONIFICACIONES_PRO',
          aplicacion: 'GHU-230',
          usuario: this.USUARIO,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_refrescar: true, },
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_nuevo':
        this.mnuAccion = 'new';
        this.readOnlyForm = false;
        this.readOnlyFormEdit = false;
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        if (this.accionEspecial !== '') {
          if (this.conCambios != 0) {
            this.opPrepararGuardarMasivo();
          } else showToast('No hay cambios a guardar', 'warning');
        } else {
          if (!this.ValidaDatos('requerido')) {
            return;
          } else {
            if (this.conCambios != 0) {
              this.opPrepararGuardar(this.mnuAccion);
            } else showToast('No hay cambios a guardar', 'warning');
          }
        }

        break;

      case 'r_buscar':
        // this._sdatos.accion = 'consultar';
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion)
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
            this.readOnlyForm = true;
            this.readOnlyFormEdit = true;
            this.conCambios = 0;
            this.mnuAccion = '';
            // this.prmUsrAplBarReg.accion = 'r_navegar';
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              accion: 'r_navegar',
              operacion: {}
            };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.accionEspecial = '';
            if (
              this.data_prev === undefined
              || this.data_prev === ''
              || this.data_prev === null
            ) {
              this.opBlanquearFormGHU();
            } else {
              this.FPorcentajeBonos = JSON.parse(JSON.stringify(this.data_prev));
              this.Itm_Usuarios = JSON.parse(
                JSON.stringify(this.data_prev.ITEMS)
              );
            }
          }
        });
        break;

      case 'r_vista':
        this.opVista();
        break;

      case 'r_copiar':
        this.mnuAccion = 'new';
        this.readOnlyForm = false;
        this.readOnlyFormEdit = false;
        break;

      case 'r_refrescar':
        this.mnuAccion = 'init';
        this.valoresObjetos('refrescar');
        break;

      case 'r_imprimir':
        break;

      case 'r_configurar':
        if (operMenu.operacion.data_config.text !== undefined && operMenu.operacion.data_config.text !== null) {
          this.accionEspecial = operMenu.operacion.data_config.text;
          this.readOnlyForm = false;
          this.readOnlyFormEdit = false;
          this.prmUsrAplBarReg.accion = 'r_nuevo';
          this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this.opPrepararNuevo();
        }
        break;

      default:
        break;
    }
  }

  ValidaDatos(Accion: string): boolean {
    // Valida datos completados de pestaña <Generales>

    if (Accion === 'requerido') {
      if (
        this.FPorcentajeBonos.ID_SECCION === ''
        || this.FPorcentajeBonos.ANO === 0
        || this.FPorcentajeBonos.MES === 0
        || this.FPorcentajeBonos.PERIODO === 0
        // || this.Itm_Usuarios.length === 0
      ) {
        this.showModal(
          'Hay datos incompletos del Formulario. Revisar contenido de los items marcados!',
          'Faltan datos',
          "<i class='icon-alert-ol'></i>"
        );
        return false;
      }
    }
    return true;
  }


  onInitNewRowPro(e: any) {
    if (this.Itm_Usuarios.length > 0) {
      const item = this.Itm_Usuarios.reduce((ant, act) => {
        return ant.ITEM > act.ITEM ? ant : act;
      });
      e.data.ITEM = item.ITEM + 1;
    } else {
      e.data.ITEM = 1;
    }

    e.data.ID_EMPLEADO = '';
    e.data.PORCENTAJE = '';
    e.data.VALOR = '';
    this.numFila = e.data.ITEM;
    this.filaData = e.data;
  }

  selectionGrid(e: any) {
    if (!this.gridEmpleados.instance.hasEditData() && this.readOnlyForm) {
      this.filasSelecc = e.selectedRowKeys;
      this.numFila = this.Itm_Usuarios.findIndex(
        (d: any) => d.ID_EMPLEADO === e.selectedRowKeys[0]
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

  startEdit(e: any) {
    if (this.mnuAccion !== 'new' && this.mnuAccion !== 'update') {
      this.gridEmpleados.instance.clearSelection();
      if (e.data !== undefined && e.data !== null) {
        this.Itm_Usuarios.forEach((ele: any) => {
          ele.readOnly_UNIDAD_MEDIDA = true;
        });
        const isEditing = this.gridEmpleados.instance.hasEditData();
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
        this.readOnlyForm = true;
        this.readOnlyFormEdit = true;
      }
    }
  }

  opPrepararNuevo(): void {
    this.loadingVisible = true;
    this._sdato.accion = 'r_nuevo';
    this.loadingVisible = false;
    this.readOnlyFormEdit = false;
    this.data_prev = JSON.parse(
      JSON.stringify({
        ...this.FPorcentajeBonos,
        ITEMS: this.Itm_Usuarios,
      })
    );
    this.opBlanquearFormGHU();
  }

  opPrepararModificar() {
    this.loadingVisible = true;
    this.esVisibleSelecc = 'always';
    this.data_prev = JSON.parse(
      JSON.stringify({
        ...this.FPorcentajeBonos,
        ITEMS: this.Itm_Usuarios,
      })
    );
    this.readOnlyFormEdit = false;
    this.loadingVisible = false;
  }

  opPrepararGuardar(accion: string): void {
    if (this.conCambios != 0) {
      if (typeof this.FPorcentajeBonos.MES === 'string') {
        let newDate = this.generalesService.getFechaComponents(this.MES);
        this.FPorcentajeBonos.MES = newDate.mesFromatoNumero;
      }
      const prmDatosGuardar = {
        ENCABEZADO: {
          ANO: this.FPorcentajeBonos.ANO,
          MES: this.FPorcentajeBonos.MES,
          PERIODO: this.FPorcentajeBonos.PERIODO,
          ID_SECCION: this.FPorcentajeBonos.ID_SECCION,
          PORCENTAJE: this.FPorcentajeBonos.PORCENTAJE > 0 ? this.FPorcentajeBonos.PORCENTAJE : 1,
          VALOR: this.FPorcentajeBonos.VALOR > 0 ? this.FPorcentajeBonos.VALOR : 1,
        },
        ITEMS: this.Itm_Usuarios,
      };

      this.loadingVisible = true;
      let aplicacion = this.prmUsrAplBarReg.aplicacion.replace('-', '');
      let url = this.endPoint + '/' + aplicacion + '/consulta';
      // API guardado de datos
      this._sdato
        .consulta(accion, prmDatosGuardar, url)
        .subscribe((resp) => {
          this.loadingVisible = false;
          const res = JSON.parse(resp.data);
          if (res[0].ErrMensaje !== '') {
            this.showModal(res[0].ErrMensaje, '', "<i class='icon-alert-ol'></i>");
            this.esVisibleSelecc = 'always';
          } else {
            this.readOnlyForm = true;
            this.readOnlyFormEdit = true;
            // Operaciones de barra
            if (this.mnuAccion === 'new') {
              this.VDatosReg = [
                { ...this.FPorcentajeBonos, ITEMS: this.Itm_Usuarios },
              ];
              this.QFiltro = "SECCION='" + this.FPorcentajeBonos.ID_SECCION + "'";
              this.prmUsrAplBarReg = {
                ...this.prmUsrAplBarReg,
                error: '',
                accion: 'r_navegar',
                r_numReg: 1,
                r_totReg: 1,
                operacion: {},
              };
              // this.valoresObjetos('get-bonos');
            } else {
              this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1] = JSON.parse(
                JSON.stringify(this.FPorcentajeBonos)
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
            showToast('Registro actualizado', 'success');
            this.mnuAccion = '';
          }
        });
    } else {
      this.esVisibleSelecc = 'always';
    }
  }
  opPrepararGuardarMasivo(): void {
    if (this.conCambios != 0) {
      if (typeof this.FPorcentajeBonos.MES === 'string') {
        let newDate = this.generalesService.getFechaComponents(this.MES);
        this.FPorcentajeBonos.MES = newDate.mesFromatoNumero;
      }
      const prmDatosGuardar = {
        ANO: this.FPorcentajeBonos.ANO,
        MES: this.FPorcentajeBonos.MES,
        PERIODO: this.FPorcentajeBonos.PERIODO,
        PORCENTAJE: 100,
      };

      this.loadingVisible = true;
      let aplicacion = this.prmUsrAplBarReg.aplicacion.replace('-', '');
      let url = this.endPoint + '/' + aplicacion + '/consulta';
      // API guardado de datos
      this._sdato
        .consulta('generacion periodo', prmDatosGuardar, url)
        .subscribe((resp) => {
          this.loadingVisible = false;
          const res = JSON.parse(resp.data);
          if (res[0].ErrMensaje !== '') {
            this.showModal(res[0].ErrMensaje, '', "<i class='icon-alert-ol'></i>");
            this.esVisibleSelecc = 'always';
          } else {
            this.readOnlyForm = true;
            this.readOnlyFormEdit = true;
            // Operaciones de barra
            this.VDatosReg = [
              { ...this.FPorcentajeBonos, ITEMS: this.Itm_Usuarios },
            ];
            this.QFiltro = "SECCION='" + this.FPorcentajeBonos.ID_SECCION + "'";
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: '',
              accion: 'r_navegar',
              r_numReg: 1,
              r_totReg: 1,
              operacion: {},
            };
            // this.valoresObjetos('get-bonos');
            this.accionEspecial = '';
            this.esVisibleSelecc = 'none';
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            showToast('Registro actualizado', 'success');
            this.mnuAccion = '';
          }
        });
    } else {
      this.esVisibleSelecc = 'always';
      this.accionEspecial = '';
    }
  }

  selectYear(event: any): void {
    this.ANO = new Date(event.value)
    const newDate = this.generalesService.getFechaComponents(event.value);
    this.FPorcentajeBonos.ANO = newDate.ano
    this.conCambios++;
  }

  selectMonth(event: any): void {
    this.MES = new Date(event.value)
    const newDate = this.generalesService.getFechaComponents(event.value);
    this.FPorcentajeBonos.MES = newDate.mesFromatoNumero
    this.conCambios++;
  }
  selectPeriod(event: any): void {
    this.FPorcentajeBonos.PERIODO = event.value
    this.conCambios++;
  }
  selectEmpleado(e: any, cellInfo: any) {
    if (e.value !== null && e.value !== undefined && e.value !== '') {
      this.gridEmpleados.instance.cellValue(
        cellInfo.rowIndex,
        'ID_EMPLEADO',
        e.value
      );
      this.conCambios++;
    }
  }

  onValueChangedGridPorcentaje(e: any, cellInfo: any) {
    if (e.value !== null && e.value !== undefined && e.value !== '') {
      this.gridEmpleados.instance.cellValue(
        cellInfo.rowIndex,
        'PORCENTAJE',
        e.value
      );
      this.gridEmpleados.instance.cellValue(
        cellInfo.rowIndex,
        'VALOR',
        0
      );
      this.conCambios++;
      for (let i = 0; i < this.Itm_Usuarios.length; i++) {
        const element = this.Itm_Usuarios[i];
        if (element.ID_EMPLEADO === cellInfo.row.data.ID_EMPLEADO) {
          element.PORCENTAJE = e.value;
        }
      }
      if (this.Itm_Usuarios.length > 0 && this.readOnlyFormEdit === false) {
        this.valoresObjetos('calculo', this.Itm_Usuarios);
      }
    }
  }
  onValueChangedGridValor(e: any, cellInfo: any) {
    if (e.value !== null && e.value !== undefined && e.value !== '') {
      this.gridEmpleados.instance.cellValue(
        cellInfo.rowIndex,
        'VALOR',
        e.value
      );
      this.gridEmpleados.instance.cellValue(
        cellInfo.rowIndex,
        'PORCENTAJE',
        0
      );
      this.conCambios++;
    }
  }

  onSelecction(e: any): void {
    if (e.value != null) {

      this.FPorcentajeBonos.TYPEVALUE = e.value;
      if (e.value === 'Valor') {
        this.FPorcentajeBonos.PORCENTAJE = 0;
      } else {
        this.FPorcentajeBonos.VALOR = 0;
      }
      this.conCambios++;
    }
  }

  adicionarColumnas(novedades: any) {
    // Adiciona columnas de novedades
    if (this.gridEmpleados !== undefined) {
      const colsVisible = this.gridEmpleados.instance.getVisibleColumns();
      const columnas = this.gridEmpleados.instance.option('columns')??[];
      const posCol = this.gridEmpleados.instance.columnOption("TOTAL_BONIF", "visibleIndex");

      for (let i = 0; i < novedades.length; i++) {
        if (colsVisible.findIndex((col: any) => col.dataField === novedades[i].ID_CONCEPTO) == -1) {  
          // this.gridEmpleados.instance.addColumn({
          //   dataField: novedades[i].ID_CONCEPTO,
          //   caption: novedades[i].NOMBRE,
          //   format: { type: 'fixedPoint', precision: 0 },
          //   width: 100,
          //   dataType: 'number',
          //   allowEditing: false,
          //   visibleIndex: posCol
          // });

          columnas.splice(posCol, 0, {
              dataField: novedades[i].ID_CONCEPTO,
              caption: novedades[i].NOMBRE,
              format: { type: 'fixedPoint', precision: 0 },
              width: 100,
              dataType: 'number',
              allowEditing: false,
              visibleIndex: posCol
            });
          this.gridEmpleados.instance.option('columns', columnas);

        }
      }
      
      // Asigna novedades a los empleados
      setTimeout(() => {  
        for (let j = 0; j < this.Itm_Usuarios.length; j++) {
          const emp = this.Itm_Usuarios[j];
          let totNov = 0;
          for (let k = 0; k < emp.NOVEDADES.length; k++) {
            const nov = emp.NOVEDADES[k];
            const rowIndex = this.gridEmpleados.instance.getRowIndexByKey(emp.ID_EMPLEADO); 
            this.gridEmpleados.instance.cellValue(
              rowIndex,
              nov.ID_CONCEPTO,
              nov.VALOR
            );  
            totNov = totNov + nov.VALOR;
            emp[nov.ID_CONCEPTO] = nov.VALOR;
          }
          emp.TOTAL_BONIF = emp.BASE_BON??0 * emp.PORCENTAJE / 100 - totNov;
          emp.TOTAL_DIF_ANT = emp.TOTAL_BONIF??0 - emp.BONO_ANT;
        }
      }, 200);

    }
  }   

  valoresObjetos(obj: string, dataEnv: any = []) {
    if (obj === 'secciones' || obj === 'todos') {
      // Carga las secciones registradas
      let url = this.endPoint + '/getSecciones'
      this._sdato.consulta('qsecciones', { FILTRO: "", APLICACION: this.prmUsrAplBarReg.aplicacion }, url).subscribe(
        (data) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DSeccion = res;
          this.valoresObjetos('empleados');
        });
    };

    if (obj === 'empleados' ) {
      // Carga las secciones registradas
      const prm: any = { ID_SECCION: this.FPorcentajeBonos.ID_SECCION, 
                         FECHA: new Date(), 
                         PERIODO: this.FPorcentajeBonos.PERIODO,
                         ANO: this.FPorcentajeBonos.ANO,
                         MES: this.FPorcentajeBonos.MES,
                         NOVEDADES: 'SI'
                       };
      let aplicacion = this.prmUsrAplBarReg.aplicacion.replace('-', '');
      let url = this.endPoint + '/' + aplicacion + '/consulta';
      this._sdato.consulta('EMPLEADOS', prm, url).subscribe(
        (data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res.length > 0) {

            this.Dusuarios = res[0].EMPLEADOS;
            this.Itm_Usuarios = [];
            for (let i = 0; i < res[0].EMPLEADOS.length; i++) {
              const element = res[0].EMPLEADOS[i];
              element.PORCENTAJE = this.FPorcentajeBonos.PORCENTAJE;
              element.VALOR = this.FPorcentajeBonos.VALOR;
              this.Itm_Usuarios.push(element);
            }

            // Añade Novedades  
            if (res[1].NOVEDADES)
              this.adicionarColumnas(res[1].NOVEDADES);
          }
        });
    };
    if (obj === 'calculo') {
      // Carga las secciones registradas
      const prm: any = dataEnv;
      let aplicacion = this.prmUsrAplBarReg.aplicacion.replace('-', '');
      let url = this.endPoint + '/' + aplicacion + '/consulta';
      this._sdato.consulta('CALCULO BONIFICACION', prm, url).subscribe(
        (data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }

          // Recorre los empleados y actualiza los valores
          for (let i = 0; i < res.length; i++) {
            const empRes = res[i];
            const empLocal = this.Itm_Usuarios.find((r: any) => r.ID_EMPLEADO === empRes.ID_EMPLEADO);
            const rowIndex = this.gridEmpleados.instance.getRowIndexByKey(empRes.ID_EMPLEADO); 
            Object.entries(empRes).forEach(([key, value]) => {
              if (key !== 'ID_EMPLEADO') {
                this.gridEmpleados.instance.cellValue(
                  rowIndex,
                  key,
                  value
                );  
                if (empLocal !== undefined) {
                  empLocal[key] = value;
                }
              }
            });
          }

          // this.Dusuarios = res;
          // this.Itm_Usuarios = res;

          // for (let i = 0; i < this.Itm_Usuarios.length; i++) {
          //   const element = this.Itm_Usuarios[i];
          //   element.BASE_ACT = this.FPorcentajeBonos.PORCENTAJE;
          //   this.Itm_Usuarios.push(element);
          // }
        });
    };

    if (obj === 'consulta adicionales') {
      const prm = {
        ANO: this.FPorcentajeBonos.ANO,
        MES: this.FPorcentajeBonos.MES,
        PERIODO: this.FPorcentajeBonos.PERIODO,
        ID_SECCION: this.FPorcentajeBonos.ID_SECCION
      };
      let aplicacion = this.prmUsrAplBarReg.aplicacion.replace('-', '');
      let url = this.endPoint + '/' + aplicacion + '/consulta';
      this._sdato
        .consulta('consulta adicionales', prm, url)
        .subscribe((data: any) => {

          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          // this.Itm_Usuarios = res[0].ITEMS;
          // console.log(this.Itm_Usuarios);
          this.Itm_Usuarios = [...res[0].ITEMS];
          this.adicionarColumnas(res[0].NOVEDADES);

        })
    }

    if (obj === 'get-bonos') {
      const prm = { BONIFICACIONES_PRO: [] };
      this.loadingVisible = true;
      let aplicacion = this.prmUsrAplBarReg.aplicacion.replace('-', '');
      let url = this.endPoint + '/' + aplicacion + '/consulta';
      this._sdato
        .consulta('consulta', prm, url)
        .subscribe((data: any) => {
          try {
            this.loadingVisible = false;
            const res = JSON.parse(data.data);
            if (data.token != undefined) {
              const refreshToken = data.token;
              localStorage.setItem('token', refreshToken);
            }
            const datares = res;
            if (datares[0].ErrMensaje === '') {
              if (datares ?? '' != '') {
                this.VDatosReg = datares;
                this.data_prev = datares[0];
                this.QFiltro = datares[0].QFILTRO;

                this.prmUsrAplBarReg = {
                  ...this.prmUsrAplBarReg,
                  r_totReg: datares.length,
                  r_numReg: 1,
                  accion: 'r_navegar',
                  operacion: {},
                };
                this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
                this.opIrARegistro('r_primero');
                this.readOnlyForm = true;
                this.readOnlyFormEdit = true;
              }
            } else {
              this.VDatosReg = [];
              showToast(datares[0].ErrMensaje, 'warning');
              this.prmUsrAplBarReg.accion = 'r_cancelar';
              this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            }
          } catch (error) {
            this.loadingVisible = false;
            this.readOnlyForm = true;
            this.readOnlyFormEdit = true;
            this._sfiltro.enConsulta = false;
            this.showModal(error, '', "<i class='icon-alert-ol'></i>");
          }
        });
    }
  }

  onRowClickSeccion(e: any) {
    this.FPorcentajeBonos.ITEM = e.data.ITEM
    this.FPorcentajeBonos.ID_SECCION = e.data.ID_SECCION
    this.openDropFiltro = false;
    this.valoresObjetos('empleados');
    this.conCambios++;
    this.readOnlyFormEdit = false;
  }

  async onValueChangedValue(e: any, type: string) {
    if (type === 'PORCENTAJE') {
      this.FPorcentajeBonos.PORCENTAJE = e.value;
      this.FPorcentajeBonos.VALOR = 0;
      for (let i = 0; i < this.Itm_Usuarios.length; i++) {
        const element = this.Itm_Usuarios[i];
        element.PORCENTAJE = e.value;
      }
      if (this.Itm_Usuarios.length > 0 && this.readOnlyFormEdit === false) {
        this.valoresObjetos('calculo', this.Itm_Usuarios);
      }

      this.conCambios++
    } else if (type === 'VALOR') {
      this.FPorcentajeBonos.VALOR = e.value;
      this.FPorcentajeBonos.PORCENTAJE = 0;
      for (let i = 0; i < this.Itm_Usuarios.length; i++) {
        const element = this.Itm_Usuarios[i];
        element.VALOR = e.value;
      }
      this.conCambios++
    }
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
          this.readOnlyForm = true;
          this.readOnlyFormEdit = true;
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
          this.opBlanquearFormGHU();
        }
        this.readOnlyForm = true;
        this.readOnlyFormEdit = true;
        break;
      case 'Eliminado':
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        this.prmUsrAplBarReg.r_totReg = this.VDatosReg.length;
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length > 0) {
          newArray = JSON.parse(
            JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
          );
        } else {
          this.opBlanquearFormGHU();
          return;
        }
        break;
      default:
        break;
    }

    if (newArray !== undefined && newArray !== null) {
      this.FPorcentajeBonos.ID_SECCION = newArray.ID_SECCION;
      this.FPorcentajeBonos.ANO = newArray.ANO;
      this.FPorcentajeBonos.MES = newArray.MES;
      this.ANO = new Date(newArray.ANO, newArray.MES - 1, 16, 15, 8, 12);
      this.MES = new Date(newArray.ANO, newArray.MES - 1, 16, 15, 8, 12);
      this.FPorcentajeBonos.ITEM = this.DSeccion.filter((data: any) => data.ID_SECCION === newArray.ID_SECCION)[0].ITEM;
      this.FPorcentajeBonos.PERIODO = newArray.PERIODO;
      this.FPorcentajeBonos.PORCENTAJE = newArray.PORCENTAJE;
      this.FPorcentajeBonos.TYPEVALUE = newArray.PORCENTAJE > 0 ? 'Porcentaje' : 'Valor';
      this.FPorcentajeBonos.VALOR = newArray.VALOR;

      this.valoresObjetos('consulta adicionales')
    } else {
      this.opBlanquearFormGHU();
    }

    // Navega  los componentes items
    this._sdato.accion = 'r_numreg';
  }

  opBlanquearFormGHU(): void {
    let fecha = this.generalesService.getFechaComponents(new Date())
    this.FPorcentajeBonos = {
      ITEM: '',
      ANO: fecha.ano,
      MES: fecha.mesFromatoNumero,
      PERIODO: 1,
      ID_SECCION: '',
      TYPEVALUE: 'Porcentaje',
      PORCENTAJE: 1,
      VALOR: 1,
    };
    this.Itm_Usuarios = [];
    this.ANO = new Date();
    this.MES = new Date();
  }

  opEliminar(): void {
    // Confirma...
    Swal.fire({
      title: '',
      text: '',
      html:
        'Desea eliminar el registro <i>' + this.FPorcentajeBonos.ID_SECCION + '</i> ?',
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
      ID_SECCION: this.FPorcentajeBonos.ID_SECCION,
      ANO: this.FPorcentajeBonos.ANO,
      MES: this.FPorcentajeBonos.MES,
      PERIODO: this.FPorcentajeBonos.PERIODO,
    };
    let aplicacion = this.prmUsrAplBarReg.aplicacion.replace('-', '');
    let url = this.endPoint + '/' + aplicacion + '/consulta';
    this._sdato.consulta('delete', prm, url)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        try {
          if (res[0].ErrMensaje !== '') {
            this.showModal(res[0].ErrMensaje, '', "<i class='icon-alert-ol'></i>");
            return;
          }

          // Elimina y posiciona en el Array de Consulta
          this.opIrARegistro('Eliminado');
          this.readOnlyForm = true;
          this.readOnlyFormEdit = true;
          showToast('Registro eliminado', 'success');

          // Operaciones de barra
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: '',
            accion: this.prmUsrAplBarReg.r_totReg !== 0 ? 'r_navegar' : 'r_ini',
            operacion: {},
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } catch (error) {
          this.showModal(error, '', "<i class='icon-alert-ol'></i>");
        }
      });
  }

  showModal(mensaje: any, title: any, icon: string) {
    const tipo = title;
    Swal.fire({
      iconHtml: icon,
      confirmButtonColor: tipo === 'Error' ? 'DF3E3E' : '#0F4C81 !important',
      title: title,
      html: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
      stopKeydownPropagation: false,
    });
  }

  opPrepararBuscar(accion: any): void {
    if (accion === 'filtro') {
      this._sfiltro.PrmFiltro = {
        Titulo: 'Bonificaciones Porcentaje',
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
      const prm = { BONIFICACIONES_PRO: arrFiltro };
      this.loadingVisible = true;
      let aplicacion = this.prmUsrAplBarReg.aplicacion.replace('-', '');
      let url = this.endPoint + '/' + aplicacion + '/consulta';
      this._sdato
        .consulta('consulta', prm, url)
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
                this.readOnlyForm = true;
                this.readOnlyFormEdit = true;
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
            this.readOnlyForm = true;
            this.readOnlyFormEdit = true;
            this._sfiltro.enConsulta = false;
            this.showModal(error, '', "<i class='icon-alert-ol'></i>");
          }
        });
    }

    this.readOnlyForm = true;
    this.readOnlyFormEdit = true;
  }
  //GRID
  onContentReady(e: any) {
    e.component.columnOption('command:edit', 'visible', false);
  }

  onRowValidating(e: any) {
    if (this.mnuAccionGrid === 'new') {
      if (e.newData.ID_EMPLEADO === '' || (e.newData.PORCENTAJE === '' && e.newData.VALOR === '')) {
        showToast('Faltan completar datos de la tabla.', 'warning');
        this.rowApplyChanges = true;
        this.rowNew = false;
        this.esVisibleSelecc = 'none';
        this.rowEdit = false;
        this.validGrid = false;
        return e.isValid = false;
      } else {
        this.rowApplyChanges = false;
        this.rowEdit = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        this.validGrid = true;
        return e.isValid = true;
      }
    }
    if (this.mnuAccionGrid === 'update') {
      for (let prop in e.newData) {
        if (e.newData.hasOwnProperty(prop) && e.oldData.hasOwnProperty(prop)) {
          e.oldData[prop] = e.newData[prop];
        }
      }
      if (e.newData.ID_EMPLEADO === '' || (e.newData.PORCENTAJE === '' && e.newData.VALOR === '')) {
        showToast('Faltan completar datos de la tabla.', 'warrning');
        this.rowApplyChanges = true;
        this.rowNew = true;
        this.esVisibleSelecc = 'none';
        this.validGrid = false;
        return e.isValid = false;
      } else {
        this.rowApplyChanges = false;
        this.rowEdit = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        this.validGrid = true;
        return e.isValid = true;
      }
    }
    return false;
  }

  onEditingStart(e: any) {
    this.numFila = e.data.ITEM;
    this.filaData = e.data;
    this.rowNew = false;
    this.rowApplyChanges = true;
    this.rowDelete = false;
  }

  updatingRow(e: any) {
    this.conCambios++;
    if (e.oldData === undefined)
      return;
    e.oldData.isEdit = true;
  }

  removedRow(e: any) {
  }

  operGrid(e: any, operacion: any) {
    switch (operacion) {
      case 'new':
        this.isEdit = true;
        this.gridEmpleados.instance.addRow();
        this.rowApplyChanges = true;
        this.esVisibleSelecc = 'none';
        this.rowNew = false;
        this.mnuAccionGrid = 'new';
        this.gridEmpleados.instance.clearSelection();
        break;
      case 'edit':
        const index = this.gridEmpleados.instance.getRowIndexByKey(this.filasSelecc[0]);
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this.rowNew = false;
        this.rowDelete = false;
        this.isEdit = true;
        this.gridEmpleados.instance.editRow(index);
        this.mnuAccionGrid = 'update';
        this.esVisibleSelecc = 'always';
        break;
      case 'save':
        this.gridEmpleados.instance.saveEditData();
        if (this.validGrid === true) {
          this.isEdit = false;
          this.rowApplyChanges = false;
          this.rowNew = true;
          this.esVisibleSelecc = 'always';
          this.mnuAccionGrid = '';
        }
        break;
      case 'cancel':
        this.isEdit = false;
        this.gridEmpleados.instance.cancelEditData();
        this.esVisibleSelecc = 'none';
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.mnuAccionGrid = '';
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
              const index = this.Itm_Usuarios.findIndex((a) => a.ITEM === key);
              this.Itm_Usuarios.splice(index, 1);
            });
            this.conCambios++;
            this.gridEmpleados.instance.refresh();
          }
        });
        break;

      default:
        break;
    }
  }

  templateHtml(columna: any, element: any): any {
    let cad = [{ ID_EMPLEADO: '', NOMBRE: '' }];
    let res: any = '';
    this.templateGroup.forEach((col: any) => {
      if (columna.row.data !== null) {
        cad[0].ID_EMPLEADO = columna.row.data.ID_EMPLEADO;
        cad[0].NOMBRE = this.Dusuarios.filter((resp) => resp.ID_EMPLEADO === columna.row.data.ID_EMPLEADO)[0].NOMBRE;
        switch (element) {
          case 'ID_EMPLEADO':
            res = cad[0].ID_EMPLEADO;
            break;
          case 'NOMBRE':
            res = cad[0].NOMBRE;
            break;
          default:
            break;
        }
      }
      if (columna.row.data.collapsedItems !== undefined) {
        cad[0].ID_EMPLEADO = columna.row.data.collapsedItems.ID_EMPLEADO;
        cad[0].NOMBRE = columna.row.data.collapsedItems.NOMBRE;
        switch (element) {
          case 'ID_EMPLEADO':
            res = cad[0].ID_EMPLEADO;
            break;
          case 'NOMBRE':
            res = cad[0].NOMBRE;
            break;
          default:
            break;
        }
      }
    });
    return res;
  }

  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    for (let i = 0; i < this.SVisor.DatosVisor.length; i++) {
      const element = this.SVisor.DatosVisor[i];
      element.ITEM = i + 1
    }
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'Bonificaciones',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: [
        'ANO|AÑO',
        'MES|MES',
        'PERIODO|PERIODO',
        'ID_SECCION|SECCIÓN',
        'PORCENTAJE|PORCENTAJE',
        'VALOR|VALOR',
      ],
      Filtro: '',
      keyGrid: ['ITEM'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }
}
