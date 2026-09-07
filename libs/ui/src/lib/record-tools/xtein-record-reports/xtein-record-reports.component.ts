import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, inject, Input, OnChanges, OnDestroy, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DxPopupModule, DxTemplateModule } from 'devextreme-angular';
import { DxReportViewerModule } from 'devexpress-reporting-angular';
import { Subscription } from 'rxjs';
import { XteinButtonComponent } from '../../forms/xtein-button/xtein-button.component';
import { XteinSelectComponent } from '../../forms/xtein-select/xtein-select.component';
import { XteinRecordReportsService } from './services/xtein-record-reports.service';
import { XteinReportDefinition, XteinReportScope, XteinReportScopeOption } from './models/xtein-record-reports.model';
import { XteinRecordReportsBackend, XteinReportScopeOptions } from './constants/xtein-record-reports.constants';

@Component({
  selector: 'xtein-record-reports', standalone: true,
  imports: [FormsModule, DxPopupModule, DxTemplateModule, DxReportViewerModule, XteinButtonComponent, XteinSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './xtein-record-reports.component.html',
  styleUrl: './xtein-record-reports.component.scss'
})
export class XteinRecordReportsComponent implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input({ required: true }) applicationId = '';
  @Input({ required: true }) table = '';
  @Input() currentFilter = '';
  @Input() allFilter = '';
  @Output() readonly visibleChange = new EventEmitter<boolean>();
  readonly service = inject(XteinRecordReportsService);
  readonly reports = signal<XteinReportDefinition[]>([]);
  readonly error = signal('');
  readonly loading = signal(false);
  readonly reportUrl = signal('');
  readonly isMobile = signal(false);
  readonly viewerAction = XteinRecordReportsBackend.ViewerAction;
  scope: XteinReportScope = 'actual';
  scopeOptions: XteinReportScopeOption[] = [];
  private request?: Subscription;
  private pdfUrl?: string;

  ngOnChanges(): void {
    this.updateViewport();
    this.request?.unsubscribe();
    this.reportUrl.set('');
    if (!this.visible) return;
    this.scope = 'actual';
    this.scopeOptions = XteinReportScopeOptions.map(option => ({
      ...option,
      disabled: option.value === 'todos' && !this.allFilter.trim()
    }));
    this.error.set('');
    this.loading.set(true);
    this.reports.set([]);
    this.request = this.service.list(this.applicationId).subscribe({
      next: reports => { this.reports.set(reports); this.loading.set(false); },
      error: error => { this.error.set(error.message ?? 'No fue posible cargar los informes.'); this.loading.set(false); }
    });
  }

  open(report: XteinReportDefinition, pdf: boolean): void {
    if (this.loading()) return;
    this.error.set('');
    const filter = this.scope === 'todos' ? this.allFilter : this.currentFilter;
    if (!filter.trim()) { this.error.set('No hay un filtro válido para generar el informe.'); return; }
    try {
      const parameters = this.service.parameters(report, this.applicationId, this.table, filter);
      if (!pdf) {
        this.reportUrl.set(report.ARCHIVO + '?clid=' + parameters.clid + '&' + JSON.stringify(parameters));
        return;
      }
      this.loading.set(true);
      this.request = this.service.exportPdf(parameters).subscribe({
        next: blob => {
          if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl);
          this.pdfUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = this.pdfUrl;
          link.download = report.ARCHIVO + '.pdf';
          link.click();
          this.loading.set(false);
        },
        error: () => { this.error.set('No fue posible generar el PDF.'); this.loading.set(false); }
      });
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible generar el informe.');
    }
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
    if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl);
  }

  @HostListener('window:resize')
  updateViewport(): void {
    this.isMobile.set(typeof window !== 'undefined' && window.innerWidth <= 768);
  }
}
