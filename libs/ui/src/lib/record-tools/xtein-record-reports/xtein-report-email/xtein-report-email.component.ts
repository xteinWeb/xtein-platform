import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { XteinButtonComponent } from '../../../forms/xtein-button/xtein-button.component';
import { XteinInputComponent } from '../../../forms/xtein-input/xtein-input.component';
import { XteinTextareaComponent } from '../../../forms/xtein-textarea/xtein-textarea.component';
import { XteinReportEmail } from '../models/xtein-record-reports.model';

@Component({
  selector: 'xtein-report-email', standalone: true,
  imports: [ReactiveFormsModule, XteinButtonComponent, XteinInputComponent, XteinTextareaComponent],
  templateUrl: './xtein-report-email.component.html',
  styleUrl: './xtein-report-email.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinReportEmailComponent implements OnChanges, OnInit {
  @Input() defaults: Partial<XteinReportEmail> = {};
  @Input() busy = false;
  @Output() readonly send = new EventEmitter<XteinReportEmail>();
  @Output() readonly cancelled = new EventEmitter<void>();
  readonly form = new FormGroup({
    ORIGEN: new FormControl('', { nonNullable: true }),
    ORIGEN_EMAIL: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    DESTINO: new FormControl('', { nonNullable: true }),
    DESTINO_EMAIL: new FormControl('', { nonNullable: true, validators: [Validators.required, control => {
      const emails = String(control.value).split(/[,;]/).map(value => value.trim());
      return emails.every(email => email && !Validators.email(new FormControl(email))) ? null : { email: true };
    }] }),
    ASUNTO: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    NOTA: new FormControl('', { nonNullable: true })
  });

  ngOnChanges(): void {
    if (this.busy) this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
  }

  ngOnInit(): void {
    this.form.patchValue(this.defaults);
  }

  submit(): void {
    if (this.busy) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.send.emit({ ...value,
      ASUNTO: value.ASUNTO.trim(),
      DESTINO_EMAIL: value.DESTINO_EMAIL.split(/[,;]/).map(email => email.trim()).join(', ')
    });
  }
}
