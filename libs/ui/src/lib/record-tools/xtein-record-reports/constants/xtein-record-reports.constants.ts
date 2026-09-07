import { XteinReportScopeOption } from '../models/xtein-record-reports.model';

export const XteinRecordReportsBackend = {
  ListEndpoint: '/listaInformes',
  ListAction: 'LISTA INFORMES',
  PdfEndpoint: 'api/ApiReport/ExportPDF',
  ViewerAction: 'DXXRDV'
} as const;

export const XteinReportScopeOptions: readonly XteinReportScopeOption[] = [
  { value: 'actual', label: 'Solo registro actual' },
  { value: 'todos', label: 'Todos los registros consultados' }
];
