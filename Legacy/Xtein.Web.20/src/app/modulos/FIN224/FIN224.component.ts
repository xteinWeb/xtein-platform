import { Component, ViewChild } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import {
  DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxLoadPanelModule,
  DxSelectBoxModule,
  DxTabsModule,
  DxTagBoxModule,
  DxTextBoxModule,
  DxTreeListModule,
  DxValidatorModule
} from 'devextreme-angular';
import { clsCondicionesNego } from './clsFIN224.class';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { Subject, Subscription, lastValueFrom } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import Swal from 'sweetalert2';
import { showToast } from '../../shared/toast/toastComponent.js';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { FiltrobusqComponent } from 'src/app/shared/filtrobusq/filtrobusq.component';
import { VEN209Service } from 'src/app/services/VEN209/s_VEN209.service';
import { CommonModule } from '@angular/common';
import { FIN224Service } from 'src/app/services/FIN224/s_FIN224.service';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';

@Component({
  selector: 'app-FIN224',
  templateUrl: './FIN224.component.html',
  styleUrls: ['./FIN224.component.css'],
  standalone: true,
  imports: [
    MatTabsModule,
    DxLoadPanelModule,
    DxFormModule,
    DxSelectBoxModule,
    DxDropDownBoxModule,
    DxDataGridModule,
    DxTreeListModule,
    DxButtonModule,
    DxTextBoxModule,
    DxTagBoxModule,
    DxValidatorModule,
    DxTabsModule,
    FiltrobusqComponent,
    CommonModule,
    VistarapidaComponent,
    GeninformesComponent
],
})
export class FIN224Component {
  @ViewChild('formCondiciones', { static: false })
  formCondiciones: DxFormComponent;
  @ViewChild('gridcondiciones', { static: false })
  gridcondiciones: DxDataGridComponent;

  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  colCountByScreen: object;

  prmUsrAplBarReg: clsBarraRegistro;
  conCambios: number = 0;
  mnuAccion: string;
  VDatosReg: any[] = [];

  Itm_Condiciones: any[] = [];
  DLPrecios: any[] = [];
  DLPreciosFiltrados: any[] = [];  // Listas filtradas por tipo y estado activo
  DLPlanes: any[] = [];

  FCondiciones: clsCondicionesNego;
  FCondiciones_prev: clsCondicionesNego | null;
  filaData: any = [];
  numFila: number = 0;
  isEdit: boolean = false;
  readOnly: boolean = false;
  readOnlyForm: boolean = false;

  esEdicion: boolean = false;
  esCreacion: boolean = false;

  QFiltro: any;
  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esNuevaFila: boolean = false;
  esVisibleSelecc: string = 'none';
  ltool: any;

  // notificaciones
  type = 'info';
  toaVisible: boolean;
  toaMessage: string = 'Registro actualizado!';
  toaTipo: string = 'success';
  loadingVisible: boolean = false;
  positionOf: string;

  callbacks = [];

  eventsSubjectFiltro: Subject<any> = new Subject<any>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();

  constructor(
    private _sdatos: FIN224Service,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private SVisor: SvisorService,
    private tabService: TabService
  ) {
    // Servicio de barra de registro
    this.subscription = this._sbarreg.getObsRegApl().subscribe((datreg) => {
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

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe((resp) => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion)
        return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex((d) => d.CODIGO === resp.CODIGO);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    });

    this.colCountByScreen = {
      xs: 1,
      sm: 2,
      md: 2,
      lg: 2,
    };

    this.ValideExistenciaCondicion = this.ValideExistenciaCondicion.bind(this);
  }

  ngOnInit(): void {
    const user: any = localStorage.getItem('usuario')?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'CONDICIONES_NEGOCIACION',
      aplicacion: 'FIN-224',
      usuario: user,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_copiar: false },
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';
    this._sdatos.accion = 'r_ini';
    this.FCondiciones = new clsCondicionesNego();

