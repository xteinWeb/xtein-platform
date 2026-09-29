import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionService } from '@xtein/session';
import { XTEIN_LOG_SCOPE } from '@xtein/logging';
import { Adm015BusinessService } from './adm-015-business.service';
import { Adm015Service } from './adm-015.service';
import { Adm015SavePayload } from '../models/adm-015-business.model';

describe('ADM-015 save contract', () => {
  const api = { save: vi.fn(), query: vi.fn(), checkUserExists: vi.fn() };
  let business: Adm015BusinessService;
  const payload = { USUARIOS: { USUARIO: 'TEST' }, AUTORIZACIONES: [], PERMISOS_ESPECIALES: [], UN_ASOCIADAS: [], CONEXIONES: [], SETTINGS: [] } as unknown as Adm015SavePayload;
  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [Adm015BusinessService,
      { provide: Adm015Service, useValue: api }, { provide: SessionService, useValue: { current: null } },
      { provide: XTEIN_LOG_SCOPE, useValue: {} }] });
    business = TestBed.inject(Adm015BusinessService);
  });
  it.each(['new', 'update'] as const)('uses the matching endpoint for %s', action => {
    const execute = vi.fn(() => of({ data: '[]' }));
    TestBed.runInInjectionContext(() => new Adm015Service({ execute } as never)).save(action, payload);
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ endpoint: `/ADM015/${action}`, action, data: payload }));
  });
  it('rejects a backend error delivered with HTTP success', async () => {
    api.save.mockReturnValue(of({ data: JSON.stringify([{ ErrMensaje: 'No se pudo guardar' }]) }));
    await expect(business.saveUser('update', payload)).rejects.toThrow('No se pudo guardar');
  });
  it('accepts the same explicit success acknowledgement as Legacy', async () => {
    api.save.mockReturnValue(of({ data: JSON.stringify([{ ErrMensaje: '' }]) }));
    await expect(business.saveUser('new', payload)).resolves.toBeUndefined();
  });
  it.each(['respuesta inválida', '[]', '{}', 'null'])('does not announce success for %s', data => {
    api.save.mockReturnValue(of({ data }));
    return expect(business.saveUser('new', payload)).rejects.toThrow('no confirmó');
  });
  it('reloads using JSON criteria instead of a SQL fragment', async () => {
    api.query.mockReturnValue(of({ data: '[]' }));
    await business.queryUser("O'CONNOR");
    expect(api.query).toHaveBeenCalledWith('consulta', { USUARIOS: [{ CAMPO: 'USUARIO', EXPRESION: "O'CONNOR", TABLA: 'USUARIOS' }] });
  });
  it('recognizes an existing user even when its validation includes a message', async () => {
    api.checkUserExists.mockReturnValue(of({ data: '[{"EXISTE":true,"ErrMensaje":"Usuario existente"}]' }));
    await expect(business.checkUserExists('TEST', 'new')).resolves.toBe(true);
  });
  it('does not treat a failed existence check as an available username', async () => {
    api.checkUserExists.mockReturnValue(throwError(() => new Error('Sin conexión')));
    await expect(business.checkUserExists('TEST', 'new')).rejects.toThrow('Sin conexión');
  });
  it('propagates database errors from the existence check', async () => {
    api.checkUserExists.mockReturnValue(of({ data: '[{"ErrMensaje":"Error SQL"}]' }));
    await expect(business.checkUserExists('TEST', 'new')).rejects.toThrow('Error SQL');
  });
});
