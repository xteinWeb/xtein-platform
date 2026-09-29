import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxFormModule, DxPopupModule } from 'devextreme-angular';
import { clsAbonos } from '../clsFIN202.class';
import { Observable } from 'rxjs/internal/Observable';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-FIN20201',
  templateUrl: './FIN20201.component.html',
  styleUrls: ['./FIN20201.component.scss'],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxDataGridModule, DxButtonModule, DxPopupModule
          ]
})
export class FIN20201Component {
  @ViewChild('gridCuotas', { static: false }) gridCuotas!: DxDataGridComponent;

  popupVisible = false;
  selectedRowKeys: any[] = [];
  DAbonosCartera: clsAbonos[] = []
  currencyFormat = { type: 'fixedPoint', precision: 2 };
  saldoFilaActual: number = 0;
  
  @Input() events: Observable<any>;
  @Output() onRespuestaAbonos = new EventEmitter<any>();
  private eventsSubscription: Subscription;

  ngOnInit() {
    this.eventsSubscription = this.events.subscribe((data: any) => {
        this.DAbonosCartera = data.dataSource;
        this.popupVisible = true;
    });

  }

  ngOnDestroy() {
    if (this.eventsSubscription) {
      this.eventsSubscription.unsubscribe();
    }
  }

  abrirPopup() { 
    this.popupVisible = true; 
  }

  // ─── Captura el SALDO antes de que el usuario edite ───────────────
  onEditorPreparing(e: any): void {
    if (e.dataField !== 'VALOR_PAGADO' || e.parentType !== 'dataRow') return;

    this.saldoFilaActual = e.row?.data?.SALDO ?? 0;

    const onValueChanged = e.editorOptions.onValueChanged;

    e.editorOptions.onValueChanged = (args: any) => {
      // Llamar handler original si existe
      if (onValueChanged) onValueChanged(args);

      const valor  = args.value ?? 0;
      const editor = args.component;

      if (valor > this.saldoFilaActual) {
        editor.option('validationStatus', 'invalid');
      } else {
        editor.option('validationStatus', 'valid');
      }
    };

    // Configuración extra del editor numérico
    e.editorOptions.min  = 0;
    e.editorOptions.step = 0;
    e.editorOptions.showSpinButtons = false;
    e.editorOptions.format = { type: 'fixedPoint', precision: 2 };
  }

  // ─── Validación al guardar la fila ────────────────────────────────
  onRowValidating(e: any): void {
    const valorPagado = e.newData?.VALOR_PAGADO ?? e.oldData?.VALOR_PAGADO ?? 0;
    const saldo       = e.oldData?.SALDO ?? 0;

    if (valorPagado > saldo) {
      e.isValid      = false;
      e.errorText    = `El Valor Pagado (${ this.formatCurrency(valorPagado) }) no puede superar el Saldo (${ this.formatCurrency(saldo) }).`;
    }
  }

// ─── Refleja los cambios del grid en dataSource ───────────────────
  onRowUpdated(e: any): void {
    const idx = this.DAbonosCartera.findIndex(f => f.ITEM === e.key);
    if (idx !== -1) {
      this.DAbonosCartera[idx] = { ...this.DAbonosCartera[idx], ...e.data };
    }
  }

  // ─── Pago Anticipado: VALOR_PAGADO = SALDO - CAPITAL ──────────────
  onPagoAnticipado(facturaKey: string): void {
    // Guardar posibles cambios pendientes antes de reasignar
    this.gridCuotas?.instance?.saveEditData();

    const idsDelGrupo = this.DAbonosCartera
      .filter(f => f.FACTURA === facturaKey)
      .map(f => f.ITEM);

    // Agregar al selection sin quitar las ya seleccionadas
    const keysActuales = [...this.selectedRowKeys];
    idsDelGrupo.forEach(id => {
      if (!keysActuales.includes(id)) keysActuales.push(id);
    });
    this.selectedRowKeys = [...keysActuales];

    // Recalcular VALOR_PAGADO respetando la regla: no superar SALDO
    this.DAbonosCartera = this.DAbonosCartera.map(fila => {
      if (fila.FACTURA === facturaKey) {
        const valorPagado = parseFloat(
          Math.max(0, fila.SALDO - fila.CAPITAL).toFixed(2)
        );
        return { ...fila, VALOR_PAGADO: valorPagado };
      }
      return fila;
    });

    this.gridCuotas?.instance?.refresh();
  }

