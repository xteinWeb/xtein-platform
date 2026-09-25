import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  signal,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { XteinPopupComponent } from '../../overlays/xtein-popup/xtein-popup.component';
import { XteinApplicationSetting } from './models/xtein-record-settings.model';
import { XteinRecordSettingsService } from './services/xtein-record-settings.service';

/**
 * Shared settings popup component for XTEIN applications.
 *
 * Automatically fetches the application settings defined in the database
 * or displays custom options provided by the caller.
 */
@Component({
  selector: 'xtein-record-settings',
  standalone: true,
  imports: [CommonModule, XteinPopupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './xtein-record-settings.component.html',
  styleUrl: './xtein-record-settings.component.scss'
})
export class XteinRecordSettingsComponent implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input({ required: true }) applicationId = '';
  @Input() title = 'Opciones de la aplicación';
  @Input() width: string | number = 'min(420px, 95vw)';
  @Input() options?: XteinApplicationSetting[];

  @Output() readonly visibleChange = new EventEmitter<boolean>();
  @Output() readonly optionSelected = new EventEmitter<XteinApplicationSetting>();

  private readonly service = inject(XteinRecordSettingsService);
  private subscription?: Subscription;

  readonly settings = signal<XteinApplicationSetting[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && this.options) {
      this.settings.set(this.options);
      return;
    }

    if (changes['visible'] && this.visible) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  load(): void {
    if (this.options && this.options.length > 0) {
      this.settings.set(this.options);
      return;
    }

    if (!this.applicationId) {
      return;
    }

    this.subscription?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.settings.set([]);

    this.subscription = this.service.loadSettings(this.applicationId).subscribe({
      next: rows => {
        this.settings.set(rows);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(
          err instanceof Error
            ? err.message
            : 'Error al cargar opciones de la aplicación.'
        );
        this.loading.set(false);
      }
    });
  }

  selectOption(option: XteinApplicationSetting): void {
    this.visibleChange.emit(false);
    this.optionSelected.emit(option);
  }

  onVisibleChange(isVisible: boolean): void {
    this.visible = isVisible;
    this.visibleChange.emit(isVisible);
  }
}
