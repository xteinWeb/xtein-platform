import { XteinPopupComponent, XteinDataGridComponent, XteinCheckboxComponent, XteinGridColumn, XteinGridSelectionEvent, XteinGridEditingEvent } from '@xtein/ui';
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, inject } from '@angular/core';
import { XteinButtonComponent, XteinNotificationService } from '@xtein/ui';
import { Ven213Lookup, Ven213SettingResult } from '../../models/ven-213-business.model';
import { Ven213SelectionService } from '../../services/ven-213-selection.service';

@Component({
  selector: 'ven-213-selection', standalone: true,
  imports: [XteinPopupComponent, XteinDataGridComponent, XteinCheckboxComponent,XteinButtonComponent],
  providers: [Ven213SelectionService],
  templateUrl: './ven-213-selection.component.html',
  styleUrl: './ven-213-selection.component.scss'
})
export class Ven213SelectionComponent implements OnChanges {
  @Input() config: Ven213SettingResult | null = null;
  @Input() visible = false;
  @Input() busy = false;
  @Input() initialKeys: unknown[] = [];
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() accepted = new EventEmitter<Ven213Lookup[]>();
  @ViewChild(XteinDataGridComponent) grid?: XteinDataGridComponent<Ven213Lookup, number>;
  private readonly configuration = inject(Ven213SelectionService);
  private readonly notification = inject(XteinNotificationService);
  rows: Ven213Lookup[] = [];
  columns: XteinGridColumn<Ven213Lookup, number>[] = [];
  keys: number[] = [];
  onlySelected = false;
  error = '';
  saving = false;
  readonly pageSizes = [5, 10, 20, 50, 100, 'all'];

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['config'] && !(changes['visible'] && this.visible)) return;
    this.grid?.cancelEditData();
    this.grid?.clearDataFilter();
    this.error = '';
    this.onlySelected = false;
    this.rows = structuredClone(this.config?.dataSource ?? []);
    this.keys = [...this.initialKeys] as number[];
    try { this.columns = this.configuration.columns(this.config?.colsConfig); }
    catch (error) { this.error = error instanceof Error ? error.message : 'Configuración inválida.'; }
  }
  size(dimension: 'width' | 'height'): string {
    const value = Number(this.config?.[dimension]);
    const fallback = dimension === 'width' ? 600 : 400;
    return `min(${value > 0 && Number.isFinite(value) ? value : fallback}px, ${dimension === 'width' ? '95vw' : '90dvh'})`;
  }
  selectionChanged(event: XteinGridSelectionEvent<Ven213Lookup, number>): void {
    this.keys = event.selectedRowKeys;
  }
  editingStart(event: XteinGridEditingEvent<Ven213Lookup, number>): void {
    event.cancel = this.busy || !this.keys.includes(event.key);
  }
  async filterSelected(value: boolean): Promise<void> {
    if (!await this.commitEdits()) return;
    this.onlySelected = value;
    // 'anyof' is only valid in filterValue; a DataSource filter needs one '=' per key joined by 'or'.
    if (value) this.grid?.filter(this.keys.length
      ? this.keys.length === 1 ? ['ITEM', '=', this.keys[0]]
        : this.keys.flatMap((key, index) => index ? ['or', ['ITEM', '=', key]] : [['ITEM', '=', key]])
      : ['ITEM', '=', null]);
    else this.grid?.clearDataFilter();
  }
  groupRows(path: unknown): Ven213Lookup[] {
    const keys = Array.isArray(path) ? path : [path];
    const groups = this.columns.filter(column => column.groupIndex != null && column.groupIndex >= 0)
      .sort((a,b) => a.groupIndex! - b.groupIndex!);
    return this.rows.filter(row => keys.every((value,index) => row[groups[index]?.dataField ?? ''] === value));
  }
  groupSelected(path: unknown): boolean {
    const rows = this.groupRows(path);
    return rows.length > 0 && rows.every(row => this.keys.includes(row['ITEM'] as number));
  }
  groupPartial(path: unknown): boolean {
    return !this.groupSelected(path) && this.groupRows(path).some(row => this.keys.includes(row['ITEM'] as number));
  }
  groupLabel(path: unknown, field: string): string {
    const row = this.groupRows(path)[0];
    return row ? this.configuration.groupFields(this.config?.colsConfig, field).map(key => String(row[key] ?? '')).join(' ') : String(path);
  }
  async toggleGroup(path: unknown, checked: boolean): Promise<void> {
    if (!await this.commitEdits()) return;
    const group = this.groupRows(path).map(row => row['ITEM'] as number);
    if (checked) await this.grid?.selectRows(group, true);
    else await this.grid?.deselectRows(group);
  }
  private async commitEdits(): Promise<boolean> {
    if (this.busy || this.saving || this.error) return false;
    this.saving = true;
    try {
      await this.grid?.saveEditData();
      return !this.grid?.hasEditData();
    } catch (error) {
      this.notification.error(error instanceof Error ? error.message : 'No se pudieron validar los datos.');
      return false;
    } finally { this.saving = false; }
  }
  async apply(): Promise<void> {
    if (!await this.commitEdits()) return;
    const rows = this.rows.filter(row => this.keys.includes(row['ITEM'] as number));
    try {
      this.configuration.validateRows(this.config?.colsConfig, rows);
      this.accepted.emit(structuredClone(rows));
    } catch (error) { this.notification.error(error instanceof Error ? error.message : 'Revise los valores seleccionados.'); }
  }
}
