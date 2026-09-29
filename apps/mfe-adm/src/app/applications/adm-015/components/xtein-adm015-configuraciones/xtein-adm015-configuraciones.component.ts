import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxCheckBoxModule, DxDataGridModule } from 'devextreme-angular';
import { Adm015SettingAplicacionRecord } from '../../models/adm-015.model';

@Component({
  selector: 'xtein-adm015-configuraciones',
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxCheckBoxModule],
  templateUrl: './xtein-adm015-configuraciones.component.html',
  styleUrls: ['./xtein-adm015-configuraciones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinAdm015ConfiguracionesComponent implements OnInit, OnChanges {
  @Input() settings: Adm015SettingAplicacionRecord[] = [];
  @Input() readOnly = true;

  @Output() readonly settingsChange = new EventEmitter<Adm015SettingAplicacionRecord[]>();

  dataSource: Adm015SettingAplicacionRecord[] = [];

  ngOnInit(): void {
    this.processData();
  }

  ngOnChanges(): void {
    this.processData();
  }

  private processData(): void {
    const raw = this.settings || [];
    this.dataSource = raw
      .filter(item => item && item.ID_APLICACION)
      .map((item, index) => ({
        ...item,
        ITEM: (item.ITEM !== undefined && item.ITEM !== null && item.ITEM !== 0) ? item.ITEM : index + 1
      }));
  }

  getGroupTitle(grupoObj: any): string {
    if (!grupoObj) return '';

    const key =
      grupoObj.value ??
      grupoObj.key ??
      grupoObj.text ??
      grupoObj.displayValue ??
      grupoObj.data?.key ??
      grupoObj.row?.data?.key ??
      grupoObj.row?.key ??
      '';

    const items =
      grupoObj.data?.items ||
      grupoObj.data?.collapsedItems ||
      grupoObj.row?.data?.items ||
      grupoObj.row?.data?.collapsedItems ||
      [];

    const firstItem =
      items[0] ||
      this.dataSource.find(s => s.ID_APLICACION === key) ||
      (this.settings || []).find(s => s.ID_APLICACION === key);

    const appId = firstItem?.ID_APLICACION || key;
    const appName = firstItem?.NOMBRE_APLICACION || '';

    return `${appId} ${appName}`.trim();
  }

  onToggleAssign(row: Adm015SettingAplicacionRecord, value: boolean): void {
    if (this.readOnly) return;
    row.ASIGNAR = value;
    row.isEdit = true;
    this.settingsChange.emit([...this.dataSource]);
  }
}
