import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges
} from '@angular/core';
import { DxPopupModule, DxTemplateModule } from 'devextreme-angular';
import type { PositionConfig } from 'devextreme/common/core/animation';
import { XteinButtonComponent } from '../../forms/xtein-button/xtein-button.component';
import { XteinExportScope } from './models/xtein-record-export.model';

/** Botón Descargar de la barra (ToolbarAction.Download), al que se ancla la ventana. */
export const XteinExportAnchorSelector = '[data-xtein-toolbar-action="download"]';

/**
 * Ventana estándar de "Exportar a Excel", con el mismo estilo y posición que la de informes
 * (xtein-record-reports): elige el registro actual o todos los consultados y emite `exported`.
 * La aplicación arma el libro con XteinExcelExportService. Ver README.md de esta carpeta.
 */
@Component({
  selector: 'xtein-record-export',
  standalone: true,
  imports: [DxPopupModule, DxTemplateModule, XteinButtonComponent],
  templateUrl: './xtein-record-export.component.html',
  styleUrl: './xtein-record-export.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinRecordExportComponent implements OnChanges {
  @Input() visible = false;
  /** Nombre de lo que se exporta (por ejemplo "Consumos"). */
  @Input() title = 'Datos';
  /** Identificación del registro actual (por ejemplo "SC100-1"). */
  @Input() current = '';
  /** Cantidad de registros de la consulta. */
  @Input() total = 0;
  /** Mientras la aplicación genera el archivo. */
  @Input() busy = false;
  @Input() anchorSelector = XteinExportAnchorSelector;
  @Output() readonly visibleChange = new EventEmitter<boolean>();
  @Output() readonly exported = new EventEmitter<XteinExportScope>();

  private readonly document = inject(DOCUMENT);
  readonly scope = signal<XteinExportScope>('actual');
  readonly isMobile = signal(false);
  readonly position = signal<PositionConfig>({ my: 'center', at: 'center' });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.scope.set('actual');
      this.updateViewport();
    }
  }

  select(scope: XteinExportScope): void {
    if (this.busy || (scope === 'todos' && this.total < 1)) return;
    this.scope.set(scope);
  }

  export(): void {
    if (this.busy) return;
    this.exported.emit(this.scope());
  }

  close(): void {
    if (this.busy) return;
    this.visibleChange.emit(false);
  }

  @HostListener('window:resize')
  updateViewport(): void {
    this.isMobile.set((this.document.defaultView?.innerWidth ?? 1024) <= 768);
    const button = this.document.querySelector<HTMLElement>(this.anchorSelector) ??
      this.document.querySelector<HTMLElement>('[data-xtein-toolbar-overflow]');
    this.position.set(button && !this.isMobile()
      ? { my: 'left top', at: 'left bottom', of: button, collision: 'fit flip', offset: '0 6' }
      : { my: 'center', at: 'center' });
  }
}
