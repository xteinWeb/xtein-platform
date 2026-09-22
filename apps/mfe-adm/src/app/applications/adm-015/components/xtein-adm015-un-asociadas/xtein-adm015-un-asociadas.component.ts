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
import { Adm015UNAsociadaRecord } from '../../models/adm-015.model';

@Component({
  selector: 'xtein-adm015-un-asociadas',
  standalone: true,
  imports: [CommonModule, DxDataGridModule, XteinButtonComponent],
  templateUrl: './xtein-adm015-un-asociadas.component.html',
  styleUrls: ['./xtein-adm015-un-asociadas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinAdm015UnAsociadasComponent {
  @Input() unAsociadas: Adm015UNAsociadaRecord[] = [];
  @Input() readOnly = true;
  @Input() availableUNs: { ID_UN: string; NOMBRE: string }[] = [];

  @Output() readonly unAsociadasChange = new EventEmitter<Adm015UNAsociadaRecord[]>();

  setDefaultUN(record: Adm015UNAsociadaRecord): void {
    if (this.readOnly) return;
    for (const item of this.unAsociadas) {
      item.VALOR_DEFECTO = item.ITEM === record.ITEM;
      item.isEdit = true;
    }
    this.unAsociadasChange.emit([...this.unAsociadas]);
  }

  onAddUN(): void {
    if (this.readOnly || !this.availableUNs?.length) return;
    const existing = new Set(this.unAsociadas.map(u => u.ID_UN_ASOCIADA));
    const firstAvailable = this.availableUNs.find(u => !existing.has(u.ID_UN));
    if (!firstAvailable) return;

    const nextItem = this.unAsociadas.length > 0 ? Math.max(...this.unAsociadas.map(u => u.ITEM || 0)) + 1 : 1;
    const newRecord: Adm015UNAsociadaRecord = {
      ITEM: nextItem,
      ID_UN_ASOCIADA: firstAvailable.ID_UN,
      NOMBRE: firstAvailable.NOMBRE,
      VALOR_DEFECTO: this.unAsociadas.length === 0,
      isEdit: true
    };
    this.unAsociadasChange.emit([...this.unAsociadas, newRecord]);
  }

  onRemoveUN(item: Adm015UNAsociadaRecord): void {
    if (this.readOnly) return;
    const filtered = this.unAsociadas.filter(u => u.ITEM !== item.ITEM);
    this.unAsociadasChange.emit(filtered);
  }
}
