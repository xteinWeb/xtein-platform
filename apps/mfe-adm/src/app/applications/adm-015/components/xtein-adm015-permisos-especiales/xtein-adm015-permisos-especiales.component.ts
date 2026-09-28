import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxCheckBoxModule, DxDataGridModule } from 'devextreme-angular';
import { Adm015PermisoEspecialRecord } from '../../models/adm-015.model';

@Component({
  selector: 'xtein-adm015-permisos-especiales',
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxCheckBoxModule],
  templateUrl: './xtein-adm015-permisos-especiales.component.html',
  styleUrls: ['./xtein-adm015-permisos-especiales.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinAdm015PermisosEspecialesComponent {
  @Input() permisosEspeciales: Adm015PermisoEspecialRecord[] = [];
  @Input() readOnly = true;

  @Output() readonly permisosEspecialesChange = new EventEmitter<Adm015PermisoEspecialRecord[]>();

  onPermisoChanged(item: Adm015PermisoEspecialRecord, value: boolean): void {
    if (this.readOnly) return;
    item.PERMISO = Boolean(value);
    item.isEdit = true;
    this.permisosEspecialesChange.emit([...this.permisosEspeciales]);
  }

  onAprobacionChanged(item: Adm015PermisoEspecialRecord, value: boolean): void {
    if (this.readOnly) return;
    item.APROBACION = Boolean(value);
    item.isEdit = true;
    this.permisosEspecialesChange.emit([...this.permisosEspeciales]);
  }
}
