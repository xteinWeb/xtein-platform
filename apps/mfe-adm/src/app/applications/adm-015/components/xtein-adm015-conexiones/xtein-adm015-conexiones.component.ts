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
import { Adm015ConexionRecord } from '../../models/adm-015.model';

@Component({
  selector: 'xtein-adm015-conexiones',
  standalone: true,
  imports: [CommonModule, DxDataGridModule, XteinButtonComponent],
  templateUrl: './xtein-adm015-conexiones.component.html',
  styleUrls: ['./xtein-adm015-conexiones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinAdm015ConexionesComponent {
  @Input() conexiones: Adm015ConexionRecord[] = [];
  @Input() readOnly = true;
  @Input() availableConexiones: { ID_CONEXION: string; NOMBRE?: string }[] = [];

  @Output() readonly conexionesChange = new EventEmitter<Adm015ConexionRecord[]>();

  setDefaultConexion(record: Adm015ConexionRecord): void {
    if (this.readOnly) return;
    for (const item of this.conexiones) {
      item.ULTIMA = item.ITEM === record.ITEM;
      item.isEdit = true;
    }
    this.conexionesChange.emit([...this.conexiones]);
  }

  onAddConexion(): void {
    if (this.readOnly || !this.availableConexiones?.length) return;
    const existing = new Set(this.conexiones.map(c => c.ID_CONEXION));
    const firstAvailable = this.availableConexiones.find(c => !existing.has(c.ID_CONEXION));
    if (!firstAvailable) return;

    const nextItem = this.conexiones.length > 0 ? Math.max(...this.conexiones.map(c => c.ITEM || 0)) + 1 : 1;
    const newRecord: Adm015ConexionRecord = {
      ITEM: nextItem,
      ID_CONEXION: firstAvailable.ID_CONEXION,
      NOMBRE: firstAvailable.NOMBRE || firstAvailable.ID_CONEXION,
      ULTIMA: this.conexiones.length === 0,
      ULTIMA_UN: '',
      isEdit: true
    };
    this.conexionesChange.emit([...this.conexiones, newRecord]);
  }

  onRemoveConexion(item: Adm015ConexionRecord): void {
    if (this.readOnly) return;
    const filtered = this.conexiones.filter(c => c.ITEM !== item.ITEM);
    this.conexionesChange.emit(filtered);
  }
}
