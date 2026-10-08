import { NgTemplateOutlet } from '@angular/common';
import { XteinLabelComponent } from '../xtein-label/xtein-label.component';
import {
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output, TemplateRef
} from '@angular/core';

import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

import {
  DxSelectBoxComponent, DxSelectBoxModule, DxTemplateModule, DxButtonModule
} from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';

import type {
  ValueChangedEvent
} from 'devextreme/ui/select_box';

/**
 * Standard XTEIN select control based on DevExtreme SelectBox.
 *
 * Visual appearance is provided exclusively by the global
 * XTEIN theme.
 */
@Component({
  selector: 'xtein-select',
  standalone: true,

  imports: [XteinLabelComponent,
    DxSelectBoxModule, DxTemplateModule, DxButtonModule, NgTemplateOutlet
  ],

  templateUrl:
    './xtein-select.component.html',

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  host: {
    '[attr.id]': 'null',
    class: 'd-block w-100'
  },

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting:
        forwardRef(() => XteinSelectComponent),
      multi: true
    }
  ]
})
export class XteinSelectComponent
  implements ControlValueAccessor {
  @Input() searchExpr: string | string[] = '';
  @Input() columns?: string[];
  @Input() columnWidths?: (string | number)[];
  readonly searchIdentity = (item: unknown): unknown => item;
  @Input() itemTemplate: TemplateRef<any> | null = null;
  @Input() dropDownOptions: Record<string, unknown> = {};
  @Input() refreshEnabled = false;
  @Input() searchTimeout = 200;
  @Input() minSearchLength = 0;
  @Input() paginate = true;
  @Input() pageSize = 20;
  @Output() readonly refreshRequested = new EventEmitter<void>();

  private readonly refreshToolbar = [{
    widget: 'dxButton',
    location: 'after',
    toolbar: 'top',
    options: {
      icon: 'refresh',
      stylingMode: 'text',
      type: 'normal',
      hint: 'Actualizar lista',
      elementAttr: { class: 'xtein-select-refresh-btn' },
      onClick: () => this.refreshRequested.emit()
    }
  }];

  private lastPopupOptions?: Record<string, unknown>;
  private lastRefreshEnabled?: boolean;
  private popupOptions: Record<string, unknown> = {};

  get resolvedDropDownOptions(): Record<string, unknown> {
    if (this.lastPopupOptions !== this.dropDownOptions || this.lastRefreshEnabled !== this.refreshEnabled) {
      this.lastPopupOptions = this.dropDownOptions;
      this.lastRefreshEnabled = this.refreshEnabled;
      this.popupOptions = this.refreshEnabled ? { ...this.dropDownOptions, toolbarItems: this.refreshToolbar } : this.dropDownOptions;
    }
    return this.popupOptions;
  }

  get resolvedSearchExpr(): string | string[] | ((item: unknown) => unknown) {
    if (this.searchExpr) {
      return this.searchExpr;
    }
    if (this.columns && this.columns.length > 0) {
      return this.columns;
    }
    if (this.displayExpr) {
      return this.displayExpr;
    }
    return this.searchIdentity;
  }

  getColumnWidth(index: number): string {
    if (this.columnWidths && this.columnWidths[index] !== undefined) {
      const w = this.columnWidths[index];
      return typeof w === 'number' ? `${w}px` : String(w);
    }
    if (index === 0 && (this.columns?.length ?? 0) > 1) {
      return '120px';
    }
    return 'auto';
  }

  @Input()
  id = '';

  @Input()
  label = '';

  @Input()
  ariaLabel = '';

  @Input()
  placeholder = '';

  private _items: unknown[] = [];
  private _valueExpr = '';
  private _dataSource: any = [];

  get dataSource(): any {
    return this._dataSource;
  }

  @Input()
  set dataSource(val: unknown) {
    this.items = val;
  }

  @Input()
  set items(val: unknown) {
    if (val instanceof DataSource) {
      this._dataSource = val;
      this._items = [];
    } else {
      this._items = Array.isArray(val) ? val : [];
      this.updateDataSource();
    }
  }
  get items(): unknown[] {
    return this._items;
  }

  @Input()
  displayExpr = '';

  @Input()
  set valueExpr(val: string) {
    this._valueExpr = val || '';
    this.updateDataSource();
  }
  get valueExpr(): string {
    return this._valueExpr;
  }

  private updateDataSource(): void {
    if (this._items && this._items.length > 0) {
      if (this.paginate) {
        const isObjectArray = typeof this._items[0] === 'object' && this._items[0] !== null;
        const key = (isObjectArray && this._valueExpr) ? this._valueExpr : undefined;
        this._dataSource = new DataSource({
          store: {
            type: 'array',
            data: this._items,
            key: key
          },
          paginate: true,
          pageSize: this.pageSize
        });
      } else {
        this._dataSource = this._items;
      }
    } else {
      this._dataSource = [];
    }
    this.changeDetector?.markForCheck();
  }

  @Input()
  searchEnabled = false;

  @Input()
  searchMode: 'contains' | 'startswith' = 'contains';

  @Input()
  acceptCustomValue = false;

  @Output()
  readonly customItemCreating = new EventEmitter<any>();

  @ViewChild(DxSelectBoxComponent) private editor?: DxSelectBoxComponent;

  focus(): void {
    this.editor?.instance.focus();
  }

  @Input()
  showClearButton = false;

  @Input()
  noDataText = 'Sin datos';

  @Input()
  required = false;

  @Input()
  readOnly = false;

  @Input()
  disabled = false;

  @Input()
  invalid = false;

  @Input()
  errorMessage = '';

  @Output()
  readonly blurred =
    new EventEmitter<void>();

  value: unknown = null;

  private formDisabled = false;

  private onChange:
    (value: unknown) => void =
      () => undefined;

  private onTouched:
    () => void =
      () => undefined;

  constructor(
    private readonly changeDetector:
      ChangeDetectorRef
  ) {
  }

  get isDisabled(): boolean {
    return (
      this.disabled ||
      this.formDisabled
    );
  }

  get inputAttributes():
    Record<string, string> {

    const attributes:
      Record<string, string> = {};

    if (this.id) {
      attributes['id'] =
        this.id;
    }

    if (this.ariaLabel) {
      attributes['aria-label'] =
        this.ariaLabel;
    }

    if (this.required) {
      attributes['aria-required'] =
        'true';
    }

    if (this.invalid) {
      attributes['aria-invalid'] =
        'true';
    }

    return attributes;
  }

  writeValue(
    value: unknown
  ): void {

    this.value =
      value ?? null;

    this.changeDetector
      .markForCheck();
  }

  registerOnChange(
    callback: (value: unknown) => void
  ): void {

    this.onChange =
      callback;
  }

  registerOnTouched(
    callback: () => void
  ): void {

    this.onTouched =
      callback;
  }

  setDisabledState(
    isDisabled: boolean
  ): void {

    this.formDisabled =
      isDisabled;

    this.changeDetector
      .markForCheck();
  }

  handleValueChanged(
    event: ValueChangedEvent
  ): void {

    this.value =
      event.value ?? null;

    this.onChange(
      this.value
    );
  }

  handleCustomItemCreating(event: any): void {
    if (this.customItemCreating.observed) {
      this.customItemCreating.emit(event);
    } else {
      event.customItem = event.text;
    }
  }

  handleFocusOut(): void {

    this.onTouched();
    this.blurred.emit();
  }
}
