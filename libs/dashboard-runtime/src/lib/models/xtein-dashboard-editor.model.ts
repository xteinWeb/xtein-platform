import { CardItem, ChartItem } from 'devexpress-dashboard/model';

export interface XteinDashboardConstantLine {
  key: number;
  name: string;
  isBound: boolean;
  measureId: string;
  value: number;
  color: string;
  labelText: string;
}

export type XteinDashboardEditorRequest =
  | { kind: 'constant-lines'; item: ChartItem }
  | { kind: 'kpi'; item: CardItem; save: () => Promise<void> };

export interface XteinDashboardKpiOption {
  value: string;
  text: string;
}
