import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, inject } from '@angular/core';
import { DxPopupModule, DxDataGridModule, DxDataGridComponent, DxTemplateModule } from 'devextreme-angular';
import type { Column, EditingStartEvent, SelectionChangedEvent } from 'devextreme/ui/data_grid';
import { XteinButtonComponent, XteinNotificationService } from '@xtein/ui';
import { Ven230Lookup, Ven230SettingResult } from '../../models/ven-230-business.model';
import { Ven230SelectionService } from '../../services/ven-230-selection.service';

@Component({
  selector: 'xtein-ven230-selection', standalone: true,
  imports: [DxPopupModule, DxDataGridModule, DxTemplateModule, XteinButtonComponent],
  providers: [Ven230SelectionService],
  templateUrl: './xtein-ven230-selection.component.html',
  styleUrl: './xtein-ven230-selection.component.scss'
})
export class XteinVen230SelectionComponent implements OnChanges {
  @Input() config: Ven230SettingResult | null = null;
  @Input() visible = false;
  @Input() busy = false;
  @Input() initialKeys: unknown[] = [];
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() accepted = new EventEmitter<Ven230Lookup[]>();
  @ViewChild(DxDataGridComponent) grid?: DxDataGridComponent;
  private readonly configuration = inject(Ven230SelectionService);
  private readonly notification = inject(XteinNotificationService);
  rows: Ven230Lookup[] = [];
  columns: Column<Ven230Lookup, number>[] = [];
  keys: number[] = [];
  onlySelected = false;
  error = '';
  saving = false;
  readonly pageSizes = [5, 10, 20, 50, 100, 'all'];

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['config'] && !(changes['visible'] && this.visible)) return;
    this.grid?.instance.cancelEditData();
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
  selectionChanged(event: SelectionChangedEvent<Ven230Lookup, number>): void {
    this.keys = event.selectedRowKeys;
  }
  editingStart(event: EditingStartEvent<Ven230Lookup, number>): void {
    event.cancel = this.busy || !this.keys.includes(event.key);
  }
  async filterSelected(value: boolean): Promise<void> {
    if (!await this.commitEdits()) return;
    this.onlySelected = value;
    if (value) this.grid?.instance.filter(['ITEM', 'anyof', this.keys]);
    else this.grid?.instance.clearFilter('dataSource');
  }
  groupRows(path: unknown): Ven230Lookup[] {
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
    if (checked) await this.grid?.instance.selectRows(group, true);
    else await this.grid?.instance.deselectRows(group);
  }
  private async commitEdits(): Promise<boolean> {
    if (this.busy || this.saving || this.error) return false;
    this.saving = true;
    try {
      await this.grid?.instance.saveEditData();
      return !this.grid?.instance.hasEditData();
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
