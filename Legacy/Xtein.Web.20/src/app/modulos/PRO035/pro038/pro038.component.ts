import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, ElementRef } from '@angular/core';
import { Subject, Subscription, forkJoin, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { showToast } from '../../../shared/toast/toastComponent';
import { validatorRes } from 'src/app/shared/validator/validator';
import Swal from 'sweetalert2';
import { PRO035Service } from 'src/app/services/PRO035/PRO035.service';
import { CAL001Service } from '../../CAL001/Service/CAL001.service';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxListModule, DxNumberBoxModule, DxPopupModule, DxRadioGroupModule, DxSelectBoxModule, DxToolbarModule, DxTreeListModule, DxTreeListComponent, DxTagBoxModule, DxDropDownButtonModule, DxLoadPanelModule, DxTextAreaModule, DxScrollViewModule } from 'devextreme-angular';

@Component({
  selector: 'app-pro038',
  templateUrl: './pro038.component.html',
  styleUrls: ['./pro038.component.css'],
  standalone: true,
  imports: [CommonModule, DxSelectBoxModule, DxDataGridModule, DxListModule, DxToolbarModule, DxRadioGroupModule, DxDateBoxModule,
    DxNumberBoxModule, DxDropDownBoxModule, DxButtonModule, DxPopupModule, DxTagBoxModule, DxTreeListModule, DxDropDownButtonModule, DxLoadPanelModule, DxTextAreaModule, DxScrollViewModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PRO038Component {

  @ViewChild('gridTracking', { static: false }) gridTracking: DxTreeListComponent;

  // Estados de edición de grilla (estilo PRO034)
  rowEdit: boolean = false;
  rowApplyChanges: boolean = false;

  unSubscribe: Subject<boolean> = new Subject<boolean>();
  subscription!: Subscription;
  readOnly: boolean = true;

  USUARIO_LOCAL: any = '';
  loadingVisible: boolean = false;
  prmUsrAplBarReg: clsBarraRegistro;

  // Variables Globales MDP
  globalWorkers: number = 0;
  globalExitTime: any = null;  // Datos Grilla
  trackingData: any[] = [];
  selectedRowKeys: any[] = [];
  selectedRowsData: any[] = [];
  selectedItemsSummary: any[] = [];
  availableActions: any[] = [];
  capPlanta: number = 0;
  mensajeCapacidadError: string = '';

  // Datos Plantas
  plantas: any[] = [];
  selectedPlantas: any[] = [];

  // Modal Rollback
  rollbackVisible: boolean = false;
  rollbackReason: string = '';
  currentRowData: any = null;
  rollbackSeccion: any = null;
  rollbackCantidad: number = 0;
  maxCantidadRollback: number = 0;
  rollbackObservacion: string = '';

  seccionesDisponibles: any[] = [];

  causasDisponibles: any[] = [];
  rollbackCausasSelected: any[] = [];

  responsablesDisponibles: any[] = [];
  rollbackResponsablesSelected: any[] = [];

  minDate: Date = new Date();
  maxDate: Date = new Date();


  /***  grid  */
  mdpProgramadoData: any[] = [];
  collapsed0: boolean = false;
  collapsed1: boolean = false;
  collapsed2: boolean = false;



  constructor(
    private sData: PRO035Service,
    private sCalidad: CAL001Service,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private SVisor: SvisorService,
    private cdr: ChangeDetectorRef,
    private el: ElementRef
  ) { }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase();

    // Calcular fechas permitidas (ayer y hoy)
    const today = new Date();
    this.maxDate = new Date(today);
    this.maxDate.setHours(23, 59, 59, 999);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    this.minDate = new Date(yesterday);
    this.minDate.setHours(0, 0, 0, 0);

    this.prmUsrAplBarReg = {
      tabla: 'AGENDA_PRODUCCION',
      aplicacion: 'PRO-038',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_nuevo: false, r_modificar: true }
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

    this.subscription = this._sbarreg.getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((datreg) => {
        if ((datreg.aplicacion === 'pro032' || datreg.aplicacion === 'PRO-035' || datreg.aplicacion === 'PRO-038') && this.el.nativeElement.offsetParent !== null) {
          this.opMenuRegistro(datreg);
        }
      });

    this.loadTrackingData();
    this.cargarCausas();
    this.cargarEmpleados();
  }

  cargarCausas() {
    this.sCalidad.getCausas('CAUSAS', {}).subscribe({
      next: (data: any) => {
        const res = validatorRes(data);
        if (res && res.length > 0 && !res[0]?.ErrMensaje) {
          this.causasDisponibles = res.map((c: any) => ({
            ID_CAUSA: c.ID_CAUSA,
            NOMBRE_CAUSA: c.NOMBRE_CAUSA || c.NOMBRE || c.DESCRIPCION || c.ID_CAUSA
          }));
        } else {
          this.causasDisponibles = [];
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar causas:', err);
        this.causasDisponibles = [];
        this.cdr.markForCheck();
      }
    });
  }

  cargarEmpleados() {
    this.sCalidad.getEmpleados('EMPLEADOS', {}).subscribe({
      next: (data: any) => {
        const res = validatorRes(data);
        if (res && res.length > 0 && !res[0]?.ErrMensaje) {
          this.responsablesDisponibles = res.map((e: any) => ({
            ID_EMPLEADO: e.ID_EMPLEADO,
            NOMBRE_COMPLETO: e.NOMBRE_COMPLETO || e.NOMBRE || e.ID_EMPLEADO
          }));
        } else {
          this.responsablesDisponibles = [];
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar empleados:', err);
        this.responsablesDisponibles = [];
        this.cdr.markForCheck();
      }
    });
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          accion: "r_ini",
          error: "",
          operacion: { r_nuevo: false, r_modificar: true }
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.cdr.markForCheck();
        break;

      case "r_modificar":
        this.readOnly = false;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.cdr.markForCheck();
        break;

      case "r_cancelar":
        Swal.fire({
          title: '¿Cancelar Edición?',
          text: 'Se perderán los cambios no guardados.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.readOnly = true;
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.cargarAgendaPlanta(); // Recargar datos para deshacer
          }
        });
        break;

      case "r_guardar":
        if (this.selectedRowsData.length === 0) {
          showToast('Seleccione al menos un registro para guardar marcando la casilla respectiva en la grilla', 'warning');
          return;
        }
        this.saveAllMovements();
        break;

      default:
        break;
    }
  }

  ngOnDestroy() {
    this.unSubscribe.next(true);
    this.unSubscribe.complete();
  }

  mostrarMensajeCapacidad() {
    if (this.mensajeCapacidadError) {
      import('sweetalert2').then(Swal => {
        Swal.default.fire({
          icon: 'warning',
          title: 'Aviso de Capacidad',
          text: this.mensajeCapacidadError,
          confirmButtonColor: '#0f4c81',
          confirmButtonText: 'Aceptar'
        });
      });
    }
  }

  // Cargar Datos de Producción
  loadTrackingData() {
    this.loadingVisible = true;
    const prm = { USUARIO: this.USUARIO_LOCAL };

    this.sData.consulta('plantas', prm, 'pro032').subscribe((data: any) => {
      this.loadingVisible = false;
      const res = validatorRes(data);
      if (res[0].ErrMensaje && res[0].ErrMensaje !== '') {
        showToast(res[0].ErrMensaje, 'error');
        this.plantas = [];
      } else {
        this.plantas = res;
      }
      this.cdr.markForCheck();
    }, (err) => {
      this.loadingVisible = false;
      showToast('Error al cargar datos', 'error');
      this.cdr.markForCheck();
    });
  }

  // Cargar Datos de Producción
  cargarAgendaPlanta() {
    this.loadingVisible = true;

    let plantasParam: any[] = [];
    if (this.selectedPlantas && this.selectedPlantas.length > 0) {
      plantasParam = this.selectedPlantas.map((id: any) => ({ ID_PLANTA: id }));
    } else {
      this.trackingData = [];
      this.loadingVisible = false;
      this.cdr.markForCheck();
      return;
    }

    const plantId = this.selectedPlantas[0];
    const prmConsecutivo = { PLANTA: plantId, ID_PLANTA: plantId, ID_UN_ITEM: plantId };

    this.sData.consulta('consecutivo planta', prmConsecutivo, 'pro032').subscribe({
      next: (consecRes: any) => {
        let consecutivo: any = null;
        try {
          if (consecRes && consecRes.data !== undefined && typeof consecRes.data === 'string' && !consecRes.data.trim().startsWith('[') && !consecRes.data.trim().startsWith('{')) {
            consecutivo = consecRes.data;
            if (consecRes.token) {
              localStorage.setItem("token", consecRes.token);
            }
          } else {
            const resCon = validatorRes(consecRes);
            if (resCon && resCon.length > 0) {
              const firstRow = resCon[0];
              if (firstRow) {
                if (firstRow.CONSECUTIVO !== undefined && firstRow.CONSECUTIVO !== null) {
                  consecutivo = firstRow.CONSECUTIVO;
                } else if (firstRow.consecutivo !== undefined && firstRow.consecutivo !== null) {
                  consecutivo = firstRow.consecutivo;
                } else {
                  const keys = Object.keys(firstRow);
                  if (keys.length > 0 && firstRow[keys[0]] !== null && firstRow[keys[0]] !== undefined) {
                    consecutivo = firstRow[keys[0]];
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Error al obtener consecutivo de planta:', e);
        }

        this.cargarMDPProgramado(consecutivo);
      },
      error: (err) => {
        console.error('Error al llamar a consecutivo planta:', err);
        this.cargarMDPProgramado(null);
      }
    });
  }

  cargarMDPProgramado(consecutivo: any) {
    this.loadingVisible = true;
    const prm = { CONSECUTIVO: consecutivo };

    this.sData.consulta('cargar mdp', prm, 'pro032').subscribe((data: any) => {
      const res = validatorRes(data);
      if (res && !res[0]?.ErrMensaje) {
        const groupedMap = new Map<string, any>();
        const finalData: any[] = [];

        res.forEach((item: any) => {
          const seccionActualCode = item.ID_SECCION || item.SECCION || '';
          const descripcion = item.DESCRIPCION_SECCION || seccionActualCode || 'Sin Sección';
          const seccionId = `S_${seccionActualCode}_${descripcion}`;

          // Nivel 1: Sección
          if (!groupedMap.has(seccionId)) {
            groupedMap.set(seccionId, {
              UNIQUE_ID: seccionId,
              UNIQUE_PARENT: 'RAIZ',
              FECHA: null,
              ID_PARTE: '',
              NOMBRE: item.DESCRIPCION_SECCION || seccionActualCode || 'Sin Sección',
              CANTIDAD: null,
              ID_SECCION: seccionActualCode,
              ESTADO: null,
              ORDEN_PRO: null
            });
            finalData.push(groupedMap.get(seccionId));
          }

          // Nivel 2: Producto
          const productoId = `P_${item.PRODUCTO}_${seccionId}_${item.NC_PEDIDO}_${item.ORDEN_PRO}`;
          if (!groupedMap.has(productoId)) {
            groupedMap.set(productoId, {
              UNIQUE_ID: productoId,
              UNIQUE_PARENT: seccionId,
              FECHA: item.FECHA,
              ID_PARTE: item.PRODUCTO,
              NOMBRE: item.NOMBRE_PRODUCTO || item.NOMBRE_PADRE || item.NOMBRE || `OP: ${item.ORDEN_PRO} - Pedido: ${item.NC_PEDIDO}`,
              CANTIDAD: null,
              ID_SECCION: '',
              ESTADO: null,
              ORDEN_PRO: item.ORDEN_PRO,
              FECHA_ENTREGA: item.FECHA_ENTREGA,
              TRABAJADORES: this.globalWorkers,
              HORA_SALIDA_DATE: this.globalExitTime ? new Date(this.globalExitTime) : null,
              HORA_SALIDA: this.globalExitTime ? formatDate(this.globalExitTime, 'yyyy-MM-dd HH:mm:ss', 'es') : null
            });
            finalData.push(groupedMap.get(productoId));
          }

          // Nivel 3: Detalle (Parte)
          const child = { ...item };
          child.NOMBRE = item.NOMBRE_PARTE || item.NOMBRE;
          child.UNIQUE_ID = `C_${item.ITEM}_${item.CONSECUTIVO}`;
          child.UNIQUE_PARENT = productoId;
          child.CANTIDAD_A_MOVER = item.CANTIDAD_SALDO;
          child.TRABAJADORES = this.globalWorkers;
          child.HORA_SALIDA_DATE = this.globalExitTime ? new Date(this.globalExitTime) : null;
          child.HORA_SALIDA = this.globalExitTime ? formatDate(this.globalExitTime, 'yyyy-MM-dd HH:mm:ss', 'es') : null;
          finalData.push(child);
        });

        this.loadingVisible = false;
        this.mensajeCapacidadError = '';
        this.capPlanta = 0;
        this.mdpProgramadoData = finalData;
        this.cdr.markForCheck();

      } else {
        this.loadingVisible = false;
        this.mdpProgramadoData = [];
        this.capPlanta = 0;
        this.cdr.markForCheck();
      }
    }, (err) => {
      this.loadingVisible = false;
      this.mdpProgramadoData = [];
      this.capPlanta = 0;
      this.cdr.markForCheck();
    });
  }

  onGlobalWorkersChanged(e: any) {
    if (this.mdpProgramadoData.length > 0) {
      this.mdpProgramadoData.forEach(d => {
        if (d.UNIQUE_ID && (d.UNIQUE_ID.startsWith('C_') || d.UNIQUE_ID.startsWith('P_'))) {
          d.TRABAJADORES = e.value;
        }
      });
      this.selectedRowsData.forEach(d => {
        d.TRABAJADORES = e.value;
      });
      this.selectedItemsSummary.forEach(d => {
        d.TRABAJADORES = e.value;
      });
      this.mdpProgramadoData = [...this.mdpProgramadoData];
      this.cdr.markForCheck();
      if (this.gridTracking && this.gridTracking.instance) this.gridTracking.instance.refresh();
    }
  }

  onGlobalExitTimeChanged(e: any) {
    if (this.mdpProgramadoData.length > 0) {
      this.mdpProgramadoData.forEach(d => {
        if (d.UNIQUE_ID && (d.UNIQUE_ID.startsWith('C_') || d.UNIQUE_ID.startsWith('P_'))) {
          d.HORA_SALIDA_DATE = e.value ? new Date(e.value) : null;
          d.HORA_SALIDA = e.value ? formatDate(e.value, 'yyyy-MM-dd HH:mm:ss', 'es') : null;
        }
      });
      this.selectedRowsData.forEach(d => {
        d.HORA_SALIDA_DATE = e.value ? new Date(e.value) : null;
        d.HORA_SALIDA = e.value ? formatDate(e.value, 'yyyy-MM-dd HH:mm:ss', 'es') : null;
      });
      this.selectedItemsSummary.forEach(d => {
        d.HORA_SALIDA = e.value ? formatDate(e.value, 'yyyy-MM-dd HH:mm:ss', 'es') : null;
      });
      this.mdpProgramadoData = [...this.mdpProgramadoData];
      this.cdr.markForCheck();
      if (this.gridTracking && this.gridTracking.instance) this.gridTracking.instance.refresh();
    }
  }

  onCellTimeChanged(e: any, rowData: any) {
    rowData.HORA_SALIDA_DATE = e.value;
    rowData.HORA_SALIDA = e.value ? formatDate(e.value, 'yyyy-MM-dd HH:mm:ss', 'es') : null;

    // Propagate exit time to all child components (Level 3) under this product (Level 2)
    this.mdpProgramadoData.forEach(d => {
      if (d.UNIQUE_PARENT === rowData.UNIQUE_ID) {
        d.HORA_SALIDA_DATE = rowData.HORA_SALIDA_DATE;
        d.HORA_SALIDA = rowData.HORA_SALIDA;

        // Sync with selectedRowsData
        const selIndex = this.selectedRowsData.findIndex(r => r.UNIQUE_ID === d.UNIQUE_ID);
        if (selIndex !== -1) {
          this.selectedRowsData[selIndex].HORA_SALIDA_DATE = rowData.HORA_SALIDA_DATE;
          this.selectedRowsData[selIndex].HORA_SALIDA = rowData.HORA_SALIDA;
        }

        // Sync with selectedItemsSummary
        const sumIndex = this.selectedItemsSummary.findIndex(s => s.CONSECUTIVO === d.CONSECUTIVO && s.ID_PARTE === d.ID_PARTE);
        if (sumIndex !== -1) {
          this.selectedItemsSummary[sumIndex].HORA_SALIDA = rowData.HORA_SALIDA;
        }
      }
    });
    this.cdr.markForCheck();
  }

  onCellWorkersChanged(e: any, rowData: any) {
    rowData.TRABAJADORES = e.value;

    // Propagate workers to all child components (Level 3) under this product (Level 2)
    this.mdpProgramadoData.forEach(d => {
      if (d.UNIQUE_PARENT === rowData.UNIQUE_ID) {
        d.TRABAJADORES = e.value;

        // Sync with selectedRowsData
        const selIndex = this.selectedRowsData.findIndex(r => r.UNIQUE_ID === d.UNIQUE_ID);
        if (selIndex !== -1) {
          this.selectedRowsData[selIndex].TRABAJADORES = rowData.TRABAJADORES;
        }

        // Sync with selectedItemsSummary
        const sumIndex = this.selectedItemsSummary.findIndex(s => s.CONSECUTIVO === d.CONSECUTIVO && s.ID_PARTE === d.ID_PARTE);
        if (sumIndex !== -1) {
          this.selectedItemsSummary[sumIndex].TRABAJADORES = rowData.TRABAJADORES;
        }
      }
    });
    this.cdr.markForCheck();
  }

  onCellAMoverChanged(e: any, rowData: any) {
    rowData.CANTIDAD_A_MOVER = e.value;

    // Sincronizar con selectedRowsData
    const selIndex = this.selectedRowsData.findIndex(r => r.UNIQUE_ID === rowData.UNIQUE_ID);
    if (selIndex !== -1) {
      this.selectedRowsData[selIndex].CANTIDAD_A_MOVER = rowData.CANTIDAD_A_MOVER;
    }

    // Sincronizar con selectedItemsSummary
    const sumIndex = this.selectedItemsSummary.findIndex(s => s.CONSECUTIVO === rowData.CONSECUTIVO && s.ID_PARTE === rowData.ID_PARTE);
    if (sumIndex !== -1) {
      this.selectedItemsSummary[sumIndex].CANTIDAD_PROGRAMADA = rowData.CANTIDAD_A_MOVER;
    }
  }

  onSeccionRetrocesoChanged(e: any, rowData: any) {
    rowData.ID_SECCION_SIG = e.value;
    const selected = rowData.SECCCIONES_RETROCESO?.find((s: any) => s.ID_SECCION === e.value);
    if (selected) {
      rowData.DESCRIPCION_SECCION_SIG = selected.DESCRIPCION;
    }
    const selIndex = this.selectedRowsData.findIndex(r => r.UNIQUE_ID === rowData.UNIQUE_ID);
    if (selIndex !== -1) {
      this.selectedRowsData[selIndex].ID_SECCION_SIG = rowData.ID_SECCION_SIG;
      this.selectedRowsData[selIndex].DESCRIPCION_SECCION_SIG = rowData.DESCRIPCION_SECCION_SIG;
    }
    const sumIndex = this.selectedItemsSummary.findIndex(s => s.ITEM === rowData.ITEM && s.CONSECUTIVO === rowData.NC_PEDIDO && s.ID_PARTE === rowData.ID_PARTE);
    if (sumIndex !== -1) {
      this.selectedItemsSummary[sumIndex].ID_SECCION_SIG = rowData.ID_SECCION_SIG;
      this.selectedItemsSummary[sumIndex].DESCRIPCION_SECCION_SIG = rowData.DESCRIPCION_SECCION_SIG;
    }
    this.cdr.markForCheck();
  }

  canEditRow(rowData: any): boolean {
    if (this.readOnly) return false;
    if (!rowData || !rowData.UNIQUE_ID || !rowData.UNIQUE_ID.startsWith('C_')) return false;
    if (!this.selectedRowKeys || !this.selectedRowKeys.includes(rowData.UNIQUE_ID)) return false;
    if (!this.selectedPlantas || this.selectedPlantas.length === 0) return false;
    if (rowData.ESTADO == 'PROGRAMADO') return false;
    return this.selectedPlantas.some((p: any) => String(p) === String(rowData.ID_UN_ITEM_ACT));
  }

  onContentReady(e: any) {
    if (e.component) {
      e.component.columnOption("command:edit", "visible", false);
    }
  }

  onSelectionChanged(e: any) {
    const leafRows = e.selectedRowsData.filter((row: any) => row.UNIQUE_ID && row.UNIQUE_ID.startsWith('C_'));
    const leafKeys = leafRows.map((row: any) => row.UNIQUE_ID);

    const containsNonLeaf = e.selectedRowKeys.some((key: any) => !key.startsWith('C_'));
    if (containsNonLeaf) {
      this.selectedRowKeys = leafKeys;
    } else {
      this.selectedRowKeys = e.selectedRowKeys;
    }

    this.selectedRowsData = leafRows;
    this.rowEdit = this.selectedRowsData.length === 1 && !this.rowApplyChanges;
    this.selectedItemsSummary = this.selectedRowsData.map(row => ({
      ID_PLAN: row.ID_PLAN,
      ID_DOCUMENTO: row.ID_PEDIDO,
      CONSECUTIVO: row.NC_PEDIDO,
      ID_PARTE: row.ID_PARTE,
      PRODUCTO: row.PRODUCTO,
      DESCRIPCION_SECCION: row.DESCRIPCION_SECCION,
      ID_SECCION: row.ID_SECCION,
      DESCRIPCION_SECCION_SIG: row.DESCRIPCION_SECCION_SIG,
      ID_SECCION_SIG: row.ID_SECCION_SIG,
      ESTADO: row.ESTADO,
      CANTIDAD_PROGRAMADA: row.CANTIDAD_A_MOVER !== undefined ? row.CANTIDAD_A_MOVER : row.CANTIDAD,
      ORDEN_PRO: row.ORDEN_PRO,
      FECHA_ENTREGA: row.FECHA_ENTREGA,
      TRABAJADORES: row.TRABAJADORES,
      HORA_SALIDA: row.HORA_SALIDA,
      ITEM: row.ITEM,
    }));
    this.updateAvailableActions();
    this.cdr.markForCheck();
  }

  updateAvailableActions() {
    this.availableActions = [];
    if (this.selectedRowsData.length > 0) {
      const isAllProgramado = this.selectedRowsData.every(row => row.ESTADO === 'PROGRAMADO');
      const isAllEnProceso = this.selectedRowsData.every(row => row.ESTADO === 'EN PROCESO');
      const isAllEnRetroceso = this.selectedRowsData.every(row => row.ESTADO === 'RETROCESO');

      if (isAllProgramado) {
        this.availableActions.push({ id: 'iniciar', text: 'Iniciar', icon: 'add' });
      }
      if (isAllEnProceso) {
        this.availableActions.push({ id: 'avanzar', text: 'Avanzar', icon: 'check' });
        this.availableActions.push({ id: 'retroceder', text: 'Retroceder', icon: 'back' });
      }
      if (isAllEnRetroceso) {
        this.availableActions.push({ id: 'avanzar_retroceso', text: 'Avanzar', icon: 'check' });
        this.availableActions.push({ id: 'retroceder', text: 'Retroceder', icon: 'back' });
      }
    }
    this.cdr.markForCheck();
  }

  operGrid(e: any, operacion: string) {
    if (!this.gridTracking || !this.gridTracking.instance) return;

    switch (operacion) {
      case 'edit':
        if (this.selectedRowsData.length === 0) return;
        const rowData = this.selectedRowsData[0];
        if (!this.canEditRow(rowData)) {
          showToast('No tiene permisos para editar esta fila o está en estado PROGRAMADO', 'warning');
          return;
        }
        const index = this.gridTracking.instance.getRowIndexByKey(rowData.UNIQUE_ID);
        if (index !== -1) {
          this.gridTracking.instance.editRow(index);
          this.rowApplyChanges = true;
          this.rowEdit = false;
        }
        break;

      case 'save':
        this.gridTracking.instance.saveEditData();
        break;

      case 'cancel':
        this.gridTracking.instance.cancelEditData();
        this.rowApplyChanges = false;
        if (this.selectedRowsData.length === 1) {
          this.rowEdit = true;
        }
        break;
    }
    this.cdr.markForCheck();
  }

  onRowUpdating(e: any): void {
    this.rowApplyChanges = false;
    this.cdr.markForCheck();
  }

  onRowUpdated(e: any): void {
    this.loadingVisible = true;
    this.cdr.markForCheck();
    this.saveItem(e.data).subscribe({
      next: (res: any) => {
        this.loadingVisible = false;
        showToast('Cambios guardados correctamente', 'success');
        this.cargarAgendaPlanta();
      },
      error: (err) => {
        this.loadingVisible = false;
        showToast('Error al guardar cambios', 'error');
        this.cargarAgendaPlanta();
      }
    });
  }

  onCellPrepared(e: any) {
    if (e.rowType === 'data' && e.data) {
      const isLeaf = e.data.UNIQUE_ID && e.data.UNIQUE_ID.startsWith('C_');
      if (!isLeaf) {
        const checkboxElement = e.cellElement.querySelector('.dx-select-checkbox');
        if (checkboxElement) {
          (checkboxElement as HTMLElement).style.display = 'none';
        }
      }
    }
  }

  onContextMenuPreparing(e: any) {
    if (e.row && e.row.rowType === 'data') {
      e.items = [{
        text: 'Anular',
        icon: 'remove',
        onItemClick: () => {
          this.anularItem(e.row.data);
        }
      }];
    }
  }

  anularItem(rowData: any) {
    import('sweetalert2').then(Swal => {
      Swal.default.fire({
        title: '¿Anular programación?',
        text: '¿Está seguro que desea anular la programación de este elemento?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonText: 'No, cancelar',
        confirmButtonText: 'Sí, anular'
      }).then((result) => {
        if (result.isConfirmed) {
          this.loadingVisible = true;
          this.cdr.markForCheck();
          const prm = {
            USUARIO: this.USUARIO_LOCAL,
            CONSECUTIVO: rowData.CONSECUTIVO,
          };
          this.sData.consulta('anular', prm, 'pro032').subscribe((data: any) => {
            this.loadingVisible = false;

            let parsedData: any = null;
            if (data && data.data && typeof data.data === 'string') {
              try { parsedData = JSON.parse(data.data); } catch (e) { }
            } else if (typeof data === 'string') {
              try { parsedData = JSON.parse(data); } catch (e) { }
            }

            let res: any = null;
            try {
              res = validatorRes(data);
            } catch (e) {
              console.error("Error al validar respuesta:", e);
            }
            const errorMsg = (parsedData && (parsedData.ErrMensaje !== undefined && parsedData.ErrMensaje !== null) ? parsedData.ErrMensaje : null) || (res && res[0] && res[0].ErrMensaje) || (res && res.ErrMensaje);

            if (!errorMsg || errorMsg === '') {
              showToast('Elemento anulado con éxito', 'success');
              this.cargarAgendaPlanta();
            } else {
              showToast(errorMsg || 'Error al anular elemento', 'error');
            }
            this.cdr.markForCheck();
          }, (err) => {
            this.loadingVisible = false;
            showToast('Error de conexión al anular', 'error');
            this.cdr.markForCheck();
          });
        }
      });
    });
  }
  onActionClick(e: any) {
    if (e.itemData.id === 'iniciar') {
      this.iniciarProceso();
    } else if (e.itemData.id === 'avanzar') {
      this.avanzarProceso();
    } else if (e.itemData.id === 'retroceder') {
      this.retrocederProceso();
    } else if (e.itemData.id === 'avanzar_retroceso') {
      this.avanzarRetroceso();
    }
  }

  avanzarProceso() {
    if (this.selectedRowsData.length === 0) return;
    const valid = this.selectedRowsData.every(row => row.TRABAJADORES > 0 && row.HORA_SALIDA_DATE);
    if (!valid) {
      showToast('Para avanzar, debe ingresar Trabajadores (al menos 1) y Hora de Salida para todos los registros seleccionados', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Avanzar Producción?',
      text: `Se avanzará el proceso para ${this.selectedRowsData.length} registros.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Avanzar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loadingVisible = true;
        this.cdr.markForCheck();
        const prm = {
          USUARIO: this.USUARIO_LOCAL,
          PRODUCTOS: this.selectedItemsSummary
        };
        this.sData.consulta('avanzar', prm, 'pro032').subscribe((data: any) => {
          this.loadingVisible = false;
          const res = validatorRes(data);

          if (res && res.length > 0 && (!res[0].ErrMensaje || res[0].ErrMensaje === '')) {
            showToast('Producción avanzada correctamente', 'success');
            this.selectedRowKeys = [];
            this.selectedRowsData = [];
            this.selectedItemsSummary = [];
            this.cargarAgendaPlanta();
          } else {
            showToast(res[0].ErrMensaje || 'Error al avanzar la producción', 'error');
          }
          this.cdr.markForCheck();
        }, (err) => {
          this.loadingVisible = false;
          showToast('Error al avanzar la producción', 'error');
          this.cdr.markForCheck();
        });
      }
    });
  }

  avanzarRetroceso() {
    if (this.selectedRowsData.length === 0) return;
    const valid = this.selectedRowsData.every(row => row.TRABAJADORES > 0 && row.HORA_SALIDA_DATE);
    if (!valid) {
      showToast('Para avanzar, debe ingresar Trabajadores (al menos 1) y Hora de Salida para todos los registros seleccionados', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Avanzar Producción?',
      text: `Se avanzará el proceso para ${this.selectedRowsData.length} registros.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Avanzar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loadingVisible = true;
        this.cdr.markForCheck();
        const prm = {
          USUARIO: this.USUARIO_LOCAL,
          PRODUCTOS: this.selectedItemsSummary
        };
        this.sData.consulta('avanzar retroceso', prm, 'pro032').subscribe((data: any) => {
          this.loadingVisible = false;
          const res = validatorRes(data);

          if (res && res.length > 0 && (!res[0].ErrMensaje || res[0].ErrMensaje === '')) {
            showToast('Producción avanzada correctamente', 'success');
            this.selectedRowKeys = [];
            this.selectedRowsData = [];
            this.selectedItemsSummary = [];
            this.cargarAgendaPlanta();
          } else {
            showToast(res[0].ErrMensaje || 'Error al avanzar la producción', 'error');
          }
          this.cdr.markForCheck();
        }, (err) => {
          this.loadingVisible = false;
          showToast('Error al avanzar la producción', 'error');
          this.cdr.markForCheck();
        });
      }
    });
  }

  iniciarProceso() {
    if (this.selectedRowsData.length === 0) return;
    Swal.fire({
      title: '¿Iniciar Producción?',
      text: `Se iniciará el proceso para ${this.selectedRowsData.length} registros.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Iniciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loadingVisible = true;
        this.cdr.markForCheck();
        const prm = {
          USUARIO: localStorage.getItem("usuario")?.toUpperCase() || '',
          PRODUCTOS: this.selectedItemsSummary
        };
        this.sData.consulta('INICIAR', prm, 'pro032').subscribe((data: any) => {
          this.loadingVisible = false;
          showToast('Producción iniciada correctamente', 'success');
          this.selectedRowKeys = [];
          this.selectedRowsData = [];
          this.selectedItemsSummary = [];
          this.cargarAgendaPlanta();
        }, (err) => {
          this.loadingVisible = false;
          showToast('Error al iniciar la producción', 'error');
          this.cdr.markForCheck();
        });
      }
    });
  }

  retrocederProceso() {
    if (this.selectedRowsData.length === 0) {
      showToast('Seleccione un registro para retroceder', 'warning');
      return;
    }
    this.currentRowData = this.selectedRowsData[0];

    // Resetear campos
    this.rollbackSeccion = null;
    this.rollbackCantidad = this.currentRowData.CANTIDAD_A_MOVER || this.currentRowData.CANTIDAD || 0;
    this.maxCantidadRollback = this.rollbackCantidad;
    this.rollbackCausasSelected = [];
    this.rollbackResponsablesSelected = [];
    this.rollbackObservacion = '';

    this.loadingVisible = true;
    this.cdr.markForCheck();

    const idUn = this.currentRowData.ID_UN_ITEM_ACT || this.currentRowData.ID_UN || (this.selectedPlantas && this.selectedPlantas.length > 0 ? this.selectedPlantas[0] : '00');
    const prmSecciones = {
      DATOS: [{
        ID_UN: idUn,
        ID_PARTE: this.currentRowData.ID_PARTE,
        ORDEN_PRO: this.currentRowData.ORDEN_PRO,
        ID_PLAN: this.currentRowData.ID_PLAN,
        NC_PEDIDO: this.currentRowData.NC_PEDIDO
      }]
    };

    this.sData.consulta('secciones retroceso', prmSecciones, 'pro032').subscribe({
      next: (data: any) => {
        this.loadingVisible = false;
        const res = validatorRes(data);
        if (res && res.length > 0 && !res[0]?.ErrMensaje) {
          // Filtrar por si acaso la sección actual
          this.seccionesDisponibles = res
            .filter((s: any) => s.ID_SECCION !== this.currentRowData.ID_SECCION)
            .map((s: any) => ({
              ID_SECCION: s.ID_SECCION,
              NOMBRE: s.DESCRIPCION_SECCION
            }));
        } else {
          this.seccionesDisponibles = [];
          showToast(res[0]?.ErrMensaje || 'No se encontraron secciones a retroceder', 'warning');
        }
        this.rollbackVisible = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadingVisible = false;
        this.seccionesDisponibles = [];
        showToast('Error al cargar secciones a retroceder', 'error');
        this.rollbackVisible = true;
        this.cdr.markForCheck();
      }
    });
  }

  confirmarRetroceso() {
    if (!this.rollbackSeccion) {
      showToast('Debe seleccionar la sección a la que se va a retroceder', 'warning');
      return;
    }
    if (this.rollbackCantidad <= 0 || this.rollbackCantidad > this.maxCantidadRollback) {
      showToast(`La cantidad debe ser mayor a 0 y no superar la cantidad máxima disponible (${this.maxCantidadRollback})`, 'warning');
      return;
    }
    if (this.rollbackCausasSelected.length === 0) {
      showToast('Debe seleccionar al menos una causa de retroceso', 'warning');
      return;
    }
    if (this.rollbackResponsablesSelected.length === 0) {
      showToast('Debe seleccionar al menos un responsable', 'warning');
      return;
    }

    this.loadingVisible = true;
    this.cdr.markForCheck();

    const seccionSeleccionada = this.seccionesDisponibles.find(s => s.ID_SECCION === this.rollbackSeccion);
    const nombreSeccionRetroceso = seccionSeleccionada ? seccionSeleccionada.NOMBRE : '';

    const prm = {
      USUARIO: this.USUARIO_LOCAL,
      CONSECUTIVO: this.currentRowData.CONSECUTIVO,
      SECCION_ACTUAL: this.currentRowData.ID_SECCION,
      DESCRIPCION_SECCION: this.currentRowData.DESCRIPCION_SECCION,
      SECCION_RETROCESO: this.rollbackSeccion,
      DESCRIPCION_SECCION_RETRO: nombreSeccionRetroceso,
      CANTIDAD_RETROCESO: this.rollbackCantidad,
      CAUSAS: this.rollbackCausasSelected,
      RESPONSABLES: this.rollbackResponsablesSelected,
      OBSERVACION: this.rollbackObservacion,
      ID_PARTE: this.currentRowData.ID_PARTE,
      ORDEN_PRO: this.currentRowData.ORDEN_PRO,
      ID_PLAN: this.currentRowData.ID_PLAN,
      NC_PEDIDO: this.currentRowData.NC_PEDIDO,
      ID_UN: this.currentRowData.ID_UN,
      ID_PRODUCTO: this.currentRowData.ID_PRODUCTO,
      ESTADO: this.currentRowData.ESTADO,
      FECHA_ENTREGA: this.currentRowData.FECHA_ENTREGA,
      ID_PEDIDO: this.currentRowData.ID_PEDIDO,
      PRODUCTO: this.currentRowData.PRODUCTO,
      ITEM: this.currentRowData.ITEM,
      FECHA_INICIO_PROGRAMADA: this.currentRowData.FECHA_INICIO_PROGRAMADA,
      NOMBRE: this.currentRowData.NOMBRE,
    };

    // Usando el query 'retroceder' o el nombre que tenga configurado tu backend
    this.sData.consulta('retroceso', prm, 'pro032').subscribe({
      next: (data: any) => {
        this.loadingVisible = false;
        const res = validatorRes(data);
        if (res && res.length > 0 && (!res[0].ErrMensaje || res[0].ErrMensaje === '')) {
          showToast('Movimiento retrocedido correctamente', 'success');
          this.rollbackVisible = false;
          this.selectedRowKeys = [];
          this.selectedRowsData = [];
          this.selectedItemsSummary = [];
          this.cargarAgendaPlanta();
        } else {
          showToast(res[0]?.ErrMensaje || 'Error al retroceder el movimiento', 'error');
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadingVisible = false;
        showToast('Error al conectar con el servidor para retroceder', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  saveAllMovements() {
    if (this.selectedRowsData.length === 0) return;
    Swal.fire({
      title: '¿Confirmar Movimientos?',
      text: `Se procesarán ${this.selectedRowsData.length} registros.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Guardar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loadingVisible = true;
        this.cdr.markForCheck();
        const observables = this.selectedRowsData.map(d => this.saveItem(d));
        forkJoin(observables).subscribe((results: any[]) => {
          this.loadingVisible = false;
          showToast('Movimientos guardados correctamente', 'success');
          this.selectedRowKeys = [];
          this.readOnly = true;
          this.prmUsrAplBarReg.accion = 'r_navegar';
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this.cargarAgendaPlanta();
        }, (err) => {
          this.loadingVisible = false;
          showToast('Error al procesar algunos movimientos', 'error');
          this.cdr.markForCheck();
        });
      }
    });
  }

  saveItem(item: any) {
    const seccAct = {
      ...item,
      ESTADO: 'EN PROCESO',
      CANTIDAD_AUTORIZADA: item.CANTIDAD_A_MOVER,
      TRABAJADORES: item.TRABAJADORES,
      HORA_SALIDA: item.HORA_SALIDA_DATE ? formatDate(item.HORA_SALIDA_DATE, 'yyyy-MM-dd HH:mm:ss', 'es') : null,
      USUARIO: this.USUARIO_LOCAL
    };
    const seccSig = { ID_SECCION: item.ID_SECCION_SIG };
    const prm = { SECCION_ACTUAL: seccAct, SECCION_SIGUIENTE: seccSig, AUTORIZAR: true };
    return this.sData.consulta('UPDATE ITEM AGENDA', prm, 'pro032');
  }

  onRowPrepared(e: any): void {
    if (e.rowType === 'data') {
      if (e.data.UNIQUE_PARENT === 'RAIZ') {
        e.rowElement.classList.add('row-padre');
      } else {
        e.rowElement.classList.add('row-hijo');
      }
    }
  }

  private parsearSecciones(seccion: any): any[] {
    if (!seccion) return [];

    // Si ya es un objeto o array, lo procesamos directamente
    if (typeof seccion === 'object') {
      return Array.isArray(seccion) ? seccion : [seccion];
    }

    try {
      // Intentamos parsear como JSON
      const parsed = JSON.parse(seccion);
      // Si es un objeto o array (formato multi-sección), lo devolvemos
      if (parsed && typeof parsed === 'object') {
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      return [];
    } catch (e) {
      // Si falla el parseo (es texto plano), devolvemos vacío para usar el fallback del template
      return [];
    }
  }

}
