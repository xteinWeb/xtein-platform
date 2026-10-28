import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, inject, Input, OnChanges, OnDestroy, Output, signal, SimpleChanges } from '@angular/core';
import { DxPopupModule, DxTemplateModule } from 'devextreme-angular';
import type { PositionConfig } from 'devextreme/common/core/animation';
import { Subscription } from 'rxjs';
import { XteinButtonComponent } from '../../forms/xtein-button/xtein-button.component';
import { XteinRecordReportsService } from './services/xtein-record-reports.service';
import { XteinReportDefinition, XteinReportScope, XteinReportPanel, XteinReportParameters, XteinReportEmail, XteinReportEmailContext } from './models/xtein-record-reports.model';
import { XteinReportAnchorSelector, XteinReportOverflowSelector } from './constants/xtein-record-reports.constants';
import { XteinReportEmailComponent } from './xtein-report-email/xtein-report-email.component';

@Component({
  selector: 'xtein-record-reports', standalone: true,
  imports: [DxPopupModule, DxTemplateModule, XteinButtonComponent, XteinReportEmailComponent],
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
  @Input() emailContext: XteinReportEmailContext = {};
  @Input() anchorSelector = XteinReportAnchorSelector;
  @Output() readonly visibleChange = new EventEmitter<boolean>();
  readonly service = inject(XteinRecordReportsService);
  private readonly document = inject(DOCUMENT);
  readonly reports = signal<XteinReportDefinition[]>([]);
  readonly error = signal('');
  readonly status = signal('');
  readonly loading = signal(false);
  readonly isMobile = signal(false);
  readonly panel = signal<XteinReportPanel>('list');
  readonly scopes = signal<Record<string, XteinReportScope>>({});
  readonly dropdownPosition = signal<PositionConfig>({ my: 'center', at: 'center' });
  readonly centerPosition: PositionConfig = { my: 'center', at: 'center' };
  emailDefaults: Partial<XteinReportEmail> = {};
  private emailParameters?: XteinReportParameters;
  private request?: Subscription;
  private pdfUrl?: string;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['visible'] && !changes['applicationId'] && !changes['table']) return;
    this.request?.unsubscribe();
    this.loading.set(false);
    this.panel.set('list');
    this.emailParameters = undefined;
    this.error.set('');
    this.status.set('');
    if (!this.visible) return;
    this.updateViewport();
    this.scopes.set({});
    this.loading.set(true);
    this.reports.set([]);
    this.request = this.service.list(this.applicationId).subscribe({
      next: reports => { this.reports.set(reports); this.loading.set(false); },
      error: () => { this.error.set('No fue posible cargar los informes.'); this.loading.set(false); }
    });
  }

  scope(report: XteinReportDefinition): XteinReportScope {
    return this.scopes()[report.ID_REPORTE] ?? 'actual';
  }

  selectScope(report: XteinReportDefinition, scope: XteinReportScope): void {
    if (this.loading() || !(scope === 'actual' ? this.currentFilter : this.allFilter).trim()) return;
    this.scopes.update(values => ({ ...values, [report.ID_REPORTE]: scope }));
  }

  private parameters(report: XteinReportDefinition): XteinReportParameters {
    const filter = this.scope(report) === 'todos' ? this.allFilter : this.currentFilter;
    if (!filter.trim()) throw new Error('No hay registros disponibles para generar el informe.');
    return this.service.parameters(report, this.applicationId, this.table, filter);
  }

  /**
   * Genera el PDF en el servidor de reportes (api/ApiReport/ExportPDF): el visor web de DevExpress de la
   * platform (25.2) no es compatible con el servidor (22.2).
   * pdf = true lo descarga; pdf = false lo abre en una pestaña nueva con el visor del navegador (ver e imprimir).
   */
  open(report: XteinReportDefinition, pdf: boolean): void {
    if (this.loading()) return;
    this.error.set('');
    this.status.set('');
    try {
      const parameters = this.parameters(report);
      // La pestaña se abre en el mismo clic (si se abre al llegar el PDF, el navegador la bloquea como emergente)
      const tab = pdf ? null : this.openLoadingTab(report);
      this.loading.set(true);
      this.request = this.service.exportPdf(parameters).subscribe({
        next: blob => {
          this.releasePdf();
          this.pdfUrl = URL.createObjectURL(blob);
          this.loading.set(false);
          if (pdf) {
            this.download(report);
            this.status.set('PDF generado.');
          } else if (tab && !tab.closed) {
            tab.location.href = this.pdfUrl;
          } else {
            this.status.set('El navegador bloqueó la pestaña nueva: se descargó el PDF.');
            this.download(report);
          }
        },
        error: () => {
          tab?.close();
          this.error.set('No fue posible generar el informe: el servidor de reportes no respondió o falló al consultar los datos.');
          this.loading.set(false);
        }
      });
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible generar el informe.');
    }
  }

  private openLoadingTab(report: XteinReportDefinition): Window | null {
    const tab = this.document.defaultView?.open('', '_blank') ?? null;
    if (!tab) return null;
    const name = report.NOMBRE.replace(/[<>&]/g, '');
    tab.document.title = name;
    tab.document.body.innerHTML = `<p style="font-family:sans-serif;margin:2rem;color:#1b506f">Generando informe ${name}… puede tardar unos segundos.</p>`;
    return tab;
  }

  private download(report: XteinReportDefinition): void {
    if (!this.pdfUrl) return;
    const link = this.document.createElement('a');
    link.href = this.pdfUrl;
    link.download = report.ARCHIVO + '.pdf';
    link.click();
  }

  /** La pestaña nueva puede seguir cargando el PDF: el enlace se libera con un margen. */
  private releasePdf(): void {
    const url = this.pdfUrl;
    this.pdfUrl = undefined;
    if (url) setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  composeEmail(report: XteinReportDefinition): void {
    if (this.loading()) return;
    this.error.set('');
    this.status.set('');
    try {
      this.emailParameters = this.parameters(report);
      this.emailDefaults = { ASUNTO: report.NOMBRE, ...this.emailContext.defaults };
      this.panel.set('email');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible preparar el correo.');
    }
  }

  sendEmail(email: XteinReportEmail): void {
    if (this.loading() || !this.emailParameters) return;
    this.loading.set(true);
    this.error.set('');
    this.request = this.service.sendEmail(this.emailParameters, email, this.emailContext).subscribe({
      next: () => {
        this.loading.set(false);
        this.back();
        // The legacy endpoint acknowledges the request before SMTP confirms delivery.
        this.status.set('Solicitud de envío recibida.');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No fue posible completar la solicitud de envío.');
      }
    });
  }

  back(): void {
    if (this.loading()) return;
    this.panel.set('list');
    this.emailParameters = undefined;
    this.error.set('');
    this.updateViewport();
  }

  close(): void {
    if (this.loading()) return;
    this.visibleChange.emit(false);
  }

  handleHiding(event: object): void {
    Object.assign(event, { cancel: this.loading() });
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
    this.releasePdf();
  }

  @HostListener('window:resize')
  updateViewport(): void {
    this.isMobile.set((this.document.defaultView?.innerWidth ?? 1024) <= 768);
    const button = this.document.querySelector<HTMLElement>(this.anchorSelector) ??
      this.document.querySelector<HTMLElement>(XteinReportOverflowSelector);
    this.dropdownPosition.set(button && !this.isMobile()
      ? { my: 'left top', at: 'left bottom', of: button, collision: 'fit flip', offset: '0 6' }
      : this.centerPosition);
  }
}
