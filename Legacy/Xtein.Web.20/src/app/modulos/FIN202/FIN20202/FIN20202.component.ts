import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxNumberBoxModule, DxPopupModule } from 'devextreme-angular';
import { clsRecaudosPagos } from '../clsFIN202.class';
import { Subscription } from 'rxjs/internal/Subscription';
import { Observable } from 'rxjs/internal/Observable';
import { CommonModule } from '@angular/common';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-FIN20202',
  templateUrl: './FIN20202.component.html',
  styleUrls: ['./FIN20202.component.scss'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxButtonModule, DxPopupModule,
            DxNumberBoxModule
          ]
})
export class FIN20202Component  implements OnInit {

  @ViewChild('gridPagos', { static: false }) gridPagos!: DxDataGridComponent;
  
  DPagos: clsRecaudosPagos[] = [];
  popupVisible: boolean = false;
  @Input() totalPermitido: number = 0;         // Valor máximo permitido

  dataSource: clsRecaudosPagos[]  = [];
  selectedRowKeys: any[]   = [];
  totalValorPagado: number = 0;
  currencyFormat           = { type: 'fixedPoint', precision: 2 };

  @Input() events: Observable<any>;
  @Output() onRespuestaPagos = new EventEmitter<any>();
  private eventsSubscription: Subscription;

  // ── Estado del total ──────────────────────────────────────────────
  get totalExcedido(): boolean {
    return this.totalValorPagado > this.totalPermitido;
  }

  get diferencia(): number {
    return parseFloat((this.totalPermitido - this.totalValorPagado).toFixed(2));
  }

  ngOnInit() {
    this.eventsSubscription = this.events.subscribe((data: any) => {
      this.DPagos = data.dataSource;
      this.totalPermitido = data.dataRecaudo?.TOTAL ?? 0;
      this.popupVisible = true;
      const ordenMap = new Map<string, number>();
      this.DPagos.forEach(item => {
        if (!ordenMap.has(item.TIPO_PAGO)) {
          ordenMap.set(item.TIPO_PAGO, ordenMap.size);
        }
      });      
      this.DPagos = this.DPagos.map((item, index) => ({
        ...item,
        ID: index,
        VALOR_PAGO: item.VALOR_PAGO ?? 0,
        TIPO_PAGO_ORDEN: ordenMap.get(item.TIPO_PAGO) // campo auxiliar de orden
      }));
    });
    this.recalcularTotal();

  }

  ngOnDestroy() {
    if (this.eventsSubscription) {
      this.eventsSubscription.unsubscribe();
    }
  }

  // ─── Recalcula el total sumando solo filas seleccionadas ──────────
  private recalcularTotal(): void {
    const seleccionadas = this.DPagos.filter(f =>
      this.selectedRowKeys.includes(f.ITEM)
    );
    this.totalValorPagado = parseFloat(
      seleccionadas.reduce((acc, f) => acc + (f.VALOR_PAGO ?? 0), 0).toFixed(2)
    );
  }

  // ─── Selección: asigna/limpia VALOR_PAGADO ────────────────────────
  onSelectionChanged(e: any): void {
    this.selectedRowKeys = e.selectedRowKeys;
    this.recalcularTotal();
  }

  // ─── Bloquea edición si la fila no está seleccionada ─────────────
  onCellClick(e: any): void {
    if (e.column?.dataField !== 'VALOR_PAGADO' || e.rowType !== 'data') return;

    // if (!this.selectedRowKeys.includes(e.data?.ITEM)) {
    //   e.event?.stopImmediatePropagation();
    //   this.gridPagos?.instance?.cancelEditData();
    // }
  }

  // ─── Validación inline: >0 y no supera el total permitido ─────────
  onEditorPreparing(e: any): void {
    if (e.dataField !== 'VALOR_PAGADO' || e.parentType !== 'dataRow') return;

    e.editorOptions.min              = 0;
    e.editorOptions.step             = 0;
    e.editorOptions.showSpinButtons  = false;
    e.editorOptions.format           = { type: 'fixedPoint', precision: 2 };

    const originalOnValueChanged = e.editorOptions.onValueChanged;
    e.editorOptions.onValueChanged = (args: any) => {
      if (originalOnValueChanged) originalOnValueChanged(args);
      // Preview en tiempo real del total
      const otrosTotal = this.DPagos
        .filter(f => this.selectedRowKeys.includes(f.ITEM) && f.ITEM !== e.row?.data?.ITEM)
        .reduce((acc, f) => acc + (f.VALOR_PAGO ?? 0), 0);
      this.totalValorPagado = parseFloat((otrosTotal + (args.value ?? 0)).toFixed(2));
    };
  }

  // ─── Validación al confirmar fila ─────────────────────────────────
  onRowValidating(e: any): void { 
    const nuevoValor = e.newData?.VALOR_PAGO ?? e.oldData?.VALOR_PAGO ?? 0;

    if (nuevoValor <= 0) {
      e.isValid   = false;
      e.errorText = 'El Valor Pagado debe ser mayor a 0.';
      return;
    }

    // Calcular total proyectado con el nuevo valor
    const totalProyectado = this.DPagos
      .filter(f => this.selectedRowKeys.includes(f.ITEM) && f.ITEM !== e.key)
      .reduce((acc, f) => acc + (f.VALOR_PAGO ?? 0), 0) + nuevoValor;

    if (totalProyectado > this.totalPermitido) {
      e.isValid   = false;
      e.errorText = `El total (${this.formatCurrency(totalProyectado)}) supera el máximo permitido (${this.formatCurrency(this.totalPermitido)}).`;
    }
  } 

  // ─── Actualiza dataSource y recalcula al guardar ──────────────────
  onRowUpdated(e: any): void {
    const idx = this.DPagos.findIndex(f => f.ITEM === e.key);
    if (idx !== -1) {
      this.DPagos[idx] = { ...this.DPagos[idx], ...e.data };
    }
    this.recalcularTotal();
  }

  // ─── Aceptar ──────────────────────────────────────────────────────
  aceptarPago(): void {
    this.gridPagos?.instance?.saveEditData().then(() => {
      if (this.totalExcedido) return;

      const seleccionadas = this.DPagos.filter(f =>
        f.VALOR_PAGO > 0 
      );

      if (seleccionadas.length === 0) {
        notify('No se ha seleccionado ningún pago.', 'error', 2000);
        return;
      }

      this.onRespuestaPagos.emit(seleccionadas);
      this.popupVisible = false;

    });

  }

  // ─── Cancelar ─────────────────────────────────────────────────────
  cancelarPago(): void {
    this.gridPagos?.instance?.cancelEditData();
    this.popupVisible = false;
  }


  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  // ─── Reglas custom para dxi-validation-rule ───────────────────────
  validarMayorCero = (options: any): boolean => {
    return (options.value ?? 0) > 0;
  };

  validarContraTotal = (options: any): boolean => {
    const otrosTotal = this.DPagos
      .filter(f => this.selectedRowKeys.includes(f.ITEM) && f.ITEM !== options.data?.ITEM)
      .reduce((acc, f) => acc + (f.VALOR_PAGO ?? 0), 0);
    return (otrosTotal + (options.value ?? 0)) <= this.totalPermitido;
  };

}
