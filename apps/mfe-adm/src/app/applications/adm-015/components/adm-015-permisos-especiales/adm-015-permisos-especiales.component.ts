import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule } from 'devextreme-angular';
import { XteinCheckboxComponent } from '@xtein/ui';
import { Adm015PermisoEspecialRecord } from '../../models/adm-015.model';

@Component({
  selector: 'adm-015-permisos-especiales',
  standalone: true,
  imports: [CommonModule, DxDataGridModule, XteinCheckboxComponent],
  templateUrl: './adm-015-permisos-especiales.component.html',
  styleUrls: ['./adm-015-permisos-especiales.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Adm015PermisosEspecialesComponent {
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
