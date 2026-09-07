import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DxDataGridModule, DxPopupModule, DxTemplateModule } from 'devextreme-angular';
import { XteinButtonComponent } from '../../forms/xtein-button/xtein-button.component';
import { XteinRecordViewColumn } from './models/xtein-record-view.model';

/** Selection returns the original record, independently of grid sorting/filtering. */
@Component({
  selector: 'xtein-record-view',
  standalone: true,
  imports: [DxPopupModule, DxDataGridModule, DxTemplateModule, XteinButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './xtein-record-view.component.html',
  styleUrl: './xtein-record-view.component.scss'
})
export class XteinRecordViewComponent {
  @Input() visible = false;
  @Input() title = 'Vista de registros';
  @Input({ required: true }) keyField = '';
  @Input() columns: XteinRecordViewColumn[] = [];
  @Input() set records(value: readonly object[]) {
    this.data = [...value];
    this.selectedRecord = undefined;
  }
  @Output() readonly visibleChange = new EventEmitter<boolean>();
  @Output() readonly selected = new EventEmitter<object>();
  data: object[] = [];
  selectedRecord?: object;

  select(record: object | undefined): void {
    if (!record) return;
    this.selected.emit(record);
    this.visibleChange.emit(false);
  }
}
