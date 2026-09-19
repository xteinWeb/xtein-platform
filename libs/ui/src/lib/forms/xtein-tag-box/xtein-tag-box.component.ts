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
  @Input() items: unknown[] = [];
  @Input() displayExpr = '';
  @Input() valueExpr = '';
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
