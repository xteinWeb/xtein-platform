import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule } from 'devextreme-angular';
import { XteinButtonComponent } from '@xtein/ui';
import { Adm015AutorizacionRecord } from '../../models/adm-015.model';

@Component({
  selector: 'xtein-adm015-aplicaciones',
  standalone: true,
  imports: [CommonModule, DxDataGridModule, XteinButtonComponent],
  templateUrl: './xtein-adm015-aplicaciones.component.html',
  styleUrls: ['./xtein-adm015-aplicaciones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinAdm015AplicacionesComponent {
  @Input() autorizaciones: Adm015AutorizacionRecord[] = [];
  @Input() readOnly = true;
  @Input() availableApps: { ID_APLICACION: string; NOMBRE: string }[] = [];

  @Output() readonly autorizacionesChange = new EventEmitter<Adm015AutorizacionRecord[]>();
  @Output() readonly copyFromRole = new EventEmitter<void>();

  onCellChanged(record: Adm015AutorizacionRecord, field: keyof Adm015AutorizacionRecord, val: boolean): void {
    if (this.readOnly) return;
    (record as unknown as Record<string, unknown>)[field] = val;
    record.isEdit = true;
    this.autorizacionesChange.emit([...this.autorizaciones]);
  }

  markAllColumn(field: keyof Adm015AutorizacionRecord, value: boolean): void {
    if (this.readOnly) return;
    for (const item of this.autorizaciones) {
      (item as unknown as Record<string, unknown>)[field] = value;
      item.isEdit = true;
    }
    this.autorizacionesChange.emit([...this.autorizaciones]);
  }

  assignAllApps(): void {
    if (this.readOnly) return;
    const existingIds = new Set(this.autorizaciones.map(a => a.ID_APLICACION));
    const newItems = [...this.autorizaciones];
    let nextItem = newItems.length > 0 ? Math.max(...newItems.map(a => a.ITEM || 0)) + 1 : 1;

    for (const app of this.availableApps) {
      if (!existingIds.has(app.ID_APLICACION)) {
        newItems.push({
          ITEM: nextItem++,
          ID_APLICACION: app.ID_APLICACION,
          NOMBRE: app.NOMBRE,
          CREAR: false,
          MODIFICAR: false,
          ELIMINAR: false,
          BUSCAR: true,
          LISTAR: true,
          EXCLUSIVA: false,
          CONFIGURAR: false,
          isEdit: true
        });
      }
    }
    this.autorizacionesChange.emit(newItems);
  }

  removeSelected(selectedItems: Adm015AutorizacionRecord[]): void {
    if (this.readOnly || !selectedItems?.length) return;
    const toRemoveKeys = new Set(selectedItems.map(s => s.ITEM));
    const filtered = this.autorizaciones.filter(a => !toRemoveKeys.has(a.ITEM));
    this.autorizacionesChange.emit(filtered);
  }
}
