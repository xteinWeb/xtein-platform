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
  XteinLabelComponent,
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
    XteinLabelComponent
  ],
  templateUrl: './xtein-ven209-financieros.component.html',
  styleUrls: ['./xtein-ven209-financieros.component.scss']
})
export class XteinVen209FinancierosComponent {
  @Input() readOnly = false;
  @Input() cupoCredito = 0;
  @Input() tiempoEntrega = 0;
  @Input() condiciones: Ven209Condicion[] = [];
  @Input() availableCondiciones: Ven209Lookup[] = [];

  @Output() readonly cupoCreditoChange = new EventEmitter<number>();
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

  onCupoChange(value: number): void {
    this.cupoCreditoChange.emit(value);
  }

  onTiempoChange(value: number): void {
    this.tiempoEntregaChange.emit(value);
  }
}
