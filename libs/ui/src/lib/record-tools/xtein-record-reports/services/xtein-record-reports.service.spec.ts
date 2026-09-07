import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { XteinApiClientService } from '@xtein/api-client';
import { SessionService } from '@xtein/session';
import { XteinRecordReportsService } from './xtein-record-reports.service';
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
});
