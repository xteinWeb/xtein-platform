import {
  Component,
  Input,
  forwardRef,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  ViewChild,
  DestroyRef,
  NgZone,
  inject
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DxDropDownBoxComponent, DxDropDownBoxModule, DxTemplateModule, DxTextBoxModule } from 'devextreme-angular';
import type { ValueChangedEvent } from 'devextreme/ui/drop_down_box';
import { XteinDataGridComponent } from '../../data/xtein-data-grid/xtein-data-grid.component';
import { XteinGridColumn, XteinGridSelectionEvent } from '../../data/xtein-data-grid/models/xtein-data-grid.model';

@Component({
  selector: 'xtein-lookup',
  standalone: true,
  imports: [DxDropDownBoxModule, DxTemplateModule, DxTextBoxModule, XteinDataGridComponent],
  templateUrl: './xtein-lookup.component.html',
  styleUrl: './xtein-lookup.component.scss',
  host: { '[attr.id]': 'null' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => XteinLookupComponent),
      multi: true
    }
  ]
})
export class XteinLookupComponent<T extends object = Record<string, unknown>>
  implements ControlValueAccessor, OnChanges, AfterViewInit {
  @Input() autoFocus = false;
  @Input() selectionMode: 'single' | 'multiple' = 'single';
  @ViewChild(DxDropDownBoxComponent) private editor?: DxDropDownBoxComponent;
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  ngAfterViewInit(): void {
    if (this.autoFocus) queueMicrotask(() => this.focus());
    if (this.editor?.instance && this.value != null && this.selectionMode === 'multiple') {
      this.editor.instance.option('value', [...(this.value as unknown[])]);
    }
  }

  focus(): void {
    if (!this.destroyRef.destroyed && !this.isDisabled && !this.readOnly) {
      this.editor?.instance.focus();
    }
  }

  @Input() id = '';
  @Input() ariaLabel = '';
  @Input() placeholder = 'Seleccionar…';
  @Input() searchPlaceholder = 'Buscar…';
  @Input() items: T[] = [];
  @Input() valueExpr = '';
  @Input() displayExpr = '';
  @Input() columns: XteinGridColumn<T, unknown>[] = [];
  @Input() readOnly = false;
  @Input() disabled = false;
  @Input() required = false;
  @Input() showClearButton = false;
  @Input() dropDownWidth: string | number = 'min(600px, 95vw)';
  @Input() dropDownHeight: string | number = 'min(320px, 65dvh)';

  get dropDownOptions(): { width: string | number; height: string | number; hideOnParentScroll: boolean } {
    return { width: this.dropDownWidth, height: this.dropDownHeight, hideOnParentScroll: true };
  }

  value: unknown = null;
  opened = false;
  private formDisabled = false;
  private change: (value: unknown) => void = () => {};
  touched: () => void = () => {};

  constructor(private readonly detector: ChangeDetectorRef) {}

  get isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  selectedKeys: unknown[] = [];

  // Render directly from the selected keys, including while the popup is open.
  // DropDownBox's asynchronous display-value resolution is not the source of truth.
  get selectionText(): string {
    const field = this.displayExpr || this.valueExpr;
    return this.selectedKeys.map(key => {
      const item = this.items.find(row => (row as Record<string, unknown>)[this.valueExpr] === key);
      return String(item ? (item as Record<string, unknown>)[field] ?? key : key);
    }).join(', ');
  }

  displayValueFormatter = (value: unknown): string => {
    if (value == null || value === '') return '';
    const displayField = this.displayExpr || this.valueExpr;
    if (Array.isArray(value)) {
      const labels = value.map(v => {
        if (typeof v === 'object' && v !== null) {
          return (v as Record<string, unknown>)[displayField] ?? '';
        }
        const item = this.items?.find(it => (it as Record<string, unknown>)[this.valueExpr] === v);
        return item ? (item as Record<string, unknown>)[displayField] ?? v : v;
      });
      return labels.filter(Boolean).join(', ');
    }
    if (typeof value === 'object') {
      return String((value as Record<string, unknown>)[displayField] ?? '');
    }
    const item = this.items?.find(it => (it as Record<string, unknown>)[this.valueExpr] === value);
    return item ? String((item as Record<string, unknown>)[displayField] ?? value) : String(value);
  };

  private setValue(value: unknown): void {
    const extractKeys = (val: unknown): unknown[] => {
      if (!val) return [];
      if (Array.isArray(val)) {
        return val
          .map(k => (typeof k === 'object' && k !== null && this.valueExpr && this.valueExpr in k ? (k as Record<string, unknown>)[this.valueExpr] : k))
          .map(k => (typeof k === 'string' ? k.trim() : k))
          .filter(k => k != null && k !== '');
      }
      if (typeof val === 'string') {
        if (val.startsWith('[')) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return extractKeys(parsed);
          } catch { /* ignore */ }
        }
        return val.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (typeof val === 'object' && this.valueExpr && this.valueExpr in val) {
        return [(val as Record<string, unknown>)[this.valueExpr]];
      }
      return [val];
    };

    if (this.selectionMode === 'multiple') {
      const keys = extractKeys(value);
      this.value = keys;
      this.selectedKeys = [...keys];
    } else {
      this.value = value;
      this.selectedKeys = value == null || value === '' ? [] : [value];
    }
  }

  onGridSelectionChanged(event: XteinGridSelectionEvent<T, unknown>): void {
    if (this.selectionMode !== 'multiple' || this.isDisabled || this.readOnly) return;

    // Ignore programmatic events with empty selection (e.g. grid initialization or popup close/destruction)
    if (!event.selectedRowKeys || !event.selectedRowKeys.length) {
      // If the dropdown is closed or closing, definitely ignore
      if (!this.opened) return;
      // Only allow clearing if user actively deselected rows
      if (!event.currentDeselectedRowKeys?.length) return;
    }

    this.selectMultiple(event.selectedRowKeys ?? []);
  }

  selectMultiple(keys: unknown[]): void {
    if (this.selectionMode !== 'multiple' || this.isDisabled || this.readOnly) return;
    const rawKeys = Array.isArray(keys) ? [...keys] : [];
    const newKeys = rawKeys
      .map(k => (typeof k === 'object' && k !== null && this.valueExpr && this.valueExpr in k ? (k as Record<string, unknown>)[this.valueExpr] : k))
      .map(k => (typeof k === 'string' ? k.trim() : k))
      .filter(k => k != null && k !== '');

    if (!newKeys.length && !this.selectedKeys.length) {
      return;
    }

    if (newKeys.length === this.selectedKeys.length && newKeys.every(key => this.selectedKeys.includes(key))) {
      return;
    }
    this.zone.run(() => {
      this.setValue(newKeys);
      if (this.editor?.instance) {
        this.editor.instance.option('value', [...newKeys]);
      }
      this.change(this.value);
      this.touched();
      this.detector.markForCheck();
    });
  }

  clear(): void {
    if (this.isDisabled || this.readOnly) return;
    this.zone.run(() => {
      this.setValue([]);
      if (this.editor?.instance) {
        this.editor.instance.option('value', []);
      }
      this.change(this.value);
      this.touched();
      this.detector.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isDisabled || this.readOnly) this.opened = false;
    if (changes['items'] && this.editor?.instance) {
      this.editor.instance.option('items', this.items);
      if (this.value) {
        this.editor.instance.option('value', this.selectionMode === 'multiple' ? [...(this.value as unknown[])] : this.value);
      }
    }
    this.detector.markForCheck();
  }

  writeValue(value: unknown): void {
    this.setValue(value);
    if (this.editor?.instance) {
      this.editor.instance.option('value', this.selectionMode === 'multiple' ? [...(this.value as unknown[])] : this.value);
    }
    this.detector.markForCheck();
  }

  registerOnChange(callback: (value: unknown) => void): void {
    this.change = callback;
  }

  registerOnTouched(callback: () => void): void {
    this.touched = callback;
  }

  setDisabledState(value: boolean): void {
    this.formDisabled = value;
    if (value) this.opened = false;
    this.detector.markForCheck();
  }

  choose(row: T): void {
    if (this.isDisabled || this.readOnly || this.selectionMode === 'multiple') return;
    const value = (row as Record<string, unknown>)[this.valueExpr];
    if (value == null) return;
    if (value !== this.value) {
      this.setValue(value);
      this.change(value);
      if (this.editor?.instance) {
        this.editor.instance.option('value', value);
      }
    }
    this.opened = false;
    this.touched();
    this.detector.markForCheck();
  }

  changed(event: ValueChangedEvent): void {
    if (this.selectionMode === 'multiple') {
      const target = event.event?.target as HTMLElement | undefined;
      const isClearButton = target?.closest('.dx-clear-button') != null;
      if (isClearButton) {
        this.clear();
      }
      return;
    }

    if (
      event.event &&
      (event.value == null || (Array.isArray(event.value) && !event.value.length)) &&
      !this.isDisabled &&
      !this.readOnly
    ) {
      this.setValue(null);
      this.change(this.value);
      this.touched();
    }
  }
}
