import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { XteinApiClientService, type XteinApiRequest } from '@xtein/api-client';
import { XTEIN_LOG_SCOPE } from '@xtein/logging';
import { Cal001Service } from '../services/cal-001.service';
import { borradorCliente, borradorProduccion, registroGuardado, OperarioPrueba, OperarioPrueba2, PartesPrueba } from '../testing/cal-001.fixtures';
import { borradorDesdeRegistro, operarioDesdeMaestro } from './cal-001-modelo';
import {
  Cal001OperacionPendiente, camposProhibidos, construirPayload, hayAlgoQueAgregar, nuevoIdOperacion, payloadAgregar, payloadFoto
} from './cal-001-payload';

/** GUID como lo genera crypto.randomUUID() (contrato §2.5). */
const Guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IdPrueba = '0f8fad5b-d9cb-469f-a165-70867728950e';

/** Claves que `agregar` nunca puede llevar (el back responde 400 o el SP E06). */
function clavesNoPermitidasEnAgregar(valor: unknown): string[] {
  const encontradas = new Set<string>();
  const recorrer = (nodo: unknown, raiz: boolean): void => {
    if (Array.isArray(nodo)) { nodo.forEach(n => recorrer(n, false)); return; }
    if (!nodo || typeof nodo !== 'object') return;
    for (const [clave, hijo] of Object.entries(nodo)) {
      if (/^ID_(PARTE|CAUSA|OPERARIO)_NC$/.test(clave) || (raiz && (clave === 'REGISTRO' || clave === 'MOTIVO'))) encontradas.add(clave);
      recorrer(hijo, false);
    }
  };
  recorrer(valor, true);
  return [...encontradas];
}

