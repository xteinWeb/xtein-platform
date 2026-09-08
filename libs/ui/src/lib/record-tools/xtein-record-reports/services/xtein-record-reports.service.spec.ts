import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { XteinApiClientService } from '@xtein/api-client';
import { SessionService } from '@xtein/session';
import { buildReportRecordFilter, XteinRecordReportsService } from './xtein-record-reports.service';
import { XTEIN_REPORTS_URL } from '../configuration/xtein-record-reports.config';

describe('Legacy report transport', () => {
  const report = { ID_REPORTE: 'RPT-1', ARCHIVO: 'origenes', NOMBRE: 'Orígenes' };
  let service: XteinRecordReportsService;
  let http: HttpTestingController;
  let execute: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    execute = vi.fn().mockReturnValue(of({ data: JSON.stringify([report]) }));
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      { provide: XTEIN_REPORTS_URL, useValue: 'https://reports.example/' },
      { provide: XteinApiClientService, useValue: { execute } },
      { provide: SessionService, useValue: { current: { companyId: 'COMPANY', userId: 'USER' } } }
    ] });
    service = TestBed.inject(XteinRecordReportsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses the existing report catalog action and application identifier', () => {
    service.list('MAD-005').subscribe(rows => expect(rows).toEqual([report]));
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/listaInformes', action: 'LISTA INFORMES', data: { ID_APLICACION: 'MAD-005' }
    }));
  });

  it('sends the reporting contract and preserves the server filter', () => {
    const parameters = service.parameters(report, 'MAD-005', 'CONFIG_ORIGEN_DATO', ' ID_ORIGEN_DATO = 12');
    service.exportPdf(parameters).subscribe();
    const request = http.expectOne('https://reports.example/api/ApiReport/ExportPDF');
    expect(request.request.responseType).toBe('blob');
    expect(request.request.body).toEqual(expect.objectContaining({
      clid: 'COMPANY', usuario: 'USER', idrpt: 'origenes',
      filtro: JSON.stringify({ FILTRO: ' ID_ORIGEN_DATO = 12' })
    }));
    expect(request.request.body.prmDatos).toBeUndefined();
    request.flush(new Blob(['pdf']));
  });

  it('generates the attachment before requesting email with the same filename', () => {
    execute.mockReturnValue(of({ data: {} }));
    const email = { ORIGEN: '', ORIGEN_EMAIL: '', DESTINO: 'Usuario',
      DESTINO_EMAIL: 'user@example.com', ASUNTO: 'Informe', NOTA: 'Nota' };
    const parameters = service.parameters(report, 'MAD-005', 'CONFIG_ORIGEN_DATO', 'ID_ORIGEN_DATO IN (1,2)');
    const completed = vi.fn();
    service.sendEmail(parameters, email, { template: 'informe.html', replacements: { nombre: 'Usuario' } })
      .subscribe(completed);
    expect(execute).not.toHaveBeenCalled();
    const pdf = http.expectOne('https://reports.example/api/ApiReport/ExportPDF');
    const body = pdf.request.body;
    expect(body.prm_email).toEqual(email);
    pdf.flush(new Blob(['pdf']));
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/generales/emailer', action: 'send', data: { datos: body }
    }));
    expect(completed).toHaveBeenCalledOnce();
  });

  it('does not request email when PDF generation fails', () => {
    const error = vi.fn();
    const email = { ORIGEN: '', ORIGEN_EMAIL: '', DESTINO: '', DESTINO_EMAIL: 'user@example.com', ASUNTO: 'Informe', NOTA: '' };
    service.sendEmail(service.parameters(report, 'MAD-005', 'CONFIG_ORIGEN_DATO', 'ID_ORIGEN_DATO = 1'), email)
      .subscribe({ error });
    http.expectOne('https://reports.example/api/ApiReport/ExportPDF')
      .flush(new Blob(['Error']), { status: 500, statusText: 'Error' });
    expect(execute).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledOnce();
  });
});

describe('Reports for consulted records', () => {
  it('includes only loaded keys, removes duplicates and escapes quoted keys', () => {
    expect(buildReportRecordFilter('APLICACIONES_ASOCIADAS', 'ID_APLICACION', ["A'B", 'C', 'C']))
      .toBe("APLICACIONES_ASOCIADAS.ID_APLICACION IN ('A''B','C')");
  });
  it('does not produce an unrestricted filter for an empty result', () => {
    expect(buildReportRecordFilter('CONFIG_ORIGEN_DATO', 'ID_ORIGEN_DATO', [])).toBe('');
  });
});
