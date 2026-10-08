import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { DxTagBoxModule, DxTemplateModule } from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
import { XteinLabelComponent } from '../xtein-label/xtein-label.component';

/**
 * Standard XTEIN TagBox control based on DevExtreme TagBox.
 * Provides consistent Xtein design, clean full-width placeholder handling,
 * multi-tag display, and seamless reactive form integration.
 */
@Component({
  selector: 'xtein-tag-box',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DxTagBoxModule,
    DxTemplateModule,
    XteinLabelComponent
  ],
  templateUrl: './xtein-tag-box.component.html',
  styleUrls: ['./xtein-tag-box.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.id]': 'null',
    class: 'd-block w-100'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => XteinTagBoxComponent),
      multi: true
    }
  ]
})
export class XteinTagBoxComponent implements ControlValueAccessor {
  @Input() id = '';
  @Input() label = '';
  @Input() ariaLabel = '';
  @Input() placeholder = '';
  @Input() paginate = true;
  @Input() pageSize = 20;

  private _items: unknown[] = [];
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

  private _valueExpr = '';
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

  @Input() displayExpr = '';
  @Input() searchEnabled = true;
  @Input() searchMode: 'contains' | 'startswith' = 'contains';
  @Input() showSelectionControls = true;
  @Input() maxDisplayedTags = 5;
  @Input() showMultiTagOnly = false;
  @Input() applyValueMode: 'useButtons' | 'instantly' = 'useButtons';
  @Input() dropDownOptions: Record<string, unknown> = {};
  @Input() required = false;
  @Input() readOnly = false;
  @Input() disabled = false;
  @Input() itemTemplate?: TemplateRef<unknown>;
  @ContentChild('itemTemplate', { static: false }) contentItemTemplate?: TemplateRef<unknown>;
  @Input() invalid = false;
  @Input() errorMessage = '';

  @Output() readonly blurred = new EventEmitter<void>();
  @Output() readonly valueChange = new EventEmitter<unknown>();

  value: unknown[] = [];
  private formDisabled = false;

  private onChange: (value: unknown) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(private readonly changeDetector: ChangeDetectorRef) {}

  get isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  get hasValue(): boolean {
    if (Array.isArray(this.value)) {
      return this.value.length > 0;
    }
    return Boolean(this.value);
  }

  get inputAttributes(): Record<string, string> {
    const attributes: Record<string, string> = {};
    if (this.id) attributes['id'] = this.id;
    if (this.ariaLabel) attributes['aria-label'] = this.ariaLabel;
    if (this.required) attributes['aria-required'] = 'true';
    if (this.invalid) attributes['aria-invalid'] = 'true';
    return attributes;
  }

  writeValue(value: unknown): void {
    if (Array.isArray(value)) {
      this.value = [...value];
    } else if (value != null && value !== '') {
      this.value = [value];
    } else {
      this.value = [];
    }
    this.changeDetector.markForCheck();
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled = isDisabled;
    this.changeDetector.markForCheck();
  }

  handleValueChanged(event: { value?: unknown[] }): void {
    this.value = event.value ?? [];
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.changeDetector.markForCheck();
  }

  handleFocusOut(): void {
    this.onTouched();
    this.blurred.emit();
  }
}