describe('CAL-001 JSON de guardado (contrato §2.3)', () => {
  it('new: ID_OPERACION, REGISTRO y PARTES, sin IDs de detalle, con las partes que tienen no conformidades', () => {
    const payload = construirPayload(borradorProduccion(), 'new', IdPrueba);
    expect(Object.keys(payload)).toEqual(['ID_OPERACION', 'REGISTRO', 'PARTES']);
    expect(payload['ID_OPERACION']).toBe(IdPrueba);
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

  it('fase 2: sin fecha del evento la clave se omite (el SP pone hoy)', () => {
    const registro = construirPayload({ ...borradorProduccion(), FECHA_EVENTO: '' }, 'new', IdPrueba)['REGISTRO'] as Record<string, unknown>;
    expect('FECHA_EVENTO' in registro).toBe(false);
  });

  it('update: lleva ID_REGISTRO_NC, VERSION, ID_OPERACION, MOTIVO y los IDs de las filas que siguen (merge)', () => {
    const borrador = borradorDesdeRegistro(registroGuardado({ PUEDE_MODIFICAR: 1 }), PartesPrueba);
    borrador.MOTIVO = '  Operario equivocado ';
    const payload = construirPayload(borrador, 'update', IdPrueba);
    expect(payload['ID_REGISTRO_NC']).toBe(7);
    expect(payload['VERSION']).toBe(1);
    expect(payload['ID_OPERACION']).toBe(IdPrueba);
    expect(payload['MOTIVO']).toBe('Operario equivocado');
    const partes = payload['PARTES'] as { ID_PARTE_NC: number; CAUSAS: { ID_CAUSA_NC: number; OPERARIOS: { ID_OPERARIO_NC: number }[] }[] }[];
    expect(partes).toHaveLength(1);
    expect(partes[0].ID_PARTE_NC).toBe(10);
    expect(partes[0].CAUSAS[0].ID_CAUSA_NC).toBe(20);
    expect(partes[0].CAUSAS[0].OPERARIOS[0].ID_OPERARIO_NC).toBe(30);
  });

  it('nunca envía identidad ni permisos (USUARIO, ID_UN, ES_GESTOR, PUEDE_*, RUTA, MIME)', () => {
    const registro = registroGuardado();
    const conAgregado = borradorDesdeRegistro(registro, PartesPrueba);
    conAgregado.PARTES[0].CAUSAS[0].OPERARIOS[0].ADICIONALES = 1;
    for (const payload of [
      construirPayload(borradorProduccion(), 'new', IdPrueba),
      construirPayload(borradorCliente(), 'new', IdPrueba),
      construirPayload(borradorDesdeRegistro(registro, PartesPrueba), 'update', IdPrueba),
      payloadAgregar(conAgregado, registro, IdPrueba),
      payloadFoto(7, 'a.jpg', 'QUJD', IdPrueba)
    ]) {
      expect(camposProhibidos(payload)).toEqual([]);
    }
  });

  it('detecta campos prohibidos a cualquier profundidad', () => {
    expect(camposProhibidos({ REGISTRO: { usuario: 'x' }, PARTES: [{ CAUSAS: [{ PUEDE_CREAR: 1, Ruta: 'a' }] }] }))
      .toEqual(['usuario', 'PUEDE_CREAR', 'Ruta']);
  });

  it('ninguna causa lleva OCURRENCIAS: solo el operario (ajuste 2)', () => {
    const payload = construirPayload(borradorCliente(), 'new', IdPrueba);
    const partes = payload['PARTES'] as { CAUSAS: Record<string, unknown>[] }[];
    for (const causa of partes.flatMap(p => p.CAUSAS)) {
      expect('OCURRENCIAS' in causa).toBe(false);
      expect(causa['OPERARIOS']).toEqual([]);
    }
  });

  it('Cliente envía los datos de la garantía; Producción los envía en null (E20)', () => {
    const cliente = construirPayload(borradorCliente(), 'new', IdPrueba)['REGISTRO'] as Record<string, unknown>;
    expect(cliente).toMatchObject({ ORIGEN: 'CLIENTE', ID_CLIENTE: '900123', N_SERVICIO: 'SV-3307', ID_AREA_DETECCION: 'Visita al cliente',
      FUENTE: 'Visita técnica', FECHA_RECLAMO: '2026-10-15', ID_CAUSA_CLIENTE: 'RC-01' });
    const produccion = { ...borradorCliente(), ORIGEN: 'PRODUCCION' as const };
    const registro = construirPayload(produccion, 'new', IdPrueba)['REGISTRO'] as Record<string, unknown>;
    expect([registro['ID_CLIENTE'], registro['N_SERVICIO'], registro['FUENTE'], registro['ID_CAUSA_CLIENTE']]).toEqual([null, null, null, null]);
  });
});

describe('CAL-001 acción agregar: solo el delta (contrato §2.3, "Acción agregar")', () => {
  it('sin nada nuevo el delta está vacío', () => {
    const registro = registroGuardado({ PUEDE_AGREGAR: 1 });
    const borrador = borradorDesdeRegistro(registro, PartesPrueba);
    expect(payloadAgregar(borrador, registro, IdPrueba).PARTES).toEqual([]);
    expect(hayAlgoQueAgregar(borrador, registro)).toBe(false);
    // Bajar ocurrencias o quitar lo guardado no se puede expresar: tampoco produce delta.
    borrador.PARTES[0].CAUSAS[0].OPERARIOS[0].OCURRENCIAS = 1;
    expect(hayAlgoQueAgregar(borrador, registro)).toBe(false);
    borrador.PARTES[0].CAUSAS = [];
    expect(hayAlgoQueAgregar(borrador, registro)).toBe(false);
  });

  it('envía partes nuevas, causas nuevas, operarios nuevos y ocurrencias adicionales, sin ID_*_NC, REGISTRO ni MOTIVO', () => {
    const registro = registroGuardado({ PUEDE_AGREGAR: 1 });
    const borrador = borradorDesdeRegistro(registro, PartesPrueba);
    borrador.MOTIVO = 'no debe viajar';
    const [tapa, frente] = borrador.PARTES;
    tapa.CAUSAS[0].OPERARIOS[0].ADICIONALES = 2;
    tapa.CAUSAS[0].OPERARIOS.push({ ...operarioDesdeMaestro(OperarioPrueba2), OCURRENCIAS: 1 });
    tapa.CAUSAS.push({ ID_CAUSA_NC: null, ID_CAUSA: 'NC-03', NOMBRE: 'Mal acabado', DESCRIPCION: '',
      OPERARIOS: [operarioDesdeMaestro(OperarioPrueba)] });
    frente.CAUSAS = [{ ID_CAUSA_NC: null, ID_CAUSA: 'NC-02', NOMBRE: 'Arenilla', DESCRIPCION: '',
      OPERARIOS: [{ ...operarioDesdeMaestro(OperarioPrueba2), OCURRENCIAS: 3 }] }];

    const payload = payloadAgregar(borrador, registro, IdPrueba);
    expect(Object.keys(payload)).toEqual(['ID_REGISTRO_NC', 'VERSION', 'ID_OPERACION', 'PARTES']);
    expect(payload).toEqual({
      ID_REGISTRO_NC: 7, VERSION: 1, ID_OPERACION: IdPrueba,
      PARTES: [
        { ID_PARTE: 'PA-501', ITEM_PRODUCTO_PARTE: 1, CAUSAS: [
          { ID_CAUSA: 'NC-01', OPERARIOS: [{ ID_EMPLEADO: '1001', OCURRENCIAS: 2 }, { ID_EMPLEADO: '1002', OCURRENCIAS: 1, ID_SECCION: 'S20' }] },
          { ID_CAUSA: 'NC-03', OPERARIOS: [{ ID_EMPLEADO: '1001', OCURRENCIAS: 1, ID_SECCION: 'S10' }] }
        ] },
        { ID_PARTE: 'PA-504', ITEM_PRODUCTO_PARTE: 2, PIEZA: null, CAUSAS: [
          { ID_CAUSA: 'NC-02', OPERARIOS: [{ ID_EMPLEADO: '1002', OCURRENCIAS: 3, ID_SECCION: 'S20' }] }
        ] }
      ]
    });
    expect(clavesNoPermitidasEnAgregar(payload)).toEqual([]);
    expect(hayAlgoQueAgregar(borrador, registro)).toBe(true);
  });

  it('una causa guardada sin nada nuevo no viaja; las ocurrencias adicionales vacías o en 0 no cuentan', () => {
    const registro = registroGuardado({ PUEDE_AGREGAR: 1 });
    const borrador = borradorDesdeRegistro(registro, PartesPrueba);
    borrador.PARTES[0].CAUSAS[0].OPERARIOS[0].ADICIONALES = 0;
    expect(payloadAgregar(borrador, registro, IdPrueba).PARTES).toEqual([]);
    borrador.PARTES[0].CAUSAS[0].OPERARIOS[0].ADICIONALES = null;
    expect(payloadAgregar(borrador, registro, IdPrueba).PARTES).toEqual([]);
  });

  it('"Producto completo" guardado se identifica por su pieza', () => {
    const registro = registroGuardado({ PUEDE_AGREGAR: 1 });
    registro.PARTES = [{ ID_PARTE_NC: 11, ITEM: 1, ID_PARTE: null, ITEM_PRODUCTO_PARTE: null, NOMBRE_PARTE: null, PIEZA: 'Cajón',
      CAUSAS: [{ ID_CAUSA_NC: 21, ID_CAUSA: 'NC-02', NOMBRE: 'Arenilla', DESCRIPCION: 'Arenilla', OPERARIOS: [] }] }];
    const borrador = borradorDesdeRegistro(registro, { PRODUCTO: 'PF-2201', SIN_PARTES: 1, PARTES: [] });
    borrador.PARTES[0].CAUSAS.push({ ID_CAUSA_NC: null, ID_CAUSA: 'NC-01', NOMBRE: 'Grado', DESCRIPCION: '', OPERARIOS: [operarioDesdeMaestro(OperarioPrueba)] });
    expect(payloadAgregar(borrador, registro, IdPrueba).PARTES).toEqual([{ ID_PARTE: null, ITEM_PRODUCTO_PARTE: null, PIEZA: 'Cajón',
      CAUSAS: [{ ID_CAUSA: 'NC-01', OPERARIOS: [{ ID_EMPLEADO: '1001', OCURRENCIAS: 1, ID_SECCION: 'S10' }] }] }]);
  });
});

describe('CAL-001 ID_OPERACION (contrato §2.5)', () => {
  it('nuevoIdOperacion genera GUIDs distintos', () => {
    const a = nuevoIdOperacion();
    expect(a).toMatch(Guid);
    expect(nuevoIdOperacion()).not.toBe(a);
  });

  it('Cal001OperacionPendiente: el reintento de lo mismo reutiliza el ID; tras éxito o con otro contenido, ID nuevo', () => {
    const operacion = new Cal001OperacionPendiente();
    const primero = operacion.para('new', { A: 1 });
    expect(primero).toMatch(Guid);
    expect(operacion.para('new', { A: 1 })).toBe(primero);
    const cambiado = operacion.para('new', { A: 2 });
    expect(cambiado).not.toBe(primero);
    operacion.confirmar();
    expect(operacion.para('new', { A: 2 })).not.toBe(cambiado);
  });

  describe('por Cal001Service: todo new, update, agregar y foto agregar lleva ID_OPERACION con forma de GUID', () => {
    let peticiones: XteinApiRequest[];
    let fallar: boolean;
    let servicio: Cal001Service;

    beforeEach(() => {
      peticiones = [];
      fallar = false;
      TestBed.configureTestingModule({ providers: [Cal001Service,
        { provide: XTEIN_LOG_SCOPE, useValue: { ID_APLICACION: 'CAL-001', MICROFRONTEND_ID: 'MFE-CAL' } },
        { provide: XteinApiClientService, useValue: { execute: (r: XteinApiRequest) => {
          peticiones.push(r);
          if (fallar) return throwError(() => ({ status: 0, error: null }));
          return of({ data: '[{"ErrMensaje":"","ID_REGISTRO_NC":7,"ID_FOTO_NC":5,"DOCUMENTO":"NC-0007","VERSION":2,"REPETIDA":0}]' });
        } } }] });
      servicio = TestBed.inject(Cal001Service);
    });

    const idEnviado = (indice: number): unknown => (peticiones[indice].data as Record<string, unknown>)['ID_OPERACION'];

    it('cada payload sale con ID_OPERACION GUID', async () => {
      const registro = registroGuardado({ PUEDE_AGREGAR: 1 });
      const conAgregado = borradorDesdeRegistro(registro, PartesPrueba);
      conAgregado.PARTES[0].CAUSAS[0].OPERARIOS[0].ADICIONALES = 1;
      await servicio.guardar(borradorProduccion());
      await servicio.guardar(borradorDesdeRegistro(registro, PartesPrueba));
      await servicio.agregar(conAgregado, registro);
      await servicio.subirFoto(7, 'a.jpg', 'QUJD', nuevoIdOperacion());
      expect(peticiones.map(p => p.action)).toEqual(['new', 'update', 'agregar', 'foto agregar']);
      for (let i = 0; i < peticiones.length; i++) expect(idEnviado(i)).toMatch(Guid);
      expect(new Set(peticiones.map((_, i) => idEnviado(i))).size).toBe(4);
    });

    it('un reintento de la misma operación tras fallar la red reenvía el mismo ID; tras el éxito, el siguiente es otro', async () => {
      const borrador = borradorProduccion();
      fallar = true;
      await expect(servicio.guardar(borrador)).rejects.toBeTruthy();
      fallar = false;
      await servicio.guardar(borrador);
      expect(idEnviado(1)).toBe(idEnviado(0));
      await servicio.guardar(borrador);
      expect(idEnviado(2)).toMatch(Guid);
      expect(idEnviado(2)).not.toBe(idEnviado(1));
    });

    it('si el usuario cambia el borrador antes de reintentar, va un ID nuevo', async () => {
      fallar = true;
      await expect(servicio.guardar(borradorProduccion())).rejects.toBeTruthy();
      fallar = false;
      await servicio.guardar({ ...borradorProduccion(), OBSERVACION: 'Otra cosa' });
      expect(idEnviado(1)).not.toBe(idEnviado(0));
    });

    it('agregar: el reintento reutiliza el ID y REPETIDA no rompe el resultado', async () => {
      const registro = registroGuardado({ PUEDE_AGREGAR: 1 });
      const borrador = borradorDesdeRegistro(registro, PartesPrueba);
      borrador.PARTES[0].CAUSAS[0].OPERARIOS[0].ADICIONALES = 1;
      fallar = true;
      await expect(servicio.agregar(borrador, registro)).rejects.toBeTruthy();
      fallar = false;
      const resultado = await servicio.agregar(borrador, registro);
      expect(idEnviado(1)).toBe(idEnviado(0));
      expect(resultado).toMatchObject({ DOCUMENTO: 'NC-0007', VERSION: 2 });
      expect(clavesNoPermitidasEnAgregar(peticiones[1].data)).toEqual([]);
    });
  });
});
