import { borradorCliente, borradorProduccion, registroGuardado, PartesPrueba } from '../testing/cal-001.fixtures';
import { borradorDesdeRegistro } from './cal-001-modelo';
import { camposProhibidos, construirPayload } from './cal-001-payload';

describe('CAL-001 JSON de guardado (contrato §2.3)', () => {
  it('new: solo REGISTRO y PARTES, sin IDs, con las partes que tienen no conformidades', () => {
    const payload = construirPayload(borradorProduccion(), 'new');
    expect(Object.keys(payload)).toEqual(['REGISTRO', 'PARTES']);
    expect(payload['REGISTRO']).toEqual({
      ORIGEN: 'PRODUCCION', PRODUCTO: 'PF-2201', CANTIDAD_REFERENCIA: 6, FECHA_EVENTO: '2026-10-26', OBSERVACION: null,
      ID_CLIENTE: null, N_SERVICIO: null, ID_AREA_DETECCION: null, FUENTE: null, FECHA_RECLAMO: null, ID_CAUSA_CLIENTE: null
    });
    expect(payload['PARTES']).toEqual([{
      ID_PARTE_NC: null, ID_PARTE: 'PA-501', ITEM_PRODUCTO_PARTE: 1, PIEZA: 'Tapa con chapilla roble',
      CAUSAS: [
        { ID_CAUSA_NC: null, ID_CAUSA: 'NC-01', OPERARIOS: [
          { ID_OPERARIO_NC: null, ID_EMPLEADO: '1001', OCURRENCIAS: 2, ID_SECCION: 'S10' },
          { ID_OPERARIO_NC: null, ID_EMPLEADO: '1002', OCURRENCIAS: 1, ID_SECCION: 'S20' }
        ] },
        { ID_CAUSA_NC: null, ID_CAUSA: 'NC-02', OPERARIOS: [{ ID_OPERARIO_NC: null, ID_EMPLEADO: '1002', OCURRENCIAS: 3, ID_SECCION: 'S20' }] }
      ]
    }]);
  });

  it('update: lleva ID_REGISTRO_NC, VERSION, MOTIVO y los IDs de las filas que siguen (merge)', () => {
    const borrador = borradorDesdeRegistro(registroGuardado({ PUEDE_MODIFICAR: 1 }), PartesPrueba);
    borrador.MOTIVO = '  Operario equivocado ';
    const payload = construirPayload(borrador, 'update');
    expect(payload['ID_REGISTRO_NC']).toBe(7);
    expect(payload['VERSION']).toBe(1);
    expect(payload['MOTIVO']).toBe('Operario equivocado');
    const partes = payload['PARTES'] as { ID_PARTE_NC: number; CAUSAS: { ID_CAUSA_NC: number; OPERARIOS: { ID_OPERARIO_NC: number }[] }[] }[];
    expect(partes).toHaveLength(1);
    expect(partes[0].ID_PARTE_NC).toBe(10);
    expect(partes[0].CAUSAS[0].ID_CAUSA_NC).toBe(20);
    expect(partes[0].CAUSAS[0].OPERARIOS[0].ID_OPERARIO_NC).toBe(30);
  });

  it('nunca envía identidad ni permisos (USUARIO, ID_UN, ES_GESTOR, PUEDE_*, RUTA, MIME)', () => {
    for (const payload of [
      construirPayload(borradorProduccion(), 'new'),
      construirPayload(borradorCliente(), 'new'),
      construirPayload(borradorDesdeRegistro(registroGuardado(), PartesPrueba), 'update')
    ]) {
      expect(camposProhibidos(payload)).toEqual([]);
    }
  });

  it('detecta campos prohibidos a cualquier profundidad', () => {
    expect(camposProhibidos({ REGISTRO: { usuario: 'x' }, PARTES: [{ CAUSAS: [{ PUEDE_CREAR: 1, Ruta: 'a' }] }] }))
      .toEqual(['usuario', 'PUEDE_CREAR', 'Ruta']);
  });

  it('ninguna causa lleva OCURRENCIAS: solo el operario (ajuste 2)', () => {
    const payload = construirPayload(borradorCliente(), 'new');
    const partes = payload['PARTES'] as { CAUSAS: Record<string, unknown>[] }[];
    for (const causa of partes.flatMap(p => p.CAUSAS)) {
      expect('OCURRENCIAS' in causa).toBe(false);
      expect(causa['OPERARIOS']).toEqual([]);
    }
  });

  it('Cliente envía los datos de la garantía; Producción los envía en null (E20)', () => {
    const cliente = construirPayload(borradorCliente(), 'new')['REGISTRO'] as Record<string, unknown>;
    expect(cliente).toMatchObject({ ORIGEN: 'CLIENTE', ID_CLIENTE: '900123', N_SERVICIO: 'SV-3307', ID_AREA_DETECCION: 'Visita al cliente',
      FUENTE: 'Visita técnica', FECHA_RECLAMO: '2026-10-15', ID_CAUSA_CLIENTE: 'RC-01' });
    const produccion = { ...borradorCliente(), ORIGEN: 'PRODUCCION' as const };
    const registro = construirPayload(produccion, 'new')['REGISTRO'] as Record<string, unknown>;
    expect([registro['ID_CLIENTE'], registro['N_SERVICIO'], registro['FUENTE'], registro['ID_CAUSA_CLIENTE']]).toEqual([null, null, null, null]);
  });
});
