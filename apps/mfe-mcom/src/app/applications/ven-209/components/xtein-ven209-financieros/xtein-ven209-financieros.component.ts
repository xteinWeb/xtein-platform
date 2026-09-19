import {
  Component,
  EventEmitter,
  Input,
  Output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  XteinDataGridComponent,
  XteinGridColumn,
  XteinGridToolbarAction,
  XteinInputComponent,
  XteinLabelComponent,
  XteinLookupComponent
} from '@xtein/ui';
import { Ven209Condicion, Ven209Lookup } from '../../models/ven-209.model';
import { Ven209GridColumns } from '../../constants/ven-209-ui.constants';

@Component({
  selector: 'xtein-ven209-financieros',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    XteinDataGridComponent,
    XteinInputComponent,
    XteinLabelComponent,
    XteinLookupComponent
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

  readonly condicionColumns = Ven209GridColumns.condiciones;

  // Accordion state (matches Legacy VEN20901)
  readonly expanded = {
    cupo: signal(true),
    condiciones: signal(true)
  };

  toggleSection(section: keyof typeof this.expanded): void {
    const sig = this.expanded[section];
    sig.set(!sig());
  }

  readonly addModalOpen = signal(false);
  selectedCondicionId = '';

  readonly lookupColumns: XteinGridColumn<Ven209Lookup, unknown>[] = [
    { dataField: 'ID_CONDICION', caption: 'Código', width: 130 },
    { dataField: 'DESCRIPCION', caption: 'Descripción' }
  ];

  readonly gridToolbarActions: XteinGridToolbarAction[] = [
    {
      id: 'add-cond',
      text: 'Asociar Condición',
      title: 'Asociar condición comercial',
      icon: 'plus',
      variant: 'primary',
      action: () => this.openModal()
    }
  ];

  openModal(): void {
    if (this.readOnly) return;
    this.selectedCondicionId = '';
    this.addModalOpen.set(true);
  }

  closeModal(): void {
    this.addModalOpen.set(false);
  }

  saveCondicion(): void {
    if (!this.selectedCondicionId) return;
    const itemInfo = this.availableCondiciones.find(c => c.ID_CONDICION === this.selectedCondicionId);
    const item: Ven209Condicion = {
      ID_CONDICION: this.selectedCondicionId,
      DESCRIPCION: String(itemInfo?.DESCRIPCION ?? this.selectedCondicionId)
    };
    const updated = [...this.condiciones.filter(c => c.ID_CONDICION !== item.ID_CONDICION), item];
    this.condicionesChange.emit(updated);
    this.closeModal();
  }

  onCupoChange(value: number): void {
    this.cupoCreditoChange.emit(value);
  }

  onTiempoChange(value: number): void {
    this.tiempoEntregaChange.emit(value);
  }
}
