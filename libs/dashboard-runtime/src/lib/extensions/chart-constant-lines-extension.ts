import { DashboardControl, ItemWidgetOptionEventArgs, ViewerApiExtension } from 'devexpress-dashboard';
import { CustomizeSectionsEventArgs, OptionsPanelExtension } from 'devexpress-dashboard/designer';
import { ChartItem, registerCustomProperty } from 'devexpress-dashboard/model';
import { XteinDashboardConstantLine, XteinDashboardEditorRequest } from '../models/xtein-dashboard-editor.model';

registerCustomProperty({ ownerType: ChartItem, propertyName: 'ConstantLineSettings', defaultValue: '[]', valueType: 'string' });

export function readConstantLines(value: unknown): XteinDashboardConstantLine[] {
  try { const rows: unknown = JSON.parse(String(value)); return Array.isArray(rows) ? rows.filter(row => row && typeof row === 'object' && Number.isFinite(row.key)) : []; }
  catch { return []; }
}

export class ChartConstantLinesExtension {
  readonly name = 'ChartConstantLines';
  constructor(private readonly control: DashboardControl, private readonly edit: (request: XteinDashboardEditorRequest) => void) {}
  private readonly prepare = (args: ItemWidgetOptionEventArgs): void => {
    if (!(args.dashboardItem instanceof ChartItem)) return;
    const axis = (args.options as { valueAxis?: { constantLines?: unknown[] }[] }).valueAxis?.[0];
    if (!axis) return;
    for (const line of readConstantLines(args.dashboardItem.customProperties.getValue('ConstantLineSettings'))) {
      const value = line.isBound ? args.itemData.getMeasureValue(line.measureId)?.getValue() : line.value;
      if (!Number.isFinite(Number(value))) continue;
      (axis.constantLines ??= []).push({ value, color: line.color, dashStyle: 'longDash', width: 2, label: { text: line.labelText } });
    }
  };
  private readonly customize = (args: CustomizeSectionsEventArgs): void => {
    const item = args.dashboardItem;
    if (!(item instanceof ChartItem)) return;
    args.addSection({ title: 'Constant Lines (Custom)', items: [{ dataField: 'ConstantLineSettings',
      label: { visible: false }, editorType: 'dxTextBox', editorOptions: { readOnly: true,
        buttons: [{ name: 'editLines', location: 'after', options: { text: 'Editar líneas constantes', disabled: false,
          onClick: () => this.edit({ kind: 'constant-lines', item }) } }] } }] });
  };
  start(): void {
    (this.control.findExtension('viewer-api') as ViewerApiExtension)?.on('itemWidgetOptionsPrepared', this.prepare);
    (this.control.findExtension('item-options-panel') as OptionsPanelExtension)?.on('customizeSections', this.customize);
  }
  stop(): void {
    (this.control.findExtension('viewer-api') as ViewerApiExtension)?.off('itemWidgetOptionsPrepared', this.prepare);
    (this.control.findExtension('item-options-panel') as OptionsPanelExtension)?.off('customizeSections', this.customize);
  }
}
