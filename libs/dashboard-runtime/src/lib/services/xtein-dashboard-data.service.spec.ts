import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { XteinApiAccessMode, XteinApiClientService } from '@xtein/api-client';
import { SessionService } from '@xtein/session';
import { XteinDashboardDataService } from './xtein-dashboard-data.service';

describe('Dashboard backend contract', () => {
  const execute = vi.fn();
  beforeEach(() => {
    execute.mockReset();
    TestBed.configureTestingModule({ providers: [
      XteinDashboardDataService,
      { provide: XteinApiClientService, useValue: { execute } },
      { provide: SessionService, useValue: { current: { userId: 'test-user' } } }
    ] });
  });
  it('uses the original application code and the authenticated session', async () => {
    execute.mockReturnValue(of({ data: JSON.stringify([{ ErrMensaje: '', TIPO: 'KPIPANEL' }]) }));
    const definition = await firstValueFrom(TestBed.inject(XteinDashboardDataService).load('TEST-DASH-A'));
    expect(execute).toHaveBeenCalledWith({ endpoint: 'dashboard-data/consulta', action: 'DashboardType',
      data: { ID_APLICACION: 'TEST-DASH-A' }, accessMode: XteinApiAccessMode.Authenticated });
    expect(JSON.parse(definition.dashboardId)).toEqual({ dashboardId: 'TEST-DASH-A', user: 'TEST-USER',
      type: 'view', filter: [{ Field: '', Value: '' }] });
    expect(definition.dashboardType).toBe('KPIPANEL');
  });
  it('rejects backend errors instead of loading an unrelated dashboard', async () => {
    execute.mockReturnValue(of({ data: JSON.stringify([{ ErrMensaje: 'Sin acceso' }]) }));
    await expect(firstValueFrom(TestBed.inject(XteinDashboardDataService).load('TEST-DASH-A'))).rejects.toThrow('Sin acceso');
  });
  it('loads KPI choices from the backend', async () => {
    execute.mockReturnValue(of({ data: [{ ID_APLICACION: 'TEST-KPI', NOMBRE: ' KPI ' }] }));
    expect(await firstValueFrom(TestBed.inject(XteinDashboardDataService).loadKpis())).toEqual([{ value: 'TEST-KPI', text: 'KPI' }]);
  });
});
