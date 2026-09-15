import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { validatorRes } from 'src/app/shared/validator/validator';
import { showToast } from '../../../shared/toast/toastComponent';
import { PRO035Service } from 'src/app/services/PRO035/PRO035.service';
import {
  DxSelectBoxModule,
  DxTagBoxModule,
  DxTreeListModule,
  DxLoadPanelModule,
  DxButtonModule,
  DxToolbarModule,
  DxProgressBarModule
} from 'devextreme-angular';

@Component({
  selector: 'app-pro037',
  templateUrl: './pro037.component.html',
  styleUrls: ['./pro037.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    DxSelectBoxModule,
    DxTagBoxModule,
    DxTreeListModule,
    DxLoadPanelModule,
    DxButtonModule,
    DxToolbarModule,
    DxProgressBarModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PRO037Component implements OnInit, OnDestroy {

  unSubscribe: Subject<boolean> = new Subject<boolean>();
  subscription!: Subscription;
  readOnly: boolean = true;
  USUARIO_LOCAL: any = '';
  loadingVisible: boolean = false;
  prmUsrAplBarReg!: clsBarraRegistro;

  // Variables de Filtro y Grilla
  plantas: any[] = [];
  selectedPlantas: any[] = [];
  mdpProgramadoData: any[] = [];
  filteredMdpData: any[] = [];

  // Variables de Indicadores de Consecutivos
  consecutivosList: any[] = [];
  selectedConsecutivo: string | null = null;

  minDate: Date = new Date();
  maxDate: Date = new Date();

  constructor(
    private sData: PRO035Service,
    private _sbarreg: SbarraService,
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

    // Inicializar barra de registro (como visor)
    this.prmUsrAplBarReg = {
      tabla: 'AGENDA_PRODUCCION',
      aplicacion: 'PRO-037',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_nuevo: false, r_modificar: false }
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

    this.subscription = this._sbarreg.getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((datreg) => {
        if ((datreg.aplicacion === 'pro032' || datreg.aplicacion === 'PRO-035' || datreg.aplicacion === 'PRO-037') && this.el.nativeElement.offsetParent !== null) {
          this.opMenuRegistro(datreg);
        }
      });

    this.loadPlantas();
  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          accion: "r_ini",
          error: "",
          operacion: { r_nuevo: false, r_modificar: false }
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.cdr.markForCheck();
        break;

      case 'r_refrescar':
        this.cargarAgendaPlanta();
        break;

      default:
        break;
    }
  }

  ngOnDestroy() {
    this.unSubscribe.next(true);
    this.unSubscribe.complete();
  }

  // Cargar Plantas Disponibles
  loadPlantas() {
    this.loadingVisible = true;
    const prm = { USUARIO: this.USUARIO_LOCAL };

    this.sData.consulta('plantas', prm, 'pro032').subscribe({
      next: (data: any) => {
        this.loadingVisible = false;
        const res = validatorRes(data);
        if (res[0]?.ErrMensaje && res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
          this.plantas = [];
        } else {
          this.plantas = res;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadingVisible = false;
        showToast('Error al cargar plantas', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  // Consulta Principal
  cargarAgendaPlanta() {
    this.loadingVisible = true;
    this.selectedConsecutivo = null;

    if (!this.selectedPlantas || this.selectedPlantas.length === 0) {
      this.mdpProgramadoData = [];
      this.filteredMdpData = [];
      this.consecutivosList = [];
      this.loadingVisible = false;
      this.cdr.markForCheck();
      return;
    }

    const plantId = this.selectedPlantas[0];
    const prm = { PLANTA: plantId, ID_PLANTA: plantId, ID_UN_ITEM: plantId };

    this.sData.consulta('admin mdp', prm, 'pro032').subscribe({
      next: (data: any) => {
        const res = validatorRes(data);
        if (res && res.length > 0 && !res[0]?.ErrMensaje) {
          // 'admin mdp' retorna una lista ya pre-agrupada de consecutivos
          this.consecutivosList = res.map((consec: any) => {
            const consecId = consec.CONSECUTIVO || 'SIN_CONSECUTIVO';
            const producto = consec.PRODUCTO || '';
            const nombreProducto = consec.NOMBRE_PRODUCTO || '';
            const idPlan = consec.ID_PLAN || '';
            const detalleSecciones = consec.DETALLE_SECCIONES || [];

            // 1. Estadísticas Consolidadas
            let cantidadTotal = 0;
            let trabajadoresTotal = 0;
            const pedidosSet = new Set<string>();
            let terminadosCount = 0;

            detalleSecciones.forEach((item: any) => {
              cantidadTotal += Number(item.CANTIDAD || item.CANTIDAD_ENTRADA || 0);
              const itemTrabajadores = Number(item.TRABAJADORES || item.NUMERO_TRABAJADORES || 0);
              trabajadoresTotal += itemTrabajadores;
              
              if (item.NC_PEDIDO || item.ID_PEDIDO) {
                pedidosSet.add(String(item.NC_PEDIDO || item.ID_PEDIDO));
              }
              if (item.ESTADO === 'FINALIZADO' || item.ESTADO === 'TERMINADO') {
                terminadosCount += 1;
              } else if (item.ESTADO === 'EN PROCESO') {
                terminadosCount += 0.5;
              }
            });

            const progress = detalleSecciones.length > 0
              ? Math.min(100, Math.round((terminadosCount / detalleSecciones.length) * 100))
              : 0;

            // 2. Jerarquía TreeList específica para este consecutivo (Section -> Product -> Detalle/Parte)
            const groupedMap = new Map<string, any>();
            const treeData: any[] = [];

            detalleSecciones.forEach((item: any) => {
              const seccionActualCode = item.ID_SECCION || item.SECCION || '';
              const descripcion = item.DESCRIPCION_SECCION || seccionActualCode || 'Sin Sección';
              const seccionId = `S_${seccionActualCode}_${descripcion}_${consecId}`;

              // Nivel 1: Sección
              if (!groupedMap.has(seccionId)) {
                groupedMap.set(seccionId, {
                  UNIQUE_ID: seccionId,
                  UNIQUE_PARENT: 'RAIZ',
                  FECHA: null,
                  ID_PARTE: '',
                  NOMBRE: descripcion,
                  DESCRIPCION_SECCION: descripcion,
                  CANTIDAD: null,
                  ID_SECCION: seccionActualCode,
                  ESTADO: null,
                  ORDEN_PRO: null
                });
                treeData.push(groupedMap.get(seccionId));
              }

              // Nivel 2: Producto (Bajo la Sección)
              const productoId = `P_${producto}_${seccionId}_${consecId}`;
              if (!groupedMap.has(productoId)) {
                groupedMap.set(productoId, {
                  UNIQUE_ID: productoId,
                  UNIQUE_PARENT: seccionId,
                  FECHA: item.FECHA,
                  ID_PARTE: producto,
                  NOMBRE: nombreProducto || `OP: ${item.ORDEN_PRO} - Pedido: ${item.NC_PEDIDO}`,
                  DESCRIPCION_SECCION: '',
                  CANTIDAD: null,
                  ID_SECCION: '',
                  ESTADO: null,
                  ORDEN_PRO: item.ORDEN_PRO,
                  FECHA_ENTREGA: item.FECHA_ENTREGA
                });
                treeData.push(groupedMap.get(productoId));
              }

              // Nivel 3: Detalle (Parte) (Bajo el Producto)
              const child = { ...item };
              child.NOMBRE = item.NOMBRE_PARTE || item.NOMBRE || '';
              child.UNIQUE_ID = `C_${item.ITEM}_${consecId}`;
              child.UNIQUE_PARENT = productoId;
              child.CANTIDAD_A_MOVER = item.CANTIDAD_A_MOVER || item.CANTIDAD || 0;
              child.TRABAJADORES = item.TRABAJADORES || item.NUMERO_TRABAJADORES || 0;
              child.HORA_SALIDA_DATE = item.HORA_SALIDA_DATE ? new Date(item.HORA_SALIDA_DATE) : (item.HORA_SALIDA ? new Date(item.HORA_SALIDA) : null);
              
              // Nuevos campos mapeados como Date para visualización de fecha/hora en la plantilla
              child.FECHA_INICIO_PROD_DATE = item.FECHA_INICIO_PRODUCCION ? new Date(item.FECHA_INICIO_PRODUCCION) : null;
              child.FECHA_FIN_PROD_DATE = item.FECHA_FIN_PRODUCCION ? new Date(item.FECHA_FIN_PRODUCCION) : null;
              
              treeData.push(child);
            });

            const logro = consec.PORCENTAJE_LOGRO !== undefined ? consec.PORCENTAJE_LOGRO : (consec.porcentaje_logro !== undefined ? consec.porcentaje_logro : 0);
            const fechaVal = consec.FECHA || (detalleSecciones.length > 0 ? (detalleSecciones[0].FECHA || detalleSecciones[0].FECHA_INICIO_PROGRAMADA) : null);
            const fechaInicio = fechaVal ? new Date(fechaVal) : null;
            const todosFinalizados = detalleSecciones.length > 0 && detalleSecciones.every((item: any) => 
              item.ESTADO === 'FINALIZADO' || item.ESTADO === 'TERMINADO' || item.ESTADO === 'STOCK'
            );
            return {
              CONSECUTIVO: consecId,
              FECHA_INICIO: fechaInicio,
              TODOS_FINALIZADOS: todosFinalizados,
              CANTIDAD_TOTAL: cantidadTotal,
              TRABAJADORES_TOTAL: trabajadoresTotal,
              ITEMS_COUNT: detalleSecciones.length,
              PEDIDOS_COUNT: pedidosSet.size,
              PORCENTAJE_LOGRO: Number(logro || 0),
              PROGRESS: progress,
              isExpanded: false,
              treeData: treeData
            };
          });

          this.loadingVisible = false;
          this.cdr.markForCheck();
        } else {
          this.loadingVisible = false;
          if (res && res[0]?.ErrMensaje) {
            showToast(res[0].ErrMensaje, 'error');
          }
          this.consecutivosList = [];
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.loadingVisible = false;
        showToast('Error al cargar datos históricos de MDP', 'error');
        this.consecutivosList = [];
        this.cdr.markForCheck();
      }
    });
  }

  toggleConsecutivo(consec: any) {
    consec.isExpanded = !consec.isExpanded;
    this.cdr.markForCheck();
  }

  finalizarMDP(e: any, consec: any) {
    if (e && e.event && typeof e.event.stopPropagation === 'function') {
      e.event.stopPropagation(); // Evita que se abra/cierre el acordeón
    }

    import('sweetalert2').then(Swal => {
      Swal.default.fire({
        title: '¿Finalizar MDP?',
        text: `¿Está seguro que desea finalizar el consecutivo ${consec.CONSECUTIVO}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#64748b',
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Sí, finalizar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.loadingVisible = true;
          this.cdr.markForCheck();
          const prm = {
            USUARIO: this.USUARIO_LOCAL,
            CONSECUTIVO: consec.CONSECUTIVO,
          };
          this.sData.consulta('finalizar', prm, 'pro032').subscribe({
            next: (data: any) => {
              this.loadingVisible = false;
              
              let res: any = null;
              try {
                res = validatorRes(data);
              } catch (e) {}

              const errorMsg = (res && res[0]?.ErrMensaje) || (res && res.ErrMensaje);

              if (!errorMsg || errorMsg === '') {
                showToast(`Consecutivo ${consec.CONSECUTIVO} finalizado con éxito`, 'success');
                this.cargarAgendaPlanta(); // Recargar datos
              } else {
                showToast(errorMsg, 'error');
              }
              this.cdr.markForCheck();
            },
            error: (err) => {
              this.loadingVisible = false;
              showToast('Error de conexión al finalizar MDP', 'error');
              this.cdr.markForCheck();
            }
          });
        }
      });
    });
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

  onContentReady(e: any) {
    if (e.component) {
      e.component.columnOption("command:edit", "visible", false);
    }
  }

  onCellPrepared(e: any) {
    // Visor de lectura, ocultar controles de selección si existieran
    if (e.rowType === 'data') {
      const checkboxElement = e.cellElement.querySelector('.dx-select-checkbox');
      if (checkboxElement) {
        (checkboxElement as HTMLElement).style.display = 'none';
      }
    }
  }
}
