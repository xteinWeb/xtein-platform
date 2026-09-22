import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule } from 'devextreme-angular';
import { Adm015SettingAplicacionRecord } from '../../models/adm-015.model';

@Component({
  selector: 'xtein-adm015-configuraciones',
  standalone: true,
  imports: [CommonModule, DxDataGridModule],
  templateUrl: './xtein-adm015-configuraciones.component.html',
  styleUrls: ['./xtein-adm015-configuraciones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinAdm015ConfiguracionesComponent {
  @Input() settings: Adm015SettingAplicacionRecord[] = [];
  @Input() readOnly = true;

  @Output() readonly settingsChange = new EventEmitter<Adm015SettingAplicacionRecord[]>();

  onCellChanged(): void {
    if (this.readOnly) return;
    this.settingsChange.emit([...this.settings]);
  }
}
