import { firstValueFrom, of } from 'rxjs';
import { XteinApiAccessMode, XteinApiClientService } from '@xtein/api-client';
import { XteinCorreosCatalogService } from './xtein-correos-catalog.service';

describe('Email types from the Legacy catalog', () => {
  const execute = vi.fn();
  const service = new XteinCorreosCatalogService({ execute } as unknown as XteinApiClientService);

  it('requests the Legacy domain and preserves its labels and order', async () => {
    const labels = ['Pagos', 'Compras', 'Contacto/runt', 'Comercial', 'Ventas'];
    execute.mockReturnValue(of({ data: JSON.stringify(labels.map(VALOR1 => ({ VALOR1 }))) }));
    expect(await firstValueFrom(service.getTypes())).toEqual(labels);
    expect(execute).toHaveBeenCalledWith({
      endpoint: '/ADM012/consulta', action: 'ITM_DOMINIOS',
      data: { ID_DOMINIO: 'correos_usuarios', ID_GRUPO_DOMINIO: 'emails' },
      accessMode: XteinApiAccessMode.Authenticated
    });
  });

  it('does not replace an empty catalog with hardcoded types', async () => {
    execute.mockReturnValue(of({ data: '[]' }));
    expect(await firstValueFrom(service.getTypes())).toEqual([]);
  });

  it('propagates backend failures instead of presenting invented types', async () => {
    execute.mockReturnValue(of({ data: JSON.stringify([{ ErrMensaje: 'Consulta fallida' }]) }));
    await expect(firstValueFrom(service.getTypes())).rejects.toThrow();
  });
});
