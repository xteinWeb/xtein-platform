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
import { XteinButtonComponent } from '@xtein/ui';

export type Pro039ExportScope = 'actual' | 'todos';

/**
 * Exportar a Excel: misma ventana que la de informes (xtein-record-reports), anclada al botón
 * Descargar de la barra, con la elección del registro actual o de todos los consultados.
 */
@Component({
  selector: 'xtein-pro039-export',
  standalone: true,
  imports: [DxPopupModule, DxTemplateModule, XteinButtonComponent],
  templateUrl: './xtein-pro039-export.component.html',
  styleUrl: './xtein-pro039-export.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinPro039ExportComponent implements OnChanges {
  @Input() visible = false;
  /** Documento del registro actual (SC100-1). */
  @Input() current = '';
  /** Cantidad de consumos de la búsqueda. */
  @Input() total = 0;
  @Input() busy = false;
  @Output() readonly visibleChange = new EventEmitter<boolean>();
  @Output() readonly exported = new EventEmitter<Pro039ExportScope>();

  private readonly document = inject(DOCUMENT);
  readonly scope = signal<Pro039ExportScope>('actual');
  readonly isMobile = signal(false);
  readonly position = signal<PositionConfig>({ my: 'center', at: 'center' });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.scope.set('actual');
      this.updateViewport();
    }
  }

  select(scope: Pro039ExportScope): void {
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
    const button = this.document.querySelector<HTMLElement>('[data-xtein-toolbar-action="download"]') ??
      this.document.querySelector<HTMLElement>('[data-xtein-toolbar-overflow]');
    this.position.set(button && !this.isMobile()
      ? { my: 'left top', at: 'left bottom', of: button, collision: 'fit flip', offset: '0 6' }
      : { my: 'center', at: 'center' });
  }
}
