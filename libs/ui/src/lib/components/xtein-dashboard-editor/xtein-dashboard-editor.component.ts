import { ChangeDetectionStrategy, Component, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { DxDataGridComponent, DxDataGridModule, DxPopupModule, DxSelectBoxModule } from 'devextreme-angular';
import { Subscription, defer } from 'rxjs';
import { XteinDashboardConstantLine, XteinDashboardDataService, XteinDashboardEditorRequest, XteinDashboardKpiOption, readConstantLines } from '@xtein/dashboard-runtime';
import { XteinButtonComponent } from '../../forms/xtein-button/xtein-button.component';

@Component({
  selector: 'xtein-dashboard-editor', standalone: true,
  imports: [DxDataGridModule, DxPopupModule, DxSelectBoxModule, XteinButtonComponent],
  templateUrl: './xtein-dashboard-editor.component.html', styleUrl: './xtein-dashboard-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinDashboardEditorComponent implements OnDestroy {
  @ViewChild(DxDataGridComponent) private grid?: DxDataGridComponent;
  private readonly service = inject(XteinDashboardDataService);
  private subscription?: Subscription;
  readonly request = signal<XteinDashboardEditorRequest | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly options = signal<XteinDashboardKpiOption[]>([]);
  lines: XteinDashboardConstantLine[] = [];
  measures: XteinDashboardKpiOption[] = [];
  selectedKpi = '';

  open(request: XteinDashboardEditorRequest): void {
    this.close();
    this.request.set(request);
    if (request.kind === 'constant-lines') {
      this.lines = readConstantLines(request.item.customProperties.getValue('ConstantLineSettings'));
      this.measures = request.item.hiddenMeasures().map(measure => ({ value: measure.uniqueName(), text: measure.name() || measure.dataMember() }));
    } else {
      this.selectedKpi = String(request.item.customProperties.getValue('aplicationCode') || '');
      this.reloadKpis();
    }
  }
  close(): void {
    this.subscription?.unsubscribe(); this.request.set(null); this.busy.set(false); this.error.set('');
  }
  ngOnDestroy(): void { this.close(); }
  reloadKpis(): void {
    this.subscription?.unsubscribe(); this.busy.set(true); this.error.set('');
    this.subscription = defer(() => this.service.loadKpis()).subscribe({
      next: options => { this.options.set(options); this.busy.set(false); },
      error: () => { this.error.set('No fue posible consultar los KPI.'); this.busy.set(false); }
    });
  }
  initializeLine(event: { data: Partial<XteinDashboardConstantLine> }): void {
    const key = Math.max(0, ...this.lines.map(line => line.key)) + 1;
    Object.assign(event.data, { key, name: `Constant Line${key}`, isBound: false, measureId: '', value: 0, color: '#000000', labelText: '' });
  }
  async save(): Promise<void> {
    const request = this.request();
    if (!request || this.busy()) return;
    this.error.set(''); this.busy.set(true);
    try {
      if (request.kind === 'constant-lines') {
        await this.grid?.instance.saveEditData();
        if (this.grid?.instance.hasEditData()) return;
        if (this.lines.some(line => line.isBound ? !this.measures.some(measure => measure.value === line.measureId) : !Number.isFinite(line.value))) {
          this.error.set('Cada línea debe tener un valor numérico o una medida oculta válida.'); return;
        }
        request.item.customProperties.setValue('ConstantLineSettings', JSON.stringify(this.lines));
      } else {
        if (!this.options().some(option => option.value === this.selectedKpi)) { this.error.set('Seleccione un KPI.'); return; }
        const previous = request.item.customProperties.getValue('aplicationCode');
        request.item.customProperties.setValue('aplicationCode', this.selectedKpi);
        try { await request.save(); } catch (error) { request.item.customProperties.setValue('aplicationCode', previous); throw error; }
      }
      if (this.request() === request) this.close();
    } catch { if (this.request() === request) this.error.set('No fue posible guardar los cambios.'); }
    finally { if (this.request() === request) this.busy.set(false); }
  }
}
