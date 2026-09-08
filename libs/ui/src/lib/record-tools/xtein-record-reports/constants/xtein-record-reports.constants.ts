import { XteinReportScopeOption } from '../models/xtein-record-reports.model';

export const XteinRecordReportsBackend = {
  ListEndpoint: '/listaInformes',
  ListAction: 'LISTA INFORMES',
  PdfEndpoint: 'api/ApiReport/ExportPDF',
  EmailEndpoint: '/generales/emailer',
  EmailAction: 'send',
  ViewerAction: 'DXXRDV'
} as const;

export const XteinReportAnchorSelector = '[data-xtein-toolbar-action="print"]';
export const XteinReportOverflowSelector = '[data-xtein-toolbar-overflow]';

export const XteinReportScopeOptions: readonly XteinReportScopeOption[] = [
  { value: 'actual', label: 'Solo registro actual' },
  { value: 'todos', label: 'Todos los registros consultados' }
];