    // Inicializa datos
    this.valoresObjetos('todos');
  }

  ngAfterViewInit(): void {
    this.activarEdicion('ini');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  // Recibe los datos del selectbox idlegal
  onSeleccTipo(e: any) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;

    const tipoAnterior = this.FCondiciones.TIPO;
    this.FCondiciones.TIPO = e.value;

    // Filtrar listas según el tipo seleccionado
    this.filtrarListasPorTipo(e.value);

    // Si hay un cambio de tipo y hay listas seleccionadas, validar compatibilidad
    if (tipoAnterior && tipoAnterior !== e.value && this.Itm_Condiciones.length > 0) {
      this.validarListasExistentes();
    }
  }
  onSeleccPLAN_FINANCIERO(e: any) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;
    this.FCondiciones.ID_PLAN = e.value;
  }
  // onSeleccDESCUENTOS(e: any) {
  //   // Solo se procesa si es en modo edición
  //   if (this.readOnly) return;
  //   this.FCondiciones.DESCUENTOS = e.value;
  // }
  onRespuestaFiltro(e: any) {}

  onKeyDownPerfil(e: any) {
    e.event.preventDefault();
    return false;
  }

  onSeleccEstado(e: any): void {
    this.FCondiciones.ESTADO = e.value;
  }

  // Filtra las listas de precios según el tipo seleccionado (VENTAS o PROVEEDOR)
  filtrarListasPorTipo(tipo: string) {
    if (!tipo || tipo === '') {
      this.DLPreciosFiltrados = [];
      return;
    }

    // Filtrar listas por TIPO y ESTADO ACTIVO
    this.DLPreciosFiltrados = this.DLPrecios.filter(
      (lista) => lista.TIPO === tipo && lista.ESTADO === 'ACTIVO'
    );
  }

  // Valida y pregunta al usuario si desea eliminar listas incompatibles con el nuevo tipo
  validarListasExistentes() {
    if (this.Itm_Condiciones.length === 0 || !this.FCondiciones.TIPO) {
      return;
    }

    // Buscar listas incompatibles con el tipo seleccionado
    const listasIncompatibles = this.Itm_Condiciones.filter(
      (item) => item.TIPO !== this.FCondiciones.TIPO
    );

    if (listasIncompatibles.length > 0) {
      // Preguntar al usuario si desea eliminar las listas incompatibles
      Swal.fire({
        title: 'Cambio de tipo detectado',
        html: `Hay <b>${listasIncompatibles.length}</b> lista(s) de precios que no corresponden al tipo <b>${this.FCondiciones.TIPO}</b> seleccionado.<br><br>¿Desea eliminarlas automáticamente?`,
        iconHtml: "<i class='icon-alert-ol'></i>",
        showCancelButton: true,
        confirmButtonColor: '#0F4C81',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'No, mantener',
      }).then((result) => {
        if (result.isConfirmed) {
          // Eliminar listas incompatibles
          this.Itm_Condiciones = this.Itm_Condiciones.filter(
            (item) => item.TIPO === this.FCondiciones.TIPO
          );
          this.conCambios++;
          this.gridcondiciones.instance.refresh();
          showToast(`${listasIncompatibles.length} lista(s) eliminada(s)`, 'success');
        } else {
          showToast('Las listas incompatibles se mantuvieron. Puede eliminarlas manualmente.', 'info');
        }
      });
    }
  }

  // Validación de existencia del ID_CONDICION en tiempo real
  ValideExistenciaCondicion = async (e: any) => {
    if (this.readOnlyForm || !this.mnuAccion.match('new|update')) {
      return true;
    }

    // Si está en modo update y el código no ha cambiado, no validar
    if (
      this.mnuAccion === 'update' &&
      this.FCondiciones_prev &&
      this.FCondiciones_prev.ID_CONDICION === e.value
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
    const existeCodigo = this.VDatosReg.findIndex(
      (item: any) => item.ID_CONDICION === e.value
    );

    if (existeCodigo !== -1) {
      // Mostrar alerta con SweetAlert2
      Swal.fire({
        title: 'Código ya existe',
        text: `La condición con código "${e.value}" ya está registrada en el sistema. No se puede usar este código.`,
        iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
        confirmButtonColor: '#0F4C81',
        confirmButtonText: 'Entendido',
        allowOutsideClick: false,
      });

      // Enfocar el campo ID_CONDICION
      setTimeout(() => {
        var fNextEditor: any =
          this.formCondiciones.instance.getEditor('ID_CONDICION');
        if (fNextEditor) {
          fNextEditor.focus();
        }
      }, 100);

      return false;
    }

    return true;
  };

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes

    switch (operMenu.accion) {
      case 'r_ini':
        const user: any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'CONDICIONES_NEGOCIACION',
          aplicacion: 'FIN-224',
          usuario: user,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_copiar: false },
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_nuevo':
        this.mnuAccion = 'new';
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case 'r_buscar':
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          this.toaMessage = 'Consulta en proceso, por favor espere.';
          this.toaVisible = true;
          this.toaTipo = 'warning';
        }
        break;

      case 'r_buscar_ejec':
        this.opBlanquearForma();
        if (operMenu.operacion.filtro_arg) {
          this.opPrepararBuscar(operMenu.operacion.filtro_arg);
        } else {
          if (this._sfiltro.enConsulta === false) {
            this.opPrepararBuscar('');
          } else {
            showToast('Consulta en proceso, por favor espere.', 'warning');
          }
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
          mensaje = '¿Desea cancelar sin guardar cambios?';
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
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              operacion: { r_copiar: false },
            };

            // Si es modo creación (new), blanquear todo
            if (this.mnuAccion === 'new') {
              this.opBlanquearForma();
              this.Itm_Condiciones = [];
              this.readOnly = true;
              this.esVisibleSelecc = 'none';
              this.prmUsrAplBarReg.accion =
                this.VDatosReg.length > 0 ? 'r_navegar' : 'r_cancelar';
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
              this.mnuAccion = '';

              if (this.VDatosReg.length > 0) {
                this.opIrARegistro('r_primero');
              }
            }
            // Si es modo edición (update), restaurar valores originales
            else if (this.mnuAccion === 'update') {
              if (this.FCondiciones_prev) {
                this.FCondiciones = JSON.parse(
                  JSON.stringify(this.FCondiciones_prev)
                );
                this.Itm_Condiciones = this.FCondiciones.ITM_CONDICIONES
                  ? JSON.parse(
                      JSON.stringify(this.FCondiciones.ITM_CONDICIONES)
                    )
                  : [];
              }
              this.readOnly = true;
              this.esVisibleSelecc = 'none';

              // Restaurar filtro de listas según el tipo restaurado
              if (this.FCondiciones.TIPO) {
                this.filtrarListasPorTipo(this.FCondiciones.TIPO);
              }

              this.prmUsrAplBarReg.accion = 'r_navegar';
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
              this.mnuAccion = '';
            }
            // Otros casos (navegación sin cambios)
            else {
              this.readOnly = true;
              this.esVisibleSelecc = 'none';
              this.prmUsrAplBarReg.accion =
                this.VDatosReg.length > 0 ? 'r_navegar' : 'r_cancelar';
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
              this.mnuAccion = '';
              if (this.VDatosReg.length > 0) {
                this.opIrARegistro('r_primero');
              } else {
                this.opBlanquearForma();
                this.Itm_Condiciones = [];
              }
            }
          }
        });
        break;

      case 'r_vista':
        this.opVista();
        break;

      case 'r_imprimir':
        this.imprimirReporte(operMenu);
        break;

      default:
        break;
    }
  }

  opPrepararNuevo(): void {
    // Activa componentes
    this.opBlanquearForma();
    this.FCondiciones.ESTADO = 'ACTIVO';
    // Inicializar registro previo como null en modo nuevo
    this.FCondiciones_prev = null;
    // this.FCondiciones.FECHA_REGISTRO = new Date();
    this.activarEdicion('llave');
    this.esVisibleSelecc = 'none';
  }

  async opPrepararModificar() {
    this.readOnly = false;

    // Guardar copia del registro original para validaciones posteriores
    this.FCondiciones_prev = { ...this.FCondiciones };

    // Habilitar checkboxes en la grid para selección de filas
    this.esVisibleSelecc = 'onClick';

    // Filtrar listas según el tipo de la condición actual
    if (this.FCondiciones.TIPO) {
      this.filtrarListasPorTipo(this.FCondiciones.TIPO);
    }

    // Valida la existencia
    this.activarEdicion('activo');
    // const prm = { CODIGO: this.FCondiciones.ID_CONDICION, accion: 'integridad referencial' };
    // const apiRest = this._sdatos.validar('EXISTE CLIENTE', prm, this.prmUsrAplBarReg.aplicacion);
    // let res = await lastValueFrom(apiRest, { defaultValue: true });
    // res = JSON.parse(res.data);
    // if (res[0].ErrMensaje !== '') {
    //   showToast(res[0].ErrMensaje, 'error');
    //   this.readOnly = true;
    // }
  }

  ValidaDatos(Accion: string): boolean {
    var msg = '';
    if (Accion === 'requerido') {
      if (this.FCondiciones.ID_CONDICION == null) msg += 'Código,';
      if (
        this.FCondiciones.DESCRIPCION === null ||
        this.FCondiciones.DESCRIPCION === ''
      )
        msg += 'Descripción,';
      // if (this.FCondiciones.DESCUENTOS === '') msg += 'Descuentos ,';
      if (this.FCondiciones.ID_PLAN === '') msg += 'Plan financiero ,';
      if (this.FCondiciones.TIPO === '') msg += 'TIpo ,';
      if (this.FCondiciones.ESTADO === '') msg += 'Estado ,';
      if (msg !== '') {
        this.showModal(
          'Hay datos incompletos en los datos del cliente: ' + msg,
          'Faltan datos',
          ''
        );
        return false;
      }
    }
    return true;
  }

  async opPrepararGuardar(accion: string): Promise<void> {
    // Acción validación de datos
    if (!this.ValidaDatos('requerido')) {
      return;
    }

    // Validación de duplicación de ID_CONDICION
    const existeCodigo = this.VDatosReg.findIndex(
      (item) => item.ID_CONDICION === this.FCondiciones.ID_CONDICION
    );

    // En modo nuevo (new), no debe existir ningún registro con ese código
    if (accion === 'new' && existeCodigo !== -1) {
      this.showModal(
        `El código "${this.FCondiciones.ID_CONDICION}" ya existe. Por favor ingrese un código diferente.`,
        'Código duplicado',
        ''
      );
      return;
    }

    // En modo edición (update), puede existir pero debe ser el mismo registro que estamos editando
    if (accion === 'update' && existeCodigo !== -1) {
      const registroOriginal = this.FCondiciones_prev;
      if (
        registroOriginal &&
        this.FCondiciones.ID_CONDICION !== registroOriginal.ID_CONDICION
      ) {
        this.showModal(
          `El código "${this.FCondiciones.ID_CONDICION}" ya existe. No puede cambiar a un código que ya está en uso.`,
          'Código duplicado',
          ''
        );
        return;
      }
    }

    // Validación de items del grid
    if (this.Itm_Condiciones.length === 0) {
      this.showModal(
        'Debe agregar al menos una lista de precios a la condición de negociación.',
        'Faltan datos',
        ''
      );
      return;
    }

    // Validar que no hay listas de precios duplicadas
    const idsListas = this.Itm_Condiciones.map((item) => item.ID_LISTA);
    const idsUnicos = new Set(idsListas);
    if (idsUnicos.size !== idsListas.length) {
      this.showModal(
        'Hay listas de precios duplicadas. Por favor elimine las duplicadas.',
        'Listas duplicadas',
        ''
      );
      return;
    }

    // Validar que todos los items tienen ID_LISTA seleccionado
    const itemsSinLista = this.Itm_Condiciones.filter(
      (item) => !item.ID_LISTA || item.ID_LISTA === ''
    );
    if (itemsSinLista.length > 0) {
      this.showModal(
        'Todos los items deben tener una lista de precios seleccionada.',
        'Datos incompletos',
        ''
      );
      return;
    }

    // Validar productos duplicados entre listas
    if (this.Itm_Condiciones.length > 1) {
      const productosValidos = await this.validarProductosDuplicados();
      if (!productosValidos) {
        return;
      }
    }

    // Construcción del array de items
    let ITEMS: any[] = [];
    for (let i = 0; i < this.Itm_Condiciones.length; i++) {
      const element = this.Itm_Condiciones[i];
      ITEMS.push({
        ID_CONDICION: this.FCondiciones.ID_CONDICION,
        ID_LISTA: element.ID_LISTA,
        DESCRIPCION: element.DESCRIPCION,
      });
    }
    const prmDatosGuardar = {
      CONDICIONES: {
        ID_CONDICION: this.FCondiciones.ID_CONDICION,
        DESCRIPCION: this.FCondiciones.DESCRIPCION,
        TIPO: this.FCondiciones.TIPO,
        ID_PLAN: this.FCondiciones.ID_PLAN,
        ESTADO: this.FCondiciones.ESTADO,
      },
      ITM_CONDICIONES: ITEMS,
    };

    // API guardado de datos
    var exito = false;
    this.loadingVisible = true;
    this._sdatos
      .save(accion, prmDatosGuardar, this.prmUsrAplBarReg.aplicacion)
      .subscribe((resp) => {
        this.loadingVisible = false;
        const res = JSON.parse(resp.data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'error');
        } else {
          this.readOnly = true;
          this.esEdicion = false;
          this.esCreacion = false;
          this.esVisibleSelecc = 'none';

          // Actualizar VDatosReg después del guardado exitoso
          if (this.mnuAccion === 'update') {
            const npos = this.VDatosReg.findIndex(
              (item: any) =>
                item.ID_CONDICION === this.FCondiciones.ID_CONDICION
            );
            if (npos !== -1) {
              this.VDatosReg[npos] = { ...this.FCondiciones };
              this.VDatosReg[npos].ITM_CONDICIONES = [...this.Itm_Condiciones];
            }
          }

          // Operaciones de barra
          if (this.mnuAccion === 'new') {
            this.QFiltro =
              " CONDICIONEs.CODIGO = '" + this.FCondiciones.ID_CONDICION + "'";
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: '',
              accion: 'r_navegar',
              r_numReg: 1,
              r_totReg: 1,
              operacion: { r_copiar: false },
            };
          } else {
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: '',
              accion: 'r_navegar',
              operacion: { r_copiar: false },
            };
            const npos: any = this.VDatosReg.findIndex(
              (item: any) =>
                item.ID_CONDICION === this.FCondiciones.ID_CONDICION
            );
            this.VDatosReg[npos] = this.FCondiciones;
            this.prmUsrAplBarReg.r_numReg =
              this.VDatosReg.findIndex(
                (item: any) =>
                  item.ID_CONDICION === this.FCondiciones.ID_CONDICION
              ) + 1;
            this.prmUsrAplBarReg.r_totReg = this.VDatosReg.length;
          }
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          showToast('Registro actualizado', 'success');
        }
      });
  }

  opPrepararBuscar(accion): void {
    if (accion === 'filtro') {
      const prmFiltro = {
        Titulo: 'Datos de filtro para Condiciones de negociación',
        accion: 'activar',
        Filtro: '',
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
        objRegistro: this._sbarreg,
        objTab: this.tabService,
        usuario: this.prmUsrAplBarReg.usuario,
        title: 'Condiciones de Negociación',
      };
      this.eventsSubjectFiltro.next(prmFiltro);
    } else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { CONDICIONES_NEGOCIACION: arrFiltro };

      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this._sdatos
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje === '') {
            // Asocia datos
            if (datares ?? '' != '') {
              this.VDatosReg = datares;
              this.FCondiciones = datares[0];
              this.QFiltro = datares[0].QFILTRO;
            }

            // Prepara la barra para navegación
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              r_totReg: datares.length,
              r_numReg: 1,
              accion: 'r_navegar',
              operacion: { r_copiar: false },
            };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

            // Trae los items en los componentes asociados
            this.opIrARegistro('r_primero');
            this.loadingVisible = false;
            this._sfiltro.enConsulta = false;
          } else {
            this.VDatosReg = [];
            this.loadingVisible = false;
            //notificació
            showToast(datares[0].ErrMensaje, 'warning');
            //this.opBlanquearForma();
          }
        });
    }
  }

  opEliminar(): void {
    Swal.fire({
      title: '',
      text: '',
      html:
        'Desea eliminar la condicion <i>' +
        this.FCondiciones.ID_CONDICION +
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
    const prm = { ID_CONDICION: this.FCondiciones.ID_CONDICION };
    this._sdatos
      .delete('delete', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'error');
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        showToast('Condición eliminada!', 'success');
        this.readOnly = true;

        // Operaciones de barra
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          error: '',
          accion: 'r_navegar',
          operacion: { r_copiar: false },
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.opIrARegistro('Eliminado');
      });
  }

  // Navegación de registro
  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = 'r_numreg';
    switch (accion) {
      case 'r_primero':
        this.prmUsrAplBarReg.r_numReg = 1;
        if (this.VDatosReg.length != 0) {
          this.FCondiciones = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }
        break;

      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1
            ? 1
            : this.prmUsrAplBarReg.r_numReg - 1;
        this.FCondiciones = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.FCondiciones = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        break;

      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.FCondiciones = JSON.parse(
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
        } else {
          this.opBlanquearForma();
          setTimeout(() => {
            this.formCondiciones.instance.resetValues();
          }, 100);
        }
        break;

      case 'Eliminado':
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          this.FCondiciones = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        }
        this.prmUsrAplBarReg.r_totReg = this.VDatosReg.length;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

        break;

      default:
        break;
    }

    // activa/inactiva propiedades
    try {
      this._sdatos.accion = 'r_numreg';
      this.readOnly = true;
      this.readOnlyForm = true;
      this.readOnly = true;
      this.esVisibleSelecc = 'none';
      this.Itm_Condiciones = this.FCondiciones.ITM_CONDICIONES.map((cond) =>
        this.DLPrecios.find((item) => item.ID_LISTA == cond.ID_LISTA)
      ).filter((item) => item !== undefined);

      // Filtrar listas según el tipo actual de la condición
      if (this.FCondiciones.TIPO) {
        this.filtrarListasPorTipo(this.FCondiciones.TIPO);
      }
    } catch (error) {
      this.showModal(error);
    }
  }

  opBlanquearForma(): void {
    this.FCondiciones = {
      ID_CONDICION: '',
      DESCRIPCION: '',
      TIPO: '',
      ID_PLAN: '',
      ESTADO: '',
      ITM_CONDICIONES: [],
    };

    this.Itm_Condiciones = [];
    this.FCondiciones_prev = null;
    this.conCambios = 0;
  }

  opVista(): void {
    /*this.prmUsrAplBarReg.error = '';
    this.prmUsrAplBarReg.accion = 'pos_Visor';
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      Titulo: 'Productos',
      Columnas: [
        { Nombre: 'PRODUCTO', Titulo: 'Producto' },
        { Nombre: 'NOMBRE', Titulo: 'Descripción' },
        { Nombre: 'ESTADO', Titulo: 'Estado' },
        { Nombre: 'ID_GRUPO', Titulo: 'Grupo' },
        { Nombre: 'INVENTARIO', Titulo: 'Inventario' },
      ],
      PrmApl: this.prmUsrAplBarReg,
    };
    this.SVisor.setObsVisor.emit();*/

    this.prmUsrAplBarReg.error = '';
    this.prmUsrAplBarReg.accion = 'pos_Visor';
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.ColSort = { Columna: '', Clase: '' };
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'FINANCIACIÓN - Condiciones de negociación',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: [
        'TIPO|Tipo',
        'ID_CONDICION|Codigo',
        'DESCRIPCION|Descripción',
        'ESTADO|Estado',
        'ID_PLAN|Plan financiero',
      ],
      Filtro: '',
      keyGrid: ['ID_CONDICION'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  // async ValideExistencia(e: any) {
  //   if (this.readOnlyForm || !this.mnuAccion.match('new|update')) {
  //     return (true);
  //   }
  //   if (this.mnuAccion === 'update' && this.FCondiciones_prev.CODIGO === e.value) {
  //     return (true);
  //   }

  //   // Valida la existencia
  //   const prm = { CODIGO: e.value, accion: this.mnuAccion };
  //   const apiRest = this._sdatos.validar('EXISTE CLIENTE', prm, this.prmUsrAplBarReg.aplicacion);
  //   let res = await lastValueFrom(apiRest, { defaultValue: true });
  //   res = JSON.parse(res.data);
  //   if (res[0].ErrMensaje === '') {
  //     this.activarEdicion('activo');
  //     return (true);
  //   }
  //   else {
  //     showToast(res[0].ErrMensaje, 'error');
  //     var fNextEditor: any = this.formCondiciones.instance.getEditor('CODIGO');
  //     fNextEditor.focus();
  //     this.activarEdicion('inactivo');
  //     return (false);
  //   }

  // }

  // Valide Id Legal
  ValideIdLegal(e: any) {
    if (this.readOnlyForm || !this.mnuAccion.match('new|update')) {
      return true;
    }

    // Valida la existencia
    if (isNaN(e.value)) {
      return false;
    } else {
      return true;
    }
  }

  // Activa campos de la forma para edición
  // dependiendo de la acción a realizar
  activarEdicion(accion) {
    switch (accion) {
      case 'llave':
        this.readOnly = true;
        this.readOnlyForm = false;
        this.readOnly = false;
        break;
      case 'activo':
        this.readOnly = false;
        this.readOnlyForm = false;
        this.readOnly = false;
        break;
      case 'consulta':
      case 'ini':
        this.readOnly = true;
        this.readOnlyForm = true;
        this.readOnly = true;
        break;

      default:
        break;
    }
  }

  onKeyDownGrupo(e) {
    e.component.open();
  }

  onKeyDownContactos(e) {
    e.component.open();
  }

  valoresObjetos(obj: string, opcion: any = undefined) {
    if (obj == 'listas precios' || obj == 'todos') {
      let prm = { ESTADO: 'ACTIVO' };
      this._sdatos
        .consultaLPrecios('LISTAS PRECIOS', prm)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          console.log('listas precios ', res);
          this.DLPrecios = res;
        });
    }

    if (obj == 'planes' || obj == 'todos') {
      let prm = { PLANES: {} };
      this._sdatos
        .consultaPFinanciacion('PLANES', prm)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          this.DLPlanes = res;
        });
    }
  }

  // Imprimir reporte de aplicación
  // imprimirReporte(id_reporte, archivo, datosrpt) {
  // let filtroRep = { FILTRO: '' };
  // const prmLiq = {
  //   clid: localStorage.getItem('empresa'),
  //   usuario: localStorage.getItem('usuario'),
  //   idrpt: archivo,
  //   id_reporte,
  //   aplicacion: this.prmUsrAplBarReg.aplicacion,
  //   tabla: this.prmUsrAplBarReg.tabla,
  //   filtro: filtroRep,
  // };

  // Si no existe, no está abierta entonces agrega Tab
  // const listaTab = this.tabService.tabs.find(
  //   (c) => c.aplicacion === id_reporte
  // );
  // if (listaTab === undefined)
  //   GlobalVariables.listaAplicaciones.unshift({
  //     aplicacion: id_reporte,
  //     barra: undefined,
  //     statusEdicion: '',
  //   });

  // Abre pestaña con nuevo reporte
  // this.tabService.addTab(
  //   new Tab(
  //     VisorrepComponent, // visor
  //     datosrpt.text, // título
  //     { parent: 'PrincipalComponent', args: prmLiq }, // parámetro: reporte,filtro
  //     id_reporte, // código del reporte
  //     '',
  //     'reporte',
  //     true
  //   )
  // );
  // }

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
          : " CONDICIONES_NEGOCIACION.ID_CONDICION = '" +
            this.FCondiciones.ID_CONDICION +
            "'",
    };
    if (operMenu.operacion.modo === 'previsualizar')
      this.eventsSubjectInformes.next(prmRep);

    if (operMenu.operacion.modo === 'pdf') {
      prmRep = { ...prmRep, accion: 'pdf' };
      this.eventsSubjectInformes.next(prmRep);
    }
  }

  showModal(mensaje, titulo = '', html = '') {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
      title: '¡Error!',
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
      html,
      stopKeydownPropagation: false,
    });
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
        let existe = this.Itm_Condiciones.filter(
          (item) => item.ID_LISTA === e.newData.ID_LISTA
        );
        if (existe.length > 0) {
          showToast('La lista ya fue seleccionada en otra fila.', 'error');
          e.isValid = false;
          this.rowApplyChanges = false;
          this.esVisibleSelecc = 'none';
          return;
        } else {
          e.isValid = true;
          this.rowApplyChanges = false;
          this.rowEdit = false;
          this.rowNew = true;
          this.esVisibleSelecc = 'onClick';
        }
        // for (let i = 0; i < this.Itm_Condiciones.length; i++) {
        //   const element = this.Itm_Condiciones[i];
        //   if(element.ID_LISTA === e.newData.ID_LISTA){
        //     showToast('La lista ya fue seleccionada en otra fila.', 'error');
        //     e.isValid = false;
        //     this.rowApplyChanges = true;
        //     this.rowNew = true;
        //     this.esVisibleSelecc = 'none';
        //     return;
        //   }
        // }
      }
    }
    if (this.mnuAccion === 'update') {
      // if (e.newData.ID_LISTA === '' || e.newData.ID_LISTA === undefined || e.oldData.ID_LISTA === null) return;
      let existe = this.Itm_Condiciones.filter(
        (item) => item.ID_LISTA === e.newData.ID_LISTA
      );
      if (existe.length > 0) {
        showToast('La lista ya fue seleccionada en otra fila.', 'error');
        e.isValid = false;
        this.rowApplyChanges = true;
        this.esVisibleSelecc = 'none';
        return;
      } else {
        for (let prop in e.newData) {
          if (
            e.newData.hasOwnProperty(prop) &&
            e.oldData.hasOwnProperty(prop)
          ) {
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
          let existe = this.Itm_Condiciones.filter(
            (item) => item.ID_LISTA === e.newData.ID_LISTA
          );
          if (existe.length > 0) {
            showToast('La lista ya fue seleccionada en otra fila.', 'error');
            e.isValid = false;
            this.rowApplyChanges = true;
            this.esVisibleSelecc = 'none';
            return;
          } else {
          }
          e.isValid = true;
          this.rowApplyChanges = false;
          this.rowEdit = false;
          this.rowNew = true;
          this.esVisibleSelecc = 'onClick';
          // for (let i = 0; i < this.Itm_Condiciones.length; i++) {
          //   const element = this.Itm_Condiciones[i];
          //   if(element.ID_LISTA === e.newData.ID_LISTA){
          //     showToast('La lista ya fue seleccionada en otra fila.', 'error');
          //     e.isValid = false;
          //     this.rowApplyChanges = true;
          //     this.rowNew = true;
          //     this.esVisibleSelecc = 'none';
          //     return;
          //   }
          // }
        }
      }
    }
  }
  onInitNewRowPro(e: any) {
    if (this.Itm_Condiciones.length > 0) {
      const item = this.Itm_Condiciones.reduce((ant, act) => {
        return ant.ITEM > act.ITEM ? ant : act;
      });
      e.data.ITEM = item.ITEM + 1;
    } else {
      e.data.ITEM = 1;
    }

    e.data.ID_CONDICION = this.FCondiciones.ID_CONDICION;
    e.data.ID_LISTA = '';
    e.data.DESCRIPCION = '';
    this.numFila = e.data.ITEM;
    this.filaData = e.data;
  }

  selectionGrid(e: any) {
    if (!this.isEdit) {
      this.filasSelecc = e.selectedRowKeys;
      this.numFila = this.Itm_Condiciones.findIndex(
        (d: any) => d.ID_LISTA === e.selectedRowKeys[0]
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
      this.gridcondiciones.instance.clearSelection();
      if (e.data !== undefined && e.data !== null) {
        if (this.esEdicion) {
          this.Itm_Condiciones.forEach((ele: any) => {
            ele.readOnly_UNIDAD_MEDIDA = true;
          });
          const isEditing = this.gridcondiciones.instance.hasEditData();
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
          this.readOnlyForm = true;
        }
      }
    }
  }
  onCellPrepared(e) {
    if (e.rowType === 'data') {
      e.cellElement.style.wordWrap = 'break-word';
    }
  }

  onValueChangedGridLista(e: any, cellInfo: any) {
    if (e.value !== null && e.value !== undefined && e.value !== '') {
      this.gridcondiciones.instance.cellValue(
        cellInfo.rowIndex,
        'ID_LISTA',
        e.value
      );
      this.DLPrecios.filter((ele: any) => {
        if (ele.ID_LISTA === e.value) {
          this.gridcondiciones.instance.cellValue(
            cellInfo.rowIndex,
            'DESCRIPCION',
            ele.DESCRIPCION
          );
        }
      });
      this.conCambios++;
    }
  }

  // onValueChangedGridOpciones(e: any, cellInfo: any) {
  //   if (e.value !== null && e.value !== undefined && e.value !== '') {
  //     this.gridcondiciones.instance.cellValue(
  //       cellInfo.rowIndex,
  //       'OPCIONES',
  //       e.value
  //     );
  //     this.conCambios++;
  //   }
  // }

  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        // Validar que se haya seleccionado el tipo antes de agregar listas
        if (!this.FCondiciones.TIPO || this.FCondiciones.TIPO === '') {
          showToast('Debe seleccionar el TIPO (Ventas o Proveedor) antes de agregar listas de precios', 'warning');
          return;
        }

        // Validar que haya listas disponibles para el tipo seleccionado
        if (this.DLPreciosFiltrados.length === 0) {
          showToast(`No hay listas de precios activas para el tipo ${this.FCondiciones.TIPO}`, 'warning');
          return;
        }

        this.isEdit = true;
        this.gridcondiciones.instance.addRow();
        this.rowApplyChanges = true;
        this.esVisibleSelecc = 'none';
        this.rowNew = false;

        break;
      case 'edit':
        const index = this.gridcondiciones.instance.getRowIndexByKey(
          this.filasSelecc[0]
        );

        this.gridcondiciones.instance.editRow(index);
        this.esVisibleSelecc = 'none';
        this.isEdit = true;
        this.rowApplyChanges = true;
        this.mnuAccion = 'update';
        this.rowEdit = false;

        break;
      case 'save':
        this.isEdit = false;
        this.gridcondiciones.instance.saveEditData();
        this.esVisibleSelecc = 'onClick';
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.conCambios++;
        break;
      case 'cancel':
        this.isEdit = false;
        this.gridcondiciones.instance.cancelEditData();
        this.esVisibleSelecc = 'onClick';
        this.rowApplyChanges = false;
        this.rowNew = true;
        break;
      case 'delete':
        // Elimina filas seleccionadas
        this.isEdit = false;
        this.esVisibleSelecc = 'onClick';
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
              const index = this.Itm_Condiciones.findIndex(
                (a) => a.ID_LISTA === key
              );
              if (index !== -1) {
                this.Itm_Condiciones.splice(index, 1);
              }
            });
            this.conCambios++;
            this.gridcondiciones.instance.refresh();
            this.filasSelecc = [];
            this.rowDelete = false;
            this.rowEdit = false;
            showToast('Items eliminados correctamente', 'success');
          }
        });
        break;

      default:
        break;
    }
  }

  // ============================================
  // MÉTODO TEMPORAL DE PRUEBA - COMENTADO
  // Para reactivar, descomentar este método
  // ============================================
  /*
  async probarConsultaProductosLista() {
    console.log('=== INICIANDO PRUEBA DE CONSULTA ===');

    // Obtener las listas seleccionadas actualmente
    const listasSeleccionadas = this.Itm_Condiciones.map(item => item.ID_LISTA);
    console.log('Listas seleccionadas:', listasSeleccionadas);

    if (listasSeleccionadas.length === 0) {
      console.log('⚠️ No hay listas seleccionadas en el grid');
      return;
    }

    // Probar con la primera lista
    const idListaPrueba = listasSeleccionadas[0];
    console.log(`\n🔍 Consultando productos de la lista: ${idListaPrueba}`);

    try {
      // Usando consultaLPrecios que ya existe
      const prm = { ID_LISTA: idListaPrueba };
      const data: any = await lastValueFrom(
        this._sdatos.consultaLPrecios('consulta items lista', prm)
      );

      const res = JSON.parse(data.data);

      console.log('\n✅ RESPUESTA EXITOSA:');
      console.log('Número de items:', res.length);
      console.log('\n📦 Estructura del primer item:');
      if (res.length > 0) {
        console.log(res[0]);
        console.log('\n📋 Campos disponibles:', Object.keys(res[0]));
      }

      console.log('\n📄 Todos los items:');
      console.table(res);

      // Extraer solo los IDs de productos para ver la estructura
      if (res.length > 0 && res[0].ID_PRODUCTO) {
        const idsProductos = res.map((item: any) => item.ID_PRODUCTO);
        console.log('\n🏷️ IDs de Productos:', idsProductos);
      }

      console.log('\n=== FIN DE LA PRUEBA ===');

      // Mostrar también en la UI
      Swal.fire({
        title: 'Consulta Exitosa',
        html: `
          <div style="text-align: left;">
            <p><strong>Lista:</strong> ${idListaPrueba}</p>
            <p><strong>Productos encontrados:</strong> ${res.length}</p>
            <p><strong>Ver detalles en la consola</strong></p>
          </div>
        `,
        icon: 'success'
      });

    } catch (error) {
      console.error('❌ ERROR en la consulta:', error);
      Swal.fire({
        title: 'Error',
        text: 'Ocurrió un error al consultar los productos. Ver consola para más detalles.',
        icon: 'error'
      });
    }
  }
  */
  // ============================================

  async obtenerProductosPorListas(
    idsListas: string[]
  ): Promise<Map<string, any[]>> {
    const mapaProductos = new Map<string, any[]>();

    for (const idLista of idsListas) {
      const prm = { ID_LISTA: idLista };

      try {
        const data: any = await lastValueFrom(
          this._sdatos.consultaLPrecios('consulta items lista', prm)
        );
        const res = JSON.parse(data.data);
        const productosValidos = res.filter(
          (item: any) => !item.ErrMensaje || item.ErrMensaje === ''
        );
        mapaProductos.set(idLista, productosValidos);
      } catch (error) {
        mapaProductos.set(idLista, []);
      }
    }

    return mapaProductos;
  }

  async validarProductosDuplicados(): Promise<boolean> {
    const idsListas = this.Itm_Condiciones.map((item) => item.ID_LISTA).filter(
      (id) => id && id !== ''
    );

    if (idsListas.length <= 1) {
      return true;
    }

    this.loadingVisible = true;

    try {
      const mapaProductos = await this.obtenerProductosPorListas(idsListas);

      const productosGlobal = new Map<string, string[]>();

      mapaProductos.forEach((productos, idLista) => {
        productos.forEach((item: any) => {
          const claveProducto =
            item.ATRIBUTO && item.ATRIBUTO !== ''
              ? `${item.PRODUCTO}-${item.ATRIBUTO}`
              : item.PRODUCTO;

          if (!productosGlobal.has(claveProducto)) {
            productosGlobal.set(claveProducto, []);
          }
          productosGlobal.get(claveProducto)!.push(idLista);
        });
      });

      const conflictos: Array<{
        producto: string;
        nombre: string;
        listas: string[];
      }> = [];

      productosGlobal.forEach((listas, claveProducto) => {
        if (listas.length > 1) {
          let nombreProducto = '';
          for (const [idLista, productos] of mapaProductos.entries()) {
            const prod = productos.find((p: any) => {
              const clave =
                p.ATRIBUTO && p.ATRIBUTO !== ''
                  ? `${p.PRODUCTO}-${p.ATRIBUTO}`
                  : p.PRODUCTO;
              return clave === claveProducto;
            });
            if (prod) {
              nombreProducto = prod.NOMBRE || prod.PRODUCTO;
              break;
            }
          }

          conflictos.push({
            producto: claveProducto,
            nombre: nombreProducto,
            listas: [...new Set(listas)],
          });
        }
      });

      this.loadingVisible = false;

      if (conflictos.length > 0) {
        const mensaje = this.construirMensajeConflictos(conflictos);
        this.showModal(mensaje, 'Productos duplicados en listas', '');
        return false;
      }

      return true;
    } catch (error) {
      this.loadingVisible = false;
      this.showModal(
        'Ocurrió un error al validar los productos de las listas. Por favor intente nuevamente.',
        'Error de validación',
        ''
      );
      return false;
    }
  }

  construirMensajeConflictos(
    conflictos: Array<{ producto: string; nombre: string; listas: string[] }>
  ): string {
    let mensaje = '⚠️ CONFLICTO DE PRODUCTOS EN LISTAS DE PRECIOS\n\n';
    mensaje +=
      'Las siguientes listas tienen productos en común y no pueden usarse juntas en la misma condición de negociación:\n\n';

    const paresConflicto = new Map<string, string[]>();

    conflictos.forEach((conflicto) => {
      const listasOrdenadas = conflicto.listas.sort();
      const clavePar = listasOrdenadas.join(' - ');

      if (!paresConflicto.has(clavePar)) {
        paresConflicto.set(clavePar, []);
      }
      paresConflicto.get(clavePar)!.push(conflicto.nombre);
    });

    paresConflicto.forEach((productos, parListas) => {
      const listas = parListas.split(' - ');
      const listasDesc = listas.map((id) => {
        const lista = this.DLPrecios.find((l) => l.ID_LISTA === id);
        return lista ? `"${id} - ${lista.DESCRIPCION}"` : `"${id}"`;
      });

      mensaje += `📋 ${listasDesc.join(' y ')}\n`;
      mensaje += `   Productos compartidos (${productos.length}): ${productos
        .slice(0, 5)
        .join(', ')}`;
      if (productos.length > 5) {
        mensaje += ` ... y ${productos.length - 5} más`;
      }
      mensaje += '\n\n';
    });

    mensaje +=
      '💡 Solución: Elimine una de las listas en conflicto antes de guardar.';

    return mensaje;
  }
}
