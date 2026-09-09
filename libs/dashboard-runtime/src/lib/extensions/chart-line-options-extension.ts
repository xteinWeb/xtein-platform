import { DashboardControl, ItemWidgetOptionEventArgs, ViewerApiExtension } from 'devexpress-dashboard';
import { BindingPanelExtension, CustomizeDataItemContainerSectionsEventArgs } from 'devexpress-dashboard/designer';
import { SimpleSeries, registerCustomProperty } from 'devexpress-dashboard/model';
import { ChartSeries } from 'devextreme/viz/common';

registerCustomProperty({ ownerType: SimpleSeries, propertyName: 'DashStyleProperty', defaultValue: 'solid', valueType: 'string' });

export class ChartLineOptionsExtension {
  readonly name = 'ChartLineOptions';
  constructor(private readonly control: DashboardControl) {}
  private readonly prepare = (args: ItemWidgetOptionEventArgs): void => {
    const itemType = args.dashboardItem.itemType();
    if (itemType !== 'Chart' && itemType !== 'Pie') return;
    const options = args.options as { series?: ChartSeries[] };
    for (const option of options.series || []) {
      if (option.type !== 'line') continue;
      const series = args.chartContext?.getDashboardItemSeries(option);
      const style = series?.customProperties.getValue('DashStyleProperty');
      if (style === 'dash' || style === 'dot' || style === 'longDash' || style === 'solid') option.dashStyle = style;
      // Legacy persisted this value although DevExtreme omits it from DashStyle's type union.
      if (style === 'dashdot') Object.assign(option, { dashStyle: 'dashdot' });
    }
    const tooltipOptions = args.options as { tooltip?: { customizeTooltip?: (argument: { seriesName?: string; value?: number; valueText?: string }) => { html?: string; text?: string } } };
    const base = tooltipOptions.tooltip?.customizeTooltip;
    if (!base) return;
    tooltipOptions.tooltip = { ...tooltipOptions.tooltip, customizeTooltip: argument => {
      const original = base(argument);
      if (itemType === 'Pie') return { text: original.text || 'Sin serie' };
      const parsed = new DOMParser().parseFromString(original.html || '', 'text/html');
      const series = parsed.querySelector('.dx-argument-value')?.textContent || 'Sin serie';
      const value = argument.value ?? Number(argument.valueText);
      return { text: `${series}, ${argument.seriesName || ''}\n${Number.isFinite(value) ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value) : argument.valueText || ''}` };
    } };
  };
  private readonly customize = (args: CustomizeDataItemContainerSectionsEventArgs): void => {
    const series = args.dataItemContainer;
    if (!(series instanceof SimpleSeries) || !['Line', 'FullStackedLine', 'StackedLine', 'StepLine', 'Spline'].includes(series.seriesType())) return;
    args.addSection({ title: 'Line Options (Custom)', items: [{ dataField: 'DashStyleProperty', editorType: 'dxSelectBox',
      label: { text: 'Dash style' }, editorOptions: { items: ['dash', 'dot', 'longDash', 'solid', 'dashdot'] } }] });
  };
  start(): void {
    (this.control.findExtension('viewer-api') as ViewerApiExtension)?.on('itemWidgetOptionsPrepared', this.prepare);
    (this.control.findExtension('item-binding-panel') as BindingPanelExtension)?.on('customizeDataItemContainerSections', this.customize);
  }
  stop(): void {
    (this.control.findExtension('viewer-api') as ViewerApiExtension)?.off('itemWidgetOptionsPrepared', this.prepare);
    (this.control.findExtension('item-binding-panel') as BindingPanelExtension)?.off('customizeDataItemContainerSections', this.customize);
  }
}
