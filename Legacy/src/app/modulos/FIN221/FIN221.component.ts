import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxFormComponent, DxFormModule, DxNumberBoxModule, DxSelectBoxModule, DxTextBoxModule, DxValidatorModule } from 'devextreme-angular';
import { Subject, takeUntil } from 'rxjs';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import Swal from 'sweetalert2';
import { showToast } from '../../shared/toast/toastComponent';
import { PRO033Service } from 'src/app/services/PRO033/PRO033.service';
import { FiltrobusqComponent } from 'src/app/shared/filtrobusq/filtrobusq.component';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';

@Component({
  selector: 'app-FIN221',
  templateUrl: './FIN221.component.html',
  styleUrls: ['./FIN221.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxButtonModule, DxFormModule, DxNumberBoxModule, DxSelectBoxModule, DxTextBoxModule, DxDateBoxModule, FiltrobusqComponent, VistarapidaComponent, GeninformesComponent]
})
export class FIN221Component {
  @ViewChild("formPlanesFin", { static: false }) formPlanesFin: DxFormComponent;
  @ViewChild('gridPlanesFin', { static: false })
  gridPlanesFin: DxDataGridComponent;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();
  eventsSubjectFiltro: Subject<any> = new Subject<any>();

  mnuAccion: string = '';
  esVisibleSelecc: string = 'none';
  conCambios: number = 0;

  subscription: any;
  subs_filtro: any;
  subs_visor: any;
  prmUsrAplBarReg: any = { aplicacion: '' };
  VDatosReg: any[] = [];
  DLNDias: any[] = [];
  QFiltro: any;

  USUARIO_LOCAL: any = '';
  FPlanes: any = {};
  FPlanes_prev: any = null;
  CUOTA_INICIAL: boolean = false;
  TASA_FINAN: boolean = false;
  Itm_PlanesFin: any[] = [];
  DLTasas: any[] = [];
  DCondiciones: any[] = [];
  readOnly: boolean = true;
  loadingVisible: boolean = false;
  dropDownOptions = { width: 400, height: 400, hideOnParentScroll: true, container: '#router-container'};

  type = 'info'
  toaVisible: boolean;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';
  positionOf: string;

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

  customFormatFactor = {
    type: 'fixedPoint',
    precision: 8
  };
  customFormatPorcentaje = {
    type: 'fixedPoint',
    precision: 2
  };
  customFormatNormal = {
    type: 'fixedPoint',
    precision: 0
  };

  constructor(
    private sData: PRO033Service,
    private _sbarreg: SbarraService,
    private tabService: TabService,
    private _sfiltro: SfiltroService,
    private datepipe: DatePipe,
    private SVisor: SvisorService
  ) {

    this.subscription = this._sbarreg
      .getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((datreg) => {
        if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(datreg);
      });

    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe(resp => {
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opPrepararBuscar(resp);
    });

    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex((d: any) => d.ITEM === resp.ITEM);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    });

    this.ValideExistenciaPlan = this.ValideExistenciaPlan.bind(this);
  }

  // Validación de existencia del ID_PLAN en tiempo real
  ValideExistenciaPlan = async (e: any) => {
    if (this.readOnly || !this.mnuAccion.match('new|update')) {
      return true;
    }

    // Si está en modo update y el código no ha cambiado, no validar
    if (
      this.mnuAccion === 'update' &&
      this.FPlanes_prev &&
      this.FPlanes_prev.ID_PLAN === e.value
    ) {
      return true;
    }

    // Verificar que VDatosReg esté inicializado y sea un array
    if (
      !this.VDatosReg ||
      !Array.isArray(this.VDatosReg) ||
      this.VDatosReg.length === 0
    ) {
      return true;
    }

    // Validar si el código ya existe en los datos locales
    const existePlan = this.VDatosReg.findIndex(
      (item: any) => item.ID_PLAN === e.value
    );

    if (existePlan !== -1) {
      // Mostrar alerta con SweetAlert2
      Swal.fire({
        title: 'Plan ya existe',
        text: `El plan con código "${e.value}" ya está registrado en el sistema. No se puede usar este código.`,
        iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
        confirmButtonColor: '#0F4C81',
        confirmButtonText: 'Entendido',
        allowOutsideClick: false,
      });

      // Enfocar el campo ID_PLAN
      setTimeout(() => {
        var fNextEditor: any =
          this.formPlanesFin.instance.getEditor('ID_PLAN');
        if (fNextEditor) {
          fNextEditor.focus();
        }
      }, 100);

      return false;
    }

    return true;
  };

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'PLANES',
      aplicacion: 'FIN-221',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_modificar: true }
    };
    this.readOnly = true;
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.valoresObjetos('todos');
  }
  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
    if (this.subs_filtro) this.subs_filtro.unsubscribe();
    if (this.subs_visor) this.subs_visor.unsubscribe();
  }

  // Unificada: Llama a Acciones de registro
  opMenuRegistro(operMenu: any): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.prmUsrAplBarReg = {
          tabla: "PLANES",
          aplicacion: "FIN-221",
          usuario: this.USUARIO_LOCAL,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_refrescar: false }
        };
        break;
      case "r_nuevo":
        this.opPrepararNuevo();
        break;
      case "r_modificar":
        this.opPrepararModificar();
        break;
      case "r_guardar":
        this.opPrepararGuardar();
        break;
      case "r_buscar":
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          this.toaMessage = 'Consulta en proceso, por favor espere.';
          this.toaVisible = true;
          this.toaTipo = 'warning';
        }
        break;
      case "r_buscar_ejec":
        this.opBlanquearForma();
        if (operMenu.operacion.filtro_arg) {
          this.opPrepararBuscar(operMenu.operacion.filtro_arg)
        }
        else {
          if (this._sfiltro.enConsulta === false) {
            this.opPrepararBuscar('');
          } else {
            showToast('Consulta en proceso, por favor espere.', 'warning');
          }
        }
        break;
      case "r_eliminar":
        this.opEliminar();
        break;
      case "r_primero":
      case "r_anterior":
      case "r_siguiente":
      case "r_ultimo":
      case "r_numreg":
        this.opIrARegistro(operMenu.accion);
        this.esVisibleSelecc = 'none';
        break;
      case "r_cancelar":
        var mensaje = '¿Desea cancelar la operación?';
        if (this.conCambios != 0) mensaje = '¿Desea cancelar sin guardar cambios?';
        Swal.fire({
          title: '',
          text: mensaje,
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} }
            // Restituye los valores
            this.mnuAccion = "";
            this.esVisibleSelecc = 'none';
            this.readOnly = true;
            this.conCambios = 0;

            this.prmUsrAplBarReg.accion = this.VDatosReg.length > 0 ? 'r_navegar' : 'r_cancelar';
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.mnuAccion = "";
            if (this.VDatosReg.length > 0) {
              this.opIrARegistro('r_primero');
            } else {
              this.opIrARegistro('r_numreg');
              this.opBlanquearForma();
            }
          }
        });

        break;
      case "r_copiar":
        // Implementar lógica de copiar si es necesario
        break;
      case "r_vista":
        this.opVista();
        break;
      case 'r_refrescar':
        // Implementar lógica de refrescar si es necesario
        break;
      case "r_imprimir":
        this.imprimirReporte(operMenu);
        break;
      default:
        break;
    }
  }


  opPrepararBuscar(accion): void {
    if (accion === "filtro") {

      // this._sfiltro.PrmFiltro = {
      //   Titulo: "Datos de filtro para Acreedores",
      //   accion: "PREPARAR FILTRO",
      //   Filtro: "",
      //   TablaBase: this.prmUsrAplBarReg.tabla,
      //   aplicacion: this.prmUsrAplBarReg.aplicacion
      // };
      // this._sfiltro.getObsFiltro.emit(true);

      const prmFiltro = {
        Titulo: "Datos de filtro para Planes Produccion",
        accion: "activar",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
        objRegistro: this._sbarreg,
        objTab: this.tabService,
        usuario: this.prmUsrAplBarReg.usuario,
        title: 'Planes de Financiación',
      };
      this.eventsSubjectFiltro.next(prmFiltro);

    }
    else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { PLANES: arrFiltro };

      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this.sData
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje === '') {
            // Asocia datos
            if (datares ?? '' != '') {
              this.VDatosReg = datares;
              this.FPlanes = datares[0];
              this.QFiltro = datares[0].QFILTRO;
            }

          } else {
            this.VDatosReg = [];
            this.loadingVisible = false;
            //notificació
            showToast(datares[0].ErrMensaje, 'warning');
            //this.opBlanquearForma();
          }
          // Prepara la barra para navegación
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            r_totReg: datares.length,
            r_numReg: 1,
            accion: 'r_navegar',
            operacion: {}
          }
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

          // Trae los items en los componentes asociados
          this.opIrARegistro('r_primero');
          this.loadingVisible = false;
          this._sfiltro.enConsulta = false;
        });
    }
  }
  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        this.prmUsrAplBarReg.r_numReg = 1;
        if (this.VDatosReg.length != 0) {
          this.FPlanes = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.FPlanes = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.FPlanes = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.FPlanes = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
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
        }
        else {
          this.opBlanquearForma();
          setTimeout(() => {
            this.formPlanesFin.instance.resetValues();
          }, 100);
        }
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          this.FPlanes =
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        }
        this.prmUsrAplBarReg.r_totReg = this.VDatosReg.length;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      default:
        break;
    }

    try {
      // this.FPlanes.FECHA_INICIO = this.datepipe.transform(this.FPlanes.FECHA_INICIO, 'dd/MM/yyyy');
      // this.FPlanes.FECHA_FINAL = this.datepipe.transform(this.FPlanes.FECHA_FINAL, 'dd/MM/yyyy');
      // filepath: c:\Users\admin_artdecon\xtein-web-2.0\src\app\modulos\PRO033\PRO033.component.ts
      // ...existing code...
      this.Itm_PlanesFin = this.FPlanes.ITM_PLANES ?? [];
      if (this.Itm_PlanesFin.length > 0) {

        for (let i = 0; i < this.Itm_PlanesFin.length; i++) {
          const element = this.Itm_PlanesFin[i];
          element.CUOTA_INICIAL === true ? element.CUOTA_INICIAL = 'Si' : element.CUOTA_INICIAL = 'No';
          element.DIFERIR_CI === true ? element.DIFERIR_CI = 'Si' : element.DIFERIR_CI = 'No';
          element.DESCONTAR_CI === true ? element.DESCONTAR_CI = 'Si' : element.DESCONTAR_CI = 'No';
        }
        // ...existing code...
      }
      this.readOnly = true;
    } catch (error) {
      this.showModal(error);
    }
  }
  opPrepararNuevo(): void {
    this.mnuAccion = "new";
    this.readOnly = false;
    this.opBlanquearForma();
    this.FPlanes.ESTADO = 'ACTIVO';
    // Inicializar registro previo como null en modo nuevo
    this.FPlanes_prev = null;
  }

  opPrepararModificar(): void {
    // Lógica para preparar modificación
    this.mnuAccion = "update";
    this.readOnly = false;
    this.esVisibleSelecc = 'always';
    // Guardar copia del registro original para validaciones posteriores
    this.FPlanes_prev = { ...this.FPlanes };
  }

  opBlanquearForma(): void {
    this.FPlanes = {
      ID_PLAN: '',
      DESCRIPCION: '',
      TIPO_FRECUENCIA: '',
      FRECUENCIA: 0,
      FINANCIAR_GRAV: 0,
      DIAS_PRIMERA_CUOTA: 0,
      NUMERO_PAGOS: 0,
    };
    this.Itm_PlanesFin = [];
  }

  ValidaDatos(Accion: string): boolean {
    var msg = '';
    if (Accion === 'requerido') {
      if (this.FPlanes.ID_PLAN == null || this.FPlanes.ID_PLAN === '')
        msg += 'Id Plan, ';
      // if (this.FPlanes.DESCRIPCION === null || this.FPlanes.DESCRIPCION === '')
      //   msg += 'Descripción, ';
      // if (this.FPlanes.TIPO_FRECUENCIA === null || this.FPlanes.TIPO_FRECUENCIA === '')
      //   msg += 'Frecuencia, ';
      // if (this.FPlanes.ESTADO === null || this.FPlanes.ESTADO === '')
      //   msg += 'Estado, ';
      // if (this.FPlanes.FINANCIAR_GRAV === null || this.FPlanes.FINANCIAR_GRAV === '')
      //   msg += 'Financiar Grav, ';
      // if (this.FPlanes.NUMERO_PAGOS === null || this.FPlanes.NUMERO_PAGOS === 0)
      //   msg += 'Número de Pagos, ';

      if (msg !== '') {
        this.showModal(
          'Hay datos incompletos en el Plan Financiero: ' + msg,
          'Faltan datos'
        );
        return false;
      }
    }
    return true;
  }

  opPrepararGuardar(): void {
    // Acción validación de datos
    if (!this.ValidaDatos('requerido')) {
      return;
    }

    // Validación de duplicación de ID_PLAN
    const existePlan = this.VDatosReg.findIndex(
      (item) => item.ID_PLAN === this.FPlanes.ID_PLAN
    );

    // En modo nuevo (new), no debe existir ningún registro con ese código
    if (this.mnuAccion === 'new' && existePlan !== -1) {
      this.showModal(
        `El plan con código "${this.FPlanes.ID_PLAN}" ya existe. Por favor ingrese un código diferente.`,
        'Plan duplicado'
      );
      return;
    }

    // En modo edición (update), puede existir pero debe ser el mismo registro que estamos editando
    if (this.mnuAccion === 'update' && existePlan !== -1) {
      const registroOriginal = this.FPlanes_prev;
      if (
        registroOriginal &&
        this.FPlanes.ID_PLAN !== registroOriginal.ID_PLAN
      ) {
        this.showModal(
          `El plan con código "${this.FPlanes.ID_PLAN}" ya existe. No puede cambiar a un código que ya está en uso.`,
          'Plan duplicado'
        );
        return;
      }
    }

    // Validación de items del grid
    if (this.Itm_PlanesFin.length === 0) {
      this.showModal(
        'Debe agregar al menos un ítem al plan de financiamiento.',
        'Faltan datos'
      );
      return;
    }

    if (this.conCambios > 0) {
      this.loadingVisible = true;
      this.readOnly = true;
      this.conCambios = 0;
      for (let i = 0; i < this.Itm_PlanesFin.length; i++) {
        const element = this.Itm_PlanesFin[i];
        element.CUOTA_INICIAL === 'Si' ? element.CUOTA_INICIAL = true : element.CUOTA_INICIAL = false;
        element.DIFERIR_CI === 'Si' ? element.DIFERIR_CI = true : element.DIFERIR_CI = false;
        element.DESCONTAR_CI === 'Si' ? element.DESCONTAR_CI = true : element.DESCONTAR_CI = false;
      }
      const prmDatos: any = {
        PLANES: this.FPlanes,
        ITM_PLANES: this.Itm_PlanesFin
      };
      this.sData.save(this.mnuAccion, prmDatos, this.prmUsrAplBarReg.aplicacion).subscribe((resp) => {
        this.loadingVisible = false;
        const res = JSON.parse(resp.data);
        if ((resp.token != undefined)) {
          const refreshToken = resp.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== "") {
          this.showModal(res[0].ErrMensaje, 'Error');
        } else {
          // Operaciones de barra
          if (this.mnuAccion === 'new') {
            this.QFiltro = "CONSECUTIVO='" + this.FPlanes.CONSECUTIVO + "'";
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              r_numReg: 1,
              r_totReg: 1,
              operacion: {}
            };
          } else {
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              operacion: {}
            };
          }
          this.readOnly = true;
          showToast('Registro actualizado', 'success');
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }
      });



    } else {
      showToast('No hay cambios por guardar', 'error');
    }
  }


  opEliminar(): void {
    Swal.fire({
      title: '',
      text: '',
      html:
        'Desea eliminar el PLAN <i>' +
        this.FPlanes.ID_PLAN +
        '</i> ?',
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
    const prm = { ID_PLAN: this.FPlanes.ID_PLAN };
    this.sData
      .delete('delete', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'error');
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        showToast('Plan eliminada!', 'success');
        this.readOnly = true;

        // Operaciones de barra
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          error: '',
          accion: 'r_navegar',
          operacion: { r_copiar: false },
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.opIrARegistro("Eliminado");
      });
  }



  opVista(): void {
    // Lógica para vista/zoom de datos
    this.prmUsrAplBarReg.error = '';
    this.prmUsrAplBarReg.accion = 'pos_Visor';
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.ColSort = { Columna: '', Clase: '' };
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'Planes de Financiación',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: [
        'ID_PLAN|Codigo',
        'ESTADO|Estado',
        'TIPO_FRECUENCIA|Tipo',
        'DESCRIPCION|Descripción',
        'NUMERO_PAGOS|Nª Cuotas',
      ],
      Filtro: '',
      keyGrid: ['ID_PLAN'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  onValueChanged($event: any, campo: string) {
    if (this.readOnly && !this.mnuAccion.match('new|update')) return;

    const camposDirectos = [
      'ID_PLAN', 'ESTADO', 'DESCRIPCION', 'FRECUENCIA',
      'DIAS_PRIMERA_CUOTA', 'FINANCIAR_GRAV'
    ];

    if (camposDirectos.includes(campo) && $event.value != null) {
      this.FPlanes[campo] = $event.value;
      this.conCambios++;
      return;
    }

    if (campo === 'TIPO_FRECUENCIA' && $event.value != null && this.readOnly === false) {
      const setTipoFrecuencia = () => {
        this.FPlanes.TIPO_FRECUENCIA = $event.value;
        this.Itm_PlanesFin = [];
        this.conCambios++;
      };
      if (this.Itm_PlanesFin.length > 0) {
        Swal.fire({
          title: '',
          text: 'Esta acción borrara datos ¿Desea continuar?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, eliminar',
        }).then((result) => {
          if (result.isConfirmed) setTipoFrecuencia();
        });
      } else {
        setTipoFrecuencia();
      }
      return;
    }

    if (campo === 'NUMERO_PAGOS' && $event.value != null && this.readOnly === false) {
      if (this.FPlanes.TIPO_FRECUENCIA === 'Variable') {

        const initItems = () => {
          this.Itm_PlanesFin = [];
          this.DLNDias = [];
          for (let i = 0; i < $event.value; i++) {
            this.Itm_PlanesFin.push({ ITEM: i + 1, PAGO: i + 1, DIAS: 30, PORC_GRAV: 0, PORC_PAGO: 0 });
            this.DLNDias.push(i + 1);
          }
          this.FPlanes.NUMERO_PAGOS = $event.value;
          this.esVisibleSelecc = 'always';
          this.conCambios++;
        };
        if (this.Itm_PlanesFin.length > 0) {
          Swal.fire({
            title: '',
            text: '¿Desea inicializar los items y perder lo configurado?\n Elija "SI" para inicializar o "NO" para conservar lo actual',
            iconHtml: "<i class='icon-alert-ol'></i>",
            showCancelButton: true,
            confirmButtonColor: '#DF3E3E',
            cancelButtonColor: '#438ef1',
            cancelButtonText: 'No',
            confirmButtonText: 'Sí, eliminar',
          }).then((result) => {
            if (result.isConfirmed) initItems();
          });
        } else {
          initItems();
        }
        return;
      } else {
        this.DLNDias = [];
        for (let i = 0; i < $event.value; i++) {
          this.DLNDias.push(i + 1);
        }
      }
    }
  }

  valoresObjetos(obj: string) {
    if (obj === 'tasas' || obj === 'todos') {
      const prm = {};
      this.sData.consulta('lista tasas', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== '') {
            this.showModal(res[0].ErrMensaje, '');
          } else {
            this.DLTasas = res;
            this.conCambios++;
          }
        });
    };

    if (obj === 'condiciones' || obj === 'todos') {
      const prm = {};
      this.sData.consulta('condiciones', prm, 'FIN-230').subscribe({
        next: (data) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DCondiciones = res;
        },
          error: (error) => {
            console.error('Error al cargar condiciones:', error);
          }
      });
    }

  }

  async getFactor(idTasa: any, pago: any): Promise<number> {
    const prm = { "ID_TASA": idTasa, "PAGO": pago };
    return new Promise<number>((resolve) => {
      this.sData.consulta('factor', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            localStorage.setItem("token", data.token);
          }
          if (res[0].FACTOR === '' || res[0].FACTOR === null || res[0].FACTOR === undefined) {
            this.showModal('No hay factores', '');
            resolve(0);
          } else {
            resolve(res[0].FACTOR);
          }
        }, () => resolve(0));
    });

  }



  onRespuestaFiltro(e: any) {
  }


  // Imprimir reporte de aplicación
  imprimirReporte(operMenu: any) {
    var prmRep = {
      ...operMenu.operacion,
      accion: 'previsualizar',
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      usuario: this.prmUsrAplBarReg.usuario,
      QFiltro: (operMenu.operacion.registro === 'todos') ? this.QFiltro : " PLANES.ID_PLAN = "+this.FPlanes.ID_PLAN + " ",
    };
    if (operMenu.operacion.modo === 'previsualizar')
      this.eventsSubjectInformes.next(prmRep);
    if (operMenu.operacion.modo === 'pdf') {
      prmRep = { ...prmRep, accion: 'pdf' };
      this.eventsSubjectInformes.next(prmRep);
    }
    if (operMenu.operacion.modo === 'email') {
      let template = '';
      let asunto = '';
      let email_sale = '';
      let nom_usr = '';
      var prmRep = {
        ...operMenu.operacion,
        accion: 'email',
        asunto,
        email_sale,
        especUsuarioEmail: nom_usr,
        // nombre: this.FCapacidad.ITEM,
        email: '',
        template,
        replacements: '',
        // dataSource: this.FCapacidad
      };
      this.eventsSubjectInformes.next(prmRep);
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
      position: "center",
      html: msg_html,
      stopKeydownPropagation: false,
    });
  }


  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        this.isEdit = true;
        this.gridPlanesFin.instance.addRow();
        this.rowApplyChanges = true;
        this.esVisibleSelecc = 'none';
        this.rowNew = false;

        break;
      case 'edit':
        const index = this.gridPlanesFin.instance.getRowIndexByKey(this.filasSelecc[0]);

        this.gridPlanesFin.instance.editRow(index);
        this.esVisibleSelecc = 'none';
        this.isEdit = true;
        this.rowApplyChanges = true;
        this.mnuAccion = 'update';
        this.rowEdit = false;

        break;
      case 'save':
        this.isEdit = false;
        this.gridPlanesFin.instance.saveEditData();
        this.esVisibleSelecc = 'always';
        this.rowApplyChanges = false;
        this.rowNew = true;

        break;
      case 'cancel':
        this.isEdit = false;
        this.gridPlanesFin.instance.cancelEditData();
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
              const index = this.Itm_PlanesFin.findIndex((a) => a.ITEM === key);
              this.Itm_PlanesFin.splice(index, 1);
            });
            this.conCambios++;
            this.gridPlanesFin.instance.refresh();
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
    if (this.Itm_PlanesFin.length > 0) {
      const item = this.Itm_PlanesFin.reduce((ant, act) => {
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

    e.data.ID_PLAN = this.FPlanes.ID_PLAN;
    this.numFila = e.data.ITEM;
    this.filaData = e.data;
  }

  selectionGrid(e: any) {
    if (!this.isEdit) {
      this.filasSelecc = e.selectedRowKeys;
      this.numFila = this.Itm_PlanesFin.findIndex(
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
      this.gridPlanesFin.instance.clearSelection();
      if (e.data !== undefined && e.data !== null) {
        if (this.esEdicion) {
          this.Itm_PlanesFin.forEach((ele: any) => {
            ele.readOnly_UNIDAD_MEDIDA = true;
          });
          const isEditing = this.gridPlanesFin.instance.hasEditData();
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

  async onValueChangedGridLista(e: any, cellInfo: any, campo: string) {
    if (e.value !== null && e.value !== undefined && e.value !== '') {
      switch (campo) {
        case 'ID_TASA':
          this.TASA_FINAN = (e.value === 'Manual');
          this.gridPlanesFin.instance.cellValue(cellInfo.rowIndex, 'ID_TASA', e.value);
          const tasa = this.DLTasas.find((ele: any) => ele.ID_TASA === e.value);
          if (tasa) {
            this.gridPlanesFin.instance.cellValue(cellInfo.rowIndex, 'PORC_TASA', tasa.PORCENTAJE);
          }
          break;

        case 'PAGO':
          this.gridPlanesFin.instance.cellValue(cellInfo.rowIndex, 'PAGO', e.value);
          if (cellInfo.data.PAGO !== '') {
            const factor = await this.getFactor(cellInfo.data.ID_TASA, e.value);
            this.gridPlanesFin.instance.cellValue(cellInfo.rowIndex, 'FACTOR', factor);
          }
          break;

        case 'DIAS':
        case 'PORC_GRAV':
        case 'PORC_PAGO':
        case 'PORC_TASA':
        case 'DESCUENTO_PPP':
          this.gridPlanesFin.instance.cellValue(cellInfo.rowIndex, campo, e.value);
          break;

        case 'FACTOR':
          if (cellInfo.data.ID_TASA === 'Manual') {
            this.gridPlanesFin.instance.cellValue(cellInfo.rowIndex, 'FACTOR', e.value);
          }
          break;

        case 'CUOTA_INICIAL':
          this.CUOTA_INICIAL = (e.value === 'Si');
          this.gridPlanesFin.instance.cellValue(cellInfo.rowIndex, 'CUOTA_INICIAL', e.value);
          break;
      }
      const camposAdicionales = [
        'TIPO_CI', 'MINIMO_CI', 'DIAS_PLAZO_CI', 'DIFERIR_CI', 'DESCONTAR_CI'
      ];
      if (camposAdicionales.includes(campo) && e.value != null) {
        this.gridPlanesFin.instance.cellValue(cellInfo.rowIndex, campo, e.value);
      }
      this.conCambios++;
    }

    // Campos adicionales fuera del primer if
  }

  // Seleccion de la condicion del plan
  onCondicSelecc(event: any, cellInfo: any): void {
    cellInfo.setValue(event.selectedItem.ID_CONDICION); // Asignar el ID de la condición al campo correspondiente
  }

}
