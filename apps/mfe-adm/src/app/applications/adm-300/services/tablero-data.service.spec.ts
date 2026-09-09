import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { XteinApiAccessMode, XteinApiClientService } from '@xtein/api-client';
import { SessionService } from '@xtein/session';
import { TableroDataService } from './tablero-data.service';

describe('Tablero Legacy API contract', () => {
  const execute = vi.fn();
  const session: { current: { userId: string } | null } = { current: { userId: 'TEST' } };
  beforeEach(() => {
    execute.mockReset();
    session.current = { userId: 'TEST' };
    TestBed.configureTestingModule({ providers: [
      { provide: XteinApiClientService, useValue: { execute } },
      { provide: SessionService, useValue: session }
    ] });
  });
  it('uses the session and Legacy action for frequent applications', async () => {
    execute.mockReturnValue(of({ data: JSON.stringify([{ ErrMensaje: '', ID_APLICACION: ' mad-002 ', NOMBRE: 'Diseñador' }]) }));
    const rows = await firstValueFrom(TestBed.inject(TableroDataService).loadApplications('frequent'));
    expect(execute).toHaveBeenCalledWith({ endpoint: 'generales/consulta', action: 'apl mas usadas',
      data: { usuario: 'TEST' }, accessMode: XteinApiAccessMode.Authenticated });
    expect(rows[0].ID_APLICACION).toBe('MAD-002');
  });
  it('preserves the uppercase user field for the available application query', async () => {
    execute.mockReturnValue(of({ data: [] }));
    await firstValueFrom(TestBed.inject(TableroDataService).loadApplications('available'));
    expect(execute.mock.calls[0][0]).toMatchObject({ action: 'consulta aplicacion', data: { USUARIO: 'TEST', opcion: 'usuario' } });
  });
  it('handles empty results and rejects backend errors', async () => {
    const service = TestBed.inject(TableroDataService);
    execute.mockReturnValue(of({ data: [{ ErrMensaje: 'No hay registros en la base de datos' }] }));
    expect(await firstValueFrom(service.loadApplications('favorites'))).toEqual([]);
    execute.mockReturnValue(of({ data: [{ ErrMensaje: 'Sin acceso' }] }));
    await expect(firstValueFrom(service.loadApplications('favorites'))).rejects.toThrow('Sin acceso');
    execute.mockReturnValue(of({ data: '{}' }));
    await expect(firstValueFrom(service.loadApplications('favorites'))).rejects.toThrow('no es válida');
  });
  it('does not make a request without a session', async () => {
    session.current = null;
    await expect(firstValueFrom(TestBed.inject(TableroDataService).loadApplications('favorites'))).rejects.toThrow('sesión');
    expect(execute).not.toHaveBeenCalled();
  });
});