  onSelectionChanged(e: any): void {
    this.selectedRowKeys = e.selectedRowKeys;

    // Filas recién seleccionadas → VALOR_PAGADO = SALDO
    e.currentSelectedRowKeys?.forEach((key: any) => {
      const idx = this.DAbonosCartera.findIndex(f => f.ITEM === key);
      if (idx !== -1) {
        this.DAbonosCartera[idx] = {
          ...this.DAbonosCartera[idx],
          VALOR_PAGADO: this.DAbonosCartera[idx].SALDO
        };
        const rowIndex = this.gridCuotas.instance.getRowIndexByKey(key);
        this.gridCuotas.instance.cellValue(rowIndex, 'VALOR_PAGADO', this.DAbonosCartera[idx].SALDO);
        this.DAbonosCartera[idx].VALOR_TOTAL = this.DAbonosCartera[idx].VALOR_PAGADO + this.DAbonosCartera[idx].VALOR_INTERESES - this.DAbonosCartera[idx].VALOR_DESCUENTO;
        this.gridCuotas.instance.cellValue(rowIndex, 'VALOR_TOTAL', this.DAbonosCartera[idx].VALOR_TOTAL);
      }
    });

    // Filas deseleccionadas → VALOR_PAGADO = 0
    e.currentDeselectedRowKeys?.forEach((key: any) => {
      const idx = this.DAbonosCartera.findIndex(f => f.ITEM === key);
      if (idx !== -1) {
        this.DAbonosCartera[idx] = { ...this.DAbonosCartera[idx], VALOR_PAGADO: 0 };
        this.DAbonosCartera[idx].VALOR_TOTAL = this.DAbonosCartera[idx].VALOR_PAGADO + this.DAbonosCartera[idx].VALOR_INTERESES - this.DAbonosCartera[idx].VALOR_DESCUENTO; 
        const rowIndex = this.gridCuotas.instance.getRowIndexByKey(key);
        this.gridCuotas.instance.cellValue(rowIndex, 'VALOR_PAGADO', 0);
        this.gridCuotas.instance.cellValue(rowIndex, 'VALOR_TOTAL', this.DAbonosCartera[idx].VALOR_TOTAL);
      }
    });

    this.gridCuotas?.instance?.refresh();
  }

  // ─── Aceptar / Cancelar ───────────────────────────────────────────
  aceptarPago(): void {
    // Forzar guardado de celda activa antes de emitir
    this.gridCuotas?.instance?.saveEditData().then(() => {
      // Si hay errores de validación pendientes, no continuar
      const hasErrors = this.gridCuotas?.instance
        ?.getVisibleRows()
        .some((r: any) => r.isEditing);

      const seleccionadas = this.DAbonosCartera.filter(f =>
        this.selectedRowKeys.includes(f.ITEM)
      );

      if (seleccionadas.length === 0) {
        alert('Debe seleccionar al menos una cuota.');
        return;
      }

      console.log('Cuotas seleccionadas para pago:', seleccionadas);
      this.onRespuestaAbonos.emit(seleccionadas);
      this.popupVisible = false;

    });
  }

  onCellClick(e: any): void {
    if (e.column?.dataField !== 'VALOR_PAGADO' || e.rowType !== 'data') return;

    const estaSeleccionada = this.selectedRowKeys.includes(e.data?.ITEM);

    if (!estaSeleccionada) {
      // Cancelar inmediatamente para que no entre en modo edición
      e.event?.stopImmediatePropagation();
      this.gridCuotas?.instance?.cancelEditData();
    }
  }

  cancelarPago(): void {
    this.gridCuotas?.instance?.cancelEditData();
    this.popupVisible = false;
  }


  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }  

  // ─── Validación: no negativo ──────────────────────────────────────
  validarNoNegativo = (options: any): boolean => {
    return (options.value ?? 0) >= 0;
  }

  // ─── Validación: VALOR_PAGADO <= SALDO ───────────────────────────
  validarContraSaldo = (options: any): boolean => {
    const saldo = options.data?.SALDO ?? 0;
    const valor = options.value ?? 0;
    return valor <= saldo;
  }

}
