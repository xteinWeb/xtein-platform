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
  @ViewChild('dataGrid') private dataGrid?: XteinDataGridComponent<T, unknown>;
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  onDropDownOpened(): void {
    queueMicrotask(() => {
      this.dataGrid?.repaint();
    });
    const focusSearch = (): boolean => {
      const content = this.editor?.instance?.content() as HTMLElement | undefined;
      const searchInput =
        content?.querySelector<HTMLInputElement>('.dx-datagrid-search-panel input, .dx-searchbox input') ||
        document.querySelector<HTMLInputElement>('.xtein-lookup-popup .dx-datagrid-search-panel input, .xtein-lookup-popup .dx-searchbox input');
      if (searchInput) {
        searchInput.focus();
        searchInput.select?.();
        return true;
      }
      return false;
    };
    setTimeout(() => {
      if (!focusSearch()) {
        setTimeout(focusSearch, 100);
      }
    }, 50);
  }

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
  @Input() searchWidth: number | string = '100%';
  @Input() items: T[] = [];
  @Input() valueExpr = '';
  @Input() displayExpr = '';
  @Input() columns: XteinGridColumn<T, unknown>[] = [];
  @Input() readOnly = false;
  @Input() disabled = false;
  @Input() required = false;
  @Input() showClearButton = false;
  @Input() dropDownWidth: string | number = 'min(600px, 95vw)';
  @Input() dropDownHeight: string | number = 300;

  private _lastWidth?: string | number;
  private _lastHeight?: string | number;
  private _cachedDropDownOptions: Record<string, unknown> = {
    width: 'min(600px, 95vw)',
    height: 300,
    hideOnParentScroll: true,
    wrapperAttr: { class: 'xtein-lookup-popup' }
  };

  get dropDownOptions(): Record<string, unknown> {
    if (this._lastWidth !== this.dropDownWidth || this._lastHeight !== this.dropDownHeight) {
      this._lastWidth = this.dropDownWidth;
      this._lastHeight = this.dropDownHeight;
      this._cachedDropDownOptions = {
        width: this.dropDownWidth,
        height: this.dropDownHeight,
        hideOnParentScroll: true,
        wrapperAttr: { class: 'xtein-lookup-popup' }
      };
    }
    return this._cachedDropDownOptions;
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
      const item = this.items.find(row => {
        const rowVal = (row as Record<string, unknown>)[this.valueExpr];
        return rowVal === key || (rowVal != null && key != null && String(rowVal).trim() === String(key).trim());
      });
      return String(item ? ((item as Record<string, unknown>)[field] ?? (item as Record<string, unknown>)['NOMBRE'] ?? key) : key);
    }).join(', ');
  }

  displayValueFormatter = (value: unknown): string => {
    if (value == null || value === '') return '';
    const displayField = this.displayExpr || this.valueExpr;

    const matchItem = (val: unknown): Record<string, unknown> | undefined => {
      return this.items?.find(it => {
        const itemVal = (it as Record<string, unknown>)[this.valueExpr];
        return itemVal === val || (itemVal != null && val != null && String(itemVal).trim() === String(val).trim());
      }) as Record<string, unknown> | undefined;
    };

    const formatItem = (val: unknown): string => {
      if (typeof val === 'object' && val !== null) {
        return String((val as Record<string, unknown>)[displayField] ?? (val as Record<string, unknown>)['NOMBRE'] ?? '');
      }
      const item = matchItem(val);
      if (item) {
        return String(item[displayField] ?? item['NOMBRE'] ?? val);
      }
      return String(val);
    };

    if (Array.isArray(value)) {
      const labels = value.map(v => formatItem(v));
      return labels.filter(Boolean).join(', ');
    }
    return formatItem(value);
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
      if (this.value != null && this.value !== '') {
        const currentVal = this.selectionMode === 'multiple' ? [...(this.value as unknown[])] : this.value;
        this.editor.instance.option('value', undefined);
        this.editor.instance.option('value', currentVal);
        this.editor.instance.repaint();
      }
    }
    this.detector.markForCheck();
  }

  writeValue(value: unknown): void {
    this.setValue(value);
    if (this.editor?.instance) {
      const val = this.selectionMode === 'multiple' ? [...(this.value as unknown[])] : this.value;
      this.editor.instance.option('value', undefined);
      this.editor.instance.option('value', val);
      this.editor.instance.repaint();
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
    this.setValue(value);
    this.change(value);
    if (this.editor?.instance) {
      this.editor.instance.option('value', undefined);
      this.editor.instance.option('value', value);
      this.editor.instance.repaint();
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
