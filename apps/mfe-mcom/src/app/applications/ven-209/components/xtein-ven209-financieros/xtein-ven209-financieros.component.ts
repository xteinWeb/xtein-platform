import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  XteinCondicionesComponent,
  XteinNumberComponent,
  XteinInputComponent,
  XteinLabelComponent,
  XteinGroupLabelComponent,
  XteinGridColumn
} from '@xtein/ui';
import { Ven209Condicion, Ven209Lookup } from '../../models/ven-209.model';

@Component({
  selector: 'xtein-ven209-financieros',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    XteinCondicionesComponent,
    XteinNumberComponent,
    XteinInputComponent,
    XteinLabelComponent,
    XteinGroupLabelComponent
  ],
  templateUrl: './xtein-ven209-financieros.component.html',
  styleUrls: ['./xtein-ven209-financieros.component.scss']
})
export class XteinVen209FinancierosComponent {
  @Input() readOnly = false;

  // Global
  @Input() cupoCredito = 0;
  @Input() estadoCupo = '';
  @Input() cupoUtilizado = 0;
  @Input() cupoDisponible = 0;

  // Cuota
  @Input() cupoCuota = 0;
  @Input() estadoCuota = '';
  @Input() cupoUtiCuota = 0;
  @Input() cupoDisCuota = 0;

  @Input() tiempoEntrega = 0;
  @Input() condiciones: Ven209Condicion[] = [];
  @Input() availableCondiciones: Ven209Lookup[] = [];

  @Output() readonly cupoCreditoChange = new EventEmitter<number>();
  @Output() readonly cupoCuotaChange = new EventEmitter<number>();
  @Output() readonly tiempoEntregaChange = new EventEmitter<number>();
  @Output() readonly condicionesChange = new EventEmitter<Ven209Condicion[]>();
  @Output() readonly pendingChange = new EventEmitter<void>();

  @ViewChild(XteinCondicionesComponent) private conditionsComp?: XteinCondicionesComponent;

  readonly condicionColumns: XteinGridColumn<Ven209Condicion, unknown>[] = [
    { dataField: 'ID_CONDICION', caption: 'Condición', width: 140, cellTemplate: 'xteinGroup' },
    { dataField: 'NOMBRE_CONDICION', caption: 'Nombre condición', minWidth: 220, cellTemplate: 'xteinGroup' }
  ];

  // Accordion state (matches Legacy VEN20901)
  readonly expanded = {
    cupo: signal(true),
    condiciones: signal(true)
  };

  commitPending(): boolean {
    const committed = this.conditionsComp?.commit() ?? true;
    if (!committed) this.expanded.condiciones.set(true);
    return committed;
  }

  toggleSection(section: keyof typeof this.expanded): void {
    const sig = this.expanded[section];
    sig.set(!sig());
  }

  onCupoCreditoChange(value: number): void {
    const val = Number(value ?? 0);
    this.cupoCredito = val;
    this.cupoCreditoChange.emit(val);
    this.pendingChange.emit();
  }

  onCupoCuotaChange(value: number): void {
    const val = Number(value ?? 0);
    this.cupoCuota = val;
    this.cupoCuotaChange.emit(val);
    this.pendingChange.emit();
  }

  onTiempoChange(value: number): void {
    const val = Number(value ?? 0);
    this.tiempoEntrega = val;
    this.tiempoEntregaChange.emit(val);
    this.pendingChange.emit();
  }
}
