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
  readonly searchIdentity = (item: unknown): unknown => item;
  @Input() itemTemplate: TemplateRef<any> | null = null;
  @Input() dropDownOptions: Record<string, unknown> = {};
  @Input() refreshEnabled = false;
  @Input() searchTimeout = 200;
  @Input() minSearchLength = 0;
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


  @Input()
  id = '';

  @Input()
  label = '';

  @Input()
  ariaLabel = '';

  @Input()
  placeholder = '';

  @Input()
  items: unknown[] = [];

  @Input()
  displayExpr = '';

  @Input()
  valueExpr = '';

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
