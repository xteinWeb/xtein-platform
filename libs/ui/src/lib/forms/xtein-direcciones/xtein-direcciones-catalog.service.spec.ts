import { firstValueFrom, of } from 'rxjs';
import { XteinApiClientService } from '@xtein/api-client';
import { XteinDireccionesCatalogService } from './xtein-direcciones-catalog.service';
import { direccionTipos } from './xtein-direcciones.model';

describe('Address Legacy catalog contracts', () => {
  const execute = vi.fn();
  const service = new XteinDireccionesCatalogService({ execute } as unknown as XteinApiClientService);
  beforeEach(() => { execute.mockReset(); execute.mockReturnValue(of({ data: '[]' })); });
  it('loads types from ADM006 without a hardcoded fallback', async () => {
    expect(await firstValueFrom(service.types())).toEqual([]);
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ endpoint: '/ADM006/consulta', action: 'tipos direccion', data: {} }));
  });
  it('uses the city and neighborhood in dependent queries', async () => {
    await firstValueFrom(service.locations('Ciudad'));
    expect(execute).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'ubicaciones', data: { TIPO_UBICACION: 'Ciudad' } }));
    await firstValueFrom(service.locations('Barrio', 'C1'));
    expect(execute).toHaveBeenLastCalledWith(expect.objectContaining({ data: { TIPO_UBICACION: 'Barrio', CIUDAD: 'C1' } }));
    await firstValueFrom(service.locations('Dependiente', 'C1', 'B1'));
    expect(execute).toHaveBeenLastCalledWith(expect.objectContaining({ data: { TIPO_UBICACION: 'Dependiente', CIUDAD: 'C1', BARRIO: 'B1' } }));
    await firstValueFrom(service.postalCodes('C1'));
    expect(execute).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'codigos postales', data: { ID_UBICACION: 'C1' } }));
  });
  it('rejects business errors returned inside a successful HTTP response', async () => {
    execute.mockReturnValue(of({ data: JSON.stringify([{ ErrMensaje: 'Error de consulta' }]) }));
    await expect(firstValueFrom(service.types())).rejects.toThrow();
  });
  it('preserves multiple types and supports existing single and serialized values', () => {
    expect(direccionTipos(['Entrega', 'Cobro'])).toEqual(['Entrega', 'Cobro']);
    expect(direccionTipos('Entrega')).toEqual(['Entrega']);
    expect(direccionTipos('["Entrega","Cobro"]')).toEqual(['Entrega', 'Cobro']);
    expect(direccionTipos('')).toEqual([]);
  });
});
