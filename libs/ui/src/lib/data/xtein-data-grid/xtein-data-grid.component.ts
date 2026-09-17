import { Component, Input, Output, EventEmitter, TemplateRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DxDataGridModule, DxDataGridComponent, DxTemplateModule } from 'devextreme-angular';
import type { KeyDownEvent } from 'devextreme/ui/data_grid';
import { XteinGridColumn, XteinGridSelectionEvent, XteinGridEditingEvent, XteinGridRowEvent } from './models/xtein-data-grid.model';
@Component({selector:'xtein-data-grid',standalone:true,imports:[DxDataGridModule,DxTemplateModule,NgTemplateOutlet],
  templateUrl:'./xtein-data-grid.component.html',styleUrl:'./xtein-data-grid.component.scss'})
export class XteinDataGridComponent<T = unknown, K = unknown> implements OnChanges {
  @Input() dataSource: T[] = [];
  @Input() keyExpr: string | undefined;
  @Input() columns: XteinGridColumn<T,K>[] | undefined;
  resolvedColumns: (XteinGridColumn<T,K> | string)[] = [];
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns'] || changes['dataSource']) {
      const first = this.dataSource[0];
      this.resolvedColumns = this.columns ?? (first && typeof first === 'object' ? Object.keys(first) : []);
    }
  }
  @Input() height: string | number = '100%';
  @Input() disabled = false;
  @Input() selectionMode: 'none' | 'single' | 'multiple' = 'none';
  @Input() selectedRowKeys: K[] = [];
  @Input() allowUpdating = false;
  @Input() searchEnabled = true;
  @Input() searchPlaceholder = 'Buscar…';
  @Input() filterEnabled = true;
  @Input() pageSize = 10;
  @Input() allowedPageSizes: (number|string)[] = [5,10,20,50,100,'all'];
  @Input() groupTemplate: TemplateRef<unknown> | null = null;
  @Output() selectionChanged = new EventEmitter<XteinGridSelectionEvent<T,K>>();
  @Output() editingStart = new EventEmitter<XteinGridEditingEvent<T,K>>();
  @Output() rowClick = new EventEmitter<XteinGridRowEvent<T,K>>();
  @Output() rowActivated = new EventEmitter<T>();
  @ViewChild(DxDataGridComponent) private grid?: DxDataGridComponent;
  cancelEditData():void {this.grid?.instance.cancelEditData();}
  async saveEditData():Promise<void> {await this.grid?.instance.saveEditData();}
  hasEditData():boolean {return this.grid?.instance.hasEditData() ?? false;}
  filter(expression:unknown[]):void {this.grid?.instance.filter(expression);}
  clearDataFilter():void {this.grid?.instance.clearFilter('dataSource');}
  async selectRows(keys:K[],preserve=true):Promise<void> {await this.grid?.instance.selectRows(keys,preserve);}
  async deselectRows(keys:K[]):Promise<void> {await this.grid?.instance.deselectRows(keys);}
  async keyDown(event:KeyDownEvent<T,K>):Promise<void> {
    if (event.event?.key !== 'Enter' || this.allowUpdating || this.disabled) return;
    const rows = await event.component.getSelectedRowsData();
    if (rows.length) this.rowActivated.emit(rows[0]);
  }
}
